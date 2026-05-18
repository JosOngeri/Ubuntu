const mongoose = require('mongoose');

const dailyLabourerSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String },
  idNumber: { type: String },
  photo: { type: String },
  skills: [{ type: String }],
  dailyRate: { type: Number, required: true, default: 500 },
  status: { type: String, enum: ['active', 'inactive', 'converted'], default: 'active' },
  convertedToEmployeeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  registeredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  notes: { type: String },
}, { timestamps: true });

dailyLabourerSchema.index({ status: 1 });
dailyLabourerSchema.index({ skills: 1 });

module.exports = mongoose.model('DailyLabourer', dailyLabourerSchema);
