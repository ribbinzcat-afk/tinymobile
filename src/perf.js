// ===== TinyMobile — perf.js =====
// content-visibility sweep สำหรับข้อความนอกจอ + hint การโหลดรูปอวตาร
// deps: store.js เท่านั้น (ไม่ import จาก css.js — คลาส "tinymobile-cv" เป็นสัญญาระหว่างสองไฟล์นี้
// ผ่านชื่อคลาสตรงๆ เท่านั้น ไม่ผูก import กัน)

import { getSettings, matchesApplyOn } from "./store.js";

const CV_CLASS = "tinymobile-cv";

let paused = false;       // true ระหว่างกำลังเจน (GENERATION_STARTED..ENDED) — งดสวีปกันชนกับ stream
let sweepTimer = null;

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
    list.forEach(unsweepEl);
}

/** สวีปจริง — วัดความสูงแล้วใส่คลาสให้ข้อความที่ยังไม่มีคลาสและมีสิทธิ์ (ข้อความที่มีคลาสอยู่แล้วจะถูก
 * ข้าม "โดยตั้งใจ" ไม่วัดซ้ำ — ถ้าเนื้อหาเปลี่ยน ผู้เรียกต้อง unsweepByMesId() ก่อนเสมอ ดูคอมเมนต์ด้านบน) */
function sweepAll() {
    const settings = getSettings();
    if (!settings.enabled || !settings.perfContentVisibility) return;
    if (!matchesApplyOn(settings)) return; // จอไม่เข้าเงื่อนไข applyOn — CSS ก็ไม่ได้ผลด้วย ไม่ต้องเสียเวลาวัด
    const chat = chatEl();
    if (!chat) return;
    const mesEls = chat.querySelectorAll(".mes");
    for (const el of mesEls) {
        if (!isEligible(el)) {
            if (el.classList.contains(CV_CLASS)) unsweepEl(el); // เพิ่งกลายเป็นไม่มีสิทธิ์ (เช่น เปิดแก้ไข)
            continue;
        }
        if (el.classList.contains(CV_CLASS)) continue; // สวีปแล้ว ไม่วัดซ้ำ
        const h = el.offsetHeight;
        if (h > 0) {
            el.style.containIntrinsicSize = `auto ${h}px`;
            el.classList.add(CV_CLASS);
        }
    }
}

/** ตั้งเวลาสวีปแบบ debounce — รวมเหตุการณ์ที่มาถี่ๆ (โหลดข้อความเก่าหลายสิบข้อความรวด) ให้วัดครั้งเดียว
 * ใช้ requestIdleCallback ถ้ามี กัน sweep แย่งเวลาจาก paint/scroll ของ ST เอง */
export function scheduleSweep(delayMs = 150) {
    if (paused) return;
    clearTimeout(sweepTimer);
    sweepTimer = setTimeout(() => {
        if (typeof requestIdleCallback === "function") {
            requestIdleCallback(() => sweepAll(), { timeout: 1000 });
        } else {
            sweepAll();
        }
    }, delayMs);
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
 * index.html ของ ST) ทำเฉพาะรูปนอกจอ ไม่แตะรูป .last_mes กันดีเลย์อวตารข้อความล่าสุด */
export function hintAvatarImages() {
    const settings = getSettings();
    if (!settings.enabled || !settings.perfContentVisibility) return;
    if (!matchesApplyOn(settings)) return;
    const chat = chatEl();
    if (!chat) return;
    const imgs = chat.querySelectorAll(".mes:not(.last_mes) .mesAvatarWrapper .avatar img");
    imgs.forEach((img) => {
        if (img.decoding !== "async") img.decoding = "async";
        if (img.loading !== "lazy") img.loading = "lazy";
    });
}
