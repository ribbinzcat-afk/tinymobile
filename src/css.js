// ===== TinyMobile — css.js =====
// สร้าง/ฉีด <style> 2 ก้อน (layout, perf) จาก settings แล้วจัดตำแหน่งใน <head>
// deps: store.js เท่านั้น

import { getSettings } from "./store.js";

export const STYLE_IDS = {
    layout: "tinymobile-layout",
    perf: "tinymobile-perf",
};

function getOrCreateStyleTag(id) {
    let el = document.getElementById(id);
    if (!el) {
        el = document.createElement("style");
        el.id = id;
        // ใส่ก่อน #custom-style เสมอตอนสร้างครั้งแรก — ให้ธีม/CSS ของผู้ใช้ชนะเราโดย default
        // (ตรงกับ cssLayer:"below" ค่าเริ่มต้น) ถ้าผู้ใช้เปลี่ยนเป็น "top" ทีหลัง reorderToTop()
        // จะย้ายมันไปท้าย head แทน
        const customStyle = document.getElementById("custom-style");
        if (customStyle) document.head.insertBefore(el, customStyle);
        else document.head.appendChild(el);
    }
    return el;
}

function wrapMedia(css, settings) {
    if (!css || settings.applyOn === "off") return "";
    if (settings.applyOn === "always") return css;
    return `@media (max-width: 1000px) {\n${css}\n}`;
}

/**
 * A/B/C/D — full-width + อวตารแถวชื่อ + ปุ่มใหญ่ + แถบกระชับ
 * เทคนิค full-width อ้างอิงจาก tinytheme/themes/social-feed/theme.css (พิสูจน์แล้วในโปรเจกต์นี้)
 * `:not(.smallSysMes)` ทุกจุด — ข้อความระบบมีโครง/กติกาของตัวเองอยู่แล้ว (style.css:678-695 ของ ST)
 * ไม่ต้องการให้ grid ของเราไปยุ่ง
 * ทุก selector นำด้วย `#chat ` (G1) — กัน `.mes`/`.mes_button` ที่อยู่นอกแชทจริง (เช่น
 * `#message_template` ที่ซ่อนไว้เป็นแม่แบบ) โดนไปด้วยโดยไม่ตั้งใจ
 */
