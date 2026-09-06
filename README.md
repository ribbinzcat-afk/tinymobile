# TinyMobile

Extension สำหรับ SillyTavern — ปรับหน้าตาแชทให้เข้ากับมือถือ (ข้อความกว้างเต็มบับเบิ้ล), เร่งความลื่นไหลของแชทยาวๆ ด้วยเทคนิค `content-visibility`, และซ่อมจุดที่ SillyTavern เขียนสีตายตัวไว้ให้เดินตามธีมที่เลือกในแผงตั้งค่าจริงๆ (ยุบรวมฟีเจอร์จาก TinyTheme เข้ามาแล้ว) — ใช้กับธีมพื้นฐานของ SillyTavern ได้เลย ไม่ต้องพึ่ง Custom CSS

## ทำไมถึงมี extension นี้

เล่น SillyTavern บนมือถือแล้วเจอ 3 อาการ:

1. **ข้อความไม่เต็มบับเบิ้ล** — โครงสร้าง `.mes` ของ SillyTavern จองพื้นที่ให้อวตารข้างข้อความเสมอ บนจอแคบเหลือพื้นที่ข้อความจริงแค่ ~70% ของบับเบิ้ล
2. **หน่วงเวลาแชทยาว** — ทุกข้อความในแชท (ค่าเริ่มต้นสูงสุด 100 ข้อความ) ถูกคำนวณ layout ตลอดเวลาแม้จะเลื่อนพ้นจอไปแล้ว โดยเฉพาะช่วง AI กำลังพิมพ์ (streaming)
3. **ปรับสีธีมแล้วบางจุดไม่เปลี่ยนตาม** — กล่องกรอกข้อความ, หัวข้อ drawer, สไลเดอร์, หน้า preset ฯลฯ ถูกเขียนด้วยสีดำ/ขาวตายตัวในซอร์สของ SillyTavern เอง ไม่ได้อิงตัวแปรธีม (`--SmartTheme*`) เหมือนส่วนอื่น — เปลี่ยนธีมแล้วจุดพวกนี้เลยค้างสีเดิม

TinyMobile แก้ทั้ง 3 อย่างด้วย CSS/JS ที่ฉีดเพิ่มเข้าไปเท่านั้น **ไม่แก้ไฟล์ต้นฉบับของ SillyTavern**

## ติดตั้ง

1. วางโฟลเดอร์ `tinymobile/` (หรือ symlink) ไว้ที่ `SillyTavern/public/scripts/extensions/third-party/tinymobile`
2. รีเฟรชหน้าเว็บ SillyTavern
3. เปิดสวิตช์ "เปิดใช้งาน TinyMobile" ในหน้า Extensions

## ฟีเจอร์หลัก

### 1. เลย์เอาต์ข้อความเต็มบับเบิ้ล
- ย้ายอวตารไปอยู่แถวเดียวกับชื่อ (ไม่ซ่อน) แล้วให้ข้อความกินความกว้างเต็มบับเบิ้ล — วัดได้ ~95% ของความกว้างบับเบิ้ล เทียบกับ ~70% แบบเดิม
- ปรับขนาดอวตารในแชทได้ (px)
- ปรับระยะขอบซ้าย/ขวา/บนของบับเบิ้ลได้ (ระยะขอบล่างของข้อความล่าสุดตรึงไว้ไม่ให้ปุ่มสไวป์ทับตัวหนังสือ)
- ทำงานได้ครบทั้ง 3 โหมดแสดงผลของ SillyTavern (Flat / Bubble / Document)
- รองรับแชทกลุ่ม (อวตารรวมหลายรูป) และธีมอื่นที่ติดตั้งเพิ่ม
- เลือกได้ว่าให้ทำงานเฉพาะจอแคบ (≤1000px, ค่าเริ่มต้น), ทุกขนาดจอ, หรือปิดชั่วคราว
- ตัวเลือก "ลำดับชั้น CSS" — ค่าเริ่มต้นให้ CSS/ธีมที่ผู้ใช้แก้เองชนะเสมอ หรือจะบังคับให้ของ TinyMobile ชนะทุกอย่างก็ได้

### 2. ประสิทธิภาพ (perf)
- **content-visibility** — ข้ามการวาด/คำนวณ layout ของข้อความที่เลื่อนพ้นจอไปแล้ว วัดผลจริงได้เร็วขึ้นถึง ~40 เท่าในการ reflow ระหว่างเลื่อนแชทยาว โดยยังคง scroll position ถูกต้องเมื่อโหลดข้อความเก่าเพิ่มหรือแก้ไข/สไวป์ข้อความ
- ลดการใช้ `filter: drop-shadow` และ `text-shadow` ที่แพงในแชท
- จำกัดขอบเขตการคำนวณ layout ต่อข้อความด้วย CSS `contain`
- ลดแอนิเมชัน/transition ในแชท (ตัวเลือกแยก)
- รองรับการหมุนจอ/เปลี่ยนขนาดหน้าต่าง — คำนวณใหม่ให้อัตโนมัติ

