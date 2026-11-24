// MODULE: AUTHENTICATION, NAVIGATION & CHANGE PASSWORD

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

// ============================================================
// HASH ROUTER CHO TRANG ADMIN (Giữ đúng trang khi bấm Reload / Back / Forward)
// ============================================================
const ADMIN_SECTION_TO_HASH = {
  'section-appointments': '#/lich-hen',
  'section-services': '#/dich-vu',
  'section-departments': '#/chuyen-khoa',
  'section-doctors': '#/bac-si',
  'section-products': '#/san-pham',
  'section-news': '#/tin-tuc',
  'section-contacts': '#/lien-he',
  'section-banners': '#/cau-hinh/banner',
  'section-schedule': '#/cau-hinh/thoi-gian',
  'section-company': '#/cau-hinh/cong-ty',
  'section-dashboard': '#/tong-quan'
};

const ADMIN_HASH_TO_SECTION = Object.fromEntries(
  Object.entries(ADMIN_SECTION_TO_HASH).map(([sec, hash]) => [hash, sec])
);

let isApplyingHashRoute = false;

function setAdminHash(hash) {
  if (!hash || isApplyingHashRoute) return;
  if (window.location.hash !== hash) {
    history.replaceState(null, '', hash);
  }
}
window.setAdminHash = setAdminHash;

async function applyAdminRouteFromHash(dataReady = false) {
  const rawHash = (window.location.hash || '').trim();
  const hash = rawHash.split('?')[0];

  isApplyingHashRoute = true;
  try {
    // Route tạo/sửa Dịch vụ Y tế
    if (hash === '#/dich-vu/tao-moi') {
      if (typeof openServiceModal === 'function') openServiceModal(null, false);
      return;
    }
    const svcEditMatch = hash.match(/^#\/dich-vu\/sua\/(\d+)$/);
    if (svcEditMatch) {
      if (dataReady && typeof editService === 'function') {
        await editService(svcEditMatch[1]);
      } else {
        switchSection('section-services', false);
      }
      return;
    }

    // Route tạo/sửa Tin tức Y tế
    if (hash === '#/tin-tuc/tao-moi') {
      if (typeof openNewsModal === 'function') openNewsModal(null, false);
      return;
    }
    const newsEditMatch = hash.match(/^#\/tin-tuc\/sua\/(\d+)$/);
    if (newsEditMatch) {
      if (dataReady && typeof editNews === 'function') {
        editNews(newsEditMatch[1]);
      } else {
        switchSection('section-news', false);
      }
      return;
    }

    const mappedSection = ADMIN_HASH_TO_SECTION[hash] || 'section-appointments';
    switchSection(mappedSection, false);
    if (!ADMIN_HASH_TO_SECTION[hash]) {
      history.replaceState(null, '', ADMIN_SECTION_TO_HASH[mappedSection]);
    }
  } finally {
    isApplyingHashRoute = false;
  }
}

window.addEventListener('hashchange', () => {
  if (currentUser) {
    applyAdminRouteFromHash(true);
  }
});

function showAdminDashboard() {
  document.getElementById('loginScreen').style.display = 'none';
  document.getElementById('adminLayout').style.display = 'flex';
  applyAdminRouteFromHash(false);
  Promise.resolve(loadAllData()).then(() => {
    const h = (window.location.hash || '').trim();
    if (/^#\/(dich-vu|tin-tuc)\/(sua\/\d+|tao-moi)$/.test(h)) {
      applyAdminRouteFromHash(true);
    }
  });
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

function switchSection(targetId, updateHash = true) {
  if (!targetId) return;
  const sec = document.getElementById(targetId);
  if (!sec) return;

  if (updateHash && ADMIN_SECTION_TO_HASH[targetId]) {
    setAdminHash(ADMIN_SECTION_TO_HASH[targetId]);
  }

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
    const res = await authFetch(`${API_BASE}/auth/change-password`, {
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

