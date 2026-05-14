const Onboarding = require('../models/Onboarding.model');
const Employee = require('../models/Employee.model');
const Asset = require('../models/Asset.model');

const DEFAULT_STEPS = [
  { name: 'offer_letter', label: 'Generate Offer Letter' },
  { name: 'documents', label: 'Collect Documents (ID, Certificates, KRA, NSSF, NHIF)' },
  { name: 'department_assignment', label: 'Assign Department & Supervisor' },
  { name: 'asset_allocation', label: 'Allocate Assets (Uniform, Tools, PPE)' },
  { name: 'orientation', label: 'Schedule Orientation / Training' },
  { name: 'probation_review_1', label: 'First Probation Review (Mid-point)' },
  { name: 'probation_review_2', label: 'Final Probation Review' },
  { name: 'confirmation', label: 'Confirm Employment' },
];

exports.getAll = async (req, res) => {
  try {
    const { status } = req.query;
    const filter = {};
    if (status) filter.status = status;
    const onboardings = await Onboarding.find(filter)
      .populate('employeeId', 'firstName lastName email department position')
      .populate('supervisorId', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json(onboardings);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const onboarding = await Onboarding.findById(req.params.id)
      .populate('employeeId')
      .populate('supervisorId', 'firstName lastName')
      .populate('assetsAssigned.assetId');
    if (!onboarding) return res.status(404).json({ msg: 'Onboarding not found' });
    res.json(onboarding);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.initiate = async (req, res) => {
  try {
    const { employeeId, applicationId, department, position, supervisorId, probationMonths } = req.body;
    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ msg: 'Employee not found' });
    const existing = await Onboarding.findOne({ employeeId });
    if (existing) return res.status(400).json({ msg: 'Onboarding already exists for this employee' });
    const probationEnd = new Date();
    probationEnd.setMonth(probationEnd.getMonth() + (probationMonths || 3));
    const onboarding = await Onboarding.create({
      employeeId,
      applicationId,
      department: department || employee.department,
      position: position || employee.position,
      supervisorId,
      probationEndDate: probationEnd,
      steps: DEFAULT_STEPS.map(s => ({ ...s })),
      status: 'in_progress',
    });
    res.status(201).json(onboarding);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.completeStep = async (req, res) => {
  try {
    const { stepName, notes } = req.body;
    const onboarding = await Onboarding.findById(req.params.id);
    if (!onboarding) return res.status(404).json({ msg: 'Onboarding not found' });
    const step = onboarding.steps.find(s => s.name === stepName);
    if (!step) return res.status(404).json({ msg: 'Step not found' });
    step.completed = true;
    step.completedAt = new Date();
    step.completedBy = req.user.id;
    if (notes) step.notes = notes;
    if (stepName === 'confirmation') {
      onboarding.status = 'completed';
      onboarding.confirmedAt = new Date();
      onboarding.confirmedBy = req.user.id;
      await Employee.findByIdAndUpdate(onboarding.employeeId, { status: 'Active', employmentType: 'Permanent' });
    }
    await onboarding.save();
    res.json(onboarding);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.uploadDocument = async (req, res) => {
  try {
    const onboarding = await Onboarding.findById(req.params.id);
    if (!onboarding) return res.status(404).json({ msg: 'Onboarding not found' });
    const { name, type, url } = req.body;
    onboarding.documents.push({ name, type, url, uploadedAt: new Date() });
    await onboarding.save();
    res.json(onboarding);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.assignAsset = async (req, res) => {
  try {
    const onboarding = await Onboarding.findById(req.params.id);
    if (!onboarding) return res.status(404).json({ msg: 'Onboarding not found' });
    const { assetId, condition } = req.body;
    const asset = await Asset.findById(assetId);
    if (!asset) return res.status(404).json({ msg: 'Asset not found' });
    asset.status = 'assigned';
    asset.assignedTo = onboarding.employeeId;
    asset.assignedDate = new Date();
    asset.condition = condition || asset.condition;
    await asset.save();
    onboarding.assetsAssigned.push({ assetId, assignedAt: new Date(), condition });
    await onboarding.save();
    res.json(onboarding);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.addProbationReview = async (req, res) => {
  try {
    const onboarding = await Onboarding.findById(req.params.id);
    if (!onboarding) return res.status(404).json({ msg: 'Onboarding not found' });
    const { score, comments, recommendation } = req.body;
    onboarding.probationReviews.push({
      reviewDate: new Date(),
      reviewerId: req.user.id,
      score,
      comments,
      recommendation,
    });
    await onboarding.save();
    res.json(onboarding);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.generateOfferLetter = async (req, res) => {
  try {
    const onboarding = await Onboarding.findById(req.params.id).populate('employeeId');
    if (!onboarding) return res.status(404).json({ msg: 'Onboarding not found' });
    const emp = onboarding.employeeId;
    const letter = {
      date: new Date().toLocaleDateString(),
      employeeName: `${emp.firstName} ${emp.lastName}`,
      position: onboarding.position || emp.position,
      department: onboarding.department || emp.department,
      startDate: new Date().toLocaleDateString(),
      probationMonths: 3,
      salary: emp.basicSalary || 'To be discussed',
    };
    onboarding.offerLetterGenerated = true;
    onboarding.offerLetterUrl = `/api/onboarding/${onboarding._id}/offer-letter`;
    await onboarding.save();
    res.json({ letter, onboarding });
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};
