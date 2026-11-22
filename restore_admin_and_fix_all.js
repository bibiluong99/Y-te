/**
 * restore_admin_and_fix_all.js
 * 
 * 1. Restores all complete modals in public/admin/index.html:
 *    - serviceModal
 *    - departmentModal (clean: name, code, status, image, desc; button: "Lưu")
 *    - doctorModal (clean: no preset avatars, toggle switch show on public page; button: "Lưu")
 *    - newsModal
 *    - changePasswordModal
 * 2. Banner Tabs in Admin:
 *    - Exactly 1 "Chuyên khoa" tab
 *    - Working switchBannerTab for all tabs (including 'specialty' and 'contact')
 * 3. Doctors Table in Admin:
 *    - Remove icon from text "Hiển thị": shows just "Hiển thị" or "Đã ẩn"
 *    - white-space: nowrap (no line wrap)
 * 4. Fix setupEventListeners with safe guards so no uncaught error can ever block scripts.
 * 5. Update header menu on all website pages:
 *    - Hide "Tin tức" from header menu
 *    - Ensure "Chuyên khoa" is present right after "Dịch vụ" on all pages (including dich-vu.html and doi-ngu-bac-si.html)
 */

const fs = require('fs');
const path = require('path');

console.log('>>> Bắt đầu khôi phục và xử lý tất cả các yêu cầu...');

// ========================================================
// 1. CẬP NHẬT public/admin/index.html
// ========================================================
let adminHtml = fs.readFileSync('public/admin/index.html', 'utf8');

// 1.1 Chuẩn hóa Banner Tabs (chỉ 1 Chuyên khoa duy nhất, có onclick)
const newBannerTabs = `<div class="banner-page-tabs">
              <button type="button" class="btn-banner-tab active" data-page="home" onclick="switchBannerTab('home')"><i class="fas fa-home"></i> Trang chủ</button>
              <button type="button" class="btn-banner-tab" data-page="services" onclick="switchBannerTab('services')"><i class="fas fa-stethoscope"></i> Dịch vụ y tế</button>
              <button type="button" class="btn-banner-tab" data-page="specialty" onclick="switchBannerTab('specialty')"><i class="fas fa-hospital-user"></i> Chuyên khoa</button>
              <button type="button" class="btn-banner-tab" data-page="doctors" onclick="switchBannerTab('doctors')"><i class="fas fa-user-md"></i> Đội ngũ bác sĩ</button>
              <button type="button" class="btn-banner-tab" data-page="news" onclick="switchBannerTab('news')"><i class="fas fa-newspaper"></i> Tin tức & Chia sẻ</button>
              <button type="button" class="btn-banner-tab" data-page="contact" onclick="switchBannerTab('contact')"><i class="fas fa-envelope"></i> Liên hệ</button>
              <button type="button" class="btn-banner-tab" data-page="appointment" onclick="switchBannerTab('appointment')"><i class="far fa-calendar-alt"></i> Đặt lịch khám</button>
            </div>`;

adminHtml = adminHtml.replace(/<div class="banner-page-tabs">[\s\S]*?<\/div>/i, newBannerTabs);

