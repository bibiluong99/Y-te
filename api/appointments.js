// ============================================================
// API: APPOINTMENTS (Đặt lịch khám)
// ============================================================

const express = require('express');
const router = express.Router();
const db = require('../db');

// Tự động kiểm tra và thêm các cột mới vào SQLite nếu chưa có
(async () => {
  try { await db.run("ALTER TABLE appointments ADD COLUMN email TEXT"); } catch (_) {}
  try { await db.run("ALTER TABLE appointments ADD COLUMN appointment_type TEXT"); } catch (_) {}
  try { await db.run("ALTER TABLE appointments ADD COLUMN has_insurance TEXT"); } catch (_) {}
  try { await db.run("ALTER TABLE appointments ADD COLUMN created_at TEXT"); } catch (_) {}
})();

// Chuẩn hóa định dạng ngày sang YYYY-MM-DD
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

// Chuẩn hóa tên bác sĩ để so sánh không phân biệt học vị, viết hoa thường, dấu tiếng Việt
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

// Chuẩn hóa khung giờ để so sánh (bỏ khoảng trắng)
function normalizeTimeSlot(t) {
  if (!t) return '';
  return String(t).replace(/\s+/g, '').toLowerCase().trim();
}

// Kiểm tra lịch hẹn có bị hủy hay không
function isAppointmentCancelled(st) {
  if (!st) return false;
  const s = String(st).toLowerCase().trim();
  return s === 'cancelled' || s === 'canceled' || s === 'hủy' || s === 'huy' || s === 'hủy lịch' || s === 'huy lich' || s === 'đã hủy' || s === 'da huy' || s === 'rejected';
}

// Định dạng ngày hiển thị dd/mm/yyyy
function formatDisplayDate(dateStr) {
  if (!dateStr) return '';
  const dNorm = normalizeDateStr(dateStr);
  const parts = dNorm.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
}

// Kiểm tra bác sĩ đã có lịch hẹn trong khung giờ và ngày đó chưa (tất cả các trạng thái trừ khi đã hủy)
function isDoctorBusy(appointments, doctor, date, time) {
  if (!doctor || !date || !time) return false;
  const docNorm = normalizeDoctorName(doctor);
  const dateNorm = normalizeDateStr(date);
  const timeNorm = normalizeTimeSlot(time);

  return (appointments || []).some(a => {
    if (!a) return false;

    // Bỏ qua nếu lịch hẹn đã bị hủy
    if (isAppointmentCancelled(a.status)) return false;

    const aDoc = a.doctor || '';
    const aDocNorm = normalizeDoctorName(aDoc);
    const aDateNorm = normalizeDateStr(a.appointment_date);
    const aTimeNorm = normalizeTimeSlot(a.appointment_time);

    return (aDocNorm === docNorm || aDoc === doctor) &&
      aDateNorm === dateNorm &&
      aTimeNorm === timeNorm;
  });
}

