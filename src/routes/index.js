const express = require('express');
const healthRoutes = require('./healthRoutes');
const authRoutes = require('./authRoutes');
const productRoutes = require('./productRoutes');
const schoolListRoutes = require('./schoolListRoutes');
const cartRoutes = require('./cartRoutes');
const orderRoutes = require('./orderRoutes');
const userRoutes = require('./userRoutes');
const supportRoutes = require('./supportRoutes');
const legalRoutes = require('./legalRoutes');
const adminRoutes = require('./adminRoutes');

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/school-lists', schoolListRoutes);
router.use('/cart', cartRoutes);
router.use('/orders', orderRoutes);
router.use('/users', userRoutes);
router.use('/support', supportRoutes);
router.use('/legal', legalRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
