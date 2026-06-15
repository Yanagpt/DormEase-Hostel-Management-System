const User = require('../models/User');
const Student = require('../models/Student');

// @desc    Register user
// @route   POST /api/auth/register
// @access  Public (Admin only in production)
const register = async (req, res) => {
  const { name, email, password, role, phone } = req.body;

  const user = await User.create({ name, email, password, role: role || 'student', phone });

  // Create student profile if role is student
  if (user.role === 'student') {
    await Student.create({
      user: user._id,
      rollNumber: req.body.rollNumber || `STU${Date.now()}`,
      course: req.body.course || 'Not specified',
    });
  }

  const token = user.generateToken();
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    token,
    user: {
      id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      phone: user.phone,
    },
  });
};

// @desc    Login user
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

  if (!user.isActive) {
    return res.status(401).json({ success: false, message: 'Account has been deactivated. Contact admin.' });
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    return res.status(401).json({ success: false, message: 'Invalid credentials.' });
  }

  const token = user.generateToken();
  user.lastLogin = new Date();
  await user.save({ validateBeforeSave: false });

  // Fetch student profile if student
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

// @desc    Get current user profile
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
      lastLogin: user.lastLogin,
      createdAt: user.createdAt,
      studentProfile,
    },
  });
};

// @desc    Update password
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

// @desc    Update profile (name, phone, avatar)
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

module.exports = { register, login, getMe, updatePassword, updateProfile };
