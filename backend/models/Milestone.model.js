const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  quoteId: { type: mongoose.Schema.Types.ObjectId, ref: 'ContractorQuote', required: true },
  contractorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title: { type: String, required: true },
  description: { type: String },
  deliverables: { type: String, required: true },
  deadline: { type: Date, required: true },
  budget: { type: Number, required: true },
  materialsRequest: [{
    item: { type: String },
    quantity: { type: Number },
    unit: { type: String },
    estimatedCost: { type: Number },
    approved: { type: Boolean, default: false },
  }],
  labourRequest: [{
    skillRequired: { type: String },
    numberOfWorkers: { type: Number },
    daysNeeded: { type: Number },
    dailyRate: { type: Number },
    approved: { type: Boolean, default: false },
  }],
  downpaymentRequest: { type: Number, default: 0 },
  downpaymentApproved: { type: Boolean, default: false },
  downpaymentPaid: { type: Boolean, default: false },
  progress: { type: Number, default: 0, min: 0, max: 100 },
  photos: [{ type: String }],
  receipts: [{ type: String }],
  status: { type: String, enum: ['pending', 'in_progress', 'submitted', 'verified', 'rejected'], default: 'pending' },
  verifiedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  verifiedAt: { type: Date },
  kpiScore: {
    timeliness: { type: Number },
    budgetAdherence: { type: Number },
    quality: { type: Number },
    overall: { type: Number },
  },
  paymentReleased: { type: Boolean, default: false },
  paymentAmount: { type: Number },
  paymentDate: { type: Date },
  dailyWageMode: { type: Boolean, default: false },
  dailyWageDays: [{
    date: { type: Date },
    labourersAssigned: [{ type: mongoose.Schema.Types.ObjectId, ref: 'DailyLabourer' }],
    workDone: { type: String },
    wageForDay: { type: Number },
  }],
  notes: { type: String },
}, { timestamps: true });

milestoneSchema.index({ quoteId: 1 });
milestoneSchema.index({ contractorId: 1 });
milestoneSchema.index({ status: 1 });

module.exports = mongoose.model('Milestone', milestoneSchema);
