/* ============================================================
   CORE API, AUTH FETCH & SHARED HELPERS
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


/**
 * Wrapper quanh fetch() tự động gắn JWT Bearer token và xử lý 401.
 */
async function authFetch(url, options = {}) {
  const token = localStorage.getItem('anphuc_admin_token');
  const headers = new Headers(options.headers || {});
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const response = await fetch(url, { ...options, headers });
  if (response.status === 401 && !String(url).includes('/auth/login')) {
    localStorage.removeItem('anphuc_admin_token');
    localStorage.removeItem('anphuc_admin_user');
    currentUser = null;
    if (typeof showLoginScreen === 'function') {
      showLoginScreen();
    }
    if (typeof showToast === 'function') {
      showToast('Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại!', 'warning');
    }
  }
  return response;
}

// ============================================================
// CLIENT-SIDE IMAGE COMPRESSION (Tối ưu độ sắc nét chuẩn Full HD / Retina, an toàn dưới giới hạn Vercel)
// ============================================================
function compressImageClient(file, maxWidth = 1920, maxHeight = 1080, quality = 0.88) {
  return new Promise((resolve) => {
    if (!file || !file.type || file.type === 'image/svg+xml') {
      const r = new FileReader();
      r.onload = e => resolve(e.target.result);
      r.onerror = () => resolve('');
      r.readAsDataURL(file);
      return;
    }

    const r = new FileReader();
    r.onload = e => {
      compressBase64String(e.target.result, maxWidth, maxHeight, quality).then(resolve);
    };
    r.onerror = () => resolve('');
    r.readAsDataURL(file);
  });
}

function compressBase64String(base64Str, maxWidth = 1920, maxHeight = 1080, quality = 0.88) {
  return new Promise((resolve) => {
    if (!base64Str || typeof base64Str !== 'string' || !base64Str.startsWith('data:image/')) {
      return resolve(base64Str);
    }
    const img = new Image();
    img.onload = () => {
      let width = img.width;
      let height = img.height;
      if (width > maxWidth || height > maxHeight) {
        const ratio = Math.min(maxWidth / width, maxHeight / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, width, height);
      // Nén sang JPEG chất lượng cao sắc nét Full HD, dung lượng gọn (< 350KB)
      const outData = canvas.toDataURL('image/jpeg', quality);
      resolve(outData);
    };
    img.onerror = () => resolve(base64Str);
    img.src = base64Str;
  });
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
  toast.innerHTML = `<i class="fas ${icon}"></i> <span>${escapeHtml(message)}</span>`;
  container.appendChild(toast);

  setTimeout(() => {
    toast.style.animation = 'toastTopFadeOut 0.35s ease forwards';
    setTimeout(() => toast.remove(), 350);
  }, 2600);
}

