// ============================================================
// API: SERVICES (Dịch vụ Y tế)
// Phòng Khám Đa Khoa An Phúc
// ============================================================

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../db');

// Danh sách 6 Dịch vụ Y tế chuẩn, đồng bộ 100% với các trang chi tiết dịch vụ
const defaultServices = [
  {
    id: 1,
    name: "Khám tổng quát",
    category: "Khám bệnh",
    icon: "fas fa-stethoscope",
    price: 300000,
    duration: "60 – 90 phút",
    description: "Kiểm tra sức khỏe toàn diện với đầy đủ các chỉ số cơ bản, phát hiện sớm các nguy cơ tiềm ẩn.",
    intro: "Khám tổng quát là bước kiểm tra sức khỏe cơ bản nhưng vô cùng quan trọng, giúp bạn nắm bắt tình trạng sức khỏe hiện tại, phát hiện sớm các bệnh lý tiềm ẩn và có hướng phòng ngừa kịp thời.\n\nTại Phòng khám đa khoa An Phúc, gói khám tổng quát được thiết kế khoa học với quy trình nhanh chóng, đội ngũ bác sĩ giàu kinh nghiệm và trang thiết bị hiện đại, mang đến trải nghiệm chăm sóc sức khỏe an toàn, tiện lợi và hiệu quả.",
    checklist: "Khám lâm sàng tổng quát\nSiêu âm ổ bụng\nXét nghiệm máu cơ bản\nĐo điện tim (ECG)\nXét nghiệm nước tiểu\nKiểm tra chức năng gan, thận\nChụp X-quang ngực\nTư vấn sức khỏe sau khám",
    status: "active"
  },
  {
    id: 2,
    name: "Khám chuyên khoa",
    category: "Khám bệnh",
    icon: "fas fa-heartbeat",
    price: 350000,
    duration: "30 – 45 phút",
    description: "Tư vấn và điều trị chuyên sâu các bệnh lý Nội khoa, Nhi khoa, Ngoại khoa, Sản phụ khoa.",
    intro: "Khám chuyên khoa tại Phòng khám đa khoa An Phúc quy tụ các bác sĩ chuyên khoa đầu ngành các khoa Nội, Ngoại, Nhi, Sản phụ khoa, Tai Mũi Họng, Mắt và Da liễu.\n\nNgười bệnh được thăm khám kỹ lưỡng, chẩn đoán chính xác bằng các thiết bị nội soi và chẩn đoán chuyên sâu, từ đó xây dựng phác đồ điều trị cá thể hóa tối ưu nhất.",
    checklist: "Khám và tư vấn chuyên sâu cùng bác sĩ chuyên khoa\nĐo các chỉ số sinh hiệu và thể lực\nNội soi chẩn đoán chuyên khoa (nếu có chỉ định)\nChỉ định cận lâm sàng cần thiết\nKê đơn và hướng dẫn phác đồ điều trị\nHẹn tái khám và theo dõi định kỳ",
    status: "active"
  },
  {
    id: 3,
    name: "Tiêm chủng",
    category: "Tiêm chủng",
    icon: "fas fa-syringe",
    price: 250000,
    duration: "15 – 30 phút",
    description: "Vắc xin an toàn, chất lượng cao nhập khẩu chính hãng cho trẻ em và người lớn.",
    intro: "Dịch vụ tiêm chủng trọn gói cho trẻ em và người lớn với các loại vắc xin chính hãng chất lượng cao, bảo quản theo tiêu chuẩn GSP quốc tế nghiêm ngặt.\n\nQuy trình tiêm chủng an toàn, khám sàng lọc trước tiêm và theo dõi chặt chẽ sau tiêm bởi đội ngũ bác sĩ, điều dưỡng lành nghề, tận tâm.",
    checklist: "Khám sàng lọc và tư vấn trước tiêm chủng\nKiểm tra đối chiếu thông tin vắc xin cùng khách hàng\nThực hiện tiêm chủng chuẩn vô khuẩn\nTheo dõi phản ứng sau tiêm tại chỗ 30 phút\nKiểm tra lại sức khỏe trước khi ra về\nCấp sổ tiêm chủng điện tử và nhắc lịch tiêm",
    status: "active"
  },
  {
    id: 4,
    name: "Xét nghiệm",
    category: "Xét nghiệm",
    icon: "far fa-image",
    price: 400000,
    duration: "30 – 60 phút",
    description: "Chính xác, nhanh chóng với hệ thống máy sinh hóa và huyết học tự động hiện đại.",
    intro: "Trung tâm xét nghiệm An Phúc trang bị máy xét nghiệm tự động thế hệ mới, đạt tiêu chuẩn kiểm chuẩn chất lượng cao, đảm bảo kết quả chính xác và nhanh chóng nhất.\n\nĐầy đủ các xét nghiệm từ cơ bản đến chuyên sâu: huyết học, sinh hóa, miễn dịch, vi sinh, phân tích nước tiểu và tầm soát dấu ấn ung thư sớm.",
    checklist: "Lấy mẫu xét nghiệm chuẩn y khoa nhẹ nhàng\nXét nghiệm công thức máu toàn phần (24 thông số)\nXét nghiệm sinh hóa máu (đường huyết, mỡ máu, men gan)\nĐánh giá chức năng thận (Ure, Creatinine)\nXét nghiệm nước tiểu 10 thông số tự động\nTrả kết quả tận nơi hoặc tra cứu online bảo mật",
    status: "active"
  },
  {
    id: 5,
    name: "Chẩn đoán hình ảnh",
    category: "Chẩn đoán",
    icon: "fas fa-bullseye",
    price: 500000,
    duration: "20 – 40 phút",
    description: "Siêu âm màu 4D, X-quang kỹ thuật số, nội soi tiêu hóa không đau chuẩn xác.",
    intro: "Khoa Chẩn đoán hình ảnh Phòng khám đa khoa An Phúc ứng dụng các thiết bị y tế hiện đại hàng đầu: hệ thống Siêu âm màu Doppler 4D, máy chụp X-quang kỹ thuật số liều tia thấp và nội soi không đau.\n\nĐội ngũ bác sĩ giàu kinh nghiệm chẩn đoán hình ảnh trực tiếp thực hiện và hội chẩn, giúp phát hiện sớm các tổn thương bệnh lý nội tạng.",
    checklist: "Siêu âm Doppler màu 4D tổng quát ổ bụng\nSiêu âm tuyến giáp và vùng cổ\nChụp X-quang kỹ thuật số ngực thẳng liều thấp\nChụp X-quang xương khớp theo chỉ định\nNội soi tiêu hóa ống mềm không đau (nếu chỉ định)\nBác sĩ chuyên khoa đọc và hội chẩn kết quả chi tiết",
    status: "active"
  },
  {
    id: 6,
    name: "Điều trị nội trú",
    category: "Khám bệnh",
    icon: "fas fa-capsules",
    price: 800000,
    duration: "Theo chỉ định bác sĩ",
    description: "Chăm sóc tận tâm trong không gian phòng bệnh tiện nghi, sạch sẽ, chuẩn y khoa.",
    intro: "Khu lưu trú và theo dõi điều trị An Phúc cung cấp dịch vụ chăm sóc toàn diện 24/7 với hệ thống phòng bệnh khang trang, sạch sẽ, vô trùng tuyệt đối.\n\nBệnh nhân được bác sĩ chuyên khoa thăm khám hàng ngày, điều dưỡng túc trực chăm sóc tận tình, mang lại cảm giác an tâm như ở nhà.",
    checklist: "Phòng bệnh tiêu chuẩn tiện nghi khép kín\nBác sĩ chuyên khoa thăm khám và hội chẩn hàng ngày\nĐiều dưỡng chăm sóc và hỗ trợ y tế 24/24\nChế độ dinh dưỡng điều trị riêng biệt theo bệnh lý\nTheo dõi sát sao chỉ số sinh tồn và diễn tiến bệnh\nHỗ trợ thủ tục bảo hiểm y tế nhanh gọn",
    status: "active"
  }
];

