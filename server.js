// ============================================================
// SERVER.JS - Express Server
// Phòng Khám Đa Khoa An Phúc
// ============================================================

const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Static files từ thư mục public
app.use(express.static(path.join(__dirname, 'public')));
app.use('/admin/images', express.static(path.join(__dirname, 'public', 'images')));

// Gắn API routes
const apiRoutes = require('./api');
app.use('/api', apiRoutes);

// Định tuyến thân thiện
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin', 'index.html'));
});

// Trang Sản phẩm y tế
app.get('/san-pham', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'san-pham.html'));
});

// Trang Dịch vụ y tế
app.get('/dich-vu', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'dich-vu.html'));
});

// Trang Chi tiết dịch vụ y tế
app.get('/chi-tiet-dich-vu', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chi-tiet-dich-vu.html'));
});

// Trang Chuyên khoa y tế
app.get('/chuyen-khoa', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chuyen-khoa.html'));
});

// Fallback mọi route trang về public
app.get('*', (req, res) => {
  const filePath = path.join(__dirname, 'public', req.path);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Khởi chạy server khi chạy trực tiếp
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('============================================================');
    console.log('🏥 HỆ THỐNG WEBSITE PHÒNG KHÁM ĐA KHOA AN PHÚC ĐANG CHẠY');
    console.log(`🚀 Trang chủ website: http://localhost:${PORT}`);
    console.log(`🩺 Trang Dịch vụ y tế: http://localhost:${PORT}/dich-vu.html`);
    console.log(`📦 Trang Sản phẩm y tế: http://localhost:${PORT}/san-pham.html`);
    console.log(`🔐 Trang quản trị Admin: http://localhost:${PORT}/admin`);
    console.log('👤 Tài khoản admin: admin | Mật khẩu: admin123');
    console.log(`📡 API Endpoints: http://localhost:${PORT}/api/services`);
    console.log('============================================================');
  });
}

module.exports = app;
