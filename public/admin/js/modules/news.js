// MODULE: NEWS MANAGEMENT & FULL-PAGE WYSIWYG EDITOR (Quill 2.0)

let newsCurrentPage = 1;
const NEWS_PAGE_SIZE = 10;
let currentNewsData = [];
let newsQuill = null;
let isNewsPreviewMode = false;

function changeNewsPage(page) {
  newsCurrentPage = page;
  renderNewsTable(currentNewsData);
}

function formatNewsDate(dateStr) {
  if (!dateStr) return '20/05/2025';
  const s = String(dateStr).trim();
  if (!s) return '20/05/2025';
  if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(s)) return s;
  if (/^\d{4}-\d{1,2}-\d{1,2}/.test(s)) {
    const datePart = s.split('T')[0];
    const parts = datePart.split('-');
    if (parts.length === 3) {
      return `${parts[2].padStart(2, '0')}/${parts[1].padStart(2, '0')}/${parts[0]}`;
    }
  }
  try {
    const d = new Date(s);
    if (!isNaN(d.getTime())) {
      const day = String(d.getDate()).padStart(2, '0');
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    }
  } catch (_) {}
  return s.split('T')[0] || s;
}

function resolveNewsPreviewImage(img) {
  if (!img) return '/images/news-1.png';
  const s = String(img).trim();
  if (/^(https?:\/\/|data:image\/|\/)/i.test(s)) return s;
  return `/${s}`;
}

function renderNewsTable(items) {
  currentNewsData = items || [];
  const tbody = document.getElementById('newsTableBody');
  const countInfo = document.getElementById('newsPaginationCount');
  const controlsEl = document.getElementById('newsPaginationControls');
  if (!tbody) return;

  if (!items || items.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#94a3b8;">Chưa có bài viết tin tức nào. Bấm "Đăng Bài Viết" để thêm!</td></tr>';
    if (countInfo) countInfo.textContent = 'Hiển thị 0 trong tổng số 0 bài viết';
    if (controlsEl) controlsEl.innerHTML = '';
    renderNewsLandingPreview([]);
    return;
  }

  const totalItems = items.length;
  const totalPages = Math.ceil(totalItems / NEWS_PAGE_SIZE) || 1;
  if (newsCurrentPage > totalPages) newsCurrentPage = totalPages;
  if (newsCurrentPage < 1) newsCurrentPage = 1;

  const startIndex = (newsCurrentPage - 1) * NEWS_PAGE_SIZE;
  const endIndex = Math.min(startIndex + NEWS_PAGE_SIZE, totalItems);
  const pageItems = items.slice(startIndex, endIndex);

  tbody.innerHTML = pageItems.map(n => `
    <tr>
      <td><img class="thumb-preview" src="${escapeHtml(resolveNewsPreviewImage(n.image))}" alt="" onerror="this.src='/images/news-1.png'"></td>
      <td><strong>${escapeHtml(n.title)}</strong></td>
      <td><span class="badge active">${escapeHtml(n.category || 'Y tế')}</span></td>
      <td>${formatNewsDate(n.created_at)}</td>
      <td>
        <div class="action-btns">
          <button title="Sửa" onclick="editNews(${n.id})"><i class="fas fa-edit"></i></button>
          <button class="btn-delete" title="Xóa" onclick="deleteNews(${n.id})"><i class="fas fa-trash-alt"></i></button>
        </div>
      </td>
    </tr>
  `).join('');

  if (countInfo) {
    countInfo.textContent = `Hiển thị ${startIndex + 1} – ${endIndex} trong tổng số ${totalItems} bài viết`;
  }

  if (controlsEl) {
    let controlsHtml = `<button type="button" class="appt-page-arrow" ${newsCurrentPage === 1 ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : 'onclick="changeNewsPage(' + (newsCurrentPage - 1) + ')"'}><i class="fas fa-chevron-left"></i></button>`;
    for (let p = 1; p <= totalPages; p++) {
      if (p === newsCurrentPage) {
        controlsHtml += `<span class="appt-page-number">${p}</span>`;
      } else {
        controlsHtml += `<button type="button" class="appt-page-arrow" onclick="changeNewsPage(${p})">${p}</button>`;
      }
    }
    controlsHtml += `<button type="button" class="appt-page-arrow" ${newsCurrentPage === totalPages ? 'disabled style="opacity:0.4; cursor:not-allowed;"' : 'onclick="changeNewsPage(' + (newsCurrentPage + 1) + ')"'}><i class="fas fa-chevron-right"></i></button>`;
    controlsEl.innerHTML = controlsHtml;
  }

  renderNewsLandingPreview(currentNewsData);
}

