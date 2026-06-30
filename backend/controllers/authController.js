const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Student = require('../models/Student');
const Hostel = require('../models/Hostel');
const { sendEmail, sendOtpEmail, templates } = require('../utils/email');

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function buildUserPayload(user) {
  let studentProfile = null;
  if (user.role === 'student') {
    studentProfile = await Student.findOne({ user: user._id })
      .populate('room', 'roomNumber floor block');
  }
  let hostelInfo = null;
  if (user.hostel) {
    hostelInfo = await Hostel.findById(user.hostel).select('name code type address status').lean();
  }
  return {
    id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    phone: user.phone,
    avatar: user.avatar,
    lastLogin: user.lastLogin,
    hostel: hostelInfo,
    hostelId: user.hostel,
    studentProfile,
  };
}

// ─── REGISTER (no password required) ─────────────────────────────────────────
// @route  POST /api/auth/register
// @access Public
const register = async (req, res) => {
  const { name, email, role, phone, rollNumber, course, department, year, hostelId } = req.body;

  if (!hostelId) {
    return res.status(400).json({ success: false, message: 'Please select a hostel.' });
  }
  const hostel = await Hostel.findById(hostelId);
  if (!hostel || hostel.status !== 'active') {
    return res.status(400).json({ success: false, message: 'Selected hostel is not available.' });
  }

  if (!role || role === 'admin' || role === 'superadmin') {
    return res.status(400).json({ success: false, message: 'Invalid role for registration.' });
  }
  if (!['warden', 'student'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Role must be warden or student.' });
  }
  if (role === 'student') {
    if (!rollNumber) return res.status(400).json({ success: false, message: 'Roll number is required for students.' });
    if (!course) return res.status(400).json({ success: false, message: 'Course is required for students.' });
  }

  const existing = await User.findOne({ email: email.toLowerCase().trim() });
  if (existing) {
    return res.status(400).json({ success: false, message: 'An account with this email already exists.' });
  }

  const user = await User.create({
    name, email: email.toLowerCase().trim(), role, phone,
    hostel: hostelId,
    approvalStatus: 'pending',
    isActive: false,
    passwordSet: false,
  });

  if (role === 'student') {
    await Student.create({
      user: user._id,
      hostel: hostelId,
      rollNumber,
      course: course || 'Not specified',
      department: department || '',
      year: year || 1,
      status: 'inactive',
    });
  }

  sendEmail({
    to: email,
    subject: 'DormEase — Registration Received',
    html: templates.registrationReceived(name, role),
  }).catch(() => {});

  res.status(201).json({
    success: true,
    message: 'Registration submitted. Please wait for admin approval.',
    data: { name: user.name, email: user.email, role: user.role, approvalStatus: user.approvalStatus },
  });
};

// ─── CHECK EMAIL ──────────────────────────────────────────────────────────────
// @route  POST /api/auth/check-email
// @access Public
// Returns what the frontend should show next for this email address.
// Possible codes:
//   ADMIN            → show password field
//   FIRST_LOGIN      → approved, no password yet → will send OTP → then set-password
//   RETURNING        → approved + passwordSet → show "Password | OTP" choice
//   PENDING          → waiting for admin approval
//   REJECTED         → account rejected
//   DEACTIVATED      → admin disabled
//   NOT_FOUND        → no such email
const checkEmail = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user) {
    return res.status(200).json({ success: true, code: 'NOT_FOUND' });
  }

  if (user.role === 'superadmin') {
    return res.status(200).json({ success: true, code: 'SUPERADMIN', name: user.name });
  }

  if (user.role === 'admin') {
    return res.status(200).json({ success: true, code: 'ADMIN', name: user.name, hostel: user.hostel });
  }

  if (!user.isActive) {
    return res.status(200).json({ success: true, code: 'DEACTIVATED' });
  }

  if (user.approvalStatus === 'pending') {
    return res.status(200).json({ success: true, code: 'PENDING' });
  }

  if (user.approvalStatus === 'rejected') {
    return res.status(200).json({
      success: true,
      code: 'REJECTED',
      reason: user.rejectionReason || null,
    });
  }

  // approved user
  if (!user.passwordSet) {
    return res.status(200).json({ success: true, code: 'FIRST_LOGIN', name: user.name });
  }

  return res.status(200).json({ success: true, code: 'RETURNING', name: user.name });
};

