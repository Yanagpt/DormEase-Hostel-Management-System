const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
  },
  password: {
    type: String,
    minlength: [6, 'Password must be at least 6 characters'],
    select: false,
    default: null,
  },
  // Whether user has completed first-login password setup
  passwordSet: {
    type: Boolean,
    default: false,
  },
  role: {
    type: String,
    enum: ['superadmin', 'admin', 'warden', 'student'],
    default: 'student',
  },
  phone: {
    type: String,
    trim: true,
  },
  avatar: {
    type: String,
    default: '',
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  rejectionReason: {
    type: String,
    default: '',
  },
  // OTP fields
  otp: {
    type: String,
    select: false,
  },
  otpExpires: {
    type: Date,
    select: false,
  },
  lastLogin: {
    type: Date,
  },
  passwordChangedAt: Date,
  // Multi-tenant: which hostel this user belongs to (null for superadmin)
  hostel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    default: null,
  },
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual: student profile
userSchema.virtual('studentProfile', {
  ref: 'Student',
  localField: '_id',
  foreignField: 'user',
  justOne: true,
});

// Hash password before saving — only if modified and is plaintext
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  if (this.password.startsWith('$2')) return next(); // already hashed
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  if (!this.isNew) this.passwordChangedAt = Date.now() - 1000;
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// Generate JWT
userSchema.methods.generateToken = function () {
  return jwt.sign(
    { id: this._id, role: this.role, hostel: this.hostel },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Generate a short-lived OTP token (for first login / password setup confirmation)
userSchema.methods.generateOtpToken = function () {
  return jwt.sign(
    { id: this._id, purpose: 'otp_verified' },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

module.exports = mongoose.model('User', userSchema);