function renderNewsLandingPreview(items) {
  const grid = document.getElementById('newsLandingPreviewGrid');
  if (!grid) return;

  const list = Array.isArray(items) ? items.slice(0, 3) : [];
  if (list.length === 0) {
    grid.innerHTML = `
      <div style="grid-column: 1 / -1; text-align: center; padding: 36px 20px; color: #64748b;">
        <i class="far fa-newspaper" style="font-size: 2rem; display: block; margin-bottom: 8px; opacity: 0.35;"></i>
        Chưa có bài viết nào để hiển thị trên Landing Page.
      </div>
    `;
    return;
  }

  grid.innerHTML = list.map(item => {
    const rawExcerpt = item.summary || (item.content ? String(item.content).replace(/<[^>]*>/g, '').trim() : '');
    const excerpt = rawExcerpt.length > 115 ? rawExcerpt.slice(0, 115) + '...' : rawExcerpt;
    const imgSrc = resolveNewsPreviewImage(item.image);

    return `
      <article class="lp-news-card">
        <div class="lp-news-thumb">
          <img src="${escapeHtml(imgSrc)}" alt="${escapeHtml(item.title || '')}" onerror="this.src='/images/news-1.png'">
          <span class="lp-news-date">${escapeHtml(formatNewsDate(item.created_at))}</span>
          <button type="button" class="lp-news-quick-edit" onclick="editNews(${item.id})" title="Chỉnh sửa nhanh bài viết này">
            <i class="fas fa-pen"></i>
          </button>
        </div>
        <div class="lp-news-body">
          <h5>${escapeHtml(item.title || '')}</h5>
          <p>${escapeHtml(excerpt || 'Chưa có mô tả ngắn cho bài viết này.')}</p>
          <a href="/chi-tiet-tin-tuc.html?id=${encodeURIComponent(item.id)}" target="_blank" rel="noopener" class="lp-news-readmore">
            Đọc thêm →
          </a>
        </div>
      </article>
    `;
  }).join('');
}

// ============================================================
// MODAL CHÈN / SỬA CHÚ THÍCH ẢNH (KHÔNG DÙNG ALERT/PROMPT)
// ============================================================
let newsImageModalCallback = null;
let savedNewsQuillRange = null;

function openNewsImageModal({ title, submitLabel, showUrl = false, url = '', caption = '', onConfirm }) {
  const modal = document.getElementById('newsImageModal');
  if (!modal) return;

  if (newsQuill) {
    savedNewsQuillRange = newsQuill.getSelection() || { index: newsQuill.getLength() };
  }
  newsImageModalCallback = onConfirm || null;

  const titleEl = document.getElementById('newsImageModalTitle');
  const submitBtn = document.getElementById('newsImgModalSubmitBtn');
  const urlGroup = document.getElementById('newsImgModalUrlGroup');
  const urlInput = document.getElementById('newsImgModalUrl');
  const captionInput = document.getElementById('newsImgModalCaption');

  if (titleEl) titleEl.innerHTML = `<i class="fas fa-image" style="color: #104936;"></i> ${escapeHtml(title || 'Chú thích hình ảnh')}`;
  if (submitBtn) submitBtn.innerHTML = `<i class="fas fa-check"></i> ${escapeHtml(submitLabel || 'Xác nhận')}`;
  if (urlGroup) urlGroup.style.display = showUrl ? 'block' : 'none';
  if (urlInput) {
    urlInput.required = Boolean(showUrl);
    urlInput.value = showUrl ? (url || '') : '';
  }
  if (captionInput) captionInput.value = caption || '';

  updateNewsImageModalPreview(url);
  modal.classList.add('show');

  setTimeout(() => {
    if (showUrl && urlInput && !url) urlInput.focus();
    else if (captionInput) captionInput.focus();
  }, 60);
}

