// ============================================================
// SERVER.JS - Express Server (Security + Compression + Technical SEO)
// Phòng Khám Đa Khoa An Phúc
// ============================================================

require('dotenv').config();

const express = require('express');
const path = require('path');
const cors = require('cors');
const fs = require('fs');
const helmet = require('helmet');
const compression = require('compression');
const db = require('./db');
const {
  getBaseUrl,
  buildRobotsTxt,
  buildSitemapXml,
  renderNewsDetailWithSeo,
  renderServiceDetailWithSeo
} = require('./utils/seo');

const app = express();
const PORT = process.env.PORT || 3000;
const PUBLIC_DIR = path.join(__dirname, 'public');

// Security headers (giữ tương thích CDN / inline handlers của frontend tĩnh)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginEmbedderPolicy: false
}));

// Nén Gzip/Deflate tối ưu tốc độ tải trang (Core Web Vitals)
app.use(compression());

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

// Chặn bot tìm kiếm index trang quản trị và API
app.use(['/admin', '/api'], (req, res, next) => {
  res.setHeader('X-Robots-Tag', 'noindex, nofollow');
  next();
});

// ============================================================
// TECHNICAL SEO ROUTES (robots.txt, dynamic sitemap.xml, SSR Meta)
// ============================================================
app.get('/robots.txt', (req, res) => {
  res.type('text/plain; charset=utf-8');
  res.send(buildRobotsTxt(getBaseUrl(req)));
});

app.get('/sitemap.xml', async (req, res) => {
  try {
    const xml = await buildSitemapXml(getBaseUrl(req), db);
    res.type('application/xml; charset=utf-8');
    res.setHeader('Cache-Control', 'public, max-age=1800');
    res.send(xml);
  } catch (err) {
    console.error('Lỗi tạo sitemap.xml:', err.message);
    res.status(500).type('text/plain').send('Error generating sitemap');
  }
});

// Server-side SEO meta & JSON-LD cho trang Chi tiết Tin tức (hỗ trợ Googlebot & chia sẻ Facebook/Zalo)
app.get('/chi-tiet-tin-tuc.html', async (req, res) => {
  try {
    const html = await renderNewsDetailWithSeo(req, db, PUBLIC_DIR);
    res.type('text/html; charset=utf-8').send(html);
  } catch (err) {
    res.sendFile(path.join(PUBLIC_DIR, 'chi-tiet-tin-tuc.html'));
  }
});

// Server-side SEO meta & JSON-LD cho trang Chi tiết Dịch vụ
app.get('/chi-tiet-dich-vu.html', async (req, res) => {
  try {
    const html = await renderServiceDetailWithSeo(req, db, PUBLIC_DIR);
    res.type('text/html; charset=utf-8').send(html);
  } catch (err) {
    res.sendFile(path.join(PUBLIC_DIR, 'chi-tiet-dich-vu.html'));
  }
});

// Static files từ thư mục public
app.use(express.static(PUBLIC_DIR, { maxAge: '1d' }));
app.use('/admin/images', express.static(path.join(PUBLIC_DIR, 'images'), { maxAge: '7d' }));

// Gắn API routes
const apiRoutes = require('./api');
app.use('/api', (req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
}, apiRoutes);

// Định tuyến trang quản trị
app.get('/admin', (req, res) => {
  res.sendFile(path.join(PUBLIC_DIR, 'admin', 'index.html'));
});

// Chuẩn hóa URL bằng 301 Redirect tránh trùng lặp nội dung SEO
const canonicalRedirects = {
  '/san-pham': '/san-pham.html',
  '/dich-vu': '/dich-vu.html',
  '/chi-tiet-dich-vu': '/chi-tiet-dich-vu.html',
  '/chi-tiet-tin-tuc': '/chi-tiet-tin-tuc.html',
  '/chuyen-khoa': '/chuyen-khoa.html',
  '/doi-ngu-bac-si': '/doi-ngu-bac-si.html',
  '/tin-tuc': '/tin-tuc.html',
  '/dat-lich-kham': '/dat-lich-kham.html',
  '/lien-he': '/lien-he.html'
};

Object.entries(canonicalRedirects).forEach(([shortPath, targetPath]) => {
  app.get(shortPath, (req, res) => {
    const qs = req.url.includes('?') ? req.url.slice(req.url.indexOf('?')) : '';
    res.redirect(301, `${targetPath}${qs}`);
  });
});

// Fallback mọi route trang về public
app.get('*', (req, res) => {
  const filePath = path.join(PUBLIC_DIR, req.path);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
    return res.sendFile(filePath);
  }
  res.sendFile(path.join(PUBLIC_DIR, 'index.html'));
});

// Khởi chạy server khi chạy trực tiếp
if (require.main === module) {
  app.listen(PORT, () => {
    console.log('============================================================');
    console.log('🏥 HỆ THỐNG WEBSITE PHÒNG KHÁM ĐA KHOA AN PHÚC ĐANG CHẠY');
    console.log(`🚀 Trang chủ website: http://localhost:${PORT}`);
    console.log(`🗺️ Sitemap SEO: http://localhost:${PORT}/sitemap.xml`);
    console.log(`🤖 Robots.txt: http://localhost:${PORT}/robots.txt`);
    console.log(`🔐 Trang quản trị Admin: http://localhost:${PORT}/admin`);
    console.log('============================================================');
  });
}

module.exports = app;
