const User = require('../models/User');
const Student = require('../models/Student');
const Room = require('../models/Room');
const bcrypt = require('bcryptjs');
const { paginate, paginatedResponse } = require('../utils/pagination');
const { sendEmail, templates } = require('../utils/email');

// @desc    Get all users (admin)
// @route   GET /api/users
// @access  Admin
const getUsers = async (req, res) => {
  const { skip, limit, page } = paginate(req.query);
  const { role, isActive, search } = req.query;

  const filter = {};
  if (role) filter.role = role;
  if (isActive !== undefined) filter.isActive = isActive === 'true';
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
    ];
  }

  const [users, total] = await Promise.all([
    User.find(filter).select('-password').sort({ createdAt: -1 }).skip(skip).limit(limit),
    User.countDocuments(filter),
  ]);

  res.json({ success: true, ...paginatedResponse(users, total, page, limit) });
};

// @desc    Get all students with profiles
// @route   GET /api/users/students
// @access  Admin, Warden
const getStudents = async (req, res) => {
  const { skip, limit, page } = paginate(req.query);
  const { status, feeStatus, search, room } = req.query;

  const studentFilter = {};
  if (status) studentFilter.status = status;
  if (feeStatus) studentFilter.feeStatus = feeStatus;
  if (room) studentFilter.room = room;

  if (search) {
    const matchingUsers = await User.find({
      role: 'student',
      $or: [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ],
    }).select('_id');
    const userIds = matchingUsers.map(u => u._id);

    studentFilter.$or = [
      { user: { $in: userIds } },
      { rollNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const [students, total] = await Promise.all([
    Student.find(studentFilter)
      .populate('user', 'name email phone isActive createdAt')
      .populate('room', 'roomNumber floor block')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Student.countDocuments(studentFilter),
  ]);

  res.json({ success: true, ...paginatedResponse(students, total, page, limit) });
};

// @desc    Get single student
// @route   GET /api/users/students/:id
// @access  Admin, Warden, Self
const getStudent = async (req, res) => {
  const student = await Student.findById(req.params.id)
    .populate('user', 'name email phone isActive createdAt lastLogin')
    .populate('room', 'roomNumber floor block type amenities monthlyRent');

  if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

  if (req.user.role === 'student') {
    const myStudent = await Student.findOne({ user: req.user._id });
    if (!myStudent || myStudent._id.toString() !== student._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
  }

  res.json({ success: true, data: student });
};

// @desc    Get my student profile
// @route   GET /api/users/me/student
// @access  Student
const getMyStudentProfile = async (req, res) => {
  const student = await Student.findOne({ user: req.user._id })
    .populate('user', 'name email phone createdAt')
    .populate('room', 'roomNumber floor block type amenities monthlyRent');

  if (!student) return res.status(404).json({ success: false, message: 'Student profile not found.' });
  res.json({ success: true, data: student });
};

// @desc    Create student (admin)
// @route   POST /api/users/students
// @access  Admin
const createStudent = async (req, res) => {
  const {
    name, email, password, phone,
    rollNumber, course, year, department, gender, dateOfBirth,
    parentName, parentPhone, parentEmail, address,
  } = req.body;

  const finalPassword = password || 'Password@123';

  const user = await User.create({
    name, email, password: finalPassword, role: 'student', phone,
    approvalStatus: 'approved', // admin-created accounts are pre-approved
    isActive: true,
  });

  const student = await Student.create({
    user: user._id,
    rollNumber, course, year, department, gender, dateOfBirth,
    parentName, parentPhone, parentEmail, address,
    status: 'active',
  });

  await student.populate('user', 'name email phone');

  // Notify the student their account is ready
  sendEmail({
    to: email,
    subject: 'DormEase — Your Account is Ready',
    html: templates.approved(name, email),
  }).catch(() => {});

  res.status(201).json({ success: true, message: 'Student created successfully.', data: student });
};

// @desc    Create warden (admin only)
// @route   POST /api/users/wardens
// @access  Admin
const createWarden = async (req, res) => {
  const { name, email, password, phone } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
  }

  const user = await User.create({
    name, email, password, phone, role: 'warden',
    approvalStatus: 'approved',
    isActive: true,
  });

  sendEmail({
    to: email,
    subject: 'DormEase — Your Warden Account is Ready',
    html: templates.approved(name, email),
  }).catch(() => {});

  res.status(201).json({
    success: true,
    message: 'Warden created successfully.',
    data: {
      id: user._id, name: user.name, email: user.email,
      phone: user.phone, role: user.role, isActive: user.isActive,
      createdAt: user.createdAt,
    },
  });
};

// @desc    Update student profile
// @route   PUT /api/users/students/:id
// @access  Admin, Warden, Self
const updateStudent = async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

  if (req.user.role === 'student') {
    const myStudent = await Student.findOne({ user: req.user._id });
    if (!myStudent || myStudent._id.toString() !== student._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const { parentName, parentPhone, parentEmail, address, emergencyContact } = req.body;
    Object.assign(student, { parentName, parentPhone, parentEmail, address, emergencyContact });
  } else {
    const { room, ...rest } = req.body;
    Object.assign(student, rest);
  }

  await student.save();
  await student.populate('user', 'name email phone');
  await student.populate('room', 'roomNumber floor block');

  res.json({ success: true, message: 'Student updated.', data: student });
};

// @desc    Toggle user active status (deactivate / activate) — does NOT delete
// @route   PUT /api/users/:id/toggle-status
// @access  Admin
const toggleUserStatus = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
  }
  const newStatus = !user.isActive;
  await User.updateOne({ _id: user._id }, { $set: { isActive: newStatus } });
  res.json({
    success: true,
    message: 'User ' + (newStatus ? 'activated' : 'deactivated') + ' successfully.',
    data: { isActive: newStatus },
  });
};

// @desc    Permanently delete a user (student or warden) — separate, more
//          destructive action than deactivate. Admin only.
// @route   DELETE /api/users/:id
// @access  Admin
const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
  }
  if (user.role === 'admin') {
    return res.status(400).json({ success: false, message: 'Admin accounts cannot be deleted.' });
  }

  if (user.role === 'student') {
    const student = await Student.findOne({ user: user._id });
    if (student) {
      if (student.room) {
        await Room.findByIdAndUpdate(student.room, { $pull: { occupants: student._id } });
      }
      await student.deleteOne();
    }
  }

  await user.deleteOne();
  res.json({ success: true, message: (user.role === 'warden' ? 'Warden' : 'Student') + ' deleted permanently.' });
};

