/* ============================================
   JS - Phòng Khám Đa Khoa An Phúc
   ============================================ */

document.addEventListener('DOMContentLoaded', function() {

  // Mobile menu toggle
  const mobileToggle = document.querySelector('.mobile-toggle');
  const nav = document.getElementById('mainNav') || document.querySelector('.nav');
  if (mobileToggle && nav) {
    // Xóa inline onclick (nếu còn) để chống toggle 2 lần gây đóng mở lập tức
    mobileToggle.removeAttribute('onclick');
    mobileToggle.onclick = null;

    mobileToggle.addEventListener('click', function(e) {
      e.preventDefault();
      e.stopPropagation();
      const isOpen = nav.classList.toggle('active');
      mobileToggle.classList.toggle('active', isOpen);
    });

    // Đóng mobile menu khi click ra bên ngoài
    document.addEventListener('click', function(e) {
      if (nav.classList.contains('active') && !nav.contains(e.target) && !mobileToggle.contains(e.target)) {
        nav.classList.remove('active');
        mobileToggle.classList.remove('active');
      }
    });

    // Đóng mobile menu khi nhấn vào liên kết
    nav.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function() {
        nav.classList.remove('active');
        mobileToggle.classList.remove('active');
      });
    });
  }

  // Scroll reveal animation
  const animateElements = document.querySelectorAll('[data-animate]');
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  animateElements.forEach(el => observer.observe(el));

  // Form submissions (prevent default, show alert)
  const forms = document.querySelectorAll('form');
  forms.forEach(form => {
    if (form.id === 'appointmentForm' || form.id === 'contactMessageForm' || form.id === 'homeQuickBookingForm' || form.hasAttribute('onsubmit')) return;
    form.addEventListener('submit', function(e) {
      e.preventDefault();
      const formType = this.dataset.form;
      let message = 'Cảm ơn bạn! Chúng tôi đã nhận được thông tin.';
      if (formType === 'booking') {
        message = 'Đặt lịch hẹn thành công! Chúng tôi sẽ liên hệ xác nhận với bạn trong thời gian sớm nhất.';
      } else if (formType === 'contact') {
        message = 'Gửi tin nhắn thành công! Chúng tôi sẽ phản hồi trong thời gian sớm nhất.';
      } else if (formType === 'newsletter') {
        message = 'Đăng ký nhận tin thành công!';
      }
      showNotification(message);
      this.reset();
    });
  });

  // Notification (Hiển thị ở phía trên giữa màn hình - thế chỗ cho thông báo alert)
  function showNotification(message, type = 'success') {
    const existing = document.querySelector('.notification-toast');
    if (existing) existing.remove();

    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    const isError = type === 'error';
    const iconClass = isError ? 'fa-exclamation-circle' : 'fa-check-circle';
    const primaryColor = isError ? '#dc2626' : '#104936';
    const borderColor = isError ? '#fee2e2' : '#dcfce7';

    toast.innerHTML = `
      <div style="display:flex;align-items:center;gap:12px;">
        <i class="fas ${iconClass}" style="color:${primaryColor};font-size:1.4rem;"></i>
        <span style="font-weight:600;font-size:1rem;color:#0f172a;line-height:1.4;">${message}</span>
      </div>
    `;
    toast.style.cssText = `
      position: fixed; top: 24px; left: 50%; transform: translateX(-50%); z-index: 999999;
      background: #ffffff; padding: 16px 28px; border-radius: 14px;
      box-shadow: 0 16px 36px rgba(0,0,0,0.16), 0 3px 10px rgba(0,0,0,0.06);
      border: 1px solid ${borderColor}; border-left: 6px solid ${primaryColor};
      max-width: 90vw; animation: notifTopDrop 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.transition = 'all 0.3s ease';
      toast.style.opacity = '0';
      toast.style.transform = 'translate(-50%, -20px)';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
  window.showNotification = showNotification;

  // Add animation keyframes
  const style = document.createElement('style');
  style.textContent = `
    @keyframes notifTopDrop {
      from { opacity: 0; transform: translate(-50%, -30px); }
      to { opacity: 1; transform: translate(-50%, 0); }
    }
    @keyframes notifCenterPop {
      from { opacity: 0; transform: translate(-50%, -50%) scale(0.85); }
      to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }
    @keyframes slideInRight {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOutRight {
      from { transform: translateX(0); opacity: 1; }
      to { transform: translateX(100%); opacity: 0; }
    }
  `;
  document.head.appendChild(style);

  // Testimonial carousel (simple auto-scroll)
  const testimonialGrid = document.querySelector('.testimonials-grid');
  if (testimonialGrid) {
    // Simple hover pause effect
    let isHovered = false;
    testimonialGrid.addEventListener('mouseenter', () => isHovered = true);
    testimonialGrid.addEventListener('mouseleave', () => isHovered = false);
  }

  // Active nav link highlighting
  const currentPage = window.location.pathname.split('/').pop() || 'index.html';
  const navLinks = document.querySelectorAll('.nav a');
  navLinks.forEach(link => {
    const href = link.getAttribute('href');
    if (href === currentPage || (currentPage === '' && href === 'index.html')) {
      link.classList.add('active');
    }
  });

  // Smooth scroll for anchor links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        e.preventDefault();
        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // Header scroll effect
  const header = document.querySelector('.header');
  if (header) {
    window.addEventListener('scroll', function() {
      if (window.scrollY > 50) {
        header.style.boxShadow = '0 2px 10px rgba(0,0,0,0.1)';
      } else {
        header.style.boxShadow = '0 1px 2px rgba(0,0,0,0.05)';
      }
    });
  }

  // Date picker - set min date to today
  const dateInputs = document.querySelectorAll('input[type="date"]');
  const today = new Date().toISOString().split('T')[0];
  dateInputs.forEach(input => {
    input.setAttribute('min', today);
  });

  // Dynamic Banner Loading from SQLite for All Pages
  function loadDynamicBanner() {
    const rawPath = window.location.pathname.toLowerCase();
    let pageKey = null;

    if (rawPath.includes('chuyen-khoa') || rawPath.includes('specialty')) {
      pageKey = 'specialty';
    } else if (rawPath.includes('doi-ngu-bac-si') || rawPath.includes('doctor')) {
      pageKey = 'doctors';
    } else if (rawPath.includes('dich-vu') || rawPath.includes('service')) {
      pageKey = 'services';
    } else if (rawPath.includes('tin-tuc') || rawPath.includes('news')) {
      pageKey = 'news';
    } else if (rawPath.includes('lien-he') || rawPath.includes('contact')) {
      pageKey = 'contact';
    } else if (rawPath.includes('dat-lich') || rawPath.includes('appointment')) {
      pageKey = 'appointment';
    } else if (rawPath === '/' || rawPath.endsWith('/') || rawPath.includes('index')) {
      pageKey = 'home';
    }

    if (!pageKey) return;

    fetch(`/api/banners/${pageKey}?t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(b => {
        if (!b || !b.image_url) return;
        let cleanImgUrl = b.image_url.trim();
        if (!cleanImgUrl.startsWith('http') && !cleanImgUrl.startsWith('/') && !cleanImgUrl.startsWith('data:')) {
          cleanImgUrl = `/${cleanImgUrl}`;
        }

        const heroSection = document.getElementById('pageHeroSection') || document.getElementById('homeHeroSection');
        if (heroSection) {
          heroSection.style.backgroundImage = `url("${cleanImgUrl}")`;
          heroSection.classList.add('full-banner-bg');
        }

        const tag = document.getElementById('pageHeroTag') || document.getElementById('homeHeroTag');
        if (tag && b.tagline) {
          let cleanTag = b.tagline.replace(/^Trang\s*chủ\s*>\s*/i, '').trim();
          cleanTag = cleanTag.replace(/^(?:Dịch\s*vụ\s*>\s*)+/i, '').trim();
          tag.textContent = cleanTag || b.tagline;
        }

        const title = document.getElementById('pageHeroTitle') || document.getElementById('homeHeroTitle');
        if (title && b.title) title.innerHTML = b.title;

        const desc = document.getElementById('pageHeroDesc') || document.getElementById('homeHeroDesc');
        if (desc && b.subtitle) desc.innerHTML = b.subtitle;

        const btn = document.getElementById('pageHeroBtn') || document.getElementById('homeHeroBtn');
        if (btn && b.btn_text) {
          btn.innerHTML = `${b.btn_text}`;
          if (b.btn_link) btn.setAttribute('href', b.btn_link);
        }
      })
      .catch(err => {
        console.warn('Không thể tải banner từ SQLite:', err);
      });
  }

  // Dynamic Logo & Company Settings Sync from SQLite Settings
  function loadDynamicLogo() {
    fetch(`/api/settings?t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(s => {
        if (!s) return;

        // 1. Logo Header & Footer
        if (s.header_logo) {
          let hLogo = s.header_logo.trim();
          if (hLogo.startsWith('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB')) {
            hLogo = 'images/logo.png';
          }
          if (!hLogo.startsWith('http') && !hLogo.startsWith('/') && !hLogo.startsWith('data:')) {
            hLogo = `/${hLogo}`;
          }
          document.querySelectorAll('.header .logo-link img, .site-header-logo, .header-brand img, .logo img').forEach(img => {
            img.src = hLogo;
            img.onerror = function() {
              if (!this.src.endsWith('images/logo.png')) {
                this.src = 'images/logo.png';
              }
            };
          });
        }
        if (s.footer_logo) {
          let fLogo = s.footer_logo.trim();
          if (fLogo.startsWith('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAAB')) {
            fLogo = 'images/logo-white.png';
          }
          if (!fLogo.startsWith('http') && !fLogo.startsWith('/') && !fLogo.startsWith('data:')) {
            fLogo = `/${fLogo}`;
          }
          document.querySelectorAll('.footer-brand img, .footer-brand-logo img, .site-footer-logo').forEach(img => {
            img.src = fLogo;
            img.onerror = function() {
              if (!this.src.endsWith('images/logo-white.png')) {
                this.src = 'images/logo-white.png';
              }
            };
          });
        }

        // 2. Tên thương hiệu / Phòng khám
        if (s.site_title) {
          document.querySelectorAll('.header .logo-text h1, .footer-brand h3').forEach(el => {
            el.textContent = s.site_title;
          });
        }

        // 3. Đồng bộ Số điện thoại / Hotline
        const currentPhone = s.phone || s.hotline;
        if (currentPhone) {
          // Cập nhật tất cả badge / link số điện thoại trên header
          document.querySelectorAll('.phone-badge, .phone-link, #headerPhoneLink').forEach(el => {
            el.innerHTML = `<i class="fas fa-phone-alt"></i> ${currentPhone}`;
            if (el.tagName === 'A') {
              el.setAttribute('href', `tel:${currentPhone.replace(/\s+/g, '')}`);
            }
          });

          // Text hotline ở footer & trang đặt lịch
          const fHotline = document.getElementById('footerHotlineText');
          if (fHotline) fHotline.textContent = currentPhone;
          const bkHotline = document.getElementById('bookingHotlineText');
          if (bkHotline) bkHotline.textContent = currentPhone;

          // Trang Liên hệ
          const cPhone = document.getElementById('contactPhoneText');
          if (cPhone) cPhone.textContent = currentPhone;
          document.querySelectorAll('.contact-info-entry').forEach(entry => {
            if (entry.querySelector('.fa-phone-alt, .fa-phone')) {
              const strong = entry.querySelector('strong');
              if (strong) strong.textContent = currentPhone;
            }
          });
        }

        // 4. Đồng bộ Email
        if (s.email) {
          const cEmail = document.getElementById('contactEmailText');
          if (cEmail) cEmail.textContent = s.email;
          document.querySelectorAll('.contact-info-entry').forEach(entry => {
            if (entry.querySelector('.fa-envelope')) {
              const strong = entry.querySelector('strong');
              if (strong) strong.textContent = s.email;
            }
          });
        }

        // 5. Đồng bộ Địa chỉ
        if (s.address) {
          const cAddr = document.getElementById('contactAddressText');
          if (cAddr) cAddr.textContent = s.address;
          document.querySelectorAll('.contact-info-entry').forEach(entry => {
            if (entry.querySelector('.fa-map-marker-alt, .fa-map-marker')) {
              const strong = entry.querySelector('strong');
              if (strong) strong.textContent = s.address;
            }
          });

          const bkAddr = document.getElementById('bookingAddressText');
          if (bkAddr) bkAddr.textContent = s.address;
          document.querySelectorAll('.booking-h2-info-item').forEach(item => {
            if (item.querySelector('.fa-map-marker-alt, .fa-map-marker')) {
              const p = item.querySelector('p');
              if (p) p.textContent = s.address;
            }
          });
        }

        // 6. Đồng bộ Thời gian làm việc
        if (s.working_hours_text) {
          // Trang Đặt lịch
          const bkWk = document.getElementById('bookingWorkingHoursText');
          if (bkWk) bkWk.textContent = s.working_hours_text;

          // Trang Liên hệ
          const cHoursDays = document.getElementById('contactHoursDays');
          const cHoursTime = document.getElementById('contactHoursTime');
          const cWorkingHoursSub = document.getElementById('contactWorkingHoursSubtext');

          if (s.working_hours_text.includes(',')) {
            const parts = s.working_hours_text.split(',');
            const dText = parts[0].trim();
            const tText = parts.slice(1).join(',').trim();
            if (cHoursDays) cHoursDays.textContent = dText;
            if (cHoursTime) cHoursTime.textContent = tText;
            if (cWorkingHoursSub) cWorkingHoursSub.textContent = `(${tText}, tất cả các ngày)`;
          } else {
            if (cHoursDays) cHoursDays.textContent = s.working_hours_text;
            if (cHoursTime) cHoursTime.textContent = '';
            if (cWorkingHoursSub) cWorkingHoursSub.textContent = `(${s.working_hours_text})`;
          }

          const hoursCard = document.querySelector('.contact-hours-card, .hours-card');
          if (hoursCard) {
            const daysEl = hoursCard.querySelector('.days');
            const timeEl = hoursCard.querySelector('.time');
            if (s.working_hours_text.includes(',')) {
              const parts = s.working_hours_text.split(',');
              if (daysEl) daysEl.textContent = parts[0].trim();
              if (timeEl) timeEl.textContent = parts.slice(1).join(',').trim();
            } else {
              if (daysEl) daysEl.textContent = s.working_hours_text;
            }
          }
        }

        // 7. Đồng bộ Thông tin liên hệ ở Footer (toàn bộ 10 trang web)
        document.querySelectorAll('.footer-info-line').forEach(line => {
          const span = line.querySelector('span');
          if (!span) return;
          if (line.querySelector('.fa-phone-alt, .fa-phone')) {
            if (currentPhone) span.textContent = currentPhone;
          } else if (line.querySelector('.fa-envelope')) {
            if (s.email) span.textContent = s.email;
          } else if (line.querySelector('.fa-map-marker-alt, .fa-map-marker')) {
            if (s.address) span.textContent = s.address;
          }
        });

        // 8. Đồng bộ Mạng xã hội
        if (s.facebook_url) {
          document.querySelectorAll('a[title="Facebook"], a.social-link i.fa-facebook-f, a.social-icon i.fa-facebook-f').forEach(el => {
            const a = el.tagName === 'A' ? el : el.closest('a');
            if (a) a.href = s.facebook_url;
          });
        }
        if (s.zalo_url) {
          document.querySelectorAll('a[title="Zalo"], a.btn-zalo, a.social-link i.fa-comment-dots, a.social-icon i.fa-comment-dots').forEach(el => {
            const a = el.tagName === 'A' ? el : el.closest('a');
            if (a) a.href = s.zalo_url;
          });
        }
        if (s.instagram_url) {
          document.querySelectorAll('a[title="Instagram"], a.social-link i.fa-instagram, a.social-icon i.fa-instagram').forEach(el => {
            const a = el.tagName === 'A' ? el : el.closest('a');
            if (a) a.href = s.instagram_url;
          });
        }
        if (s.youtube_url) {
          document.querySelectorAll('a[title="YouTube"]').forEach(a => a.href = s.youtube_url);
        }
      })
      .catch(err => {
        console.warn('Không thể tải settings từ SQLite:', err);
      });
  }

  // Helper escape HTML
  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  // Chuẩn hóa tên bác sĩ để so sánh không phân biệt học vị, chữ hoa/thường, dấu tiếng Việt
  function normalizeDoctorName(name) {
    if (!name) return '';
    return name
      .replace(/^(BS\.|Bác sĩ|ThS\.|TS\.|PGS\.|CKI|CKII|\s)+/i, '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // Chuẩn hóa chuỗi so sánh không dấu, chữ thường
  function normalizeStr(str) {
    if (!str) return '';
    return str.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim();
  }

  // Tách từ khóa cốt lõi của chuyên khoa (loại bỏ các từ định danh chung: chuyên khoa, khoa, khám...)
  function getCoreSpecialtyKeywords(name) {
    if (!name) return [];
    const clean = normalizeStr(name)
      .replace(/\b(chuyen khoa|khoa|phong kham|kham|chuyen)\b/gi, ' ')
      .replace(/\s+/g, ' ')
      .trim();
    return clean.split(' ').filter(w => w.length >= 2);
  }

  // Kiểm tra tương đồng chuyên khoa giữa 2 chuỗi (ví dụ 'Nhi khoa' và 'Chuyên khoa Nhi')
  function isSpecialtyMatch(specialtyA, specialtyB) {
    if (!specialtyA || !specialtyB) return false;
    const aNorm = normalizeStr(specialtyA);
    const bNorm = normalizeStr(specialtyB);

    // 1. Trùng khớp hoàn toàn hoặc một chuỗi chứa chuỗi kia
    if (aNorm === bNorm || aNorm.includes(bNorm) || bNorm.includes(aNorm)) {
      return true;
    }

    // 2. So sánh từ khóa cốt lõi (ví dụ: 'Nhi khoa' và 'Chuyên khoa Nhi' đều có từ cốt lõi là 'nhi')
    const wordsA = getCoreSpecialtyKeywords(aNorm);
    const wordsB = getCoreSpecialtyKeywords(bNorm);

    if (wordsA.length === 0 || wordsB.length === 0) return false;

    // Khớp nếu có từ khóa cốt lõi chung
    return wordsA.some(w => wordsB.includes(w));
  }

  // Danh mục 6 bác sĩ dự phòng (đồng bộ đúng với Quản lý Bác sĩ ở Admin)
  const FALLBACK_DOCTORS = [
    { id: 1, name: 'BS. CKII. Nguyễn Văn Minh', department: 'Chuyên khoa Nhi' },
    { id: 2, name: 'BS. Trần Thị Lan', department: 'Chuyên khoa Nhi' },
    { id: 3, name: 'ThS. BS. Lê Hoàng Anh', department: 'Chuyên khoa Ngoại' },
    { id: 4, name: 'BS. CKI. Phạm Thị Mai', department: 'Chuyên khoa Sản' },
    { id: 5, name: 'BS. Đặng Văn Hùng', department: 'Chuyên khoa Tai Mũi Họng' },
    { id: 6, name: 'BS. Vũ Thị Ngọc', department: 'Chuyên khoa Da liễu' }
  ];

  let dynamicDoctors = [];

  function renderDoctorOptions(doctorSelect, specialtyName) {
    if (!doctorSelect) return;

    // 1. Giữ lại giá trị bác sĩ đã chọn trước đó nếu vẫn còn hợp lệ
    const currentVal = doctorSelect.value;
    doctorSelect.value = '';

    const hasSpecialty = Boolean(specialtyName && specialtyName.trim() !== '');

    // 2. Tìm danh sách bác sĩ thuộc khoa đã chọn bằng hàm isSpecialtyMatch
    let matches = [];
    if (hasSpecialty) {
      matches = dynamicDoctors.filter(doc => 
        (doc.depts || []).some(d => isSpecialtyMatch(specialtyName, d))
      );
    }

    // Nếu đã chọn chuyên khoa nhưng chuyên khoa đó chưa có bác sĩ phụ trách
    if (hasSpecialty && matches.length === 0) {
      doctorSelect.innerHTML = '<option value="" disabled selected>Không có bác sĩ</option>';
      doctorSelect.value = '';
      return;
    }

    // Nếu không chọn khoa cụ thể, hiển thị toàn bộ danh sách bác sĩ từ Quản lý Bác sĩ
    const list = hasSpecialty ? matches : dynamicDoctors;

    // 3. Khử trùng lặp theo ID và tên bác sĩ
    const uniqueDoctors = [];
    const seen = new Set();
    list.forEach(doc => {
      const key = (doc.name || '').trim();
      if (key && !seen.has(key)) {
        seen.add(key);
        uniqueDoctors.push(doc);
      }
    });

    // 4. Render danh sách options chuẩn xác theo Quản lý Bác sĩ
    let html = '<option value="">Chọn bác sĩ *</option>';
    uniqueDoctors.forEach(doc => {
      const isSelected = (currentVal === doc.name);
      html += `<option value="${escapeHtml(doc.name)}" ${isSelected ? 'selected' : ''}>${escapeHtml(doc.name)}</option>`;
    });

    doctorSelect.innerHTML = html;
    if (currentVal && seen.has(currentVal)) {
      doctorSelect.value = currentVal;
    }
  }

  function setupDoctorDepartmentLink(docs = [], depts = []) {
    // 1. Lấy danh sách bác sĩ đang hoạt động (active) từ API Quản lý Bác sĩ
    let activeDocs = Array.isArray(docs) ? docs.filter(d => d && d.status !== 'inactive') : [];
    if (activeDocs.length === 0) {
      activeDocs = FALLBACK_DOCTORS;
    }

    // 2. Xây dựng danh sách dynamicDoctors đồng bộ 100% với Quản lý Bác sĩ
    dynamicDoctors = activeDocs.map(doc => {
      const docName = String(doc.name || '').trim();

      // Chuyên khoa của bác sĩ lấy chuẩn xác duy nhất theo Quản lý Bác sĩ
      const assignedDepts = [];
      if (doc.department) assignedDepts.push(doc.department);

      return {
        id: doc.id,
        name: docName,
        depts: assignedDepts
      };
    });

    const formPairs = [
      { specId: 'quickSpecialty', docId: 'quickDoctor' },
      { specId: 'patientSpecialty', docId: 'patientDoctor' }
    ];

    formPairs.forEach(({ specId, docId }) => {
      const specEl = document.getElementById(specId);
      const docEl = document.getElementById(docId);
      if (!docEl) return;

      // Khởi tạo options bác sĩ ban đầu
      renderDoctorOptions(docEl, specEl ? specEl.value : '');

      if (specEl) {
        specEl.removeEventListener('change', specEl._docChangeHandler);
        specEl._docChangeHandler = function () {
          renderDoctorOptions(docEl, this.value);
        };
        specEl.addEventListener('change', specEl._docChangeHandler);
      }

      // Khi form được reset, tự động khôi phục toàn bộ danh sách bác sĩ
      const parentForm = docEl.closest('form') || (specEl && specEl.closest('form'));
      if (parentForm) {
        parentForm.addEventListener('reset', function () {
          setTimeout(() => {
            renderDoctorOptions(docEl, '');
          }, 50);
        });
      }
    });

    window.resetBookingDoctorDropdowns = function () {
      formPairs.forEach(({ docId }) => {
        const docEl = document.getElementById(docId);
        if (docEl) renderDoctorOptions(docEl, '');
      });
    };
  }

  // Tải danh sách Chuyên khoa và Bác sĩ động từ Database cho các form đặt lịch
  async function loadDynamicDepartmentsForBooking() {
    try {
      const [resDepts, resDocs] = await Promise.all([
        fetch(`/api/departments?t=${Date.now()}`, { cache: 'no-store' }).then(r => r.json()).catch(() => []),
        fetch(`/api/doctors?t=${Date.now()}`, { cache: 'no-store' }).then(r => r.json()).catch(() => [])
      ]);

      const depts = Array.isArray(resDepts) ? resDepts : [];
      const docs = Array.isArray(resDocs) ? resDocs : [];

      if (depts.length > 0) {
        const selects = document.querySelectorAll('#quickSpecialty, #specialty, #patientSpecialty, select[name="specialty"]');
        selects.forEach(sel => {
          const currentVal = sel.value;
          sel.innerHTML = '<option value="">Chọn chuyên khoa *</option>' + 
            depts.filter(d => d.status !== 'inactive').map(d => `<option value="${d.name}">${d.name}</option>`).join('');
          if (currentVal) sel.value = currentVal;
        });
      }

      // Liên kết danh sách bác sĩ tải từ Quản lý Bác sĩ với các chuyên khoa
      setupDoctorDepartmentLink(docs, depts);
    } catch (err) {
      console.warn('Lỗi tải dữ liệu chuyên khoa & bác sĩ đặt lịch:', err);
      setupDoctorDepartmentLink([], []);
    }
  }

  loadDynamicBanner();
  loadDynamicLogo();
  loadDynamicDepartmentsForBooking();
  
  // Dynamic Specialties loading for chuyen-khoa.html
  function loadDynamicSpecialties() {
    const grid = document.querySelector('.specialty-grid-5');
    if (!grid) return;

    fetch(`/api/departments?t=${Date.now()}`, { cache: 'no-store' })
      .then(res => {
        if (!res.ok) throw new Error('Network error');
        return res.json();
      })
      .then(items => {
        const activeItems = Array.isArray(items) ? items.filter(d => d.status !== 'inactive') : [];
        if (activeItems.length === 0) {
          grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 60px 20px; color: #64748b; font-size: 1.05rem;"><i class="fas fa-stethoscope" style="font-size: 2.4rem; display: block; margin-bottom: 14px; opacity: 0.35;"></i>Hiện chưa có chuyên khoa nào được công bố.</div>';
          return;
        }

        grid.innerHTML = activeItems.map(d => {
          const imgSrc = d.image && d.image.trim() ? d.image : 'images/spec-noi-tong-quat.png';
          return `
            <div class="specialty-card-item">
              <div class="specialty-card-thumb">
                <img src="${imgSrc}" alt="${d.name}" onerror="this.onerror=null; this.src='images/spec-noi-tong-quat.png';">
              </div>
              <div class="specialty-card-info">
                <h3>${d.name}</h3>
                <p>${d.description || ''}</p>
              </div>
            </div>
          `;
        }).join('');
      })
      .catch(err => {
        console.warn('Không thể tải động danh sách chuyên khoa:', err.message);
      });
  }

  loadDynamicSpecialties();
  loadDynamicHomeDepartments();
  loadDynamicHomeNews();

  // Lưu ý: Thanh 6 dịch vụ trên trang chủ (homeServicesBar) là nội dung mặc định cố định, không phụ thuộc Admin

  // Khối tin tức trên trang chủ (homeNewsGrid) đồng bộ động từ SQL Server
  function loadDynamicHomeNews() {
    const grid = document.getElementById('homeNewsGrid');
    if (!grid) return;
    fetch(`/api/news?t=${Date.now()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(news => {
        const list = Array.isArray(news) ? news.slice(0, 3) : [];
        if (list.length === 0) {
          grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; padding: 40px 20px; color: #64748b;"><i class="far fa-newspaper" style="font-size: 2.2rem; display: block; margin-bottom: 10px; opacity: 0.35;"></i>Hiện chưa có bài viết tin tức nào được công bố.</div>';
          return;
        }
        grid.innerHTML = list.map(item => `
          <article class="news-card-ui">
            <div class="news-thumb-box">
              <img src="${item.image || 'images/news-1.png'}" alt="${item.title || ''}">
              <span class="news-badge-date">${item.created_at || 'Mới cập nhật'}</span>
            </div>
            <div class="news-body-content">
              <h3>${item.title || ''}</h3>
              <p>${item.summary || (item.content ? item.content.replace(/<[^>]*>/g, '').substring(0, 100) + '...' : '')}</p>
              <a href="chi-tiet-tin-tuc.html?id=${item.id}" class="news-link-read">Đọc thêm →</a>
            </div>
          </article>
        `).join('');
      })
      .catch(() => {});
  }




});


// ============================================================


// ============================================================
// DYNAMIC DEPARTMENTS CAROUSEL (Trang chủ - Đồng bộ SQL Server)
// Hiển thị tối đa 3 khoa, bấm mũi tên Next/Prev chuyển từng khoa mới
// ============================================================
let homeDepartmentsList = [];
let currentHomeDeptIndex = 0;

window.navDepartmentCarousel = function(dir) {
  if (!homeDepartmentsList || homeDepartmentsList.length === 0) return;
  const n = homeDepartmentsList.length;
  currentHomeDeptIndex = (currentHomeDeptIndex + dir + n) % n;
  renderHomeDepartmentCarousel();
};

function renderHomeDepartmentCarousel() {
  const track = document.getElementById('homeDeptCarouselTrack');
  if (!track || !homeDepartmentsList || homeDepartmentsList.length === 0) return;

  const n = homeDepartmentsList.length;
  // Dynamic visible count: 1 on mobile (<=640px), 2 on tablet (<=992px), 3 on desktop
  let visibleCount = 3;
  if (window.innerWidth <= 640) {
    visibleCount = 1;
  } else if (window.innerWidth <= 992) {
    visibleCount = 2;
  }
  visibleCount = Math.min(visibleCount, n);

  const visibleItems = [];
  for (let i = 0; i < visibleCount; i++) {
    visibleItems.push(homeDepartmentsList[(currentHomeDeptIndex + i) % n]);
  }

  // Hỗ trợ vuốt chạm (touch swipe) cho màn hình mobile
  if (!track._touchBound) {
    track._touchBound = true;
    let touchStartX = 0;
    track.addEventListener('touchstart', (e) => {
      touchStartX = e.touches[0].clientX;
    }, { passive: true });
    track.addEventListener('touchend', (e) => {
      const touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 40) {
        if (diff > 0) {
          window.navDepartmentCarousel(1); // Vuốt sang trái -> xem khoa tiếp theo
        } else {
          window.navDepartmentCarousel(-1); // Vuốt sang phải -> xem khoa trước
        }
      }
    }, { passive: true });
  }

  const defaultImages = {
    'Ung bướu': 'images/spec-ung-buou.png',
    'Phục hồi chức năng': 'images/spec-co-xuong-khop.png',
    'Sản phụ khoa': 'images/spec-san-phu-khoa.png',
    'Sản khoa': 'images/spec-san-phu-khoa.png',
    'Nội tổng quát': 'images/spec-noi-tong-quat.png',
    'Khám nội tổng quát': 'images/spec-noi-tong-quat.png',
    'Tim mạch': 'images/spec-tim-mach.png',
    'Nhi khoa': 'images/spec-nhi-khoa.png',
    'Hô hấp': 'images/spec-ho-hap.png',
    'Tiêu hóa': 'images/spec-tieu-hoa.png',
    'Tiêm chủng': 'images/spec-tiem-chung.png',
    'Da liễu': 'images/spec-da-lieu.png',
    'Cơ xương khớp': 'images/spec-co-xuong-khop.png',
    'Mắt': 'images/spec-mat.png',
    'Tai - Mũi - Họng': 'images/spec-tai-mui-hong.png',
    'Thần kinh': 'images/spec-than-kinh.png',
    'Nội tiết': 'images/spec-noi-tiet.png',
    'Tiết niệu': 'images/spec-tiet-nieu.png'
  };

  track.style.opacity = '0.3';
  setTimeout(() => {
    track.innerHTML = visibleItems.map(d => {
      let imgSrc = d.image && d.image.trim() ? d.image : (defaultImages[d.name] || 'images/dept-oncology.png');
      const safeName = d.name || 'Chuyên khoa';
      return `
        <a href="chuyen-khoa.html" class="dept-image-card" title="Chuyên khoa ${safeName}">
          <img src="${imgSrc}" alt="${safeName}" onerror="this.onerror=null; this.src='images/dept-oncology.png';">
          <div class="dept-overlay-gradient"></div>
          <div class="dept-card-text">
            <h3>${safeName}</h3>
            <span class="dept-arrow-link"><i class="fas fa-arrow-right"></i></span>
          </div>
        </a>
      `;
    }).join('');
    track.style.opacity = '1';
  }, 100);
}

