const mongoose = require('mongoose');

const contractorQuoteSchema = new mongoose.Schema({
  contractorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  projectTitle: { type: String, required: true },
  description: { type: String, required: true },
  amount: { type: Number, required: true },
  timeline: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'rejected', 'in_progress', 'completed'], default: 'pending' },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approvedAt: { type: Date },
  rejectionReason: { type: String },
  isDailyWage: { type: Boolean, default: false },
  dailyRate: { type: Number },
  estimatedDays: { type: Number },
  attachments: [{ type: String }],
  notes: { type: String },
}, { timestamps: true });

contractorQuoteSchema.index({ contractorId: 1 });
contractorQuoteSchema.index({ status: 1 });

module.exports = mongoose.model('ContractorQuote', contractorQuoteSchema);
