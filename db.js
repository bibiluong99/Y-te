// ============================================================
// DB.JS - Microsoft SQL Server Database Driver with JSON Store Fallback
// Phòng Khám Đa Khoa An Phúc
// Database: PhongKhamAnPhuc (Microsoft SQL Server 2022)
// ============================================================

// Polyfill ECMAScript Promise.withResolvers cho Node 20
if (!Promise.withResolvers) {
  Promise.withResolvers = function () {
    let resolve, reject;
    const promise = new Promise((res, rej) => {
      resolve = res;
      reject = rej;
    });
    return { promise, resolve, reject };
  };
}

const fs = require('fs');
const path = require('path');
const sql = require('mssql');
let PgPool = null;
try {
  PgPool = require('pg').Pool;
} catch (e) {
  try {
    const pg = require('pg');
    PgPool = pg.Pool || pg;
  } catch (e2) {
    console.warn('Gói pg chưa được nạp:', e2.message);
  }
}

const FALLBACK_PATH = path.join(__dirname, 'db_fallback_data.json');

// Chuỗi kết nối Cloud PostgreSQL (Neon.tech)
const PG_URL = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_wlXSR8aoEQN5@ep-little-leaf-beh8ekid-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require';

// Cấu hình Microsoft SQL Server (Hệ thống nội bộ SQLEXPRESS)
const mssqlConfig = {
  user: process.env.DB_USER || 'anphuc',
  password: process.env.DB_PASSWORD || 'AnPhuc@2026Password!',
  server: process.env.DB_SERVER || 'localhost',
  database: process.env.DB_DATABASE || 'PhongKhamAnPhuc',
  port: parseInt(process.env.DB_PORT, 10) || 1433,
  options: {
    encrypt: false,
    trustServerCertificate: true,
    instanceName: process.env.DB_INSTANCE || 'SQLEXPRESS'
  },
  pool: {
    max: 20,
    min: 2,
    idleTimeoutMillis: 30000
  }
};

let pgPool = null;
let usePg = false;
let lastPgError = null;
let mssqlPool = null;
let useMssql = false;
let useFallback = false;
let memoryStore = null;
let initPromise = null;

// Tải dữ liệu fallback từ file JSON
function loadFallbackData() {
  try {
    if (fs.existsSync(FALLBACK_PATH)) {
      const content = fs.readFileSync(FALLBACK_PATH, 'utf8');
      memoryStore = JSON.parse(content);
    } else {
      memoryStore = { users: [], products: [], news: [], appointments: [], contacts: [], settings: [] };
    }
    if (!memoryStore.settings) memoryStore.settings = [];
  } catch (err) {
    console.warn('⚠️ Lỗi đọc db_fallback_data.json, khởi tạo store rỗng:', err.message);
    memoryStore = { users: [], products: [], news: [], appointments: [], contacts: [], settings: [] };
  }
}

// Lưu dữ liệu fallback ra JSON
function saveFallbackData() {
  try {
    fs.writeFileSync(FALLBACK_PATH, JSON.stringify(memoryStore, null, 2), 'utf8');
  } catch (err) {
    console.error('Lỗi lưu db_fallback_data.json:', err.message);
  }
}

