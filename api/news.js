// ============================================================
// API: NEWS & ARTICLES (Tin tức y tế)
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/news
router.get('/', async (req, res) => {
  try {
    let news = [];
    try {
      news = await db.all("SELECT * FROM news ORDER BY id DESC");
    } catch (err) {
      const store = db.getStore();
      news = store.news || [];
    }
    res.json(news);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/news/:id
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let item = null;
    try {
      item = await db.get("SELECT * FROM news WHERE id = ?", [id]);
    } catch (err) {
      const store = db.getStore();
      item = store.news.find(n => n.id == id);
    }
    if (!item) return res.status(404).json({ error: 'Bài viết không tồn tại' });
    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/news
router.post('/', async (req, res) => {
  try {
    const { title, category, author, summary, content, image } = req.body;
    if (!title) return res.status(400).json({ error: 'Tiêu đề bài viết là bắt buộc' });

    const newPost = {
      title,
      category: category || 'Kiến thức y khoa',
      author: author || 'BS. An Phúc',
      summary: summary || '',
      content: content || '',
      image: image || 'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?w=400',
      created_at: new Date().toLocaleDateString('vi-VN'),
      status: 'published'
    };

    try {
      const result = await db.run(
        "INSERT INTO news (title, category, author, summary, content, image, created_at, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [newPost.title, newPost.category, newPost.author, newPost.summary, newPost.content, newPost.image, newPost.created_at, newPost.status]
      );
      newPost.id = result.lastID;
    } catch (err) {
      const store = db.getStore();
      newPost.id = Date.now();
      store.news.unshift(newPost);
      db.saveStore();
    }

    res.status(201).json({ success: true, message: 'Đăng tin tức thành công', news: newPost });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/news/:id
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { title, category, author, summary, content, image } = req.body;

    try {
      await db.run(
        "UPDATE news SET title = ?, category = ?, author = ?, summary = ?, content = ?, image = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [title, category, author, summary, content, image, id]
      );
    } catch (err) {
      const store = db.getStore();
      const idx = store.news.findIndex(n => n.id == id);
      if (idx !== -1) {
        store.news[idx] = { ...store.news[idx], title, category, author, summary, content, image };
        db.saveStore();
      }
    }

    res.json({ success: true, message: 'Cập nhật tin tức thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/news/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    try {
      await db.run("DELETE FROM news WHERE id = ?", [id]);
    } catch (err) {
      const store = db.getStore();
      store.news = store.news.filter(n => n.id != id);
      db.saveStore();
    }
    res.json({ success: true, message: 'Đã xóa bài viết' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/news/upload-image - Tải ảnh bài viết chèn vào nội dung (base64)
router.post('/upload-image', async (req, res) => {
  try {
    const { fileName, fileData } = req.body;
    if (!fileData) return res.status(400).json({ error: 'Chưa có file ảnh!' });

    const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer;
    if (matches && matches.length === 3) {
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(fileData, 'base64');
    }

    const cleanOrigName = (fileName || 'news_img.png').replace(/[^a-zA-Z0-9_.-]/g, '_');
    const finalFileName = `news_body_${Date.now()}_${cleanOrigName}`;

    let relativeUrl;
    try {
      const uploadDirPublic = path.join(__dirname, '../public/images/uploads');
      if (!fs.existsSync(uploadDirPublic)) fs.mkdirSync(uploadDirPublic, { recursive: true });

      const publicPath = path.join(uploadDirPublic, finalFileName);
      fs.writeFileSync(publicPath, buffer);

      relativeUrl = `images/uploads/${finalFileName}`;
    } catch (fsErr) {
      console.warn('⚡ Read-only filesystem (Vercel), sử dụng Base64 Data URL:', fsErr.message);
      relativeUrl = fileData;
    }
    res.json({ success: true, imageUrl: relativeUrl });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