function updateNewsImageModalPreview(explicitUrl) {
  const wrap = document.getElementById('newsImgModalPreviewWrap');
  const img = document.getElementById('newsImgModalPreview');
  const urlInput = document.getElementById('newsImgModalUrl');
  const src = explicitUrl !== undefined ? explicitUrl : (urlInput ? urlInput.value.trim() : '');
  if (!wrap || !img) return;
  if (src) {
    img.src = src;
    wrap.style.display = 'flex';
  } else {
    img.src = '';
    wrap.style.display = 'none';
  }
}

function closeNewsImageModal() {
  const modal = document.getElementById('newsImageModal');
  if (modal) modal.classList.remove('show');
  newsImageModalCallback = null;
}

function submitNewsImageModal(e) {
  e.preventDefault();
  const urlGroup = document.getElementById('newsImgModalUrlGroup');
  const showUrl = urlGroup && urlGroup.style.display !== 'none';
  const url = document.getElementById('newsImgModalUrl')?.value.trim() || '';
  const caption = document.getElementById('newsImgModalCaption')?.value.trim() || '';

  if (showUrl && !url) {
    showToast('Vui lòng nhập đường dẫn ảnh (URL)!', 'warning');
    return;
  }

  const cb = newsImageModalCallback;
  closeNewsImageModal();
  if (typeof cb === 'function') {
    cb({ url, caption });
  }
}

window.closeNewsImageModal = closeNewsImageModal;
window.submitNewsImageModal = submitNewsImageModal;
window.updateNewsImageModalPreview = updateNewsImageModalPreview;

// ============================================================
// CUSTOM QUILL BLOT: ẢNH KÈM CHÚ THÍCH CHUẨN BÁO CHÍ (<figure>)
// ============================================================
let articleFigureRegistered = false;

function registerArticleFigureBlot() {
  if (articleFigureRegistered || typeof Quill === 'undefined') return;
  const BlockEmbed = Quill.import('blots/block/embed');

  class ArticleFigureBlot extends BlockEmbed {
    static create(value) {
      const node = super.create();
      const src = typeof value === 'string' ? value : (value && value.src) || '';
      const caption = typeof value === 'object' && value ? (value.caption || '') : '';

      node.setAttribute('data-src', src);
      node.setAttribute('data-caption', caption);
      node.setAttribute('contenteditable', 'false');

      const img = document.createElement('img');
      img.setAttribute('src', src);
      img.setAttribute('alt', caption || 'Hình ảnh bài viết');
      node.appendChild(img);

      const cap = document.createElement('figcaption');
      cap.className = 'article-caption' + (caption ? '' : ' is-empty');
      cap.textContent = caption || 'Nhấn vào đây để thêm chú thích ảnh...';
      cap.title = 'Bấm để chỉnh sửa chú thích ảnh';
      cap.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const current = node.getAttribute('data-caption') || '';
        const currentSrc = node.getAttribute('data-src') || img.getAttribute('src') || '';
        openNewsImageModal({
          title: 'Chỉnh sửa chú thích ảnh',
          submitLabel: 'Cập nhật chú thích',
          showUrl: false,
          url: currentSrc,
          caption: current,
          onConfirm: ({ caption: clean }) => {
            node.setAttribute('data-caption', clean);
            img.setAttribute('alt', clean || 'Hình ảnh bài viết');
            cap.textContent = clean || 'Nhấn vào đây để thêm chú thích ảnh...';
            cap.className = 'article-caption' + (clean ? '' : ' is-empty');
            showToast('Đã cập nhật chú thích ảnh!', 'success');
          }
        });
      });
      node.appendChild(cap);

      return node;
    }

    static value(node) {
      const img = node.querySelector('img');
      const cap = node.querySelector('figcaption');
      const caption = node.getAttribute('data-caption') !== null
        ? node.getAttribute('data-caption')
        : (cap && !cap.classList.contains('is-empty') ? cap.textContent.trim() : '');
      return {
        src: node.getAttribute('data-src') || (img ? img.getAttribute('src') : ''),
        caption: caption || ''
      };
    }
  }

  ArticleFigureBlot.blotName = 'articleFigure';
  ArticleFigureBlot.tagName = 'figure';
  ArticleFigureBlot.className = 'article-figure';

  Quill.register(ArticleFigureBlot, true);
  articleFigureRegistered = true;
}

