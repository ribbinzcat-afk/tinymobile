// ===== TinyMobile — ui/settings-ui.js =====
// ผูก control ในแผงตั้งค่า (ลิ้นชัก Extensions) เข้ากับ store + สั่งเขียน CSS ใหม่ทันทีทุกครั้งที่ toggle
// กติกา: import ได้จาก store.js / css.js / perf.js / preset.js เท่านั้น (ห้าม import จาก index.js)

import { getContext, extension_settings } from "../../../../../extensions.js";
import { getSettings, setSetting } from "../store.js";
import { applyCss, reorderToTop } from "../css.js";
import { applyThemeFixCss } from "../theme-css.js";
import { applyTypoCss, applyFontImportCss, FONT_CHOICES } from "../typography-css.js";
import { clearAll as clearContentVisibility } from "../perf.js";
import { buildPresetDiff, applyPreset, revertPreset, hasPresetBackup } from "../preset.js";

function escapeText(s) {
    return String(s ?? "").replace(/[&<>"']/g, (c) => ({
        "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
    }[c]));
}

function fmtVal(v) {
    if (typeof v === "boolean") return v ? "เปิด" : "ปิด";
    return escapeText(v);
}

/** เขียน CSS ใหม่ทั้ง 4 ก้อนทันที — เรียกทุกครั้งหลังแก้ setting ใดๆ ที่กระทบหน้าตา
 * theme-css/typo/fonts ไม่ขึ้นกับ cssLayer (ก้อนสีอยู่ท้าย head เสมอ, ก้อน typo/fonts ไม่ชนใครเพราะ
 * เจาะจงแค่ .mes_text) มีแค่ layout/perf (จาก css.js) เท่านั้นที่ผู้ใช้เลือกลำดับได้ */
function refreshCss() {
    const s = getSettings();
    applyCss(s);
    applyThemeFixCss(s);
    applyFontImportCss(s);
    applyTypoCss(s);
    if (s.cssLayer === "top") reorderToTop();
}

function populateFontSelect() {
    const $sel = $("#tinymobile-prose-font");
    if ($sel.children().length) return; // สร้างครั้งเดียวพอ ไม่ต้องล้าง/สร้างใหม่ทุกครั้งที่ sync
    for (const f of FONT_CHOICES) {
        $sel.append(`<option value="${f.id}">${f.label}</option>`);
    }
}

function syncControlsFromSettings() {
    const s = getSettings();
    $("#tinymobile-enabled").prop("checked", s.enabled);
    $("#tinymobile-apply-on").val(s.applyOn);
    $("#tinymobile-css-layer").val(s.cssLayer);
    $("#tinymobile-full-width").prop("checked", s.fullWidth);
    $("#tinymobile-avatar-size").val(s.avatarSize);
    $("#tinymobile-bubble-padx").val(s.bubblePadX);
    $(".tinymobile-bubble-padx-value").text(`${s.bubblePadX}px`);
    $("#tinymobile-big-tap").prop("checked", s.bigTapTargets);
    $("#tinymobile-compact-bars").prop("checked", s.compactBars);
    $("#tinymobile-perf-cv").prop("checked", s.perfContentVisibility);
    $("#tinymobile-perf-shadows").prop("checked", s.perfLightShadows);
    $("#tinymobile-perf-contain").prop("checked", s.perfContain);
    $("#tinymobile-perf-motion").prop("checked", s.perfReduceMotionCss);
    $("#tinymobile-theme-fix").prop("checked", s.themeFix);
    populateFontSelect();
    $("#tinymobile-prose-font").val(s.proseFont);
    $("#tinymobile-prose-size").val(s.proseSize);
    $(".tinymobile-prose-size-value").text(s.proseSize ? `${s.proseSize}px` : "ค่าเริ่มต้น");
    $("#tinymobile-prose-line-height").val(s.proseLineHeight);
    $(".tinymobile-prose-line-height-value").text(s.proseLineHeight || "ค่าเริ่มต้น");
    $("#tinymobile-indent").val(s.indent);
    $(".tinymobile-indent-value").text(`${s.indent}%`);
    $("#tinymobile-preset-revert").toggle(hasPresetBackup());
}

