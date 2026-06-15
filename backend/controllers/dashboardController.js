const User = require('../models/User');
const Student = require('../models/Student');
const Room = require('../models/Room');
const Complaint = require('../models/Complaint');
const Leave = require('../models/Leave');
const Payment = require('../models/Payment');
const Notice = require('../models/Notice');

// @desc    Admin dashboard stats
// @route   GET /api/dashboard/admin
const getAdminDashboard = async (req, res) => {
  const [
    totalStudents, activeStudents,
    totalRooms, occupiedRooms, availableRooms, maintenanceRooms,
    totalWardens,
    openComplaints, inProgressComplaints, resolvedComplaints,
    pendingLeaves,
    pendingPayments, overduePayments,
    totalRevenue,
    recentActivity,
    monthlyRevenue,
  ] = await Promise.all([
    Student.countDocuments(),
    Student.countDocuments({ status: 'active' }),
    Room.countDocuments(),
    Room.countDocuments({ status: 'full' }),
    Room.countDocuments({ status: 'available' }),
    Room.countDocuments({ status: 'maintenance' }),
    User.countDocuments({ role: 'warden' }),
    Complaint.countDocuments({ status: 'open' }),
    Complaint.countDocuments({ status: 'in-progress' }),
    Complaint.countDocuments({ status: 'resolved' }),
    Leave.countDocuments({ status: 'pending' }),
    Payment.countDocuments({ status: 'pending' }),
    Payment.countDocuments({ status: 'overdue' }),
    Payment.aggregate([{ $match: { status: 'paid' } }, { $group: { _id: null, total: { $sum: '$amount' } } }]),
    // Recent activity: last 5 complaints + leaves
    Complaint.find().populate('student', 'name').sort({ createdAt: -1 }).limit(3),
    // Monthly revenue for current year
    Payment.aggregate([
      { $match: { status: 'paid', year: new Date().getFullYear() } },
      { $group: { _id: '$month', total: { $sum: '$amount' } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  // Occupancy rate
  const totalCapacityResult = await Room.aggregate([{ $group: { _id: null, total: { $sum: '$capacity' } } }]);
  const totalOccupantsResult = await Room.aggregate([{ $group: { _id: null, total: { $sum: { $size: '$occupants' } } } }]);
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
      recentActivity,
      monthlyRevenue,
    },
  });
};

// @desc    Student dashboard stats
// @route   GET /api/dashboard/student
const getStudentDashboard = async (req, res) => {
  const student = await Student.findOne({ user: req.user._id })
    .populate('room', 'roomNumber floor block type amenities monthlyRent')
    .populate('user', 'name email');

  const [myComplaints, myLeaves, myPayments, recentNotices] = await Promise.all([
    Complaint.find({ student: req.user._id }).sort({ createdAt: -1 }).limit(5),
    Leave.find({ student: req.user._id }).sort({ createdAt: -1 }).limit(5),
    Payment.find({ student: req.user._id }).sort({ createdAt: -1 }).limit(5),
    Notice.find({ isActive: true }).sort({ isPinned: -1, createdAt: -1 }).limit(5)
      .populate('postedBy', 'name'),
  ]);

  const openComplaints = myComplaints.filter(c => c.status === 'open').length;
  const pendingLeave = myLeaves.filter(l => l.status === 'pending').length;
  const pendingFees = myPayments.filter(p => p.status === 'pending' || p.status === 'overdue').length;

  res.json({
    success: true,
    data: {
      student,
      stats: {
        openComplaints,
        pendingLeave,
        pendingFees,
        attendance: student?.attendance || 0,
      },
      recentComplaints: myComplaints,
      recentLeaves: myLeaves,
      recentPayments: myPayments,
      recentNotices,
    },
  });
};

// @desc    Warden dashboard
// @route   GET /api/dashboard/warden
const getWardenDashboard = async (req, res) => {
  const [
    totalStudents,
    openComplaints, inProgressComplaints,
    pendingLeaves,
    roomStats,
    recentComplaints,
    recentLeaves,
  ] = await Promise.all([
    Student.countDocuments({ status: 'active' }),
    Complaint.countDocuments({ status: 'open' }),
    Complaint.countDocuments({ status: 'in-progress' }),
    Leave.countDocuments({ status: 'pending' }),
    Room.aggregate([
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Complaint.find({ status: { $in: ['open', 'in-progress'] } })
      .populate('student', 'name email')
      .populate('room', 'roomNumber')
      .sort({ priority: -1, createdAt: -1 })
      .limit(5),
    Leave.find({ status: 'pending' })
      .populate('student', 'name email')
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