// GET /api/appointments/check-busy?doctor=...&date=...&time=...
router.get('/check-busy', async (req, res) => {
  try {
    const { doctor, date, time } = req.query;
    if (!doctor || !date || !time || doctor === 'Theo sắp xếp của phòng khám' || doctor.toLowerCase().includes('tuỳ chọn')) {
      return res.json({ busy: false });
    }

    let list = [];
    try {
      list = await db.all("SELECT * FROM appointments");
    } catch (e) {
      const store = db.getStore();
      list = (store && store.appointments) || [];
    }

    const busy = isDoctorBusy(list, doctor, date, time);
    res.json({ busy });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/appointments
router.get('/', async (req, res) => {
  try {
    let list = [];
    try {
      list = await db.all("SELECT * FROM appointments ORDER BY id DESC");
    } catch (e) {
      const store = db.getStore();
      list = store.appointments || [];
    }
    // Đảm bảo định dạng created_at cho lịch hẹn
    list = (list || []).map(a => {
      let createdAt = a.created_at;
      if (!createdAt) {
        createdAt = new Date().toISOString();
      }
      return { ...a, created_at: createdAt };
    });
    res.json(list);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/appointments
router.post('/', async (req, res) => {
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
    } = req.body;
    const patient = patient_name || name || 'Khách hàng';

    if (!phone) {
      return res.status(400).json({ error: 'Số điện thoại là bắt buộc' });
    }

    if (!doctor || !String(doctor).trim()) {
      return res.status(400).json({ error: 'Vui lòng chọn bác sĩ khám' });
    }

    if (!appointment_date || !String(appointment_date).trim()) {
      return res.status(400).json({ error: 'Vui lòng chọn ngày khám' });
    }

    const chosenDoctor = (doctor || '').trim();
    const chosenDate = appointment_date.trim();
    const chosenTime = appointment_time || '08:00 - 09:00';
    const createdAtIso = new Date().toISOString();

    // Rule: Kiểm tra nếu bác sĩ tại khung giờ và ngày đó đã có lịch hẹn (chưa bị hủy)
    if (chosenDoctor && chosenDoctor !== 'Theo sắp xếp của phòng khám' && !chosenDoctor.toLowerCase().includes('tuỳ chọn')) {
      let list = [];
      try {
        list = await db.all("SELECT * FROM appointments");
      } catch (e) {
        const store = db.getStore();
        list = (store && store.appointments) || [];
      }

      if (isDoctorBusy(list, chosenDoctor, chosenDate, chosenTime)) {
        return res.status(400).json({
          success: false,
          error: 'doctor_busy',
          message: `Bác sĩ ${chosenDoctor} đã có lịch hẹn vào khung giờ ${chosenTime} ngày ${formatDisplayDate(chosenDate)}. Vui lòng chọn bác sĩ khác hoặc đổi khung giờ khác!`
        });
      }
    }

    const app = {
      patient_name: patient,
      phone,
      email: email || '',
      appointment_type: appointment_type || 'Khám mới',
      has_insurance: has_insurance || 'Không có BHYT',
      specialty: specialty || 'Nội tổng quát',
      doctor: chosenDoctor || 'Theo sắp xếp của phòng khám',
      appointment_date: chosenDate,
      appointment_time: chosenTime,
      notes: notes || '',
      status: 'pending',
      created_at: createdAtIso
    };

    try {
      const result = await db.run(
        "INSERT INTO appointments (patient_name, phone, email, appointment_type, has_insurance, specialty, doctor, appointment_date, appointment_time, notes, status, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        [
          app.patient_name,
          app.phone,
          app.email,
          app.appointment_type,
          app.has_insurance,
          app.specialty,
          app.doctor,
          app.appointment_date,
          app.appointment_time,
          app.notes,
          app.status,
          app.created_at
        ]
      );
      app.id = result.lastID;
    } catch (err) {
      // Fallback nếu schema bảng chưa có cột created_at
      try {
        const result = await db.run(
          "INSERT INTO appointments (patient_name, phone, email, appointment_type, has_insurance, specialty, doctor, appointment_date, appointment_time, notes, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
          [
            app.patient_name,
            app.phone,
            app.email,
            app.appointment_type,
            app.has_insurance,
            app.specialty,
            app.doctor,
            app.appointment_date,
            app.appointment_time,
            app.notes,
            app.status
          ]
        );
        app.id = result.lastID;
      } catch (e2) {
        const store = db.getStore();
        app.id = Date.now();
        store.appointments = store.appointments || [];
        store.appointments.unshift(app);
        db.saveStore();
      }
    }

    res.status(201).json({ success: true, message: 'Đặt lịch khám thành công', appointment: app });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/appointments/:id/confirm
router.put('/:id/confirm', async (req, res) => {
  try {
    const id = req.params.id;
    try {
      await db.run("UPDATE appointments SET status = 'confirmed' WHERE id = ?", [id]);
    } catch (err) {
      const store = db.getStore();
      const a = (store.appointments || []).find(item => item.id == id);
      if (a) {
        a.status = 'confirmed';
        db.saveStore();
      }
    }
    res.json({ success: true, message: 'Xác nhận lịch hẹn thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/appointments/:id/cancel
router.put('/:id/cancel', async (req, res) => {
  try {
    const id = req.params.id;
    try {
      await db.run("UPDATE appointments SET status = 'cancelled' WHERE id = ?", [id]);
    } catch (err) {
      const store = db.getStore();
      const a = (store.appointments || []).find(item => item.id == id);
      if (a) {
        a.status = 'cancelled';
        db.saveStore();
      }
    }
    res.json({ success: true, message: 'Hủy lịch hẹn thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/appointments/:id/status
router.put('/:id/status', async (req, res) => {
  try {
    const id = req.params.id;
    const { status } = req.body;
    try {
      await db.run("UPDATE appointments SET status = ? WHERE id = ?", [status, id]);
    } catch (err) {
      const store = db.getStore();
      const a = (store.appointments || []).find(item => item.id == id);
      if (a) {
        a.status = status;
        db.saveStore();
      }
    }
    res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/appointments/:id
router.delete('/:id', async (req, res) => {
  try {
    const id = req.params.id;
    try {
      await db.run("DELETE FROM appointments WHERE id = ?", [id]);
    } catch (err) {
      const store = db.getStore();
      store.appointments = (store.appointments || []).filter(a => a.id != id);
      db.saveStore();
    }
    res.json({ success: true, message: 'Đã xóa lịch hẹn thành công' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
