// ===== TinyMobile — index.js =====
// bootstrap เท่านั้น: โหลด settings.html, ผูก event สำหรับสวีป content-visibility, จัดตำแหน่ง CSS
// ฟีเจอร์จริงอยู่ใน src/ ทั้งหมด — ไฟล์นี้ประกอบชิ้นส่วนเข้าด้วยกันเท่านั้น

import { getContext } from "../../../extensions.js";
import { extensionName, extensionFolderPath, getSettings, getSetting } from "./src/store.js";
import { reorderToTop } from "./src/css.js";
import { scheduleSweep, unsweepByMesId, onGenerationStarted, onGenerationEnded, hintAvatarImages, initResizeWatcher } from "./src/perf.js";
import { initSettingsUi } from "./src/ui/settings-ui.js";

/** สวีป content-visibility + hint รูปอวตาร — เรียกรวมกันทุกจุดที่ DOM ของแชทอาจเปลี่ยน */
function sweepAndHint() {
    scheduleSweep();
    hintAvatarImages();
}

function bindChatEvents(ctx) {
    const sweepEvents = [
        ctx.eventTypes.CHAT_CHANGED,
        ctx.eventTypes.CHARACTER_MESSAGE_RENDERED,
        ctx.eventTypes.USER_MESSAGE_RENDERED,
        ctx.eventTypes.MORE_MESSAGES_LOADED,
    ];
    for (const ev of sweepEvents) if (ev) ctx.eventSource.on(ev, sweepAndHint);

    // เนื้อหาข้อความเปลี่ยน (แก้ไข/แปล/สไวป์) — ต้องถอด content-visibility ของข้อความนั้นก่อนเสมอ
    // ไม่งั้น sweep รอบถัดไปจะข้ามเพราะเห็นว่ามีคลาสอยู่แล้ว แล้วความสูงที่ค้างไว้จะผิดจากเนื้อหาจริง
    ctx.eventSource.on(ctx.eventTypes.MESSAGE_UPDATED, (mesId) => {
        unsweepByMesId(mesId);
        sweepAndHint();
    });
    ctx.eventSource.on(ctx.eventTypes.MESSAGE_SWIPED, (mesId) => {
        unsweepByMesId(mesId);
        sweepAndHint();
    });

    // MESSAGE_DELETED ส่ง chat.length มาเป็น arg ไม่ใช่ index ที่ถูกลบ (เหมือนที่ tinylive เจอไว้แล้ว)
    // ไม่รู้แน่ชัดว่าใครหาย ปลอดภัยสุดคือสวีปใหม่ทั้งก้อน (sweepAll เดิมข้ามข้อความที่ยังมีคลาสอยู่แล้ว
    // อยู่แล้ว จึงไม่แพงแม้จะเรียกรวมทั้งแชท)
    ctx.eventSource.on(ctx.eventTypes.MESSAGE_DELETED, sweepAndHint);

    // ระหว่างเจน (รวม stream) พักสวีปทั้งหมด — ข้อความล่าสุดเปลี่ยนความสูงถี่ๆ อยู่แล้ว
    ctx.eventSource.on(ctx.eventTypes.GENERATION_STARTED, onGenerationStarted);
    ctx.eventSource.on(ctx.eventTypes.GENERATION_ENDED, onGenerationEnded);

    // กดปุ่ม "แก้ไข" ไม่มี ST event ของตัวเอง — sweepAll() ปกติจะข้ามข้อความนี้ไปเองในรอบถัดไป
    // (isEligible() กัน .edit_textarea ไว้แล้ว) แต่ถ้าข้อความนี้เคยถูกสวีปไปแล้วก่อนหน้า คลาส/
    // contain-intrinsic-size เก่าจะค้างอยู่ตลอดที่กำลังแก้ไข ต้องถอดออกทันทีตอนกดปุ่ม ไม่ต้องรอสวีป
    $(document).on("click", "#chat .mes_edit", function () {
        const mesId = $(this).closest(".mes").attr("mesid");
        if (mesId !== undefined) unsweepByMesId(mesId);
    });
}

// ===== bootstrap =====
jQuery(async () => {
    console.log(`[${extensionName}] กำลังโหลด...`);
    try {
        getSettings(); // สร้าง/type-guard ค่าเริ่มต้นก่อนใครมาอ่าน

        const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);
        $("#extensions_settings2").append(settingsHtml);

        initSettingsUi(); // เขียน CSS ครั้งแรก + ผูก control ในหน้าตั้งค่า

        const ctx = getContext();
        bindChatEvents(ctx);
        initResizeWatcher(); // หมุนจอ/เปลี่ยนขนาดหน้าต่าง = ความสูงจริงเปลี่ยนหมด ต้องล้างแล้ววัดใหม่
        sweepAndHint(); // กวาดข้อความที่มีอยู่แล้วตอนโหลดหน้า (เช่นรีเฟรชหน้า)

        // ย้าย <style> ของเราไปท้าย <head> อีกครั้งตอน APP_READY ถ้าตั้งค่าไว้เป็น "top" — กันปัญหา
        // extension script (type="module" async) รันเสร็จก่อน/หลัง core init ไม่แน่นอน (ท่าเดียวกับ
        // ที่ tinytheme/index.js ใช้กับ <style> ของธีมตัวเอง)
        ctx.eventSource.on(ctx.eventTypes.APP_READY, () => {
            if (getSetting("cssLayer") === "top") reorderToTop();
        });

        console.log(`[${extensionName}] ✅ โหลดสำเร็จ`);
    } catch (error) {
        console.error(`[${extensionName}] ❌ โหลดไม่สำเร็จ:`, error);
        toastr.error("TinyMobile โหลดไม่สำเร็จ (ดู console)", "TinyMobile");
    }
});
