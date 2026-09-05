// ===== TinyMobile — theme-css.js =====
// ก้อน CSS ที่ทำให้จุดที่ core ST ใช้สีตายตัว (--black30a/--white30a/--grey30 ฯลฯ) เดินตามสีธีมจริงแทน
// deps: store.js เท่านั้น
//
// ต่างจาก layout/perf ตรงที่ก้อนนี้ "ไม่" ห่อด้วย @media (max-width:1000px) — เป็นการซ่อมสีทั้งแอป
// ไม่ใช่ของเฉพาะมือถือ (คุมด้วย settings.themeFix แยกจาก applyOn) และ selector ส่วนใหญ่ "ไม่" นำด้วย
// #chat โดยตั้งใจ — จุดที่ต้องซ่อม (text_pole, standoutHeader, neo-range-input, prompt_order) ส่วนใหญ่
// อยู่นอกแชท (แผงตั้งค่า/preset manager) ตรงข้ามกับกฎใน css.js ที่ต้องสโคปเพราะเป็นเรื่องเลย์เอาต์แชทโดยเฉพาะ
//
// สูตร: ผสมสีตัวอักษร (--SmartThemeBodyColor) ลงบนสีพื้นของธีม (--SmartThemeBlurTintColor) ด้วย
// color-mix — ทดลองแล้วบน DOM จริงว่าปรับตามธีมมืด/สว่างได้จริง (ไม่ใช่แค่เขียนสูตรเฉยๆ):
// สลับ --SmartThemeBodyColor ระหว่างค่าธีมมืด/สว่างแล้ววัด computed background-color เปลี่ยนตามทุกครั้ง

export const THEME_STYLE_ID = "tinymobile-theme";

function getOrCreateStyleTag() {
    let el = document.getElementById(THEME_STYLE_ID);
    if (!el) {
        el = document.createElement("style");
        el.id = THEME_STYLE_ID;
        document.head.appendChild(el); // ท้าย head เสมอ — ต้องชนะ style.css ของ core ทุกครั้ง ไม่ต้องพึ่ง cssLayer
    }
    return el;
}

function buildThemeFixCss() {
    return `
/* กล่องกรอกข้อความ — core ใช้ --black30a/--white30a ตายตัว (style.css: textarea, .text_pole, select,
   .neo-range-input, .range-block-counter input, .prompt_order>div, #shadow_popup, .edit_textarea)
   #send_textarea ยกเว้นเสมอ — core ตั้ง background:transparent !important ไว้ตั้งใจ (มันวางทับพื้นของ
   #send_form เอง ไม่ใช่กล่องของตัวเอง) ถ้าไปแตะจะมีกล่องทึบซ้อนขึ้นมาในแถบพิมพ์ */
input[type="text"], input[type="search"], input[type="number"], input[type="password"],
textarea:not(#send_textarea), .text_pole, select,
.select2-container .select2-selection, .select2-dropdown,
.neo-range-input, .range-block-counter input,
.prompt_order > div, .edit_textarea, #shadow_popup {
    background-color: color-mix(in srgb, var(--SmartThemeBodyColor) 10%, var(--SmartThemeBlurTintColor)) !important;
    color: var(--SmartThemeBodyColor) !important;
}

/* หัวข้อ/แถบ drawer — core เขียน gradient 4 stop แต่ 3 ใน 4 เป็นสีดำ/ขาวตายตัว (style.css:5396-5405)
   คง stop สุดท้ายที่อิง --SmartThemeQuoteColor ของเดิมไว้ (จุดเน้นสี ไม่ใช่จุดที่พัง) */
#extensions_settings .inline-drawer-toggle.inline-drawer-header,
#extensions_settings2 .inline-drawer-toggle.inline-drawer-header,
#user-settings-block h4,
.standoutHeader {
    background-image: linear-gradient(348deg,
        color-mix(in srgb, var(--SmartThemeBodyColor) 14%, transparent) 2%,
        color-mix(in srgb, var(--SmartThemeBodyColor) 7%, transparent) 10%,
        var(--SmartThemeBlurTintColor) 95%,
        var(--SmartThemeQuoteColor) 100%) !important;
}
.standoutHeader ~ .inline-drawer-content {
    background-color: color-mix(in srgb, var(--SmartThemeBodyColor) 10%, var(--SmartThemeBlurTintColor)) !important;
}

/* หัวข้อ reasoning ในแชท — core ใช้ --grey30 ตายตัว (style.css:464) */
.mes_reasoning_header {
    background-color: color-mix(in srgb, var(--SmartThemeBodyColor) 12%, var(--SmartThemeBlurTintColor)) !important;
}`;
}

/** เขียน/ล้างก้อนสีตามธีม — เรียกได้ทุกครั้งที่ toggle ไม่ต้อง reload */
export function applyThemeFixCss(settings) {
    const tag = getOrCreateStyleTag();
    tag.textContent = settings.enabled && settings.themeFix ? buildThemeFixCss() : "";
}
