// ============================================================
// API: SETTINGS (Cấu hình Website & Logo Header / Footer)
// Phòng Khám Đa Khoa An Phúc
// ============================================================

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../db');

const defaultSettings = [
  { key: 'header_logo', value: 'images/logo.png' },
  { key: 'footer_logo', value: 'images/logo-white.png' },
  { key: 'site_title', value: 'Phòng Khám Đa Khoa An Phúc' },
  { key: 'hotline', value: '1900 1234' },
  { key: 'phone', value: '0764333998' },
  { key: 'email', value: 'contact@anphuc.vn' },
  { key: 'address', value: 'Số 123 Nguyễn Văn Cừ, Quận 1, TP.HCM' },
  { key: 'working_hours_text', value: 'Thứ 2 – Chủ nhật, 8:00 – 20:00' },
  { key: 'facebook_url', value: 'https://facebook.com/phongkhamanphuc' },
  { key: 'zalo_url', value: 'https://zalo.me/19001234' },
  { key: 'instagram_url', value: 'https://instagram.com/phongkhamanphuc' },
  { key: 'youtube_url', value: 'https://youtube.com/@phongkhamanphuc' },
  {
    key: 'working_hours_slots', value: JSON.stringify([
      { id: 1, time: '08:00 - 09:00', period: 'Sáng', active: true },
      { id: 2, time: '09:00 - 10:00', period: 'Sáng', active: true },
      { id: 3, time: '10:00 - 11:00', period: 'Sáng', active: true },
      { id: 4, time: '11:00 - 12:00', period: 'Sáng', active: true },
      { id: 5, time: '13:30 - 14:30', period: 'Chiều', active: true },
      { id: 6, time: '14:30 - 15:30', period: 'Chiều', active: true },
      { id: 7, time: '15:30 - 16:30', period: 'Chiều', active: true },
      { id: 8, time: '16:30 - 17:30', period: 'Chiều', active: true },
      { id: 9, time: '17:30 - 18:30', period: 'Tối', active: true },
      { id: 10, time: '18:30 - 19:30', period: 'Tối', active: true },
      { id: 11, time: '19:30 - 20:00', period: 'Tối', active: true }
    ])
  }
];

async function ensureSettingsTable() {
  try {
    await db.run(`
      CREATE TABLE IF NOT EXISTS settings (
        key TEXT PRIMARY KEY,
        value TEXT NOT NULL,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    for (const s of defaultSettings) {
      const existing = await db.get("SELECT key FROM settings WHERE key = ?", [s.key]);
      if (!existing) {
        await db.run("INSERT INTO settings (key, value) VALUES (?, ?)", [s.key, s.value]);
      }
    }
  } catch (err) {
    console.warn('⚠️ Lỗi tạo bảng settings:', err.message);
  }
}

// Khởi tạo bảng settings khi tải module
ensureSettingsTable();

// GET /api/settings - Lấy toàn bộ cấu hình website
router.get('/', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const rows = await db.all("SELECT key, value FROM settings");
    const settingsMap = {};
    for (const item of defaultSettings) {
      settingsMap[item.key] = item.value;
    }
    if (rows && rows.length > 0) {
      for (const r of rows) {
        if (r && r.key && r.value !== undefined && r.value !== null && typeof r.key === 'string' && !r.key.startsWith('[')) {
          settingsMap[r.key] = r.value;
        }
      }
    }
    res.json(settingsMap);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/settings/upload-logo - Tải lên logo Header hoặc Footer
router.post('/upload-logo', async (req, res) => {
  try {
    const { type, fileName, fileData } = req.body;

    if (!fileData) {
      return res.status(400).json({ error: 'Chưa có dữ liệu file ảnh logo!' });
    }

    const logoType = (type === 'footer') ? 'footer' : 'header';
    const settingKey = logoType === 'footer' ? 'footer_logo' : 'header_logo';

    // Xử lý base64
    const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer;
    if (matches && matches.length === 3) {
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(fileData, 'base64');
    }

    const cleanOrigName = (fileName || 'logo.png').replace(/[^a-zA-Z0-9_.-]/g, '_');
    const finalFileName = `logo_${logoType}_${Date.now()}_${cleanOrigName}`;

    // Thư mục uploads
    const uploadDirPublic = path.join(__dirname, '../public/images/uploads');

    if (!fs.existsSync(uploadDirPublic)) {
      fs.mkdirSync(uploadDirPublic, { recursive: true });
    }

    const publicPath = path.join(uploadDirPublic, finalFileName);
    fs.writeFileSync(publicPath, buffer);

    const relativeUrl = `images/uploads/${finalFileName}`;

    // Cập nhật vào SQLite
    await db.run(
      `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
       ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
      [settingKey, relativeUrl]
    );

    res.json({
      success: true,
      message: `Đã tải lên và cập nhật thành công Logo ${logoType === 'footer' ? 'Footer (Chân trang)' : 'Header (Đầu trang)'}!`,
      imageUrl: relativeUrl,
      type: logoType,
      key: settingKey
    });
  } catch (err) {
    console.error('Lỗi upload logo:', err);
    res.status(500).json({ error: 'Lỗi tải ảnh logo: ' + err.message });
  }
});

// POST /api/settings/schedule - Cập nhật cấu hình thời gian làm việc & khung giờ khám
router.post('/schedule', async (req, res) => {
  try {
    const { working_hours_text, working_hours_slots, hotline } = req.body;
    if (working_hours_text !== undefined) {
      await db.run(
        `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
        ['working_hours_text', String(working_hours_text)]
      );
    }
    if (hotline !== undefined) {
      await db.run(
        `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
        ['hotline', String(hotline)]
      );
    }
    if (working_hours_slots !== undefined) {
      const val = typeof working_hours_slots === 'string' ? working_hours_slots : JSON.stringify(working_hours_slots);
      await db.run(
        `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
        ['working_hours_slots', val]
      );
    }
    res.json({ success: true, message: 'Đã lưu cấu hình thời gian khám thành công!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/settings - Cập nhật các thông số cài đặt
router.put('/', async (req, res) => {
  try {
    const data = req.body;
    for (const [k, v] of Object.entries(data)) {
      const valStr = (typeof v === 'object' && v !== null) ? JSON.stringify(v) : String(v);
      await db.run(
        `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, CURRENT_TIMESTAMP)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = CURRENT_TIMESTAMP`,
        [k, valStr]
      );
    }
    res.json({ success: true, message: 'Đã lưu cấu hình website thành công!' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
