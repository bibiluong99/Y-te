/* ============================================================
   ADMIN ENTRY POINT - Phòng Khám Đa Khoa An Phúc
   Các module chức năng được tách tại ./core/ và ./modules/
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  checkAuth();
  setupEventListeners();
});


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
    const res = await authFetch(`${API_BASE}/services?t=${Date.now()}`);
    servicesData = await res.json();
  } catch (e) {
    servicesData = [];
  }
  renderServicesTable(servicesData);
  renderDashboardServices(servicesData.slice(0, 5));
}

async function loadDepartments() {
  try {
    const res = await authFetch(`${API_BASE}/departments?t=${Date.now()}`);
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
    const res = await authFetch(`${API_BASE}/products`);
    productsData = await res.json();
  } catch (e) {
    productsData = [];
  }
  renderProductsTable(productsData);
}

async function loadNews() {
  try {
    const res = await authFetch(`${API_BASE}/news`);
    newsData = await res.json();
  } catch (e) {
    newsData = [];
  }
  renderNewsTable(newsData);
}

async function loadAppointments() {
  try {
    const res = await authFetch(`${API_BASE}/appointments`);
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
    const res = await authFetch(`${API_BASE}/contacts`);
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