// 1.2 Cắt bỏ từ sau </section> của section-banners đến trước <div id="toastContainer">
// và thay bằng bộ tất cả các modal hoàn chỉnh, hợp lệ, chuẩn 100%
const allCompleteModals = `
  <!-- ===================== MODAL DỊCH VỤ Y TẾ ===================== -->
  <div id="serviceModal" class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h3 id="serviceModalTitle">Tạo Dịch Vụ Y Tế Mới</h3>
        <button class="modal-close" onclick="closeServiceModal()"><i class="fas fa-times"></i></button>
      </div>
      <form id="serviceForm">
        <input type="hidden" id="serviceId">
        <div class="modal-body">
          <div class="form-group">
            <label>Tên dịch vụ <span class="required">*</span></label>
            <input type="text" id="sName" placeholder="VD: Khám tổng quát định kỳ" required>
          </div>
          <div class="form-row">
            <div class="form-group">
              <label>Danh mục</label>
              <select id="sCategory">
                <option value="Khám bệnh">Khám bệnh</option>
                <option value="Xét nghiệm">Xét nghiệm</option>
                <option value="Chẩn đoán">Chẩn đoán</option>
                <option value="Tiêm chủng">Tiêm chủng</option>
              </select>
            </div>
            <div class="form-group">
              <label>Giá tham khảo (VNĐ)</label>
              <input type="number" id="sPrice" placeholder="VD: 350000" min="0">
            </div>
          </div>
          <div class="form-group">
            <label>Icon hiển thị</label>
            <select id="sIcon">
              <option value="fas fa-stethoscope">Ống nghe (fas fa-stethoscope)</option>
              <option value="fas fa-heartbeat">Nhịp tim (fas fa-heartbeat)</option>
              <option value="fas fa-syringe">Tiêm chủng (fas fa-syringe)</option>
              <option value="fas fa-vial">Ống nghiệm (fas fa-vial)</option>
              <option value="fas fa-x-ray">X-Quang (fas fa-x-ray)</option>
              <option value="fas fa-user-md">Bác sĩ (fas fa-user-md)</option>
            </select>
          </div>
          <div class="form-group">
            <label>Mô tả ngắn</label>
            <textarea id="sDescription" rows="3" placeholder="Mô tả tóm tắt dịch vụ y tế..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-cancel" onclick="closeServiceModal()">Hủy</button>
          <button type="submit" class="btn-save"><i class="fas fa-save"></i> Lưu dịch vụ</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ===================== MODAL CHUYÊN KHOA Y TẾ ===================== -->
  <div id="departmentModal" class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h3 id="departmentModalTitle">Tạo Chuyên Khoa Y Tế Mới</h3>
        <button class="modal-close" onclick="closeDepartmentModal()"><i class="fas fa-times"></i></button>
      </div>
      <form id="departmentForm">
        <input type="hidden" id="departmentId">
        <input type="hidden" id="dHeadDoctor" value="">
        <input type="hidden" id="dIcon" value="fas fa-stethoscope">
        <input type="hidden" id="dSortOrder" value="0">
        
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group" style="flex: 2;">
              <label>Tên chuyên khoa <span class="required">*</span></label>
              <input type="text" id="dName" placeholder="VD: Ung bướu, Tim mạch, Sản phụ khoa..." required>
            </div>
            <div class="form-group" style="flex: 1;">
              <label>Mã khoa</label>
              <input type="text" id="dCode" placeholder="VD: UNG_BUOU">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group" style="flex: 1;">
              <label>Trạng thái</label>
              <select id="dStatus">
                <option value="active">Đang hoạt động</option>
                <option value="inactive">Tạm ngưng</option>
              </select>
            </div>
          </div>

          <div class="form-group">
            <label>Ảnh đại diện chuyên khoa (URL hoặc tải ảnh lên)</label>
            <div style="display: flex; gap: 10px; align-items: center;">
              <input type="text" id="dImage" placeholder="images/spec-noi-tong-quat.png hoặc tải từ máy" style="flex: 1;">
              <label class="btn-choose-file"
                style="cursor: pointer; margin: 0; padding: 10px 16px; font-size: 0.85rem; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; background: #104936; color: #fff;">
                <i class="fas fa-upload"></i> Tải ảnh
                <input type="file" id="dImageFileInput" accept="image/*" style="display: none;"
                  onchange="handleDepartmentImageUpload(this)">
              </label>
            </div>
            <div id="dImagePreviewBox" style="margin-top: 8px; display: none;">
              <img id="dImagePreview" src="" alt="Preview" style="max-height: 80px; border-radius: 8px; border: 1px solid #cbd5e1;">
            </div>
          </div>

          <div class="form-group">
            <label>Mô tả chuyên khoa</label>
            <textarea id="dDescription" rows="3" placeholder="Tóm tắt phạm vi khám chữa bệnh, kỹ thuật nổi bật của chuyên khoa..."></textarea>
          </div>
        </div>

        <div class="modal-footer">
          <button type="button" class="btn-cancel" onclick="closeDepartmentModal()">Hủy</button>
          <button type="submit" class="btn-save" id="btnSaveDepartment"><i class="fas fa-save"></i> Lưu</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ===================== MODAL BÁC SĨ ===================== -->
  <div id="doctorModal" class="modal-overlay">
    <div class="modal">
      <div class="modal-header">
        <h3 id="doctorModalTitle">Thêm Bác Sĩ Mới</h3>
        <button class="modal-close" onclick="closeDoctorModal()"><i class="fas fa-times"></i></button>
      </div>
      <form id="doctorForm">
        <input type="hidden" id="doctorId">
        <div class="modal-body">
          <div class="form-row">
            <div class="form-group" style="flex: 2;">
              <label>Họ và Tên Bác sĩ <span class="required">*</span></label>
              <input type="text" id="docName" placeholder="VD: BS. CKII. Nguyễn Văn Minh" required>
            </div>
            <div class="form-group" style="flex: 1;">
              <label>Học vị / Chức danh</label>
              <input type="text" id="docDegree" placeholder="VD: BS. CKII, ThS. BS...">
            </div>
          </div>

          <div class="form-row">
            <div class="form-group" style="flex: 1;">
              <label>Chuyên khoa phụ trách <span class="required">*</span></label>
              <select id="docDepartment" required>
                <option value="Chuyên khoa Nội">Chuyên khoa Nội</option>
                <option value="Chuyên khoa Nhi">Chuyên khoa Nhi</option>
                <option value="Chuyên khoa Ngoại">Chuyên khoa Ngoại</option>
                <option value="Chuyên khoa Sản">Chuyên khoa Sản</option>
                <option value="Chuyên khoa Tai Mũi Họng">Chuyên khoa Tai Mũi Họng</option>
                <option value="Chuyên khoa Da liễu">Chuyên khoa Da liễu</option>
                <option value="Chuyên khoa Ung bướu">Chuyên khoa Ung bướu</option>
                <option value="Chuyên khoa Phục hồi chức năng">Chuyên khoa Phục hồi chức năng</option>
                <option value="Chuyên khoa Tim mạch">Chuyên khoa Tim mạch</option>
              </select>
            </div>
            <div class="form-group" style="flex: 1;">
              <label>Số năm kinh nghiệm</label>
              <input type="text" id="docExperience" placeholder="VD: Hơn 15 năm kinh nghiệm">
            </div>
          </div>

          <div class="form-group">
            <label>Ảnh đại diện bác sĩ (URL hoặc tải ảnh lên)</label>
            <div style="display: flex; gap: 10px; align-items: center;">
              <input type="text" id="docAvatar" placeholder="/images/doc-1.png hoặc đường dẫn ảnh" style="flex: 1;">
              <label class="btn-choose-file"
                style="cursor: pointer; margin: 0; padding: 10px 16px; font-size: 0.85rem; border-radius: 8px; display: inline-flex; align-items: center; gap: 6px; background: #104936; color: #fff;">
                <i class="fas fa-upload"></i> Tải ảnh
                <input type="file" id="docAvatarFileInput" accept="image/*" style="display: none;"
                  onchange="handleDoctorAvatarUpload(this)">
              </label>
            </div>
          </div>

          <div class="form-row">
            <div class="form-group" style="flex: 1;">
              <label>Trạng thái công tác</label>
              <select id="docStatus">
                <option value="active">Đang công tác</option>
                <option value="inactive">Tạm ngưng tiếp nhận</option>
              </select>
            </div>
            <div class="form-group" style="flex: 1;">
              <label>Hiển thị tại trang Đội ngũ bác sĩ</label>
              <div style="display: flex; align-items: center; gap: 12px; height: 42px;">
                <label class="admin-switch">
                  <input type="checkbox" id="docShowOnPage" checked onchange="updateDocShowStatus(this.checked)">
                  <span class="admin-slider"></span>
                </label>
                <span id="docShowStatusText" style="font-size: 0.92rem; font-weight: 600; color: #104936;">
                  Bật (Đang hiển thị)
                </span>
              </div>
              <input type="hidden" id="docSortOrder" value="0">
            </div>
          </div>

          <div class="form-group">
            <label>Mô tả / Quá trình công tác</label>
            <textarea id="docDescription" rows="2" placeholder="Tóm tắt quá trình công tác, thành tựu y khoa..."></textarea>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-cancel" onclick="closeDoctorModal()">Hủy</button>
          <button type="submit" class="btn-save" id="btnSaveDoctor"><i class="fas fa-save"></i> Lưu</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ===================== MODAL TIN TỨC ===================== -->
  <div id="newsModal" class="modal-overlay">
    <div class="modal" style="max-width: 820px; width: 95%;">
      <div class="modal-header">
        <h3 id="newsModalTitle">Đăng Bài Viết Tin Tức Y Tế</h3>
        <button class="modal-close" onclick="closeNewsModal()"><i class="fas fa-times"></i></button>
      </div>
      <form id="newsForm">
        <input type="hidden" id="newsId">
        <div class="modal-body">
          <div class="form-group">
            <label>Tiêu đề bài viết <span class="required">*</span></label>
            <input type="text" id="nTitle" placeholder="VD: 5 thói quen giúp tăng cường sức đề kháng..." required>
          </div>

          <div class="form-row">
            <div class="form-group" style="flex: 1;">
              <label>Chuyên mục</label>
              <select id="nCategory">
                <option value="Kiến thức y khoa">Kiến thức y khoa</option>
                <option value="Bệnh học thường gặp">Bệnh học thường gặp</option>
                <option value="Dinh dưỡng sức khỏe">Dinh dưỡng sức khỏe</option>
                <option value="Chăm sóc sức khỏe">Chăm sóc sức khỏe</option>
              </select>
              <input type="hidden" id="nAuthor" value="An Phúc Medical">
            </div>

            <div class="form-group" style="flex: 1.5;">
              <label>Ảnh bìa bài viết (URL hoặc tải lên)</label>
              <div style="display: flex; gap: 8px;">
                <input type="text" id="nImage" value="images/news-1.png" placeholder="images/news-1.png hoặc URL">
                <label class="btn-choose-file"
                  style="cursor: pointer; margin: 0; padding: 10px 14px; font-size: 0.82rem; border-radius: 8px; display: inline-flex; align-items: center; gap: 4px; background: #104936; color: #fff; white-space: nowrap;">
                  <i class="fas fa-upload"></i> Tải ảnh bìa
                  <input type="file" accept="image/*" style="display: none;" onchange="handleNewsCoverUpload(this)">
                </label>
              </div>
            </div>
          </div>

          <div class="form-group">
            <label>Tóm tắt ngắn (Hiển thị ngoài trang danh sách tin)</label>
            <textarea id="nSummary" rows="2" placeholder="Tóm tắt nội dung chính trong 1-2 câu..."></textarea>
          </div>

          <div class="form-group">
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px;">
              <label style="margin: 0;">Nội dung bài viết chi tiết (Hỗ trợ định dạng HTML/CSS, chèn ảnh)</label>
              <button type="button" class="btn-preview-toggle" onclick="toggleNewsPreview()"
                style="background: #eaf5ee; border: 1px solid #104936; color: #104936; padding: 4px 12px; border-radius: 6px; font-size: 0.78rem; font-weight: 600; cursor: pointer;">
                <i class="fas fa-eye"></i> Xem trước bài viết
              </button>
            </div>

            <!-- Thanh công cụ soạn thảo nhanh -->
            <div class="article-editor-toolbar"
              style="background: #f1f5f9; padding: 6px 10px; border-radius: 8px 8px 0 0; border: 1px solid #cbd5e1; border-bottom: none; display: flex; gap: 6px; flex-wrap: wrap;">
              <button type="button" class="tool-btn" title="Tiêu đề đoạn H2" onclick="insertArticleTag('h2')"><i
                  class="fas fa-heading"></i> H2</button>
              <button type="button" class="tool-btn" title="Đoạn văn thường P" onclick="insertArticleTag('p')"><i
                  class="fas fa-paragraph"></i> Đoạn</button>
              <button type="button" class="tool-btn" title="In đậm Bold" onclick="insertArticleTag('b')"><i
                  class="fas fa-bold"></i> Đậm</button>
              <button type="button" class="tool-btn" title="In nghiêng Italic" onclick="insertArticleTag('i')"><i
                  class="fas fa-italic"></i> Nghiêng</button>
              <button type="button" class="tool-btn" title="Danh sách đầu dòng" onclick="insertArticleTag('ul')"><i
                  class="fas fa-list-ul"></i> Danh sách</button>
              <button type="button" class="tool-btn" title="Hộp ghi chú nổi bật"
                onclick="insertArticleTag('callout')"><i class="fas fa-info-circle"></i> Hộp ghi chú</button>

              <!-- Nút tải ảnh lên từ máy tính chèn trực tiếp vào bài viết -->
              <label class="tool-btn" title="Tải ảnh từ máy và chèn vào bài viết"
                style="margin: 0; cursor: pointer; display: inline-flex; align-items: center; gap: 4px;">
                <i class="fas fa-image"></i> Tải & Chèn ảnh
                <input type="file" accept="image/*" style="display: none;" onchange="handleUploadContentImage(this)">
              </label>

              <!-- Nút chèn ảnh bằng link online -->
              <button type="button" class="tool-btn" title="Chèn ảnh qua đường link URL"
                onclick="insertContentImageUrl()"><i class="fas fa-link"></i> Link ảnh</button>
            </div>

            <textarea id="nContent" rows="12"
              style="border-radius: 0 0 8px 8px; font-family: Consolas, 'Courier New', monospace; font-size: 0.92rem; line-height: 1.6; border: 1px solid #cbd5e1; width: 100%; box-sizing: border-box; padding: 12px;"
              placeholder="Nhập nội dung bài viết tại đây. Bạn có thể gõ trực tiếp văn bản thường, hoặc chèn các thẻ HTML (<p>, <h2>, <ul>, <img>), kèm mã CSS tùy biến trong cặp thẻ <style>..."></textarea>

            <!-- Khung xem trước trực tiếp (Live Preview) -->
            <div id="newsContentPreviewBox"
              style="display: none; margin-top: 14px; border: 1.5px solid #a7d7b8; border-radius: 10px; padding: 20px; background: #ffffff; max-height: 380px; overflow-y: auto; box-shadow: 0 6px 16px rgba(0,0,0,0.06);">
              <div
                style="font-size: 0.84rem; font-weight: 700; color: #104936; margin-bottom: 14px; border-bottom: 1.5px dashed #cbd5e1; padding-bottom: 8px; display: flex; align-items: center; gap: 8px;">
                <i class="fas fa-check-circle"></i> XEM TRƯỚC HIỂN THỊ NỘI DUNG (HTML / CSS / HÌNH ẢNH):
              </div>
              <div id="newsContentPreviewRender" class="article-content-preview-body"
                style="font-size: 1rem; line-height: 1.8; color: #334155;"></div>
            </div>
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-cancel" onclick="closeNewsModal()">Hủy</button>
          <button type="submit" class="btn-save"><i class="fas fa-save"></i> Lưu bài viết vào SQL Server</button>
        </div>
      </form>
    </div>
  </div>

  <!-- ===================== MODAL ĐỔI MẬT KHẨU ===================== -->
  <div id="changePasswordModal" class="modal-overlay">
    <div class="modal" style="max-width: 480px;">
      <div class="modal-header">
        <h3><i class="fas fa-key" style="color: #104936;"></i> Cập nhật Mật khẩu Quản trị</h3>
        <button class="modal-close" onclick="closeChangePasswordModal()"><i class="fas fa-times"></i></button>
      </div>
      <form id="changePasswordForm">
        <div class="modal-body">
          <input type="hidden" id="cpUsername" value="admin">
          <div class="form-group">
            <label>Mật khẩu hiện tại <span class="required">*</span></label>
            <input type="password" id="cpOldPassword" required
              placeholder="Nhập mật khẩu hiện tại (mặc định: admin123)">
          </div>
          <div class="form-group">
            <label>Mật khẩu mới <span class="required">*</span></label>
            <input type="password" id="cpNewPassword" required minlength="6" placeholder="Tối thiểu 6 ký tự">
          </div>
          <div class="form-group">
            <label>Xác nhận mật khẩu mới <span class="required">*</span></label>
            <input type="password" id="cpConfirmPassword" required minlength="6" placeholder="Nhập lại mật khẩu mới">
          </div>
          <div id="cpErrorMsg"
            style="display: none; padding: 10px 14px; border-radius: 8px; background: #fef2f2; border: 1px solid #fecaca; color: #dc2626; font-size: 0.85rem; margin-top: 10px;">
          </div>
        </div>
        <div class="modal-footer">
          <button type="button" class="btn-cancel" onclick="closeChangePasswordModal()">Hủy</button>
          <button type="submit" class="btn-save" style="background: #104936;"><i class="fas fa-save"></i> Cập nhật mật
            khẩu</button>
        </div>
      </form>
    </div>
  </div>
`;

