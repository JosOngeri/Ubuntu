const mongoose = require('mongoose');

const ContractSchema = new mongoose.Schema({
  employee: { type: String, required: true },
  title: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date },
  terms: String,
  status: { type: String, enum: ['active', 'terminated', 'expired'], default: 'active' },
  documentPath: { type: String },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Contract', ContractSchema);
