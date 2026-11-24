const { Pool } = require('pg');

const connStr = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_wlXSR8aoEQN5@ep-little-leaf-beh8ekid-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require';
const pool = new Pool({
  connectionString: connStr,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  console.log('Connecting to Neon PostgreSQL...');

  const deptMapping = {
    'NOI_TONG_QUAT': 'images/departments/noi-tong-quat.jpg',
    'NHI_KHOA': 'images/departments/nhi-khoa.jpg',
    'SAN_PHU_KHOA': 'images/departments/san-phu-khoa.jpg',
    'TIM_MACH': 'images/departments/tim-mach.jpg',
    'HO_HAP': 'images/departments/ho-hap.jpg',
    'TIEU_HOA': 'images/departments/tieu-hoa.jpg',
    'TIEM_CHUNG': 'images/departments/tiem-chung.jpg',
    'DA_LIEU': 'images/departments/da-lieu.jpg',
    'CO_XUONG_KHOP': 'images/departments/co-xuong-khop.jpg'
  };

  console.log('--- Updating Departments Table with High-Resolution Images ---');
  for (const [code, imgPath] of Object.entries(deptMapping)) {
    const res = await pool.query('UPDATE departments SET image = $1 WHERE code = $2', [imgPath, code]);
    console.log(`Department [${code}] -> ${imgPath} (affected: ${res.rowCount})`);
  }

  const bannerMapping = {
    'services': 'images/banners/services-hero.jpg',
    'doctors': 'images/banners/doctors-hero.jpg',
    'news': 'images/banners/news-hero.jpg',
    'contact': 'images/banners/contact-hero.jpg',
    'specialty': 'images/banners/specialty-hero.jpg',
    'appointment': 'images/banners/appointment-hero.jpg'
  };

  console.log('--- Updating Subpage Banners Table with High-Resolution Images ---');
  for (const [pageKey, imgPath] of Object.entries(bannerMapping)) {
    const res = await pool.query('UPDATE banners SET image_url = $1 WHERE page_key = $2', [imgPath, pageKey]);
    console.log(`Banner [${pageKey}] -> ${imgPath} (affected: ${res.rowCount})`);
  }

  const depts = await pool.query('SELECT id, name, code, image FROM departments ORDER BY sort_order ASC');
  console.log('✅ Final Departments in DB:');
  depts.rows.forEach(r => console.log(`  #${r.id} ${r.name} (${r.code}) -> ${r.image}`));

  const banners = await pool.query('SELECT page_key, page_name, image_url FROM banners ORDER BY id ASC');
  console.log('✅ Final Banners in DB:');
  banners.rows.forEach(r => console.log(`  [${r.page_key}] ${r.page_name} -> ${r.image_url ? r.image_url.substring(0, 50) : 'null'}`));

  await pool.end();
}

main().catch(err => {
  console.error('Migration error:', err);
  process.exit(1);
});
