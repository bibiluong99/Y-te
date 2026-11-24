// MODULE: CONTACTS & REALTIME NOTIFICATIONS

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
          <div class="cell-time-date">${escapeHtml(formatNotifDate(c.created_at || '18/11/2026'))}</div>
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
          <div class="cell-time-date">${escapeHtml(formatNotifDate(c.created_at || '18/11/2026'))}</div>
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
    await authFetch(`${API_BASE}/contacts/${id}`, {
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
    await authFetch(`${API_BASE}/contacts/${id}`, { method: 'DELETE' });
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
      authFetch(`${API_BASE}/appointments`).then(r => r.json()).catch(() => []),
      authFetch(`${API_BASE}/contacts`).then(r => r.json()).catch(() => [])
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

