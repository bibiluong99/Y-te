// ============================================================
// API: AUTHENTICATION (admin / admin123)
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../db');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
    }

    // Kiểm tra tài khoản
    let user = null;
    try {
      user = await db.get("SELECT * FROM users WHERE username = ?", [username]);
    } catch (e) {
      // Fallback
      const store = db.getStore();
      user = store.users.find(u => u.username === username);
    }

    if (!user) {
      // Hardcoded check
      if (username === 'admin' && password === 'admin123') {
        user = { id: 1, username: 'admin', fullname: 'Quản Trị Viên An Phúc', role: 'Super Admin' };
      } else {
        return res.status(401).json({ success: false, message: 'Tài khoản không tồn tại!' });
      }
    }

    if (user.password && user.password !== password) {
      return res.status(401).json({ success: false, message: 'Mật khẩu không chính xác!' });
    }

    // Thành công
    const token = 'token_' + Buffer.from(`${user.username}_${Date.now()}`).toString('base64');
    const safeUser = {
      id: user.id,
      username: user.username,
      fullname: user.fullname || 'Quản Trị Viên',
      email: user.email || 'admin@anphuc.vn',
      role: user.role || 'Super Admin'
    };

    res.json({
      success: true,
      message: 'Đăng nhập thành công',
      token,
      user: safeUser
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ', error: error.message });
  }
});

// GET /api/auth/me
router.get('/me', (req, res) => {
  res.json({ success: true, user: { username: 'admin', role: 'Super Admin' } });
});

// POST /api/auth/change-password - Cập nhật mật khẩu Admin
router.post('/change-password', async (req, res) => {
  try {
    const { username, oldPassword, newPassword, confirmPassword } = req.body;
    const targetUser = username || 'admin';

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ mật khẩu cũ và mật khẩu mới!' });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự!' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Xác nhận mật khẩu mới không khớp!' });
    }

    // Kiểm tra user trong SQLite
    let user = null;
    try {
      user = await db.get("SELECT * FROM users WHERE username = ?", [targetUser]);
    } catch (e) {
      user = null;
    }

    if (!user) {
      return res.status(404).json({ success: false, message: 'Tài khoản không tồn tại!' });
    }

    if (user.password !== oldPassword) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác!' });
    }

    // Cập nhật mật khẩu trong SQLite
    await db.run("UPDATE users SET password = ? WHERE username = ?", [newPassword, targetUser]);

    res.json({
      success: true,
      message: 'Cập nhật mật khẩu thành công! Vui lòng ghi nhớ mật khẩu mới của bạn.'
    });
  } catch (error) {
    console.error('Lỗi đổi mật khẩu:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đổi mật khẩu', error: error.message });
  }
});

module.exports = router;
