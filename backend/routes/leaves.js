const express = require('express');
const router = express.Router();
const { getLeaves, getLeave, createLeave, updateLeaveStatus, cancelLeave } = require('../controllers/leaveController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getLeaves);
router.get('/:id', getLeave);
router.post('/', authorize('student'), createLeave);
router.put('/:id/status', authorize('admin', 'warden'), updateLeaveStatus);
router.put('/:id/cancel', authorize('student'), cancelLeave);

module.exports = router;
