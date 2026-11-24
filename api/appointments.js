// ============================================================
// API: APPOINTMENTS (Đặt lịch khám)
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { publicFormLimiter } = require('../middleware/rateLimiter');

const ALLOWED_STATUSES = new Set(['pending', 'confirmed', 'completed', 'cancelled']);

// Tự động kiểm tra và thêm các cột mới nếu bảng cũ chưa có
(async () => {
  try { await db.run("ALTER TABLE appointments ADD COLUMN email TEXT"); } catch (_) {}
  try { await db.run("ALTER TABLE appointments ADD COLUMN appointment_type TEXT"); } catch (_) {}
  try { await db.run("ALTER TABLE appointments ADD COLUMN has_insurance TEXT"); } catch (_) {}
  try { await db.run("ALTER TABLE appointments ADD COLUMN created_at TEXT"); } catch (_) {}
})();

function normalizeDateStr(d) {
  if (!d) return '';
  d = String(d).trim();
  if (d.includes('T')) d = d.split('T')[0];
  if (d.includes('/')) {
    const parts = d.split('/');
    if (parts.length === 3) {
      return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
    }
  }
  const parts = d.split('-');
  if (parts.length === 3) {
    return `${parts[0]}-${parts[1].padStart(2, '0')}-${parts[2].padStart(2, '0')}`;
  }
  return d;
}

function normalizeDoctorName(name) {
  if (!name) return '';
  return name
    .replace(/^(BS\.|Bác sĩ|ThS\.|TS\.|CKI|CKII|\s)+/i, '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeTimeSlot(t) {
  if (!t) return '';
  return String(t).replace(/\s+/g, '').toLowerCase().trim();
}

function isAppointmentCancelled(st) {
  if (!st) return false;
  const s = String(st).toLowerCase().trim();
  return ['cancelled', 'canceled', 'hủy', 'huy', 'hủy lịch', 'huy lich', 'đã hủy', 'da huy', 'rejected'].includes(s);
}

function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const dNorm = normalizeDateStr(dateStr);
  const parts = dNorm.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

function isDoctorBusy(appointments, doctor, date, time) {
  if (!doctor || !date || !time) return false;
  const docNorm = normalizeDoctorName(doctor);
  const dateNorm = normalizeDateStr(date);
  const timeNorm = normalizeTimeSlot(time);

  return (appointments || []).some(a => {
    if (!a || isAppointmentCancelled(a.status)) return false;
    const aDoc = a.doctor || '';
    const aDocNorm = normalizeDoctorName(aDoc);
    const aDateNorm = normalizeDateStr(a.appointment_date);
    const aTimeNorm = normalizeTimeSlot(a.appointment_time);

    return (aDocNorm === docNorm || aDoc === doctor) &&
      aDateNorm === dateNorm &&
      aTimeNorm === timeNorm;
  });
}

// GET /api/appointments/check-busy?doctor=...&date=...&time=... (Công khai cho form đặt lịch)
router.get('/check-busy', async (req, res) => {
  try {
    const { doctor, date, time } = req.query;
    if (!doctor || !date || !time || doctor === 'Theo sắp xếp của phòng khám' || String(doctor).toLowerCase().includes('tuỳ chọn')) {
      return res.json({ busy: false });
    }

    const list = await db.all("SELECT doctor, appointment_date, appointment_time, status FROM appointments");
    const busy = isDoctorBusy(list, doctor, date, time);
    res.json({ busy });
  } catch (err) {
    console.error('Lỗi check-busy:', err.message);
    res.status(500).json({ error: 'Không thể kiểm tra lịch bác sĩ' });
  }
});

// GET /api/appointments (Admin - bảo vệ dữ liệu bệnh nhân)
router.get('/', requireAuth, async (req, res) => {
  try {
    let list = await db.all("SELECT * FROM appointments ORDER BY id DESC");
    list = (list || []).map(a => ({
      ...a,
      created_at: a.created_at || new Date().toISOString()
    }));
    res.json(list);
  } catch (err) {
    console.error('Lỗi GET /api/appointments:', err.message);
    res.status(500).json({ error: 'Không thể tải danh sách lịch hẹn' });
  }
});

// POST /api/appointments (Công khai - giới hạn tần suất chống spam)
router.post('/', publicFormLimiter, async (req, res) => {
  try {
    const {
      patient_name,
      name,
      phone,
      email,
      appointment_type,
      has_insurance,
      specialty,
      doctor,
      appointment_date,
      appointment_time,
      notes
    } = req.body || {};
    const patient = String(patient_name || name || 'Khách hàng').trim();

    if (!phone || !String(phone).trim()) {
      return res.status(400).json({ error: 'Số điện thoại là bắt buộc' });
    }

    if (!doctor || !String(doctor).trim()) {
      return res.status(400).json({ error: 'Vui lòng chọn bác sĩ khám' });
    }

    if (!appointment_date || !String(appointment_date).trim()) {
      return res.status(400).json({ error: 'Vui lòng chọn ngày khám' });
    }

    const chosenDoctor = String(doctor).trim();
    const chosenDate = String(appointment_date).trim();
    const chosenTime = appointment_time ? String(appointment_time).trim() : '08:00 - 09:00';
    const createdAtIso = new Date().toISOString();

    if (chosenDoctor && chosenDoctor !== 'Theo sắp xếp của phòng khám' && !chosenDoctor.toLowerCase().includes('tuỳ chọn')) {
      const list = await db.all("SELECT doctor, appointment_date, appointment_time, status FROM appointments");
      if (isDoctorBusy(list, chosenDoctor, chosenDate, chosenTime)) {
        return res.status(400).json({
          success: false,
          error: 'doctor_busy',
          message: `Bác sĩ ${chosenDoctor} đã có lịch hẹn vào khung giờ ${chosenTime} ngày ${formatDisplayDate(chosenDate)}. Vui lòng chọn bác sĩ khác hoặc đổi khung giờ khác!`
        });
      }
    }

    const appData = {
      patient_name: patient,
      phone: String(phone).trim(),
      email: email ? String(email).trim() : '',
      appointment_type: appointment_type || 'Khám mới',
      has_insurance: has_insurance || 'Không có BHYT',
      specialty: specialty || 'Nội tổng quát',
      doctor: chosenDoctor || 'Theo sắp xếp của phòng khám',
      appointment_date: chosenDate,
      appointment_time: chosenTime,
      notes: notes ? String(notes).trim() : '',
      status: 'pending',
      created_at: createdAtIso
    };

    const result = await db.run(
      "INSERT INTO appointments (patient_name, phone, email, appointment_type, has_insurance, specialty, doctor, appointment_date, appointment_time, notes, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        appData.patient_name,
        appData.phone,
        appData.email,
        appData.appointment_type,
        appData.has_insurance,
        appData.specialty,
        appData.doctor,
        appData.appointment_date,
        appData.appointment_time,
        appData.notes,
        appData.status,
        appData.created_at
      ]
    );
    appData.id = result.lastID;

    res.status(201).json({ success: true, message: 'Đặt lịch khám thành công', appointment: appData });
  } catch (err) {
    console.error('Lỗi POST /api/appointments:', err.message);
    res.status(500).json({ error: 'Không thể đặt lịch khám' });
  }
});

