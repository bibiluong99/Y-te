// ============================================================
// API: DEPARTMENTS (Quản lý Chuyên khoa y tế)
// Phòng Khám Đa Khoa An Phúc
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { saveBase64Image } = require('../utils/upload');

// Danh sách chuyên khoa ban đầu
const initialDepartments = [
  {
    "name": "Khám nội tổng quát",
    "code": "NOI_TONG_QUAT",
    "icon": "fas fa-stethoscope",
    "image": "images/departments/noi-tong-quat.jpg",
    "head_doctor": "BS. Nguyễn Văn Minh",
    "description": "Kiểm tra sức khỏe toàn diện cho mọi lứa tuổi",
    "status": "active",
    "sort_order": 1
  },
  {
    "name": "Nhi khoa",
    "code": "NHI_KHOA",
    "icon": "fas fa-child",
    "image": "images/departments/nhi-khoa.jpg",
    "head_doctor": "BS. Trần Thị Lan",
    "description": "Chăm sóc sức khỏe trẻ từ 0 - 15 tuổi",
    "status": "active",
    "sort_order": 2
  },
  {
    "name": "Sản phụ khoa",
    "code": "SAN_PHU_KHOA",
    "icon": "fas fa-baby",
    "image": "images/departments/san-phu-khoa.jpg",
    "head_doctor": "BS. CKI. Phạm Thị Mai",
    "description": "Chăm sóc sức khỏe cho mẹ và bé",
    "status": "active",
    "sort_order": 3
  },
  {
    "name": "Tim mạch",
    "code": "TIM_MACH",
    "icon": "fas fa-heartbeat",
    "image": "images/departments/tim-mach.jpg",
    "head_doctor": "PGS. TS. BS. Trần Quốc Bảo",
    "description": "Phát hiện và điều trị các bệnh lý tim mạch",
    "status": "active",
    "sort_order": 4
  },
  {
    "name": "Hô hấp",
    "code": "HO_HAP",
    "icon": "fas fa-lungs",
    "image": "images/departments/ho-hap.jpg",
    "head_doctor": "BS. Đặng Văn Hùng",
    "description": "Chăm sóc sức khỏe hệ hô hấp",
    "status": "active",
    "sort_order": 5
  },
  {
    "name": "Tiêu hóa",
    "code": "TIEU_HOA",
    "icon": "fas fa-stomach",
    "image": "images/departments/tieu-hoa.jpg",
    "head_doctor": "ThS. BS. Lê Hoàng Anh",
    "description": "Điều trị các bệnh lý về tiêu hóa",
    "status": "active",
    "sort_order": 6
  },
  {
    "name": "Tiêm chủng",
    "code": "TIEM_CHUNG",
    "icon": "fas fa-syringe",
    "image": "images/departments/tiem-chung.jpg",
    "head_doctor": "BS. Trần Thị Lan",
    "description": "Tiêm chủng đầy đủ cho mọi lứa tuổi",
    "status": "active",
    "sort_order": 7
  },
  {
    "name": "Da liễu",
    "code": "DA_LIEU",
    "icon": "fas fa-allergies",
    "image": "images/departments/da-lieu.jpg",
    "head_doctor": "BS. Vũ Thị Ngọc",
    "description": "Chăm sóc và điều trị các vấn đề về da",
    "status": "active",
    "sort_order": 8
  },
  {
    "name": "Cơ xương khớp",
    "code": "CO_XUONG_KHOP",
    "icon": "fas fa-bone",
    "image": "images/departments/co-xuong-khop.jpg",
    "head_doctor": "ThS. BS. Lê Hoàng Anh",
    "description": "Điều trị các bệnh lý xương khớp",
    "status": "active",
    "sort_order": 9
  },
  {
    "name": "Mắt",
    "code": "MAT",
    "icon": "fas fa-eye",
    "image": "images/departments/noi-tong-quat.jpg",
    "head_doctor": "BS. Nguyễn Văn Minh",
    "description": "Khám và điều trị các bệnh về mắt",
    "status": "active",
    "sort_order": 10
  },
  {
    "name": "Tai - Mũi - Họng",
    "code": "TAI_MUI_HONG",
    "icon": "fas fa-head-side-cough",
    "image": "images/departments/ho-hap.jpg",
    "head_doctor": "BS. Đặng Văn Hùng",
    "description": "Khám và điều trị các bệnh lý Tai Mũi Họng",
    "status": "active",
    "sort_order": 11
  },
  {
    "name": "Thần kinh",
    "code": "THAN_KINH",
    "icon": "fas fa-brain",
    "image": "images/departments/noi-tong-quat.jpg",
    "head_doctor": "BS. CKII. Nguyễn Văn Minh",
    "description": "Chăm sóc sức khỏe thần kinh - não bộ",
    "status": "active",
    "sort_order": 12
  },
  {
    "name": "Nội tiết",
    "code": "NOI_TIET",
    "icon": "fas fa-dna",
    "image": "images/departments/noi-tong-quat.jpg",
    "head_doctor": "BS. CKI. Phạm Thị Mai",
    "description": "Điều trị các bệnh lý tuyến giáp, nội tiết",
    "status": "active",
    "sort_order": 13
  },
  {
    "name": "Tiết niệu",
    "code": "TIET_NIEU",
    "icon": "fas fa-capsules",
    "image": "images/departments/tieu-hoa.jpg",
    "head_doctor": "ThS. BS. Lê Hoàng Anh",
    "description": "Khám và điều trị các bệnh lý tiết niệu",
    "status": "active",
    "sort_order": 14
  },
  {
    "name": "Ung bướu",
    "code": "UNG_BUOU",
    "icon": "fas fa-ribbon",
    "image": "images/dept-oncology.png",
    "head_doctor": "BS. CKII. Nguyễn Văn Minh",
    "description": "Tầm soát và điều trị các bệnh lý ung thư",
    "status": "active",
    "sort_order": 15
  }
];

