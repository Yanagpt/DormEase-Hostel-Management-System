const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const User = require('../models/User');

// Helper: today's date as YYYY-MM-DD in local time
function toDateStr(date = new Date()) {
  return date.toISOString().slice(0, 10);
}

// Helper: get first and last day of a month as date strings
function monthRange(year, month) {
  const from = `${year}-${String(month).padStart(2, '0')}-01`;
  const last = new Date(year, month, 0).getDate();
  const to = `${year}-${String(month).padStart(2, '0')}-${String(last).padStart(2, '0')}`;
  return { from, to };
}

// ─── GET ALL STUDENTS WITH TODAY'S ATTENDANCE STATUS ─────────────────────────
// @route  GET /api/attendance/today
// @access Warden, Admin
const getTodayAttendance = async (req, res) => {
  const today = toDateStr();

  const students = await Student.find({ status: 'active' })
    .populate('user', 'name email avatar')
    .populate('room', 'roomNumber block')
    .sort({ rollNumber: 1 })
    .lean();

  const records = await Attendance.find({ date: today })
    .lean();

  const recordMap = {};
  records.forEach(r => { recordMap[r.student.toString()] = r; });

  const result = students.map(s => ({
    studentId: s._id,
    rollNumber: s.rollNumber,
    name: s.user?.name,
    avatar: s.user?.avatar,
    room: s.room ? `${s.room.roomNumber} / ${s.room.block}` : 'Unassigned',
    status: recordMap[s._id.toString()]?.status || null,
    note: recordMap[s._id.toString()]?.note || '',
    marked: !!recordMap[s._id.toString()],
  }));

  const summary = {
    total: result.length,
    present: result.filter(r => r.status === 'present').length,
    absent: result.filter(r => r.status === 'absent').length,
    late: result.filter(r => r.status === 'late').length,
    leave: result.filter(r => r.status === 'leave').length,
    unmarked: result.filter(r => !r.marked).length,
  };

  res.json({ success: true, date: today, summary, data: result });
};

// ─── MARK / UPDATE SINGLE STUDENT ATTENDANCE ─────────────────────────────────
// @route  POST /api/attendance/mark
// @access Warden, Admin
const markAttendance = async (req, res) => {
  const { studentId, status, date, note } = req.body;

  if (!studentId || !status) {
    return res.status(400).json({ success: false, message: 'studentId and status are required.' });
  }
  if (!['present', 'absent', 'late', 'leave'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }

  const targetDate = date || toDateStr();

  const record = await Attendance.findOneAndUpdate(
    { student: studentId, date: targetDate },
    { status, note: note || '', markedBy: req.user.id, date: targetDate, student: studentId },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  ).populate('markedBy', 'name role');

  res.json({ success: true, message: 'Attendance marked.', data: record });
};

// ─── BULK MARK ATTENDANCE (mark all at once) ──────────────────────────────────
// @route  POST /api/attendance/bulk
// @access Warden, Admin
// Body: { date: 'YYYY-MM-DD', records: [{ studentId, status, note }] }
const bulkMarkAttendance = async (req, res) => {
  const { date, records } = req.body;

  if (!records || !Array.isArray(records) || records.length === 0) {
    return res.status(400).json({ success: false, message: 'records array is required.' });
  }

  const targetDate = date || toDateStr();
  const markedBy = req.user.id;

  const ops = records.map(({ studentId, status, note }) => ({
    updateOne: {
      filter: { student: studentId, date: targetDate },
      update: { $set: { student: studentId, date: targetDate, status, note: note || '', markedBy } },
      upsert: true,
    },
  }));

  await Attendance.bulkWrite(ops);

  // Recompute attendance % for each student (last 30 days)
  const studentIds = records.map(r => r.studentId);
  await recomputeAttendance(studentIds);

  const summary = records.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] || 0) + 1;
    return acc;
  }, {});

  res.json({
    success: true,
    message: `Attendance saved for ${records.length} students.`,
    summary,
  });
};

// ─── GET ATTENDANCE FOR A SPECIFIC DATE ───────────────────────────────────────
// @route  GET /api/attendance/date/:date
// @access Warden, Admin
const getAttendanceByDate = async (req, res) => {
  const { date } = req.params;

  const records = await Attendance.find({ date })
    .populate({ path: 'student', populate: { path: 'user', select: 'name avatar' }, select: 'rollNumber room user' })
    .populate('markedBy', 'name role')
    .lean();

  res.json({ success: true, date, total: records.length, data: records });
};

