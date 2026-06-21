const express = require('express');
const router = express.Router();
const {
  register, login, getMe,
  getPendingRegistrations, approveRegistration,
  updatePassword, updateProfile,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getMe);
router.put('/password', protect, updatePassword);
router.put('/profile', protect, updateProfile);

// Admin approval routes
router.get('/pending', protect, authorize('admin'), getPendingRegistrations);
router.put('/approve/:id', protect, authorize('admin'), approveRegistration);

module.exports = router;