// MODULE: BANNERS, LOGOS & WORKING SCHEDULE SETTINGS

// 9. CẤU HÌNH BANNER WEBSITE (LƯU VÀO SQL Server)
async function loadBanners() {
  try {
    const res = await authFetch(`${API_BASE}/banners?t=${Date.now()}`, { cache: 'no-store' });
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

function titleHtmlToEditorText(rawHtml) {
  if (!rawHtml) return '';
  const withMarkers = String(rawHtml)
    .replace(/<span[^>]*class=["'][^"']*highlight[^"']*["'][^>]*>([\s\S]*?)<\/span>/gi, '**$1**')
    .replace(/<br\s*\/?>/gi, '\n');
  const tmp = document.createElement('div');
  tmp.innerHTML = withMarkers;
  return (tmp.textContent || tmp.innerText || '').trim();
}

function titleEditorTextToHtml(editorText) {
  if (!editorText) return '';
  return escapeHtml(String(editorText).trim())
    .replace(/\*\*([^*\r\n]+)\*\*/g, '<span class="highlight">$1</span>')
    .replace(/\r?\n/g, '<br>');
}

function toggleBannerTitleHighlight() {
  const textarea = document.getElementById('bTitle');
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const val = textarea.value;
  const selected = val.slice(start, end);

  if (!selected) {
    const placeholder = 'Chữ nổi bật';
    const inserted = `**${placeholder}**`;
    textarea.value = val.slice(0, start) + inserted + val.slice(end);
    textarea.focus();
    textarea.setSelectionRange(start + 2, start + 2 + placeholder.length);
  } else if (selected.startsWith('**') && selected.endsWith('**') && selected.length > 4) {
    const unwrapped = selected.slice(2, -2);
    textarea.value = val.slice(0, start) + unwrapped + val.slice(end);
    textarea.focus();
    textarea.setSelectionRange(start, start + unwrapped.length);
  } else if (val.slice(Math.max(0, start - 2), start) === '**' && val.slice(end, end + 2) === '**') {
    textarea.value = val.slice(0, start - 2) + selected + val.slice(end + 2);
    textarea.focus();
    textarea.setSelectionRange(start - 2, end - 2);
  } else {
    const wrapped = `**${selected}**`;
    textarea.value = val.slice(0, start) + wrapped + val.slice(end);
    textarea.focus();
    textarea.setSelectionRange(start, start + wrapped.length);
  }
  updateBannerLivePreview();
}
window.toggleBannerTitleHighlight = toggleBannerTitleHighlight;

function insertBannerTitleNewline() {
  const textarea = document.getElementById('bTitle');
  if (!textarea) return;
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const val = textarea.value;
  textarea.value = val.slice(0, start) + '\n' + val.slice(end);
  textarea.focus();
  textarea.setSelectionRange(start + 1, start + 1);
  updateBannerLivePreview();
}
window.insertBannerTitleNewline = insertBannerTitleNewline;

function subtitleHtmlToPlainText(rawHtml) {
  if (!rawHtml) return '';
  const withNewlines = String(rawHtml).replace(/<br\s*\/?>/gi, '\n');
  const tmp = document.createElement('div');
  tmp.innerHTML = withNewlines;
  return tmp.textContent || tmp.innerText || '';
}

function subtitlePlainTextToHtml(plainText) {
  if (!plainText) return '';
  return escapeHtml(String(plainText).trim()).replace(/\r?\n/g, '<br>');
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
  document.getElementById('bTitle').value = titleHtmlToEditorText(b.title || '');
  document.getElementById('bSubtitle').value = subtitleHtmlToPlainText(b.subtitle || '');
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

async function uploadBannerFile(file) {
  if (!file.type.startsWith('image/')) {
    showToast('Vui lòng chọn file hình ảnh (PNG, JPG, WEBP, SVG)!', 'warning');
    return;
  }

  const statusMsg = document.getElementById('uploadStatusMessage');
  if (statusMsg) {
    statusMsg.className = 'upload-status-box loading';
    statusMsg.style.display = 'flex';
    statusMsg.innerHTML = `<i class="fas fa-spinner fa-spin"></i> <span>Đang tối ưu dung lượng và xử lý ảnh: <strong>${escapeHtml(file.name)}</strong>...</span>`;
  }

  try {
    const base64Data = await compressImageClient(file, 1920, 1080, 0.88);

    authFetch(`${API_BASE}/banners/upload`, {
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
          return { success: true, imageUrl: base64Data };
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
            statusMsg.innerHTML = `<i class="fas fa-check-circle"></i> <span>✓ Đã tối ưu và tải ảnh banner thành công: <strong>${escapeHtml(file.name)}</strong>. Nhấn "Lưu cấu hình" để áp dụng!</span>`;
          }
          showToast(`Đã upload thành công ảnh banner: ${file.name}`, 'success');
        } else {
          throw new Error(data.error || 'Lỗi xử lý file từ máy chủ');
        }
      })
      .catch(err => {
        document.getElementById('bImageUrl').value = base64Data;
        updateBannerLivePreview();
        if (statusMsg) {
          statusMsg.className = 'upload-status-box success';
          statusMsg.innerHTML = `<i class="fas fa-check-circle"></i> <span>✓ Đã chọn ảnh banner thành công: <strong>${escapeHtml(file.name)}</strong>. Nhấn "Lưu cấu hình" để áp dụng!</span>`;
        }
        showToast('Đã chọn ảnh banner thành công', 'success');
      });
  } catch (err) {
    if (statusMsg) {
      statusMsg.className = 'upload-status-box error';
      statusMsg.innerHTML = `<i class="fas fa-exclamation-triangle"></i> <span>Lỗi xử lý file: ${escapeHtml(err.message)}</span>`;
    }
  }
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
  const titleText = document.getElementById('bTitle')?.value || '';
  const titleHtml = titleEditorTextToHtml(titleText) || 'Tiêu đề Banner';

  const subtitleText = document.getElementById('bSubtitle').value || '';
  const subtitleHtml = subtitlePlainTextToHtml(subtitleText) || 'Mô tả phụ banner hiển thị ở đây';

  const imageUrl = document.getElementById('bImageUrl').value || 'images/hero-banner-full-doctor.png';
  const btnText = document.getElementById('bBtnText').value || 'Nút bấm →';

  previewBox.style.backgroundImage = `url("${imageUrl}")`;
  document.getElementById('prevTagline').textContent = tagline;
  document.getElementById('prevTitle').innerHTML = titleHtml;
  document.getElementById('prevSubtitle').innerHTML = subtitleHtml;
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
    title: titleEditorTextToHtml(document.getElementById('bTitle')?.value || ''),
    subtitle: subtitlePlainTextToHtml(document.getElementById('bSubtitle').value),
    image_url: document.getElementById('bImageUrl').value,
    btn_text: document.getElementById('bBtnText').value,
    btn_link: document.getElementById('bBtnLink').value,
    page_name: document.getElementById('bPageName')?.value || ''
  };

  try {
    const res = await authFetch(`${API_BASE}/banners/${pageKey}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json().catch(() => ({}));
    if (res.ok && result.success) {
      showToast('Đã lưu thành công', 'success');
      bannersData[pageKey] = { ...bannersData[pageKey], ...payload };
      try {
        const cachedObj = { page_key: pageKey, ...bannersData[pageKey], ...payload };
        sessionStorage.setItem('banner_' + pageKey, JSON.stringify(cachedObj));
        localStorage.setItem('banner_' + pageKey, JSON.stringify(cachedObj));
      } catch (_) {}
      selectBannerPage(pageKey);
    } else {
      showToast(result.error || result.message || 'Lỗi lưu banner', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối khi lưu banner: ' + err.message, 'error');
  }
}


// 11. CẤU HÌNH LOGO WEBSITE (HEADER & FOOTER LƯU VÀO SQL Server)
async function loadSettings() {
  try {
    const res = await authFetch(`${API_BASE}/settings?t=${Date.now()}`);
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
    const res = await authFetch(`${API_BASE}/settings`, {
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

async function uploadLogoFile(file, type) {
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

  try {
    const base64Data = await compressImageClient(file, 800, 400, 0.95);

    const res = await authFetch(`${API_BASE}/settings/upload-logo`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: type,
        fileName: file.name,
        fileData: base64Data
      })
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success && data.imageUrl) {
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
      showToast(`Đã lưu Logo ${type === 'footer' ? 'Footer' : 'Header'} thành công!`, 'success');
    } else {
      throw new Error(data.error || 'Lỗi xử lý file');
    }
  } catch (err) {
    if (statusEl) {
      statusEl.style.background = '#fee2e2';
      statusEl.style.color = '#b91c1c';
      statusEl.innerHTML = `<i class="fas fa-exclamation-triangle"></i> Lỗi: ${escapeHtml(err.message)}`;
    }
    showToast('Lỗi khi tải logo lên máy chủ: ' + err.message, 'error');
  }
}


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
    const res = await authFetch(`${API_BASE}/settings?t=${Date.now()}`);
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
    let res = await authFetch(`${API_BASE}/settings/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // Nếu endpoint /schedule chưa nạp hoặc 404, tự động fallback sang PUT /api/settings
    if (!res.ok) {
      res = await authFetch(`${API_BASE}/settings`, {
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
      const fb = await authFetch(`${API_BASE}/settings`, {
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
    let res = await authFetch(`${API_BASE}/settings/schedule`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      res = await authFetch(`${API_BASE}/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          working_hours_slots: JSON.stringify(scheduleSettings.working_hours_slots)
        })
      });
    }
  } catch (err) {
    try {
      await authFetch(`${API_BASE}/settings`, {
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


