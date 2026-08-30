// ===== TinyMobile — store.js =====
// เก็บชื่อ extension / ค่าเริ่มต้น / getter-setter สำหรับ extension_settings (global)
// กติกา: deps = 0 — ห้าม import จากไฟล์อื่นใน src/ (ไฟล์อื่นๆ import จากไฟล์นี้ได้)
// path ลึกกว่า index.js 1 ชั้น เพราะอยู่ใน src/

import { extension_settings } from "../../../../extensions.js";
import { saveSettingsDebounced } from "../../../../../script.js";

export const extensionName = "tinymobile";
export const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;

// ===== ค่าเริ่มต้นของ extension_settings.tinymobile (global — ติดตัวผู้ใช้ข้ามทุกแชท) =====
export const defaultSettings = {
    enabled: true,           // สวิตช์หลัก — ปิดแล้วต้องเงียบสนิท (ล้าง class/style ทั้งหมดที่แทรกไว้)

    // "mobile" = ทำงานเฉพาะจอ ≤1000px (ตรงกับ breakpoint ของ core css/mobile-styles.css)
    // "always" = ทำทุกขนาดจอ · "off" = ปิด CSS redesign ทั้งหมดชั่วคราวโดยไม่ปิดสวิตช์หลัก
    applyOn: "mobile",

    // ตำแหน่งของ <style> เรา — "below" ให้ CSS ธีม/ผู้ใช้ (#custom-style, TinyTheme) ชนะเสมอ
    // "top" ย้ายไปท้าย <head> หลัง APP_READY เพื่อบังคับให้ full-width ชนะทุกอย่าง
    cssLayer: "below",

    // ── A/B: layout ข้อความ ──
    fullWidth: true,         // ค่าเริ่มต้น: เปิด — เป้าหมายหลักของผู้ใช้
    avatarSize: 34,          // px, ใช้แทน --avatar-base-width/height เฉพาะในบับเบิ้ลแชท

    // ── C: ปุ่มบนข้อความใหญ่ขึ้น ──
    bigTapTargets: false,    // ปิดไว้ก่อนตามที่ผู้ใช้เลือก

    // ── D: แถบพิมพ์/แถบบนกระชับ ──
    compactBars: false,      // ปิดไว้ก่อนตามที่ผู้ใช้เลือก

    // ── E: performance (ไม่แตะค่า ST) ──
    perfContentVisibility: true,  // content-visibility กับข้อความนอกจอ
    perfLightShadows: true,       // ตัด drop-shadow/text-shadow ที่แพงในแชท
    perfContain: true,            // contain:layout style บน .mes
    perfReduceMotionCss: false,   // ตัด transition ในแชทด้วย CSS (คนละตัวกับ power_user.reduced_motion)

    // ── F: preset "โหมดมือถือ" ที่แก้ค่า power_user จริง ──
    // null = ยังไม่เคยกด/คืนค่าแล้ว · object = snapshot ค่าที่ถูกทับไว้ ใช้ตอนกด "คืนค่าเดิม"
    presetBackup: null,
};

// ===== extension_settings (global) =====
export function getSettings() {
    extension_settings[extensionName] = extension_settings[extensionName] || {};
    const s = extension_settings[extensionName];
    // type-guard ทุกคีย์ — ผู้ใช้เก่า/เวอร์ชันก่อนหน้าอาจไม่มีคีย์ใหม่
    for (const k of Object.keys(defaultSettings)) {
        if (s[k] === undefined) s[k] = defaultSettings[k];
    }
    if (s.presetBackup !== null && typeof s.presetBackup !== "object") s.presetBackup = null;
    return s;
}
export function getSetting(key) { return getSettings()[key]; }
export function setSetting(key, value) { getSettings()[key] = value; saveSettingsDebounced(); }
export function saveSettings() { saveSettingsDebounced(); }

/** จอปัจจุบันเข้าเงื่อนไข applyOn ไหม — ใช้ทั้งฝั่ง CSS (media query ใน css.js) และฝั่ง JS (perf.js
 * ตัดสินใจว่าจะเสียเวลาสวีปไหม) อยู่ใน store.js เพราะเป็นแค่ฟังก์ชันล้วนจาก settings + window ไม่ผูก
 * กับ DOM ของแชทเลย ไม่ควรให้ css.js/perf.js ต้อง import ไขว้กันเอง */
export function matchesApplyOn(settings) {
    if (settings.applyOn === "off") return false;
    if (settings.applyOn === "always") return true;
    return window.matchMedia("(max-width: 1000px)").matches; // "mobile" (ตรงกับ breakpoint ของ core)
}
