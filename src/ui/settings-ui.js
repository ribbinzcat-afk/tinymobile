// ===== TinyMobile — ui/settings-ui.js =====
// ผูก control ในแผงตั้งค่า (ลิ้นชัก Extensions) เข้ากับ store + สั่งเขียน CSS ใหม่ทันทีทุกครั้งที่ toggle
// กติกา: import ได้จาก store.js / css.js / perf.js / preset.js เท่านั้น (ห้าม import จาก index.js)

import { getContext } from "../../../../../extensions.js";
import { getSettings, setSetting } from "../store.js";
import { applyCss, reorderToTop } from "../css.js";
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

/** เขียน CSS ใหม่ทันที — เรียกทุกครั้งหลังแก้ setting ใดๆ ที่กระทบ layout/perf CSS */
function refreshCss() {
    const s = getSettings();
    applyCss(s);
    if (s.cssLayer === "top") reorderToTop();
}

function syncControlsFromSettings() {
    const s = getSettings();
    $("#tinymobile-enabled").prop("checked", s.enabled);
    $("#tinymobile-apply-on").val(s.applyOn);
    $("#tinymobile-css-layer").val(s.cssLayer);
    $("#tinymobile-full-width").prop("checked", s.fullWidth);
    $("#tinymobile-avatar-size").val(s.avatarSize);
    $("#tinymobile-big-tap").prop("checked", s.bigTapTargets);
    $("#tinymobile-compact-bars").prop("checked", s.compactBars);
    $("#tinymobile-perf-cv").prop("checked", s.perfContentVisibility);
    $("#tinymobile-perf-shadows").prop("checked", s.perfLightShadows);
    $("#tinymobile-perf-contain").prop("checked", s.perfContain);
    $("#tinymobile-perf-motion").prop("checked", s.perfReduceMotionCss);
    $("#tinymobile-preset-revert").toggle(hasPresetBackup());
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

    $("#tinymobile-preset-preview").on("click", renderPresetDiff);

    $("#tinymobile-preset-revert").on("click", () => {
        const ok = revertPreset(getContext());
        if (ok) {
            $("#tinymobile-preset-revert").hide();
            toastr.info("คืนค่าตั้งต้นของ SillyTavern แล้ว", "TinyMobile");
        }
    });
}
