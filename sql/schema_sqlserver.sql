-- ============================================================
-- PHÒNG KHÁM ĐA KHOA AN PHÚC - DATABASE SCHEMA (MICROSOFT SQL SERVER)
-- Database: PhongKhamAnPhuc
-- Instance: SQLEXPRESS / localhost
-- ============================================================

USE [master];
GO

IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = N'PhongKhamAnPhuc')
BEGIN
    CREATE DATABASE [PhongKhamAnPhuc];
END
GO

USE [PhongKhamAnPhuc];
GO

-- 1. Bảng Quản trị viên (Users)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'users')
CREATE TABLE users (
    id INT IDENTITY(1,1) PRIMARY KEY,
    username NVARCHAR(100) UNIQUE NOT NULL,
    password NVARCHAR(255) NOT NULL,
    fullname NVARCHAR(255) NOT NULL,
    email NVARCHAR(255),
    role NVARCHAR(50) DEFAULT 'admin',
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- 2. Bảng Dịch vụ Y tế (Services)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'services')
CREATE TABLE services (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    category NVARCHAR(100) DEFAULT N'Khám chuyên khoa',
    icon NVARCHAR(100) DEFAULT 'fas fa-stethoscope',
    price DECIMAL(18,2) DEFAULT 0,
    description NVARCHAR(MAX),
    status NVARCHAR(50) DEFAULT 'active',
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- 3. Bảng Chuyên khoa Y tế (Departments)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'departments')
CREATE TABLE departments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    code NVARCHAR(100),
    icon NVARCHAR(100) DEFAULT 'fas fa-stethoscope',
    image NVARCHAR(500),
    head_doctor NVARCHAR(255),
    description NVARCHAR(MAX),
    status NVARCHAR(50) DEFAULT 'active',
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- 3.1. Bảng Đội ngũ Bác sĩ Y khoa (Doctors)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'doctors')
CREATE TABLE doctors (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    degree NVARCHAR(100) DEFAULT N'Bác sĩ',
    department NVARCHAR(255) NOT NULL,
    experience NVARCHAR(100),
    avatar NVARCHAR(500),
    description NVARCHAR(MAX),
    status NVARCHAR(50) DEFAULT 'active',
    sort_order INT DEFAULT 0,
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- 4. Bảng Sản phẩm & Thiết bị Y tế (Products)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'products')
CREATE TABLE products (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    category NVARCHAR(100) NOT NULL,
    price DECIMAL(18,2) NOT NULL,
    stock INT DEFAULT 50,
    status NVARCHAR(50) DEFAULT 'active',
    image NVARCHAR(500),
    description NVARCHAR(MAX),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- 5. Bảng Tin tức & Cẩm nang Y tế (News)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'news')
CREATE TABLE news (
    id INT IDENTITY(1,1) PRIMARY KEY,
    title NVARCHAR(500) NOT NULL,
    category NVARCHAR(100) NOT NULL,
    author NVARCHAR(255) DEFAULT N'BS. An Phúc',
    summary NVARCHAR(MAX),
    content NVARCHAR(MAX),
    image NVARCHAR(500),
    views INT DEFAULT 0,
    status NVARCHAR(50) DEFAULT 'published',
    created_at NVARCHAR(100),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- 6. Bảng Đặt lịch hẹn khám (Appointments)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'appointments')
CREATE TABLE appointments (
    id INT IDENTITY(1,1) PRIMARY KEY,
    patient_name NVARCHAR(255) NOT NULL,
    phone NVARCHAR(50) NOT NULL,
    email NVARCHAR(255),
    appointment_type NVARCHAR(100) DEFAULT N'Khám mới',
    has_insurance NVARCHAR(100) DEFAULT N'Không có BHYT',
    specialty NVARCHAR(255) NOT NULL,
    doctor NVARCHAR(255),
    appointment_date NVARCHAR(50) NOT NULL,
    appointment_time NVARCHAR(50) NOT NULL,
    notes NVARCHAR(MAX),
    status NVARCHAR(50) DEFAULT 'pending',
    created_at DATETIME DEFAULT GETDATE()
);
GO

-- 7. Bảng Thư liên hệ (Contacts)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'contacts')
CREATE TABLE contacts (
    id INT IDENTITY(1,1) PRIMARY KEY,
    name NVARCHAR(255) NOT NULL,
    phone NVARCHAR(50) NOT NULL,
    email NVARCHAR(255),
    message NVARCHAR(MAX) NOT NULL,
    status NVARCHAR(50) DEFAULT 'new',
    created_at NVARCHAR(100)
);
GO

-- 8. Bảng Cấu hình Banner Website (Banners)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'banners')
CREATE TABLE banners (
    id INT IDENTITY(1,1) PRIMARY KEY,
    page_key NVARCHAR(100) UNIQUE NOT NULL,
    page_name NVARCHAR(100) NOT NULL,
    tagline NVARCHAR(255),
    title NVARCHAR(500) NOT NULL,
    subtitle NVARCHAR(MAX),
    image_url NVARCHAR(500) NOT NULL,
    btn_text NVARCHAR(100),
    btn_link NVARCHAR(255),
    created_at DATETIME DEFAULT GETDATE(),
    updated_at DATETIME DEFAULT GETDATE()
);
GO

-- 9. Bảng Cài đặt cấu hình Logo & Hệ thống (Settings)
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'settings')
CREATE TABLE settings (
    [key] NVARCHAR(100) PRIMARY KEY,
    value NVARCHAR(MAX) NOT NULL,
    updated_at DATETIME DEFAULT GETDATE()
);
GO
