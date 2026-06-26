const express = require('express');
const router = express.Router();
const {
  register, checkEmail, adminLogin, login, sendOtp, verifyOtp, setPassword, getMe,
  getPendingRegistrations, approveRegistration,
  updatePassword, updateProfile,
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');

// Registration
router.post('/register', register);

// Step 0 — check what this email is
router.post('/check-email', checkEmail);

// Step 1a — admin: direct password login
router.post('/admin-login', adminLogin);

// Step 1b — user: password login (returning users)
router.post('/login', login);

// Step 1c — user: request OTP (first login or OTP choice)
router.post('/send-otp', sendOtp);

// Step 2 — verify OTP
router.post('/verify-otp', verifyOtp);

// Step 3 — set password (first login only)
router.post('/set-password', setPassword);

// Authenticated routes
router.get('/me', protect, getMe);
router.put('/password', protect, updatePassword);
router.put('/profile', protect, updateProfile);

// Admin-only
router.get('/pending', protect, authorize('admin'), getPendingRegistrations);
router.put('/approve/:id', protect, authorize('admin'), approveRegistration);

module.exports = router;