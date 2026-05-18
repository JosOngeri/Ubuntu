const mongoose = require('mongoose');

const dailyAttendanceSchema = new mongoose.Schema({
  labourerId: { type: mongoose.Schema.Types.ObjectId, ref: 'DailyLabourer', required: true },
  date: { type: Date, required: true },
  checkIn: { type: Date },
  checkOut: { type: Date },
  status: { type: String, enum: ['present', 'absent', 'half-day'], default: 'present' },
  assignedTo: { type: String, enum: ['farm', 'housekeeping', 'grounds', 'construction', 'kitchen', 'other'], default: 'other' },
  assignedContractorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  assignedMilestoneId: { type: mongoose.Schema.Types.ObjectId, ref: 'Milestone' },
  wageForDay: { type: Number },
  recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
}, { timestamps: true });

dailyAttendanceSchema.index({ labourerId: 1, date: 1 }, { unique: true });
dailyAttendanceSchema.index({ date: 1 });
dailyAttendanceSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('DailyAttendance', dailyAttendanceSchema);
