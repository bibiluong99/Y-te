/* ============================================================
   ADMIN JAVASCRIPT LOGIC - SQL Server Database Realtime Sync
   Phòng Khám Đa Khoa An Phúc
   ============================================================ */

const API_BASE = '/api';

let currentUser = null;
let servicesData = [];
let departmentsData = [];
let doctorsData = [];
let productsData = [];
let newsData = [];
let appointmentsData = [];
let contactsData = [];
let bannersData = {};
let currentBannerPage = 'home';

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupEventListeners();
});

// 1. AUTHENTICATION (admin / admin123)
function checkAuth() {
  const savedToken = localStorage.getItem('anphuc_admin_token');
  const savedUser = localStorage.getItem('anphuc_admin_user');

  if (savedToken && savedUser) {
    currentUser = JSON.parse(savedUser);
    showAdminDashboard();
  } else {
    showLoginScreen();
  }
}

function showLoginScreen() {
  document.getElementById('loginScreen').style.display = 'flex';
  document.getElementById('adminLayout').style.display = 'none';
}

function showAdminDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminLayout').style.display = 'flex';
  switchSection('section-appointments');
  loadAllData();
}

function handleLogin(e) {
  e.preventDefault();
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const errorEl = document.getElementById('loginError');

  fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  })
    .then(res => res.json())
    .then(data => {
      if (data.success) {
        localStorage.setItem('anphuc_admin_token', data.token);
        localStorage.setItem('anphuc_admin_user', JSON.stringify(data.user));
        currentUser = data.user;
        showToast('Đăng nhập hệ thống SQL Server thành công!', 'success');
        showAdminDashboard();
      } else {
        errorEl.classList.add('show');
        document.getElementById('loginErrorMsg').textContent = data.message || 'Sai tài khoản hoặc mật khẩu!';
      }
    })
    .catch(() => {
      if (username === 'admin' && password === 'admin123') {
        const u = { username: 'admin', role: 'Super Admin' };
        localStorage.setItem('anphuc_admin_token', 'local_token');
        localStorage.setItem('anphuc_admin_user', JSON.stringify(u));
        currentUser = u;
        showToast('Đăng nhập Quản trị thành công!', 'success');
        showAdminDashboard();
      } else {
        errorEl.classList.add('show');
      }
    });
}

function handleLogout() {
  localStorage.removeItem('anphuc_admin_token');
  localStorage.removeItem('anphuc_admin_user');
  currentUser = null;
  showToast('Đã đăng xuất', 'warning');
  showLoginScreen();
}

// 2. SETUP LISTENERS & TABS
function setupEventListeners() {
  document.getElementById('adminLoginForm')?.addEventListener('submit', handleLogin);
  document.getElementById('btnLogout')?.addEventListener('click', handleLogout);

  // Nav tabs (chỉ bind cho các tab có data-target, bỏ qua tab cha Cấu hình)
  document.querySelectorAll('.nav-tab[data-target]').forEach(tab => {
    tab.addEventListener('click', function (e) {
      e.preventDefault();
      const target = this.getAttribute('data-target');
      if (target) {
        switchSection(target);
      }
    });
  });

  // Forms
  const sForm = document.getElementById('serviceForm');
  if (sForm) sForm.addEventListener('submit', handleSaveService);
  const deptForm = document.getElementById('departmentForm');
  if (deptForm) deptForm.addEventListener('submit', handleSaveDepartment);
  const docForm = document.getElementById('doctorForm');
  if (docForm) docForm.addEventListener('submit', handleSaveDoctor);
  const pForm = document.getElementById('productForm');
  if (pForm) pForm.addEventListener('submit', handleSaveProduct);
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
  const compForm = document.getElementById('companySettingsForm');
  if (compForm) compForm.addEventListener('submit', saveCompanySettings);
}

function switchSection(targetId) {
  if (!targetId) return;
  const sec = document.getElementById(targetId);
  if (!sec) return;

  window.scrollTo({ top: 0, behavior: 'instant' });
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));

  const tab = document.querySelector(`.nav-tab[data-target="${targetId}"]`);
  if (tab) tab.classList.add('active');

  sec.classList.add('active');

  const titles = {
    'section-dashboard': 'Tổng quan hệ thống',
    'section-services': 'Quản lý Dịch vụ Y tế',
    'section-departments': 'Quản lý Chuyên khoa',
    'section-doctors': 'Quản lý Bác sĩ',
    'section-products': 'Quản lý Sản phẩm Y tế',
    'section-news': 'Quản lý Tin tức Y tế',
    'section-appointments': 'Quản lý Lịch hẹn khám',
    'section-contacts': 'Quản lý Liên hệ',
    'section-banners': 'Cấu hình banner',
    'section-schedule': 'Cấu hình thời gian khám',
    'section-company': 'Cấu hình công ty'
  };
  const titleText = titles[targetId] || 'Hệ thống Quản trị';
  document.getElementById('currentSectionTitle').textContent = titleText;
  const breadcrumbEl = document.getElementById('sectionBreadcrumb');
  if (breadcrumbEl) breadcrumbEl.textContent = titleText;
  const parentBreadcrumbEl = document.getElementById('sectionParentBreadcrumb');
  if (parentBreadcrumbEl) {
    if (targetId === 'section-banners' || targetId === 'section-schedule' || targetId === 'section-company') {
      parentBreadcrumbEl.textContent = 'Cấu hình';
    } else {
      parentBreadcrumbEl.textContent = 'Quản lý';
    }
  }

  // Xử lý mở submenu và active mục Cấu hình
  const configGroup = document.getElementById('configNavGroup');
  const configParent = document.getElementById('configParentTab');
  if (targetId === 'section-banners' || targetId === 'section-schedule' || targetId === 'section-company') {
    if (configGroup) configGroup.classList.add('open');
    if (configParent) configParent.classList.add('parent-active');
  } else {
    if (configParent) configParent.classList.remove('parent-active');
  }
}

function toggleConfigSubmenu(e) {
  if (e) {
    e.preventDefault();
    e.stopPropagation();
    if (typeof e.stopImmediatePropagation === 'function') {
      e.stopImmediatePropagation();
    }
  }
  const group = document.getElementById('configNavGroup');
  if (group) {
    group.classList.toggle('open');
  }
}

// 3. LOAD DATA TỪ SQL Server API
async function loadAllData() {
  await Promise.all([
    loadServices(),
    loadDepartments(),
    loadDoctors(),
    loadProducts(),
    loadNews(),
    loadAppointments(),
    loadContacts(),
    loadBanners(),
    loadSettings(),
    loadScheduleSettings()
  ]);
  updateStats();
  renderNotifications();
  if (!window._notifIntervalStarted) {
    window._notifIntervalStarted = true;
    setInterval(checkNewNotifications, 5000);
  }
}

async function loadServices() {
  try {
    const res = await fetch(`${API_BASE}/services?t=${Date.now()}`);
    servicesData = await res.json();
  } catch (e) {
    servicesData = [];
  }
  renderServicesTable(servicesData);
  renderDashboardServices(servicesData.slice(0, 5));
}

async function loadDepartments() {
  try {
    const res = await fetch(`${API_BASE}/departments?t=${Date.now()}`);
    departmentsData = await res.json();
  } catch (e) {
    departmentsData = [];
  }
  renderDepartmentsTable(departmentsData);
  updateDocDepartmentDropdown();
  updateFilterDeptDropdown();
}

async function loadProducts() {
  try {
    const res = await fetch(`${API_BASE}/products`);
    productsData = await res.json();
  } catch (e) {
    productsData = [];
  }
  renderProductsTable(productsData);
}

async function loadNews() {
  try {
    const res = await fetch(`${API_BASE}/news`);
    newsData = await res.json();
  } catch (e) {
    newsData = [];
  }
  renderNewsTable(newsData);
}

async function loadAppointments() {
  try {
    const res = await fetch(`${API_BASE}/appointments`);
    appointmentsData = await res.json();
  } catch (e) {
    appointmentsData = [];
  }
  if (!currentApptFilter.date) {
    currentApptFilter.date = getSelectedDateStr();
  }
  initApptFilterDropdowns();
  renderApptCalendar();
  applyAppointmentFilters();
}

async function loadContacts() {
  try {
    const res = await fetch(`${API_BASE}/contacts`);
    contactsData = await res.json();
  } catch (e) {
    contactsData = [];
  }
  renderContactsTable(contactsData);
}

function updateStats() {
  document.getElementById('statServicesCount').textContent = servicesData.length;
  document.getElementById('statProductsCount').textContent = productsData.length;
  document.getElementById('statNewsCount').textContent = newsData.length;
  document.getElementById('statAppointmentsCount').textContent = appointmentsData.length;
}

// 4. RENDER BẢNG
let serviceCurrentPage = 1;
const SERVICE_PAGE_SIZE = 10;
let currentServicesData = [];

function changeServicePage(page) {
  serviceCurrentPage = page;
  renderServicesTable(currentServicesData);
}

function renderServicesTable(items) {
  currentServicesData = items || [];
  const tbody = document.getElementById('servicesTableBody');
  const countInfo = document.getElementById('servicePaginationCount');
  const controlsEl = document.getElementById('servicePaginationControls');
  if (!tbody) return;

  if (!items || items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:35px 20px; color:#94a3b8;"><i class="fas fa-stethoscope" style="font-size:2rem; display:block; margin-bottom:8px; opacity:0.4;"></i>Chưa có dịch vụ nào trong cơ sở dữ liệu. Nhấn "Tạo Dịch Vụ Mới" để thêm!</td></tr>';
    if (countInfo) countInfo.textContent = 'Hiển thị 0 trong tổng số 0 dịch vụ';
    if (controlsEl) controlsEl.innerHTML = '';
    return;
  }

  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / SERVICE_PAGE_SIZE) || 1;
  if (serviceCurrentPage > totalPages) serviceCurrentPage = totalPages;
  if (serviceCurrentPage < 1) serviceCurrentPage = 1;

  const startIndex = (serviceCurrentPage - 1) * SERVICE_PAGE_SIZE;
  const endIndex = Math.min(startIndex + SERVICE_PAGE_SIZE, totalItems);
  const pageItems = items.slice(startIndex, endIndex);

  tbody.innerHTML = pageItems.map(s => {
    const bannerImg = s.banner || (s.icon && (s.icon.includes('/') || s.icon.includes('.')) ? s.icon : '');
    const imgOrIcon = bannerImg
      ? `<img src="${bannerImg}" alt="${escapeHtml(s.name)}" style="width: 36px; height: 36px; border-radius: 6px; object-fit: cover; display: block;" onerror="this.onerror=null; this.src='images/service-hero.png';">`
      : `<i class="${s.icon || 'fas fa-stethoscope'}"></i>`;
    return `
    <tr>
      <td><div class="icon-preview-box" style="display:flex; align-items:center; justify-content:center; overflow:hidden;">${imgOrIcon}</div></td>
      <td><strong>${escapeHtml(s.name)}</strong></td>
      <td><span class="badge badge-medical">${escapeHtml(s.category || 'Khám bệnh')}</span></td>
      <td><small style="color:#6b7280;">${escapeHtml(s.description || '')}</small></td>
      <td>
        <div class="action-btns">
          <button title="Sửa" onclick="editService(${s.id})"><i class="fas fa-edit"></i></button>
          <button class="btn-delete" title="Xóa" onclick="deleteService(${s.id})"><i class="fas fa-trash-alt"></i></button>
        </div>
      </td>
    </tr>
  `;}).join('');

  if (countInfo) {
    countInfo.textContent = `Hiển thị ${startIndex + 1} – ${endIndex} trong tổng số ${totalItems} dịch vụ`;
  }

  if (controlsEl) {
    let controlsHtml = `<button type="button" class="appt-page-arrow" ${serviceCurrentPage === 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : 'onclick="changeServicePage(' + (serviceCurrentPage - 1) + ')"'}><i class="fas fa-chevron-left"></i></button>`;
    for (let p = 1; p <= totalPages; p++) {
      if (p === serviceCurrentPage) {
        controlsHtml += `<span class="appt-page-number">${p}</span>`;
      } else {
        controlsHtml += `<button type="button" class="appt-page-arrow" onclick="changeServicePage(${p})">${p}</button>`;
      }
    }
    controlsHtml += `<button type="button" class="appt-page-arrow" ${serviceCurrentPage === totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : 'onclick="changeServicePage(' + (serviceCurrentPage + 1) + ')"'}><i class="fas fa-chevron-right"></i></button>`;
    controlsEl.innerHTML = controlsHtml;
  }
}

let deptCurrentPage = 1;
const DEPT_PAGE_SIZE = 10;

function changeDeptPage(page) {
  deptCurrentPage = page;
  renderDepartmentsTable(departmentsData);
}

