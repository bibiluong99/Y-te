// ============================================================
// API: CONTACTS (Liên hệ từ khách hàng)
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { publicFormLimiter } = require('../middleware/rateLimiter');

const ALLOWED_CONTACT_STATUSES = new Set(['new', 'read', 'replied', 'archived']);

// GET /api/contacts (Admin - bảo vệ dữ liệu cá nhân khách hàng)
router.get('/', requireAuth, async (req, res) => {
  try {
    const contacts = await db.all("SELECT * FROM contacts ORDER BY id DESC");
    res.json(contacts);
  } catch (err) {
    console.error('Lỗi GET /api/contacts:', err.message);
    res.status(500).json({ error: 'Không thể tải danh sách liên hệ' });
  }
});

// POST /api/contacts (Công khai - giới hạn tần suất chống spam)
router.post('/', publicFormLimiter, async (req, res) => {
  try {
    const { name, phone, email, message } = req.body || {};
    if (!name || !String(name).trim() || !phone || !String(phone).trim()) {
      return res.status(400).json({ error: 'Họ tên và số điện thoại là bắt buộc' });
    }

    const newContact = {
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: email ? String(email).trim() : '',
      message: message ? String(message).trim() : '',
      status: 'new',
      created_at: new Date().toISOString()
    };

    const result = await db.run(
      "INSERT INTO contacts (name, phone, email, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
      [newContact.name, newContact.phone, newContact.email, newContact.message, newContact.status, newContact.created_at]
    );
    newContact.id = result.lastID;

    res.status(201).json({ success: true, message: 'Gửi tin nhắn liên hệ thành công', contact: newContact });
  } catch (err) {
    console.error('Lỗi POST /api/contacts:', err.message);
    res.status(500).json({ error: 'Không thể gửi tin nhắn liên hệ' });
  }
});

// PUT /api/contacts/:id (Admin)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body || {};
    const newStatus = status || 'replied';

    if (!ALLOWED_CONTACT_STATUSES.has(newStatus)) {
      return res.status(400).json({ error: 'Trạng thái liên hệ không hợp lệ' });
    }

    await db.run("UPDATE contacts SET status = ? WHERE id = ?", [newStatus, id]);
    res.json({ success: true, message: 'Đã cập nhật trạng thái liên hệ' });
  } catch (err) {
    console.error('Lỗi PUT /api/contacts/:id:', err.message);
    res.status(500).json({ error: 'Không thể cập nhật trạng thái liên hệ' });
  }
});

// DELETE /api/contacts/:id (Admin)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.run("DELETE FROM contacts WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: 'Đã xóa thư liên hệ' });
  } catch (err) {
    console.error('Lỗi DELETE /api/contacts/:id:', err.message);
    res.status(500).json({ error: 'Không thể xóa thư liên hệ' });
  }
});

module.exports = router;