/**
 * เตือนถ้ามีอะไรทับแผงสีของ ST อยู่ — เผื่อ TinyTheme (เก็บโฟลเดอร์ไว้ ไม่ได้ลบ) กลับมาเปิด หรือ
 * Custom CSS ของผู้ใช้ยังมีก้อนที่เขียนทับตัวแปรธีมด้วย !important ค้างอยู่ (เจอเคสจริงตอนพัฒนา:
 * ปิด TinyTheme แล้วแต่เคย export ธีมลง Custom CSS ไว้ก่อนหน้า ก้อนนั้นยังทำงานอยู่แม้ extension ปิด)
 * แค่เตือนเฉยๆ ไม่ปิดอะไรให้เอง — การไปยุ่งกับ custom_css ของผู้ใช้เองเป็นการตัดสินใจที่user ต้องทำเอง
 */
function checkThemeCollision() {
    const $box = $("#tinymobile-collision-warning");
    const tinythemeOn = extension_settings?.tinytheme?.enabled === true;
    const customCss = String(getContext().powerUserSettings?.custom_css || "");
    const customCssOverridesTheme = /--SmartTheme[A-Za-z]*\s*:[^;]*!important/.test(customCss);

    if (!tinythemeOn && !customCssOverridesTheme) { $box.hide().empty(); return; }

    const reasons = [];
    if (tinythemeOn) reasons.push("extension TinyTheme กำลังเปิดอยู่");
    if (customCssOverridesTheme) reasons.push('ช่อง "Custom CSS" ของ SillyTavern มีโค้ดที่เขียนทับตัวแปรธีมด้วย !important');

    $box.html(`
        <i class="fa-solid fa-triangle-exclamation"></i>
        มีของทับแผงสีของ SillyTavern อยู่ (${escapeText(reasons.join(" และ "))}) —
        สีที่ TinyMobile ปรับให้อาจไม่เห็นผล ลองสลับเป็นธีมพื้นฐานของ ST (เช่น Dark Lite) ก่อน
        หรือลบโค้ดใน Custom CSS ที่ export มาจากธีมเก่าออก
    `).show();
}

function renderPresetDiff() {
    const ctx = getContext();
    const diff = buildPresetDiff(ctx);
    const $box = $("#tinymobile-preset-diff");

    if (!diff.length) {
        $box.html(`<p class="tinymobile-preset-empty">ค่าปัจจุบันตรงกับ "โหมดมือถือ" อยู่แล้ว ไม่มีอะไรต้องเปลี่ยน</p>`);
        $box.show();
        return;
    }

    const rows = diff.map((e) => `
        <tr>
            <td>${escapeText(e.label)}</td>
            <td class="tinymobile-preset-from">${fmtVal(e.from)}</td>
            <td>→</td>
            <td class="tinymobile-preset-to">${fmtVal(e.to)}</td>
        </tr>`).join("");

    $box.html(`
        <table class="tinymobile-preset-table">
            <tbody>${rows}</tbody>
        </table>
        <div class="tinymobile-preset-actions">
            <button type="button" id="tinymobile-preset-confirm" class="menu_button">
                <i class="fa-solid fa-check"></i> ยืนยัน เปลี่ยนค่าตามตารางนี้
            </button>
            <button type="button" id="tinymobile-preset-cancel" class="menu_button">ยกเลิก</button>
        </div>`);
    $box.show();

    $("#tinymobile-preset-confirm").on("click", () => {
        applyPreset(getContext());
        $box.hide().empty();
        $("#tinymobile-preset-revert").show();
        toastr.success("ปรับเป็นโหมดมือถือแล้ว — กด \"คืนค่าเดิม\" ได้ตลอด", "TinyMobile");
    });
    $("#tinymobile-preset-cancel").on("click", () => {
        $box.hide().empty();
    });
}

