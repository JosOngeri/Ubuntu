const mongoose = require('mongoose');

const onboardingSchema = new mongoose.Schema({
  employeeId: { type: String, required: true },
  applicationId: { type: String },
  status: { type: String, enum: ['pending', 'in_progress', 'completed'], default: 'pending' },
  steps: [{
    name: { type: String, required: true },
    label: { type: String, required: true },
    completed: { type: Boolean, default: false },
    completedAt: { type: Date },
    completedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    notes: { type: String },
  }],
  offerLetterGenerated: { type: Boolean, default: false },
  offerLetterUrl: { type: String },
  offerAccepted: { type: Boolean, default: false },
  documents: [{
    name: { type: String },
    type: { type: String },
    url: { type: String },
    uploadedAt: { type: Date },
    verified: { type: Boolean, default: false },
  }],
  department: { type: String },
  position: { type: String },
  supervisorId: { type: String },
  assetsAssigned: [{
    assetId: { type: mongoose.Schema.Types.ObjectId, ref: 'Asset' },
    assignedAt: { type: Date },
    condition: { type: String },
  }],
  trainingScheduled: { type: Date },
  trainingCompleted: { type: Boolean, default: false },
  probationEndDate: { type: Date },
  probationReviews: [{
    reviewDate: { type: Date },
    reviewerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    score: { type: Number },
    comments: { type: String },
    recommendation: { type: String, enum: ['extend', 'confirm', 'terminate'] },
  }],
  confirmedAt: { type: Date },
  confirmedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

onboardingSchema.index({ employeeId: 1 });
onboardingSchema.index({ status: 1 });

module.exports = mongoose.model('Onboarding', onboardingSchema);
