// ============================================================
// API: PRODUCTS & SERVICES (Sản phẩm & Gói khám)
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../db');

// GET /api/products - Lấy danh sách sản phẩm
router.get('/', async (req, res) => {
  try {
    let products = [];
    try {
      products = await db.all("SELECT * FROM products ORDER BY id DESC");
    } catch (err) {
      const store = db.getStore();
      products = store.products || [];
    }

    // Filter theo category nếu có
    const { category, search } = req.query;
    if (category) {
      products = products.filter(p => p.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      products = products.filter(p => p.name.toLowerCase().includes(q));
    }

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/products/:id - Chi tiết sản phẩm
router.get('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    let product = null;
    try {
      product = await db.get("SELECT * FROM products WHERE id = ?", [id]);
    } catch (err) {
      const store = db.getStore();
      product = store.products.find(p => p.id == id);
    }

    if (!product) {
      return res.status(404).json({ error: 'Không tìm thấy sản phẩm' });
    }
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/products - Tạo sản phẩm mới
router.post('/', async (req, res) => {
  try {
    const { name, category, price, stock, status, image, description } = req.body;
    if (!name || price === undefined) {
      return res.status(400).json({ error: 'Tên sản phẩm và giá là bắt buộc' });
    }

    const newProd = {
      name,
      category: category || 'Thiết bị y tế gia đình',
      price: parseFloat(price) || 0,
      stock: parseInt(stock) || 50,
      status: status || 'active',
      image: image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=300',
      description: description || ''
    };

    try {
      const result = await db.run(
        "INSERT INTO products (name, category, price, stock, status, image, description) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [newProd.name, newProd.category, newProd.price, newProd.stock, newProd.status, newProd.image, newProd.description]
      );
      newProd.id = result.lastID;
    } catch (err) {
      const store = db.getStore();
      newProd.id = Date.now();
      store.products.unshift(newProd);
      db.saveStore();
    }

    res.status(201).json({ success: true, message: 'Tạo sản phẩm thành công', product: newProd });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/products/:id - Cập nhật sản phẩm
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { name, category, price, stock, status, image, description } = req.body;

    try {
      await db.run(
        "UPDATE products SET name = ?, category = ?, price = ?, stock = ?, status = ?, image = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?",
        [name, category, parseFloat(price), parseInt(stock), status, image, description, id]
      );
    } catch (err) {
      const store = db.getStore();
      const idx = store.products.findIndex(p => p.id == id);
      if (idx !== -1) {
        store.products[idx] = { ...store.products[idx], name, category, price, stock, status, image, description };
        db.saveStore();
      }
    }

    res.json({ success: true, message: 'Cập nhật sản phẩm thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/products/:id - Xóa sản phẩm
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    try {
      await db.run("DELETE FROM products WHERE id = ?", [id]);
    } catch (err) {
      const store = db.getStore();
      store.products = store.products.filter(p => p.id != id);
      db.saveStore();
    }
    res.json({ success: true, message: 'Đã xóa sản phẩm' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
