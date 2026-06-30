const User = require('../models/User');
const Student = require('../models/Student');
const Room = require('../models/Room');
const Complaint = require('../models/Complaint');
const Leave = require('../models/Leave');
const Payment = require('../models/Payment');
const Notice = require('../models/Notice');
const { hostelScope } = require('../middleware/auth');

// ─── ADMIN DASHBOARD ──────────────────────────────────────────────────────────
// @route  GET /api/dashboard/admin
// @access Admin
const getAdminDashboard = async (req, res) => {
  const h = { hostel: req.hostelId }; // hostel filter shorthand

  const [
    totalStudents, activeStudents,
    totalRooms, occupiedRooms, availableRooms, maintenanceRooms,
    totalWardens,
    openComplaints, inProgressComplaints, resolvedComplaints,
    pendingLeaves,
    pendingPayments, overduePayments,
    totalRevenue,
    recentComplaints,
    monthlyRevenue,
  ] = await Promise.all([
    Student.countDocuments({ ...h }),
    Student.countDocuments({ ...h, status: 'active' }),
    Room.countDocuments({ ...h }),
    Room.countDocuments({ ...h, status: 'full' }),
    Room.countDocuments({ ...h, status: 'available' }),
    Room.countDocuments({ ...h, status: 'maintenance' }),
    User.countDocuments({ ...h, role: 'warden' }),
    Complaint.countDocuments({ ...h, status: 'open' }),
    Complaint.countDocuments({ ...h, status: 'in-progress' }),
    Complaint.countDocuments({ ...h, status: 'resolved' }),
    Leave.countDocuments({ ...h, status: 'pending' }),
    Payment.countDocuments({ ...h, status: 'pending' }),
    Payment.countDocuments({ ...h, status: 'overdue' }),
    Payment.aggregate([
      { $match: { hostel: req.hostelId, status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Complaint.find({ ...h })
      .populate({ path: 'student', populate: { path: 'user', select: 'name' } })
      .sort({ createdAt: -1 })
      .limit(3),
    Payment.aggregate([
      { $match: { hostel: req.hostelId, status: 'paid', year: new Date().getFullYear() } },
      { $group: { _id: '$month', total: { $sum: '$amount' } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Occupancy — scoped to this hostel
  const [totalCapacityResult, totalOccupantsResult] = await Promise.all([
    Room.aggregate([{ $match: h }, { $group: { _id: null, total: { $sum: '$capacity' } } }]),
    Room.aggregate([{ $match: h }, { $group: { _id: null, total: { $sum: { $size: '$occupants' } } } }]),
  ]);
  const totalCapacity = totalCapacityResult[0]?.total || 0;
  const totalOccupants = totalOccupantsResult[0]?.total || 0;

  res.json({
    success: true,
    data: {
      students: { total: totalStudents, active: activeStudents },
      rooms: {
        total: totalRooms, occupied: occupiedRooms,
        available: availableRooms, maintenance: maintenanceRooms,
        occupancyRate: totalCapacity > 0 ? Math.round((totalOccupants / totalCapacity) * 100) : 0,
        totalCapacity, totalOccupants,
      },
      wardens: totalWardens,
      complaints: { open: openComplaints, inProgress: inProgressComplaints, resolved: resolvedComplaints },
      leaves: { pending: pendingLeaves },
      payments: {
        pending: pendingPayments,
        overdue: overduePayments,
        totalRevenue: totalRevenue[0]?.total || 0,
      },
      recentActivity: recentComplaints,
      monthlyRevenue,
    },
  });
};

// ─── STUDENT DASHBOARD ────────────────────────────────────────────────────────
// @route  GET /api/dashboard/student
// @access Student
const getStudentDashboard = async (req, res) => {
  const student = await Student.findOne({ user: req.user._id, hostel: req.hostelId })
    .populate('room', 'roomNumber floor block type amenities monthlyRent')
    .populate('user', 'name email');

  const [myComplaints, myLeaves, myPayments, recentNotices] = await Promise.all([
    Complaint.find({ student: student?._id, hostel: req.hostelId })
      .sort({ createdAt: -1 }).limit(5),
    Leave.find({ student: student?._id, hostel: req.hostelId })
      .sort({ createdAt: -1 }).limit(5),
    Payment.find({ student: student?._id, hostel: req.hostelId })
      .sort({ createdAt: -1 }).limit(5),
    Notice.find({ hostel: req.hostelId, isActive: true })
      .sort({ isPinned: -1, createdAt: -1 }).limit(5)
      .populate('postedBy', 'name'),
  ]);

  res.json({
    success: true,
    data: {
      student,
      stats: {
        openComplaints:  myComplaints.filter(c => c.status === 'open').length,
        pendingLeave:    myLeaves.filter(l => l.status === 'pending').length,
        pendingFees:     myPayments.filter(p => ['pending','overdue'].includes(p.status)).length,
        attendance:      student?.attendance || 0,
      },
      recentComplaints: myComplaints,
      recentLeaves:     myLeaves,
      recentPayments:   myPayments,
      recentNotices,
    },
  });
};

// ─── WARDEN DASHBOARD ─────────────────────────────────────────────────────────
// @route  GET /api/dashboard/warden
// @access Warden
const getWardenDashboard = async (req, res) => {
  const h = { hostel: req.hostelId };

  const [
    totalStudents,
    openComplaints, inProgressComplaints,
    pendingLeaves,
    roomStats,
    recentComplaints,
    recentLeaves,
  ] = await Promise.all([
    Student.countDocuments({ ...h, status: 'active' }),
    Complaint.countDocuments({ ...h, status: 'open' }),
    Complaint.countDocuments({ ...h, status: 'in-progress' }),
    Leave.countDocuments({ ...h, status: 'pending' }),
    Room.aggregate([
      { $match: h },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Complaint.find({ ...h, status: { $in: ['open', 'in-progress'] } })
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
      .populate('room', 'roomNumber')
      .sort({ priority: -1, createdAt: -1 })
      .limit(5),
    Leave.find({ ...h, status: 'pending' })
      .populate({ path: 'student', populate: { path: 'user', select: 'name email' } })
      .sort({ createdAt: -1 })
      .limit(5),
  ]);

  res.json({
    success: true,
    data: {
      students: totalStudents,
      complaints: { open: openComplaints, inProgress: inProgressComplaints },
      leaves: { pending: pendingLeaves },
      roomStats,
      recentComplaints,
      recentLeaves,
    },
  });
};

module.exports = { getAdminDashboard, getStudentDashboard, getWardenDashboard };