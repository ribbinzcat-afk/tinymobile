// ===== TinyMobile — perf.js =====
// content-visibility sweep สำหรับข้อความนอกจอ + hint การโหลดรูปอวตาร
// deps: store.js เท่านั้น (ไม่ import จาก css.js — คลาส "tinymobile-cv" เป็นสัญญาระหว่างสองไฟล์นี้
// ผ่านชื่อคลาสตรงๆ เท่านั้น ไม่ผูก import กัน)

import { getSettings, matchesApplyOn } from "./store.js";

const CV_CLASS = "tinymobile-cv";

/** เพดานเวลารอ requestIdleCallback ก่อนยอมสวีปทันที — ดูเหตุผลใน runSweepOnce() */
const IDLE_DEADLINE_MS = 400;

let paused = false;       // true ระหว่างกำลังเจน (GENERATION_STARTED..ENDED) — งดสวีปกันชนกับ stream
let sweepTimer = null;
let resizeTimer = null;

function chatEl() {
    return document.getElementById("chat");
}

/**
 * ตัดสิทธิ์ข้อความที่ "ห้าม" ใส่ content-visibility ตอนนี้:
 * - .last_mes: อาจกำลังโดน stream ต่อ (แม้ generating จะจบไปแล้วก็ยังเป็นเป้าของ swipe/continue ถัดไป)
 * - กำลังแก้ไข (.edit_textarea) หรือแก้ reasoning (.reasoning_edit_textarea) อยู่ — DOM ถูกแทนที่ด้วย
 *   <textarea> ชั่วคราว วัด offsetHeight ตอนนี้จะได้ค่าของกล่องแก้ไข ไม่ใช่เนื้อจริง
 */
function isEligible(mesEl) {
    if (mesEl.classList.contains("last_mes")) return false;
    if (mesEl.querySelector(".edit_textarea, .reasoning_edit_textarea")) return false;
    return true;
}

function unsweepEl(mesEl) {
    if (!mesEl) return;
    mesEl.classList.remove(CV_CLASS);
    mesEl.style.removeProperty("contain-intrinsic-size");
}

/** ถอด content-visibility ออกจากข้อความหนึ่งข้อความ (เรียกก่อนเนื้อหาจะเปลี่ยน เช่น สไวป์/แก้/แปล)
 * ต้องเรียกก่อน sweepAll() รอบถัดไปเสมอ ไม่งั้น sweepAll() จะข้ามเพราะเห็นว่ามีคลาสอยู่แล้ว
 * (ถ้าไม่ถอดก่อน จะไปวัด offsetHeight ของ element ที่ยังอยู่ในสถานะ content-visibility:auto ซึ่ง
 * เบราว์เซอร์อาจยังไม่คำนวณ layout จริงให้ — ได้ความสูงเก่า/ผิดค้างอยู่) */
export function unsweepByMesId(mesId) {
    const el = chatEl()?.querySelector(`.mes[mesid="${mesId}"]`);
    unsweepEl(el);
}

/** ถอดทั้งหมด — ใช้ตอนปิดสวิตช์ฟีเจอร์นี้/ปิด extension ต้องคืนสภาพ DOM ให้สนิท */
export function clearAll() {
    const list = document.querySelectorAll(`.${CV_CLASS}`);
    list.forEach((el) => unsweepEl(el));
}

/** สวีปจริง — วัดความสูงแล้วใส่คลาสให้ข้อความที่ยังไม่มีคลาสและมีสิทธิ์ (ข้อความที่มีคลาสอยู่แล้วจะถูก
 * ข้าม "โดยตั้งใจ" ไม่วัดซ้ำ — ถ้าเนื้อหาเปลี่ยน ผู้เรียกต้อง unsweepByMesId() ก่อนเสมอ ดูคอมเมนต์ด้านบน) */
function sweepAll() {
    const settings = getSettings();
    if (!settings.enabled || !settings.perfContentVisibility) return;
    if (!matchesApplyOn(settings)) return; // จอไม่เข้าเงื่อนไข applyOn — CSS ก็ไม่ได้ผลด้วย ไม่ต้องเสียเวลาวัด
    const chat = chatEl();
    if (!chat) return;

    const targets = [];
    for (const el of chat.querySelectorAll(".mes")) {
        if (!isEligible(el)) {
            if (el.classList.contains(CV_CLASS)) unsweepEl(el); // เพิ่งกลายเป็นไม่มีสิทธิ์ (เช่น เปิดแก้ไข)
            continue;
        }
        if (el.classList.contains(CV_CLASS)) continue; // สวีปแล้ว ไม่วัดซ้ำ
        targets.push(el);
    }
    if (!targets.length) return;

    // อ่านความสูง "ทั้งชุดก่อน" แล้วค่อยเขียน "ทั้งชุด" — ห้ามสลับอ่าน/เขียนในลูปเดียวกัน เพราะการเขียน
    // contain-intrinsic-size + คลาสที่ตั้ง content-visibility ทำให้ layout เป็นโมฆะ พอวนไปอ่าน
    // offsetHeight ของตัวถัดไป เบราว์เซอร์ต้อง re-layout ใหม่ทันที (forced synchronous layout) =
    // จ่าย layout 1 รอบต่อ 1 ข้อความ ซึ่งบนแชท 100 ข้อความคือค่าใช้จ่ายที่ฟีเจอร์นี้ตั้งใจจะกำจัด
    const heights = targets.map((el) => el.offsetHeight);
    targets.forEach((el, i) => {
        const h = heights[i];
        if (h > 0) {
            el.style.containIntrinsicSize = `auto ${h}px`;
            el.classList.add(CV_CLASS);
        }
    });
}

