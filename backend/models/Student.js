const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true,
  },
  rollNumber: {
    type: String,
    required: [true, 'Roll number is required'],
    trim: true,
    uppercase: true,
  },
  course: {
    type: String,
    required: [true, 'Course is required'],
    trim: true,
  },
  year: {
    type: Number,
    min: 1,
    max: 6,
    default: 1,
  },
  department: {
    type: String,
    trim: true,
  },
  dateOfBirth: {
    type: Date,
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'other'],
  },
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' },
  },
  parentName: {
    type: String,
    trim: true,
  },
  parentPhone: {
    type: String,
    trim: true,
  },
  parentEmail: {
    type: String,
    lowercase: true,
  },
  emergencyContact: {
    name: String,
    phone: String,
    relation: String,
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
    default: null,
  },
  admissionDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'graduated', 'suspended'],
    default: 'active',
  },
  feeStatus: {
    type: String,
    enum: ['paid', 'pending', 'overdue'],
    default: 'pending',
  },
  attendance: {
    type: Number,
    min: 0,
    max: 100,
    default: 100,
  },
  idCard: {
    type: String,
    default: '',
  },
  hostel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true,
    index: true,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Indexes
studentSchema.index({ hostel: 1, rollNumber: 1 }, { unique: true });
studentSchema.index({ room: 1 });
studentSchema.index({ status: 1 });

module.exports = mongoose.model('Student', studentSchema);
