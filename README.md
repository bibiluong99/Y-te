# 🏥 PHÒNG KHÁM ĐA KHOA AN PHÚC - HỆ THỐNG WEBSITE & QUẢN TRỊ Y TẾ

Hệ thống website phòng khám y tế hoàn chỉnh tích hợp backend Node.js / Express, cơ sở dữ liệu Microsoft SQL Server (SQLEXPRESS) và trang quản trị Admin chuyên nghiệp.

---

## 📁 Cấu trúc dự án

```
Y tế/
├── api/                      # Các router API RESTful
│   ├── appointments.js       # API Đặt lịch khám bệnh
│   ├── auth.js               # API Xác thực đăng nhập Admin
│   ├── contacts.js           # API Tiếp nhận ý kiến liên hệ
│   ├── index.js              # Router tổng hợp
│   ├── news.js               # API Quản lý bài viết tin tức
│   └── products.js           # API Quản lý sản phẩm & gói khám
├── html/                     # Các file trang giao diện HTML
│   ├── chi-tiet-tin-tuc.html # Chi tiết bài viết tin tức
│   ├── dat-lich-kham.html    # Trang đặt lịch khám trực tuyến
│   ├── dich-vu.html          # Trang giới thiệu dịch vụ y tế
│   ├── doi-ngu-bac-si.html   # Trang đội ngũ bác sĩ chuyên khoa
│   ├── index.html            # Trang chủ phòng khám
│   ├── lien-he.html          # Trang liên hệ & bản đồ
│   ├── san-pham.html         # Trang sản phẩm y tế
│   └── tin-tuc.html          # Trang tin tức & cẩm nang sức khỏe
├── public/                   # Toàn bộ giao diện frontend tĩnh & tài nguyên
│   ├── admin/                # Hệ thống quản trị Admin
│   ├── css/styles.css        # Giao diện website bệnh nhân
│   ├── images/               # Hình ảnh, banner & logo
│   └── js/main.js            # Hiệu ứng & tương tác website
├── sql/                      # Script cấu trúc cơ sở dữ liệu
│   └── schema_sqlserver.sql  # Cấu trúc bảng Microsoft SQL Server
├── .gitignore                # File bỏ qua Git
├── db.js                     # Driver kết nối Microsoft SQL Server
├── db_fallback_data.json     # Dữ liệu dự phòng
├── package.json              # Cấu hình dự án & scripts chạy
├── package-lock.json         # Khóa phiên bản thư viện
├── README.md                 # Tài liệu hướng dẫn sử dụng
├── run.bat                   # File khởi động 1-click trên Windows
├── server.js                 # Express Server chính
└── vercel.json               # Cấu hình triển khai đám mây Vercel
```

---

## 🚀 Hướng dẫn khởi chạy Local

### Cách 1: Sử dụng lệnh thông dụng
Mở Terminal / PowerShell tại thư mục dự án và chạy:

```bash
# 1. Cài đặt các thư viện (chỉ cần chạy lần đầu)
npm install

# 2. Khởi chạy hệ thống ở môi trường phát triển local
npm run dev
```

### Cách 2: Chạy nhanh bằng file `run.bat` trên Windows
Chỉ cần nhấp đúp chuột vào file **`run.bat`**, hệ thống sẽ tự động kiểm tra thư viện, tạo database và mở trình duyệt web lên!

---

## 🌐 Các địa chỉ truy cập

- **Trang chủ Website:** [http://localhost:3000](http://localhost:3000)
- **Trang Quản trị Admin:** [http://localhost:3000/admin](http://localhost:3000/admin)
- **API Endpoint:** [http://localhost:3000/api/products](http://localhost:3000/api/products)

---

## 🔐 Thông tin tài khoản Quản trị (Admin)

- **Tên đăng nhập:** `admin`
- **Mật khẩu:** `admin123`

---

## ✨ Các chức năng nổi bật trong trang Admin

1. **Quản lý Sản phẩm & Gói dịch vụ y tế:**
   - Đã nạp sẵn 20 sản phẩm/dịch vụ y tế tiêu chuẩn (Máy đo huyết áp Omron, Nhiệt kế Microlife, Máy đo SpO2, Gói khám tổng quát VIP, Tầm soát tim mạch, Vật tư y tế...).
   - Tạo mới sản phẩm với đầy đủ ảnh, giá, số lượng tồn kho, danh mục, mô tả.
   - Chỉnh sửa, cập nhật thông tin và xóa sản phẩm.
   - Tìm kiếm sản phẩm theo tên hoặc danh mục nhanh chóng.

2. **Quản lý Tin tức Y tế:**
   - Đăng bài viết mới, cập nhật chuyên mục, tác giả, ảnh bìa, tóm tắt và nội dung.
   - Chỉnh sửa, xuất bản và xóa bài viết.

3. **Quản lý Lịch hẹn khám:**
   - Tự động tiếp nhận thông tin từ form *Đặt lịch khám* trên website.
   - Xem họ tên bệnh nhân, số điện thoại, chuyên khoa, bác sĩ, ngày giờ hẹn và duyệt lịch.

4. **Quản lý Tin nhắn liên hệ:**
   - Tiếp nhận phản hồi và câu hỏi từ khách hàng gửi qua form *Liên hệ*.
