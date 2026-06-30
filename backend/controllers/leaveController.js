const Leave = require('../models/Leave');
const { hostelScope } = require('../middleware/auth');
const { paginate, paginatedResponse } = require('../utils/pagination');

// @desc    Get leave requests
// @route   GET /api/leaves
// @access  Private
const getLeaves = async (req, res) => {
  const { skip, limit, page } = paginate(req.query);
  const { status, search } = req.query;

  const filter = hostelScope(req);
  if (status) filter.status = status;

  if (req.user.role === 'student') {
    filter.student = req.user._id;
  }

  if (search) {
    filter.$or = [
      { leaveId: { $regex: search, $options: 'i' } },
      { reason: { $regex: search, $options: 'i' } },
    ];
  }

  const [leaves, total] = await Promise.all([
    Leave.find(filter)
      .populate('student', 'name email')
      .populate('approvedBy', 'name role')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Leave.countDocuments(filter),
  ]);

  res.json({ success: true, ...paginatedResponse(leaves, total, page, limit) });
};

// @desc    Get single leave
// @route   GET /api/leaves/:id
// @access  Private
const getLeave = async (req, res) => {
  const leave = await Leave.findById(req.params.id)
    .populate('student', 'name email phone')
    .populate('approvedBy', 'name role');

  if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found.' });

  if (req.user.role === 'student' && leave.student._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  res.json({ success: true, data: leave });
};

// @desc    Create leave request
// @route   POST /api/leaves
// @access  Student
const createLeave = async (req, res) => {
  const { fromDate, toDate, reason, leaveType, contactDuringLeave } = req.body;

  // Check for overlapping pending/approved leaves
  const existing = await Leave.findOne({
    student: req.user._id,
    status: { $in: ['pending', 'approved'] },
    $or: [
      { fromDate: { $lte: new Date(toDate) }, toDate: { $gte: new Date(fromDate) } },
    ],
  });

  if (existing) {
    return res.status(400).json({
      success: false,
      message: 'You already have an overlapping leave request for these dates.',
    });
  }

  const leave = await Leave.create({ hostel: req.hostelId,
    student: req.user._id,
    fromDate,
    toDate,
    reason,
    leaveType: leaveType || 'personal',
    contactDuringLeave,
  });

  await leave.populate('student', 'name email');
  res.status(201).json({ success: true, message: 'Leave application submitted.', data: leave });
};

// @desc    Update leave status (approve/reject)
// @route   PUT /api/leaves/:id/status
// @access  Admin, Warden
const updateLeaveStatus = async (req, res) => {
  const { status, approvalNote } = req.body;
  if (!['approved', 'rejected'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Status must be approved or rejected.' });
  }

  const leave = await Leave.findById(req.params.id);
  if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found.' });
  if (leave.status !== 'pending') {
    return res.status(400).json({ success: false, message: 'Only pending requests can be updated.' });
  }

  leave.status = status;
  leave.approvedBy = req.user._id;
  leave.approvalNote = approvalNote;

  await leave.save();
  await leave.populate('student', 'name email');
  await leave.populate('approvedBy', 'name role');

  res.json({ success: true, message: `Leave request ${status}.`, data: leave });
};

// @desc    Cancel leave (by student)
// @route   PUT /api/leaves/:id/cancel
// @access  Student
const cancelLeave = async (req, res) => {
  const leave = await Leave.findById(req.params.id);
  if (!leave) return res.status(404).json({ success: false, message: 'Leave request not found.' });

  if (leave.student.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }
  if (!['pending'].includes(leave.status)) {
    return res.status(400).json({ success: false, message: 'Only pending requests can be cancelled.' });
  }

  leave.status = 'cancelled';
  await leave.save();
  res.json({ success: true, message: 'Leave request cancelled.', data: leave });
};

module.exports = { getLeaves, getLeave, createLeave, updateLeaveStatus, cancelLeave };
