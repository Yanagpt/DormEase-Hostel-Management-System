const express = require('express');
const router = express.Router();
const { getPayments, getPayment, createPayment, markPaymentPaid, getPaymentStats } = require('../controllers/paymentController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/stats', authorize('admin', 'warden'), getPaymentStats);
router.get('/', getPayments);
router.get('/:id', getPayment);
router.post('/', authorize('admin', 'warden'), createPayment);
router.put('/:id/mark-paid', authorize('admin', 'warden'), markPaymentPaid);

module.exports = router;
