const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: {
    type: String,
    required: [true, 'Room number is required'],
    unique: true,
    trim: true,
    uppercase: true,
  },
  floor: {
    type: Number,
    required: [true, 'Floor is required'],
    min: 0,
    max: 20,
  },
  block: {
    type: String,
    trim: true,
    uppercase: true,
    default: 'A',
  },
  type: {
    type: String,
    enum: ['single', 'double', 'triple', 'quad', 'dormitory'],
    default: 'double',
  },
  capacity: {
    type: Number,
    required: [true, 'Capacity is required'],
    min: 1,
    max: 10,
  },
  status: {
    type: String,
    enum: ['available', 'full', 'maintenance', 'reserved'],
    default: 'available',
  },
  amenities: [{
    type: String,
    enum: [
      'ac',
      'wifi',
      'tv',
      'fridge',
      'wardrobe',
      'attached-bathroom',
      'balcony',
      'study-table',
    ],
  }],
  monthlyRent: {
    type: Number,
    required: [true, 'Monthly rent is required'],
    min: 0,
  },
  description: {
    type: String,
    trim: true,
  },
  images: [String],

  occupants: {
    type: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
    }],
    default: [],
  },

  warden: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },

  lastMaintenanceDate: Date,

  maintenanceHistory: [{
    description: String,
    date: {
      type: Date,
      default: Date.now,
    },
    resolvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    cost: Number,
  }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

// Virtual: occupancy rate
roomSchema.virtual('occupancyRate').get(function () {
  const occupants = this.occupants || [];

  return this.capacity > 0
    ? Math.round((occupants.length / this.capacity) * 100)
    : 0;
});

// Virtual: available beds
roomSchema.virtual('availableBeds').get(function () {
  const occupants = this.occupants || [];
  return Math.max(0, this.capacity - occupants.length);
});

// Auto-update status based on occupancy
roomSchema.pre('save', function (next) {
  const occupants = this.occupants || [];

  if (this.status !== 'maintenance' && this.status !== 'reserved') {
    this.status =
      occupants.length >= this.capacity ? 'full' : 'available';
  }

  next();
});

// Indexes
roomSchema.index({ roomNumber: 1 });
roomSchema.index({ status: 1 });
roomSchema.index({ floor: 1, block: 1 });

module.exports = mongoose.model('Room', roomSchema);