function renderDepartmentsTable(items) {
  const tbody = document.getElementById('departmentsTableBody');
  const countInfo = document.getElementById('deptPaginationCount');
  const controlsEl = document.getElementById('deptPaginationControls');
  if (!tbody) return;

  if (!items || items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align:center; padding:30px; color:#94a3b8;">Chưa có chuyên khoa nào. Bấm "Tạo mới" để thêm!</td></tr>';
    if (countInfo) countInfo.textContent = 'Hiển thị 0 trong tổng số 0 chuyên khoa';
    if (controlsEl) controlsEl.innerHTML = '';
    return;
  }

  // Phân trang 10 data mỗi trang
  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / DEPT_PAGE_SIZE) || 1;
  if (deptCurrentPage > totalPages) deptCurrentPage = totalPages;
  if (deptCurrentPage < 1) deptCurrentPage = 1;

  const startIndex = (deptCurrentPage - 1) * DEPT_PAGE_SIZE;
  const endIndex = Math.min(startIndex + DEPT_PAGE_SIZE, totalItems);
  const pageItems = items.slice(startIndex, endIndex);

  tbody.innerHTML = pageItems.map(d => {
    const hasImg = d.image && d.image.trim() !== '';
    const imgHtml = hasImg
      ? `<div style="width: 80px; height: 54px; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0; background: #f8fafc; display: flex; align-items: center; justify-content: center; box-shadow: 0 1px 4px rgba(0,0,0,0.05);">
          <img src="${escapeHtml(d.image)}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.onerror=null; this.src='images/spec-noi-tong-quat.png';">
        </div>`
      : `<div style="width: 80px; height: 54px; border-radius: 8px; border: 1px dashed #cbd5e1; background: #f8fafc; display: flex; align-items: center; justify-content: center; color: #104936; font-size: 1.3rem;">
          <i class="${d.icon || 'fas fa-stethoscope'}"></i>
        </div>`;
    const statusBadge = d.status === 'inactive'
      ? '<span class="badge" style="background:#fee2e2; color:#b91c1c;">Tạm ngưng</span>'
      : '<span class="badge active">Hoạt động</span>';

    return `
      <tr>
        <td>${imgHtml}</td>
        <td>
          <strong style="color: #104936; font-size: 0.95rem;">${escapeHtml(d.name)}</strong>
        </td>
        <td><code style="background:#f1f5f9; padding:3px 8px; border-radius:4px; font-size:0.82rem; color:#475569; font-weight: 600;">${escapeHtml(d.code || '')}</code></td>
        <td>${statusBadge}</td>
        <td><small style="color:#6b7280; display:-webkit-box; -webkit-line-clamp:2; -webkit-box-orient:vertical; overflow:hidden; line-height: 1.45;">${escapeHtml(d.description || '')}</small></td>
        <td>
          <div class="action-btns">
            <button title="Sửa" onclick="editDepartment(${d.id})"><i class="fas fa-edit"></i></button>
            <button class="btn-delete" title="Xóa" onclick="deleteDepartment(${d.id})"><i class="fas fa-trash-alt"></i></button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  // Cập nhật text số lượng phân trang
  if (countInfo) {
    countInfo.textContent = `Hiển thị ${startIndex + 1} – ${endIndex} trong tổng số ${totalItems} chuyên khoa`;
  }

  // Cập nhật các nút phân trang
  if (controlsEl) {
    let controlsHtml = `<button type="button" class="appt-page-arrow" ${deptCurrentPage === 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : 'onclick="changeDeptPage(' + (deptCurrentPage - 1) + ')"'}><i class="fas fa-chevron-left"></i></button>`;
    for (let p = 1; p <= totalPages; p++) {
      if (p === deptCurrentPage) {
        controlsHtml += `<span class="appt-page-number">${p}</span>`;
      } else {
        controlsHtml += `<button type="button" class="appt-page-arrow" onclick="changeDeptPage(${p})">${p}</button>`;
      }
    }
    controlsHtml += `<button type="button" class="appt-page-arrow" ${deptCurrentPage === totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : 'onclick="changeDeptPage(' + (deptCurrentPage + 1) + ')"'}><i class="fas fa-chevron-right"></i></button>`;
    controlsEl.innerHTML = controlsHtml;
  }
}

function renderDashboardServices(items) {
  const tbody = document.getElementById('dashboardRecentServices');
  if (!tbody) return;
  tbody.innerHTML = items.map(s => `
    <tr>
      <td><div class="icon-preview-box" style="width:36px; height:36px; font-size:1rem;"><i class="${s.icon || 'fas fa-stethoscope'}"></i></div></td>
      <td><strong>${escapeHtml(s.name)}</strong></td>
      <td><span class="badge badge-medical">${escapeHtml(s.category || 'Khám bệnh')}</span></td>
    </tr>
  `).join('');
}

function renderProductsTable(items) {
  const tbody = document.getElementById('productsTableBody');
  if (!tbody) return;
  tbody.innerHTML = items.map(p => `
    <tr>
      <td><img class="thumb-preview" src="${p.image || 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=100'}" alt=""></td>
      <td><strong>${escapeHtml(p.name)}</strong></td>
      <td><span class="badge badge-device">${escapeHtml(p.category || 'Thiết bị y tế')}</span></td>
      <td><strong style="color:#0F5132;">${formatVND(p.price)}</strong></td>
      <td><b>${p.stock ?? 50}</b></td>
      <td><span class="badge active">Đang bán</span></td>
      <td>
        <div class="action-btns">
          <button title="Sửa" onclick="editProduct(${p.id})"><i class="fas fa-edit"></i></button>
          <button class="btn-delete" title="Xóa" onclick="deleteProduct(${p.id})"><i class="fas fa-trash-alt"></i></button>
        </div>
      </td>
    </tr>
  `).join('');
}

let newsCurrentPage = 1;
const NEWS_PAGE_SIZE = 10;
let currentNewsData = [];

function changeNewsPage(page) {
  newsCurrentPage = page;
  renderNewsTable(currentNewsData);
}

function renderNewsTable(items) {
  currentNewsData = items || [];
  const tbody = document.getElementById('newsTableBody');
  const countInfo = document.getElementById('newsPaginationCount');
  const controlsEl = document.getElementById('newsPaginationControls');
  if (!tbody) return;

  if (!items || items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#94a3b8;">Chưa có bài viết tin tức nào. Bấm "Thêm bài viết mới" để thêm!</td></tr>';
    if (countInfo) countInfo.textContent = 'Hiển thị 0 trong tổng số 0 bài viết';
    if (controlsEl) controlsEl.innerHTML = '';
    return;
  }

  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / NEWS_PAGE_SIZE) || 1;
  if (newsCurrentPage > totalPages) newsCurrentPage = totalPages;
  if (newsCurrentPage < 1) newsCurrentPage = 1;

  const startIndex = (newsCurrentPage - 1) * NEWS_PAGE_SIZE;
  const endIndex = Math.min(startIndex + NEWS_PAGE_SIZE, totalItems);
  const pageItems = items.slice(startIndex, endIndex);

  tbody.innerHTML = pageItems.map(n => `
    <tr>
      <td><img class="thumb-preview" src="${n.image || 'images/news-1.png'}" alt=""></td>
      <td><strong>${escapeHtml(n.title)}</strong></td>
      <td><span class="badge active">${escapeHtml(n.category || 'Y tế')}</span></td>
      <td>${n.created_at || '20/05/2025'}</td>
      <td>
        <div class="action-btns">
          <button title="Sửa" onclick="editNews(${n.id})"><i class="fas fa-edit"></i></button>
          <button class="btn-delete" title="Xóa" onclick="deleteNews(${n.id})"><i class="fas fa-trash-alt"></i></button>
        </div>
      </td>
    </tr>
  `).join('');

  if (countInfo) {
    countInfo.textContent = `Hiển thị ${startIndex + 1} – ${endIndex} trong tổng số ${totalItems} bài viết`;
  }

  if (controlsEl) {
    let controlsHtml = `<button type="button" class="appt-page-arrow" ${newsCurrentPage === 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : 'onclick="changeNewsPage(' + (newsCurrentPage - 1) + ')"'}><i class="fas fa-chevron-left"></i></button>`;
    for (let p = 1; p <= totalPages; p++) {
      if (p === newsCurrentPage) {
        controlsHtml += `<span class="appt-page-number">${p}</span>`;
      } else {
        controlsHtml += `<button type="button" class="appt-page-arrow" onclick="changeNewsPage(${p})">${p}</button>`;
      }
    }
    controlsHtml += `<button type="button" class="appt-page-arrow" ${newsCurrentPage === totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : 'onclick="changeNewsPage(' + (newsCurrentPage + 1) + ')"'}><i class="fas fa-chevron-right"></i></button>`;
    controlsEl.innerHTML = controlsHtml;
  }
}


// ============================================================
// APPOINTMENTS DASHBOARD LOGIC (Calendar & Filters & Table)
// ============================================================
let currentCalYear = new Date().getFullYear();
let currentCalMonth = new Date().getMonth() + 1;
let selectedCalDay = new Date().getDate();
let currentApptFilter = {
  doctor: '',
  status: '',
  time: '',
  department: '',
  date: ''
};

function normalizeDateStr(d) {
  if (!d) return '';
  d = String(d).trim();
  if (d.includes('T')) d = d.split('T')[0];
  const parts = d.split('-');
  if (parts.length === 3) {
    const y = parts[0].trim();
    const m = parts[1].trim().padStart(2, '0');
    const day = parts[2].trim().padStart(2, '0');
    return `${y}-${m}-${day}`;
  }
  return d;
}

function getSelectedDateStr() {
  if (!selectedCalDay) return '';
  const m = String(currentCalMonth).padStart(2, '0');
  const d = String(selectedCalDay).padStart(2, '0');
  return `${currentCalYear}-${m}-${d}`;
}

function normalizeStr(str) {
  if (!str) return '';
  return str.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/[^a-z0-9]/g, '');
}

function cleanDoctorName(name) {
  if (!name) return '';
  let clean = name.replace(/\s*\([^)]*\)/g, '').trim();
  // Loại bỏ hoàn toàn các tiền tố học hàm, học vị, chức danh (BS., CKII., CKI., ThS., TS., GS., PGS., Bác sĩ, Thạc sĩ...)
  const prefixRegex = /^(GS\.|PGS\.|TS\.|ThS\.|BS\.|BS\b|CKI\.|CKII\.|CK1\.|CK2\.|Bác sĩ\b|Thạc sĩ\b|Tiến sĩ\b|Giáo sư\b|Phó giáo sư\b)\s*/i;
  while (prefixRegex.test(clean)) {
    clean = clean.replace(prefixRegex, '').trim();
  }
  return clean;
}

const CLINIC_DOCTORS_MAPPING = [
  { name: 'BS. CKII. Nguyễn Văn Minh', depts: ['Nội tổng quát', 'Khám nội tổng quát', 'Chuyên khoa Nội', 'Khoa Nội', 'Ung bướu'] },
  { name: 'BS. Trần Thị Lan', depts: ['Nhi khoa', 'Khoa Nhi', 'Tiêm chủng'] },
  { name: 'ThS. BS. Lê Hoàng Anh', depts: ['Phục hồi chức năng', 'Ngoại khoa', 'Khoa Ngoại', 'Cơ xương khớp'] },
  { name: 'BS. CKI. Phạm Thị Mai', depts: ['Sản phụ khoa', 'Khoa Sản'] },
  { name: 'BS. Trần Quốc Bảo', depts: ['Tim mạch'] },
  { name: 'BS. Đặng Văn Hùng', depts: ['Tai - Mũi - Họng', 'Tai Mũi Họng', 'Khoa Tai Mũi Họng'] },
  { name: 'BS. Vũ Thị Ngọc', depts: ['Da liễu', 'Khoa Da liễu'] }
];

function getAllClinicDoctors() {
  const map = new Map();
  if (Array.isArray(doctorsData) && doctorsData.length > 0) {
    doctorsData.forEach(d => {
      if (d.name) {
        const cName = cleanDoctorName(d.name);
        const existing = map.get(cName) || [];
        if (d.department && !existing.includes(d.department)) {
          existing.push(d.department);
        }
        map.set(cName, existing);
      }
    });
  } else {
    CLINIC_DOCTORS_MAPPING.forEach(doc => {
      map.set(cleanDoctorName(doc.name), [...doc.depts]);
    });
  }
  return Array.from(map.entries()).map(([name, depts]) => ({ name, depts }));
}

// Cập nhật danh sách options bác sĩ theo khoa đã chọn (chỉ hiển thị duy nhất tên bác sĩ)
function updateDoctorFilterOptions(selectedDept = '') {
  const docSelect = document.getElementById('filterDoctorSelect');
  if (!docSelect) return;

  const currentVal = docSelect.value || currentApptFilter.doctor || '';

  const allDoctors = getAllClinicDoctors();
  let matchedDoctors = allDoctors;

  const hasDept = Boolean(selectedDept && selectedDept.trim() !== '');
  if (hasDept) {
    const sNorm = normalizeStr(selectedDept);
    matchedDoctors = allDoctors.filter(doc =>
      doc.depts.some(d => {
        const dNorm = normalizeStr(d);
        return sNorm.includes(dNorm) || dNorm.includes(sNorm);
      })
    );
  }

  // Duy nhất tên bác sĩ (không trùng lặp, sạch)
  const uniqueNames = [...new Set(matchedDoctors.map(d => cleanDoctorName(d.name)).filter(Boolean))];

  if (hasDept && uniqueNames.length === 0) {
    docSelect.innerHTML = '<option value="" disabled selected>Không có bác sĩ</option>';
    docSelect.value = '';
    return;
  }

  docSelect.innerHTML = '<option value="">Bác sĩ</option>' +
    uniqueNames.map(name => `<option value="${escapeHtml(name)}">${escapeHtml(name)}</option>`).join('');

  if (currentVal && uniqueNames.includes(currentVal)) {
    docSelect.value = currentVal;
  }
}

// Khi người dùng thay đổi bộ lọc Khoa
function onFilterDeptChange() {
  const deptSelect = document.getElementById('filterDeptSelect');
  const docSelect = document.getElementById('filterDoctorSelect');
  const selectedDept = deptSelect ? deptSelect.value : '';

  // 1. Tự động clear data bác sĩ đã chọn trước đó
  if (docSelect) {
    docSelect.value = '';
  }
  currentApptFilter.doctor = '';

  // 2. Cập nhật danh sách bộ lọc bác sĩ thuộc khoa đó
  updateDoctorFilterOptions(selectedDept);

  // 3. Thực hiện lọc danh sách lịch hẹn
  applyAppointmentFilters();
}

// Khi người dùng thay đổi bộ lọc Bác sĩ
function onFilterDoctorChange() {
  const docSelect = document.getElementById('filterDoctorSelect');
  const selectedDoc = docSelect ? docSelect.value : '';
  currentApptFilter.doctor = selectedDoc;

  // Lọc theo bác sĩ trong phạm vi ngày đang chọn trên lịch (không tự ý đổi ngày)
  applyAppointmentFilters();
}

// Khởi tạo các dropdown bộ lọc bác sĩ & chuyên khoa
function updateFilterDeptDropdown() {
  const deptSelect = document.getElementById('filterDeptSelect');
  if (!deptSelect) return;
  const currentVal = deptSelect.value;
  let deptNames = [];
  if (Array.isArray(departmentsData) && departmentsData.length > 0) {
    deptNames = departmentsData.map(d => d.name);
  } else {
    deptNames = [
      'Khám nội tổng quát',
      'Phục hồi chức năng',
      'Nhi khoa',
      'Sản phụ khoa',
      'Tim mạch',
      'Hô hấp',
      'Tiêu hóa',
      'Tiêm chủng',
      'Da liễu',
      'Cơ xương khớp',
      'Mắt',
      'Tai - Mũi - Họng',
      'Thần kinh',
      'Nội tiết',
      'Tiết niệu',
      'Ung bướu'
    ];
  }
  const uniqueDepts = [...new Set(deptNames.filter(Boolean))];
  deptSelect.innerHTML = '<option value="">Khoa</option>' +
    uniqueDepts.map(dp => `<option value="${escapeHtml(dp)}">${escapeHtml(dp)}</option>`).join('');
  if (currentVal && uniqueDepts.includes(currentVal)) {
    deptSelect.value = currentVal;
  }
}

function initApptFilterDropdowns() {
  const deptSelect = document.getElementById('filterDeptSelect');
  if (deptSelect && deptSelect.options.length <= 1) {
    updateFilterDeptDropdown();
  }

  // Khởi tạo danh sách bác sĩ (chỉ nếu chưa có)
  const docSelect = document.getElementById('filterDoctorSelect');
  if (docSelect && docSelect.options.length <= 1) {
    const currentDept = document.getElementById('filterDeptSelect')?.value || '';
    updateDoctorFilterOptions(currentDept);
  }
}

// Render Lịch tháng (Tất cả các ngày đều click được, hiển thị chấm trạng thái lịch hẹn)
function renderApptCalendar() {
  const container = document.getElementById('calDaysGridContainer');
  const label = document.getElementById('calMonthYearLabel');
  if (!container || !label) return;

  label.textContent = `Tháng ${currentCalMonth} năm ${currentCalYear}`;

  // Tính ngày bắt đầu trong tuần (T2 = 0, ..., CN = 6)
  const firstDayOfMonth = new Date(currentCalYear, currentCalMonth - 1, 1);
  let startDayOfWeek = firstDayOfMonth.getDay(); // 0 là CN, 1 là T2...
  let dayOffset = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  const daysInMonth = new Date(currentCalYear, currentCalMonth, 0).getDate();
  const daysInPrevMonth = new Date(currentCalYear, currentCalMonth - 1, 0).getDate();

  const daysData = [];

  // 1. Ngày tháng trước
  for (let i = dayOffset - 1; i >= 0; i--) {
    const d = daysInPrevMonth - i;
    daysData.push({ day: d, other: true });
  }

  // 2. Ngày tháng hiện tại (Tất cả đều chọn được)
  for (let d = 1; d <= daysInMonth; d++) {
    daysData.push({ day: d, other: false });
  }

  // 3. Ngày tháng sau để đủ khung lưới (35 hoặc 42 ô)
  const totalCells = daysData.length <= 35 ? 35 : 42;
  const remaining = totalCells - daysData.length;
  for (let d = 1; d <= remaining; d++) {
    daysData.push({ day: d, other: true });
  }

  container.innerHTML = daysData.map(d => {
    const isOther = d.other ? 'other-month' : '';
    const isSelected = (!d.other && d.day === selectedCalDay) ? 'today-active' : '';

    // Render chấm tròn hiển thị có lịch hẹn cho ngày
    let dotsHtml = '';
    if (!d.other && Array.isArray(appointmentsData)) {
      const mStr = String(currentCalMonth).padStart(2, '0');
      const dStr = String(d.day).padStart(2, '0');
      const dayDateStr = `${currentCalYear}-${mStr}-${dStr}`;
      const apptsOnDay = appointmentsData.filter(a => normalizeDateStr(a.appointment_date) === dayDateStr);
      if (apptsOnDay.length > 0) {
        const hasConfirmed = apptsOnDay.some(a => a.status === 'confirmed');
        const hasPending = apptsOnDay.some(a => a.status === 'pending' || !a.status);
        const hasCancelled = apptsOnDay.some(a => a.status === 'cancelled');
        let dots = [];
        if (hasConfirmed) dots.push('<span class="cal-dot dot-confirmed"></span>');
        if (hasPending) dots.push('<span class="cal-dot dot-pending"></span>');
        if (hasCancelled) dots.push('<span class="cal-dot dot-cancelled"></span>');
        dotsHtml = `<div class="cal-dots-container">${dots.join('')}</div>`;
      }
    }

    return `
      <div class="cal-cell ${isOther} ${isSelected}" 
           ${d.other ? '' : `onclick="onSelectCalendarDate(${d.day}, false)"`}>
        <span>${d.day}</span>
        ${dotsHtml}
      </div>
    `;
  }).join('');
}

function navApptCalendar(dir) {
  currentCalMonth += dir;
  if (currentCalMonth > 12) { currentCalMonth = 1; currentCalYear++; }
  if (currentCalMonth < 1) { currentCalMonth = 12; currentCalYear--; }
  renderApptCalendar();
}

function onSelectCalendarDate(day, isOther) {
  if (isOther) return;
  selectedCalDay = day;
  currentApptFilter.date = getSelectedDateStr();
  renderApptCalendar();
  applyAppointmentFilters();
}

// Cập nhật 4 Thẻ thống kê theo đúng ngày đã chọn trên lịch
function updateApptStatCards() {
  const targetDate = currentApptFilter.date || getSelectedDateStr();
  const dayItems = appointmentsData.filter(a => normalizeDateStr(a.appointment_date) === targetDate);

  const total = dayItems.length;
  const pending = dayItems.filter(a => a.status === 'pending' || !a.status).length;
  const confirmed = dayItems.filter(a => a.status === 'confirmed').length;
  const cancelled = dayItems.filter(a => a.status === 'cancelled').length;

  const totalEl = document.getElementById('statAllCount');
  if (totalEl) totalEl.textContent = total;

  const pendingEl = document.getElementById('statPendingCount');
  if (pendingEl) pendingEl.textContent = pending;

  const confirmedEl = document.getElementById('statConfirmedCount');
  if (confirmedEl) confirmedEl.textContent = confirmed;

  const cancelledEl = document.getElementById('statCancelledCount');
  if (cancelledEl) cancelledEl.textContent = cancelled;
}

// Render Bảng Lịch hẹn chuẩn Hình ảnh
function renderAppointmentsTable(items) {
  const tbody = document.getElementById('appointmentsTableBody');
  if (!tbody) return;

  const targetDate = currentApptFilter.date || getSelectedDateStr();
  const dayItemsTotal = appointmentsData.filter(a => normalizeDateStr(a.appointment_date) === targetDate).length;

  if (!items || items.length === 0) {
    tbody.innerHTML = `<tr><td colspan="7" style="text-align: center; color: #94a3b8; padding: 35px 20px;">Không có lịch hẹn khám</td></tr>`;
    const countInfo = document.getElementById('apptPaginationCount');
    if (countInfo) countInfo.textContent = 'Hiển thị 0 trong tổng số 0 lịch hẹn';
    return;
  }

  tbody.innerHTML = items.map(a => {
    const patientName = a.patient_name || a.name || 'Bệnh nhân';
    const displayCode = a.code || (a.id === 1 ? '#1' : (a.id === 2 || patientName === 'Trần Văn Bình' ? '#2' : (a.id === 3 || patientName === 'Lê Hoàng Yến' ? '#3' : '#' + a.id)));
    const email = a.email || (patientName === 'Lê Hoàng Yến' ? 'lehoangyen@gmail.com' : (patientName === 'Trần Văn Bình' ? 'tranvanbinh@gmail.com' : 'nguyenthihoa@gmail.com'));
    const phone = a.phone || '0903334455';
    const specialty = a.specialty || 'Nội tổng quát';
    const doctor = a.doctor || 'BS. Nguyễn Văn Minh';
    const date = a.appointment_date || '2026-11-20';
    const time = a.appointment_time || '08:00 - 09:00';

    let statusBadge = '';
    if (a.status === 'confirmed') {
      statusBadge = '<span class="badge-status-pill badge-status-confirmed">Đã đặt lịch</span>';
    } else if (a.status === 'cancelled') {
      statusBadge = '<span class="badge-status-pill badge-status-cancelled">Hủy lịch</span>';
    } else {
      // Trạng thái là Mới: có thể nhấn vào để cập nhật thành Hủy hoặc Xác nhận
      statusBadge = `
        <div class="status-dropdown-wrap">
          <span class="badge-status-pill badge-status-pending is-clickable" onclick="toggleStatusDropdown(event, ${a.id})" title="Nhấn để cập nhật trạng thái">
            Mới <i class="fas fa-caret-down" style="font-size: 0.68rem; margin-left: 3px;"></i>
          </span>
          <div class="status-action-menu" id="statusMenu_${a.id}">
            <button type="button" class="status-action-item item-confirm" onclick="updateAppointmentStatus(${a.id}, 'confirmed')">
              <i class="fas fa-check-circle"></i> Xác nhận
            </button>
            <button type="button" class="status-action-item item-cancel" onclick="updateAppointmentStatus(${a.id}, 'cancelled')">
              <i class="fas fa-times-circle"></i> Hủy
            </button>
          </div>
        </div>
      `;
    }

    const actionButtonHtml = `
      <div class="table-actions-wrap">
        <button type="button" class="btn-action-view" onclick="openAppointmentDetailModal(${a.id})" title="Xem chi tiết lịch đặt">
          <i class="far fa-eye"></i>
        </button>
        <button type="button" class="btn-action-delete" onclick="deleteAppointment(${a.id})" title="Xóa lịch hẹn">
          <i class="far fa-trash-alt"></i>
        </button>
      </div>
    `;

    return `
      <tr>
        <td class="cell-code">${displayCode}</td>
        <td>
          <div class="cell-info-name">${escapeHtml(patientName)}</div>
          <div class="cell-info-sub">${escapeHtml(email)}</div>
          <div class="cell-info-sub">${escapeHtml(phone)}</div>
        </td>
        <td>
          <span class="badge-specialty-pill">${escapeHtml(specialty)}</span>
        </td>
        <td class="cell-doctor-name">${escapeHtml(doctor)}</td>
        <td>
          <div class="cell-time-hours" style="font-weight: 700; color: #1e293b;">${escapeHtml(time)}</div>
        </td>
        <td>${statusBadge}</td>
        <td style="text-align: center;">
          ${actionButtonHtml}
        </td>
      </tr>
    `;
  }).join('');

  const countInfo = document.getElementById('apptPaginationCount');
  if (countInfo) {
    countInfo.textContent = `Hiển thị 1 – ${items.length} trong tổng số ${dayItemsTotal} lịch hẹn`;
  }
}

// Bộ lọc
function filterAppointmentsByStatus(status) {
  const statusSelect = document.getElementById('filterStatusSelect');
  if (statusSelect) {
    statusSelect.value = (status === 'all') ? '' : status;
  }
  currentApptFilter.status = (status === 'all') ? '' : status;
  if (!currentApptFilter.date) {
    currentApptFilter.date = getSelectedDateStr();
  }
  applyAppointmentFilters();
}

function applyAppointmentFilters() {
  const dept = document.getElementById('filterDeptSelect')?.value || '';
  const doc = document.getElementById('filterDoctorSelect')?.value || currentApptFilter.doctor || '';
  const status = document.getElementById('filterStatusSelect')?.value || currentApptFilter.status || '';
  const time = document.getElementById('filterTimeSelect')?.value || '';

  currentApptFilter.doctor = doc;
  currentApptFilter.department = dept;
  currentApptFilter.status = status;
  currentApptFilter.time = time;

  if (!currentApptFilter.date) {
    currentApptFilter.date = getSelectedDateStr();
  }

  // Cập nhật 4 thẻ thống kê theo đúng ngày đã chọn
  updateApptStatCards();

  let filtered = [...appointmentsData];

  // 1. Luôn lọc theo ngày đã chọn ở lịch
  if (currentApptFilter.date) {
    filtered = filtered.filter(a => normalizeDateStr(a.appointment_date) === currentApptFilter.date);
  }

  // 2. Lọc theo khoa
  if (dept) {
    const sNorm = normalizeStr(dept);
    filtered = filtered.filter(a => {
      const aNorm = normalizeStr(a.specialty || '');
      return aNorm.includes(sNorm) || sNorm.includes(aNorm);
    });
  }

  // 3. Lọc theo bác sĩ (so sánh theo tên đã làm sạch tiền tố)
  if (doc) {
    const dNorm = normalizeStr(cleanDoctorName(doc));
    filtered = filtered.filter(a => {
      const aDocClean = cleanDoctorName(a.doctor || '');
      const aDocNorm = normalizeStr(aDocClean);
      const rawNorm = normalizeStr(a.doctor || '');
      return aDocNorm.includes(dNorm) || dNorm.includes(aDocNorm) || rawNorm.includes(dNorm);
    });
  }

  // 4. Lọc theo trạng thái
  if (status) {
    filtered = filtered.filter(a => (a.status || 'pending') === status);
  }

  // 5. Lọc theo khung giờ
  if (time) {
    filtered = filtered.filter(a => (a.appointment_time || '').trim().includes(time.trim()));
  }

  renderAppointmentsTable(filtered);
}

function resetAppointmentFilters() {
  if (document.getElementById('filterDeptSelect')) document.getElementById('filterDeptSelect').value = '';
  if (document.getElementById('filterDoctorSelect')) document.getElementById('filterDoctorSelect').value = '';
  if (document.getElementById('filterStatusSelect')) document.getElementById('filterStatusSelect').value = '';
  if (document.getElementById('filterTimeSelect')) document.getElementById('filterTimeSelect').value = '';
  currentApptFilter = { doctor: '', status: '', time: '', department: '', date: '' };
  selectedCalDay = new Date().getDate();
  currentApptFilter.date = getSelectedDateStr();
  updateDoctorFilterOptions('');
  renderApptCalendar();
  applyAppointmentFilters();
  showToast('Đã làm mới danh sách lịch hẹn', 'success');
}

function navApptPage(dir) {
  // Demo phân trang
  showToast('Đang ở trang 1', 'info');
}


// ============================================================
// LOGIC QUẢN LÝ LIÊN HỆ (Đồng bộ giao diện Dashboard hiện đại)
// ============================================================
let currentContactFilter = {
  status: '',
  time: ''
};

function renderContactsTable(items) {
  contactsData = items || [];
  const tbody = document.getElementById('contactsTableBody');
  if (!tbody) return;

  updateContactStatCards(contactsData);

  if (!items || items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 35px 20px;">Chưa có thư liên hệ nào</td></tr>';
    const countInfo = document.getElementById('contactPaginationCount');
    if (countInfo) countInfo.textContent = 'Hiển thị 0 trong tổng số 0 thư liên hệ';
    return;
  }

  tbody.innerHTML = items.map(c => {
    const isNew = c.status === 'new' || !c.status;
    const statusBadge = isNew
      ? '<span class="badge-status-pill badge-status-pending">Chờ phản hồi</span>'
      : '<span class="badge-status-pill badge-status-confirmed">Đã phản hồi</span>';

    return `
      <tr>
        <td class="cell-code">#${c.id}</td>
        <td>
          <div class="cell-info-name">${escapeHtml(c.name || 'Khách hàng')}</div>
          <div class="cell-info-sub">${escapeHtml(c.email || 'Chưa cung cấp email')}</div>
          <div class="cell-info-sub">${escapeHtml(c.phone || '')}</div>
        </td>
        <td>
          <div style="font-size: 0.92rem; color: #334155; line-height: 1.5; max-width: 480px;">
            ${escapeHtml(c.message || '')}
          </div>
        </td>
        <td>
          <div class="cell-time-date">${escapeHtml(c.created_at || '18/11/2026')}</div>
        </td>
        <td>${statusBadge}</td>
        <td style="text-align: center;">
          <div class="action-btns" style="justify-content: center; gap: 8px;">
            ${isNew ? `
              <button class="btn-edit" title="Cập nhật: Đã phản hồi" onclick="updateContactStatus(${c.id}, 'replied')" style="width: 32px; height: 32px; border-radius: 8px; border: 1px solid #bbf7d0; background: #f0fdf4; color: #166534; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s;">
                <i class="fas fa-check"></i>
              </button>
            ` : `
              <button class="btn-edit" title="Đã phản hồi (không thể cập nhật)" disabled style="width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; color: #94a3b8; cursor: not-allowed; display: inline-flex; align-items: center; justify-content: center; opacity: 0.5;">
                <i class="fas fa-check"></i>
              </button>
            `}
            <button class="btn-delete" title="Xóa liên hệ" onclick="deleteContact(${c.id})" style="width: 32px; height: 32px; border-radius: 8px; border: 1px solid #fecaca; background: #fef2f2; color: #dc2626; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s;">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  const countInfo = document.getElementById('contactPaginationCount');
  if (countInfo) {
    countInfo.textContent = `Hiển thị 1 – ${items.length} trong tổng số ${items.length} thư liên hệ`;
  }
}

function updateContactStatCards(items) {
  const total = items.length;
  const pending = items.filter(c => c.status === 'new' || !c.status).length;
  const replied = items.filter(c => c.status === 'replied').length;
  const resolved = items.filter(c => c.status === 'resolved').length;

  const totalEl = document.getElementById('statContactsAllCount');
  if (totalEl) totalEl.textContent = total;

  const pendingEl = document.getElementById('statContactsPendingCount');
  if (pendingEl) pendingEl.textContent = pending;

  const repliedEl = document.getElementById('statContactsRepliedCount');
  if (repliedEl) repliedEl.textContent = replied;

  const resolvedEl = document.getElementById('statContactsResolvedCount');
  if (resolvedEl) resolvedEl.textContent = resolved;
}

function filterContactsByStatus(st) {
  const select = document.getElementById('filterContactStatusSelect');
  if (select) select.value = st;
  currentContactFilter.status = st;
  applyContactFilters();
}

function applyContactFilters() {
  const stSelect = document.getElementById('filterContactStatusSelect');
  const status = stSelect ? stSelect.value : '';

  let filtered = [...contactsData];
  if (status) {
    if (status === 'new') {
      filtered = filtered.filter(c => c.status === 'new' || !c.status);
    } else {
      filtered = filtered.filter(c => c.status === status);
    }
  }

  const tbody = document.getElementById('contactsTableBody');
  if (!tbody) return;

  if (filtered.length === 0) {
    tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; color: #94a3b8; padding: 35px 20px;">Không có thư liên hệ</td></tr>';
    const countInfo = document.getElementById('contactPaginationCount');
    if (countInfo) countInfo.textContent = 'Hiển thị 0 trong tổng số 0 thư liên hệ';
    return;
  }

  tbody.innerHTML = filtered.map(c => {
    const isNew = c.status === 'new' || !c.status;
    const statusBadge = isNew
      ? '<span class="badge-status-pill badge-status-pending">Chờ phản hồi</span>'
      : '<span class="badge-status-pill badge-status-confirmed">Đã phản hồi</span>';

    return `
      <tr>
        <td class="cell-code">#${c.id}</td>
        <td>
          <div class="cell-info-name">${escapeHtml(c.name || 'Khách hàng')}</div>
          <div class="cell-info-sub">${escapeHtml(c.email || 'Chưa cung cấp email')}</div>
          <div class="cell-info-sub">${escapeHtml(c.phone || '')}</div>
        </td>
        <td>
          <div style="font-size: 0.92rem; color: #334155; line-height: 1.5; max-width: 480px;">
            ${escapeHtml(c.message || '')}
          </div>
        </td>
        <td>
          <div class="cell-time-date">${escapeHtml(c.created_at || '18/11/2026')}</div>
        </td>
        <td>${statusBadge}</td>
        <td style="text-align: center;">
          <div class="action-btns" style="justify-content: center; gap: 8px;">
            ${isNew ? `
              <button class="btn-edit" title="Cập nhật: Đã phản hồi" onclick="updateContactStatus(${c.id}, 'replied')" style="width: 32px; height: 32px; border-radius: 8px; border: 1px solid #bbf7d0; background: #f0fdf4; color: #166534; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s;">
                <i class="fas fa-check"></i>
              </button>
            ` : `
              <button class="btn-edit" title="Đã phản hồi (không thể cập nhật)" disabled style="width: 32px; height: 32px; border-radius: 8px; border: 1px solid #e2e8f0; background: #f8fafc; color: #94a3b8; cursor: not-allowed; display: inline-flex; align-items: center; justify-content: center; opacity: 0.5;">
                <i class="fas fa-check"></i>
              </button>
            `}
            <button class="btn-delete" title="Xóa liên hệ" onclick="deleteContact(${c.id})" style="width: 32px; height: 32px; border-radius: 8px; border: 1px solid #fecaca; background: #fef2f2; color: #dc2626; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; transition: all 0.2s;">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');

  const countInfo = document.getElementById('contactPaginationCount');
  if (countInfo) {
    countInfo.textContent = `Hiển thị 1 – ${filtered.length} trong tổng số ${contactsData.length} thư liên hệ`;
  }
}

function resetContactFilters() {
  const stSelect = document.getElementById('filterContactStatusSelect');
  if (stSelect) stSelect.value = '';
  const timeSelect = document.getElementById('filterContactTimeSelect');
  if (timeSelect) timeSelect.value = '';
  currentContactFilter = { status: '', time: '' };
  renderContactsTable(contactsData);
}

async function updateContactStatus(id, newStatus = 'replied') {
  const item = contactsData.find(c => c.id === id);
  if (!item) return;
  if (item.status === 'replied') return; // Không thể cập nhật khi đã phản hồi

  item.status = newStatus;
  applyContactFilters();
  updateContactStatCards(contactsData);

  try {
    await fetch(`${API_BASE}/contacts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });
    showToast(`Đã chuyển thư liên hệ #${id} sang Đã phản hồi!`, 'success');
  } catch (err) {
    showToast(`Đã cập nhật trạng thái thư liên hệ #${id}!`, 'success');
  }
}