// ============================================================
// TRÌNH SOẠN THẢO WYSIWYG TOÀN TRANG (Quill 2.0)
// ============================================================
function initNewsQuillEditor() {
  if (newsQuill) return newsQuill;
  const container = document.getElementById('newsQuillEditor');
  if (!container) return null;

  if (typeof Quill === 'undefined') {
    // Fallback an toàn nếu offline không tải được CDN Quill
    container.contentEditable = 'true';
    container.style.minHeight = '420px';
    container.style.padding = '16px';
    container.style.border = '1px solid #cbd5e1';
    container.style.borderRadius = '10px';
    container.addEventListener('input', updateNewsEditorStats);
    return null;
  }

  registerArticleFigureBlot();

  newsQuill = new Quill('#newsQuillEditor', {
    theme: 'snow',
    placeholder: 'Bắt đầu viết nội dung bài viết tại đây... Bạn có thể bôi đậm, tạo tiêu đề, danh sách, tô màu và chèn ảnh kèm chú thích trực tiếp mà không cần viết mã HTML.',
    modules: {
      toolbar: {
        container: [
          [{ header: [1, 2, 3, false] }],
          [{ size: ['small', false, 'large', 'huge'] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ color: [] }, { background: [] }],
          [{ list: 'ordered' }, { list: 'bullet' }, { indent: '-1' }, { indent: '+1' }],
          [{ align: [] }],
          ['blockquote', 'link', 'image'],
          ['clean']
        ],
        handlers: {
          image: () => triggerQuillImageUpload()
        }
      }
    }
  });

  newsQuill.on('text-change', updateNewsEditorStats);
  return newsQuill;
}

function getNewsEditorHtml() {
  const rawHtml = newsQuill
    ? (newsQuill.getSemanticHTML ? newsQuill.getSemanticHTML() : newsQuill.root.innerHTML)
    : (document.getElementById('newsQuillEditor')?.innerHTML || '');

  if (!rawHtml || rawHtml === '<p><br></p>') return '';

  // Làm sạch placeholder chú thích trống trước khi lưu / xem trước
  const tmp = document.createElement('div');
  tmp.innerHTML = rawHtml;
  tmp.querySelectorAll('figure.article-figure').forEach(fig => {
    fig.removeAttribute('contenteditable');
    const cap = fig.querySelector('figcaption');
    if (cap && (cap.classList.contains('is-empty') || !cap.textContent.trim())) {
      cap.remove();
    } else if (cap) {
      cap.removeAttribute('title');
      cap.classList.remove('is-empty');
    }
  });
  return tmp.innerHTML.trim();
}

function setNewsEditorHtml(html) {
  initNewsQuillEditor();
  const safeContent = html || '';
  if (newsQuill) {
    newsQuill.setContents([]);
    if (safeContent) {
      newsQuill.clipboard.dangerouslyPasteHTML(safeContent);
    }
  } else {
    const container = document.getElementById('newsQuillEditor');
    if (container) container.innerHTML = safeContent;
  }
  updateNewsEditorStats();
}

function updateNewsEditorStats() {
  const plainText = newsQuill
    ? newsQuill.getText().trim()
    : (document.getElementById('newsQuillEditor')?.textContent || '').trim();
  const words = plainText ? plainText.split(/\s+/).filter(Boolean).length : 0;
  const minutes = Math.max(1, Math.ceil(words / 200));

  const wcEl = document.getElementById('newsWordCount');
  const rtEl = document.getElementById('newsReadTime');
  if (wcEl) wcEl.innerHTML = `<i class="far fa-file-alt"></i> ${words} từ`;
  if (rtEl) rtEl.innerHTML = `<i class="far fa-clock"></i> ~${minutes} phút đọc`;
}

function updateNewsCoverPreview() {
  const input = document.getElementById('nImage');
  const preview = document.getElementById('nImagePreview');
  if (preview && input) {
    preview.src = resolveNewsPreviewImage(input.value);
  }
}