// ─── ADMIN LOGIN (email + password, no OTP) ───────────────────────────────────
// @route  POST /api/auth/admin-login
// @access Public
const adminLogin = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim(), role: { $in: ['admin', 'superadmin'] } })
    .select('+password');

  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  if (!user.isActive) {
    return res.status(401).json({ success: false, message: 'Account is deactivated.' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  const token = user.generateToken();
  await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

  res.status(200).json({
    success: true,
    message: 'Login successful.',
    token,
    user: await buildUserPayload(user),
  });
};

// ─── PASSWORD LOGIN (returning users who choose password) ─────────────────────
// @route  POST /api/auth/login
// @access Public
const login = async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Email and password are required.' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() })
    .select('+password');

  if (!user || user.role === 'admin') {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  if (!user.isActive || user.approvalStatus !== 'approved') {
    return res.status(401).json({ success: false, message: 'Account not active.' });
  }

  if (!user.passwordSet) {
    return res.status(400).json({
      success: false,
      code: 'NO_PASSWORD',
      message: 'Please use OTP to complete your first login and set a password.',
    });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Incorrect password.' });
  }

  const token = user.generateToken();
  await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

  res.status(200).json({
    success: true,
    message: 'Login successful.',
    token,
    user: await buildUserPayload(user),
  });
};

// ─── SEND OTP ─────────────────────────────────────────────────────────────────
// @route  POST /api/auth/send-otp
// @access Public
const sendOtp = async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required.' });

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  if (!user || user.role === 'admin' || !user.isActive || user.approvalStatus !== 'approved') {
    // Generic — don't leak info
    return res.status(200).json({ success: true, message: 'If eligible, an OTP has been sent.' });
  }

  const otp = generateOtp();
  const hashedOtp = crypto.createHash('sha256').update(otp).digest('hex');

  await User.updateOne(
    { _id: user._id },
    { $set: { otp: hashedOtp, otpExpires: new Date(Date.now() + 10 * 60 * 1000) } }
  );

  await sendOtpEmail({ to: user.email, name: user.name, otp, purpose: 'login' });

  res.status(200).json({
    success: true,
    message: 'OTP sent to your email.',
    needsPasswordSetup: !user.passwordSet,
  });
};

// ─── VERIFY OTP ───────────────────────────────────────────────────────────────
// @route  POST /api/auth/verify-otp
// @access Public
const verifyOtp = async (req, res) => {
  const { email, otp } = req.body;
  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() })
    .select('+otp +otpExpires');

  if (!user || !user.otp || !user.otpExpires) {
    return res.status(400).json({ success: false, message: 'No OTP found. Please request a new one.' });
  }

  if (user.otpExpires < new Date()) {
    await User.updateOne({ _id: user._id }, { $unset: { otp: 1, otpExpires: 1 } });
    return res.status(400).json({ success: false, message: 'OTP expired. Please request a new one.' });
  }

  const hashedInput = crypto.createHash('sha256').update(otp.trim()).digest('hex');
  if (hashedInput !== user.otp) {
    return res.status(400).json({ success: false, message: 'Incorrect OTP.' });
  }

  await User.updateOne({ _id: user._id }, { $unset: { otp: 1, otpExpires: 1 } });

  // First login → return setup token, don't issue session JWT yet
  if (!user.passwordSet) {
    const setupToken = user.generateOtpToken();
    return res.status(200).json({
      success: true,
      needsPasswordSetup: true,
      setupToken,
      message: 'OTP verified. Please set your password.',
    });
  }

  // Returning user chose OTP → fully log in
  const token = user.generateToken();
  await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

  res.status(200).json({
    success: true,
    needsPasswordSetup: false,
    message: 'Login successful.',
    token,
    user: await buildUserPayload(user),
  });
};