// @desc    Admin resets a student or warden's password (e.g. they forgot it)
// @route   PUT /api/users/:id/reset-password
// @access  Admin
const resetPassword = async (req, res) => {
  const { newPassword } = req.body;

  if (!newPassword || newPassword.length < 6) {
    return res.status(400).json({ success: false, message: 'New password must be at least 6 characters.' });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });

  const hash = await bcrypt.hash(newPassword, 12);

  await User.updateOne(
    { _id: user._id },
    { $set: { password: hash, passwordSet: true, updatedAt: new Date() } }
  );

  // Email the user their new password
  sendEmail({
    to: user.email,
    subject: 'DormEase — Your Password Has Been Reset',
    html: templates.passwordReset(user.name, user.email, newPassword),
  }).catch((err) => {
    console.error('❌ Failed to send password reset email to', user.email, ':', err.message);
  });

  console.log(`🔑 Admin reset password for ${user.name} (${user.email})`);

 res.json({
  success: true,
  message: `Password reset successfully. An email has been sent to ${user.email}.`,
  data: {
    name: user.name,
    email: user.email,
    newPassword
  }
});
};

module.exports = {
  getUsers, getStudents, getStudent, getMyStudentProfile,
  createStudent, createWarden, updateStudent,
  toggleUserStatus, deleteUser, resetPassword,
};