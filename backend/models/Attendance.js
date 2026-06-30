const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
  hostel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Hostel',
    required: true,
    index: true,
  },

  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Student',
    required: true,
  },
  date: {
    type: String, // stored as YYYY-MM-DD string for easy querying
    required: true,
  },
  status: {
    type: String,
    enum: ['present', 'absent', 'late', 'leave'],
    required: true,
  },
  markedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  note: {
    type: String,
    default: '',
    maxlength: 200,
  },
}, {
  timestamps: true,
});

// One record per student per date
attendanceSchema.index({ student: 1, date: 1 }, { unique: true });
attendanceSchema.index({ date: 1 });

module.exports = mongoose.model('Attendance', attendanceSchema);
