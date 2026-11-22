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

module.exports = router;
