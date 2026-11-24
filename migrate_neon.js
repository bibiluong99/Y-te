require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const connStr = process.env.DATABASE_URL;
if (!connStr) {
  console.error('❌ Thiếu biến môi trường DATABASE_URL! Vui lòng cấu hình trong file .env trước khi chạy migrate.');
  process.exit(1);
}
const pool = new Pool({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false }
});

async function migrate() {
  console.log('Connecting to Neon PostgreSQL...');
  const fallback = JSON.parse(fs.readFileSync('db_fallback_data.json', 'utf8'));

  console.log('--- Creating Tables ---');
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      username TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      fullname TEXT,
      role TEXT DEFAULT 'admin',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS departments (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      code TEXT UNIQUE,
      icon TEXT DEFAULT 'fas fa-stethoscope',
      image TEXT,
      head_doctor TEXT,
      description TEXT,
      status TEXT DEFAULT 'active',
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS doctors (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      degree TEXT,
      department TEXT NOT NULL,
      experience TEXT,
      avatar TEXT,
      description TEXT,
      status TEXT DEFAULT 'active',
      sort_order INTEGER DEFAULT 0,
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS services (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT DEFAULT 'Khám bệnh',
      icon TEXT DEFAULT 'fas fa-stethoscope',
      price NUMERIC DEFAULT 0,
      description TEXT,
      duration TEXT,
      intro TEXT,
      checklist TEXT,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS appointments (
      id SERIAL PRIMARY KEY,
      patient_name TEXT,
      phone TEXT,
      email TEXT,
      appointment_type TEXT,
      has_insurance TEXT,
      specialty TEXT,
      doctor TEXT,
      appointment_date TEXT,
      appointment_time TEXT,
      notes TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS contacts (
      id SERIAL PRIMARY KEY,
      name TEXT,
      phone TEXT,
      email TEXT,
      message TEXT,
      status TEXT DEFAULT 'new',
      created_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS news (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      category TEXT,
      author TEXT,
      summary TEXT,
      content TEXT,
      image TEXT,
      status TEXT DEFAULT 'active',
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS products (
      id SERIAL PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      price NUMERIC DEFAULT 0,
      stock INTEGER DEFAULT 0,
      status TEXT DEFAULT 'active',
      image TEXT,
      description TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS banners (
      id SERIAL PRIMARY KEY,
      page_key TEXT UNIQUE,
      page_name TEXT,
      tagline TEXT,
      title TEXT,
      subtitle TEXT,
      image_url TEXT,
      btn_text TEXT,
      btn_link TEXT,
      created_at TIMESTAMPTZ DEFAULT NOW(),
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );

    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at TIMESTAMPTZ DEFAULT NOW()
    );
  `);
  console.log('✅ Tables created successfully!');

  // Check and seed users
  const { rowCount: userCount } = await pool.query('SELECT 1 FROM users LIMIT 1');
  if (userCount === 0 && fallback.users) {
    for (const u of fallback.users) {
      await pool.query('INSERT INTO users (username, password, fullname, role) VALUES ($1, $2, $3, $4) ON CONFLICT (username) DO NOTHING', [u.username, u.password, u.fullname || u.full_name, u.role || 'admin']);
    }
    console.log('✅ Seeded users');
  }

  // Check and seed departments
  const { rowCount: deptCount } = await pool.query('SELECT 1 FROM departments LIMIT 1');
  if (deptCount === 0 && fallback.departments) {
    for (const d of fallback.departments) {
      await pool.query('INSERT INTO departments (name, code, icon, image, head_doctor, description, status, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (code) DO NOTHING', [d.name, d.code, d.icon, d.image, d.head_doctor, d.description, d.status, d.sort_order]);
    }
    console.log('✅ Seeded departments');
  }

  // Check and seed doctors
  const { rowCount: docCount } = await pool.query('SELECT 1 FROM doctors LIMIT 1');
  if (docCount === 0 && fallback.doctors) {
    for (const doc of fallback.doctors) {
      await pool.query('INSERT INTO doctors (name, degree, department, experience, avatar, description, status, sort_order) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)', [doc.name, doc.degree, doc.department, doc.experience, doc.avatar, doc.description, doc.status, doc.sort_order]);
    }
    console.log('✅ Seeded doctors');
  }

  // Check and seed services
  const { rowCount: srvCount } = await pool.query('SELECT 1 FROM services LIMIT 1');
  if (srvCount === 0 && fallback.services) {
    for (const s of fallback.services) {
      await pool.query('INSERT INTO services (name, category, icon, price, description, duration, intro, checklist, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)', [s.name, s.category, s.icon, s.price, s.description, s.duration, s.intro, s.checklist, s.status]);
    }
    console.log('✅ Seeded services');
  }

  // Check and seed settings
  if (fallback.settings) {
    for (const s of fallback.settings) {
      await pool.query('INSERT INTO settings (key, value) VALUES ($1, $2) ON CONFLICT (key) DO NOTHING', [s.key, s.value]);
    }
    console.log('✅ Seeded settings');
  }

  // Check and seed banners
  const { rowCount: bnrCount } = await pool.query('SELECT 1 FROM banners LIMIT 1');
  if (bnrCount === 0 && fallback.banners) {
    for (const b of fallback.banners) {
      await pool.query('INSERT INTO banners (page_key, page_name, tagline, title, subtitle, image_url, btn_text, btn_link) VALUES ($1, $2, $3, $4, $5, $6, $7, $8) ON CONFLICT (page_key) DO NOTHING', [b.page_key, b.page_name, b.tagline, b.title, b.subtitle, b.image_url, b.btn_text, b.btn_link]);
    }
    console.log('✅ Seeded banners');
  }

  // Check and seed appointments
  const { rowCount: apptCount } = await pool.query('SELECT 1 FROM appointments LIMIT 1');
  if (apptCount === 0 && fallback.appointments) {
    for (const a of fallback.appointments) {
      await pool.query('INSERT INTO appointments (patient_name, phone, email, appointment_type, has_insurance, specialty, doctor, appointment_date, appointment_time, notes, status) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)', [a.patient_name || a.full_name, a.phone, a.email, a.appointment_type, a.has_insurance, a.specialty, a.doctor, a.appointment_date, a.appointment_time, a.notes, a.status]);
    }
    console.log('✅ Seeded appointments');
  }

  // Check and seed news
  const { rowCount: newsCount } = await pool.query('SELECT 1 FROM news LIMIT 1');
  if (newsCount === 0 && fallback.news) {
    for (const n of fallback.news) {
      await pool.query('INSERT INTO news (title, category, author, summary, content, image, status) VALUES ($1, $2, $3, $4, $5, $6, $7)', [n.title, n.category, n.author, n.summary, n.content, n.image, n.status]);
    }
    console.log('✅ Seeded news');
  }

  // Check and seed contacts
  const { rowCount: ctCount } = await pool.query('SELECT 1 FROM contacts LIMIT 1');
  if (ctCount === 0 && fallback.contacts) {
    for (const c of fallback.contacts) {
      await pool.query('INSERT INTO contacts (name, phone, email, message, status) VALUES ($1, $2, $3, $4, $5)', [c.name, c.phone, c.email, c.message, c.status]);
    }
    console.log('✅ Seeded contacts');
  }

  // Check and seed products
  const { rowCount: prdCount } = await pool.query('SELECT 1 FROM products LIMIT 1');
  if (prdCount === 0 && fallback.products) {
    for (const p of fallback.products) {
      await pool.query('INSERT INTO products (name, category, price, stock, status, image, description) VALUES ($1, $2, $3, $4, $5, $6, $7)', [p.name, p.category, p.price, p.stock, p.status, p.image, p.description]);
    }
    console.log('✅ Seeded products');
  }

  console.log('🎉 ALL DATA MIGRATED TO NEON POSTGRESQL SUCCESSFULLY!');
  pool.end();
}

migrate().catch(e => {
  console.error('Migration failed:', e);
  pool.end();
});
