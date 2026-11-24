// ============================================================
// API ROUTER INDEX
// ============================================================

const express = require('express');
const router = express.Router();

const authRouter = require('./auth');
const servicesRouter = require('./services');
const productsRouter = require('./products');
const newsRouter = require('./news');
const appointmentsRouter = require('./appointments');
const contactsRouter = require('./contacts');
const bannersRouter = require('./banners');
const settingsRouter = require('./settings');
const departmentsRouter = require('./departments');
const doctorsRouter = require('./doctors');

router.use('/auth', authRouter);
router.use('/services', servicesRouter);
router.use('/departments', departmentsRouter);
router.use('/doctors', doctorsRouter);
router.use('/products', productsRouter);
router.use('/news', newsRouter);
router.use('/appointments', appointmentsRouter);
router.use('/contacts', contactsRouter);
router.use('/banners', bannersRouter);
router.use('/settings', settingsRouter);

router.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'Phòng Khám Đa Khoa An Phúc API', timestamp: new Date() });
});

router.get('/debug-db', async (req, res) => {
  const dbModule = require('../db');
  let pgStatus = 'unknown';
  let pgError = null;
  let testQuery = null;
  try {
    const { Pool } = require('pg');
    const p = new Pool({
      connectionString: process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_wlXSR8aoEQN5@ep-little-leaf-beh8ekid-pooler.c-9.us-east-2.aws.neon.tech/neondb?sslmode=require',
      ssl: { rejectUnauthorized: false },
      connectionTimeoutMillis: 5000
    });
    const r = await p.query('SELECT COUNT(*) as count FROM doctors');
    testQuery = r.rows;
    pgStatus = 'connected_direct';
    await p.end();
  } catch (err) {
    pgStatus = 'error_direct';
    pgError = err.message;
  }

  res.json({
    dbState: dbModule.getDebugInfo ? dbModule.getDebugInfo() : null,
    pgPackage: typeof require('pg') !== 'undefined',
    pgStatus,
    pgError,
    testQuery,
    envDbUrl: process.env.DATABASE_URL ? process.env.DATABASE_URL.replace(/:[^:]+@/, ':***@') : 'none'
  });
});

module.exports = router;
