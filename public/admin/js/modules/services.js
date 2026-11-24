// MODULE: SERVICES MANAGEMENT

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
      ? `<img src="${bannerImg}" alt="${escapeHtml(s.name)}" style="width: 36px; height: 36px; border-radius: 6px; object-fit: cover; display: block;" onerror="this.onerror=null; this.src='images/banners/services-hero.jpg';">`
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


let serviceIntroQuill = null;

function initServiceIntroQuill() {
  if (serviceIntroQuill) return serviceIntroQuill;
  const el = document.getElementById('serviceIntroQuill');
  if (!el || typeof Quill === 'undefined') return null;

  serviceIntroQuill = new Quill('#serviceIntroQuill', {
    theme: 'snow',
    placeholder: 'Nhập bài viết giới thiệu chi tiết về dịch vụ y tế...',
    modules: {
      toolbar: [
        [{ header: [2, 3, false] }],
        ['bold', 'italic', 'underline'],
        [{ color: [] }],
        [{ list: 'ordered' }, { list: 'bullet' }],
        ['blockquote', 'link', 'clean']
      ]
    }
  });
  return serviceIntroQuill;
}

function setServiceIntroContent(raw) {
  initServiceIntroQuill();
  const str = String(raw || '').trim();
  if (serviceIntroQuill) {
    serviceIntroQuill.setContents([]);
    if (str) {
      const hasHtml = /<[a-z][\s\S]*>/i.test(str);
      const html = hasHtml
        ? str
        : str.split(/\r?\n\s*\r?\n/).map(p => `<p>${escapeHtml(p).replace(/\r?\n/g, '<br>')}</p>`).join('');
      serviceIntroQuill.clipboard.dangerouslyPasteHTML(html);
    }
  } else {
    const ta = document.getElementById('sIntro');
    if (ta) ta.value = str;
  }
}

function getServiceIntroContent() {
  if (serviceIntroQuill) {
    const html = serviceIntroQuill.getSemanticHTML ? serviceIntroQuill.getSemanticHTML() : serviceIntroQuill.root.innerHTML;
    return html === '<p><br></p>' ? '' : html.trim();
  }
  return document.getElementById('sIntro')?.value.trim() || '';
}

function resolveServiceImg(img) {
  if (!img) return '/images/banners/services-hero.jpg';
  const s = String(img).trim();
  if (/^(https?:\/\/|data:image\/|\/)/i.test(s)) return s;
  return `/${s}`;
}

function updateServiceBannerThumb() {
  const thumb = document.getElementById('sBannerThumb');
  const input = document.getElementById('sBanner');
  if (thumb && input) {
    thumb.src = resolveServiceImg(input.value);
  }
}

function renderServiceChecklistBuilder(rawChecklist) {
  const container = document.getElementById('serviceChecklistBuilder');
  if (!container) return;
  container.innerHTML = '';

  const text = String(rawChecklist || '').trim();
  let items = [];
  if (text) {
    if (/<li[\s>]/i.test(text)) {
      const tmp = document.createElement('div');
      tmp.innerHTML = text;
      items = Array.from(tmp.querySelectorAll('li')).map(li => li.textContent.trim()).filter(Boolean);
    } else {
      items = text.split(/\r?\n/).map(l => l.replace(/<[^>]*>/g, '').trim()).filter(Boolean);
    }
  }

  if (items.length === 0) {
    addServiceChecklistRow('', false);
  } else {
    items.forEach(item => addServiceChecklistRow(item, false));
  }
}

function addServiceChecklistRow(value = '', focusNew = false) {
  const container = document.getElementById('serviceChecklistBuilder');
  if (!container) return;

  const row = document.createElement('div');
  row.className = 'svc-checklist-row';
  row.innerHTML = `
    <span class="svc-check-icon"><i class="fas fa-check-circle"></i></span>
    <input type="text" class="svc-check-input" placeholder="VD: Khám lâm sàng tổng quát, Siêu âm ổ bụng...">
    <button type="button" class="svc-check-remove" title="Xóa hạng mục"><i class="fas fa-times"></i></button>
  `;

  const input = row.querySelector('.svc-check-input');
  input.value = value || '';
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addServiceChecklistRow('', true);
    }
  });

  row.querySelector('.svc-check-remove').addEventListener('click', () => {
    if (container.children.length > 1) {
      row.remove();
    } else {
      input.value = '';
      input.focus();
    }
  });

  container.appendChild(row);
  if (focusNew) input.focus();
}

