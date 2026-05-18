const mongoose = require('mongoose');

const KPISchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: String,
  target: Number,
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('KPI', KPISchema);
