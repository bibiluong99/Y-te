// ============================================================
// AUTOMATED API & SECURITY TEST SUITE (Node built-in test runner)
// Chạy bằng: npm test
// ============================================================

process.env.NODE_ENV = 'test';
process.env.DB_MODE = 'fallback';
process.env.JWT_SECRET = 'test-super-secret-jwt-key-for-an-phuc-clinic-2026';

const { describe, it, before, after } = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

const app = require('../server');

let server;
let baseUrl;
let adminToken;
let originalFallbackBackup;
const fallbackPath = path.join(__dirname, '..', 'db_fallback_data.json');

// 1x1 PNG hợp lệ (magic bytes chuẩn 89 50 4E 47)
const VALID_1X1_PNG_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII=';

async function req(method, urlPath, { body, token } = {}) {
  const headers = {};
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${baseUrl}${urlPath}`, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  const text = await res.text();
  let json = null;
  try { json = JSON.parse(text); } catch (_) {}
  return { status: res.status, json, text };
}

describe('Phòng Khám Đa Khoa An Phúc — Security, Bug Fixes & API Tests', () => {
  before(async () => {
    if (fs.existsSync(fallbackPath)) {
      originalFallbackBackup = fs.readFileSync(fallbackPath, 'utf8');
    }
    server = http.createServer(app);
    await new Promise(resolve => server.listen(0, '127.0.0.1', resolve));
    const { port } = server.address();
    baseUrl = `http://127.0.0.1:${port}`;
  });

  after(async () => {
    await new Promise(resolve => server.close(resolve));
    if (originalFallbackBackup !== undefined) {
      fs.writeFileSync(fallbackPath, originalFallbackBackup, 'utf8');
    }
  });

  it('GET /api/health trả về status ok', async () => {
    const res = await req('GET', '/api/health');
    assert.equal(res.status, 200);
    assert.equal(res.json.status, 'ok');
  });

  it('Chặn truy cập API quản trị & dữ liệu bệnh nhân khi chưa đăng nhập (401)', async () => {
    const protectedCalls = [
      ['GET', '/api/appointments'],
      ['GET', '/api/contacts'],
      ['GET', '/api/auth/me'],
      ['POST', '/api/products', { name: 'Test', price: 1000 }],
      ['POST', '/api/news', { title: 'Test' }],
      ['POST', '/api/services/reset'],
      ['PUT', '/api/settings', { hotline: '0000' }]
    ];

    for (const [method, urlPath, body] of protectedCalls) {
      const res = await req(method, urlPath, { body });
      assert.equal(res.status, 401, `Expected 401 for ${method} ${urlPath}, got ${res.status}`);
    }
  });

  it('POST /api/auth/login sai mật khẩu bị 401, đúng mật khẩu trả về JWT hợp lệ', async () => {
    const bad = await req('POST', '/api/auth/login', {
      body: { username: 'admin', password: 'wrongpassword' }
    });
    assert.equal(bad.status, 401);

    const ok = await req('POST', '/api/auth/login', {
      body: { username: 'admin', password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123' }
    });
    assert.equal(ok.status, 200);
    assert.equal(ok.json.success, true);
    assert.equal(ok.json.token.split('.').length, 3, 'Token phải là chuẩn JWT (3 phần)');
    adminToken = ok.json.token;

    const me = await req('GET', '/api/auth/me', { token: adminToken });
    assert.equal(me.status, 200);
    assert.equal(me.json.user.username, 'admin');
  });

  it('Upload ảnh: chặn file giả mạo HTML/SVG (400) và cho phép ảnh PNG hợp lệ (200)', async () => {
    const fakeHtml = await req('POST', '/api/news/upload-image', {
      token: adminToken,
      body: {
        fileName: 'evil.html',
        fileData: 'data:text/html;base64,' + Buffer.from('<script>alert(1)</script>').toString('base64')
      }
    });
    assert.equal(fakeHtml.status, 400);

    const fakePngMagic = await req('POST', '/api/news/upload-image', {
      token: adminToken,
      body: {
        fileName: 'spoof.png',
        fileData: 'data:image/png;base64,' + Buffer.from('not-a-real-png-file-at-all').toString('base64')
      }
    });
    assert.equal(fakePngMagic.status, 400);

    const validPng = await req('POST', '/api/news/upload-image', {
      token: adminToken,
      body: {
        fileName: 'valid_test.png',
        fileData: VALID_1X1_PNG_DATA_URL
      }
    });
    assert.equal(validPng.status, 200);
    assert.equal(validPng.json.success, true);
    assert.match(validPng.json.imageUrl, /^images\/uploads\/news_body_.*\.png$/);

    // Dọn dẹp file ảnh vừa upload trong test
    const uploadedPath = path.join(__dirname, '..', 'public', validPng.json.imageUrl);
    if (fs.existsSync(uploadedPath)) fs.unlinkSync(uploadedPath);
  });

  it('CRUD Sản phẩm & Tin tức (bao gồm PUT không còn lỗi cột updated_at)', async () => {
    const createProd = await req('POST', '/api/products', {
      token: adminToken,
      body: { name: 'Máy đo test', price: 250000, stock: 10 }
    });
    assert.equal(createProd.status, 201);
    const prodId = createProd.json.product.id;

    const updateProd = await req('PUT', `/api/products/${prodId}`, {
      token: adminToken,
      body: { name: 'Máy đo test đã sửa', price: 300000, stock: 20, status: 'active' }
    });
    assert.equal(updateProd.status, 200);
    assert.equal(updateProd.json.success, true);

    const delProd = await req('DELETE', `/api/products/${prodId}`, { token: adminToken });
    assert.equal(delProd.status, 200);

    const createNews = await req('POST', '/api/news', {
      token: adminToken,
      body: { title: 'Bài viết test', content: 'Nội dung test' }
    });
    assert.equal(createNews.status, 201);
    const newsId = createNews.json.news.id;

    const updateNews = await req('PUT', `/api/news/${newsId}`, {
      token: adminToken,
      body: { title: 'Bài viết test đã sửa', content: 'Nội dung mới' }
    });
    assert.equal(updateNews.status, 200);

    const delNews = await req('DELETE', `/api/news/${newsId}`, { token: adminToken });
    assert.equal(delNews.status, 200);
  });

  it('Đặt lịch khám công khai + chặn đặt trùng lịch bác sĩ + Admin duyệt lịch', async () => {
    const apptPayload = {
      patient_name: 'Nguyễn Văn Test',
      phone: '0909123456',
      doctor: 'BS. Nguyễn Văn Minh',
      appointment_date: '2099-12-31',
      appointment_time: '08:00 - 09:00'
    };

    const first = await req('POST', '/api/appointments', { body: apptPayload });
    assert.equal(first.status, 201);
    const apptId = first.json.appointment.id;

    const dup = await req('POST', '/api/appointments', { body: apptPayload });
    assert.equal(dup.status, 400);
    assert.equal(dup.json.error, 'doctor_busy');

    const badStatus = await req('PUT', `/api/appointments/${apptId}/status`, {
      token: adminToken,
      body: { status: 'hacked_status' }
    });
    assert.equal(badStatus.status, 400);

    const confirm = await req('PUT', `/api/appointments/${apptId}/confirm`, { token: adminToken });
    assert.equal(confirm.status, 200);

    const del = await req('DELETE', `/api/appointments/${apptId}`, { token: adminToken });
    assert.equal(del.status, 200);
  });

  it('SEO: /robots.txt, /sitemap.xml động, X-Robots-Tag trên /admin và SSR meta bài viết', async () => {
    const robots = await req('GET', '/robots.txt');
    assert.equal(robots.status, 200);
    assert.match(robots.text, /Disallow:\s*\/admin/);
    assert.match(robots.text, /Sitemap:\s*http.*\/sitemap\.xml/);

    const sitemap = await req('GET', '/sitemap.xml');
    assert.equal(sitemap.status, 200);
    assert.match(sitemap.text, /<urlset/);
    assert.match(sitemap.text, /dich-vu\.html/);

    const adminRes = await fetch(`${baseUrl}/admin`);
    assert.equal(adminRes.headers.get('x-robots-tag'), 'noindex, nofollow');

    const newsList = await req('GET', '/api/news');
    if (Array.isArray(newsList.json) && newsList.json.length > 0) {
      const sample = newsList.json[0];
      const detail = await req('GET', `/chi-tiet-tin-tuc.html?id=${sample.id}`);
      assert.equal(detail.status, 200);
      assert.match(detail.text, /property="og:title"/);
      assert.match(detail.text, /application\/ld\+json/);
      assert.ok(detail.text.includes(sample.title), 'HTML bài viết phải chứa tiêu đề động cho bot SEO');
    }
  });
});
