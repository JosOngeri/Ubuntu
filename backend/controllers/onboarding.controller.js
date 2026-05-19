const Onboarding = require('../models/Onboarding.model');
const Employee = require('../models/Employee.model');
const Asset = require('../models/Asset.model');
const User = require('../models/User.model');
const bcrypt = require('bcrypt');
const { sendEmail } = require('../utils/email');
const crypto = require('crypto');

const populateEmployee = async (onboarding) => {
  if (!onboarding.employeeId) return onboarding;
  const employee = await Employee.findById(onboarding.employeeId);
  if (employee) {
    onboarding.employeeId = employee.toJSON();
  }
  return onboarding;
};

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
    const onboardings = await Onboarding.find(filter).sort({ createdAt: -1 });
    const populated = await Promise.all(onboardings.map(populateEmployee));
    res.json(populated);
  } catch (err) {
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

exports.getById = async (req, res) => {
  try {
    const onboarding = await Onboarding.findById(req.params.id);
    if (!onboarding) return res.status(404).json({ msg: 'Onboarding not found' });
    await populateEmployee(onboarding);
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

      // Create user account
      const employee = await Employee.findById(onboarding.employeeId);
      if (employee && !employee.userId) {
        const username = `${employee.firstName.toLowerCase()}.${employee.lastName.toLowerCase()}`;
        const tempPassword = crypto.randomBytes(12).toString('hex');
        const hashedPassword = await bcrypt.hash(tempPassword, 10);

        let user = await User.findOne({ username });
        if (user) {
          // Add number to make username unique
          let counter = 1;
          while (await User.findOne({ username: `${username}${counter}` })) {
            counter++;
          }
          user = await User.create({
            username: `${username}${counter}`,
            password: hashedPassword,
            email: employee.email,
            role: 'employee',
          });
        } else {
          user = await User.create({
            username,
            password: hashedPassword,
            email: employee.email,
            role: 'employee',
          });
        }

        // Update employee with user ID
        await Employee.findByIdAndUpdate(onboarding.employeeId, { userId: user._id });

        // Send email with login credentials
        const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5177';
        await sendEmail({
          to: employee.email,
          subject: 'Welcome to Ubuntu HRMS - Your Account Credentials',
          text: `Dear ${employee.firstName} ${employee.lastName},\n\nWelcome to Ubuntu HRMS! Your onboarding has been completed successfully.\n\nYour login credentials:\nUsername: ${user.username}\nPassword: ${tempPassword}\n\nPlease log in at ${frontendUrl} and change your password immediately.\n\nBest regards,\nUbuntu HRMS Team`,
          html: `<p>Dear ${employee.firstName} ${employee.lastName},</p><p>Welcome to Ubuntu HRMS! Your onboarding has been completed successfully.</p><p><strong>Your login credentials:</strong></p><p>Username: ${user.username}<br>Password: ${tempPassword}</p><p>Please log in at <a href="${frontendUrl}">${frontendUrl}</a> and change your password immediately.</p><p>Best regards,<br>Ubuntu HRMS Team</p>`,
        });
      }
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
    const onboarding = await Onboarding.findById(req.params.id);
    if (!onboarding) return res.status(404).json({ msg: 'Onboarding not found' });
    await populateEmployee(onboarding);
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
