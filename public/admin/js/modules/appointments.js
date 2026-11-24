// MODULE: APPOINTMENTS CALENDAR, FILTERS & ACTIONS

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
    const res = await authFetch(`${API_BASE}/appointments/${id}/status`, {
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
    const res = await authFetch(`${API_BASE}/appointments/${id}`, { method: 'DELETE' });
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

