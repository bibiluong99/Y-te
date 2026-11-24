// ============================================================
// API: DOCTORS (Quản lý Đội ngũ Bác sĩ Y khoa)
// Phòng Khám Đa Khoa An Phúc
// Database: Microsoft SQL Server (PhongKhamAnPhuc)
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { saveBase64Image } = require('../utils/upload');

// Helper: Lưu ảnh Base64 an toàn nếu dữ liệu là Data URL, giữ nguyên nếu là đường dẫn URL
function saveBase64Avatar(fileData, fileName) {
  if (!fileData || typeof fileData !== 'string') return null;
  if (!fileData.startsWith('data:image/')) return fileData;
  const { imageUrl } = saveBase64Image(fileData, fileName, 'doc');
  return imageUrl;
}

// Danh sách 6 bác sĩ ban đầu
const initialDoctors = [
  {
    name: 'BS. CKII. Nguyễn Văn Minh',
    degree: 'BS. CKII',
    department: 'Khám nội tổng quát',
    experience: 'Hơn 15 năm kinh nghiệm',
    avatar: 'images/doc-1.png',
    description: 'Chuyên gia nội khoa tổng quát với hơn 15 năm kinh nghiệm chẩn đoán và điều trị bệnh mãn tính.',
    status: 'active',
    sort_order: 1
  },
  {
    name: 'BS. Trần Thị Lan',
    degree: 'Bác sĩ Chuyên khoa',
    department: 'Nhi khoa',
    experience: 'Hơn 12 năm kinh nghiệm',
    avatar: 'images/doc-2.png',
    description: 'Bác sĩ chuyên khoa Nhi tận tâm, giàu kinh nghiệm chăm sóc sức khỏe và dinh dưỡng trẻ em.',
    status: 'active',
    sort_order: 2
  },
  {
    name: 'ThS. BS. Lê Hoàng Anh',
    degree: 'ThS. BS',
    department: 'Cơ xương khớp',
    experience: 'Hơn 14 năm kinh nghiệm',
    avatar: 'images/doc-3.png',
    description: 'Thạc sĩ Bác sĩ ngoại khoa có nhiều năm kinh nghiệm phẫu thuật và điều trị phục hồi chức năng xương khớp.',
    status: 'active',
    sort_order: 3
  },
  {
    name: 'BS. CKI. Phạm Thị Mai',
    degree: 'BS. CKI',
    department: 'Sản phụ khoa',
    experience: 'Hơn 13 năm kinh nghiệm',
    avatar: 'images/doc-4.png',
    description: 'Bác sĩ Chuyên khoa I Sản phụ khoa, theo dõi thai kỳ an toàn và khám phụ khoa định kỳ.',
    status: 'active',
    sort_order: 4
  },
  {
    name: 'BS. Đặng Văn Hùng',
    degree: 'Bác sĩ Chuyên khoa',
    department: 'Hô hấp',
    experience: 'Hơn 10 năm kinh nghiệm',
    avatar: 'images/doc-5.png',
    description: 'Bác sĩ điều trị các bệnh lý đường hô hấp, hen suyễn, viêm phế quản và nội soi kỹ thuật cao.',
    status: 'active',
    sort_order: 5
  },
  {
    name: 'BS. Vũ Thị Ngọc',
    degree: 'Bác sĩ Chuyên khoa',
    department: 'Da liễu',
    experience: 'Hơn 11 năm kinh nghiệm',
    avatar: 'images/doc-6.png',
    description: 'Bác sĩ chuyên khoa Da liễu và thẩm mỹ da, trị mụn, nám, dị ứng và phục hồi da.',
    status: 'active',
    sort_order: 6
  }
];