function loadDynamicHomeDepartments() {
  const track = document.getElementById('homeDeptCarouselTrack');
  if (!track) return;

  if (!window._deptResizeBound) {
    window._deptResizeBound = true;
    window.addEventListener('resize', () => {
      clearTimeout(window._deptResizeTimer);
      window._deptResizeTimer = setTimeout(renderHomeDepartmentCarousel, 120);
    });
  }

  fetch(`/api/departments?t=${Date.now()}`, { cache: 'no-store' })
    .then(res => res.json())
    .then(items => {
      const activeItems = Array.isArray(items) ? items.filter(d => d.status !== 'inactive') : [];
      homeDepartmentsList = activeItems;
      const prevBtn = document.getElementById('deptNavPrev');
      const nextBtn = document.getElementById('deptNavNext');

      if (activeItems.length === 0) {
        track.innerHTML = '<div class="empty-dept-msg" style="grid-column: 1 / -1; width: 100%; text-align: center; padding: 50px 20px; color: #64748b; font-size: 1.05rem; display: flex; flex-direction: column; align-items: center; justify-content: center; margin: 0 auto;"><i class="fas fa-stethoscope" style="font-size: 2.4rem; display: block; margin-bottom: 12px; opacity: 0.35;"></i><span>Hiện chưa có chuyên khoa nào được công bố.</span></div>';
        if (prevBtn) prevBtn.style.display = 'none';
        if (nextBtn) nextBtn.style.display = 'none';
        return;
      }

      if (prevBtn) prevBtn.style.display = '';
      if (nextBtn) nextBtn.style.display = '';
      currentHomeDeptIndex = 0;
      renderHomeDepartmentCarousel();
    })
    .catch(err => {
      console.warn('Không thể tải chuyên khoa từ Admin:', err);
    });
}

