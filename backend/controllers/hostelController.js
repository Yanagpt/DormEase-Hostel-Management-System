const Hostel = require('../models/Hostel');
const User = require('../models/User');
const Student = require('../models/Student');
const Room = require('../models/Room');
const bcrypt = require('bcryptjs');
const { sendEmail, templates } = require('../utils/email');

// ── Helper: attach live stats to a hostel object ──────────────────────────────
async function withStats(h) {
  const [students, rooms, wardens, activeStudents] = await Promise.all([
    User.countDocuments({ hostel: h._id, role: 'student' }),
    Room.countDocuments({ hostel: h._id }),
    User.countDocuments({ hostel: h._id, role: 'warden' }),
    Student.countDocuments({ hostel: h._id, status: 'active' }),
  ]);
  return { ...h, stats: { students, rooms, wardens, activeStudents } };
}

// ── Helper: auto-generate unique hostel code ──────────────────────────────────
async function generateCode(name) {
  const base = name.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 4).padEnd(2, 'X');
  let code, attempt = 0;
  while (true) {
    code = base + String(attempt > 0 ? attempt : '').padStart(attempt > 0 ? 2 : 0, '0');
    const exists = await Hostel.findOne({ code });
    if (!exists) return code;
    attempt++;
  }
}

// ─── PUBLIC: Register a new hostel (self-service) ─────────────────────────────
// @route  POST /api/hostels/register
// @access Public
const registerHostel = async (req, res) => {
  const { name, type, address, phone, email, description,
          contactName, contactEmail, contactPhone, establishedYear } = req.body;

  if (!name || !contactName || !contactEmail) {
    return res.status(400).json({ success: false, message: 'Hostel name, contact name and contact email are required.' });
  }

  // Check for duplicate pending/approved registration with same contact email
  const existing = await Hostel.findOne({
    contactEmail: contactEmail.toLowerCase(),
    approvalStatus: { $in: ['pending', 'approved'] },
  });
  if (existing) {
    return res.status(400).json({ success: false, message: 'A hostel application with this contact email already exists.' });
  }

  const hostel = await Hostel.create({
    name, type, address, phone, email, description, establishedYear,
    contactName, contactEmail: contactEmail.toLowerCase(), contactPhone,
    approvalStatus: 'pending',
    status: 'inactive',
  });

  // Notify contact person
  sendEmail({
    to: contactEmail,
    subject: 'DormEase — Hostel Registration Received',
    html: templates.hostelRegistrationReceived(contactName, name),
  }).catch(() => {});

  res.status(201).json({
    success: true,
    message: 'Hostel registration submitted. You will be notified once reviewed by the super admin.',
    data: { id: hostel._id, name: hostel.name, approvalStatus: hostel.approvalStatus },
  });
};

// ─── PUBLIC: List active approved hostels (for student registration) ──────────
// @route  GET /api/hostels/public
// @access Public
const getPublicHostels = async (req, res) => {
  const hostels = await Hostel.find({ approvalStatus: 'approved', status: 'active' })
    .select('name code type address.city address.state')
    .sort({ name: 1 });
  res.json({ success: true, data: hostels });
};

// ─── GET ALL HOSTELS (with filters) ──────────────────────────────────────────
// @route  GET /api/hostels
// @access SuperAdmin
const getHostels = async (req, res) => {
  const { status, approvalStatus, search } = req.query;
  const filter = {};
  if (status) filter.status = status;
  if (approvalStatus) filter.approvalStatus = approvalStatus;
  if (search) filter.name = { $regex: search, $options: 'i' };

  const hostels = await Hostel.find(filter)
    .populate('admin', 'name email phone')
    .sort({ createdAt: -1 })
    .lean();

  const result = await Promise.all(hostels.map(withStats));
  res.json({ success: true, total: result.length, data: result });
};

// ─── GET SINGLE HOSTEL ────────────────────────────────────────────────────────
// @route  GET /api/hostels/:id
// @access SuperAdmin
const getHostel = async (req, res) => {
  const hostel = await Hostel.findById(req.params.id)
    .populate('admin', 'name email phone')
    .lean();
  if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found.' });
  res.json({ success: true, data: await withStats(hostel) });
};

