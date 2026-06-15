const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  complaintId: {
    type: String,
    unique: true,
  },
  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  room: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Room',
  },
  title: {
    type: String,
    required: [true, 'Complaint title is required'],
    trim: true,
    maxlength: [200, 'Title cannot exceed 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: ['electrical', 'plumbing', 'furniture', 'network', 'cleaning', 'security', 'mess', 'other'],
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['open', 'in-progress', 'resolved', 'closed', 'rejected'],
    default: 'open',
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  images: [String],
  timeline: [{
    status: String,
    note: String,
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    updatedAt: { type: Date, default: Date.now },
  }],
  resolvedAt: Date,
  resolutionNote: String,
  rating: {
    score: { type: Number, min: 1, max: 5 },
    comment: String,
    ratedAt: Date,
  },
}, {
  timestamps: true,
});

// Auto-generate complaint ID
complaintSchema.pre('save', async function (next) {
  if (!this.complaintId) {
    const count = await mongoose.model('Complaint').countDocuments();
    this.complaintId = `C${String(count + 1).padStart(4, '0')}`;
  }
  if (this.isModified('status')) {
    this.timeline.push({
      status: this.status,
      updatedAt: new Date(),
    });
    if (this.status === 'resolved') {
      this.resolvedAt = new Date();
    }
  }
  next();
});

// Indexes
complaintSchema.index({ student: 1, status: 1 });
complaintSchema.index({ status: 1, priority: 1 });
complaintSchema.index({ complaintId: 1 });
complaintSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
