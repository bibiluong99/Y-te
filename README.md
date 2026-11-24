# 🏥 PHÒNG KHÁM ĐA KHOA AN PHÚC — HỆ THỐNG WEBSITE & QUẢN TRỊ Y TẾ

Hệ thống website phòng khám y tế hoàn chỉnh với backend **Node.js / Express**, hỗ trợ cơ sở dữ liệu linh hoạt (**PostgreSQL / Microsoft SQL Server / JSON Fallback**), xác thực **JWT + bcrypt** và trang quản trị Admin dạng module.

---

## 📁 Cấu trúc dự án

```
Y-te/
├── api/                          # Các router API RESTful
│   ├── appointments.js           # Đặt lịch khám bệnh (chống trùng lịch + rate limit)
│   ├── auth.js                   # Đăng nhập JWT, kiểm tra phiên & đổi mật khẩu (bcrypt)
│   ├── banners.js                # Cấu hình banner các trang
│   ├── contacts.js               # Tiếp nhận & quản lý liên hệ khách hàng
│   ├── departments.js            # Quản lý chuyên khoa
│   ├── doctors.js                # Quản lý đội ngũ bác sĩ
│   ├── index.js                  # Router tổng hợp + /api/health
│   ├── news.js                   # Quản lý tin tức y tế
│   ├── products.js               # Quản lý sản phẩm & thiết bị y tế
│   ├── services.js               # Quản lý dịch vụ y tế
│   └── settings.js               # Cấu hình website, logo & khung giờ khám
├── middleware/
│   ├── auth.js                   # Xác thực & phân quyền JWT (requireAuth)
│   └── rateLimiter.js            # Giới hạn tần suất đăng nhập & gửi form công khai
├── utils/
│   └── upload.js                 # Tải ảnh Base64 an toàn (kiểm tra MIME + Magic Bytes)
├── public/                       # Giao diện frontend tĩnh & tài nguyên
│   ├── admin/                    # Trang Quản trị Admin
│   │   ├── js/core/api.js        # authFetch (JWT), nén ảnh client, helpers
│   │   ├── js/modules/           # 9 module tách riêng (auth, appointments, services, ...)
│   │   └── js/admin.js           # Entry point khởi chạy Admin
│   ├── css/styles.css            # Giao diện website bệnh nhân
│   ├── images/                   # Hình ảnh, banner & logo
│   ├── js/main.js                # Hiệu ứng & tương tác website bệnh nhân
│   └── *.html                    # Các trang giao diện (index, dich-vu, chuyen-khoa, ...)
├── sql/
│   └── schema_sqlserver.sql      # Schema bảng Microsoft SQL Server
├── tests/
│   └── api.test.js               # Bộ test tự động (Node built-in test runner)
├── .env.example                  # Mẫu cấu hình biến môi trường
├── db.js                         # Lớp kết nối DB (PostgreSQL -> SQL Server -> JSON Fallback)
├── db_fallback_data.json         # Dữ liệu dự phòng cục bộ
├── migrate_neon.js               # Script tạo bảng & nạp dữ liệu mẫu lên PostgreSQL
├── server.js                     # Express Server chính (Helmet + CORS + Routes)
└── run.bat                       # Khởi động nhanh 1-click trên Windows
```

---

## ⚙️ Cấu hình môi trường (`.env`)

Sao chép file `.env.example` thành `.env` và điền thông tin tương ứng (file `.env` đã nằm trong `.gitignore`):

```powershell
Copy-Item .env.example .env
```

* **Chạy ngay không cần DB:** Để trống `DATABASE_URL` và `DB_USER`/`DB_PASSWORD` (hoặc đặt `DB_MODE=fallback`), hệ thống sẽ tự dùng `db_fallback_data.json`.
* **Chạy với Cloud PostgreSQL (Neon/Supabase):** Điền `DATABASE_URL=...` trong `.env`. Nếu là DB mới, chạy `node migrate_neon.js` để khởi tạo bảng và dữ liệu mẫu.
* **Chạy với Microsoft SQL Server local:** Điền `DB_SERVER`, `DB_INSTANCE`, `DB_DATABASE`, `DB_USER`, `DB_PASSWORD` trong `.env`.
* **Bảo mật JWT:** Luôn đặt `JWT_SECRET` là chuỗi ngẫu nhiên dài tối thiểu 32 ký tự trên môi trường production.

---

## 🚀 Hướng dẫn khởi chạy Local

### Cách 1: Terminal / PowerShell
```powershell
# 1. Cài đặt thư viện (chỉ cần chạy lần đầu)
npm install

# 2. Khởi chạy ở chế độ phát triển (tự reload)
npm run dev

# Hoặc chạy chế độ thường
npm start
```

### Cách 2: Chạy nhanh bằng `run.bat` trên Windows
Nhấp đúp vào file `run.bat` để tự động cài thư viện (nếu thiếu), mở trình duyệt và khởi động server.

---

## 🧪 Chạy kiểm thử tự động

```powershell
npm test
```

---

## 🌐 Địa chỉ truy cập & Tài khoản mặc định

* **Trang chủ Website:** `http://localhost:3000`
* **Trang Quản trị Admin:** `http://localhost:3000/admin`
  * **Tên đăng nhập:** `admin`
  * **Mật khẩu mặc định:** `admin123` (có thể đổi trong trang Admin hoặc cấu hình qua `DEFAULT_ADMIN_USER` / `DEFAULT_ADMIN_PASSWORD`)
* **Kiểm tra API:** `http://localhost:3000/api/health`
