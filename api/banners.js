// ============================================================
// API: BANNERS (Cấu hình Banner các trang)
// Phòng Khám Đa Khoa An Phúc
// ============================================================

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const db = require('../db');

// Khởi tạo bảng banners nếu chưa có và nạp dữ liệu ban đầu
const defaultBanners = [
  {
    page_key: 'home',
    page_name: 'Trang chủ',
    tagline: '( Phòng khám đa khoa An Phúc )',
    title: 'Chăm sóc sức khỏe<br><span class="highlight">Toàn diện cho bạn</span>',
    subtitle: 'Đội ngũ bác sĩ giàu kinh nghiệm – Trang thiết bị hiện đại<br>– Dịch vụ tận tâm, vì sức khỏe cộng đồng.',
    image_url: 'images/hero-banner-full-doctor.png',
    btn_text: 'Đặt lịch khám ngay →',
    btn_link: 'dat-lich-kham.html'
  },
  {
    page_key: 'services',
    page_name: 'Dịch vụ y tế',
    tagline: 'Trang chủ > Dịch vụ',
    title: 'Dịch vụ y tế<br>chuyên nghiệp',
    subtitle: 'Chăm sóc sức khỏe toàn diện với đội ngũ bác sĩ giỏi và trang thiết bị hiện đại.',
    image_url: 'images/service-hero.png',
    btn_text: 'Đặt lịch khám ngay →',
    btn_link: 'dat-lich-kham.html'
  },
  {
    page_key: 'specialty',
    page_name: 'Chuyên khoa',
    tagline: 'Dịch vụ > Chuyên khoa',
    title: 'Chuyên khoa<br>đa dạng & chuyên sâu',
    subtitle: 'Được thăm khám và điều trị bởi đội ngũ bác sĩ chuyên khoa hàng đầu, với quy trình chuyên nghiệp, nhanh chóng và tận tâm.',
    image_url: 'images/chuyen-khoa-hero-doctors.png',
    btn_text: 'Đặt lịch khám ngay →',
    btn_link: 'dat-lich-kham.html'
  },
  {
    page_key: 'doctors',
    page_name: 'Đội ngũ bác sĩ',
    tagline: 'Trang chủ > Đội ngũ bác sĩ',
    title: 'Đội ngũ bác sĩ<br>chuyên môn cao',
    subtitle: 'Tận tâm – Chuyên nghiệp – Đồng hành cùng bạn trên mọi hành trình sức khỏe.',
    image_url: 'images/doctors-hero.png',
    btn_text: 'Đặt lịch khám ngay →',
    btn_link: 'dat-lich-kham.html'
  },
  {
    page_key: 'news',
    page_name: 'Tin tức & Chia sẻ',
    tagline: 'Trang chủ > Tin tức',
    title: 'Tin tức &<br>Kiến thức sức khỏe',
    subtitle: 'Cập nhật những thông tin y khoa bổ ích, cẩm nang chăm sóc sức khỏe thường thức cho cả gia đình.',
    image_url: 'images/news-hero.png',
    btn_text: 'Khám phá ngay →',
    btn_link: '#featuredNews'
  },
  {
    page_key: 'contact',
    page_name: 'Liên hệ',
    tagline: 'Trang chủ > Liên hệ',
    title: 'Liên hệ với chúng tôi',
    subtitle: 'Chúng tôi luôn sẵn sàng hỗ trợ, tư vấn và giải đáp mọi thắc mắc của bạn và gia đình.',
    image_url: 'images/contact-hero.png',
    btn_text: 'Liên hệ ngay →',
    btn_link: '#contactSection'
  },
  {
    page_key: 'appointment',
    page_name: 'Đặt lịch khám',
    tagline: 'Trang chủ > Đặt lịch khám',
    title: 'Đặt lịch khám<br>nhanh chóng',
    subtitle: 'Chỉ với vài thao tác đơn giản, bạn đã có thể chủ động đặt lịch khám tại Phòng khám An Phúc.',
    image_url: 'images/booking-hero.png',
    btn_text: 'Đặt lịch ngay →',
    btn_link: '#appointmentFormSection'
  }
];