### 3. สีตามธีม SillyTavern (ยุบมาจาก TinyTheme)
ซ่อมจุดที่ SillyTavern เขียนสีตายตัวในซอร์สโดยตรง ให้เดินตามตัวแปรธีม (`--SmartThemeBodyColor`, `--SmartThemeBlurTintColor` ฯลฯ) แทน ครอบคลุมทั้งแอป ไม่ใช่แค่ในแชท:
- กล่องกรอกข้อความ (input / textarea / select / dropdown)
- หัวข้อ drawer และหน้าตั้งค่า
- สไลเดอร์และหน้า preset manager
- หัวข้อ reasoning ในแชท

เปลี่ยนสีจากแผงตั้งค่าธีมของ SillyTavern เอง แล้วทุกจุดข้างต้นจะเปลี่ยนตามทันที ไม่ต้องเขียน Custom CSS อีก

> **หมายเหตุ:** ถ้าเคย export ธีมจาก TinyTheme ลงช่อง Custom CSS ของ SillyTavern ไว้ ตัว Custom CSS นั้นจะเขียนทับตัวแปรธีมด้วย `!important` และชนะ TinyMobile — ให้ลบเนื้อหาในช่อง Custom CSS ออก หรือสลับไปใช้ธีมพื้นฐานของ SillyTavern ก่อน แล้วปรับสีใหม่จากแผงตั้งค่าแทน extension จะเตือนในหน้าตั้งค่าถ้าตรวจพบว่ามีสิ่งนี้ทับอยู่

### 4. ตัวอักษร/ย่อหน้าในแชท (ยุบมาจาก TinyTheme)
ใช้เฉพาะกับข้อความในแชท ไม่กระทบตัวอักษรของ UI ส่วนอื่น:
- **ย่อหน้าเยื้อง** — เยื้องเฉพาะย่อหน้าจริง (เว้นบรรทัดว่าง 2 ครั้งขึ้นไป) ไม่กระทบการขึ้นบรรทัดใหม่ปกติ (`<br>`)
- **ขนาดตัวอักษร / ระยะบรรทัด** — ปรับแยกจากค่า UI หลักของ SillyTavern ได้ (0 = ใช้ค่าเดิมของ ST)
- **ฟอนต์เนื้อเรื่อง** — ฟอนต์ Google Fonts ที่รองรับภาษาไทย 10 แบบ (Sarabun, Noto Sans Thai, IBM Plex Sans Thai, Kanit, Prompt, Bai Jamjuree, Niramit, Maitree, Trirong, Mali) โหลดเฉพาะฟอนต์ที่เลือกจริง ไม่โหลดทั้งชุด

### 5. โหมดมือถือ (แก้ค่าตั้งค่าของ SillyTavern เอง)
ปุ่มแยกต่างหากที่ไปปรับค่าตั้งค่าจริงของ SillyTavern (ไม่ใช่แค่ CSS ของ TinyMobile) เพื่อลดงานตอน AI พิมพ์ให้มากขึ้นอีกขั้น เช่น ลดความถี่อัปเดตขณะพิมพ์ (streaming FPS), จำนวนข้อความสูงสุดในหน้าจอ, เงาข้อความ, แอนิเมชัน, ความเบลอ — **โชว์ตารางเปรียบเทียบค่าเดิม → ค่าใหม่ก่อนกดยืนยันเสมอ** และกด "คืนค่าเดิม" ได้ตลอดเวลา

## โครงสร้างโค้ด

```
tinymobile/
  manifest.json
  index.js               bootstrap — ผูก event, ประกอบชิ้นส่วนจาก src/
  settings.html
  style.css               สไตล์ของแผงตั้งค่าเท่านั้น
  src/
    store.js               ค่าเริ่มต้น + getter/setter ของ extension_settings
    css.js                  เลย์เอาต์ข้อความเต็มบับเบิ้ล (มือถือ)
    perf.js                 content-visibility sweep + hint การโหลดรูป
    theme-css.js            สีตามธีม SillyTavern (จากที่เคยเป็น TinyTheme)
    typography-css.js       ฟอนต์/ย่อหน้า/ขนาดตัวอักษรในแชท
    preset.js               "โหมดมือถือ" ที่แก้ power_user จริง
    ui/settings-ui.js       ผูก control ในหน้าตั้งค่า
```

## หมายเหตุความเข้ากันได้

- ไม่แก้ไฟล์ของ SillyTavern โดยตรง ทำงานผ่านการฉีด `<style>`/`class` เพิ่มเข้าไปเท่านั้น ปิดสวิตช์แล้วคืนสภาพเดิมได้ครบ
- ทดสอบกับ SillyTavern 1.18.0
- ถ้าใช้ extension ปรับ UI/ธีมตัวอื่นร่วมด้วย อาจมีจุดที่ CSS ชนกันได้ — ปรับตัวเลือก "ลำดับชั้น CSS" ในหน้าตั้งค่าเพื่อแก้ปัญหาลำดับการทับกัน

## License

Copyright (C) 2026 Apricity & Claude

TinyMobile is free software: you can redistribute it and/or modify it under the terms of the [GNU Affero General Public License v3.0](LICENSE) as published by the Free Software Foundation, either version 3 of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the [LICENSE](LICENSE) file for details.