// Khởi tạo bảng departments
async function ensureDepartmentsTable() {
  try {
    await db.run(`
      CREATE TABLE IF NOT EXISTS departments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        code TEXT UNIQUE,
        icon TEXT DEFAULT 'fas fa-stethoscope',
        image TEXT,
        head_doctor TEXT,
        description TEXT,
        status TEXT DEFAULT 'active',
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    // Tuyệt đối không tự động nạp lại dữ liệu mẫu khi danh sách rỗng (tránh ghi đè khi người dùng xóa hết)
  } catch (err) {
    console.warn('⚠️ Lỗi khởi tạo bảng departments:', err.message);
  }
}

ensureDepartmentsTable();

// GET /api/departments - Danh sách tất cả chuyên khoa
router.get('/', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const rows = await db.all("SELECT * FROM departments ORDER BY sort_order ASC, id ASC");
    res.json(rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/departments/:id - Chi tiết 1 chuyên khoa
router.get('/:id', async (req, res) => {
  try {
    const row = await db.get("SELECT * FROM departments WHERE id = ?", [req.params.id]);
    if (!row) return res.status(404).json({ error: 'Không tìm thấy chuyên khoa' });
    res.json(row);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/departments - Tạo mới chuyên khoa (Admin)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, code, icon, image, head_doctor, description, status, sort_order } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Tên chuyên khoa không được để trống' });

    const finalCode = code || ('KHOA_' + Date.now());
    const finalIcon = icon || 'fas fa-stethoscope';
    const finalStatus = status || 'active';
    const finalSort = parseInt(sort_order, 10) || 0;

    const result = await db.run(`
      INSERT INTO departments (name, code, icon, image, head_doctor, description, status, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [String(name).trim(), finalCode, finalIcon, image || '', head_doctor || '', description || '', finalStatus, finalSort]);

    const created = await db.get("SELECT * FROM departments WHERE id = ?", [result.lastID]);
    res.status(201).json(created);
  } catch (err) {
    console.error('Lỗi POST /api/departments:', err.message);
    res.status(500).json({ error: 'Không thể tạo chuyên khoa' });
  }
});

// PUT /api/departments/:id - Cập nhật chuyên khoa (Admin)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, code, icon, image, head_doctor, description, status, sort_order } = req.body || {};
    if (!name || !String(name).trim()) return res.status(400).json({ error: 'Tên chuyên khoa không được để trống' });

    await db.run(`
      UPDATE departments
      SET name = ?, code = ?, icon = ?, image = ?, head_doctor = ?, description = ?, status = ?, sort_order = ?
      WHERE id = ?
    `, [String(name).trim(), code, icon, image || '', head_doctor || '', description || '', status || 'active', parseInt(sort_order, 10) || 0, req.params.id]);

    const updated = await db.get("SELECT * FROM departments WHERE id = ?", [req.params.id]);
    res.json(updated);
  } catch (err) {
    console.error('Lỗi PUT /api/departments/:id:', err.message);
    res.status(500).json({ error: 'Không thể cập nhật chuyên khoa' });
  }
});

// DELETE /api/departments/:id - Xóa chuyên khoa (Admin)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.run("DELETE FROM departments WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: 'Đã xóa chuyên khoa thành công' });
  } catch (err) {
    console.error('Lỗi DELETE /api/departments/:id:', err.message);
    res.status(500).json({ error: 'Không thể xóa chuyên khoa' });
  }
});

// POST /api/departments/upload-image - Upload ảnh chuyên khoa (Admin)
router.post('/upload-image', requireAuth, async (req, res) => {
  try {
    const { fileName, fileData } = req.body || {};
    const { imageUrl } = saveBase64Image(fileData, fileName, 'dept');
    res.json({ success: true, imageUrl });
  } catch (err) {
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

module.exports = router;