// ─── CREATE HOSTEL DIRECTLY (superadmin shortcut, skips approval) ─────────────
// @route  POST /api/hostels
// @access SuperAdmin
const createHostel = async (req, res) => {
  const { name, code, address, phone, email, type, description, amenities, establishedYear } = req.body;
  if (!name) return res.status(400).json({ success: false, message: 'Hostel name is required.' });

  const hostelCode = code ? code.toUpperCase() : await generateCode(name);

  const existing = await Hostel.findOne({ code: hostelCode });
  if (existing) return res.status(400).json({ success: false, message: 'A hostel with this code already exists.' });

  const hostel = await Hostel.create({
    name, code: hostelCode, address, phone, email, type,
    description, amenities, establishedYear,
    approvalStatus: 'approved',
    status: 'active',
  });

  res.status(201).json({ success: true, message: 'Hostel created.', data: hostel });
};

// ─── UPDATE HOSTEL ────────────────────────────────────────────────────────────
// @route  PUT /api/hostels/:id
// @access SuperAdmin
const updateHostel = async (req, res) => {
  // Prevent overwriting sensitive fields via update
  const { approvalStatus, code, admin, ...safe } = req.body;
  const hostel = await Hostel.findByIdAndUpdate(req.params.id, safe, { new: true, runValidators: true });
  if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found.' });
  res.json({ success: true, message: 'Hostel updated.', data: hostel });
};

// ─── APPROVE HOSTEL ───────────────────────────────────────────────────────────
// @route  PUT /api/hostels/:id/approve
// @access SuperAdmin
const approveHostel = async (req, res) => {
  const hostel = await Hostel.findById(req.params.id);
  if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found.' });
  if (hostel.approvalStatus === 'approved') {
    return res.status(400).json({ success: false, message: 'Hostel is already approved.' });
  }

  const code = await generateCode(hostel.name);

  const updated = await Hostel.findByIdAndUpdate(
    hostel._id,
    { approvalStatus: 'approved', status: 'active', code },
    { new: true }
  );

  // Notify contact
  if (hostel.contactEmail) {
    sendEmail({
      to: hostel.contactEmail,
      subject: 'DormEase — Your Hostel Has Been Approved! 🎉',
      html: templates.hostelApproved(hostel.contactName, hostel.name, code),
    }).catch(() => {});
  }

  res.json({ success: true, message: `${hostel.name} approved. Code: ${code}`, data: updated });
};

// ─── REJECT HOSTEL ────────────────────────────────────────────────────────────
// @route  PUT /api/hostels/:id/reject
// @access SuperAdmin
const rejectHostel = async (req, res) => {
  const { reason } = req.body;
  const hostel = await Hostel.findById(req.params.id);
  if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found.' });

  await Hostel.findByIdAndUpdate(hostel._id, {
    approvalStatus: 'rejected',
    status: 'inactive',
    rejectionReason: reason || '',
  });

  if (hostel.contactEmail) {
    sendEmail({
      to: hostel.contactEmail,
      subject: 'DormEase — Hostel Registration Update',
      html: templates.hostelRejected(hostel.contactName, hostel.name, reason),
    }).catch(() => {});
  }

  res.json({ success: true, message: `${hostel.name} rejected.` });
};

