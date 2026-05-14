const Complaint = require('../models/Complaint.model');

const SLA_TIMES = { critical: 1, high: 4, medium: 24, low: 48 };

exports.getAll = async (req, res) => {
  try {
    const { type, status, urgency, department, assignedTo } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    if (urgency) filter.urgency = urgency;
    if (department) filter.department = department;
    if (assignedTo) filter.assignedTo = assignedTo;
    const complaints = await Complaint.find(filter)
      .populate('submittedBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName')
      .populate('respondentId', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(complaints);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id)
      .populate('submittedBy', 'firstName lastName email')
      .populate('assignedTo', 'firstName lastName')
      .populate('respondentId', 'firstName lastName')
      .populate('timeline.performedBy', 'firstName lastName');
    if (!complaint) return res.status(404).json({ msg: 'Complaint not found' });
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { type, category, description, urgency, guestName, guestContact, guestRoom, respondentId, department } = req.body;
    const slaHours = SLA_TIMES[urgency] || 24;
    const slaDeadline = new Date(Date.now() + slaHours * 3600000);
    const complaint = await Complaint.create({
      type,
      category,
      description,
      urgency: urgency || 'medium',
      guestName,
      guestContact,
      guestRoom,
      respondentId,
      department,
      submittedBy: req.user.id,
      slaDeadline,
      timeline: [{ action: 'Complaint filed', notes: description, performedBy: req.user.id }],
    });
    res.status(201).json(complaint);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.updateStatus = async (req, res) => {
  try {
    const { status, notes, assignedTo } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ msg: 'Complaint not found' });
    if (assignedTo) complaint.assignedTo = assignedTo;
    if (status) complaint.status = status;
    complaint.timeline.push({
      action: status ? `Status changed to ${status}` : 'Updated',
      notes: notes || '',
      performedBy: req.user.id,
    });
    if (status === 'resolved') complaint.resolutionDate = new Date();
    await complaint.save();
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.resolve = async (req, res) => {
  try {
    const { resolution } = req.body;
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ msg: 'Complaint not found' });
    complaint.status = 'resolved';
    complaint.resolution = resolution;
    complaint.resolutionDate = new Date();
    complaint.timeline.push({
      action: 'Complaint resolved',
      notes: resolution,
      performedBy: req.user.id,
    });
    await complaint.save();
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.close = async (req, res) => {
  try {
    const complaint = await Complaint.findById(req.params.id);
    if (!complaint) return res.status(404).json({ msg: 'Complaint not found' });
    complaint.status = 'closed';
    complaint.complainantConfirmed = true;
    complaint.timeline.push({
      action: 'Complaint closed',
      notes: 'Complainant confirmed resolution',
      performedBy: req.user.id,
    });
    await complaint.save();
    res.json(complaint);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getStats = async (req, res) => {
  try {
    const [total, open, resolved, byType, byUrgency] = await Promise.all([
      Complaint.countDocuments(),
      Complaint.countDocuments({ status: { $in: ['open', 'acknowledged', 'investigating'] } }),
      Complaint.countDocuments({ status: 'resolved' }),
      Complaint.aggregate([{ $group: { _id: '$type', count: { $sum: 1 } } }]),
      Complaint.aggregate([{ $group: { _id: '$urgency', count: { $sum: 1 } } }]),
    ]);
    res.json({ total, open, resolved, byType, byUrgency });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
