const mongoose = require('mongoose');

const PaymentSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
  amount: { type: Number, required: true },
  date: { type: Date, default: Date.now },
  transactionId: { type: String, required: true, unique: true },
  status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
  wageComponents: {
    dailyRate: Number,
    overtime: Number,
    extraTime: Number,
    kpiRaise: Number
  },
  notes: String
});

module.exports = mongoose.model('Payment', PaymentSchema);
