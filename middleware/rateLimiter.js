// ============================================================
// MIDDLEWARE: RATE LIMITING
// ============================================================

const rateLimit = require('express-rate-limit');

const isTestEnv = process.env.NODE_ENV === 'test';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: isTestEnv ? 1000 : 15,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Quá nhiều lần đăng nhập thất bại. Vui lòng thử lại sau 15 phút.'
  }
});

const publicFormLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 phút
  max: isTestEnv ? 1000 : 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: 'Bạn gửi yêu cầu quá nhanh. Vui lòng thử lại sau ít phút.'
  }
});

module.exports = {
  loginLimiter,
  publicFormLimiter
};
