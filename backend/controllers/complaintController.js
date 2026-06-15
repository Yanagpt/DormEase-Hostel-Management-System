const Complaint = require('../models/Complaint');
const Student = require('../models/Student');
const { paginate, paginatedResponse } = require('../utils/pagination');

// @desc    Get complaints
// @route   GET /api/complaints
// @access  Private
const getComplaints = async (req, res) => {
  const { skip, limit, page } = paginate(req.query);
  const { status, priority, category, search } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;

  // Students only see their own complaints
  if (req.user.role === 'student') {
    filter.student = req.user._id;
  }

  if (search) {
    filter.$or = [
      { title: { $regex: search, $options: 'i' } },
      { complaintId: { $regex: search, $options: 'i' } },
    ];
  }

  const [complaints, total] = await Promise.all([
    Complaint.find(filter)
      .populate('student', 'name email')
      .populate('room', 'roomNumber floor')
      .populate('assignedTo', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Complaint.countDocuments(filter),
  ]);

  res.json({ success: true, ...paginatedResponse(complaints, total, page, limit) });
};

// @desc    Get single complaint
// @route   GET /api/complaints/:id
// @access  Private
const getComplaint = async (req, res) => {
  const complaint = await Complaint.findById(req.params.id)
    .populate('student', 'name email phone')
    .populate('room', 'roomNumber floor block')
    .populate('assignedTo', 'name email')
    .populate('timeline.updatedBy', 'name role');

  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

  if (req.user.role === 'student' && complaint.student._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }

  res.json({ success: true, data: complaint });
};

// @desc    Create complaint
// @route   POST /api/complaints
// @access  Student
const createComplaint = async (req, res) => {
  const { title, description, category, priority } = req.body;

  // Get student's room
  const student = await Student.findOne({ user: req.user._id });

  const complaint = await Complaint.create({
    student: req.user._id,
    room: student?.room || null,
    title,
    description,
    category,
    priority: priority || 'medium',
    timeline: [{ status: 'open', note: 'Complaint submitted', updatedBy: req.user._id, updatedAt: new Date() }],
  });

  await complaint.populate('student', 'name email');
  res.status(201).json({ success: true, message: 'Complaint submitted successfully.', data: complaint });
};

// @desc    Update complaint status
// @route   PUT /api/complaints/:id/status
// @access  Admin, Warden
const updateComplaintStatus = async (req, res) => {
  const { status, note, assignedTo } = req.body;
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

  complaint.status = status;
  complaint.timeline.push({
    status,
    note: note || `Status changed to ${status}`,
    updatedBy: req.user._id,
    updatedAt: new Date(),
  });

  if (assignedTo) complaint.assignedTo = assignedTo;
  if (status === 'resolved') {
    complaint.resolvedAt = new Date();
    complaint.resolutionNote = note;
  }

  await complaint.save();
  await complaint.populate('student', 'name email');
  await complaint.populate('assignedTo', 'name');

  res.json({ success: true, message: 'Complaint updated.', data: complaint });
};

// @desc    Rate resolved complaint
// @route   POST /api/complaints/:id/rate
// @access  Student
const rateComplaint = async (req, res) => {
  const { score, comment } = req.body;
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });
  if (complaint.student.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }
  if (complaint.status !== 'resolved') {
    return res.status(400).json({ success: false, message: 'Can only rate resolved complaints.' });
  }

  complaint.rating = { score, comment, ratedAt: new Date() };
  await complaint.save();

  res.json({ success: true, message: 'Rating submitted.', data: complaint });
};

// @desc    Delete complaint
// @route   DELETE /api/complaints/:id
// @access  Admin, Student(own)
const deleteComplaint = async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) return res.status(404).json({ success: false, message: 'Complaint not found.' });

  if (req.user.role === 'student' && complaint.student.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }
  if (req.user.role === 'student' && complaint.status !== 'open') {
    return res.status(400).json({ success: false, message: 'Can only delete open complaints.' });
  }

  await complaint.deleteOne();
  res.json({ success: true, message: 'Complaint deleted.' });
};

module.exports = { getComplaints, getComplaint, createComplaint, updateComplaintStatus, rateComplaint, deleteComplaint };
