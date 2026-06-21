const User = require('../models/User');
const Student = require('../models/Student');
const { sendEmail, templates } = require('../utils/email');

// @desc    Public registration — warden or student requests access
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  const { name, email, password, role, phone, rollNumber, course, department, year } = req.body;

  if (!role || role === 'admin') {
    return res.status(400).json({ success: false, message: 'Invalid role for registration.' });
  }
  if (!['warden', 'student'].includes(role)) {
    return res.status(400).json({ success: false, message: 'Role must be warden or student.' });
  }
  if (role === 'student') {
    if (!rollNumber) return res.status(400).json({ success: false, message: 'Roll number is required for students.' });
    if (!course) return res.status(400).json({ success: false, message: 'Course is required for students.' });
  }

  const user = await User.create({
    name, email, password, role, phone,
    approvalStatus: 'pending',
    isActive: false,
  });

  if (role === 'student') {
    await Student.create({
      user: user._id,
      rollNumber,
      course: course || 'Not specified',
      department: department || '',
      year: year || 1,
      status: 'inactive',
    });
  }

  // Fire-and-forget email — never blocks or breaks registration
  sendEmail({
    to: email,
    subject: 'DormEase — Registration Received',
    html: templates.registrationReceived(name, role),
  }).catch(() => {});

  res.status(201).json({
    success: true,
    message: 'Registration submitted successfully. Please wait for admin approval before logging in.',
    data: { name: user.name, email: user.email, role: user.role, approvalStatus: user.approvalStatus },
  });
};

// @desc    Login
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: 'Please provide email and password.' });
  }

  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  if (user.role !== 'admin') {
    if (user.approvalStatus === 'pending') {
      return res.status(403).json({
        success: false,
        code: 'PENDING_APPROVAL',
        message: 'Your account is pending admin approval. You will be notified once approved.',
      });
    }
    if (user.approvalStatus === 'rejected') {
      return res.status(403).json({
        success: false,
        code: 'REJECTED',
        message: 'Your registration was rejected' + (user.rejectionReason ? ': ' + user.rejectionReason : '. Please contact the admin.'),
      });
    }
  }

  if (!user.isActive) {
    return res.status(401).json({ success: false, message: 'Account has been deactivated. Contact admin.' });
  }

  const token = user.generateToken();
  await User.updateOne({ _id: user._id }, { $set: { lastLogin: new Date() } });

  let studentProfile = null;
  if (user.role === 'student') {
    studentProfile = await Student.findOne({ user: user._id }).populate('room', 'roomNumber floor block');
  }

  res.status(200).json({
    success: true,
    message: 'Login successful',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
      avatar: user.avatar,
      lastLogin: user.lastLogin,
      studentProfile,
    },
  });
};

// @desc    Get current user
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  const user = await User.findById(req.user.id);
  let studentProfile = null;
  if (user.role === 'student') {
    studentProfile = await Student.findOne({ user: user._id }).populate('room', 'roomNumber floor block type');
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

// @desc    Get all pending registrations
// @route   GET /api/auth/pending
// @access  Admin
const getPendingRegistrations = async (req, res) => {
  const { role } = req.query;
  const filter = { approvalStatus: 'pending' };
  if (role) filter.role = role;

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

// @desc    Approve or reject a registration
// @route   PUT /api/auth/approve/:id
// @access  Admin
const approveRegistration = async (req, res) => {
  const { action, reason } = req.body;

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ success: false, message: 'Action must be approve or reject.' });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  if (user.approvalStatus !== 'pending') {
    return res.status(400).json({ success: false, message: 'This registration has already been processed.' });
  }

  // Native MongoDB update to bypass the password pre-save hook
  if (action === 'approve') {
    await User.updateOne(
      { _id: user._id },
      { $set: { approvalStatus: 'approved', isActive: true, updatedAt: new Date() } }
    );
    if (user.role === 'student') {
      await Student.findOneAndUpdate({ user: user._id }, { status: 'active', feeStatus: 'pending' });
    }
    sendEmail({
      to: user.email,
      subject: 'DormEase — Your Account Has Been Approved 🎉',
      html: templates.approved(user.name, user.email),
    }).catch(() => {});
  } else {
    await User.updateOne(
      { _id: user._id },
      { $set: { approvalStatus: 'rejected', isActive: false, rejectionReason: reason || '', updatedAt: new Date() } }
    );
    sendEmail({
      to: user.email,
      subject: 'DormEase — Registration Update',
      html: templates.rejected(user.name, reason),
    }).catch(() => {});
  }

  res.json({
    success: true,
    message: 'Registration ' + (action === 'approve' ? 'approved' : 'rejected') + ' successfully.',
    data: { id: user._id, name: user.name, email: user.email, approvalStatus: action === 'approve' ? 'approved' : 'rejected' },
  });
};

// @desc    Update own password (logged in user)
// @route   PUT /api/auth/password
// @access  Private
const updatePassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Please provide current and new password.' });
  }
  const user = await User.findById(req.user.id).select('+password');
  const isMatch = await user.comparePassword(currentPassword);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Current password is incorrect.' });
  }
  user.password = newPassword;
  await user.save();
  const token = user.generateToken();
  res.status(200).json({ success: true, message: 'Password updated successfully.', token });
};

// @desc    Update profile
// @route   PUT /api/auth/profile
// @access  Private
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
  register, login, getMe,
  getPendingRegistrations, approveRegistration,
  updatePassword, updateProfile,
};