// Chuyển đổi cú pháp SQL sang Microsoft SQL Server
function transformSql(rawSql) {
  let s = rawSql.trim();

  // 1. settings ON CONFLICT (UPSERT)
  if (s.includes('ON CONFLICT(key)')) {
    return `
      IF EXISTS (SELECT 1 FROM settings WHERE [key] = @p0)
        UPDATE settings SET value = @p1, updated_at = GETDATE() WHERE [key] = @p0;
      ELSE
        INSERT INTO settings ([key], value, updated_at) VALUES (@p0, @p1, GETDATE());
    `;
  }

  // 2. INSERT OR IGNORE INTO banners
  if (/INSERT\s+OR\s+IGNORE\s+INTO\s+banners/i.test(s)) {
    return s.replace(/INSERT\s+OR\s+IGNORE\s+INTO\s+banners\s*\(([^)]+)\)\s*VALUES\s*\(([^)]+)\)/i, 
      `IF NOT EXISTS (SELECT 1 FROM banners WHERE page_key = @p0)
       INSERT INTO banners ($1) VALUES ($2)`);
  }

  // 3. settings [key]
  s = s.replace(/\bWHERE\s+key\s*=/gi, 'WHERE [key] =');
  s = s.replace(/\bSELECT\s+key,/gi, 'SELECT [key],');
  s = s.replace(/\bSELECT\s+key\s+FROM/gi, 'SELECT [key] FROM');

  // 4. CREATE TABLE IF NOT EXISTS
  const createTableMatch = s.match(/CREATE\s+TABLE\s+IF\s+NOT\s+EXISTS\s+([a-zA-Z0-9_]+)\s*\(([\s\S]+)\)/i);
  if (createTableMatch) {
    const tblName = createTableMatch[1];
    let body = createTableMatch[2];
    body = body.replace(/INTEGER\s+PRIMARY\s+KEY\s+AUTOINCREMENT/gi, 'INT IDENTITY(1,1) PRIMARY KEY');
    body = body.replace(/TEXT\s+PRIMARY\s+KEY/gi, 'NVARCHAR(100) PRIMARY KEY');
    body = body.replace(/TEXT\s+UNIQUE/gi, 'NVARCHAR(100) UNIQUE');
    body = body.replace(/\bTEXT\b/gi, 'NVARCHAR(MAX)');
    body = body.replace(/REAL/gi, 'DECIMAL(18,2)');
    body = body.replace(/CURRENT_TIMESTAMP/gi, 'GETDATE()');
    body = body.replace(/\bkey\b/gi, '[key]');
    body = body.replace(/PRIMARY\s+\[key\]/gi, 'PRIMARY KEY');
    return `IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = '${tblName}') CREATE TABLE [${tblName}] (${body});`;
  }

  // 5. ALTER TABLE ADD COLUMN
  const alterColMatch = s.match(/ALTER\s+TABLE\s+([a-zA-Z0-9_]+)\s+ADD\s+COLUMN\s+([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_]+)/i);
  if (alterColMatch) {
    const tbl = alterColMatch[1];
    const col = alterColMatch[2];
    let type = alterColMatch[3].toUpperCase();
    if (type === 'TEXT') type = 'NVARCHAR(MAX)';
    return `IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('${tbl}') AND name = '${col}') ALTER TABLE [${tbl}] ADD [${col}] ${type};`;
  }

  return s;
}

// Khởi tạo Database
async function initDatabase() {
  loadFallbackData();

  // 1. Thử kết nối Cloud PostgreSQL (Neon) ưu tiên hàng đầu
  if (PgPool) {
    const candidateUrls = [
      process.env.DATABASE_URL,
      'postgresql://neondb_owner:npg_wlXSR8aoEQN5@ep-little-leaf-beh8ekid-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require'
    ].filter(Boolean);

    for (const connUrl of candidateUrls) {
      try {
        pgPool = new PgPool({
          connectionString: connUrl,
          ssl: { rejectUnauthorized: false },
          connectionTimeoutMillis: 8000,
          max: 10
        });
        await pgPool.query('SELECT 1');
        usePg = true;
        lastPgError = null;
        console.log('✅ Đã kết nối thành công tới Cloud PostgreSQL (Neon)! Dữ liệu sẽ được lưu vĩnh viễn trên Live.');
        return;
      } catch (pgErr) {
        lastPgError = pgErr.message;
        console.warn('⚠️ Lỗi thử kết nối PostgreSQL:', pgErr.message);
        if (pgPool) {
          try { await pgPool.end(); } catch (_) {}
          pgPool = null;
        }
        usePg = false;
      }
    }
  }

  // 2. Thử kết nối Microsoft SQL Server nếu không phải Vercel
  if (!process.env.VERCEL) {
    try {
      mssqlPool = await sql.connect(mssqlConfig);
      useMssql = true;
      console.log(`✅ Đã kết nối thành công tới Microsoft SQL Server: ${mssqlConfig.database} (${mssqlConfig.options.instanceName})`);
      return;
    } catch (mssqlErr) {
      console.warn('⚠️ Chưa thể kết nối tới Microsoft SQL Server, chuyển sang chế độ JSON fallback:', mssqlErr.message);
      useMssql = false;
    }
  }

  // 3. Fallback sang JSON Store
  console.log('⚡ Sử dụng chế độ JSON Fallback dự phòng');
  useFallback = true;
}