// ─── GET MONTHLY ATTENDANCE FOR ONE STUDENT ───────────────────────────────────
// @route  GET /api/attendance/student/:studentId?month=M&year=YYYY
// @access Warden, Admin, Student (own only)
const getStudentAttendance = async (req, res) => {
  const { studentId } = req.params;
  const month = parseInt(req.query.month) || new Date().getMonth() + 1;
  const year  = parseInt(req.query.year)  || new Date().getFullYear();

  // Students can only see their own
  if (req.user.role === 'student') {
    const myStudent = await Student.findOne({ user: req.user.id });
    if (!myStudent || myStudent._id.toString() !== studentId) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
  }

  const { from, to } = monthRange(year, month);

  const records = await Attendance.find({
    student: studentId,
    date: { $gte: from, $lte: to },
  }).sort({ date: 1 }).lean();

  // Build a full calendar for the month
  const last = new Date(year, month, 0).getDate();
  const calendar = [];
  for (let d = 1; d <= last; d++) {
    const dateStr = `${year}-${String(month).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const rec = records.find(r => r.date === dateStr);
    const dayOfWeek = new Date(dateStr).getDay();
    calendar.push({
      date: dateStr,
      day: d,
      dayOfWeek,
      status: rec?.status || null,
      note: rec?.note || '',
    });
  }

  const counted = records.filter(r => r.status !== null);
  const present = counted.filter(r => r.status === 'present' || r.status === 'late').length;
  const percentage = counted.length > 0 ? Math.round((present / counted.length) * 100) : null;

  res.json({
    success: true,
    month, year,
    percentage,
    summary: {
      present: records.filter(r => r.status === 'present').length,
      late: records.filter(r => r.status === 'late').length,
      absent: records.filter(r => r.status === 'absent').length,
      leave: records.filter(r => r.status === 'leave').length,
      total: counted.length,
    },
    calendar,
  });
};

// ─── GET MONTHLY OVERVIEW FOR ALL STUDENTS ────────────────────────────────────
// @route  GET /api/attendance/overview?month=M&year=YYYY
// @access Admin, Warden
const getMonthlyOverview = async (req, res) => {
  const month = parseInt(req.query.month) || new Date().getMonth() + 1;
  const year  = parseInt(req.query.year)  || new Date().getFullYear();
  const { from, to } = monthRange(year, month);

  const students = await Student.find({ status: 'active' })
    .populate('user', 'name avatar')
    .populate('room', 'roomNumber block')
    .sort({ rollNumber: 1 })
    .lean();

  const allRecords = await Attendance.find({
    date: { $gte: from, $lte: to },
    student: { $in: students.map(s => s._id) },
  }).lean();

  const result = students.map(s => {
    const recs = allRecords.filter(r => r.student.toString() === s._id.toString());
    const counted = recs.length;
    const present = recs.filter(r => r.status === 'present' || r.status === 'late').length;
    const absent = recs.filter(r => r.status === 'absent').length;
    const late = recs.filter(r => r.status === 'late').length;
    const leave = recs.filter(r => r.status === 'leave').length;
    const pct = counted > 0 ? Math.round((present / counted) * 100) : null;
    return {
      studentId: s._id,
      rollNumber: s.rollNumber,
      name: s.user?.name,
      room: s.room ? `${s.room.roomNumber}/${s.room.block}` : '—',
      present, absent, late, leave,
      totalDays: counted,
      percentage: pct,
      attendance: s.attendance, // stored % on student doc
    };
  });

  res.json({ success: true, month, year, data: result });
};

// ─── HELPER: recompute attendance % on Student doc (last 30 days) ─────────────
async function recomputeAttendance(studentIds) {
  const since = toDateStr(new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));

  for (const id of studentIds) {
    const recs = await Attendance.find({ student: id, date: { $gte: since } }).lean();
    if (recs.length === 0) continue;
    const present = recs.filter(r => r.status === 'present' || r.status === 'late').length;
    const pct = Math.round((present / recs.length) * 100);
    await Student.updateOne({ _id: id }, { attendance: pct });
  }
}

module.exports = {
  getTodayAttendance, markAttendance, bulkMarkAttendance,
  getAttendanceByDate, getStudentAttendance, getMonthlyOverview,
};
