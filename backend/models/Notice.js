const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: [300, 'Title cannot exceed 300 characters'],
  },
  body: {
    type: String,
    required: [true, 'Body is required'],
    trim: true,
    maxlength: [5000, 'Body cannot exceed 5000 characters'],
  },
  tag: {
    type: String,
    enum: ['important', 'maintenance', 'event', 'general', 'emergency', 'fees'],
    default: 'general',
  },
  postedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  targetAudience: {
    type: String,
    enum: ['all', 'students', 'wardens', 'specific-floor', 'specific-block'],
    default: 'all',
  },
  targetFloor: Number,
  targetBlock: String,
  isActive: {
    type: Boolean,
    default: true,
  },
  isPinned: {
    type: Boolean,
    default: false,
  },
  expiresAt: Date,
  attachments: [String],
  views: {
    type: Number,
    default: 0,
  },
  readBy: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    readAt: { type: Date, default: Date.now },
  }],
}, {
  timestamps: true,
});

// Indexes
noticeSchema.index({ isActive: 1, createdAt: -1 });
noticeSchema.index({ tag: 1, isActive: 1 });
noticeSchema.index({ isPinned: -1, createdAt: -1 });

module.exports = mongoose.model('Notice', noticeSchema);