/**
 * requestIdleCallback "มีอยู่จริงแต่ไม่ยิง" ในเบราว์เซอร์มือถือเป้าหมาย — วัดแล้ว: รอ 2.5 วินาที
 * callback ไม่ถูกเรียกเลยแม้ตั้ง { timeout: 1000 } ทั้งที่สเปกระบุว่า timeout ต้องบังคับให้ยิง
 * (พิสูจน์ชี้ขาดโดย stub rIC ให้เรียกทันที → สวีปได้ 18/19; ใช้ rIC จริง → 0)
 *
 * มือถือคือกรณีที่หน้าเว็บ busy ที่สุด = โอกาสไม่เข้าสถานะ idle สูงที่สุด จึงห้ามพึ่ง rIC เพียงลำพัง
 * แข่งมันกับ setTimeout แล้วใครถึงก่อนชนะ — ได้ประโยชน์ของ idle เมื่อเบราว์เซอร์ให้ และมีเพดานเวลา
 * รับประกันเมื่อไม่ให้ (`done` กันไม่ให้สวีปซ้ำเมื่อทั้งคู่มาถึงในที่สุด)
 */
function runSweepOnce() {
    let done = false;
    const run = () => {
        if (done) return;
        done = true;
        sweepAll();
    };
    if (typeof requestIdleCallback === "function") {
        requestIdleCallback(run, { timeout: IDLE_DEADLINE_MS });
    }
    setTimeout(run, IDLE_DEADLINE_MS);
}

/** ตั้งเวลาสวีปแบบ debounce — รวมเหตุการณ์ที่มาถี่ๆ (โหลดข้อความเก่าหลายสิบข้อความรวด) ให้วัดครั้งเดียว */
export function scheduleSweep(delayMs = 150) {
    if (paused) return;
    clearTimeout(sweepTimer);
    sweepTimer = setTimeout(runSweepOnce, delayMs);
}

/** ระหว่างเจน (GENERATION_STARTED..ENDED) พักสวีปทั้งหมด — ข้อความล่าสุดกำลังเปลี่ยนความสูงถี่ๆ
 * อยู่แล้ว การสวีปข้อความอื่นพร้อมกันจะแย่ง layout thrash ในจังหวะที่ต้องการรอบ paint ให้ stream */
export function onGenerationStarted() {
    paused = true;
    clearTimeout(sweepTimer);
}
export function onGenerationEnded() {
    paused = false;
    scheduleSweep(200);
}

/** ตั้ง decoding/loading hint ให้ <img> อวตารในข้อความ — core ไม่ได้ตั้งให้ (เช็คแล้ว: ไม่มีทั้งคู่ใน
 * index.html ของ ST) ทำเฉพาะรูปนอกจอ ไม่แตะรูป .last_mes กันดีเลย์อวตารข้อความล่าสุด
 * ไม่ผูกกับ perfContentVisibility — เป็นคนละเรื่องกัน (เคยผูกไว้ ทำให้ปิด content-visibility แล้ว
 * รูปอวตารเลิก lazy ไปด้วยโดยไม่มีเหตุผล) */
export function hintAvatarImages() {
    const settings = getSettings();
    if (!settings.enabled) return;
    if (!matchesApplyOn(settings)) return;
    const chat = chatEl();
    if (!chat) return;
    const imgs = chat.querySelectorAll(".mes:not(.last_mes) .mesAvatarWrapper .avatar img");
    imgs.forEach((img) => {
        if (img.decoding !== "async") img.decoding = "async";
        if (img.loading !== "lazy") img.loading = "lazy";
    });
}

/**
 * หมุนจอ/เปลี่ยนขนาดหน้าต่าง = ความสูงจริงของทุกข้อความเปลี่ยนหมด แต่ contain-intrinsic-size ที่เรา
 * เขียนไว้เป็น px ตายตัวจากการวัดครั้งก่อน ถ้าปล่อยค้างไว้ scrollbar/ตำแหน่ง scroll จะเพี้ยน
 * ต้องล้างทั้งชุดแล้ววัดใหม่ (บนมือถือหมุนจอบ่อย จึงเป็นเคสจริง ไม่ใช่เคสมุม)
 */
export function initResizeWatcher() {
    window.addEventListener("resize", () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            clearAll();
            scheduleSweep(0);
        }, 300);
    });
}
