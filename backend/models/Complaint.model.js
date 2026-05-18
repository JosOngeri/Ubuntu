const mongoose = require('mongoose');

const complaintSchema = new mongoose.Schema({
  type: { type: String, enum: ['guest', 'employee'], required: true },
  category: { type: String, required: true },
  subCategory: { type: String },
  description: { type: String, required: true },
  urgency: { type: String, enum: ['low', 'medium', 'high', 'critical'], default: 'medium' },
  status: { type: String, enum: ['open', 'acknowledged', 'investigating', 'resolved', 'closed'], default: 'open' },
  submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  submittedOnBehalfOf: { type: String },
  guestName: { type: String },
  guestContact: { type: String },
  guestRoom: { type: String },
  respondentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  department: { type: String },
  timeline: [{
    action: { type: String, required: true },
    notes: { type: String },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    timestamp: { type: Date, default: Date.now },
  }],
  resolution: { type: String },
  resolutionDate: { type: Date },
  complainantConfirmed: { type: Boolean, default: false },
  slaDeadline: { type: Date },
  attachments: [{ type: String }],
}, { timestamps: true });

complaintSchema.index({ type: 1, status: 1 });
complaintSchema.index({ assignedTo: 1 });
complaintSchema.index({ urgency: 1 });
complaintSchema.index({ createdAt: -1 });

module.exports = mongoose.model('Complaint', complaintSchema);
