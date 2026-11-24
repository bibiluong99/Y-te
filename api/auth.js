// ============================================================
// API: AUTHENTICATION (JWT + bcryptjs + Rate Limiting)
// ============================================================

const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();
const db = require('../db');
const { signToken, requireAuth } = require('../middleware/auth');
const { loginLimiter } = require('../middleware/rateLimiter');

const BCRYPT_ROUNDS = 10;

function isBcryptHash(val) {
  return typeof val === 'string' && /^\$2[aby]\$\d{2}\$/.test(val);
}

async function verifyPassword(plainPassword, storedPassword) {
  if (!storedPassword) return false;
  if (isBcryptHash(storedPassword)) {
    return bcrypt.compare(plainPassword, storedPassword);
  }
  return storedPassword === plainPassword;
}

// POST /api/auth/login
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { username, password } = req.body || {};

    if (!username || !password) {
      return res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
    }

    const cleanUsername = String(username).trim();
    let user = await db.get("SELECT * FROM users WHERE username = ?", [cleanUsername]);

    if (!user) {
      const defaultUser = process.env.DEFAULT_ADMIN_USER || 'admin';
      const defaultPass = process.env.DEFAULT_ADMIN_PASSWORD || 'admin123';
      if (cleanUsername === defaultUser && password === defaultPass) {
        const hashed = await bcrypt.hash(defaultPass, BCRYPT_ROUNDS);
        user = { id: 1, username: defaultUser, password: hashed, fullname: 'Quản Trị Viên An Phúc', role: 'Super Admin' };
      } else {
        return res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không chính xác!' });
      }
    } else {
      const matched = await verifyPassword(password, user.password);
      if (!matched) {
        return res.status(401).json({ success: false, message: 'Tài khoản hoặc mật khẩu không chính xác!' });
      }

      // Tự động nâng cấp mật khẩu plain-text cũ sang bcrypt hash sau khi đăng nhập đúng
      if (!isBcryptHash(user.password)) {
        try {
          const hashed = await bcrypt.hash(password, BCRYPT_ROUNDS);
          await db.run("UPDATE users SET password = ? WHERE username = ?", [hashed, cleanUsername]);
        } catch (upgradeErr) {
          console.warn('⚠️ Không thể nâng cấp hash mật khẩu:', upgradeErr.message);
        }
      }
    }

    const token = signToken(user);
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
    console.error('Lỗi đăng nhập:', error.message);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// GET /api/auth/me (Bắt buộc JWT hợp lệ)
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await db.get("SELECT id, username, fullname, role FROM users WHERE username = ?", [req.user.username]);
    res.json({
      success: true,
      user: user || { id: req.user.id, username: req.user.username, role: req.user.role }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
  }
});

// POST /api/auth/change-password (Bắt buộc JWT hợp lệ, hash bằng bcryptjs)
router.post('/change-password', requireAuth, async (req, res) => {
  try {
    const { oldPassword, newPassword, confirmPassword } = req.body || {};
    const targetUser = req.user.username;

    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'Vui lòng điền đầy đủ mật khẩu cũ và mật khẩu mới!' });
    }

    if (String(newPassword).length < 6) {
      return res.status(400).json({ success: false, message: 'Mật khẩu mới phải có ít nhất 6 ký tự!' });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({ success: false, message: 'Xác nhận mật khẩu mới không khớp!' });
    }

    const user = await db.get("SELECT * FROM users WHERE username = ?", [targetUser]);
    if (!user) {
      return res.status(404).json({ success: false, message: 'Tài khoản không tồn tại!' });
    }

    const matched = await verifyPassword(oldPassword, user.password);
    if (!matched) {
      return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không chính xác!' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, BCRYPT_ROUNDS);
    await db.run("UPDATE users SET password = ? WHERE username = ?", [hashedPassword, targetUser]);

    res.json({
      success: true,
      message: 'Cập nhật mật khẩu thành công! Vui lòng ghi nhớ mật khẩu mới của bạn.'
    });
  } catch (error) {
    console.error('Lỗi đổi mật khẩu:', error);
    res.status(500).json({ success: false, message: 'Lỗi máy chủ khi đổi mật khẩu' });
  }
});

module.exports = router;
