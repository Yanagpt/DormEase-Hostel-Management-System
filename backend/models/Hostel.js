const mongoose = require('mongoose');

const hostelSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Hostel name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters'],
  },
  code: {
    type: String,
    unique: true,
    uppercase: true,
    trim: true,
    maxlength: 10,
    default: null,   // auto-generated on approval
  },
  address: {
    street:  { type: String, trim: true },
    city:    { type: String, trim: true },
    state:   { type: String, trim: true },
    pincode: { type: String, trim: true },
  },
  phone:    { type: String, trim: true },
  email:    { type: String, trim: true, lowercase: true },
  type: {
    type: String,
    enum: ['boys', 'girls', 'co-ed'],
    default: 'co-ed',
  },
  // Registration / approval workflow
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
  rejectionReason: { type: String, default: '' },

  // Operational status (only meaningful when approved)
  status: {
    type: String,
    enum: ['active', 'inactive', 'suspended'],
    default: 'inactive',
  },

  // Contact person who submitted the registration
  contactName:  { type: String, trim: true },
  contactEmail: { type: String, trim: true, lowercase: true },
  contactPhone: { type: String, trim: true },

  // The admin user assigned to this hostel
  admin: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null,
  },

  totalRooms:    { type: Number, default: 0 },
  totalCapacity: { type: Number, default: 0 },
  description:   { type: String, default: '' },
  establishedYear: { type: Number },
  amenities:     [{ type: String }],
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true },
});

hostelSchema.index({ approvalStatus: 1 });
hostelSchema.index({ status: 1 });

module.exports = mongoose.model('Hostel', hostelSchema);
