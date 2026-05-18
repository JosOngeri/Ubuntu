const mongoose = require('mongoose');

const assetSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, enum: ['uniform', 'tool', 'ppe', 'equipment', 'other'], required: true },
  description: { type: String },
  serialNumber: { type: String },
  condition: { type: String, enum: ['new', 'good', 'fair', 'poor'], default: 'new' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
  assignedDate: { type: Date },
  returnDate: { type: Date },
  returnCondition: { type: String },
  status: { type: String, enum: ['available', 'assigned', 'returned', 'lost', 'damaged'], default: 'available' },
  notes: { type: String },
}, { timestamps: true });

assetSchema.index({ type: 1, status: 1 });
assetSchema.index({ assignedTo: 1 });

module.exports = mongoose.model('Asset', assetSchema);