export function initSettingsUi() {
    syncControlsFromSettings();
    refreshCss();
    checkThemeCollision();

    $("#tinymobile-enabled").on("change", function () {
        const v = $(this).prop("checked");
        setSetting("enabled", v);
        if (!v) clearContentVisibility(); // ปิดสวิตช์หลัก = ต้องคืนสภาพ DOM ทันที ไม่รอ sweep รอบหน้า
        refreshCss();
    });

    $("#tinymobile-apply-on").on("change", function () {
        setSetting("applyOn", $(this).val());
        refreshCss();
    });

    $("#tinymobile-css-layer").on("change", function () {
        setSetting("cssLayer", $(this).val());
        refreshCss();
    });

    $("#tinymobile-full-width").on("change", function () {
        setSetting("fullWidth", $(this).prop("checked"));
        refreshCss();
    });

    $("#tinymobile-avatar-size").on("input", function () {
        const v = Math.max(20, Math.min(60, Number($(this).val()) || 34));
        setSetting("avatarSize", v);
        refreshCss();
    });

    $("#tinymobile-bubble-padx").on("input", function () {
        const v = Math.max(8, Math.min(24, Number($(this).val()) || 14));
        setSetting("bubblePadX", v);
        $(".tinymobile-bubble-padx-value").text(`${v}px`);
        refreshCss();
    });

    $("#tinymobile-big-tap").on("change", function () {
        setSetting("bigTapTargets", $(this).prop("checked"));
        refreshCss();
    });

    $("#tinymobile-compact-bars").on("change", function () {
        setSetting("compactBars", $(this).prop("checked"));
        refreshCss();
    });

    $("#tinymobile-perf-cv").on("change", function () {
        const v = $(this).prop("checked");
        setSetting("perfContentVisibility", v);
        if (!v) clearContentVisibility(); // ปิด — ต้องล้าง class/inline style ที่สวีปไว้แล้วทั้งหมด
        refreshCss();
    });

    $("#tinymobile-perf-shadows").on("change", function () {
        setSetting("perfLightShadows", $(this).prop("checked"));
        refreshCss();
    });

    $("#tinymobile-perf-contain").on("change", function () {
        setSetting("perfContain", $(this).prop("checked"));
        refreshCss();
    });

    $("#tinymobile-perf-motion").on("change", function () {
        setSetting("perfReduceMotionCss", $(this).prop("checked"));
        refreshCss();
    });

    $("#tinymobile-theme-fix").on("change", function () {
        setSetting("themeFix", $(this).prop("checked"));
        refreshCss();
    });

    $("#tinymobile-prose-font").on("change", function () {
        setSetting("proseFont", $(this).val());
        refreshCss();
    });

    $("#tinymobile-prose-size").on("input", function () {
        const v = Number($(this).val());
        setSetting("proseSize", v);
        $(".tinymobile-prose-size-value").text(v ? `${v}px` : "ค่าเริ่มต้น");
        refreshCss();
    });

    $("#tinymobile-prose-line-height").on("input", function () {
        const v = Number($(this).val());
        setSetting("proseLineHeight", v);
        $(".tinymobile-prose-line-height-value").text(v || "ค่าเริ่มต้น");
        refreshCss();
    });

    $("#tinymobile-indent").on("input", function () {
        const v = Number($(this).val());
        setSetting("indent", v);
        $(".tinymobile-indent-value").text(`${v}%`);
        refreshCss();
    });

    $("#tinymobile-preset-preview").on("click", renderPresetDiff);

    $("#tinymobile-preset-revert").on("click", () => {
        const ok = revertPreset(getContext());
        if (ok) {
            $("#tinymobile-preset-revert").hide();
            toastr.info("คืนค่าตั้งต้นของ SillyTavern แล้ว", "TinyMobile");
        }
    });
}
