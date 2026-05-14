const ContractorQuote = require('../models/ContractorQuote.model');
const Milestone = require('../models/Milestone.model');

// Quotes
exports.getAllQuotes = async (req, res) => {
  try {
    const { status, contractorId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (contractorId) filter.contractorId = contractorId;
    const quotes = await ContractorQuote.find(filter)
      .populate('contractorId', 'firstName lastName email companyName')
      .populate('approvedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(quotes);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.createQuote = async (req, res) => {
  try {
    const quote = await ContractorQuote.create({
      ...req.body,
      contractorId: req.body.contractorId || req.user.id,
    });
    res.status(201).json(quote);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.approveQuote = async (req, res) => {
  try {
    const quote = await ContractorQuote.findByIdAndUpdate(
      req.params.id,
      { status: 'approved', approvedBy: req.user.id, approvedAt: new Date() },
      { new: true }
    );
    if (!quote) return res.status(404).json({ msg: 'Quote not found' });
    res.json(quote);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.rejectQuote = async (req, res) => {
  try {
    const quote = await ContractorQuote.findByIdAndUpdate(
      req.params.id,
      { status: 'rejected', rejectionReason: req.body.reason },
      { new: true }
    );
    if (!quote) return res.status(404).json({ msg: 'Quote not found' });
    res.json(quote);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

// Milestones
exports.getAllMilestones = async (req, res) => {
  try {
    const { status, quoteId, contractorId } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (quoteId) filter.quoteId = quoteId;
    if (contractorId) filter.contractorId = contractorId;
    const milestones = await Milestone.find(filter)
      .populate('contractorId', 'firstName lastName email companyName')
      .populate('verifiedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(milestones);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.createMilestone = async (req, res) => {
  try {
    const milestone = await Milestone.create({
      ...req.body,
      contractorId: req.body.contractorId || req.user.id,
    });
    await ContractorQuote.findByIdAndUpdate(milestone.quoteId, { status: 'in_progress' });
    res.status(201).json(milestone);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.updateProgress = async (req, res) => {
  try {
    const { progress, photos, receipts, notes } = req.body;
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) return res.status(404).json({ msg: 'Milestone not found' });
    if (progress !== undefined) milestone.progress = progress;
    if (photos) milestone.photos.push(...photos);
    if (receipts) milestone.receipts.push(...receipts);
    if (notes) milestone.notes = notes;
    if (milestone.progress >= 100) milestone.status = 'submitted';
    else milestone.status = 'in_progress';
    await milestone.save();
    res.json(milestone);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.verifyMilestone = async (req, res) => {
  try {
    const { timeliness, budgetAdherence, quality, approved } = req.body;
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) return res.status(404).json({ msg: 'Milestone not found' });
    if (approved) {
      const overall = Math.round((timeliness + budgetAdherence + quality) / 3);
      milestone.kpiScore = { timeliness, budgetAdherence, quality, overall };
      milestone.status = 'verified';
      milestone.verifiedBy = req.user.id;
      milestone.verifiedAt = new Date();
    } else {
      milestone.status = 'rejected';
    }
    await milestone.save();
    res.json(milestone);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.releasePayment = async (req, res) => {
  try {
    const { amount } = req.body;
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) return res.status(404).json({ msg: 'Milestone not found' });
    milestone.paymentReleased = true;
    milestone.paymentAmount = amount || milestone.budget;
    milestone.paymentDate = new Date();
    await milestone.save();
    res.json(milestone);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.addDailyWageDay = async (req, res) => {
  try {
    const { date, labourersAssigned, workDone, wageForDay } = req.body;
    const milestone = await Milestone.findById(req.params.id);
    if (!milestone) return res.status(404).json({ msg: 'Milestone not found' });
    milestone.dailyWageDays.push({ date: date || new Date(), labourersAssigned, workDone, wageForDay });
    await milestone.save();
    res.json(milestone);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getContractorKPI = async (req, res) => {
  try {
    const contractorId = req.params.contractorId || req.user.id;
    const milestones = await Milestone.find({ contractorId, status: 'verified' });
    if (!milestones.length) return res.json({ overallKPI: 0, completedMilestones: 0, avgTimeliness: 0, avgBudget: 0, avgQuality: 0 });
    const avgTimeliness = Math.round(milestones.reduce((s, m) => s + (m.kpiScore?.timeliness || 0), 0) / milestones.length);
    const avgBudget = Math.round(milestones.reduce((s, m) => s + (m.kpiScore?.budgetAdherence || 0), 0) / milestones.length);
    const avgQuality = Math.round(milestones.reduce((s, m) => s + (m.kpiScore?.quality || 0), 0) / milestones.length);
    const overallKPI = Math.round((avgTimeliness + avgBudget + avgQuality) / 3);
    res.json({ overallKPI, completedMilestones: milestones.length, avgTimeliness, avgBudget, avgQuality, milestones });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
