// ============================================================
// API: NEWS & ARTICLES (Tin tức y tế)
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { saveBase64Image } = require('../utils/upload');

// Đảm bảo bảng news có cột updated_at trên DB cũ
(async () => {
  try { await db.run("ALTER TABLE news ADD COLUMN updated_at TEXT"); } catch (_) {}
})();

// GET /api/news
router.get('/', async (req, res) => {
  try {
    let news = await db.all("SELECT * FROM news ORDER BY id DESC");
    const { page, limit } = req.query;
    if (page !== undefined || limit !== undefined) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const start = (pageNum - 1) * limitNum;
      news = news.slice(start, start + limitNum);
    }
    res.json(news);
  } catch (err) {
    console.error('Lỗi GET /api/news:', err.message);
    res.status(500).json({ error: 'Không thể tải danh sách tin tức' });
  }
});

// GET /api/news/:id
router.get('/:id', async (req, res) => {
  try {
    const item = await db.get("SELECT * FROM news WHERE id = ?", [req.params.id]);
    if (!item) return res.status(404).json({ error: 'Bài viết không tồn tại' });
    res.json(item);
  } catch (err) {
    console.error('Lỗi GET /api/news/:id:', err.message);
    res.status(500).json({ error: 'Không thể tải chi tiết bài viết' });
  }
});

// POST /api/news/upload-image - Tải ảnh bài viết (Admin, xác thực định dạng an toàn)
router.post('/upload-image', requireAuth, async (req, res) => {
  try {
    const { fileName, fileData } = req.body || {};
    const { imageUrl } = saveBase64Image(fileData, fileName, 'news_body');
    res.json({ success: true, imageUrl });
  } catch (err) {
    const status = err.statusCode || 500;
    res.status(status).json({ error: err.message });
  }
});

// POST /api/news (Admin)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, category, author, summary, content, image, status } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Tiêu đề bài viết là bắt buộc' });
    }

    const newPost = {
      title: String(title).trim(),
      category: category || 'Kiến thức y khoa',
      author: author ? String(author).trim() : 'BS. An Phúc',
      summary: summary ? String(summary).trim() : '',
      content: content ? String(content).trim() : '',
      image: image ? String(image).trim() : 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400',
      created_at: new Date().toISOString(),
      status: status || 'active'
    };

    const result = await db.run(
      "INSERT INTO news (title, category, author, summary, content, image, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [newPost.title, newPost.category, newPost.author, newPost.summary, newPost.content, newPost.image, newPost.created_at, newPost.status]
    );
    newPost.id = result.lastID;

    res.status(201).json({ success: true, message: 'Đăng tin tức thành công', news: newPost });
  } catch (err) {
    console.error('Lỗi POST /api/news:', err.message);
    res.status(500).json({ error: 'Không thể đăng bài viết' });
  }
});

// PUT /api/news/:id (Admin)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const { title, category, author, summary, content, image } = req.body || {};
    if (!title || !String(title).trim()) {
      return res.status(400).json({ error: 'Tiêu đề bài viết là bắt buộc' });
    }

    await db.run(
      "UPDATE news SET title = ?, category = ?, author = ?, summary = ?, content = ?, image = ? WHERE id = ?",
      [String(title).trim(), category || 'Kiến thức y khoa', author || 'BS. An Phúc', summary || '', content || '', image || '', id]
    );

    res.json({ success: true, message: 'Cập nhật tin tức thành công' });
  } catch (err) {
    console.error('Lỗi PUT /api/news/:id:', err.message);
    res.status(500).json({ error: 'Không thể cập nhật bài viết' });
  }
});

// DELETE /api/news/:id (Admin)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.run("DELETE FROM news WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: 'Đã xóa bài viết' });
  } catch (err) {
    console.error('Lỗi DELETE /api/news/:id:', err.message);
    res.status(500).json({ error: 'Không thể xóa bài viết' });
  }
});

module.exports = router;
