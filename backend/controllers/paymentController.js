const Payment = require('../models/Payment');
const Student = require('../models/Student');
const { paginate, paginatedResponse } = require('../utils/pagination');

const getPayments = async (req, res) => {
  const { skip, limit, page } = paginate(req.query);
  const { status, feeType, search, month, year } = req.query;

  const filter = {};
  if (status) filter.status = status;
  if (feeType) filter.feeType = feeType;
  if (month) filter.month = Number(month);
  if (year) filter.year = Number(year);

  if (req.user.role === 'student') {
    filter.student = req.user._id;
  }

  if (search) {
    const users = await require('../models/User').find({
      name: { $regex: search, $options: 'i' }, role: 'student',
    }).select('_id');
    filter.$or = [
      { student: { $in: users.map(u => u._id) } },
      { receiptNumber: { $regex: search, $options: 'i' } },
    ];
  }

  const [payments, total] = await Promise.all([
    Payment.find(filter)
      .populate('student', 'name email')
      .populate('recordedBy', 'name')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    Payment.countDocuments(filter),
  ]);

  res.json({ success: true, ...paginatedResponse(payments, total, page, limit) });
};

const getPayment = async (req, res) => {
  const payment = await Payment.findById(req.params.id)
    .populate('student', 'name email phone')
    .populate('recordedBy', 'name');
  if (!payment) return res.status(404).json({ success: false, message: 'Payment record not found.' });

  if (req.user.role === 'student' && payment.student._id.toString() !== req.user._id.toString()) {
    return res.status(403).json({ success: false, message: 'Access denied.' });
  }
  res.json({ success: true, data: payment });
};

const createPayment = async (req, res) => {
  const { studentId, amount, feeType, month, year, dueDate, paymentMethod, transactionId, remarks } = req.body;

  const payment = await Payment.create({
    student: studentId,
    amount,
    feeType: feeType || 'hostel-fee',
    month, year,
    dueDate,
    status: 'pending',
    paymentMethod,
    transactionId,
    remarks,
    recordedBy: req.user._id,
  });

  await payment.populate('student', 'name email');
  res.status(201).json({ success: true, message: 'Payment record created.', data: payment });
};

const markPaymentPaid = async (req, res) => {
  const { paymentMethod, transactionId, remarks } = req.body;
  const payment = await Payment.findById(req.params.id);
  if (!payment) return res.status(404).json({ success: false, message: 'Payment not found.' });
  if (payment.status === 'paid') {
    return res.status(400).json({ success: false, message: 'Payment already marked as paid.' });
  }

  payment.status = 'paid';
  payment.paidDate = new Date();
  payment.recordedBy = req.user._id;
  if (paymentMethod) payment.paymentMethod = paymentMethod;
  if (transactionId) payment.transactionId = transactionId;
  if (remarks) payment.remarks = remarks;

  await payment.save();

  // Update student fee status if all current period payments are paid
  const studentPendingPayments = await Payment.countDocuments({
    student: payment.student,
    status: { $in: ['pending', 'overdue'] },
  });

  if (studentPendingPayments === 0) {
    await Student.findOneAndUpdate({ user: payment.student }, { feeStatus: 'paid' });
  }

  await payment.populate('student', 'name email');
  res.json({ success: true, message: 'Payment marked as paid.', data: payment });
};

const getPaymentStats = async (req, res) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  const [totalCollected, pending, overdue, monthlyStats] = await Promise.all([
    Payment.aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]),
    Payment.aggregate([
      { $match: { status: 'pending' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { status: 'overdue' } },
      { $group: { _id: null, total: { $sum: '$amount' }, count: { $sum: 1 } } },
    ]),
    Payment.aggregate([
      { $match: { status: 'paid', year: currentYear } },
      { $group: { _id: '$month', total: { $sum: '$amount' }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]),
  ]);

  res.json({
    success: true,
    data: {
      totalCollected: totalCollected[0]?.total || 0,
      pending: { amount: pending[0]?.total || 0, count: pending[0]?.count || 0 },
      overdue: { amount: overdue[0]?.total || 0, count: overdue[0]?.count || 0 },
      monthlyStats,
    },
  });
};

module.exports = { getPayments, getPayment, createPayment, markPaymentPaid, getPaymentStats };