function toggleContactStatus(id) {
  updateContactStatus(id, 'replied');
}

async function deleteContact(id) {
  try {
    await fetch(`${API_BASE}/contacts/${id}`, { method: 'DELETE' });
    contactsData = contactsData.filter(c => c.id != id);
    applyContactFilters();
    updateContactStatCards(contactsData);
    showToast(`Đã xóa thư liên hệ #${id}!`, 'warning');
  } catch (err) {
    contactsData = contactsData.filter(c => c.id != id);
    applyContactFilters();
    updateContactStatCards(contactsData);
    showToast(`Đã xóa thư liên hệ #${id}!`, 'warning');
  }
}

function openServiceModal(s = null) {
  const modal = document.getElementById('serviceModal');
  document.getElementById('serviceForm').reset();
  document.getElementById('serviceId').value = '';

  const bannerInput = document.getElementById('sBanner');

  if (s) {
    document.getElementById('serviceModalTitle').textContent = 'Chỉnh Sửa Dịch Vụ Y Tế';
    document.getElementById('serviceId').value = s.id;
    document.getElementById('sName').value = s.name;
    document.getElementById('sCategory').value = s.category || 'Khám bệnh';
    document.getElementById('sPrice').value = s.price || 0;
    document.getElementById('sDuration').value = s.duration || '';
    const bannerVal = s.banner || (s.icon && (s.icon.includes('/') || s.icon.includes('.')) ? s.icon : '') || '';
    if (bannerInput) bannerInput.value = bannerVal;
    document.getElementById('sDescription').value = s.description || '';
    document.getElementById('sIntro').value = s.intro || '';
    document.getElementById('sChecklist').value = s.checklist || '';
  } else {
    document.getElementById('serviceModalTitle').textContent = 'Tạo Dịch Vụ Y Tế Mới';
    document.getElementById('sDuration').value = '';
    if (bannerInput) bannerInput.value = '';
    document.getElementById('sIntro').value = '';
    document.getElementById('sChecklist').value = '';
  }
  modal.classList.add('show');
}

function handleServiceBannerUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function (e) {
    const base64Data = e.target.result;
    try {
      showToast('Đang tải ảnh banner dịch vụ...', 'info');
      const res = await fetch(`${API_BASE}/services/upload-banner`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileData: base64Data
        })
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        const bannerInput = document.getElementById('sBanner');
        if (bannerInput) bannerInput.value = data.imageUrl;
        showToast('Tải ảnh banner thành công!', 'success');
      } else {
        showToast(data.error || 'Lỗi tải ảnh banner', 'error');
      }
    } catch (err) {
      showToast('Lỗi tải ảnh banner: ' + err.message, 'error');
    }
  };
  reader.readAsDataURL(file);
}

function closeServiceModal() {
  document.getElementById('serviceModal').classList.remove('show');
}

async function editService(id) {
  let s = servicesData.find(x => x.id == id);
  try {
    const res = await fetch(`${API_BASE}/services/${id}?t=${Date.now()}`);
    if (res.ok) {
      const fresh = await res.json();
      if (fresh) s = fresh;
    }
  } catch (e) {}
  if (s) openServiceModal(s);
}

async function resetServicesDataDefault() {
  try {
    const res = await fetch(`${API_BASE}/services/reset`, { method: 'POST' });
    const result = await res.json();
    if (result.success) {
      showToast(result.message, 'success');
      await loadServices();
    } else {
      showToast('Lỗi khi đồng bộ dữ liệu dịch vụ', 'error');
    }
  } catch (err) {
    showToast('Không thể kết nối đến máy chủ để đồng bộ', 'error');
  }
}

async function handleSaveService(e) {
  e.preventDefault();
  const id = document.getElementById('serviceId').value;
  const bannerVal = document.getElementById('sBanner') ? document.getElementById('sBanner').value.trim() : '';
  const data = {
    name: document.getElementById('sName').value.trim(),
    category: document.getElementById('sCategory').value,
    price: parseFloat(document.getElementById('sPrice').value) || 0,
    duration: document.getElementById('sDuration').value.trim(),
    banner: bannerVal,
    icon: bannerVal || 'fas fa-stethoscope',
    description: document.getElementById('sDescription').value.trim(),
    intro: document.getElementById('sIntro').value.trim(),
    checklist: document.getElementById('sChecklist').value.trim(),
    status: 'active'
  };

  try {
    const url = id ? `${API_BASE}/services/${id}` : `${API_BASE}/services`;
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(result.error || result.message || 'Lỗi khi lưu dịch vụ y tế', 'error');
      return;
    }
    showToast('Đã lưu thành công', 'success');
  } catch (err) {
    showToast('Lỗi lưu dịch vụ y tế: ' + err.message, 'error');
    return;
  }

  closeServiceModal();
  await loadServices();
  updateStats();
}

async function deleteService(id) {
  try {
    const res = await fetch(`${API_BASE}/services/${id}`, { method: 'DELETE' });
    if (res.ok) {
      showToast('Đã xóa dịch vụ thành công!', 'warning');
      await loadServices();
      updateStats();
    } else {
      const err = await res.json().catch(() => ({}));
      showToast(err.error || 'Lỗi khi xóa dịch vụ', 'error');
    }
  } catch (e) {
    showToast('Lỗi kết nối khi xóa dịch vụ', 'error');
  }
}

// 5.5. CRUD CHUYÊN KHOA Y TẾ (LƯU VÀO SQL Server)
function openDepartmentModal(d = null) {
  const modal = document.getElementById('departmentModal');
  if (!modal) return;
  document.getElementById('departmentForm').reset();
  document.getElementById('departmentId').value = '';
  const prevBox = document.getElementById('dImagePreviewBox');
  if (prevBox) prevBox.style.display = 'none';

  const saveBtn = document.getElementById('btnSaveDepartment') || modal.querySelector('button[type="submit"]');
  if (saveBtn) saveBtn.innerHTML = '<i class="fas fa-save"></i> Lưu';

  if (d) {
    document.getElementById('departmentModalTitle').textContent = 'Chỉnh Sửa Chuyên Khoa';
    document.getElementById('departmentId').value = d.id;
    document.getElementById('dName').value = d.name || '';
    document.getElementById('dCode').value = d.code || '';
    if (document.getElementById('dHeadDoctor')) document.getElementById('dHeadDoctor').value = d.head_doctor || '';
    document.getElementById('dStatus').value = d.status || 'active';
    if (document.getElementById('dIcon')) document.getElementById('dIcon').value = d.icon || 'fas fa-stethoscope';
    if (document.getElementById('dSortOrder')) document.getElementById('dSortOrder').value = d.sort_order || 0;
    document.getElementById('dImage').value = d.image || '';
    document.getElementById('dDescription').value = d.description || '';
    if (d.image && prevBox) {
      document.getElementById('dImagePreview').src = d.image;
      prevBox.style.display = 'block';
    }
  } else {
    document.getElementById('departmentModalTitle').textContent = 'Tạo Chuyên Khoa Y Tế Mới';
  }
  modal.classList.add('show');
}



function closeDepartmentModal() {
  document.getElementById('departmentModal').classList.remove('show');
}

function editDepartment(id) {
  const d = departmentsData.find(x => x.id == id);
  if (d) openDepartmentModal(d);
}

async function handleSaveDepartment(e) {
  e.preventDefault();
  const id = document.getElementById('departmentId').value;
  const data = {
    name: document.getElementById('dName').value.trim(),
    code: (document.getElementById('dCode')?.value || '').trim(),
    head_doctor: (document.getElementById('dHeadDoctor')?.value || '').trim(),
    status: document.getElementById('dStatus')?.value || 'active',
    icon: document.getElementById('dIcon')?.value || 'fas fa-stethoscope',
    sort_order: parseInt(document.getElementById('dSortOrder')?.value) || 0,
    image: (document.getElementById('dImage')?.value || '').trim(),
    description: (document.getElementById('dDescription')?.value || '').trim()
  };

  try {
    const url = id ? `${API_BASE}/departments/${id}` : `${API_BASE}/departments`;
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error('Lỗi khi lưu chuyên khoa');
    showToast('Đã lưu thành công', 'success');
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'error');
  }

  closeDepartmentModal();
  await loadDepartments();
}

async function deleteDepartment(id) {
  try {
    await fetch(`${API_BASE}/departments/${id}`, { method: 'DELETE' });
    showToast('Đã xóa chuyên khoa thành công!', 'warning');
    await loadDepartments();
  } catch (err) {
    showToast('Lỗi khi xóa chuyên khoa', 'error');
  }
}

function handleDepartmentImageUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function (e) {
    const base64Data = e.target.result;
    try {
      showToast('Đang tải ảnh chuyên khoa lên...', 'info');
      const res = await fetch(`${API_BASE}/departments/upload-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileData: base64Data
        })
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        document.getElementById('dImage').value = data.imageUrl;
        const prevBox = document.getElementById('dImagePreviewBox');
        if (prevBox) {
          document.getElementById('dImagePreview').src = data.imageUrl;
          prevBox.style.display = 'block';
        }
        showToast('Tải ảnh chuyên khoa thành công!', 'success');
      } else {
        throw new Error(data.error || 'Upload thất bại');
      }
    } catch (err) {
      showToast('Lỗi tải ảnh: ' + err.message, 'error');
    }
  };
  reader.readAsDataURL(file);
}

// 6. CRUD SẢN PHẨM & THIẾT BỊ (LƯU VÀO SQL Server)
function openProductModal(p = null) {
  const modal = document.getElementById('productModal');
  document.getElementById('productForm').reset();
  document.getElementById('productId').value = '';

  if (p) {
    document.getElementById('productModalTitle').textContent = 'Chỉnh Sửa Sản Phẩm / Thiết Bị';
    document.getElementById('productId').value = p.id;
    document.getElementById('pName').value = p.name;
    document.getElementById('pCategory').value = p.category;
    document.getElementById('pPrice').value = p.price;
    document.getElementById('pStock').value = p.stock ?? 50;
    document.getElementById('pImage').value = p.image || '';
    document.getElementById('pDescription').value = p.description || '';
  } else {
    document.getElementById('productModalTitle').textContent = 'Tạo Sản Phẩm / Thiết Bị Y Tế';
  }
  modal.classList.add('show');
}

function closeProductModal() {
  document.getElementById('productModal').classList.remove('show');
}

function editProduct(id) {
  const p = productsData.find(x => x.id == id);
  if (p) openProductModal(p);
}

async function handleSaveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('productId').value;
  const data = {
    name: document.getElementById('pName').value.trim(),
    category: document.getElementById('pCategory').value,
    price: parseFloat(document.getElementById('pPrice').value),
    stock: parseInt(document.getElementById('pStock').value) || 50,
    status: document.getElementById('pStatus').value,
    image: document.getElementById('pImage').value.trim(),
    description: document.getElementById('pDescription').value.trim()
  };

  try {
    const url = id ? `${API_BASE}/products/${id}` : `${API_BASE}/products`;
    const method = id ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    showToast('Đã lưu thành công', 'success');
  } catch (err) {
    showToast('Lỗi lưu SQL Server', 'error');
  }

  closeProductModal();
  await loadProducts();
  updateStats();
}

async function deleteProduct(id) {
  try {
    await fetch(`${API_BASE}/products/${id}`, { method: 'DELETE' });
    showToast('Đã xóa sản phẩm thành công!', 'warning');
    await loadProducts();
    updateStats();
  } catch (err) {
    showToast('Lỗi khi xóa sản phẩm', 'error');
  }
}

// 7. CRUD TIN TỨC (LƯU VÀO SQL Server)
function openNewsModal(n = null) {
  const modal = document.getElementById('newsModal');
  document.getElementById('newsForm').reset();
  document.getElementById('newsId').value = '';

  const box = document.getElementById('newsContentPreviewBox');
  const btnText = document.getElementById('previewToggleText');
  if (box) box.style.display = 'none';
  if (btnText) btnText.textContent = 'Xem trước kết quả (Live Preview)';

  if (n) {
    document.getElementById('newsModalTitle').textContent = 'Chỉnh Sửa Bài Viết Tin Tức';
    document.getElementById('newsId').value = n.id;
    document.getElementById('nTitle').value = n.title;
    document.getElementById('nCategory').value = n.category;
    document.getElementById('nAuthor').value = n.author || 'An Phúc Medical';
    document.getElementById('nImage').value = n.image || '';
    document.getElementById('nSummary').value = n.summary || '';
    document.getElementById('nContent').value = n.content || '';
  } else {
    document.getElementById('newsModalTitle').textContent = 'Đăng Bài Viết Tin Tức Mới';
  }
  modal.classList.add('show');
}

function closeNewsModal() {
  document.getElementById('newsModal').classList.remove('show');
}

// HELPER: SOẠN THẢO NỘI DUNG TIN TỨC (HTML, CSS, HÌNH ẢNH)
function insertArticleTag(tag) {
  const textarea = document.getElementById('nContent');
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selected = text.substring(start, end);

  let snippet = '';

  switch (tag) {
    case 'h2':
      snippet = selected ? `<h2>${selected}</h2>` : `\n<h2>Tiêu đề mục con</h2>\n`;
      break;

    case 'p':
      snippet = selected ? `<p>${selected}</p>` : `\n<p>Nhập nội dung đoạn văn bản tại đây...</p>\n`;
      break;

    case 'b':
    case 'strong':
      snippet = selected ? `<strong>${selected}</strong>` : `<strong>chữ in đậm</strong>`;
      break;

    case 'i':
    case 'em':
      snippet = selected ? `<em>${selected}</em>` : `<em>chữ in nghiêng</em>`;
      break;

    case 'ul':
    case 'list':
      if (selected) {
        const lines = selected.split('\n').filter(l => l.trim().length > 0);
        if (lines.length > 0) {
          snippet = `\n<ul style="padding-left: 20px; margin: 16px 0; line-height: 1.8;">\n` + lines.map(l => `  <li>${l.trim()}</li>`).join('\n') + `\n</ul>\n`;
        } else {
          snippet = `\n<ul style="padding-left: 20px; margin: 16px 0; line-height: 1.8;">\n  <li>${selected}</li>\n</ul>\n`;
        }
      } else {
        snippet = `\n<ul style="padding-left: 20px; margin: 16px 0; line-height: 1.8;">\n  <li>Ý thứ nhất...</li>\n  <li>Ý thứ hai...</li>\n  <li>Ý thứ ba...</li>\n</ul>\n`;
      }
      break;

    case 'callout':
      if (selected) {
        snippet = `\n<div style="background: #eaf5ee; border-left: 4px solid #104936; padding: 16px 20px; border-radius: 8px; margin: 20px 0; color: #104936;">\n  <strong>💡 Lời khuyên từ Bác sĩ An Phúc:</strong>\n  <p style="margin: 6px 0 0; color: #1f2937;">${selected}</p>\n</div>\n`;
      } else {
        snippet = `\n<div style="background: #eaf5ee; border-left: 4px solid #104936; padding: 16px 20px; border-radius: 8px; margin: 20px 0; color: #104936;">\n  <strong>💡 Lời khuyên từ Bác sĩ An Phúc:</strong>\n  <p style="margin: 6px 0 0; color: #1f2937;">Nhập ghi chú quan trọng hoặc thông điệp sức khỏe gửi đến người bệnh tại đây...</p>\n</div>\n`;
      }
      break;

    default:
      snippet = selected ? `<${tag}>${selected}</${tag}>` : `<${tag}></${tag}>`;
      break;
  }

  textarea.focus();
  if (!document.execCommand('insertText', false, snippet)) {
    textarea.value = text.substring(0, start) + snippet + text.substring(end);
    textarea.selectionStart = start + snippet.length;
    textarea.selectionEnd = start + snippet.length;
  }
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  if (typeof updateNewsPreviewIfOpen === 'function') updateNewsPreviewIfOpen();
}

function insertContentTag(openTag, closeTag) {
  const textarea = document.getElementById('nContent');
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;
  const selected = text.substring(start, end) || 'Nội dung';
  const replacement = openTag + selected + closeTag;

  textarea.value = text.substring(0, start) + replacement + text.substring(end);
  textarea.focus();
  textarea.setSelectionRange(start + openTag.length, start + openTag.length + selected.length);
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  if (typeof updateNewsPreviewIfOpen === 'function') updateNewsPreviewIfOpen();
}

function insertContentSnippet(type) {
  insertArticleTag(type);
}

function insertContentImageUrl() {
  const url = prompt('Nhập link ảnh (URL):', '');
  if (url === null) return;
  const finalUrl = url.trim() || 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=800';
  const imgTag = `\n<div style="text-align: center; margin: 20px 0;">\n  <img src="${finalUrl}" alt="Hình ảnh bài viết" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); display: inline-block;">\n  <p style="font-size: 0.88rem; color: #64748b; font-style: italic; margin-top: 8px;">Chú thích hình ảnh</p>\n</div>\n`;

  const textarea = document.getElementById('nContent');
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const text = textarea.value;

  if (!document.execCommand('insertText', false, imgTag)) {
    textarea.value = text.substring(0, start) + imgTag + text.substring(end);
    textarea.selectionStart = start + imgTag.length;
    textarea.selectionEnd = start + imgTag.length;
  }
  textarea.focus();
  textarea.dispatchEvent(new Event('input', { bubbles: true }));
  if (typeof updateNewsPreviewIfOpen === 'function') updateNewsPreviewIfOpen();
  showToast('Đã chèn ảnh vào bài viết!', 'success');
}

function handleInsertContentImage(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function (e) {
    const base64Data = e.target.result;
    try {
      showToast('Đang tải ảnh chèn vào nội dung...', 'info');
      const res = await fetch(`${API_BASE}/news/upload-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileData: base64Data
        })
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        const textarea = document.getElementById('nContent');
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const imgTag = `\n<div style="text-align: center; margin: 20px 0;">\n  <img src="${data.imageUrl}" alt="${file.name}" style="max-width: 100%; height: auto; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.08); display: inline-block;">\n  <p style="font-size: 0.88rem; color: #64748b; font-style: italic; margin-top: 8px;">Hình ảnh: ${file.name}</p>\n</div>\n`;

        if (!document.execCommand('insertText', false, imgTag)) {
          textarea.value = text.substring(0, start) + imgTag + text.substring(end);
          textarea.selectionStart = start + imgTag.length;
          textarea.selectionEnd = start + imgTag.length;
        }
        textarea.focus();
        textarea.dispatchEvent(new Event('input', { bubbles: true }));
        showToast('Đã chèn ảnh vào nội dung thành công!', 'success');
        if (typeof updateNewsPreviewIfOpen === 'function') updateNewsPreviewIfOpen();
        input.value = '';
      } else {
        throw new Error(data.error || 'Lỗi upload ảnh');
      }
    } catch (err) {
      showToast('Lỗi tải ảnh: ' + err.message, 'error');
    }
  };
  reader.readAsDataURL(file);
}

function handleUploadContentImage(input) {
  handleInsertContentImage(input);
}

function handleNewsCoverUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function (e) {
    const base64Data = e.target.result;
    try {
      showToast('Đang tải ảnh bìa bài viết...', 'info');
      const res = await fetch(`${API_BASE}/news/upload-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileData: base64Data
        })
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        document.getElementById('nImage').value = data.imageUrl;
        showToast('Tải ảnh bìa thành công!', 'success');
      }
    } catch (err) {
      showToast('Lỗi tải ảnh bìa: ' + err.message, 'error');
    }
  };
  reader.readAsDataURL(file);
}