function updateNewsSummaryCount() {
  const summary = document.getElementById('nSummary');
  const counter = document.getElementById('nSummaryCount');
  if (summary && counter) {
    counter.textContent = `${summary.value.length} / 300 ký tự`;
  }
}

function triggerQuillImageUpload() {
  const input = document.getElementById('newsEditorInlineImageInput');
  if (input) input.click();
}

async function handleQuillInlineImageUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  try {
    showToast('Đang tối ưu và tải ảnh vào bài viết...', 'info');
    const base64Data = await compressImageClient(file, 1400, 1000, 0.88);
    const res = await authFetch(`${API_BASE}/news/upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, fileData: base64Data })
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success || !data.imageUrl) {
      throw new Error(data.error || 'Lỗi tải ảnh lên máy chủ');
    }

    const uploadedUrl = resolveNewsPreviewImage(data.imageUrl);
    openNewsImageModal({
      title: 'Thêm chú thích cho ảnh vừa tải lên',
      submitLabel: 'Chèn ảnh vào bài viết',
      showUrl: false,
      url: uploadedUrl,
      caption: '',
      onConfirm: ({ caption }) => {
        insertImageIntoQuill(uploadedUrl, caption);
        showToast('Đã chèn ảnh vào bài viết!', 'success');
      }
    });
  } catch (err) {
    showToast('Lỗi tải ảnh: ' + err.message, 'error');
  } finally {
    input.value = '';
  }
}

function insertImageIntoQuill(imgUrl, caption = '') {
  initNewsQuillEditor();
  if (newsQuill) {
    const range = savedNewsQuillRange || newsQuill.getSelection(true) || { index: newsQuill.getLength() };
    const insertAt = Math.min(Math.max(0, range.index), newsQuill.getLength());
    newsQuill.insertEmbed(insertAt, 'articleFigure', { src: imgUrl, caption }, 'user');
    newsQuill.insertText(insertAt + 1, '\n', 'user');
    newsQuill.setSelection(insertAt + 2, 0);
    savedNewsQuillRange = null;
  } else {
    const container = document.getElementById('newsQuillEditor');
    if (container) {
      const capHtml = caption ? `<figcaption class="article-caption">${escapeHtml(caption)}</figcaption>` : '';
      container.innerHTML += `<figure class="article-figure"><img src="${escapeHtml(imgUrl)}" alt="${escapeHtml(caption || 'Hình ảnh bài viết')}">${capHtml}</figure>`;
    }
  }
}

function insertQuillImageByUrl() {
  openNewsImageModal({
    title: 'Chèn ảnh từ đường dẫn (URL)',
    submitLabel: 'Chèn ảnh vào bài viết',
    showUrl: true,
    url: '',
    caption: '',
    onConfirm: ({ url, caption }) => {
      insertImageIntoQuill(url, caption);
      showToast('Đã chèn ảnh từ URL vào bài viết!', 'success');
    }
  });
}

function insertQuillDoctorTip() {
  initNewsQuillEditor();
  const tipText = '💡 Lời khuyên từ Bác sĩ An Phúc: Khám sức khỏe định kỳ giúp phát hiện sớm các nguy cơ tiềm ẩn và bảo vệ sức khỏe lâu dài cho cả gia đình.';
  if (newsQuill) {
    const range = newsQuill.getSelection(true) || { index: newsQuill.getLength() };
    newsQuill.insertText(range.index, `\n${tipText}\n`, 'user');
    newsQuill.formatLine(range.index + 1, tipText.length, 'blockquote', true);
    newsQuill.setSelection(range.index + tipText.length + 2, 0);
  } else {
    const container = document.getElementById('newsQuillEditor');
    if (container) container.innerHTML += `<blockquote>${escapeHtml(tipText)}</blockquote>`;
  }
}

function toggleNewsArticlePreview() {
  const previewPane = document.getElementById('newsFullPreviewPane');
  const editorCols = document.getElementById('newsEditorColumns');
  const btnLabel = document.getElementById('newsPreviewBtnLabel');
  if (!previewPane || !editorCols) return;

  isNewsPreviewMode = !isNewsPreviewMode;
  if (isNewsPreviewMode) {
    document.getElementById('prevNewsCategory').textContent = document.getElementById('nCategory').value || 'Kiến thức y khoa';
    document.getElementById('prevNewsAuthor').innerHTML = `<i class="far fa-user"></i> ${escapeHtml(document.getElementById('nAuthor').value || 'An Phúc Medical')}`;
    document.getElementById('prevNewsTitle').textContent = document.getElementById('nTitle').value.trim() || 'Chưa có tiêu đề bài viết';
    document.getElementById('prevNewsSummary').textContent = document.getElementById('nSummary').value.trim();
    document.getElementById('prevNewsCoverImg').src = resolveNewsPreviewImage(document.getElementById('nImage').value);
    document.getElementById('prevNewsContent').innerHTML = getNewsEditorHtml() || '<p style="color:#94a3b8;">Chưa có nội dung bài viết...</p>';

    editorCols.style.display = 'none';
    previewPane.style.display = 'block';
    if (btnLabel) btnLabel.textContent = 'Quay lại soạn thảo';
  } else {
    previewPane.style.display = 'none';
    editorCols.style.display = 'grid';
    if (btnLabel) btnLabel.textContent = 'Xem trước bài viết';
  }
}

// ============================================================
// MỞ / ĐÓNG TRANG SOẠN THẢO & CRUD TIN TỨC
// ============================================================
function openNewsModal(n = null, updateHash = true) {
  initNewsQuillEditor();

  const form = document.getElementById('newsForm');
  if (form) form.reset();
  document.getElementById('newsId').value = '';

  // Đảm bảo thoát chế độ xem trước nếu đang bật
  isNewsPreviewMode = false;
  const previewPane = document.getElementById('newsFullPreviewPane');
  const editorCols = document.getElementById('newsEditorColumns');
  const btnLabel = document.getElementById('newsPreviewBtnLabel');
  if (previewPane) previewPane.style.display = 'none';
  if (editorCols) editorCols.style.display = 'grid';
  if (btnLabel) btnLabel.textContent = 'Xem trước bài viết';

  if (n) {
    document.getElementById('newsModalTitle').textContent = 'Chỉnh Sửa Bài Viết Tin Tức';
    document.getElementById('newsId').value = n.id;
    document.getElementById('nTitle').value = n.title || '';
    document.getElementById('nCategory').value = n.category || 'Kiến thức y khoa';
    document.getElementById('nAuthor').value = n.author || 'An Phúc Medical';
    document.getElementById('nImage').value = n.image || 'images/news-1.png';
    document.getElementById('nSummary').value = n.summary || '';
    setNewsEditorHtml(n.content || '');
    if (updateHash && typeof setAdminHash === 'function') {
      setAdminHash(`#/tin-tuc/sua/${n.id}`);
    }
  } else {
    document.getElementById('newsModalTitle').textContent = 'Đăng Bài Viết Tin Tức Mới';
    document.getElementById('nAuthor').value = 'An Phúc Medical';
    document.getElementById('nImage').value = 'images/news-1.png';
    setNewsEditorHtml('');
    if (updateHash && typeof setAdminHash === 'function') {
      setAdminHash('#/tin-tuc/tao-moi');
    }
  }

  updateNewsCoverPreview();
  updateNewsSummaryCount();

  // Chuyển sang trang soạn thảo riêng (#section-news-editor)
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
  const editorSec = document.getElementById('section-news-editor');
  if (editorSec) editorSec.classList.add('active');

  document.querySelectorAll('.nav-tab').forEach(t => {
    t.classList.toggle('active', t.getAttribute('data-target') === 'section-news');
  });

  const breadcrumb = document.getElementById('currentBreadcrumb');
  const pageTitle = document.getElementById('currentPageTitle');
  if (breadcrumb) breadcrumb.textContent = n ? 'Quản lý Tin tức Y tế > Chỉnh sửa bài viết' : 'Quản lý Tin tức Y tế > Đăng bài viết mới';
  if (pageTitle) pageTitle.textContent = n ? 'Chỉnh sửa Bài viết' : 'Đăng Bài viết mới';

  syncNewsEditorStickyOffsets();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

