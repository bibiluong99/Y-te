@echo off
chcp 65001 > nul
echo ============================================================
echo   PHÒNG KHÁM ĐA KHOA AN PHÚC - KHỞI CHẠY HỆ THỐNG
echo ============================================================
echo.

cd /d "%~dp0"

IF NOT EXIST "node_modules" (
  echo [1/3] Đang cài đặt thư viện cần thiết...
  call npm install
) ELSE (
  echo [1/3] Thư viện đã sẵn sàng.
)

echo [2/3] Cơ sở dữ liệu Microsoft SQL Server (PhongKhamAnPhuc) đã sẵn sàng.

echo [3/3] Đang mở trình duyệt và khởi động server...
start http://localhost:3000
start http://localhost:3000/admin

echo.
echo ============================================================
echo Server đang chạy trên cổng 3000. Nhấn Ctrl+C để dừng.
echo ============================================================
call npm run dev
pause