// Thay thế toàn bộ phần modal cuối file
const modalsCleanRegex = /<\/form>\s*<\/div>\s*<\/div>\s*<\/section>[\s\S]*?<div id="toastContainer"/i;
adminHtml = adminHtml.replace(
  modalsCleanRegex,
  `</form>\n            </div>\n          </div>\n        </section>\n      </div>\n    </div>\n  </div>\n\n${allCompleteModals}\n\n  <div id="toastContainer"`
);

fs.writeFileSync('public/admin/index.html', adminHtml, 'utf8');
console.log('✓ Restored all complete modals into public/admin/index.html');

// ========================================================
// 2. CẬP NHẬT public/admin/js/admin.js
// ========================================================
let adminJs = fs.readFileSync('public/admin/js/admin.js', 'utf8');

// 2.1 Bỏ icon trước text "Hiển thị" trong renderDoctorsTable
// Thay '🟢 Hiển thị' : '⚪ Đã ẩn' bằng 'Hiển thị' : 'Đã ẩn', thêm white-space: nowrap
adminJs = adminJs.replace(
  /\$\{d\.status === 'active' \? '🟢 Hiển thị' : '⚪ Đã ẩn'\}/g,
  "${d.status === 'active' ? 'Hiển thị' : 'Đã ẩn'}"
);
// Đảm bảo badge có white-space: nowrap
adminJs = adminJs.replace(
  /class="badge \$\{d\.status === 'active' \? 'badge-confirmed' : 'badge-cancelled'\}"\s*style="cursor: pointer; user-select: none;/g,
  `class="badge \${d.status === 'active' ? 'badge-confirmed' : 'badge-cancelled'}" style="cursor: pointer; user-select: none; white-space: nowrap; font-size: 0.84rem; padding: 6px 14px;`
);