function buildLayoutCss(settings) {
    const parts = [];

    if (settings.fullWidth) {
        const avatarPx = Math.max(20, Number(settings.avatarSize) || 34);
        // padX คุมซ้าย/ขวา/บนเท่านั้น — ล่างแยกเป็นค่าคงที่ใน .last_mes ด้านล่าง (ดูคอมเมนต์ตรงนั้น)
        // ข้อความที่ไม่ใช่ .last_mes ใช้ padX เดียวกันทั้ง 4 ด้านได้ ไม่มีลูกศร swipe มากวน
        const padX = Math.max(8, Math.min(24, Number(settings.bubblePadX) || 14));
        parts.push(`
#chat .mes:not(.smallSysMes) {
    display: grid !important;
    grid-template-columns: auto 1fr !important;
    column-gap: 8px !important;
    row-gap: 2px !important;
    align-items: start !important;
    padding: ${padX}px !important;
    /* ผู้บริโภคตัวแปรนี้ทั้งหมด (เจอจากการวัดจริง ไม่ใช่แค่ที่คาดไว้แต่แรก): .mes_text (padding-right),
       .mes_reasoning_details (margin-right), .mes_reasoning_summary (margin-right ติดลบคู่กัน — core
       จับคู่ +30/-30 เพื่อหักล้าง ถ้า zero แค่ฝั่งเดียวหัวข้อ reasoning จะยื่นออกนอกขวา 30px),
       .mes_media_wrapper และ .mes_file_wrapper (padding-right ทั้งคู่) — แก้ที่ต้นตอตัวแปรเดียว
       ครบทุกจุดพร้อมกัน แทนไล่ zero รายจุดซึ่งเคยพลาด 3 จุดหลังไปตอนรอบแรก */
    --mes-right-spacing: 0px !important;
}
#chat .mes:not(.smallSysMes) > .for_checkbox,
#chat .mes:not(.smallSysMes) > input.del_checkbox {
    grid-column: 1 !important;
    grid-row: 1 !important;
}
/* ch_name ต้อง "ตรึง" ที่ (แถว1, คอลัมน์2) ตรงๆ — ทิ้งให้ auto-placement เดาเอง (grid-column ไม่ตั้งค่า)
   เจอบั๊กจริงตอนเทส: browser วาง .ch_name ไปแชร์คอลัมน์ 1 กับอวตารแทนที่จะไปคอลัมน์ 2 (คอลัมน์ 1 "auto"
   เลยบวมขึ้นไปตามความกว้างจริงของชื่อ+เวลา แทนที่จะเท่าอวตาร) วัดจริงบน SillyTavern 1.18.0: คอลัมน์ 1
   บวมจาก ~34px เป็น ~118px ก่อนแก้ ต้องกำหนดตำแหน่งตรงๆ ไม่พึ่ง auto-placement */
#chat .mes:not(.smallSysMes) .ch_name {
    grid-column: 2 !important;
    grid-row: 1 !important;
    min-width: 0 !important;
}
#chat .mes:not(.smallSysMes) .mesAvatarWrapper {
    grid-column: 1 !important;
    grid-row: 1 !important;
    display: grid !important;
    grid-template-columns: repeat(3, auto) !important;
    grid-template-rows: auto auto !important;
    justify-content: center !important;
    align-items: center !important;
    row-gap: 2px !important;
    column-gap: 4px !important;
    margin: 0 !important;
    padding: 0 !important;
    min-width: 0 !important;
}
/* min-width/max-width ต้องล้างด้วย ไม่ใช่แค่ width — เจอบั๊กจริงกับแชทกลุ่ม: .avatar_collage ของ
   core ได้ min-width: var(--avatar-base-width) (50px, ไม่มี !important) แต่ min-width ชนะ width
   เสมอไม่ว่าจะ !important หรือสเปกเฉพาะแค่ไหน (กติกา box model ล้วนๆ ไม่ใช่เรื่อง cascade) — วัดจริง:
   ตั้ง width:34px !important เฉยๆ ได้ computed width 50px เต็มๆ ต้อง min-width:0 กำกับด้วยเสมอ
   (เผื่อโหมด body.big-avatars ที่มี max-width มาคู่กันด้วย ล้างทั้งคู่กันเหนียว) */
#chat .mes:not(.smallSysMes) .mesAvatarWrapper .avatar {
    grid-row: 1 !important;
    grid-column: 1 / -1 !important;
    justify-self: center !important;
    min-width: 0 !important;
    max-width: none !important;
    width: ${avatarPx}px !important;
    height: ${avatarPx}px !important;
    aspect-ratio: 1 / 1 !important;
}
#chat .mes:not(.smallSysMes) .mesAvatarWrapper .avatar img {
    width: 100% !important;
    height: 100% !important;
}
#chat .mes:not(.smallSysMes) .mes_timer { grid-row: 2 !important; grid-column: 1 !important; }
#chat .mes:not(.smallSysMes) .mesIDDisplay { grid-row: 2 !important; grid-column: 2 !important; }
#chat .mes:not(.smallSysMes) .tokenCounterDisplay { grid-row: 2 !important; grid-column: 3 !important; }
#chat .mes:not(.smallSysMes) .mes_block {
    display: contents !important;
}
/* selector แบบ "ทุกลูกยกเว้น .ch_name" ไม่ใช่ list ชื่อคลาส — extension อื่น (เช่น chat-arcade,
   tinylive) แทรก div ของตัวเองเข้า .mes_block ด้วย ต้องกินเต็มแถวเหมือนกันโดยไม่ต้องรู้จักชื่อคลาสมันเลย */
/* row: auto (ไม่ตั้งตรงๆ) โดยตั้งใจ — แถว 1 ทั้งสองคอลัมน์ถูกจองด้วยอวตาร+ch_name แล้ว browser จะ
   สร้างแถวใหม่ให้เนื้อหาที่กิน 2 คอลัมน์พร้อมกันเอง (ตรวจแล้วว่า deterministic กับ ch_name ที่ตรึงไว้
   ข้างบน — ถ้าไม่ตรึง ch_name ก่อน จุดนี้จะสุ่มพังตามบั๊กเดียวกัน) */
#chat .mes:not(.smallSysMes) .mes_block > *:not(.ch_name) {
    grid-column: 1 / -1 !important;
    min-width: 0 !important;
}
/* table ใช้ overflow กับตัวเองตรงๆ ไม่ได้ (display:table ไม่รับ overflow เป็นกล่อง scroll) — วัดจริง:
   ตั้ง overflow-x:auto เฉยๆ ยังคง overflow-x:visible ต้องเปลี่ยน display ก่อนถึงจะมีกล่องให้ scroll */
#chat .mes:not(.smallSysMes) .mes_text pre {
    overflow-x: auto !important;
    max-width: 100% !important;
}
#chat .mes:not(.smallSysMes) .mes_text table {
    display: block !important;
    overflow-x: auto !important;
    max-width: 100% !important;
}
/* core กันพื้นที่ swipe ด้วย padding ใต้อวตาร (style.css:1412) — อวตารเราเล็กลง/ย้ายแถวแล้ว
   ต้องกันพื้นที่ตรงนี้แทน แต่ห้ามใส่บน .mes_block — display:contents ทำให้มันไม่มีกล่องจริง
   padding บน element ที่ display:contents ไม่ render เลย (วัดจริง: ใส่ 34px แล้ว getComputedStyle
   ยังคืน "34px" ทั้งที่ระยะห่างจริงบนจอไม่ขยับเลย ลูกศร swipe ยังทับตัวอักษรบรรทัดสุดท้ายเป๊ะๆ —
   ต้องใส่บน .mes เอง (ยังเป็น display:grid มีกล่องจริง) ถึงจะมีผล) */
#chat .mes.last_mes:not(.smallSysMes) .mesAvatarWrapper {
    padding-bottom: 0 !important;
}
/* ค่า 50px วัดจริงจาก DOM ไม่ใช่เดา — ลูกศร swipe (.swipe_left/.swipe_right) กินแถบคงที่
   [mes_bottom-45px, mes_bottom-20px] เทียบกับขอบล่างของ .mes เสมอ ไม่ว่าข้อความจะสั้นยาวแค่ไหน
   (ทดลองไล่ค่า 42/44/45/46/48/50: 45px คือจุดที่ข้อความกับลูกศรเพิ่งพอดีไม่ทับกัน 44px ยังทับอยู่ 1px)
   ใช้ 50 ให้มีระยะหายใจ ~5px แทนที่จะแตะกันพอดี */
#chat .mes.last_mes:not(.smallSysMes) {
    padding-bottom: 50px !important;
}`);
    }

    if (settings.bigTapTargets) {
        parts.push(`
#chat .mes_buttons .mes_button,
#chat .mes_buttons .extraMesButtons > div {
    min-width: 36px !important;
    min-height: 36px !important;
    display: inline-flex !important;
    align-items: center !important;
    justify-content: center !important;
    opacity: 0.55 !important;
    gap: 6px !important;
}
#chat .mes_edit_buttons .menu_button {
    min-width: 36px !important;
    min-height: 36px !important;
}`);
    }

    if (settings.compactBars) {
        parts.push(`
:root {
    --bottomFormBlockPadding: calc(var(--mainFontSize) / 4) !important;
    --bottomFormIconSize: calc(var(--mainFontSize) * 1.5) !important;
    --topBarIconSize: calc(var(--mainFontSize) * 1.6) !important;
}
#sheld {
    padding-bottom: max(env(safe-area-inset-bottom), 0px) !important;
}`);
    }

    return parts.join("\n");
}