// ─── SET HOSTEL STATUS (active / inactive / suspended) ───────────────────────
// @route  PUT /api/hostels/:id/status
// @access SuperAdmin
const setHostelStatus = async (req, res) => {
  const { status } = req.body;
  if (!['active', 'inactive', 'suspended'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }
  const hostel = await Hostel.findById(req.params.id);
  if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found.' });
  if (hostel.approvalStatus !== 'approved') {
    return res.status(400).json({ success: false, message: 'Can only change status of approved hostels.' });
  }

  await Hostel.findByIdAndUpdate(hostel._id, { status });

  // Cascade: deactivate or restore all hostel users
  if (status !== 'active') {
    await User.updateMany({ hostel: hostel._id }, { isActive: false });
  } else {
    await User.updateMany({ hostel: hostel._id, approvalStatus: 'approved' }, { isActive: true });
  }

  res.json({ success: true, message: `Hostel marked as ${status}.` });
};

// ─── DELETE HOSTEL ────────────────────────────────────────────────────────────
// @route  DELETE /api/hostels/:id
// @access SuperAdmin
const deleteHostel = async (req, res) => {
  const hostel = await Hostel.findById(req.params.id);
  if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found.' });

  const [students, rooms] = await Promise.all([
    Student.countDocuments({ hostel: hostel._id }),
    Room.countDocuments({ hostel: hostel._id }),
  ]);

  if (students > 0 || rooms > 0) {
    return res.status(400).json({
      success: false,
      message: `Cannot delete: hostel has ${students} student(s) and ${rooms} room(s). Remove them first or suspend instead.`,
    });
  }

  // Delete associated users (admin + wardens only — no students since count is 0)
  await User.deleteMany({ hostel: hostel._id });
  await Hostel.findByIdAndDelete(hostel._id);

  res.json({ success: true, message: `${hostel.name} deleted permanently.` });
};

// ─── ASSIGN ADMIN TO HOSTEL ───────────────────────────────────────────────────
// @route  POST /api/hostels/:id/assign-admin
// @access SuperAdmin
const assignAdmin = async (req, res) => {
  const { name, email, phone, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: 'Name, email and password are required.' });
  }

  const hostel = await Hostel.findById(req.params.id);
  if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found.' });
  if (hostel.approvalStatus !== 'approved') {
    return res.status(400).json({ success: false, message: 'Hostel must be approved before assigning an admin.' });
  }

  // Permanently remove old admin first — frees up their email for reuse
  if (hostel.admin) {
    await User.findByIdAndDelete(hostel.admin);
  }

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) return res.status(400).json({ success: false, message: 'An account with this email already exists.' });

  const hash = await bcrypt.hash(password, 12);
  const admin = await User.create({
    name, email: email.toLowerCase(), password: hash,
    role: 'admin', hostel: hostel._id,
    isActive: true, approvalStatus: 'approved', passwordSet: true, phone,
  });

  await Hostel.findByIdAndUpdate(hostel._id, { admin: admin._id });

  sendEmail({
    to: email,
    subject: `DormEase — You're now Admin of ${hostel.name}`,
    html: templates.adminAssigned(name, email, password, hostel.name),
  }).catch(() => {});

  res.status(201).json({
    success: true,
    message: `Admin assigned to ${hostel.name}. Credentials emailed.`,
    data: { id: admin._id, name: admin.name, email: admin.email },
  });
};

// ─── REMOVE ADMIN FROM HOSTEL ─────────────────────────────────────────────────
// @route  DELETE /api/hostels/:id/admin
// @access SuperAdmin
// Permanently deletes the admin account so the email can be reused.
const removeAdmin = async (req, res) => {
  const hostel = await Hostel.findById(req.params.id);
  if (!hostel) return res.status(404).json({ success: false, message: 'Hostel not found.' });
  if (!hostel.admin) return res.status(400).json({ success: false, message: 'No admin assigned.' });

  await User.findByIdAndDelete(hostel.admin);
  await Hostel.findByIdAndUpdate(hostel._id, { admin: null });

  res.json({ success: true, message: 'Admin removed and account permanently deleted.' });
};

// ─── SUPERADMIN DASHBOARD ─────────────────────────────────────────────────────
// @route  GET /api/hostels/dashboard
// @access SuperAdmin
const getSuperAdminDashboard = async (req, res) => {
  const [
    totalHostels, approvedHostels, pendingHostels,
    activeHostels, suspendedHostels,
    totalStudents, totalAdmins,
  ] = await Promise.all([
    Hostel.countDocuments(),
    Hostel.countDocuments({ approvalStatus: 'approved' }),
    Hostel.countDocuments({ approvalStatus: 'pending' }),
    Hostel.countDocuments({ status: 'active' }),
    Hostel.countDocuments({ status: 'suspended' }),
    User.countDocuments({ role: 'student' }),
    User.countDocuments({ role: 'admin', isActive: true }),
  ]);

  const [recentHostels, pendingList] = await Promise.all([
    Hostel.find({ approvalStatus: 'approved' })
      .populate('admin', 'name email')
      .sort({ updatedAt: -1 }).limit(5).lean(),
    Hostel.find({ approvalStatus: 'pending' })
      .sort({ createdAt: -1 }).limit(5).lean(),
  ]);

  const hostelStats = await Promise.all(recentHostels.map(withStats));

  res.json({
    success: true,
    data: {
      totalHostels, approvedHostels, pendingHostels,
      activeHostels, suspendedHostels,
      totalStudents, totalAdmins,
      recentHostels: hostelStats,
      pendingList,
    },
  });
};

module.exports = {
  registerHostel, getPublicHostels,
  getHostels, getHostel, createHostel, updateHostel,
  approveHostel, rejectHostel, setHostelStatus, deleteHostel,
  assignAdmin, removeAdmin,
  getSuperAdminDashboard,
};