// 2.2 Đảm bảo setupEventListeners an toàn 100%
const safeSetupEventListeners = `function setupEventListeners() {
  document.getElementById('adminLoginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('btnLogout')?.addEventListener('click', handleLogout);

  // Nav tabs
  document.querySelectorAll('.nav-tab').forEach(tab => {
    tab.addEventListener('click', function (e) {
      e.preventDefault();
      const target = this.getAttribute('data-target');
      switchSection(target);
    });
  });

  // Forms
  const sForm = document.getElementById('serviceForm');
  if (sForm) sForm.addEventListener('submit', handleSaveService);
  const deptForm = document.getElementById('departmentForm');
  if (deptForm) deptForm.addEventListener('submit', handleSaveDepartment);
  const docForm = document.getElementById('doctorForm');
  if (docForm) docForm.addEventListener('submit', handleSaveDoctor);
  const nForm = document.getElementById('newsForm');
  if (nForm) nForm.addEventListener('submit', handleSaveNews);
  const bForm = document.getElementById('bannerConfigForm');
  if (bForm) bForm.addEventListener('submit', handleSaveBanner);

  // Banner tabs
  document.querySelectorAll('.btn-banner-tab').forEach(btn => {
    btn.addEventListener('click', function () {
      const pageKey = this.getAttribute('data-page');
      switchBannerTab(pageKey);
    });
  });

  // Live preview listeners
  ['bTitle', 'bSubtitle', 'bTagline', 'bBtnText'].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener('input', updateBannerLivePreview);
  });

  const nContentEl = document.getElementById('nContent');
  if (nContentEl) nContentEl.addEventListener('input', updateNewsPreviewIfOpen);

  setupBannerUpload();
  setupLogoUpload();

  const cpForm = document.getElementById('changePasswordForm');
  if (cpForm) cpForm.addEventListener('submit', handleChangePassword);
}`;