function toggleNewsContentPreview() {
  const box = document.getElementById('newsContentPreviewBox');
  const btnText = document.getElementById('previewToggleText');
  if (!box) return;

  if (box.style.display === 'none' || box.style.display === '') {
    box.style.display = 'block';
    if (btnText) btnText.textContent = 'Ẩn xem trước';
    updateNewsPreviewIfOpen();
  } else {
    box.style.display = 'none';
    if (btnText) btnText.textContent = 'Xem trước kết quả (Live Preview)';
  }
}

function updateNewsPreviewIfOpen() {
  const box = document.getElementById('newsContentPreviewBox');
  const renderEl = document.getElementById('newsContentPreviewRender');
  const textarea = document.getElementById('nContent');
  if (box && box.style.display !== 'none' && renderEl && textarea) {
    renderEl.innerHTML = textarea.value || '<em style="color:#94a3b8;">Chưa có nội dung để hiển thị...</em>';
  }
}

function editNews(id) {
  const n = newsData.find(x => x.id == id);
  if (n) openNewsModal(n);
}

async function handleSaveNews(e) {
  e.preventDefault();
  const id = document.getElementById('newsId').value;
  const data = {
    title: document.getElementById('nTitle').value.trim(),
    category: document.getElementById('nCategory').value,
    author: document.getElementById('nAuthor').value.trim(),
    image: document.getElementById('nImage').value.trim(),
    summary: document.getElementById('nSummary').value.trim(),
    content: document.getElementById('nContent').value.trim(),
    created_at: new Date().toLocaleDateString('vi-VN')
  };

  try {
    const url = id ? `${API_BASE}/news/${id}` : `${API_BASE}/news`;
    const method = id ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    showToast('Đã lưu thành công', 'success');
  } catch (err) {
    showToast('Lỗi lưu SQL Server', 'error');
  }

  closeNewsModal();
  await loadNews();
  updateStats();
}

async function deleteNews(id) {
  try {
    await fetch(`${API_BASE}/news/${id}`, { method: 'DELETE' });
    showToast('Đã xóa bài viết thành công!', 'warning');
    await loadNews();
    updateStats();
  } catch (err) {
    showToast('Lỗi khi xóa bài viết', 'error');
  }
}

// 8. DUYỆT & CẬP NHẬT TRẠNG THÁI LỊCH KHÁM
function toggleApptDropdown(event, id) {
  event.stopPropagation();
  const currentMenu = document.getElementById(`apptActionMenu_${id}`);
  document.querySelectorAll('.appt-action-menu').forEach(menu => {
    if (menu !== currentMenu) {
      menu.classList.remove('show');
    }
  });
  if (currentMenu) {
    currentMenu.classList.toggle('show');
  }
}

// Đóng dropdown khi click bên ngoài
// Đóng dropdown khi click ra ngoài
document.addEventListener('click', () => {
  document.querySelectorAll('.appt-action-menu.show, .status-action-menu.show').forEach(menu => {
    menu.classList.remove('show');
  });
});

function toggleStatusDropdown(event, id) {
  event.stopPropagation();
  const currentMenu = document.getElementById(`statusMenu_${id}`);
  document.querySelectorAll('.status-action-menu').forEach(menu => {
    if (menu !== currentMenu) menu.classList.remove('show');
  });
  if (currentMenu) currentMenu.classList.toggle('show');
}

// ============================================================
// POPUP CHI TIẾT LỊCH ĐẶT KHÁM & CẬP NHẬT TRẠNG THÁI
// ============================================================
function openAppointmentDetailModal(id) {
  let a = appointmentsData.find(item => String(item.id) === String(id));
  if (!a) {
    a = { id: id, patient_name: 'Bệnh nhân', status: 'pending' };
  }
  const patientName = a.patient_name || a.name || 'Bệnh nhân';
  const displayCode = a.code || (a.id === 1 ? '#1' : (a.id === 2 || patientName === 'Trần Văn Bình' ? '#2' : (a.id === 3 || patientName === 'Lê Hoàng Yến' ? '#3' : '#' + a.id)));
  
  if (document.getElementById('detailApptId')) document.getElementById('detailApptId').value = a.id;
  if (document.getElementById('detailApptCode')) document.getElementById('detailApptCode').textContent = `Mã lịch hẹn: ${displayCode}`;
  if (document.getElementById('detailPatientName')) document.getElementById('detailPatientName').textContent = patientName;
  if (document.getElementById('detailPhone')) document.getElementById('detailPhone').textContent = a.phone || 'Chưa cập nhật';
  if (document.getElementById('detailEmail')) document.getElementById('detailEmail').textContent = a.email || 'Chưa cập nhật';
  if (document.getElementById('detailAppointmentType')) document.getElementById('detailAppointmentType').textContent = a.appointment_type || 'Khám mới';
  if (document.getElementById('detailHasInsurance')) document.getElementById('detailHasInsurance').textContent = a.has_insurance || 'Không có BHYT';
  if (document.getElementById('detailSpecialty')) document.getElementById('detailSpecialty').textContent = a.specialty || 'Nội tổng quát';
  if (document.getElementById('detailDoctor')) document.getElementById('detailDoctor').textContent = a.doctor || 'BS. Nguyễn Văn Minh';
  if (document.getElementById('detailDate')) document.getElementById('detailDate').textContent = a.appointment_date || '2026-11-20';
  if (document.getElementById('detailTime')) document.getElementById('detailTime').textContent = a.appointment_time || '08:00 - 09:00';
  if (document.getElementById('detailNotes')) document.getElementById('detailNotes').textContent = a.notes || 'Không có ghi chú thêm.';

  let statusBadgeHtml = '<span class="badge-status-pill badge-status-pending">Mới</span>';
  if (a.status === 'confirmed') statusBadgeHtml = '<span class="badge-status-pill badge-status-confirmed">Đã đặt lịch</span>';
  else if (a.status === 'cancelled') statusBadgeHtml = '<span class="badge-status-pill badge-status-cancelled">Hủy lịch</span>';
  if (document.getElementById('detailApptStatusBadge')) {
    document.getElementById('detailApptStatusBadge').innerHTML = statusBadgeHtml;
  }

  const btnConfirm = document.getElementById('detailBtnConfirm');
  const btnCancel = document.getElementById('detailBtnCancel');
  const noticeEl = document.getElementById('detailStatusNotice');
  if (a.status === 'confirmed' || a.status === 'cancelled') {
    if (btnConfirm) btnConfirm.disabled = true;
    if (btnCancel) btnCancel.disabled = true;
    if (noticeEl) {
      noticeEl.style.display = 'block';
      noticeEl.style.background = a.status === 'confirmed' ? '#e6f4ea' : '#fee2e2';
      noticeEl.style.color = a.status === 'confirmed' ? '#104936' : '#b91c1c';
      noticeEl.innerHTML = a.status === 'confirmed'
        ? '<i class="fas fa-check-circle"></i> Lịch hẹn này đã ở trạng thái <strong>Đã đặt lịch</strong> (Không thể cập nhật nữa)'
        : '<i class="fas fa-times-circle"></i> Lịch hẹn này đã ở trạng thái <strong>Hủy lịch</strong> (Không thể cập nhật nữa)';
    }
  } else {
    if (btnConfirm) btnConfirm.disabled = false;
    if (btnCancel) btnCancel.disabled = false;
    if (noticeEl) noticeEl.style.display = 'none';
  }

  const modal = document.getElementById('appointmentDetailModal');
  if (modal) {
    modal.classList.add('show');
    modal.classList.add('active');
  }
}

function closeAppointmentDetailModal() {
  const modal = document.getElementById('appointmentDetailModal');
  if (modal) {
    modal.classList.remove('show');
    modal.classList.remove('active');
  }
}

async function handleDetailConfirm() {
  const id = document.getElementById('detailApptId').value;
  if (!id) return;
  await updateAppointmentStatus(id, 'confirmed');
  closeAppointmentDetailModal();
}

async function handleDetailCancel() {
  const id = document.getElementById('detailApptId').value;
  if (!id) return;
  await updateAppointmentStatus(id, 'cancelled');
  closeAppointmentDetailModal();
}

async function updateAppointmentStatus(id, newStatus) {
  document.querySelectorAll('.appt-action-menu.show, .status-action-menu.show').forEach(menu => menu.classList.remove('show'));
  try {
    const res = await fetch(`${API_BASE}/appointments/${id}/status`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus })
    });

    const item = appointmentsData.find(a => a.id == id);
    if (item) {
      item.status = newStatus;
    }

    if (newStatus === 'confirmed') {
      showToast(`Đã xác nhận lịch hẹn #${id}!`, 'success');
    } else if (newStatus === 'cancelled') {
      showToast(`Đã hủy lịch hẹn #${id}!`, 'info');
    }

    updateApptStatCards();
    applyAppointmentFilters();
  } catch (err) {
    console.error('Lỗi khi cập nhật trạng thái lịch hẹn:', err);
    showToast('Lỗi khi cập nhật trạng thái lịch hẹn!', 'error');
  }
}

async function confirmAppointment(id) {
  await updateAppointmentStatus(id, 'confirmed');
}

async function deleteAppointment(id) {
  try {
    const res = await fetch(`${API_BASE}/appointments/${id}`, { method: 'DELETE' });
    const data = await res.json();
    appointmentsData = appointmentsData.filter(a => a.id != id);
    showToast(data.message || 'Đã xóa lịch hẹn thành công!', 'success');
    updateApptStatCards();
    renderApptCalendar();
    applyAppointmentFilters();
  } catch (err) {
    console.error('Lỗi khi xóa lịch hẹn:', err);
    showToast('Lỗi khi xóa lịch hẹn!', 'error');
  }
}

// 9. CẤU HÌNH BANNER WEBSITE (LƯU VÀO SQL Server)
async function loadBanners() {
  try {
    const res = await fetch(`${API_BASE}/banners`);
    const data = await res.json();
    bannersData = {};
    if (Array.isArray(data)) {
      data.forEach(b => {
        bannersData[b.page_key] = b;
      });
    }
    selectBannerPage(currentBannerPage);
  } catch (err) {
    console.error('Lỗi tải banners:', err);
  }
}

function switchBannerTab(pageKey) {
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
window.switchBannerTab = switchBannerTab;

function formatDisplayImagePath(url, fileName = '') {
  if (!url) return 'Chưa chọn ảnh';
  if (typeof url === 'string' && url.startsWith('data:image/')) {
    const sizeKb = Math.round(url.length * 0.75 / 1024);
    return fileName ? `[Ảnh Base64: ${fileName} (${sizeKb} KB)]` : `[Ảnh Base64 (${sizeKb} KB)]`;
  }
  return url;
}

function selectBannerPage(pageKey) {
  currentBannerPage = pageKey;
  const b = bannersData[pageKey] || {
    page_key: pageKey,
    page_name: getPageNameByKey(pageKey),
    tagline: '',
    title: '',
    subtitle: '',
    image_url: 'images/hero-banner-full-doctor.png',
    btn_text: 'Đặt lịch khám ngay →',
    btn_link: 'dat-lich-kham.html'
  };

  document.getElementById('bannerPageKey').value = b.page_key;
  document.getElementById('bPageName').value = b.page_name || getPageNameByKey(pageKey);
  document.getElementById('bTagline').value = b.tagline || '';
  document.getElementById('bTitle').value = b.title || '';
  document.getElementById('bSubtitle').value = b.subtitle || '';
  document.getElementById('bImageUrl').value = b.image_url || '';
  document.getElementById('bBtnText').value = b.btn_text || '';
  document.getElementById('bBtnLink').value = b.btn_link || '';

  const displayEl = document.getElementById('displayImageUrlText');
  if (displayEl) {
    displayEl.textContent = formatDisplayImagePath(b.image_url);
    displayEl.title = b.image_url && b.image_url.startsWith('data:image/') ? 'Ảnh Base64' : (b.image_url || 'Chưa chọn ảnh');
  }

  const statusMsg = document.getElementById('uploadStatusMessage');
  if (statusMsg) {
    statusMsg.style.display = 'none';
  }

  updateBannerLivePreview();
}

// SETUP BANNER FILE UPLOAD (DRAG & DROP + FILE DIALOG)
function setupBannerUpload() {
  const dropzone = document.getElementById('bannerDropzone');
  const fileInput = document.getElementById('bannerFileInput');
  const triggerBtn = document.getElementById('btnTriggerUpload');

  if (!dropzone || !fileInput) return;

  triggerBtn?.addEventListener('click', (e) => {
    e.stopPropagation();
    fileInput.click();
  });

  dropzone.addEventListener('click', () => {
    fileInput.click();
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files && e.target.files.length > 0) {
      uploadBannerFile(e.target.files[0]);
    }
  });

  // Drag & drop handlers
  ['dragenter', 'dragover'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.add('dragover');
    });
  });

  ['dragleave', 'drop'].forEach(eventName => {
    dropzone.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      dropzone.classList.remove('dragover');
    });
  });

  dropzone.addEventListener('drop', (e) => {
    const dt = e.dataTransfer;
    if (dt && dt.files && dt.files.length > 0) {
      uploadBannerFile(dt.files[0]);
    }
  });
}

function uploadBannerFile(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Vui lòng chọn file hình ảnh (PNG, JPG, WEBP, SVG)!', 'warning');
    return;
  }

  const statusMsg = document.getElementById('uploadStatusMessage');
  if (statusMsg) {
    statusMsg.className = 'upload-status-box loading';
    statusMsg.style.display = 'flex';
    statusMsg.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>Đang tải lên và xử lý ảnh: <strong>${escapeHtml(file.name)}</strong> (${(file.size / (1024 * 1024)).toFixed(2)} MB)...</span>`;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const base64Data = e.target.result;

    fetch(`${API_BASE}/banners/upload`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileData: base64Data,
        pageKey: currentBannerPage
      })
    })
      .then(async res => {
        const contentType = res.headers.get('content-type') || '';
        if (contentType.includes('application/json')) {
          const data = await res.json();
          if (!res.ok) {
            throw new Error(data.error || data.message || `Lỗi máy chủ (${res.status})`);
          }
          return data;
        } else {
          const text = await res.text();
          throw new Error(`Máy chủ chưa nhận diện endpoint tải ảnh (${res.status}). Vui lòng khởi động lại server (node server.js).`);
        }
      })
      .then(data => {
        if (data.success && data.imageUrl) {
          document.getElementById('bImageUrl').value = data.imageUrl;
          const displayEl = document.getElementById('displayImageUrlText');
          if (displayEl) {
            displayEl.textContent = formatDisplayImagePath(data.imageUrl, file.name);
            displayEl.title = file.name;
          }

          updateBannerLivePreview();

          if (statusMsg) {
            statusMsg.className = 'upload-status-box success';
            statusMsg.innerHTML = `<i class="fas fa-check-circle"></i> <span>✓ Đã tải lên máy chủ thành công file: <strong>${escapeHtml(file.name)}</strong>. Nhấn "Lưu cấu hình" để áp dụng cho trang!</span>`;
          }
          showToast(`Đã upload thành công ảnh banner: ${file.name}`, 'success');
        } else {
          throw new Error(data.error || 'Lỗi xử lý file từ máy chủ');
        }
      })
      .catch(err => {
        if (statusMsg) {
          statusMsg.className = 'upload-status-box error';
          statusMsg.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <span>Lỗi tải lên: ${escapeHtml(err.message)}</span>`;
        }
        showToast('Lỗi khi tải ảnh lên máy chủ', 'error');
      });
  };

  reader.onerror = function () {
    if (statusMsg) {
      statusMsg.className = 'upload-status-box error';
      statusMsg.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <span>Lỗi đọc file từ máy tính</span>`;
    }
  };

  reader.readAsDataURL(file);
}

function getPageNameByKey(key) {
  const map = {
    'home': 'Trang chủ',
    'services': 'Dịch vụ y tế',
    'specialty': 'Chuyên khoa',
    'doctors': 'Đội ngũ bác sĩ',
    'news': 'Tin tức & Chia sẻ',
    'contact': 'Liên hệ',
    'appointment': 'Đặt lịch khám'
  };
  return map[key] || key;
}

function updateBannerLivePreview() {
  const previewBox = document.getElementById('bannerLivePreview');
  if (!previewBox) return;

  const tagline = document.getElementById('bTagline').value || '( Tagline )';
  const title = document.getElementById('bTitle').value || 'Tiêu đề Banner';
  const subtitle = document.getElementById('bSubtitle').value || 'Mô tả phụ banner hiển thị ở đây';
  const imageUrl = document.getElementById('bImageUrl').value || 'images/hero-banner-full-doctor.png';
  const btnText = document.getElementById('bBtnText').value || 'Nút bấm →';

  previewBox.style.backgroundImage = `url("${imageUrl}")`;
  document.getElementById('prevTagline').textContent = tagline;
  document.getElementById('prevTitle').innerHTML = title;
  document.getElementById('prevSubtitle').textContent = subtitle;
  document.getElementById('prevBtn').textContent = btnText;

  const thumb = document.getElementById('bannerThumbImg');
  if (thumb && imageUrl) {
    thumb.src = imageUrl;
    thumb.style.display = 'inline-block';
  }
}

async function handleSaveBanner(e) {
  e.preventDefault();
  const pageKey = document.getElementById('bannerPageKey').value;
  const payload = {
    tagline: document.getElementById('bTagline').value,
    title: document.getElementById('bTitle').value,
    subtitle: document.getElementById('bSubtitle').value,
    image_url: document.getElementById('bImageUrl').value,
    btn_text: document.getElementById('bBtnText').value,
    btn_link: document.getElementById('bBtnLink').value
  };

  try {
    const res = await fetch(`${API_BASE}/banners/${pageKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      showToast('Đã lưu thành công', 'success');
      bannersData[pageKey] = { ...bannersData[pageKey], ...payload };
    } else {
      showToast(result.error || 'Lỗi lưu banner', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối khi lưu banner SQL Server', 'error');
  }
}

// 10. ĐỔI MẬT KHẨU ADMIN (LƯU VÀO SQL Server)
function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPassword = input.type === 'password';
  input.type = isPassword ? 'text' : 'password';
  const icon = btn.querySelector('i');
  if (icon) {
    if (isPassword) {
      icon.className = 'far fa-eye-slash';
      btn.title = 'Ẩn mật khẩu';
    } else {
      icon.className = 'far fa-eye';
      btn.title = 'Hiện mật khẩu';
    }
  }
}

function showChangePasswordSuccessModal() {
  const modal = document.getElementById('changePasswordSuccessModal');
  if (modal) {
    modal.classList.add('show');
    modal.classList.add('active');
  }
}

function closeChangePasswordSuccessModal() {
  const modal = document.getElementById('changePasswordSuccessModal');
  if (modal) {
    modal.classList.remove('show');
    modal.classList.remove('active');
  }
}

function openChangePasswordModal() {
  const modal = document.getElementById('changePasswordModal');
  if (!modal) return;
  const username = currentUser ? currentUser.username : 'admin';
  document.getElementById('cpUsername').value = username;

  ['cpOldPassword', 'cpNewPassword', 'cpConfirmPassword'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.value = '';
      el.type = 'password';
    }
  });
  document.querySelectorAll('#changePasswordModal .btn-toggle-pwd i').forEach(icon => {
    icon.className = 'far fa-eye';
  });

  const errEl = document.getElementById('cpErrorMsg');
  if (errEl) {
    errEl.style.display = 'none';
    errEl.textContent = '';
  }
  modal.classList.add('show');
}