function getServiceChecklistLines() {
  const container = document.getElementById('serviceChecklistBuilder');
  if (!container) return [];
  return Array.from(container.querySelectorAll('.svc-check-input'))
    .map(inp => inp.value.trim())
    .filter(Boolean);
}

function switchServiceModalTab(tab) {
  const editPane = document.getElementById('serviceTabEditPane');
  const previewPane = document.getElementById('serviceTabPreviewPane');
  const btnEdit = document.getElementById('btnServiceTabEdit');
  const btnPrev = document.getElementById('btnServiceTabPreview');
  if (!editPane || !previewPane) return;

  if (tab === 'preview') {
    updateServiceLivePreview();
    editPane.style.display = 'none';
    previewPane.style.display = 'block';
    btnEdit?.classList.remove('active');
    btnPrev?.classList.add('active');
  } else {
    previewPane.style.display = 'none';
    editPane.style.display = 'grid';
    btnPrev?.classList.remove('active');
    btnEdit?.classList.add('active');
  }
}

function updateServiceLivePreview() {
  const name = document.getElementById('sName')?.value.trim() || 'Tên dịch vụ y tế';
  const category = document.getElementById('sCategory')?.value || 'Khám bệnh';
  const price = parseFloat(document.getElementById('sPrice')?.value) || 0;
  const duration = document.getElementById('sDuration')?.value.trim() || 'Theo chỉ định bác sĩ';
  const banner = resolveServiceImg(document.getElementById('sBanner')?.value);
  const desc = document.getElementById('sDescription')?.value.trim() || '';
  const introHtml = getServiceIntroContent() || '<p style="color:#94a3b8;">Chưa có nội dung giới thiệu dịch vụ...</p>';
  const checklist = getServiceChecklistLines();

  const hero = document.getElementById('svcPrevHero');
  if (hero) hero.style.backgroundImage = `url("${banner}")`;
  document.getElementById('svcPrevCategory').textContent = category;
  document.getElementById('svcPrevTitle').textContent = name;
  document.getElementById('svcPrevDesc').textContent = desc;
  document.getElementById('svcPrevPrice').innerHTML = `<i class="fas fa-tag"></i> ${price > 0 ? formatVND(price) : 'Liên hệ'}`;
  document.getElementById('svcPrevDuration').innerHTML = `<i class="far fa-clock"></i> ${escapeHtml(duration)}`;
  document.getElementById('svcPrevIntro').innerHTML = introHtml;

  const listEl = document.getElementById('svcPrevChecklist');
  if (listEl) {
    if (checklist.length === 0) {
      listEl.innerHTML = '<div style="color:#94a3b8; font-size:0.88rem;">Chưa có hạng mục kiểm tra nào.</div>';
    } else {
      listEl.innerHTML = checklist.map(item => `
        <div class="svc-prev-check-item">
          <i class="fas fa-check-circle"></i>
          <span>${escapeHtml(item)}</span>
        </div>
      `).join('');
    }
  }
}

function copyServicePublicUrl() {
  const code = document.getElementById('serviceUrlCode')?.textContent || '';
  if (!code) return;
  const fullUrl = `${window.location.origin}${code}`;
  navigator.clipboard?.writeText(fullUrl).then(() => {
    showToast('Đã sao chép đường dẫn trang dịch vụ!', 'success');
  }).catch(() => {
    showToast(fullUrl, 'info');
  });
}