/** E — performance CSS ล้วน ไม่แตะสี/ธีม */
function buildPerfCss(settings) {
    const parts = [];

    if (settings.perfContentVisibility) {
        // คลาสนี้ถูกเติม/ถอดโดย perf.js เท่านั้น (วัดความสูงจริงก่อนเสมอ — ดูคอมเมนต์ที่นั่น)
        parts.push(`
.tinymobile-cv {
    content-visibility: auto !important;
}`);
    }

    if (settings.perfLightShadows) {
        parts.push(`
/* filter: drop-shadow ต่อ element แพงกว่า text-shadow มาก — ปุ่มข้อความมองเห็นจริงแค่ 3-4 ตัว/ข้อความ
   แต่ 100 ข้อความ = ปุ่มหลายร้อยตัวที่ยังคิด filter อยู่แม้ opacity ต่ำ */
#chat .mes_button,
#chat .extraMesButtons > div {
    filter: none !important;
    text-shadow: 0 0 2px rgba(0, 0, 0, 0.6) !important;
}
/* universal * { text-shadow } ของ core (style.css:139) ตกกับทุก element ในแชท — จำกัดให้เหลือ
   เฉพาะจุดที่เห็นผลจริง (ข้อความ/ชื่อ) เคารพ --shadowWidth เดิมของผู้ใช้
   ต้องคืนให้ "ลูกทุกตัว" ของ mes_text/mes_reasoning ด้วย (* ไม่ใช่แค่ตัวเอง) — ST ห่อเนื้อข้อความ
   ด้วย <p> เสมอ วัดจริง: ไม่ใส่ '*' แล้ว .mes_text เองได้เงาคืนถูกต้อง แต่ <p> ข้างในที่มีตัวอักษร
   จริงกลับเป็น none เพราะ '#chat *' (ข้างบน) จับมันไปแล้วและ specificity เท่ากับกฎที่ไม่มี '*' */
#chat, #chat * {
    text-shadow: none !important;
}
#chat .mes_text,
#chat .mes_text *,
#chat .mes_reasoning,
#chat .mes_reasoning *,
#chat .ch_name .name_text {
    text-shadow: 0px 0px calc(var(--shadowWidth) * 1px) var(--SmartThemeShadowColor) !important;
}`);
    }

    if (settings.perfContain) {
        parts.push(`
#chat .mes:not(.last_mes) {
    contain: layout style !important;
}
#chat {
    overscroll-behavior: contain !important;
}`);
    }

    if (settings.perfReduceMotionCss) {
        parts.push(`
#chat .mes, #chat .mes * {
    transition: none !important;
    animation-duration: 0.001ms !important;
}`);
    }

    return parts.join("\n");
}