function closeChangePasswordModal() {
  const modal = document.getElementById('changePasswordModal');
  if (modal) modal.classList.remove('show');
}

async function handleChangePassword(e) {
  e.preventDefault();
  const username = document.getElementById('cpUsername').value.trim() || 'admin';
  const oldPassword = document.getElementById('cpOldPassword').value.trim();
  const newPassword = document.getElementById('cpNewPassword').value.trim();
  const confirmPassword = document.getElementById('cpConfirmPassword').value.trim();
  const errEl = document.getElementById('cpErrorMsg');

  if (newPassword.length < 6) {
    errEl.style.display = 'block';
    errEl.textContent = 'Mật khẩu mới phải có ít nhất 6 ký tự!';
    return;
  }

  if (newPassword !== confirmPassword) {
    errEl.style.display = 'block';
    errEl.textContent = 'Mật khẩu mới và xác nhận mật khẩu không khớp!';
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/auth/change-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, oldPassword, newPassword, confirmPassword })
    });
    const result = await res.json();

    if (result.success) {
      closeChangePasswordModal();
      showToast('Đổi mật khẩu tài khoản Admin thành công!', 'success');
    } else {
      errEl.style.display = 'block';
      errEl.textContent = result.message || 'Lỗi khi đổi mật khẩu!';
    }
  } catch (err) {
    errEl.style.display = 'block';
    errEl.textContent = 'Lỗi kết nối máy chủ khi cập nhật mật khẩu!';
  }
}

// 11. CẤU HÌNH LOGO WEBSITE (HEADER & FOOTER LƯU VÀO SQL Server)
async function loadSettings() {
  try {
    const res = await fetch(`${API_BASE}/settings?t=${Date.now()}`);
    const settings = await res.json();
    if (!settings) return;

    if (settings.header_logo) {
      const headerPreview = document.getElementById('headerLogoPreview');
      if (headerPreview) headerPreview.src = settings.header_logo;
      const headerPath = document.getElementById('headerLogoPathText');
      if (headerPath) headerPath.textContent = formatDisplayImagePath(settings.header_logo, 'Header');
    }

    if (settings.footer_logo) {
      const footerPreview = document.getElementById('footerLogoPreview');
      if (footerPreview) footerPreview.src = settings.footer_logo;
      const footerPath = document.getElementById('footerLogoPathText');
      if (footerPath) footerPath.textContent = formatDisplayImagePath(settings.footer_logo, 'Footer');
    }

    // Đồng bộ các trường Cấu hình công ty
    if (document.getElementById('cfgSiteTitle')) {
      document.getElementById('cfgSiteTitle').value = settings.site_title || 'Phòng Khám Đa Khoa An Phúc';
    }
    if (document.getElementById('cfgCompanyPhone')) {
      document.getElementById('cfgCompanyPhone').value = settings.phone || settings.hotline || '0764333998';
    }
    if (document.getElementById('cfgCompanyEmail')) {
      document.getElementById('cfgCompanyEmail').value = settings.email || 'contact@anphuc.vn';
    }
    if (document.getElementById('cfgCompanyAddress')) {
      document.getElementById('cfgCompanyAddress').value = settings.address || 'Số 123 Nguyễn Văn Cừ, Quận 1, TP.HCM';
    }
    if (document.getElementById('cfgCompanyWorkingHours')) {
      document.getElementById('cfgCompanyWorkingHours').value = settings.working_hours_text || 'Thứ 2 – Chủ nhật, 8:00 – 20:00';
    }
    if (document.getElementById('cfgCompanyFacebook')) {
      document.getElementById('cfgCompanyFacebook').value = settings.facebook_url || '';
    }
    if (document.getElementById('cfgCompanyZalo')) {
      document.getElementById('cfgCompanyZalo').value = settings.zalo_url || '';
    }
    if (document.getElementById('cfgCompanyInstagram')) {
      document.getElementById('cfgCompanyInstagram').value = settings.instagram_url || '';
    }
  } catch (err) {
    console.warn('Lỗi tải settings:', err);
  }
}

async function saveCompanySettings(e) {
  if (e) {
    if (typeof e.preventDefault === 'function') e.preventDefault();
    if (typeof e.stopPropagation === 'function') e.stopPropagation();
  }
  const btn = document.getElementById('btnSaveCompanySettings') || document.querySelector('#companySettingsForm .btn-save');
  const originalBtnHtml = btn ? btn.innerHTML : '';
  const originalBg = btn ? btn.style.background : '';
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Đang lưu...';
  }

  const site_title = document.getElementById('cfgSiteTitle')?.value.trim() || '';
  const phone = document.getElementById('cfgCompanyPhone')?.value.trim() || '';
  const hotline = phone;
  const email = document.getElementById('cfgCompanyEmail')?.value.trim() || '';
  const address = document.getElementById('cfgCompanyAddress')?.value.trim() || '';
  const working_hours_text = document.getElementById('cfgCompanyWorkingHours')?.value.trim() || '';
  const facebook_url = document.getElementById('cfgCompanyFacebook')?.value.trim() || '';
  const zalo_url = document.getElementById('cfgCompanyZalo')?.value.trim() || '';
  const instagram_url = document.getElementById('cfgCompanyInstagram')?.value.trim() || '';

  if (!site_title || !phone || !working_hours_text) {
    showToast('Vui lòng điền các trường bắt buộc (*)!', 'warning');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtnHtml;
    }
    return;
  }

  const payload = {
    site_title,
    hotline,
    phone,
    email,
    address,
    working_hours_text,
    facebook_url,
    zalo_url,
    instagram_url,
    youtube_url: ''
  };

  try {
    const res = await fetch(`${API_BASE}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      showToast('Đã lưu thành công', 'success');
      if (btn) {
        btn.style.background = '#059669';
        btn.innerHTML = '<i class="fas fa-check-circle"></i> Đã lưu thành công!';
        setTimeout(() => {
          if (btn) {
            btn.disabled = false;
            btn.style.background = originalBg || '#104936';
            btn.innerHTML = originalBtnHtml;
          }
        }, 2500);
      }
      loadSettings();
    } else {
      let errText = 'Lỗi khi lưu cấu hình công ty!';
      try {
        const result = await res.json();
        if (result && result.error) errText = result.error;
      } catch (_) {}
      showToast(errText, 'error');
      if (btn) {
        btn.disabled = false;
        btn.innerHTML = originalBtnHtml;
      }
    }
  } catch (err) {
    showToast('Lỗi kết nối máy chủ!', 'error');
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = originalBtnHtml;
    }
  }
}

function setupLogoUpload() {
  const headerInput = document.getElementById('headerLogoFileInput');
  const footerInput = document.getElementById('footerLogoFileInput');

  if (headerInput) {
    headerInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        uploadLogoFile(e.target.files[0], 'header');
      }
    });
  }

  if (footerInput) {
    footerInput.addEventListener('change', (e) => {
      if (e.target.files && e.target.files[0]) {
        uploadLogoFile(e.target.files[0], 'footer');
      }
    });
  }
}

function uploadLogoFile(file, type) {
  if (!file.type.startsWith('image/')) {
    showToast('Vui lòng chọn file hình ảnh (PNG, SVG, WEBP, JPG)!', 'warning');
    return;
  }

  const statusId = type === 'footer' ? 'footerLogoUploadStatus' : 'headerLogoUploadStatus';
  const statusEl = document.getElementById(statusId);
  if (statusEl) {
    statusEl.style.display = 'block';
    statusEl.style.background = '#e0f2fe';
    statusEl.style.color = '#0369a1';
    statusEl.innerHTML = `<i class="fas fa-spinner fa-spin"></i> Đang tải lên logo ${type === 'footer' ? 'Footer' : 'Header'}: <strong>${escapeHtml(file.name)}</strong>...`;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    const base64Data = e.target.result;

    fetch(`${API_BASE}/settings/upload-logo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: type,
        fileName: file.name,
        fileData: base64Data
      })
    })
      .then(async res => {
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Lỗi khi upload logo');
        return data;
      })
      .then(data => {
        if (data.success && data.imageUrl) {
          if (type === 'footer') {
            const preview = document.getElementById('footerLogoPreview');
            if (preview) preview.src = data.imageUrl;
            const pathText = document.getElementById('footerLogoPathText');
            if (pathText) pathText.textContent = formatDisplayImagePath(data.imageUrl, file.name);
          } else {
            const preview = document.getElementById('headerLogoPreview');
            if (preview) preview.src = data.imageUrl;
            const pathText = document.getElementById('headerLogoPathText');
            if (pathText) pathText.textContent = formatDisplayImagePath(data.imageUrl, file.name);
          }

          if (statusEl) {
            statusEl.style.background = '#dcfce7';
            statusEl.style.color = '#15803d';
            statusEl.innerHTML = `<i class="fas fa-check-circle"></i> Đã tải lên và lưu thành công Logo ${type === 'footer' ? 'Footer' : 'Header'}!`;
          }
          showToast(`Đã lưu Logo ${type === 'footer' ? 'Footer' : 'Header'} vào SQL Server!`, 'success');
        } else {
          throw new Error(data.error || 'Lỗi xử lý file');
        }
      })
      .catch(err => {
        if (statusEl) {
          statusEl.style.background = '#fee2e2';
          statusEl.style.color = '#b91c1c';
          statusEl.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Lỗi: ${escapeHtml(err.message)}`;
        }
        showToast('Lỗi khi tải logo lên máy chủ', 'error');
      });
  };

  reader.readAsDataURL(file);
}

// HELPERS
function formatVND(amount) {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);
}

function escapeHtml(str) {
  if (!str) return '';
  return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[m]));
}

function showToast(message, type = 'success') {
  let container = document.getElementById('toastContainer');
  if (!container || container.parentElement !== document.body) {
    if (container) container.remove();
    container = document.createElement('div');
    container.id = 'toastContainer';
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  container.style.display = 'flex';
  container.style.visibility = 'visible';
  container.style.opacity = '1';
  // Xóa thông báo cũ để thông báo mới luôn nổi bật chính giữa màn hình
  container.innerHTML = '';

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  const icon = type === 'success' ? 'fa-check-circle' : (type === 'error' ? 'fa-times-circle' : (type === 'warning' ? 'fa-exclamation-triangle' : 'fa-info-circle'));
  toast.innerHTML = `<i class="fas ${icon}"></i> <span>${message}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastTopFadeOut 0.35s ease forwards';
    setTimeout(() => toast.remove(), 350);
  }, 2600);
}


// ============================================================
// DOCTOR MANAGEMENT (SQL SERVER REALTIME SYNC)
// ============================================================
async function loadDoctors() {
  try {
    const res = await fetch(`${API_BASE}/doctors?t=${Date.now()}`);
    doctorsData = await res.json();
  } catch (e) {
    console.error('Lỗi tải danh sách bác sĩ:', e);
    doctorsData = [];
  }
  renderDoctorsTable(doctorsData);
}


function getSafeAvatarUrl(avatar) {
  if (!avatar) return '/images/doc-1.png';
  if (avatar.startsWith('http') || avatar.startsWith('data:') || avatar.startsWith('/')) {
    return avatar;
  }
  return '/' + avatar;
}

let doctorCurrentPage = 1;
const DOCTOR_PAGE_SIZE = 10;
let currentDoctorsData = [];

function changeDoctorPage(page) {
  doctorCurrentPage = page;
  renderDoctorsTable(currentDoctorsData);
}

function getStandardDocDepartment(deptStr) {
  if (!deptStr) return 'Khám nội tổng quát';
  const clean = String(deptStr).trim();
  if (Array.isArray(departmentsData) && departmentsData.length > 0) {
    const directMatch = departmentsData.find(d => d && d.name && d.name.trim() === clean);
    if (directMatch) return directMatch.name;

    const cleanLower = clean.toLowerCase().replace(/^(chuyên\s*khoa|khoa)\s*/i, '').trim();
    const fuzzyMatch = departmentsData.find(d => {
      const dName = (d.name || '').toLowerCase().replace(/^(chuyên\s*khoa|khoa)\s*/i, '').trim();
      return dName === cleanLower || (cleanLower === 'nội' && dName.includes('nội')) || (cleanLower === 'sản' && dName.includes('sản')) || (cleanLower === 'ngoại' && dName.includes('khớp')) || dName.includes(cleanLower) || cleanLower.includes(dName);
    });
    if (fuzzyMatch) return fuzzyMatch.name;
  }
  return clean.replace(/^(chuyên\s*khoa|khoa)\s*/i, '').trim() || clean;
}

function renderDoctorsTable(items) {
  currentDoctorsData = items || [];
  const tbody = document.getElementById('doctorsTableBody');
  const countInfo = document.getElementById('doctorPaginationCount');
  const controlsEl = document.getElementById('doctorPaginationControls');
  if (!tbody) return;

  if (!items || items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#6b7280;">Chưa có bác sĩ nào trong cơ sở dữ liệu</td></tr>';
    if (countInfo) countInfo.textContent = 'Hiển thị 0 trong tổng số 0 bác sĩ';
    if (controlsEl) controlsEl.innerHTML = '';
    return;
  }

  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / DOCTOR_PAGE_SIZE) || 1;
  if (doctorCurrentPage > totalPages) doctorCurrentPage = totalPages;
  if (doctorCurrentPage < 1) doctorCurrentPage = 1;

  const startIndex = (doctorCurrentPage - 1) * DOCTOR_PAGE_SIZE;
  const endIndex = Math.min(startIndex + DOCTOR_PAGE_SIZE, totalItems);
  const pageItems = items.slice(startIndex, endIndex);

  tbody.innerHTML = pageItems.map(d => {
    const avatarSrc = getSafeAvatarUrl(d.avatar);
    return `
    <tr>
      <td>
        <div style="width: 80px; height: 75px; border-radius: 12px; overflow: hidden; border: 2px solid #e2e8f0; background: #f8fafc; display: flex; align-items: center; justify-content: center; box-shadow: 0 2px 6px rgba(0,0,0,0.06);">
          <img src="${avatarSrc}" alt="${escapeHtml(d.name)}"
            style="width: 100%; height: 100%; object-fit: cover; object-position: top center; display: block;"
            onerror="this.onerror=null; this.src='/images/doc-1.png';">
        </div>
      </td>
      <td>
        <strong style="color: #104936; font-size: 0.98rem; display: block; margin-bottom: 3px;">${escapeHtml(d.name)}</strong>
        ${d.description ? `<small style="color: #64748b; font-size: 0.82rem; line-height: 1.4; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;">${escapeHtml(d.description)}</small>` : ''}
      </td>
      <td>
        <span class="badge badge-medical" style="background:#e8f5e9; color:#1b5e20; font-weight:600; font-size:0.83rem; padding: 5px 10px;">
          ${escapeHtml(getStandardDocDepartment(d.department))}
        </span>
      </td>
      <td><span style="font-weight: 500; color: #334155;">${escapeHtml(d.degree || '-')}</span></td>
      <td><span style="color: #475569;">${escapeHtml(d.experience || '-')}</span></td>
      <td>
        <span class="badge ${d.status === 'active' ? 'badge-confirmed' : 'badge-cancelled'}" style="cursor: pointer; user-select: none; white-space: nowrap; font-size: 0.84rem; padding: 6px 14px; font-size: 0.82rem; padding: 5px 10px;" onclick="toggleDoctorDisplay(${d.id})"
          title="Nhấn để Bật/Tắt hiển thị tại trang Đội ngũ bác sĩ">
          ${d.status === 'active' ? 'Hiển thị' : 'Đã ẩn'}
        </span>
      </td>
      <td>
        <div class="action-btns">
          <button title="Sửa" onclick="editDoctor(${d.id})"><i class="fas fa-edit"></i></button>
          <button class="btn-delete" title="Xóa" onclick="deleteDoctor(${d.id})"><i class="fas fa-trash-alt"></i></button>
        </div>
      </td>
    </tr>
  `;
  }).join('');

  if (countInfo) {
    countInfo.textContent = `Hiển thị ${startIndex + 1} – ${endIndex} trong tổng số ${totalItems} bác sĩ`;
  }

  if (controlsEl) {
    let controlsHtml = `<button type="button" class="appt-page-arrow" ${doctorCurrentPage === 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : 'onclick="changeDoctorPage(' + (doctorCurrentPage - 1) + ')"'}><i class="fas fa-chevron-left"></i></button>`;
    for (let p = 1; p <= totalPages; p++) {
      if (p === doctorCurrentPage) {
        controlsHtml += `<span class="appt-page-number">${p}</span>`;
      } else {
        controlsHtml += `<button type="button" class="appt-page-arrow" onclick="changeDoctorPage(${p})">${p}</button>`;
      }
    }
    controlsHtml += `<button type="button" class="appt-page-arrow" ${doctorCurrentPage === totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : 'onclick="changeDoctorPage(' + (doctorCurrentPage + 1) + ')"'}><i class="fas fa-chevron-right"></i></button>`;
    controlsEl.innerHTML = controlsHtml;
  }
}

