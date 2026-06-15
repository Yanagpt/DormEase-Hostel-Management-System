const express = require('express');
const router = express.Router();
const { getAdminDashboard, getStudentDashboard, getWardenDashboard } = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/admin', authorize('admin'), getAdminDashboard);
router.get('/student', authorize('student'), getStudentDashboard);
router.get('/warden', authorize('warden'), getWardenDashboard);

module.exports = router;