// PUT /api/appointments/:id/confirm (Admin)
router.put('/:id/confirm', requireAuth, async (req, res) => {
  try {
    await db.run("UPDATE appointments SET status = 'confirmed' WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: 'Xác nhận lịch hẹn thành công' });
  } catch (err) {
    console.error('Lỗi confirm appointment:', err.message);
    res.status(500).json({ error: 'Không thể xác nhận lịch hẹn' });
  }
});

// PUT /api/appointments/:id/cancel (Admin)
router.put('/:id/cancel', requireAuth, async (req, res) => {
  try {
    await db.run("UPDATE appointments SET status = 'cancelled' WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: 'Hủy lịch hẹn thành công' });
  } catch (err) {
    console.error('Lỗi cancel appointment:', err.message);
    res.status(500).json({ error: 'Không thể hủy lịch hẹn' });
  }
});

// PUT /api/appointments/:id/status (Admin)
router.put('/:id/status', requireAuth, async (req, res) => {
  try {
    const { status } = req.body || {};
    if (!status || !ALLOWED_STATUSES.has(status)) {
      return res.status(400).json({ error: 'Trạng thái lịch hẹn không hợp lệ' });
    }
    await db.run("UPDATE appointments SET status = ? WHERE id = ?", [status, req.params.id]);
    res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
  } catch (err) {
    console.error('Lỗi update appointment status:', err.message);
    res.status(500).json({ error: 'Không thể cập nhật trạng thái lịch hẹn' });
  }
});

// DELETE /api/appointments/:id (Admin)
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    await db.run("DELETE FROM appointments WHERE id = ?", [req.params.id]);
    res.json({ success: true, message: 'Đã xóa lịch hẹn thành công' });
  } catch (err) {
    console.error('Lỗi DELETE /api/appointments/:id:', err.message);
    res.status(500).json({ error: 'Không thể xóa lịch hẹn' });
  }
});

module.exports = router;