// ─── SET PASSWORD (first-time, after OTP verified) ────────────────────────────
// @route  POST /api/auth/set-password
// @access Public (guarded by setupToken)
const setPassword = async (req, res) => {
  const { setupToken, password } = req.body;

  if (!setupToken || !password) {
    return res.status(400).json({ success: false, message: 'Setup token and password are required.' });
  }
  if (password.length < 6) {
    return res.status(400).json({ success: false, message: 'Password must be at least 6 characters.' });
  }

  let decoded;
  try {
    decoded = jwt.verify(setupToken, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ success: false, message: 'Setup link expired. Please log in again.' });
  }

  if (decoded.purpose !== 'otp_verified') {
    return res.status(401).json({ success: false, message: 'Invalid token.' });
  }

  const user = await User.findById(decoded.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  user.password = password;
  user.passwordSet = true;
  await user.save();

  const token = user.generateToken();
  await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

  res.status(200).json({
    success: true,
    message: 'Password set! Welcome to DormEase.',
    token,
    user: await buildUserPayload(user),
  });
};

// ─── GET ME ───────────────────────────────────────────────────────────────────
const getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  let studentProfile = null;
  if (user.role === 'student') {
    studentProfile = await Student.findOne({ user: user._id })
      .populate('room', 'roomNumber floor block type');
  }
  res.status(200).json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      isActive: user.isActive,
      approvalStatus: user.approvalStatus,
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      studentProfile,
    },
  });
};

// ─── PENDING REGISTRATIONS ────────────────────────────────────────────────────
const getPendingRegistrations = async (req, res) => {
  const { role } = req.query;
  const filter = { approvalStatus: 'pending' };
  if (role) filter.role = role;
  // Admin only sees their hostel's pending users
  if (req.user.role === 'admin' && req.user.hostel) {
    filter.hostel = req.user.hostel;
  }

  const users = await User.find(filter).select('-password').sort({ createdAt: -1 });

  const result = await Promise.all(users.map(async (u) => {
    let extra = {};
    if (u.role === 'student') {
      const sp = await Student.findOne({ user: u._id });
      if (sp) extra = { rollNumber: sp.rollNumber, course: sp.course, department: sp.department };
    }
    return Object.assign({}, u.toObject(), extra);
  }));

  res.json({ success: true, data: result, total: result.length });
};

// ─── APPROVE / REJECT ─────────────────────────────────────────────────────────
const approveRegistration = async (req, res) => {
  const { action, reason } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ success: false, message: 'Action must be approve or reject.' });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  if (user.approvalStatus !== 'pending') {
    return res.status(400).json({ success: false, message: 'Already processed.' });
  }

  if (action === 'approve') {
    await User.updateOne(
      { _id: user._id },
      { $set: { approvalStatus: 'approved', isActive: true } }
    );
    if (user.role === 'student') {
      await Student.findOneAndUpdate({ user: user._id }, { status: 'active', feeStatus: 'pending' });
    }
    sendEmail({
      to: user.email,
      subject: 'DormEase — Your Account is Approved 🎉',
      html: templates.approved(user.name, user.email, user.role),
    }).catch(() => {});
  } else {
    await User.updateOne(
      { _id: user._id },
      { $set: { approvalStatus: 'rejected', isActive: false, rejectionReason: reason || '' } }
    );
    sendEmail({
      to: user.email,
      subject: 'DormEase — Registration Update',
      html: templates.rejected(user.name, reason),
    }).catch(() => {});
  }

  res.json({
    success: true,
    message: `Registration ${action === 'approve' ? 'approved' : 'rejected'}.`,
    data: { id: user._id, name: user.name, approvalStatus: action === 'approve' ? 'approved' : 'rejected' },
  });
};

// ─── UPDATE PASSWORD (authenticated user) ────────────────────────────────────
const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Provide current and new password.' });
  }
  const user = await User.findById(req.user.id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
  }
  user.password = newPassword;
  await user.save();
  const token = user.generateToken();
  res.status(200).json({ success: true, message: 'Password updated.', token });
};

// ─── UPDATE PROFILE ───────────────────────────────────────────────────────────
const updateProfile = async (req, res) => {
  const { name, phone, avatar } = req.body;
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { name, phone, avatar },
    { new: true, runValidators: true }
  );
  res.status(200).json({ success: true, message: 'Profile updated.', user });
};

module.exports = {
  register, checkEmail, adminLogin, login, sendOtp, verifyOtp, setPassword, getMe,
  getPendingRegistrations, approveRegistration,
  updatePassword, updateProfile,
};