adminJs = adminJs.replace(
  /function setupEventListeners\(\)\s*\{[\s\S]*?^\}/m,
  safeSetupEventListeners
);

// 2.3 Đảm bảo switchBannerTab
const switchBannerTabImpl = `function switchBannerTab(pageKey) {
  document.querySelectorAll('.btn-banner-tab').forEach(b => {
    if (b.getAttribute('data-page') === pageKey) {
      b.classList.add('active');
    } else {
      b.classList.remove('active');
    }
  });
  currentBannerPage = pageKey;
  selectBannerPage(pageKey);
}
window.switchBannerTab = switchBannerTab;`;

if (!adminJs.includes('window.switchBannerTab = switchBannerTab;')) {
  adminJs = adminJs.replace(
    'function selectBannerPage(pageKey) {',
    `${switchBannerTabImpl}\n\nfunction selectBannerPage(pageKey) {`
  );
}

fs.writeFileSync('public/admin/js/admin.js', adminJs, 'utf8');
console.log('✓ Updated public/admin/js/admin.js with clean status text and safe setupEventListeners');

// ========================================================
// 3. CẬP NHẬT HEADER NAV TRÊN TẤT CẢ CÁC TRANG (public/ & html/)
//    - Ẩn Tin tức ở menu header
//    - Hiển thị Chuyên khoa ngay sau Dịch vụ trên tất cả các trang
// ========================================================
const websitePages = [
  'index.html',
  'dich-vu.html',
  'doi-ngu-bac-si.html',
  'chuyen-khoa.html',
  'lien-he.html',
  'dat-lich-kham.html',
  'san-pham.html',
  'tin-tuc.html',
  'chi-tiet-tin-tuc.html'
];

