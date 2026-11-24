// ============================================================
// MIDDLEWARE: JWT AUTHENTICATION & AUTHORIZATION
// ============================================================

const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const FALLBACK_DEV_SECRET = crypto.randomBytes(32).toString('hex');
let warnedSecret = false;

function getJwtSecret() {
  if (process.env.JWT_SECRET && process.env.JWT_SECRET.trim().length >= 16) {
    return process.env.JWT_SECRET.trim();
  }
  if (!warnedSecret) {
    warnedSecret = true;
    console.warn('⚠️ JWT_SECRET chưa được cấu hình (hoặc < 16 ký tự). Đang dùng khóa tạm thời cho phiên chạy này.');
  }
  return FALLBACK_DEV_SECRET;
}

function signToken(user) {
  const payload = {
    id: user.id,
    username: user.username,
    role: user.role || 'admin'
  };
  return jwt.sign(payload, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '12h'
  });
}

function verifyToken(token) {
  return jwt.verify(token, getJwtSecret());
}

function extractBearerToken(req) {
  const authHeader = req.headers.authorization || req.headers.Authorization || '';
  if (typeof authHeader === 'string' && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  return null;
}

function requireAuth(req, res, next) {
  const token = extractBearerToken(req);
  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Chưa đăng nhập hoặc thiếu token xác thực'
    });
  }

  try {
    const decoded = verifyToken(token);
    req.user = decoded;
    return next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError'
      ? 'Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại'
      : 'Token xác thực không hợp lệ';
    return res.status(401).json({ success: false, error: message });
  }
}

module.exports = {
  signToken,
  verifyToken,
  requireAuth
};