function syncNewsEditorStickyOffsets() {
  const topbar = document.querySelector('.topbar');
  const bodyHeader = document.querySelector('#section-news-editor .editor-body-header');
  const root = document.documentElement;
  if (topbar) {
    root.style.setProperty('--admin-topbar-h', `${topbar.offsetHeight}px`);
  }
  if (bodyHeader) {
    root.style.setProperty('--editor-header-h', `${bodyHeader.offsetHeight}px`);
  }
}

window.addEventListener('resize', () => {
  const editorSec = document.getElementById('section-news-editor');
  if (editorSec && editorSec.classList.contains('active')) {
    syncNewsEditorStickyOffsets();
  }
});

function closeNewsModal() {
  if (typeof switchSection === 'function') {
    switchSection('section-news');
  } else {
    document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));
    document.getElementById('section-news')?.classList.add('active');
  }
}

async function handleNewsCoverUpload(input) {
  const file = input.files && input.files[0];
  if (!file) return;

  try {
    showToast('Đang tối ưu dung lượng và tải ảnh bìa...', 'info');
    const base64Data = await compressImageClient(file, 1200, 800, 0.88);
    document.getElementById('nImage').value = base64Data;
    updateNewsCoverPreview();

    const res = await authFetch(`${API_BASE}/news/upload-image`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileName: file.name, fileData: base64Data })
    });
    const data = await res.json().catch(() => ({}));
    if (res.ok && data.success && data.imageUrl) {
      document.getElementById('nImage').value = data.imageUrl;
      updateNewsCoverPreview();
      showToast('Tải ảnh bìa thành công!', 'success');
    } else {
      throw new Error(data.error || 'Lỗi tải ảnh bìa');
    }
  } catch (err) {
    showToast('Lỗi tải ảnh bìa: ' + err.message, 'error');
  } finally {
    input.value = '';
  }
}

