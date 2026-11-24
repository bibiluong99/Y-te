// MODULE: DOCTORS MANAGEMENT

// ============================================================
// DOCTOR MANAGEMENT (SQL SERVER REALTIME SYNC)
// ============================================================
async function loadDoctors() {
  try {
    const res = await authFetch(`${API_BASE}/doctors?t=${Date.now()}`);
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
      const res = await authFetch(`${API_BASE}/departments?t=${Date.now()}`);
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
  updateDocProfileHeaderPreview();
  modal.classList.add('show');
}

function updateDocProfileHeaderPreview() {
  const name = document.getElementById('docName')?.value.trim() || 'Họ và Tên Bác sĩ';
  const degree = document.getElementById('docDegree')?.value.trim() || 'Bác sĩ chuyên khoa';
  const dept = document.getElementById('docDepartment')?.value || 'Khám nội tổng quát';
  const exp = document.getElementById('docExperience')?.value.trim() || 'Chưa cập nhật kinh nghiệm';
  const isShown = document.getElementById('docShowOnPage')?.checked !== false;

  const nameEl = document.getElementById('docProfileNamePreview');
  const degEl = document.getElementById('docProfileDegreePreview');
  const deptEl = document.getElementById('docProfileDeptPreview');
  const expEl = document.getElementById('docProfileExpPreview');
  const pillEl = document.getElementById('docProfileStatusPill');

  if (nameEl) nameEl.textContent = name;
  if (degEl) degEl.textContent = degree;
  if (deptEl) deptEl.textContent = dept;
  if (expEl) expEl.textContent = exp;
  if (pillEl) {
    pillEl.textContent = isShown ? 'Đang hiển thị' : 'Đang ẩn';
    pillEl.className = `doc-status-pill ${isShown ? 'active' : 'inactive'}`;
  }
}
window.updateDocProfileHeaderPreview = updateDocProfileHeaderPreview;

function updateDocShowStatus(checked) {
  const statusSelect = document.getElementById('docStatus');
  if (statusSelect) {
    statusSelect.value = checked ? 'active' : 'inactive';
  }
  const textEl = document.getElementById('docShowStatusText');
  if (textEl) {
    if (checked) {
      textEl.textContent = 'Bật (Đang hiển thị)';
      textEl.style.color = '#104936';
    } else {
      textEl.textContent = 'Tắt (Ẩn khỏi trang Bác sĩ)';
      textEl.style.color = '#dc2626';
    }
  }
  updateDocProfileHeaderPreview();
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
  updateDocProfileHeaderPreview();
}

async function toggleDoctorDisplay(id) {
  const doc = doctorsData.find(x => x.id == id);
  if (!doc) return;
  const newStatus = (doc.status === 'active') ? 'inactive' : 'active';
  try {
    const res = await authFetch(`${API_BASE}/doctors/${id}`, {
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

async function handleDoctorAvatarUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  try {
    showToast('Đang tối ưu dung lượng và xử lý ảnh bác sĩ...', 'info');
    const base64Data = await compressImageClient(file, 800, 800, 0.90);
    const avInput = document.getElementById('docAvatar');
    if (avInput) avInput.value = base64Data;
    updateDocAvatarPreview();

    const res = await authFetch(`${API_BASE}/doctors/upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileData: base64Data
      })
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success && data.imageUrl) {
      if (avInput) avInput.value = data.imageUrl;
      updateDocAvatarPreview();
      showToast('Tải ảnh bác sĩ thành công!', 'success');
    } else {
      showToast('Đã chọn ảnh đại diện cho bác sĩ', 'success');
    }
  } catch (err) {
    showToast('Lỗi xử lý ảnh bác sĩ: ' + err.message, 'error');
  }
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
    const res = await authFetch(url, {
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
    const res = await authFetch(`${API_BASE}/doctors/${id}`, { method: 'DELETE' });
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

