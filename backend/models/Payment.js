const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  receiptNumber: {
    type: String,
    unique: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  amount: {
    type: Number,
    required: [true, 'Amount is required'],
    min: [0, 'Amount cannot be negative'],
  },
  feeType: {
    type: String,
    enum: ['hostel-fee', 'mess-fee', 'maintenance-fee', 'security-deposit', 'fine', 'other'],
    default: 'hostel-fee',
  },
  month: {
    type: Number,
    min: 1,
    max: 12,
  },
  year: {
    type: Number,
  },
  dueDate: {
    type: Date,
  },
  paidDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['paid', 'pending', 'overdue', 'waived'],
    default: 'pending',
  },
  paymentMethod: {
    type: String,
    enum: ['cash', 'online', 'upi', 'bank-transfer', 'cheque', 'dd'],
    default: 'online',
  },
  transactionId: {
    type: String,
    trim: true,
  },
  remarks: {
    type: String,
    trim: true,
  },
  recordedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  lateFee: {
    type: Number,
    default: 0,
  },
}, {
  timestamps: true,
});

// Auto-generate receipt number
paymentSchema.pre('save', async function (next) {
  if (!this.receiptNumber) {
    const count = await mongoose.model('Payment').countDocuments();
    const year = new Date().getFullYear();
    this.receiptNumber = `RCP-${year}-${String(count + 1).padStart(5, '0')}`;
  }
  if (this.status === 'paid' && !this.paidDate) {
    this.paidDate = new Date();
  }
  // Auto mark overdue
  if (this.status === 'pending' && this.dueDate && new Date() > this.dueDate) {
    this.status = 'overdue';
  }
  next();
});

// Indexes
paymentSchema.index({ student: 1, status: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ dueDate: 1 });
paymentSchema.index({ receiptNumber: 1 });

module.exports = mongoose.model('Payment', paymentSchema);
