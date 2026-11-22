// ============================================================
// API: CONTACTS (Liên hệ từ khách hàng)
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/contacts
router.get('/', async (req, res) => {
  try {
    let contacts = [];
    try {
      contacts = await db.all("SELECT * FROM contacts ORDER BY id DESC");
    } catch (e) {
      const store = db.getStore();
      contacts = store.contacts || [];
    }
    res.json(contacts);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/contacts
router.post('/', async (req, res) => {
  try {
    const { name, phone, email, message } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Họ tên và số điện thoại là bắt buộc' });
    }

    const newContact = {
      name,
      phone,
      email: email || '',
      message: message || '',
      status: 'new',
      created_at: new Date().toLocaleDateString('vi-VN')
    };

    try {
      const result = await db.run(
        "INSERT INTO contacts (name, phone, email, message, status, created_at) VALUES (?, ?, ?, ?, ?, ?)",
        [newContact.name, newContact.phone, newContact.email, newContact.message, newContact.status, newContact.created_at]
      );
      newContact.id = result.lastID;
    } catch (err) {
      const store = db.getStore();
      newContact.id = Date.now();
      store.contacts.unshift(newContact);
      db.saveStore();
    }

    res.status(201).json({ success: true, message: 'Gửi tin nhắn liên hệ thành công', contact: newContact });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/contacts/:id
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    const newStatus = status || 'replied';

    try {
      await db.run("UPDATE contacts SET status = ? WHERE id = ?", [newStatus, id]);
    } catch (err) {
      const store = db.getStore();
      if (store.contacts) {
        const item = store.contacts.find(c => c.id == id);
        if (item) {
          item.status = newStatus;
          db.saveStore();
        }
      }
    }

    res.json({ success: true, message: 'Đã cập nhật trạng thái liên hệ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/contacts/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    try {
      await db.run("DELETE FROM contacts WHERE id = ?", [id]);
    } catch (err) {
      const store = db.getStore();
      if (store.contacts) {
        store.contacts = store.contacts.filter(c => c.id != id);
        db.saveStore();
      }
    }
    res.json({ success: true, message: 'Đã xóa thư liên hệ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
