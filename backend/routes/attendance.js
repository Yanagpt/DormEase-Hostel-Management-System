const express = require('express');
const router = express.Router();
const {
  getTodayAttendance, markAttendance, bulkMarkAttendance,
  getAttendanceByDate, getStudentAttendance, getMonthlyOverview,
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);

router.get('/today', authorize('admin', 'warden'), getTodayAttendance);
router.post('/mark', authorize('admin', 'warden'), markAttendance);
router.post('/bulk', authorize('admin', 'warden'), bulkMarkAttendance);
router.get('/date/:date', authorize('admin', 'warden'), getAttendanceByDate);
router.get('/overview', authorize('admin', 'warden'), getMonthlyOverview);
router.get('/student/:studentId', getStudentAttendance);

module.exports = router;