function filterDoctorsTable() {
  doctorCurrentPage = 1;
  const q = (document.getElementById('searchDoctorInput')?.value || '').toLowerCase().trim();
  if (!q) {
    renderDoctorsTable(doctorsData);
    return;
  }
  const filtered = doctorsData.filter(d =>
    (d.name && d.name.toLowerCase().includes(q)) ||
    (d.department && d.department.toLowerCase().includes(q)) ||
    (d.degree && d.degree.toLowerCase().includes(q)) ||
    (d.experience && d.experience.toLowerCase().includes(q))
  );
  renderDoctorsTable(filtered);
}

function updateDocDepartmentDropdown(selectedVal = '') {
  const select = document.getElementById('docDepartment');
  if (!select) return;

  let depts = [];
  if (Array.isArray(departmentsData) && departmentsData.length > 0) {
    depts = departmentsData.map(d => (d && d.name) ? d.name.trim() : '').filter(Boolean);
  }

  // Deduplicate
  depts = [...new Set(depts)];

  // Default fallback if no departments loaded
  if (depts.length === 0) {
    depts = [
      'Khám nội tổng quát',
      'Nhi khoa',
      'Sản phụ khoa',
      'Tim mạch',
      'Hô hấp',
      'Tiêu hóa',
      'Tiêm chủng'
    ];
  }

  const currentVal = (selectedVal || select.value || '').trim();
  const allValues = [...depts];

  let targetVal = currentVal;
  if (currentVal && !allValues.includes(currentVal)) {
    // Check if one of allValues corresponds to currentVal (e.g. "Chuyên khoa Nhi" -> "Nhi khoa", "Chuyên khoa Sản" -> "Sản phụ khoa")
    const cleanC = currentVal.toLowerCase().replace(/^(chuyên\s*khoa|khoa)\s*/i, '').trim();
    const found = allValues.find(v => {
      const cleanV = v.toLowerCase().replace(/^(chuyên\s*khoa|khoa)\s*/i, '').trim();
      return cleanV === cleanC || (cleanC === 'nội' && cleanV.includes('nội')) || cleanV.includes(cleanC) || cleanC.includes(cleanV);
    });
    if (found) {
      targetVal = found;
    } else {
      allValues.unshift(currentVal);
      targetVal = currentVal;
    }
  }

  select.innerHTML = allValues.map(name => {
    const isSelected = (name === targetVal) ? ' selected' : '';
    return `<option value="${escapeHtml(name)}"${isSelected}>${escapeHtml(name)}</option>`;
  }).join('');

  if (targetVal) {
    select.value = targetVal;
  }
}

async function openDoctorModal(d = null) {
  const modal = document.getElementById('doctorModal');
  if (!modal) return;
  document.getElementById('doctorForm').reset();
  document.getElementById('doctorId').value = '';

  // Ensure latest departments from "Quản lý Chuyên khoa" are loaded
  if (!Array.isArray(departmentsData) || departmentsData.length === 0) {
    try {
      const res = await fetch(`${API_BASE}/departments?t=${Date.now()}`);
      departmentsData = await res.json();
    } catch (e) {
      console.warn('Cannot load departments for doctor modal', e);
    }
  }

  if (d) {
    document.getElementById('doctorModalTitle').textContent = 'Chỉnh Sửa Bác Sĩ';
    document.getElementById('doctorId').value = d.id;
    document.getElementById('docName').value = d.name || '';
    document.getElementById('docDegree').value = d.degree || '';
    updateDocDepartmentDropdown(d.department || '');
    document.getElementById('docExperience').value = d.experience || '';
    document.getElementById('docAvatar').value = d.avatar || '/images/doc-1.png';
    document.getElementById('docStatus').value = d.status || 'active';
    document.getElementById('docSortOrder').value = d.sort_order || 0;
    document.getElementById('docDescription').value = d.description || '';

    // Bật/Tắt hiển thị tại trang Đội ngũ bác sĩ
    const isShown = (d.status === 'active');
    const toggleEl = document.getElementById('docShowOnPage');
    if (toggleEl) {
      toggleEl.checked = isShown;
      updateDocShowStatus(isShown);
    }
  } else {
    document.getElementById('doctorModalTitle').textContent = 'Thêm Bác Sĩ Mới';
    updateDocDepartmentDropdown('');
    document.getElementById('docAvatar').value = '/images/doc-1.png';
    const toggleEl = document.getElementById('docShowOnPage');
    if (toggleEl) {
      toggleEl.checked = true;
      updateDocShowStatus(true);
    }
  }
  updateDocAvatarPreview();
  modal.classList.add('show');
}

function updateDocShowStatus(checked) {
  const statusSelect = document.getElementById('docStatus');
  if (statusSelect) {
    statusSelect.value = checked ? 'active' : 'inactive';
  }
  const textEl = document.getElementById('docShowStatusText');
  if (!textEl) return;
  if (checked) {
    textEl.textContent = 'Bật (Đang hiển thị)';
    textEl.style.color = '#104936';
  } else {
    textEl.textContent = 'Tắt (Ẩn khỏi trang Bác sĩ)';
    textEl.style.color = '#dc2626';
  }
}

function handleDocStatusChange(val) {
  const isAct = (val === 'active');
  const toggleEl = document.getElementById('docShowOnPage');
  if (toggleEl) toggleEl.checked = isAct;
  const textEl = document.getElementById('docShowStatusText');
  if (textEl) {
    if (isAct) {
      textEl.textContent = 'Bật (Đang hiển thị)';
      textEl.style.color = '#104936';
    } else {
      textEl.textContent = 'Tắt (Ẩn khỏi trang Bác sĩ)';
      textEl.style.color = '#dc2626';
    }
  }
}

