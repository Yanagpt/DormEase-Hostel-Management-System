const User = require('../models/User');
const Student = require('../models/Student');
const { paginate, paginatedResponse } = require('../utils/pagination');

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

  // If searching, find matching users first
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

  // Students can only view their own profile
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
    parentName, parentPhone, parentEmail,
    address,
  } = req.body;

  const user = await User.create({ name, email, password: password || 'Password@123', role: 'student', phone });

  const student = await Student.create({
    user: user._id,
    rollNumber,
    course,
    year,
    department,
    gender,
    dateOfBirth,
    parentName,
    parentPhone,
    parentEmail,
    address,
  });

  await student.populate('user', 'name email phone');

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
  });
  res.status(201).json({
    success: true,
    message: 'Warden created successfully.',
    data: {
      id: user._id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
    },
  });
};


// @access  Admin, Warden, Self
const updateStudent = async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ success: false, message: 'Student not found.' });

  // Students can only update their own profile and limited fields
  if (req.user.role === 'student') {
    const myStudent = await Student.findOne({ user: req.user._id });
    if (!myStudent || myStudent._id.toString() !== student._id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    // Students can only update certain fields
    const { parentName, parentPhone, parentEmail, address, emergencyContact } = req.body;
    Object.assign(student, { parentName, parentPhone, parentEmail, address, emergencyContact });
  } else {
    const { room, ...rest } = req.body; // Room changes go through room controller
    Object.assign(student, rest);
  }

  await student.save();
  await student.populate('user', 'name email phone');
  await student.populate('room', 'roomNumber floor block');

  res.json({ success: true, message: 'Student updated.', data: student });
};

// @desc    Toggle user active status
// @route   PUT /api/users/:id/toggle-status
// @access  Admin
const toggleUserStatus = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'You cannot deactivate your own account.' });
  }
  user.isActive = !user.isActive;
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully.`, data: { isActive: user.isActive } });
};

// @desc    Delete user (admin)
// @route   DELETE /api/users/:id
// @access  Admin
const deleteUser = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found.' });
  if (user._id.toString() === req.user._id.toString()) {
    return res.status(400).json({ success: false, message: 'You cannot delete your own account.' });
  }
  if (user.role === 'student') {
    const student = await Student.findOne({ user: user._id });
    if (student) {
      if (student.room) {
        const Room = require('../models/Room');
        await Room.findByIdAndUpdate(student.room, { $pull: { occupants: student._id } });
      }
      await student.deleteOne();
    }
  }
  await user.deleteOne();
  res.json({ success: true, message: 'User deleted successfully.' });
};

module.exports = {
  getUsers, getStudents, getStudent, getMyStudentProfile,
  createStudent, createWarden, updateStudent, toggleUserStatus, deleteUser,
};