function generateCleanNav(pageName) {
  const isHome = pageName === 'index.html' ? ' class="active"' : '';
  const isDichVu = pageName === 'dich-vu.html' ? ' active' : '';
  const isChuyenKhoa = pageName === 'chuyen-khoa.html' ? ' class="active"' : '';
  const isBacSi = pageName === 'doi-ngu-bac-si.html' ? ' class="active"' : '';
  const isLienHe = pageName === 'lien-he.html' ? ' class="active"' : '';

  return `<nav class="nav" id="mainNav">
        <a href="index.html"${isHome}>Trang chủ</a>
        <div class="dropdown">
          <a href="dich-vu.html" class="dropdown-toggle${isDichVu}">Dịch vụ <i class="fas fa-chevron-down" style="font-size:0.7rem; margin-left:3px;"></i></a>
          <div class="dropdown-menu">
            <a href="dich-vu.html#kham-tong-quat">Khám tổng quát</a>
            <a href="dich-vu.html#kham-chuyen-khoa">Khám chuyên khoa</a>
            <a href="dich-vu.html#tiem-chung">Tiêm chủng</a>
            <a href="dich-vu.html#xet-nghiem">Xét nghiệm</a>
            <a href="dich-vu.html#chan-doan">Chẩn đoán hình ảnh</a>
            <a href="dich-vu.html#noi-tru">Điều trị nội trú</a>
          </div>
        </div>
        <a href="chuyen-khoa.html"${isChuyenKhoa}>Chuyên khoa</a>
        <a href="doi-ngu-bac-si.html"${isBacSi}>Đội ngũ bác sĩ</a>
        <a href="lien-he.html"${isLienHe}>Liên hệ</a>
      </nav>`;
}

['public', 'html'].forEach(folder => {
  websitePages.forEach(p => {
    const filePath = path.join(folder, p);
    if (fs.existsSync(filePath)) {
      let content = fs.readFileSync(filePath, 'utf8');
      const navRegex = /<nav class="nav"[^>]*>[\s\S]*?<\/nav>/i;
      if (navRegex.test(content)) {
        content = content.replace(navRegex, generateCleanNav(p));
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✓ Cleaned header nav for: ${filePath}`);
      }
    }
  });
});

console.log('>>> Hoàn tất toàn bộ cập nhật!');