// Query helper thống nhất
const db = {
  all: async (sqlQuery, params = []) => {
    await initPromise;
    if (usePg && pgPool) {
      try {
        let paramIdx = 1;
        let query = sqlQuery.trim().replace(/\?/g, () => `$${paramIdx++}`);
        query = query.replace(/\[key\]/gi, 'key');
        const result = await pgPool.query(query, params);
        return result.rows || [];
      } catch (err) {
        console.error('Lỗi truy vấn PostgreSQL (all):', err.message, 'SQL:', sqlQuery);
        throw err;
      }
    }

    if (useMssql && mssqlPool) {
      try {
        let transformed = transformSql(sqlQuery);
        const req = mssqlPool.request();
        params.forEach((val, idx) => {
          req.input(`p${idx}`, val !== undefined ? val : null);
        });
        let paramIdx = 0;
        transformed = transformed.replace(/\?/g, () => `@p${paramIdx++}`);
        const result = await req.query(transformed);
        return result.recordset || [];
      } catch (err) {
        console.error('Lỗi truy vấn SQL Server (all):', err.message, 'SQL:', sqlQuery);
        throw err;
      }
    }

    // JSON fallback
    return new Promise((resolve) => {
      const tableMatch = sqlQuery.match(/FROM\s+([a-zA-Z0-9_]+)/i);
      const tableName = tableMatch ? tableMatch[1].toLowerCase() : null;
      if (tableName && memoryStore && memoryStore[tableName]) {
        resolve(memoryStore[tableName]);
      } else {
        resolve([]);
      }
    });
  },

  get: async (sqlQuery, params = []) => {
    await initPromise;
    if (usePg && pgPool) {
      try {
        const rows = await db.all(sqlQuery, params);
        return rows && rows.length > 0 ? rows[0] : null;
      } catch (err) {
        console.error('Lỗi truy vấn PostgreSQL (get):', err.message, 'SQL:', sqlQuery);
        throw err;
      }
    }

    if (useMssql && mssqlPool) {
      const rows = await db.all(sqlQuery, params);
      return rows && rows.length > 0 ? rows[0] : null;
    }

    // JSON fallback
    return new Promise((resolve) => {
      const tableMatch = sqlQuery.match(/FROM\s+([a-zA-Z0-9_]+)/i);
      const tableName = tableMatch ? tableMatch[1].toLowerCase() : null;
      if (tableName && memoryStore && memoryStore[tableName]) {
        if (params.length > 0) {
          const found = memoryStore[tableName].find(item => item.id == params[0] || item.username == params[0] || item.key == params[0]);
          resolve(found || null);
        } else {
          resolve(memoryStore[tableName][0] || null);
        }
      } else {
        resolve(null);
      }
    });
  },

  run: async (sqlQuery, params = []) => {
    await initPromise;
    if (usePg && pgPool) {
      try {
        let query = sqlQuery.trim();

        // Xử lý UPSERT bảng settings
        if (query.includes('ON CONFLICT(key)')) {
          let paramIdx = 1;
          query = query.replace(/\?/g, () => `$${paramIdx++}`);
          query = query.replace(/CURRENT_TIMESTAMP/gi, 'NOW()');
        } else {
          let paramIdx = 1;
          query = query.replace(/\?/g, () => `$${paramIdx++}`);

          const isInsert = /^\s*INSERT\s+INTO\s+/i.test(query);
          if (isInsert && !/RETURNING/i.test(query)) {
            query += ' RETURNING id';
          }

          query = query.replace(/\bAUTOINCREMENT\b/gi, '');
          query = query.replace(/\[key\]/gi, 'key');
          query = query.replace(/CURRENT_TIMESTAMP/gi, 'NOW()');
        }

        const result = await pgPool.query(query, params);
        const lastID = result.rows && result.rows[0] && result.rows[0].id ? result.rows[0].id : 0;
        return {
          lastID,
          changes: result.rowCount || 1
        };
      } catch (err) {
        console.error('Lỗi thực thi PostgreSQL (run):', err.message, 'SQL:', sqlQuery);
        throw err;
      }
    }

    if (useMssql && mssqlPool) {
      try {
        let transformed = transformSql(sqlQuery);
        const isInsert = /^\s*INSERT\s+INTO\s+/i.test(transformed);
        if (isInsert && !transformed.includes('SCOPE_IDENTITY()') && !transformed.includes('IF EXISTS')) {
          transformed += '; SELECT SCOPE_IDENTITY() AS lastID;';
        }

        const req = mssqlPool.request();
        params.forEach((val, idx) => {
          req.input(`p${idx}`, val !== undefined ? val : null);
        });
        let paramIdx = 0;
        transformed = transformed.replace(/\?/g, () => `@p${paramIdx++}`);

        const result = await req.query(transformed);
        const lastID = result.recordset && result.recordset[0] && result.recordset[0].lastID 
          ? result.recordset[0].lastID 
          : 0;
        return {
          lastID,
          changes: result.rowsAffected && result.rowsAffected[0] ? result.rowsAffected[0] : 1
        };
      } catch (err) {
        console.error('Lỗi thực thi SQL Server (run):', err.message, 'SQL:', sqlQuery);
        throw err;
      }
    }

    // JSON fallback
    return new Promise((resolve) => {
      const isInsert = /INSERT\s+INTO\s+([a-zA-Z0-9_]+)/i.exec(sqlQuery);
      const isDelete = /DELETE\s+FROM\s+([a-zA-Z0-9_]+)\s+WHERE\s+id\s*=\s*\?/i.exec(sqlQuery);
      const isUpdate = /UPDATE\s+([a-zA-Z0-9_]+)/i.exec(sqlQuery);

      if (isInsert) {
        const tableName = isInsert[1].toLowerCase();
        if (!memoryStore[tableName]) memoryStore[tableName] = [];

        // Xử lý riêng cho bảng cấu hình Key-Value (settings)
        if (tableName === 'settings') {
          let sKey = null;
          let sVal = null;
          if (params.length >= 2) {
            sKey = String(params[0]);
            sVal = params[1];
          } else if (params.length === 1) {
            const inlineKey = sqlQuery.match(/VALUES\s*\(\s*['"]([^'"]+)['"]/i);
            sKey = inlineKey ? inlineKey[1] : null;
            sVal = params[0];
          }
          if (sKey) {
            const exIdx = memoryStore.settings.findIndex(x => x && x.key === sKey);
            if (exIdx !== -1) {
              memoryStore.settings[exIdx].value = sVal;
              memoryStore.settings[exIdx].updated_at = new Date().toISOString();
            } else {
              memoryStore.settings.push({
                id: memoryStore.settings.length + 1,
                key: sKey,
                value: sVal,
                updated_at: new Date().toISOString()
              });
            }
            saveFallbackData();
            resolve({ changes: 1 });
            return;
          }
        }

        const newId = memoryStore[tableName].length > 0 ? Math.max(...memoryStore[tableName].map(x => x.id || 0)) + 1 : 1;
        
        // Parse columns from INSERT INTO table (col1, col2...)
        const colMatch = sqlQuery.match(/INSERT\s+INTO\s+[a-zA-Z0-9_]+\s*\(([^)]+)\)/i);
        const newRecord = { id: newId };
        if (colMatch && params && params.length > 0) {
          const cols = colMatch[1].split(',').map(c => c.trim().replace(/[\[\]`"]/g, ''));
          cols.forEach((col, idx) => {
            if (idx < params.length) {
              newRecord[col] = params[idx];
            }
          });
        }
        memoryStore[tableName].push(newRecord);
        saveFallbackData();
        resolve({ lastID: newId, changes: 1 });
      } else if (isDelete) {
        const tableName = isDelete[1].toLowerCase();
        if (memoryStore && memoryStore[tableName]) {
          memoryStore[tableName] = memoryStore[tableName].filter(x => x.id != params[0]);
          saveFallbackData();
        }
        resolve({ changes: 1 });
      } else if (isUpdate) {
        const tableName = isUpdate[1].toLowerCase();
        if (memoryStore && memoryStore[tableName] && params && params.length > 0) {
          const updateId = params[params.length - 1];
          const itemIndex = memoryStore[tableName].findIndex(x => x.id == updateId);
          if (itemIndex !== -1) {
            const setMatch = sqlQuery.match(/SET\s+([\s\S]+?)\s+WHERE/i);
            if (setMatch) {
              const setCols = setMatch[1].split(',').map(part => part.split('=')[0].trim().replace(/[\[\]`"]/g, ''));
              setCols.forEach((col, idx) => {
                if (idx < params.length - 1) {
                  memoryStore[tableName][itemIndex][col] = params[idx];
                }
              });
            }
            saveFallbackData();
          }
        }
        resolve({ changes: 1 });
      } else {
        resolve({ changes: 1 });
      }
    });
  },

  getStore: () => memoryStore,
  saveStore: () => saveFallbackData(),
  isUsingFallback: () => useFallback,
  isSqlServer: () => useMssql,
  isPostgres: () => usePg,
  getDebugInfo: () => ({ usePg, useMssql, useFallback, lastPgError, hasPgPool: Boolean(PgPool) })
};

// Khởi chạy kết nối
initPromise = initDatabase();

module.exports = db;