function editNews(id) {
  const n = newsData.find(x => x.id == id);
  if (n) openNewsModal(n);
}

async function handleSaveNews(e) {
  e.preventDefault();
  const id = document.getElementById('newsId').value;
  const data = {
    title: document.getElementById('nTitle').value.trim(),
    category: document.getElementById('nCategory').value,
    author: document.getElementById('nAuthor').value.trim() || 'An Phúc Medical',
    image: document.getElementById('nImage').value.trim() || 'images/news-1.png',
    summary: document.getElementById('nSummary').value.trim(),
    content: getNewsEditorHtml(),
    created_at: new Date().toISOString()
  };

  if (!data.title) {
    showToast('Vui lòng nhập tiêu đề bài viết!', 'warning');
    return;
  }

  try {
    const url = id ? `${API_BASE}/news/${id}` : `${API_BASE}/news`;
    const method = id ? 'PUT' : 'POST';
    const res = await authFetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok) {
      showToast(result.error || result.message || 'Lỗi khi lưu bài viết', 'error');
      return;
    }
    showToast('Đã lưu bài viết thành công!', 'success');
  } catch (err) {
    showToast('Lỗi lưu tin tức: ' + err.message, 'error');
    return;
  }

  closeNewsModal();
  await loadNews();
  updateStats();
}

async function deleteNews(id) {
  try {
    await authFetch(`${API_BASE}/news/${id}`, { method: 'DELETE' });
    showToast('Đã xóa bài viết thành công!', 'warning');
    await loadNews();
    updateStats();
  } catch (err) {
    showToast('Lỗi khi xóa bài viết', 'error');
  }
}

window.openNewsModal = openNewsModal;
window.closeNewsModal = closeNewsModal;
window.editNews = editNews;
window.deleteNews = deleteNews;
window.toggleNewsArticlePreview = toggleNewsArticlePreview;
window.triggerQuillImageUpload = triggerQuillImageUpload;
window.handleQuillInlineImageUpload = handleQuillInlineImageUpload;
window.insertQuillImageByUrl = insertQuillImageByUrl;
window.insertQuillDoctorTip = insertQuillDoctorTip;
window.handleNewsCoverUpload = handleNewsCoverUpload;
window.updateNewsCoverPreview = updateNewsCoverPreview;
window.updateNewsSummaryCount = updateNewsSummaryCount;
