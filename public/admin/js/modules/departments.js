// MODULE: DEPARTMENTS MANAGEMENT

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
          <img src="${escapeHtml(d.image)}" style="width: 100%; height: 100%; object-fit: cover; display: block;" onerror="this.onerror=null; this.src='images/departments/noi-tong-quat.jpg';">
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
    const res = await authFetch(url, {
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
    await authFetch(`${API_BASE}/departments/${id}`, { method: 'DELETE' });
    showToast('Đã xóa chuyên khoa thành công!', 'warning');
    await loadDepartments();
  } catch (err) {
    showToast('Lỗi khi xóa chuyên khoa', 'error');
  }
}

async function handleDepartmentImageUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  try {
    showToast('Đang tối ưu dung lượng và xử lý ảnh chuyên khoa...', 'info');
    const base64Data = await compressImageClient(file, 1200, 800, 0.88);
    document.getElementById('dImage').value = base64Data;
    const prevBox = document.getElementById('dImagePreviewBox');
    if (prevBox) {
      document.getElementById('dImagePreview').src = base64Data;
      prevBox.style.display = 'block';
    }

    const res = await authFetch(`${API_BASE}/departments/upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName: file.name,
        fileData: base64Data
      })
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success && data.imageUrl) {
      document.getElementById('dImage').value = data.imageUrl;
      if (prevBox) document.getElementById('dImagePreview').src = data.imageUrl;
      showToast('Tải ảnh chuyên khoa thành công!', 'success');
    } else {
      showToast('Đã áp dụng ảnh chuyên khoa', 'success');
    }
  } catch (err) {
    showToast('Lỗi tải ảnh: ' + err.message, 'error');
  }
}