// Khởi tạo bảng doctors nếu chưa có
async function ensureDoctorsTable() {
  try {
    await db.run(`
      CREATE TABLE IF NOT EXISTS doctors (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        degree TEXT,
        department TEXT NOT NULL,
        experience TEXT,
        avatar TEXT,
        description TEXT,
        status TEXT DEFAULT 'active',
        sort_order INTEGER DEFAULT 0,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tự động nâng cấp các cột trong SQL Server sang NVARCHAR(MAX) để tránh lỗi truncation
    try {
      if (db.isSqlServer()) {
        await db.run("IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('doctors') AND name = 'avatar') ALTER TABLE doctors ALTER COLUMN avatar NVARCHAR(MAX)");
        await db.run("IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('doctors') AND name = 'experience') ALTER TABLE doctors ALTER COLUMN experience NVARCHAR(MAX)");
        await db.run("IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('doctors') AND name = 'degree') ALTER TABLE doctors ALTER COLUMN degree NVARCHAR(MAX)");
        await db.run("IF EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('doctors') AND name = 'description') ALTER TABLE doctors ALTER COLUMN description NVARCHAR(MAX)");
      }
    } catch (altErr) {
      console.warn('⚠️ Ghi chú nâng cấp schema bảng doctors:', altErr.message);
    }

    // Tuyệt đối không tự động nạp lại dữ liệu mẫu khi danh sách rỗng (tránh ghi đè khi người dùng xóa hết)
  } catch (err) {
    console.warn('⚠️ Lỗi khởi tạo bảng doctors:', err.message);
  }
}

ensureDoctorsTable();

// 1. GET /api/doctors - Lấy toàn bộ danh sách bác sĩ
router.get('/', async (req, res) => {
  try {
    const doctors = await db.all('SELECT * FROM doctors ORDER BY sort_order ASC, id ASC');
    res.json(doctors || []);
  } catch (err) {
    console.error('Lỗi lấy danh sách bác sĩ:', err);
    res.status(500).json({ error: 'Không thể lấy danh sách bác sĩ', details: err.message });
  }
});

// 2. GET /api/doctors/:id - Chi tiết một bác sĩ
router.get('/:id', async (req, res) => {
  try {
    const doctor = await db.get('SELECT * FROM doctors WHERE id = ?', [req.params.id]);
    if (!doctor) {
      return res.status(404).json({ error: 'Không tìm thấy bác sĩ' });
    }
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ error: 'Lỗi truy vấn bác sĩ', details: err.message });
  }
});

// POST /api/doctors/upload-image - Upload ảnh đại diện bác sĩ (Admin)
router.post('/upload-image', requireAuth, async (req, res) => {
  try {
    const { fileName, fileData } = req.body || {};
    const { imageUrl } = saveBase64Image(fileData, fileName, 'doc');
    res.json({ success: true, imageUrl });
  } catch (err) {
    console.error('Lỗi upload ảnh bác sĩ:', err);
    res.status(err.statusCode || 500).json({ error: err.message });
  }
});

// 3. POST /api/doctors - Thêm bác sĩ mới (Admin)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, degree, department, experience, avatar, description, status, sort_order } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Họ và tên bác sĩ là bắt buộc' });
    }

    const cleanAvatar = saveBase64Avatar(avatar, `${String(name).trim()}.png`) || avatar || 'images/doc-1.png';

    const result = await db.run(`
      INSERT INTO doctors (name, degree, department, experience, avatar, description, status, sort_order)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      String(name).trim(),
      degree || 'Bác sĩ',
      department || 'Chuyên khoa Nội',
      experience || 'Nhiều năm kinh nghiệm',
      cleanAvatar,
      description || '',
      status || 'active',
      parseInt(sort_order, 10) || 0
    ]);

    res.status(201).json({
      success: true,
      message: 'Thêm bác sĩ thành công',
      id: result.lastID
    });
  } catch (err) {
    console.error('Lỗi thêm bác sĩ:', err);
    res.status(err.statusCode || 500).json({ error: err.statusCode ? err.message : 'Không thể thêm bác sĩ' });
  }
});

// 4. PUT /api/doctors/:id - Cập nhật thông tin bác sĩ (Admin)
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { name, degree, department, experience, avatar, description, status, sort_order } = req.body || {};
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Họ và tên bác sĩ là bắt buộc' });
    }

    const cleanAvatar = saveBase64Avatar(avatar, `${String(name).trim()}.png`) || avatar || 'images/doc-1.png';

    await db.run(`
      UPDATE doctors
      SET name = ?, degree = ?, department = ?, experience = ?, avatar = ?, description = ?, status = ?, sort_order = ?
      WHERE id = ?
    `, [
      String(name).trim(),
      degree || 'Bác sĩ',
      department || 'Chuyên khoa Nội',
      experience || '',
      cleanAvatar,
      description || '',
      status || 'active',
      parseInt(sort_order, 10) || 0,
      req.params.id
    ]);

    res.json({ success: true, message: 'Cập nhật thông tin bác sĩ thành công' });
  } catch (err) {
    console.error('Lỗi cập nhật bác sĩ:', err);
    res.status(err.statusCode || 500).json({ error: err.statusCode ? err.message : 'Không thể cập nhật bác sĩ' });
  }
});

// 5. DELETE /api/doctors/:id - Xóa bác sĩ (Admin)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.run('DELETE FROM doctors WHERE id = ?', [req.params.id]);
    res.json({ success: true, message: 'Đã xóa bác sĩ khỏi hệ thống' });
  } catch (err) {
    console.error('Lỗi xóa bác sĩ:', err);
    res.status(500).json({ error: 'Không thể xóa bác sĩ' });
  }
});

module.exports = router;
