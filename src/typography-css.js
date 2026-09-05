// ===== TinyMobile — typography-css.js =====
// ย่อหน้าเยื้อง + ขนาด/ระยะบรรทัด/ฟอนต์เนื้อเรื่อง — ยกมาจาก TinyTheme (themes/thai-novel-reader/theme.css)
// เอาเฉพาะฟีเจอร์ที่ผู้ใช้ขอ ไม่เอา columnWidth/สวิตช์สถิติ
// deps: store.js เท่านั้น

export const TYPO_STYLE_ID = "tinymobile-typo";
export const FONTS_STYLE_ID = "tinymobile-fonts";

/**
 * รายชื่อฟอนต์ที่รองรับภาษาไทย — แต่ละตัวมี Google Fonts URL ของตัวเอง (ไม่รวมเป็น URL เดียวทั้งชุด)
 * เพื่อโหลดเฉพาะตัวที่ถูกเลือกจริง ไม่ยิง request ฟอนต์ที่ไม่ได้ใช้ทั้ง 10 ตัว
 * ทุกตัวมี 'Noto Sans Thai', sans-serif ต่อท้ายเป็น fallback เสมอ (กันตัวอักษรไทยหายระหว่างฟอนต์โหลด)
 */
export const FONT_CHOICES = [
    { id: "theme", label: "ตามธีม SillyTavern (ไม่บังคับฟอนต์)", value: "", googleUrl: "" },
    {
        id: "sarabun", label: "Sarabun", value: "'Sarabun', 'Noto Sans Thai', sans-serif",
        googleUrl: "https://fonts.googleapis.com/css2?family=Sarabun:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&display=swap",
    },
    {
        id: "noto-sans-thai", label: "Noto Sans Thai", value: "'Noto Sans Thai', sans-serif",
        googleUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+Thai:wght@400;500;600;700&display=swap",
    },
    {
        id: "ibm-plex-sans-thai", label: "IBM Plex Sans Thai", value: "'IBM Plex Sans Thai', 'Noto Sans Thai', sans-serif",
        googleUrl: "https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+Thai:wght@400;500;600&display=swap",
    },
    {
        id: "kanit", label: "Kanit", value: "'Kanit', 'Noto Sans Thai', sans-serif",
        googleUrl: "https://fonts.googleapis.com/css2?family=Kanit:wght@300;400;500;600&display=swap",
    },
    {
        id: "prompt", label: "Prompt", value: "'Prompt', 'Noto Sans Thai', sans-serif",
        googleUrl: "https://fonts.googleapis.com/css2?family=Prompt:wght@300;400;500;600&display=swap",
    },
    {
        id: "bai-jamjuree", label: "Bai Jamjuree", value: "'Bai Jamjuree', 'Noto Sans Thai', sans-serif",
        googleUrl: "https://fonts.googleapis.com/css2?family=Bai+Jamjuree:wght@400;500;600&display=swap",
    },
    {
        id: "niramit", label: "Niramit", value: "'Niramit', 'Noto Sans Thai', sans-serif",
        googleUrl: "https://fonts.googleapis.com/css2?family=Niramit:wght@400;500;600&display=swap",
    },
    {
        id: "maitree", label: "Maitree (เซริฟ)", value: "'Maitree', 'Noto Sans Thai', serif",
        googleUrl: "https://fonts.googleapis.com/css2?family=Maitree:wght@400;500;600&display=swap",
    },
    {
        id: "trirong", label: "Trirong (เซริฟ)", value: "'Trirong', 'Noto Sans Thai', serif",
        googleUrl: "https://fonts.googleapis.com/css2?family=Trirong:wght@400;500;600&display=swap",
    },
    {
        id: "mali", label: "Mali (ลายมือ)", value: "'Mali', 'Noto Sans Thai', sans-serif",
        googleUrl: "https://fonts.googleapis.com/css2?family=Mali:wght@400;500;600&display=swap",
    },
];

export function findFontChoice(id) {
    return FONT_CHOICES.find((f) => f.id === id) || FONT_CHOICES[0];
}

function getOrCreateStyleTag(id) {
    let el = document.getElementById(id);
    if (!el) {
        el = document.createElement("style");
        el.id = id;
        document.head.appendChild(el);
    }
    return el;
}

/**
 * ก้อน fonts แยกจากก้อน typo เสมอ — @import ต้องมาก่อนกฎอื่นทุกกฎในสไตล์ชีตเดียวกัน (สเปก CSS)
 * ถ้ารวมกับกฎ .mes_text อื่นในก้อนเดียว โอกาสเขียนลำดับผิดตอนแก้ทีหลังมีสูง TinyTheme เจอกับดักนี้
 * มาแล้ว (tinytheme/index.js:121-129) แยกไฟล์ให้เห็นชัดว่าก้อนนี้ "ห้ามมีอะไรอื่นปน"
 */
export function applyFontImportCss(settings) {
    const tag = getOrCreateStyleTag(FONTS_STYLE_ID);
    if (!settings.enabled) { tag.textContent = ""; return; }
    const choice = findFontChoice(settings.proseFont);
    tag.textContent = choice.googleUrl ? `@import url('${choice.googleUrl}');` : "";
}

/**
 * ย่อหน้าเยื้อง + ขนาด/ระยะบรรทัด/ฟอนต์ — เฉพาะ .mes_text ไม่ลามไป UI อื่น (ท่าเดียวกับ TinyTheme เดิม)
 * เยื้องเฉพาะ <p> จริง (ย่อหน้าที่ ST สร้างจากเว้น 2 บรรทัด — simpleLineBreaks:true ทำให้เว้น 1 บรรทัด
 * เป็นแค่ <br> ใน <p> เดิม ไม่ใช่ย่อหน้าใหม่) กันรั่วเข้า blockquote/li/td/th แบบเดียวกับต้นฉบับ
 */
function buildTypoCss(settings) {
    const parts = [];
    const font = findFontChoice(settings.proseFont).value;

    if (font) {
        parts.push(`#chat .mes_text { font-family: ${font} !important; }`);
    }
    if (settings.proseSize) {
        parts.push(`#chat .mes_text { font-size: ${settings.proseSize}px !important; }`);
    }
    if (settings.proseLineHeight) {
        parts.push(`#chat .mes_text { line-height: ${settings.proseLineHeight} !important; }`);
    }
    if (settings.indent > 0) {
        parts.push(`
#chat .mes_text p {
    text-indent: ${settings.indent}% !important;
}
#chat .mes_text blockquote p,
#chat .mes_text li p,
#chat .mes_text td p,
#chat .mes_text th p {
    text-indent: 0 !important;
}`);
    }
    return parts.join("\n");
}

export function applyTypoCss(settings) {
    const tag = getOrCreateStyleTag(TYPO_STYLE_ID);
    tag.textContent = settings.enabled ? buildTypoCss(settings) : "";
}