// Khởi tạo bảng và các cột mở rộng cho services
async function ensureServicesTable() {
  try {
    await db.run(`
      CREATE TABLE IF NOT EXISTS services (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        category TEXT DEFAULT 'Khám bệnh',
        icon TEXT DEFAULT 'fas fa-stethoscope',
        price REAL DEFAULT 0,
        description TEXT,
        duration TEXT,
        intro TEXT,
        checklist TEXT,
        status TEXT DEFAULT 'active',
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Bổ sung các cột nếu bảng cũ trong SQL Server chưa có
    try { await db.run("ALTER TABLE services ADD COLUMN duration TEXT"); } catch (e) {}
    try { await db.run("ALTER TABLE services ADD COLUMN intro TEXT"); } catch (e) {}
    try { await db.run("ALTER TABLE services ADD COLUMN checklist TEXT"); } catch (e) {}
    try { await db.run("ALTER TABLE services ADD COLUMN banner TEXT"); } catch (e) {}
  } catch (err) {
    console.warn('⚠️ Lỗi khởi tạo bảng services:', err.message);
  }
}

// Xóa và nạp lại toàn bộ dữ liệu dịch vụ chuẩn
async function clearAndReseedServices() {
  await ensureServicesTable();

  // 1. Cập nhật Store JSON Fallback
  const store = db.getStore();
  if (store) {
    store.services = JSON.parse(JSON.stringify(defaultServices));
    db.saveStore();
  }

  // 2. Cập nhật SQL Server
  try {
    await db.run("DELETE FROM services");
    for (const s of defaultServices) {
      await db.run(
        "INSERT INTO services (name, category, icon, price, description, duration, intro, checklist, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [s.name, s.category, s.icon, s.price, s.description, s.duration, s.intro, s.checklist, s.status]
      );
    }
    console.log('✅ Đã xóa và nạp lại thành công 6 dịch vụ y tế chuẩn vào database!');
  } catch (sqlErr) {
    console.warn('⚠️ Ghi chú đồng bộ SQL Server services:', sqlErr.message);
  }
}

// Chạy khởi tạo bảng khi nạp router
ensureServicesTable();

// GET /api/services
router.get('/', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    let list = [];
    try {
      list = await db.all("SELECT * FROM services ORDER BY id ASC");
    } catch (e) {
      const store = db.getStore();
      list = store.services || [];
    }

    if (!list || list.length === 0) {
      return res.json([]);
    }

    // Đảm bảo từng record trả về luôn có các trường duration, intro, checklist, banner
    list = list.map(item => ({
      ...item,
      duration: item.duration || '',
      intro: item.intro || '',
      checklist: item.checklist || '',
      banner: item.banner || (item.icon && (item.icon.includes('/') || item.icon.includes('.')) ? item.icon : '') || '',
      icon: item.icon || item.banner || 'fas fa-stethoscope'
    }));

    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/services/:id
router.get('/:id', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const id = req.params.id;
    let item = null;
    try {
      const rows = await db.all("SELECT * FROM services WHERE id = ?", [id]);
      if (rows && rows.length > 0) item = rows[0];
    } catch (e) {}

    if (!item) {
      const store = db.getStore();
      item = (store.services || []).find(s => s.id == id);
    }

    if (!item) {
      return res.status(404).json({ error: 'Không tìm thấy dịch vụ' });
    }

    item = {
      ...item,
      duration: item.duration || '',
      intro: item.intro || '',
      checklist: item.checklist || '',
      banner: item.banner || (item.icon && (item.icon.includes('/') || item.icon.includes('.')) ? item.icon : '') || '',
      icon: item.icon || item.banner || 'fas fa-stethoscope'
    };

    res.json(item);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/services/reset - Xóa sạch và nạp lại toàn bộ 6 dịch vụ chuẩn
router.post('/reset', async (req, res) => {
  try {
    await clearAndReseedServices();
    res.json({
      success: true,
      message: 'Đã xóa toàn bộ dữ liệu cũ và khởi tạo lại 6 dịch vụ y tế chuẩn thành công!',
      data: defaultServices
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/services/upload-banner - Upload ảnh banner dịch vụ (base64)
router.post('/upload-banner', async (req, res) => {
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

    const cleanOrigName = (fileName || 'service_banner.png').replace(/[^a-zA-Z0-9_.-]/g, '_');
    const finalFileName = `service_${Date.now()}_${cleanOrigName}`;

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
    res.status(500).json({ error: 'Lỗi upload ảnh: ' + err.message });
  }
});

// POST /api/services
router.post('/', async (req, res) => {
  try {
    const { name, category, icon, banner, price, description, duration, intro, checklist, status } = req.body;
    if (!name) return res.status(400).json({ error: 'Tên dịch vụ là bắt buộc' });

    const bannerVal = banner || (icon && (icon.includes('/') || icon.includes('.')) ? icon : '');
    const iconVal = icon || bannerVal || 'fas fa-stethoscope';

    const newService = {
      name,
      category: category || 'Khám bệnh',
      icon: iconVal,
      banner: bannerVal,
      price: parseFloat(price) || 0,
      description: description || '',
      duration: duration || '',
      intro: intro || '',
      checklist: checklist || '',
      status: status || 'active'
    };

    try {
      const result = await db.run(
        "INSERT INTO services (name, category, icon, banner, price, description, duration, intro, checklist, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [newService.name, newService.category, newService.icon, newService.banner, newService.price, newService.description, newService.duration, newService.intro, newService.checklist, newService.status]
      );
      newService.id = result.lastID;
    } catch (err) {
      try {
        const result = await db.run(
          "INSERT INTO services (name, category, icon, price, description, duration, intro, checklist, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [newService.name, newService.category, newService.icon, newService.price, newService.description, newService.duration, newService.intro, newService.checklist, newService.status]
        );
        newService.id = result.lastID;
      } catch (err2) {
        newService.id = Date.now();
        const store = db.getStore();
        if (!store.services) store.services = [];
        store.services.push(newService);
        db.saveStore();
      }
    }

    res.status(201).json({ success: true, message: 'Tạo dịch vụ y tế thành công', service: newService });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/services/:id
router.put('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    const { name, category, icon, banner, price, description, duration, intro, checklist, status } = req.body;
    const bannerVal = banner || (icon && (icon.includes('/') || icon.includes('.')) ? icon : '');
    const iconVal = icon || bannerVal || 'fas fa-stethoscope';

    try {
      await db.run(
        "UPDATE services SET name = ?, category = ?, icon = ?, banner = ?, price = ?, description = ?, duration = ?, intro = ?, checklist = ?, status = ? WHERE id = ?",
        [name, category, iconVal, bannerVal, parseFloat(price) || 0, description, duration || '', intro || '', checklist || '', status || 'active', id]
      );
    } catch (err) {
      try {
        await db.run(
          "UPDATE services SET name = ?, category = ?, icon = ?, price = ?, description = ?, duration = ?, intro = ?, checklist = ?, status = ? WHERE id = ?",
          [name, category, iconVal, parseFloat(price) || 0, description, duration || '', intro || '', checklist || '', status || 'active', id]
        );
      } catch (err2) {}

      const store = db.getStore();
      if (store.services) {
        const idx = store.services.findIndex(s => s.id == id);
        if (idx !== -1) {
          store.services[idx] = {
            ...store.services[idx],
            name,
            category,
            icon: iconVal,
            banner: bannerVal,
            price: parseFloat(price) || 0,
            description,
            duration: duration || '',
            intro: intro || '',
            checklist: checklist || '',
            status: status || 'active'
          };
          db.saveStore();
        }
      }
    }

    res.json({ success: true, message: 'Cập nhật dịch vụ thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/services/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    try {
      await db.run("DELETE FROM services WHERE id = ?", [id]);
    } catch (dbErr) {
      console.warn("Lỗi xóa services trên DB:", dbErr.message);
    }
    const store = db.getStore();
    if (store && store.services) {
      store.services = store.services.filter(s => s.id != id);
      db.saveStore();
    }
    res.json({ success: true, message: 'Đã xóa dịch vụ' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