/** เขียนเนื้อ <style> ทั้งสองก้อนใหม่ตาม settings ปัจจุบัน — เรียกได้ทุกครั้งที่ toggle ไม่ต้อง reload */
export function applyCss(settingsArg) {
    const settings = settingsArg || getSettings();
    const layoutTag = getOrCreateStyleTag(STYLE_IDS.layout);
    const perfTag = getOrCreateStyleTag(STYLE_IDS.perf);

    if (!settings.enabled) {
        layoutTag.textContent = "";
        perfTag.textContent = "";
        return;
    }

    layoutTag.textContent = wrapMedia(buildLayoutCss(settings), settings);
    perfTag.textContent = wrapMedia(buildPerfCss(settings), settings);
}

/**
 * ย้าย <style> ทั้งสองก้อนไปท้าย <head> — ให้ชนะทุกอย่างรวมถึง TinyTheme (ซึ่งย้ายตัวเองไปท้าย head
 * ตอน APP_READY เหมือนกัน ดู tinytheme/index.js) เรียกเฉพาะตอน cssLayer === "top"
 * appendChild บน element ที่อยู่ใน DOM แล้ว = ย้าย ไม่ใช่ clone
 */
export function reorderToTop() {
    for (const id of Object.values(STYLE_IDS)) {
        const el = document.getElementById(id);
        if (el) document.head.appendChild(el);
    }
}