function openServiceModal(s = null, updateHash = true) {
  document.getElementById('serviceForm').reset();
  document.getElementById('serviceId').value = '';
  switchServiceModalTab('edit');

  const bannerInput = document.getElementById('sBanner');
  const urlBar = document.getElementById('serviceUrlBar');
  const urlCode = document.getElementById('serviceUrlCode');
  const linkBtn = document.getElementById('servicePublicLinkBtn');

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
    setServiceIntroContent(s.intro || '');
    renderServiceChecklistBuilder(s.checklist || '');

    const publicPath = `/chi-tiet-dich-vu.html?id=${s.id}`;
    if (urlBar) urlBar.style.display = 'block';
    if (urlCode) urlCode.textContent = publicPath;
    if (linkBtn) {
      linkBtn.href = publicPath;
      linkBtn.style.display = 'inline-flex';
    }
    if (updateHash && typeof setAdminHash === 'function') {
      setAdminHash(`#/dich-vu/sua/${s.id}`);
    }
  } else {
    document.getElementById('serviceModalTitle').textContent = 'Tạo Dịch Vụ Y Tế Mới';
    document.getElementById('sDuration').value = '';
    if (bannerInput) bannerInput.value = '';
    setServiceIntroContent('');
    renderServiceChecklistBuilder('');

    if (urlBar) urlBar.style.display = 'none';
    if (linkBtn) linkBtn.style.display = 'none';
    if (updateHash && typeof setAdminHash === 'function') {
      setAdminHash('#/dich-vu/tao-moi');
    }
  }
  updateServiceBannerThumb();

  // Chuyển sang trang soạn thảo riêng (#section-service-editor)
  document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
  const editorSec = document.getElementById('section-service-editor');
  if (editorSec) editorSec.classList.add('active');

  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-target') === 'section-services');
  });

  const breadcrumb = document.getElementById('currentBreadcrumb');
  const pageTitle = document.getElementById('currentPageTitle');
  if (breadcrumb) breadcrumb.textContent = s ? 'Quản lý Dịch vụ Y tế > Chỉnh sửa dịch vụ' : 'Quản lý Dịch vụ Y tế > Tạo dịch vụ mới';
  if (pageTitle) pageTitle.textContent = s ? 'Chỉnh sửa Dịch vụ Y tế' : 'Tạo Dịch vụ Y tế mới';

  window.scrollTo({ top: 0, behavior: 'smooth' });
}

window.addServiceChecklistRow = addServiceChecklistRow;
window.switchServiceModalTab = switchServiceModalTab;
window.updateServiceBannerThumb = updateServiceBannerThumb;
window.copyServicePublicUrl = copyServicePublicUrl;

async function handleServiceBannerUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  try {
    showToast('Đang tối ưu dung lượng và xử lý ảnh...', 'info');
    const base64Data = await compressImageClient(file, 1920, 1080, 0.88);
    const bannerInput = document.getElementById('sBanner');
    if (bannerInput) bannerInput.value = base64Data;

    const res = await authFetch(`${API_BASE}/services/upload-banner`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileData: base64Data
      })
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success && data.imageUrl) {
      if (bannerInput) bannerInput.value = data.imageUrl;
      updateServiceBannerThumb();
      showToast('Tải ảnh banner thành công!', 'success');
    } else {
      updateServiceBannerThumb();
      showToast('Đã áp dụng ảnh banner cho dịch vụ', 'success');
    }
  } catch (err) {
    showToast('Lỗi xử lý ảnh: ' + err.message, 'error');
  }
}

function closeServiceModal() {
  if (typeof switchSection === 'function') {
    switchSection('section-services');
  } else {
    document.querySelectorAll('.page-section').forEach(sec => sec.classList.remove('active'));
    document.getElementById('section-services')?.classList.add('active');
  }
}

async function editService(id) {
  let s = servicesData.find(x => x.id == id);
  try {
    const res = await authFetch(`${API_BASE}/services/${id}?t=${Date.now()}`);
    if (res.ok) {
      const fresh = await res.json();
      if (fresh) s = fresh;
    }
  } catch (e) {}
  if (s) openServiceModal(s);
}

async function resetServicesDataDefault() {
  try {
    const res = await authFetch(`${API_BASE}/services/reset`, { method: 'POST' });
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
  let bannerVal = document.getElementById('sBanner') ? document.getElementById('sBanner').value.trim() : '';

  // Tự động nén ảnh nếu chuỗi Base64 vượt quá 400KB (chống lỗi 413 Payload Too Large)
  if (bannerVal.startsWith('data:image/') && bannerVal.length > 400000) {
    try {
      bannerVal = await compressBase64String(bannerVal, 1400, 900, 0.82);
      const bInput = document.getElementById('sBanner');
      if (bInput) bInput.value = bannerVal;
    } catch (_) {}
  }

  const data = {
    name: document.getElementById('sName').value.trim(),
    category: document.getElementById('sCategory').value,
    price: parseFloat(document.getElementById('sPrice').value) || 0,
    duration: document.getElementById('sDuration').value.trim(),
    banner: bannerVal,
    icon: bannerVal || 'fas fa-stethoscope',
    description: document.getElementById('sDescription').value.trim(),
    intro: getServiceIntroContent(),
    checklist: getServiceChecklistLines().join('\n'),
    status: 'active'
  };

  try {
    const url = id ? `${API_BASE}/services/${id}` : `${API_BASE}/services`;
    const method = id ? 'PUT' : 'POST';
    const res = await authFetch(url, {
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
    const res = await authFetch(`${API_BASE}/services/${id}`, { method: 'DELETE' });
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

