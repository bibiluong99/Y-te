// ============================================================
// API: PRODUCTS & SERVICES (Sản phẩm & Gói khám)
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// Đảm bảo bảng products có cột updated_at trên DB cũ
(async () => {
  try { await db.run("ALTER TABLE products ADD COLUMN updated_at TEXT"); } catch (_) {}
})();

// GET /api/products - Lấy danh sách sản phẩm (hỗ trợ filter + phân trang tùy chọn)
router.get('/', async (req, res) => {
  try {
    let products = await db.all("SELECT * FROM products ORDER BY id DESC");

    const { category, search, page, limit } = req.query;
    if (category) {
      products = products.filter(p => p.category === category);
    }
    if (search) {
      const q = String(search).toLowerCase().trim();
      products = products.filter(p => (p.name || '').toLowerCase().includes(q));
    }

    if (page !== undefined || limit !== undefined) {
      const pageNum = Math.max(1, parseInt(page, 10) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit, 10) || 20));
      const start = (pageNum - 1) * limitNum;
      products = products.slice(start, start + limitNum);
    }

    res.json(products);
  } catch (err) {
    console.error('Lỗi GET /api/products:', err.message);
    res.status(500).json({ error: 'Không thể tải danh sách sản phẩm' });
  }
});

// GET /api/products/:id - Chi tiết sản phẩm
router.get('/:id', async (req, res) => {
  try {
    const product = await db.get("SELECT * FROM products WHERE id = ?", [req.params.id]);
    if (!product) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }
    res.json(product);
  } catch (err) {
    console.error('Lỗi GET /api/products/:id:', err.message);
    res.status(500).json({ error: 'Không thể tải chi tiết sản phẩm' });
  }
});

// POST /api/products - Tạo sản phẩm mới (Admin)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, category, price, stock, status, image, description } = req.body || {};
    if (!name || !String(name).trim() || price === undefined) {
      return res.status(400).json({ error: 'Tên sản phẩm và giá là bắt buộc' });
    }

    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock, 10);
    if (Number.isNaN(parsedPrice) || parsedPrice < 0) {
      return res.status(400).json({ error: 'Giá sản phẩm không hợp lệ' });
    }

    const newProd = {
      name: String(name).trim(),
      category: category || 'Thiết bị y tế gia đình',
      price: parsedPrice,
      stock: Number.isNaN(parsedStock) ? 50 : Math.max(0, parsedStock),
      status: status || 'active',
      image: image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300',
      description: description || ''
    };

    const result = await db.run(
      "INSERT INTO products (name, category, price, stock, status, image, description) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [newProd.name, newProd.category, newProd.price, newProd.stock, newProd.status, newProd.image, newProd.description]
    );
    newProd.id = result.lastID;

    res.status(201).json({ success: true, message: 'Tạo sản phẩm thành công', product: newProd });
  } catch (err) {
    console.error('Lỗi POST /api/products:', err.message);
    res.status(500).json({ error: 'Không thể tạo sản phẩm' });
  }
});

// PUT /api/products/:id - Cập nhật sản phẩm (Admin)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const id = req.params.id;
    const { name, category, price, stock, status, image, description } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Tên sản phẩm là bắt buộc' });
    }

    const parsedPrice = parseFloat(price);
    const parsedStock = parseInt(stock, 10);

    await db.run(
      "UPDATE products SET name = ?, category = ?, price = ?, stock = ?, status = ?, image = ?, description = ? WHERE id = ?",
      [
        String(name).trim(),
        category || 'Thiết bị y tế gia đình',
        Number.isNaN(parsedPrice) ? 0 : Math.max(0, parsedPrice),
        Number.isNaN(parsedStock) ? 0 : Math.max(0, parsedStock),
        status || 'active',
        image || '',
        description || '',
        id
      ]
    );

    res.json({ success: true, message: 'Cập nhật sản phẩm thành công' });
  } catch (err) {
    console.error('Lỗi PUT /api/products/:id:', err.message);
    res.status(500).json({ error: 'Không thể cập nhật sản phẩm' });
  }
});

// DELETE /api/products/:id - Xóa sản phẩm (Admin)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.run("DELETE FROM products WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: 'Đã xóa sản phẩm' });
  } catch (err) {
    console.error('Lỗi DELETE /api/products/:id:', err.message);
    res.status(500).json({ error: 'Không thể xóa sản phẩm' });
  }
});

module.exports = router;
