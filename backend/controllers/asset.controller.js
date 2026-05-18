const Asset = require('../models/Asset.model');

exports.getAll = async (req, res) => {
  try {
    const { type, status } = req.query;
    const filter = {};
    if (type) filter.type = type;
    if (status) filter.status = status;
    const assets = await Asset.find(filter).populate('assignedTo', 'firstName lastName').sort({ createdAt: -1 });
    res.json(assets);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const asset = await Asset.create(req.body);
    res.status(201).json(asset);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.update = async (req, res) => {
  try {
    const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!asset) return res.status(404).json({ msg: 'Asset not found' });
    res.json(asset);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    await Asset.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Asset removed' });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.returnAsset = async (req, res) => {
  try {
    const { returnCondition } = req.body;
    const asset = await Asset.findById(req.params.id);
    if (!asset) return res.status(404).json({ msg: 'Asset not found' });
    asset.status = 'returned';
    asset.returnDate = new Date();
    asset.returnCondition = returnCondition || asset.condition;
    asset.assignedTo = null;
    await asset.save();
    res.json(asset);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
