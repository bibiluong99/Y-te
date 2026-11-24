// ============================================================
// UTILS: SAFE BASE64 IMAGE UPLOAD
// Chỉ chấp nhận ảnh raster hợp lệ (PNG, JPEG, WEBP, GIF),
// kiểm tra MIME + Magic Bytes + giới hạn dung lượng (5MB).
// ============================================================

const fs = require('fs');
const path = require('path');

const MAX_UPLOAD_BYTES = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME_TO_EXT = {
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/webp': '.webp',
  'image/gif': '.gif'
};

function detectImageTypeByMagicBytes(buf) {
  if (!buf || buf.length < 12) return null;

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
    return '.png';
  }
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
    return '.jpg';
  }
  // GIF: 47 49 46 38
  if (buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) {
    return '.gif';
  }
  // WEBP: RIFF....WEBP
  if (
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50
  ) {
    return '.webp';
  }

  return null;
}

/**
 * Lưu ảnh Base64 an toàn vào public/images/uploads.
 * Ném lỗi có thuộc tính statusCode = 400 nếu dữ liệu không hợp lệ.
 */
function saveBase64Image(fileData, fileName, prefix = 'img') {
  if (!fileData || typeof fileData !== 'string') {
    const err = new Error('Chưa có dữ liệu file ảnh hợp lệ!');
    err.statusCode = 400;
    throw err;
  }

  const matches = fileData.match(/^data:([a-zA-Z0-9/+.-]+);base64,([A-Za-z0-9+/=\s]+)$/);
  if (!matches) {
    const err = new Error('Định dạng ảnh Base64 không hợp lệ! Chỉ hỗ trợ PNG, JPG, WEBP, GIF.');
    err.statusCode = 400;
    throw err;
  }

  const mime = matches[1].toLowerCase();
  const expectedExt = ALLOWED_MIME_TO_EXT[mime];
  if (!expectedExt) {
    const err = new Error(`Định dạng tệp "${mime}" không được phép tải lên. Chỉ chấp nhận PNG, JPG, WEBP, GIF.`);
    err.statusCode = 400;
    throw err;
  }

  const buffer = Buffer.from(matches[2], 'base64');
  if (!buffer.length) {
    const err = new Error('Dữ liệu ảnh trống!');
    err.statusCode = 400;
    throw err;
  }

  if (buffer.length > MAX_UPLOAD_BYTES) {
    const err = new Error('Dung lượng ảnh vượt quá giới hạn cho phép (tối đa 5MB).');
    err.statusCode = 400;
    throw err;
  }

  const detectedExt = detectImageTypeByMagicBytes(buffer);
  if (!detectedExt) {
    const err = new Error('Nội dung tệp không phải là ảnh hợp lệ (PNG, JPG, WEBP, GIF).');
    err.statusCode = 400;
    throw err;
  }

  const safePrefix = String(prefix || 'img').replace(/[^a-zA-Z0-9_-]/g, '');
  const rawBase = path.basename(String(fileName || 'image'), path.extname(String(fileName || 'image')));
  const cleanBase = rawBase.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 40) || 'image';
  const finalFileName = `${safePrefix}_${Date.now()}_${Math.random().toString(36).slice(2, 7)}_${cleanBase}${detectedExt}`;

  try {
    const uploadDirPublic = path.join(__dirname, '../public/images/uploads');
    if (!fs.existsSync(uploadDirPublic)) {
      fs.mkdirSync(uploadDirPublic, { recursive: true });
    }
    const publicPath = path.join(uploadDirPublic, finalFileName);
    fs.writeFileSync(publicPath, buffer);
    return {
      imageUrl: `images/uploads/${finalFileName}`,
      fileName: finalFileName
    };
  } catch (fsErr) {
    console.warn('⚡ Read-only filesystem (Vercel), sử dụng Base64 Data URL:', fsErr.message);
    return {
      imageUrl: fileData,
      fileName: finalFileName
    };
  }
}

module.exports = {
  saveBase64Image,
  MAX_UPLOAD_BYTES
};