async function ensureBannerTable() {
  try {
    await db.run(`
      CREATE TABLE IF NOT EXISTS banners (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        page_key TEXT UNIQUE NOT NULL,
        page_name TEXT NOT NULL,
        tagline TEXT,
        title TEXT NOT NULL,
        subtitle TEXT,
        image_url TEXT NOT NULL,
        btn_text TEXT,
        btn_link TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Tự động kiểm tra và khởi tạo bản ghi mặc định cho các trang còn thiếu
    for (const b of defaultBanners) {
      try {
        const exist = await db.get("SELECT id FROM banners WHERE page_key = ?", [b.page_key]);
        if (!exist) {
          await db.run(
            "INSERT INTO banners (page_key, page_name, tagline, title, subtitle, image_url, btn_text, btn_link) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
            [b.page_key, b.page_name, b.tagline, b.title, b.subtitle, b.image_url, b.btn_text, b.btn_link]
          );
        }
      } catch (_) {}
    }
  } catch (err) {
    console.warn('⚠️ Ghi chú tạo bảng banners:', err.message);
  }
}

// Khởi chạy khi tải file
ensureBannerTable();

// POST /api/banners/upload - Upload file ảnh banner từ máy tính
router.post('/upload', async (req, res) => {
  try {
    const { fileName, fileData, pageKey } = req.body;

    if (!fileData) {
      return res.status(400).json({ error: 'Chưa có dữ liệu file ảnh!' });
    }

    // Tách base64 data
    const matches = fileData.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer;
    let ext = 'png';

    if (matches && matches.length === 3) {
      const mime = matches[1];
      if (mime.includes('jpeg') || mime.includes('jpg')) ext = 'jpg';
      else if (mime.includes('png')) ext = 'png';
      else if (mime.includes('webp')) ext = 'webp';
      else if (mime.includes('svg')) ext = 'svg';
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(fileData, 'base64');
    }

    // Tên file lưu trữ
    const safePageKey = (pageKey || 'banner').replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanOrigName = (fileName || 'image').replace(/[^a-zA-Z0-9_.-]/g, '_');
    const timestamp = Date.now();
    const finalFileName = `banner_${safePageKey}_${timestamp}_${cleanOrigName}`;

    let relativeUrl;
    try {
      const uploadDirPublic = path.join(__dirname, '../public/images/uploads');
      if (!fs.existsSync(uploadDirPublic)) {
        fs.mkdirSync(uploadDirPublic, { recursive: true });
      }
      const publicPath = path.join(uploadDirPublic, finalFileName);
      fs.writeFileSync(publicPath, buffer);
      relativeUrl = `images/uploads/${finalFileName}`;
    } catch (fsErr) {
      console.warn('⚡ Read-only filesystem (Vercel), sử dụng Base64 Data URL:', fsErr.message);
      relativeUrl = fileData;
    }

    res.json({
      success: true,
      message: 'Tải file ảnh banner lên máy chủ thành công!',
      imageUrl: relativeUrl,
      fileName: finalFileName
    });
  } catch (err) {
    console.error('Lỗi upload banner:', err);
    res.status(500).json({ error: 'Lỗi upload ảnh: ' + err.message });
  }
});

// GET /api/banners - Danh sách banner tất cả các trang
router.get('/', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    let list = [];
    try {
      list = await db.all("SELECT * FROM banners ORDER BY id ASC");
    } catch (e) {
      list = [];
    }
    if (!list || list.length === 0) {
      list = defaultBanners;
    }
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/banners/:page_key - Lấy banner theo trang
router.get('/:page_key', async (req, res) => {
  try {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    const key = req.params.page_key.toLowerCase();
    let banner = null;
    try {
      banner = await db.get("SELECT * FROM banners WHERE page_key = ?", [key]);
    } catch (e) {
      banner = null;
    }
    if (!banner) {
      banner = defaultBanners.find(b => b.page_key === key) || defaultBanners[0];
    }
    res.json(banner);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/banners/:page_key - Cập nhật banner cho 1 trang (UPSERT)
router.put('/:page_key', async (req, res) => {
  try {
    const key = req.params.page_key.toLowerCase();
    const { tagline, title, subtitle, image_url, btn_text, btn_link, page_name } = req.body;

    if (!title || !image_url) {
      return res.status(400).json({ error: 'Tiêu đề và đường dẫn ảnh banner là bắt buộc' });
    }

    try {
      const existing = await db.get("SELECT id FROM banners WHERE page_key = ?", [key]);
      if (existing) {
        await db.run(`
          UPDATE banners 
          SET tagline = ?, title = ?, subtitle = ?, image_url = ?, btn_text = ?, btn_link = ?, updated_at = CURRENT_TIMESTAMP
          WHERE page_key = ?
        `, [tagline || '', title, subtitle || '', image_url, btn_text || '', btn_link || '', key]);
      } else {
        const pageName = page_name || defaultBanners.find(b => b.page_key === key)?.page_name || key;
        await db.run(`
          INSERT INTO banners (page_key, page_name, tagline, title, subtitle, image_url, btn_text, btn_link)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `, [key, pageName, tagline || '', title, subtitle || '', image_url, btn_text || '', btn_link || '']);
      }
    } catch (err) {
      console.error('Lỗi lưu banner trong DB:', err.message);
      const store = db.getStore();
      if (!store.banners) store.banners = [];
      const idx = store.banners.findIndex(b => b.page_key === key);
      const bObj = { page_key: key, page_name: page_name || key, tagline, title, subtitle, image_url, btn_text, btn_link };
      if (idx !== -1) store.banners[idx] = bObj;
      else store.banners.push(bObj);
      db.saveStore();
    }

    res.json({
      success: true,
      message: `Cập nhật cấu hình banner cho trang [${key}] thành công!`,
      banner: { page_key: key, tagline, title, subtitle, image_url, btn_text, btn_link }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
