// ===== TinyMobile — preset.js =====
// "โหมดมือถือ" — ปุ่มเดียวที่แก้ค่า power_user จริงของ SillyTavern (นอกเหนือจาก CSS ของเราเอง)
// ต้องมี snapshot คืนค่าได้เสมอ — ผู้ใช้ต้องเห็นตารางก่อน-หลังแล้วกดยืนยันเองเท่านั้น (ดู settings-ui.js)
// path จาก src/ ลึกกว่า index.js 1 ชั้น เหมือน store.js

import { applyPowerUserSettings } from "../../../../power-user.js";
import { saveSettingsDebounced } from "../../../../../script.js";
import { getSetting, setSetting } from "./store.js";

// ── ค่า preset ── คีย์ต้องมีอยู่จริงใน power_user (ตรวจกับ scripts/power-user.js ของ ST 1.18.0 แล้ว)
export const PRESET_ENTRIES = [
    { key: "streaming_fps", to: 10, label: "ความถี่อัปเดตขณะ AI พิมพ์ (FPS)" },  // slider ค่าจริงขั้นละ 5 (min 5/step 5) — ใช้ 12 แล้วสไลเดอร์ snap แสดงผลเพี้ยนเป็น 10 (ค่า power_user ถูกจริงแต่ UI ไม่ตรง) เปลี่ยนมาใช้เลขที่ลงล็อกพอดี
    { key: "smooth_streaming", to: false, label: "Smooth Streaming" },
    { key: "stream_fade_in", to: false, label: "เอฟเฟกต์ fade-in ตอนพิมพ์" },
    { key: "chat_truncation", to: 40, label: "จำนวนข้อความสูงสุดในหน้าจอ" },
    { key: "shadow_width", to: 0, label: "ความหนาเงาข้อความ" },
    { key: "reduced_motion", to: true, label: "ลดแอนิเมชันทั้งระบบ" },
    { key: "blur_strength", to: 0, label: "ความเบลอพื้นหลัง/แผง" },
];

/** อ่านค่าปัจจุบันของทุกคีย์ preset จาก power_user จริง — ใช้ทำตาราง "เดิม → ใหม่" ก่อนถาม */
export function buildPresetDiff(ctx) {
    const pu = ctx.powerUserSettings;
    return PRESET_ENTRIES.map((e) => ({ ...e, from: pu[e.key] }))
        .filter((e) => e.from !== e.to); // ค่าที่ตรงกับ preset อยู่แล้วไม่ต้องโชว์ในตาราง
}

function syncSliderUi(key, value) {
    // applyPowerUserSettings() เองซิงก์ slider ให้บางคีย์ (shadow_width/blur_strength) อยู่แล้ว —
    // แต่ streaming_fps/chat_truncation อ่านค่าตรงจาก power_user ทุกครั้งที่ใช้งานจริง ไม่มีฟังก์ชัน
    // "apply" ของตัวเอง ต้องซิงก์ input+counter เองไม่งั้นสไลเดอร์ในหน้า User Settings โชว์ค่าเก่าค้าง
    if (key === "streaming_fps") {
        $("#streaming_fps").val(value);
        $("#streaming_fps_counter").val(value);
    }
    if (key === "chat_truncation") {
        $("#chat_truncation").val(value);
        $("#chat_truncation_counter").val(value);
    }
}

/** switchReducedMotion() ของ core ไม่ได้ export — ทำผลลัพธ์เดียวกันเอง (jQuery.fx.off + body class)
 * ตั้งใจไม่ก๊อปส่วนตรวจ prefers-reduced-motion ของ OS มาด้วย (แค่ sync checkbox ให้ตรงพอ) */
function applyReducedMotionEffect(value) {
    if (typeof jQuery !== "undefined" && jQuery.fx) jQuery.fx.off = value;
    $("body").toggleClass("reduced-motion", value);
    $("#reduced_motion").prop("checked", value);
}

/** กดปุ่ม "โหมดมือถือ" (หลังผู้ใช้ยืนยันตารางแล้วเท่านั้น — เรียกจาก settings-ui.js) */
export function applyPreset(ctx) {
    const pu = ctx.powerUserSettings;

    // เก็บ snapshot เฉพาะตอนยังไม่มี backup ค้างอยู่ — กันกดซ้ำแล้วทับ backup ด้วยค่าที่ preset เพิ่งตั้งเอง
    if (!getSetting("presetBackup")) {
        const backup = {};
        for (const e of PRESET_ENTRIES) backup[e.key] = pu[e.key];
        setSetting("presetBackup", backup);
    }

    for (const e of PRESET_ENTRIES) {
        if (e.key === "reduced_motion") continue; // แยกไปทำท้ายสุด (ต้องมีผลข้างเคียง jQuery.fx.off ด้วย)
        pu[e.key] = e.to;
        syncSliderUi(e.key, e.to);
    }
    applyPowerUserSettings(); // sync ค่า/slider ที่เหลือ (shadow_width, blur_strength) + เขียน CSS var จริง
    applyReducedMotionEffect(true);
    pu.reduced_motion = true;
    saveSettingsDebounced();
}

/** กดปุ่ม "คืนค่าเดิม" — ใช้ snapshot ที่เก็บไว้ตอน applyPreset() */
export function revertPreset(ctx) {
    const backup = getSetting("presetBackup");
    if (!backup) return false;
    const pu = ctx.powerUserSettings;

    for (const e of PRESET_ENTRIES) {
        if (e.key === "reduced_motion") continue;
        const v = backup[e.key];
        pu[e.key] = v;
        syncSliderUi(e.key, v);
    }
    applyPowerUserSettings();
    const rm = Boolean(backup.reduced_motion);
    applyReducedMotionEffect(rm);
    pu.reduced_motion = rm;

    setSetting("presetBackup", null);
    saveSettingsDebounced();
    return true;
}

export function hasPresetBackup() {
    return Boolean(getSetting("presetBackup"));
}
