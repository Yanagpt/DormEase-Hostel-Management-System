// complaints.js
const express = require('express');
const router = express.Router();
const {
  getComplaints, getComplaint, createComplaint,
  updateComplaintStatus, rateComplaint, deleteComplaint,
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/auth');

router.use(protect);
router.get('/', getComplaints);
router.get('/:id', getComplaint);
router.post('/', authorize('student'), createComplaint);
router.put('/:id/status', authorize('admin', 'warden'), updateComplaintStatus);
router.post('/:id/rate', authorize('student'), rateComplaint);
router.delete('/:id', deleteComplaint);

module.exports = router;
