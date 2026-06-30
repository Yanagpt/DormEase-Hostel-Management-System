const mongoose = require('mongoose');

const leaveSchema = new mongoose.Schema({
  hostel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true,
    index: true,
  },

  leaveId: {
    type: String,
    unique: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  fromDate: {
    type: Date,
    required: [true, 'From date is required'],
  },
  toDate: {
    type: Date,
    required: [true, 'To date is required'],
  },
  reason: {
    type: String,
    required: [true, 'Reason is required'],
    trim: true,
    maxlength: [1000, 'Reason cannot exceed 1000 characters'],
  },
  leaveType: {
    type: String,
    enum: ['home-visit', 'medical', 'emergency', 'academic', 'personal', 'other'],
    default: 'personal',
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'cancelled'],
    default: 'pending',
  },
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  approvalNote: {
    type: String,
    trim: true,
  },
  approvedAt: Date,
  contactDuringLeave: {
    phone: String,
    address: String,
  },
  supportingDocument: String,
  totalDays: Number,
}, {
  timestamps: true,
});

// Auto-generate leave ID and calculate days
leaveSchema.pre('save', async function (next) {
  if (!this.leaveId) {
    const count = await mongoose.model('Leave').countDocuments();
    this.leaveId = `L${String(count + 1).padStart(4, '0')}`;
  }
  if (this.fromDate && this.toDate) {
    const diff = this.toDate - this.fromDate;
    this.totalDays = Math.ceil(diff / (1000 * 60 * 60 * 24)) + 1;
  }
  if (this.isModified('status') && (this.status === 'approved' || this.status === 'rejected')) {
    this.approvedAt = new Date();
  }
  next();
});

// Validation: toDate must be after fromDate
leaveSchema.pre('save', function (next) {
  if (this.toDate < this.fromDate) {
    next(new Error('To date must be after or equal to from date'));
  }
  next();
});

// Indexes
leaveSchema.index({ student: 1, status: 1 });
leaveSchema.index({ fromDate: 1, toDate: 1 });
leaveSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Leave', leaveSchema);