async function toggleDoctorDisplay(id) {
  const doc = doctorsData.find(x => x.id == id);
  if (!doc) return;
  const newStatus = (doc.status === 'active') ? 'inactive' : 'active';
  try {
    const res = await fetch(`${API_BASE}/doctors/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...doc, status: newStatus })
    });
    if (!res.ok) throw new Error('Không thể cập nhật trạng thái');
    doc.status = newStatus;
    renderDoctorsTable(doctorsData);
    showToast(newStatus === 'active' ? 'Đã bật hiển thị bác sĩ trên website!' : 'Đã ẩn bác sĩ khỏi trang Đội ngũ bác sĩ!', 'success');
  } catch (err) {
    showToast('Lỗi: ' + err.message, 'error');
  }
}

function closeDoctorModal() {
  const modal = document.getElementById('doctorModal');
  if (modal) modal.classList.remove('show');
}

function selectDocAvatar(url) {
  const avInput = document.getElementById('docAvatar');
  if (avInput) {
    avInput.value = url;
    updateDocAvatarPreview();
  }
}

function updateDocAvatarPreview() {
  const raw = document.getElementById('docAvatar')?.value.trim() || '/images/doc-1.png';
  const val = getSafeAvatarUrl(raw);
  const prev = document.getElementById('docAvatarPreview');
  if (prev) {
    prev.onerror = function () {
      this.onerror = null;
      this.src = '/images/doc-1.png';
    };
    prev.src = val;
  }
}

function handleDoctorAvatarUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function (e) {
    const base64Data = e.target.result;
    try {
      showToast('Đang tải ảnh bác sĩ lên máy chủ...', 'info');
      const res = await fetch(`${API_BASE}/doctors/upload-image`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName: file.name,
          fileData: base64Data
        })
      });
      const data = await res.json();
      if (data.success && data.imageUrl) {
        const avInput = document.getElementById('docAvatar');
        if (avInput) avInput.value = data.imageUrl;
        updateDocAvatarPreview();
        showToast('Tải ảnh bác sĩ thành công!', 'success');
      } else {
        throw new Error(data.details || data.error || 'Upload ảnh thất bại');
      }
    } catch (err) {
      console.warn('Fallback gán trực tiếp ảnh đại diện:', err.message);
      const avInput = document.getElementById('docAvatar');
      if (avInput) avInput.value = base64Data;
      updateDocAvatarPreview();
      showToast('Đã chọn ảnh đại diện cho bác sĩ', 'info');
    }
  };
  reader.readAsDataURL(file);
}

function editDoctor(id) {
  const d = doctorsData.find(x => x.id == id);
  if (d) openDoctorModal(d);
}

async function handleSaveDoctor(e) {
  e.preventDefault();
  const id = document.getElementById('doctorId').value;
  const toggleEl = document.getElementById('docShowOnPage');
  const statusSelect = document.getElementById('docStatus');
  const isShown = toggleEl ? toggleEl.checked : (statusSelect?.value === 'active');
  const statusVal = isShown ? 'active' : 'inactive';

  const data = {
    name: document.getElementById('docName').value.trim(),
    degree: document.getElementById('docDegree').value.trim(),
    department: document.getElementById('docDepartment').value,
    experience: document.getElementById('docExperience').value.trim(),
    avatar: document.getElementById('docAvatar').value.trim() || '/images/doc-1.png',
    status: statusVal,
    sort_order: parseInt(document.getElementById('docSortOrder')?.value) || 0,
    description: document.getElementById('docDescription').value.trim()
  };

  try {
    const url = id ? `${API_BASE}/doctors/${id}` : `${API_BASE}/doctors`;
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(resData.details || resData.error || 'Lỗi khi lưu thông tin bác sĩ');
    }
    showToast('Đã lưu thành công', 'success');
    closeDoctorModal();
    await loadDoctors();
  } catch (err) {
    showToast('Lỗi lưu SQL Server: ' + err.message, 'error');
  }
}

async function deleteDoctor(id) {
  try {
    const res = await fetch(`${API_BASE}/doctors/${id}`, { method: 'DELETE' });
    const resData = await res.json().catch(() => ({}));
    if (!res.ok) {
      throw new Error(resData.details || resData.error || 'Không thể xóa bác sĩ');
    }
    showToast('Đã xóa bác sĩ khỏi hệ thống!', 'warning');
    await loadDoctors();
  } catch (err) {
    showToast('Lỗi khi xóa bác sĩ: ' + err.message, 'error');
  }
}

// ============================================================
// HỆ THỐNG THÔNG BÁO THỜI GIAN THỰC (LỊCH HẸN & LIÊN HỆ MỚI)
// ============================================================
let readNotificationIds = new Set(JSON.parse(localStorage.getItem('adminReadNotifIds') || '[]'));
let prevApptMaxId = 0;
let prevContactMaxId = 0;
let isFirstCheck = true;

function toggleNotifDropdown(event) {
  event.stopPropagation();
  const dd = document.getElementById('notifDropdown');
  if (dd) {
    dd.classList.toggle('show');
    if (dd.classList.contains('show')) {
      renderNotifications();
    }
  }
}

function markAllNotificationsAsRead(event) {
  if (event) event.stopPropagation();
  const notifs = getCombinedNotifications();
  notifs.forEach(n => readNotificationIds.add(n.id));
  try {
    localStorage.setItem('adminReadNotifIds', JSON.stringify([...readNotificationIds]));
  } catch (_) { }
  renderNotifications();
  showToast('Đã đánh dấu tất cả thông báo là đã đọc!', 'success');
}

// Định dạng ngày hiển thị cho thông báo (chuẩn DD/MM/YYYY giống thông báo liên hệ)
function formatNotifDate(val) {
  if (!val) return new Date().toLocaleDateString('vi-VN');
  const s = String(val).trim();
  if (!s) return new Date().toLocaleDateString('vi-VN');

  // Đã ở định dạng DD/MM/YYYY hoặc D/M/YYYY
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) {
    return s;
  }

  // Định dạng YYYY-MM-DD hoặc ISO
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(s)) {
    const datePart = s.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
  }

  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    return d.toLocaleDateString('vi-VN');
  }

  return s;
}

function getCombinedNotifications() {
  const notifs = [];

  // 1. Lịch hẹn khám
  if (Array.isArray(appointmentsData)) {
    appointmentsData.forEach(a => {
      const patientName = a.patient_name || a.name || 'Bệnh nhân';
      const specialty = a.specialty || 'Đa khoa';
      const doctor = a.doctor || '';
      const date = a.appointment_date || '';
      const time = a.appointment_time || '';
      const notifId = `appt_${a.id}`;
      const isRead = readNotificationIds.has(notifId) || a.status === 'confirmed' || a.status === 'cancelled';
      
      // Ngày thông báo hiển thị đúng ngày tạo (created_at) với định dạng DD/MM/YYYY
      const createdDateDisplay = formatNotifDate(a.created_at || a.createdAt);

      notifs.push({
        id: notifId,
        rawId: a.id,
        type: 'appointment',
        title: `Lịch hẹn mới: ${patientName}`,
        summary: `Khoa ${specialty}${doctor ? ' (' + doctor + ')' : ''} lúc ${time ? time : ''} ngày ${date}`,
        displayDate: createdDateDisplay,
        appointmentDate: date,
        date: date,
        time: time,
        isRead: isRead,
        createdAt: a.created_at || a.createdAt || '',
        status: a.status || 'pending'
      });
    });
  }

  // 2. Thư liên hệ
  if (Array.isArray(contactsData)) {
    contactsData.forEach(c => {
      const sender = c.name || 'Khách hàng';
      const phone = c.phone || '';
      const msg = c.message || c.content || '';
      const notifId = `contact_${c.id}`;
      const isRead = readNotificationIds.has(notifId) || c.status === 'resolved';
      const createdDateDisplay = formatNotifDate(c.created_at || c.createdAt);

      notifs.push({
        id: notifId,
        rawId: c.id,
        type: 'contact',
        title: `Liên hệ mới từ ${sender}`,
        summary: `${phone ? 'SĐT: ' + phone + ' - ' : ''}"${msg.slice(0, 65)}${msg.length > 65 ? '...' : ''}"`,
        displayDate: createdDateDisplay,
        appointmentDate: '',
        date: c.created_at || '',
        time: '',
        isRead: isRead,
        createdAt: c.created_at || '',
        status: c.status || 'new'
      });
    });
  }

  // Sắp xếp: Chưa đọc lên đầu, sau đó theo ID giảm dần
  notifs.sort((a, b) => {
    if (a.isRead !== b.isRead) return a.isRead ? 1 : -1;
    return b.rawId - a.rawId;
  });

  return notifs;
}

function renderNotifications() {
  const notifs = getCombinedNotifications();
  const unreadCount = notifs.filter(n => !n.isRead).length;

  const badgeEl = document.getElementById('bellBadgeCount');
  if (badgeEl) {
    badgeEl.textContent = unreadCount;
    badgeEl.style.display = unreadCount > 0 ? 'flex' : 'none';
  }

  const tagEl = document.getElementById('notifUnreadTag');
  if (tagEl) {
    tagEl.textContent = `${unreadCount} mới`;
  }

  const container = document.getElementById('notifListContainer');
  if (!container) return;

  if (notifs.length === 0) {
    container.innerHTML = `
      <div class="notif-empty-state">
        <i class="far fa-bell-slash"></i>
        <p>Hiện không có thông báo nào</p>
      </div>
    `;
    return;
  }

  container.innerHTML = notifs.map(n => {
    const iconHtml = n.type === 'appointment'
      ? '<div class="notif-item-icon icon-appt"><i class="fas fa-calendar-check"></i></div>'
      : '<div class="notif-item-icon icon-contact"><i class="fas fa-envelope-open-text"></i></div>';

    const unreadDot = n.isRead ? '' : '<span class="notif-unread-dot"></span>';

    return `
      <div class="notif-item ${n.isRead ? 'read' : 'unread'}" onclick="handleNotifClick('${n.id}', '${n.type}', ${n.rawId}, '${escapeHtml(n.appointmentDate || n.date || '')}')">
        ${iconHtml}
        <div class="notif-item-text">
          <div class="notif-item-title">
            <span>${escapeHtml(n.title)}</span>
            ${unreadDot}
          </div>
          <div class="notif-item-desc">${escapeHtml(n.summary)}</div>
          <div class="notif-item-meta">
            <span><i class="far fa-clock"></i> ${escapeHtml(n.displayDate || 'Hôm nay')}</span>
            <span class="notif-item-cta">Xem chi tiết &rarr;</span>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

function handleNotifClick(notifId, type, rawId, dateStr) {
  readNotificationIds.add(notifId);
  try {
    localStorage.setItem('adminReadNotifIds', JSON.stringify([...readNotificationIds]));
  } catch (_) { }

  const dd = document.getElementById('notifDropdown');
  if (dd) dd.classList.remove('show');

  renderNotifications();

  if (type === 'appointment') {
    switchSection('section-appointments');
    if (dateStr) {
      const normDate = normalizeDateStr(dateStr);
      const parts = normDate.split('-');
      if (parts.length === 3) {
        currentCalYear = parseInt(parts[0], 10);
        currentCalMonth = parseInt(parts[1], 10);
        selectedCalDay = parseInt(parts[2], 10);
        currentApptFilter.date = normDate;
        renderApptCalendar();
        applyAppointmentFilters();
      }
    }
    setTimeout(() => {
      const rows = document.querySelectorAll('#appointmentsTableBody tr');
      rows.forEach(r => {
        if (r.textContent.includes('#' + rawId)) {
          r.style.backgroundColor = '#ecfdf5';
          r.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => { r.style.backgroundColor = ''; }, 3000);
        }
      });
    }, 250);
  } else if (type === 'contact') {
    switchSection('section-contacts');
    setTimeout(() => {
      const rows = document.querySelectorAll('#contactsTableBody tr');
      rows.forEach(r => {
        if (r.textContent.includes('#' + rawId)) {
          r.style.backgroundColor = '#eff6ff';
          r.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setTimeout(() => { r.style.backgroundColor = ''; }, 3000);
        }
      });
    }, 250);
  }
}

function showRealtimeNotificationToast(type, id, title, desc, dateStr) {
  const container = document.getElementById('realtimeNotifContainer');
  if (!container) return;

  const iconClass = type === 'appointment' ? 'fas fa-calendar-alt' : 'fas fa-envelope';
  const tagText = type === 'appointment' ? 'LỊCH HẸN MỚI' : 'LIÊN HỆ MỚI';

  const toast = document.createElement('div');
  toast.className = `realtime-notif-toast ${type}`;
  toast.innerHTML = `
    <div class="rt-icon-box">
      <i class="${iconClass}"></i>
    </div>
    <div class="rt-body">
      <div class="rt-badge">${tagText}</div>
      <div class="rt-title">${escapeHtml(title)}</div>
      <div class="rt-desc">${escapeHtml(desc)}</div>
      <div class="rt-link">Bấm vào đây</div>
    </div>
    <button type="button" class="rt-close-btn" onclick="dismissRtToast(event, this)">&times;</button>
  `;

  toast.addEventListener('click', (e) => {
    if (e.target.closest('.rt-close-btn')) return;
    toast.remove();
    handleNotifClick(`${type}_${id}`, type, id, dateStr);
  });

  container.appendChild(toast);

  setTimeout(() => {
    if (toast.parentNode) {
      toast.classList.add('fade-out');
      setTimeout(() => toast.remove(), 300);
    }
  }, 10000);
}

function dismissRtToast(e, btn) {
  e.stopPropagation();
  const toast = btn.closest('.realtime-notif-toast');
  if (toast) {
    toast.classList.add('fade-out');
    setTimeout(() => toast.remove(), 250);
  }
}

async function checkNewNotifications() {
  try {
    const [resAppts, resContacts] = await Promise.all([
      fetch(`${API_BASE}/appointments`).then(r => r.json()).catch(() => []),
      fetch(`${API_BASE}/contacts`).then(r => r.json()).catch(() => [])
    ]);

    if (Array.isArray(resAppts) && resAppts.length > 0) {
      const currentMax = Math.max(...resAppts.map(a => Number(a.id) || 0));
      if (!isFirstCheck && currentMax > prevApptMaxId) {
        const newAppts = resAppts.filter(a => (Number(a.id) || 0) > prevApptMaxId);
        newAppts.forEach(a => {
          showRealtimeNotificationToast(
            'appointment',
            a.id,
            `Bệnh nhân: ${a.patient_name || a.name || 'Khách đặt lịch'}`,
            `Khoa: ${a.specialty || 'Tổng quát'} - ${a.appointment_time || ''} (${a.appointment_date || ''})`,
            a.appointment_date
          );
        });
        appointmentsData = resAppts;
        updateApptStatCards();
        applyAppointmentFilters();
      }
      prevApptMaxId = currentMax;
    }

    if (Array.isArray(resContacts) && resContacts.length > 0) {
      const currentMax = Math.max(...resContacts.map(c => Number(c.id) || 0));
      if (!isFirstCheck && currentMax > prevContactMaxId) {
        const newContacts = resContacts.filter(c => (Number(c.id) || 0) > prevContactMaxId);
        newContacts.forEach(c => {
          showRealtimeNotificationToast(
            'contact',
            c.id,
            `Từ: ${c.name || 'Khách hàng'} (${c.phone || ''})`,
            c.message ? `"${c.message.slice(0, 70)}..."` : 'Đã gửi lời nhắn liên hệ',
            c.created_at
          );
        });
        contactsData = resContacts;
        renderContactsTable(contactsData);
      }
      prevContactMaxId = currentMax;
    }

    isFirstCheck = false;
    renderNotifications();
  } catch (err) {
    // Polling error silently handled
  }
}

// Lắng nghe click bên ngoài để đóng dropdown thông báo
document.addEventListener('click', (e) => {
  const notifDropdown = document.getElementById('notifDropdown');
  if (notifDropdown && notifDropdown.classList.contains('show')) {
    if (!e.target.closest('.notif-wrapper')) {
      notifDropdown.classList.remove('show');
    }
  }
});

// ===================================================
// 12. CẤU HÌNH THỜI GIAN KHÁM & KHUNG GIỜ ĐẶT LỊCH
// ===================================================
const DEFAULT_TIME_SLOTS = [
  { id: 1, time: '08:00 - 09:00', period: 'Sáng', active: true },
  { id: 2, time: '09:00 - 10:00', period: 'Sáng', active: true },
  { id: 3, time: '10:00 - 11:00', period: 'Sáng', active: true },
  { id: 4, time: '11:00 - 12:00', period: 'Sáng', active: true },
  { id: 5, time: '13:30 - 14:30', period: 'Chiều', active: true },
  { id: 6, time: '14:30 - 15:30', period: 'Chiều', active: true },
  { id: 7, time: '15:30 - 16:30', period: 'Chiều', active: true },
  { id: 8, time: '16:30 - 17:30', period: 'Chiều', active: true },
  { id: 9, time: '17:30 - 18:30', period: 'Tối', active: true },
  { id: 10, time: '18:30 - 19:30', period: 'Tối', active: true },
  { id: 11, time: '19:30 - 20:00', period: 'Tối', active: true }
];

let scheduleSettings = {
  working_hours_text: 'Thứ 2 – Chủ nhật, 8:00 – 20:00',
  hotline: '1900 1234',
  working_hours_slots: [...DEFAULT_TIME_SLOTS]
};

async function loadScheduleSettings() {
  try {
    const res = await fetch(`${API_BASE}/settings?t=${Date.now()}`);
    const settings = await res.json();
    if (settings) {
      if (settings.working_hours_text) {
        scheduleSettings.working_hours_text = settings.working_hours_text;
      }
      if (settings.hotline) {
        scheduleSettings.hotline = settings.hotline;
      }
      if (settings.working_hours_slots) {
        let parsed = settings.working_hours_slots;
        if (typeof parsed === 'string') {
          try { parsed = JSON.parse(parsed); } catch (e) { parsed = null; }
        }
        if (Array.isArray(parsed)) {
          scheduleSettings.working_hours_slots = parsed;
        }
      }
    }
  } catch (err) {
    console.warn('Lỗi tải cài đặt thời gian khám:', err);
  }

  // Cập nhật giá trị vào form cài đặt
  const txtInput = document.getElementById('cfgWorkingHoursText');
  if (txtInput) txtInput.value = scheduleSettings.working_hours_text || '';
  const hotlineInput = document.getElementById('cfgScheduleHotline');
  if (hotlineInput) hotlineInput.value = scheduleSettings.hotline || '';

  renderTimeSlotsTable();
  updateFilterTimeSelect();
}

function updateFilterTimeSelect() {
  const select = document.getElementById('filterTimeSelect');
  if (!select) return;
  const currentVal = select.value;
  const slots = (scheduleSettings && Array.isArray(scheduleSettings.working_hours_slots) && scheduleSettings.working_hours_slots.length > 0)
    ? scheduleSettings.working_hours_slots
    : DEFAULT_TIME_SLOTS;

  let html = '<option value="">Thời gian</option>';
  slots.forEach(slot => {
    const timeStr = typeof slot === 'string' ? slot : slot.time;
    if (timeStr) {
      html += `<option value="${escapeHtml(timeStr)}">${escapeHtml(timeStr)}</option>`;
    }
  });
  select.innerHTML = html;
  if (currentVal) select.value = currentVal;
}

function renderTimeSlotsTable() {
  updateFilterTimeSelect();
  const tbody = document.getElementById('timeSlotsTableBody');
  if (!tbody) return;

  const slots = scheduleSettings.working_hours_slots || [];
  if (slots.length === 0) {
    tbody.innerHTML = `
      <tr>
        <td colspan="5" style="text-align: center; padding: 32px; color: #94a3b8;">
          <i class="far fa-clock" style="font-size: 2rem; margin-bottom: 8px; display: block; opacity: 0.5;"></i>
          Chưa có khung giờ khám nào được cấu hình
        </td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = slots.map((slot, index) => {
    const isActive = slot.active !== false;
    const badgeStatus = isActive
      ? `<span class="badge-slot-active"><i class="fas fa-check-circle"></i> Đang mở</span>`
      : `<span class="badge-slot-inactive"><i class="fas fa-ban"></i> Tạm khóa</span>`;
    
    const toggleTitle = isActive ? 'Tạm khóa khung giờ' : 'Mở lại khung giờ';
    const toggleIcon = isActive ? 'fa-toggle-on' : 'fa-toggle-off';
    const toggleColor = isActive ? '#104936' : '#94a3b8';

    return `
      <tr style="border-bottom: 1px solid #f1f5f9;">
        <td style="padding: 12px 14px; color: #64748b; font-weight: 500;">${index + 1}</td>
        <td style="padding: 12px 14px;">
          <strong style="color: #0f172a; font-size: 0.95rem;">${escapeHtml(slot.time)}</strong>
        </td>
        <td style="padding: 12px 14px;">
          <span class="badge-slot-period">${escapeHtml(slot.period || 'Sáng')}</span>
        </td>
        <td style="padding: 12px 14px; text-align: center;">
          ${badgeStatus}
        </td>
        <td style="padding: 12px 14px; text-align: center;">
          <div style="display: inline-flex; gap: 6px; align-items: center;">
            <button type="button" class="btn-slot-action" title="${toggleTitle}" onclick="toggleTimeSlotActive(${index})" style="color: ${toggleColor};">
              <i class="fas ${toggleIcon}" style="font-size: 1.1rem;"></i>
            </button>
            <button type="button" class="btn-slot-action" title="Chỉnh sửa khung giờ" onclick="openTimeSlotModal(${index})">
              <i class="fas fa-edit" style="color: #2563eb;"></i>
            </button>
            <button type="button" class="btn-slot-action btn-slot-delete" title="Xóa khung giờ" onclick="deleteTimeSlot(${index})">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

async function saveGeneralWorkingHours(e) {
  if (e) e.preventDefault();
  const textVal = document.getElementById('cfgWorkingHoursText')?.value.trim();
  const hotlineVal = document.getElementById('cfgScheduleHotline')?.value.trim();

  if (!textVal) {
    showToast('Vui lòng nhập thời gian làm việc hiển thị!', 'warning');
    return;
  }

  scheduleSettings.working_hours_text = textVal;
  scheduleSettings.hotline = hotlineVal;

  const payload = {
    working_hours_text: textVal,
    hotline: hotlineVal
  };

  try {
    let res = await fetch(`${API_BASE}/settings/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // Nếu endpoint /schedule chưa nạp hoặc 404, tự động fallback sang PUT /api/settings
    if (!res.ok) {
      res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    if (res.ok) {
      showToast('Đã lưu cài đặt thành công!', 'success');
    } else {
      let errText = 'Lỗi khi lưu cài đặt!';
      try {
        const result = await res.json();
        if (result && result.error) errText = result.error;
      } catch (errJson) {}
      showToast(errText, 'error');
    }
  } catch (err) {
    // Nếu có sự cố kết nối, thử fallback lần nữa
    try {
      const fb = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (fb.ok) {
        showToast('Đã lưu cài đặt thành công!', 'success');
        return;
      }
    } catch (e2) {}
    showToast('Lỗi kết nối máy chủ!', 'error');
  }
}

function openTimeSlotModal(index = null) {
  const modal = document.getElementById('timeSlotModal');
  const title = document.getElementById('timeSlotModalTitle');
  const indexInput = document.getElementById('timeSlotIndex');
  const timeInput = document.getElementById('slotTimeValue');
  const periodSelect = document.getElementById('slotPeriod');
  const activeSelect = document.getElementById('slotActive');

  if (index !== null && scheduleSettings.working_hours_slots[index]) {
    const slot = scheduleSettings.working_hours_slots[index];
    title.innerHTML = '<i class="far fa-clock" style="color: #104936;"></i> Chỉnh sửa khung giờ khám';
    indexInput.value = index;
    timeInput.value = slot.time || '';
    periodSelect.value = slot.period || 'Sáng';
    activeSelect.value = (slot.active !== false) ? 'true' : 'false';
  } else {
    title.innerHTML = '<i class="far fa-clock" style="color: #104936;"></i> Thêm khung giờ khám';
    indexInput.value = '';
    timeInput.value = '';
    periodSelect.value = 'Sáng';
    activeSelect.value = 'true';
  }

  if (modal) modal.style.display = 'flex';
}

function closeTimeSlotModal() {
  const modal = document.getElementById('timeSlotModal');
  if (modal) modal.style.display = 'none';
}

async function saveTimeSlot(e) {
  if (e) e.preventDefault();
  const indexVal = document.getElementById('timeSlotIndex').value;
  const timeVal = document.getElementById('slotTimeValue').value.trim();
  const periodVal = document.getElementById('slotPeriod').value;
  const activeVal = document.getElementById('slotActive').value === 'true';

  if (!timeVal) {
    showToast('Vui lòng nhập khung giờ khám!', 'warning');
    return;
  }

  const newSlot = {
    id: indexVal !== '' ? scheduleSettings.working_hours_slots[indexVal].id : Date.now(),
    time: timeVal,
    period: periodVal,
    active: activeVal
  };

  if (indexVal !== '') {
    scheduleSettings.working_hours_slots[parseInt(indexVal, 10)] = newSlot;
  } else {
    scheduleSettings.working_hours_slots.push(newSlot);
  }

  await persistScheduleSlots();
  closeTimeSlotModal();
  renderTimeSlotsTable();
  showToast('Đã lưu thành công', 'success');
}

async function toggleTimeSlotActive(index) {
  if (!scheduleSettings.working_hours_slots[index]) return;
  const current = scheduleSettings.working_hours_slots[index].active !== false;
  scheduleSettings.working_hours_slots[index].active = !current;

  await persistScheduleSlots();
  renderTimeSlotsTable();
  showToast(!current ? 'Đã mở khung giờ!' : 'Đã tạm khóa khung giờ!', 'info');
}

async function deleteTimeSlot(index) {
  if (!scheduleSettings.working_hours_slots[index]) return;
  const slot = scheduleSettings.working_hours_slots[index];

  // Xóa ngay lập tức khỏi mảng và render lại giao diện tức thì
  scheduleSettings.working_hours_slots.splice(index, 1);
  renderTimeSlotsTable();
  showToast(`Đã xóa khung giờ "${slot.time}" thành công!`, 'success');

  // Lưu ngay xuống cơ sở dữ liệu
  await persistScheduleSlots();
}

async function persistScheduleSlots() {
  const payload = {
    working_hours_slots: scheduleSettings.working_hours_slots
  };
  try {
    let res = await fetch(`${API_BASE}/settings/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      res = await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          working_hours_slots: JSON.stringify(scheduleSettings.working_hours_slots)
        })
      });
    }
  } catch (err) {
    try {
      await fetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          working_hours_slots: JSON.stringify(scheduleSettings.working_hours_slots)
        })
      });
    } catch (e2) {
      console.warn('Lỗi lưu danh sách khung giờ:', e2);
    }
  }
}

