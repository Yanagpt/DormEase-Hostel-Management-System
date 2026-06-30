const express = require('express');
const router = express.Router();
const {
  registerHostel, getPublicHostels,
  getHostels, getHostel, createHostel, updateHostel,
  approveHostel, rejectHostel, setHostelStatus, deleteHostel,
  assignAdmin, removeAdmin,
  getSuperAdminDashboard,
} = require('../controllers/hostelController');
const { protect, authorize } = require('../middleware/auth');

// ── Public routes (no auth) ───────────────────────────────────────────────────
router.get('/public', getPublicHostels);
router.post('/register', registerHostel);

// ── SuperAdmin only ───────────────────────────────────────────────────────────
router.use(protect);
router.use(authorize('superadmin'));

router.get('/dashboard', getSuperAdminDashboard);
router.get('/', getHostels);
router.get('/:id', getHostel);
router.post('/', createHostel);
router.put('/:id', updateHostel);
router.put('/:id/approve', approveHostel);
router.put('/:id/reject', rejectHostel);
router.put('/:id/status', setHostelStatus);
router.delete('/:id', deleteHostel);
router.post('/:id/assign-admin', assignAdmin);
router.delete('/:id/admin', removeAdmin);

module.exports = router;
