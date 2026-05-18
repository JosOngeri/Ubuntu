const User = require('../models/User.model');
const Employee = require('../models/Employee.model');

// List all users with status and role
const getUsers = async (req, res) => {
  try {
    // Optionally filter by status/role
    const { status, role } = req.query;
    let users = await User.findAll();
    if (status) users = users.filter(u => u.status === status);
    if (role) users = users.filter(u => u.role === role);
    res.json(users);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// Get a single user by id
const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// Approve a user (set status to active, fill in details if employee)
const approveUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    user.status = 'active';
    await user.save();
    // If employee, update employee record
    if (user.role === 'employee') {
      let employee = await Employee.findOne({ userId: user.id });
      if (employee) {
        employee.status = 'active';
        // Optionally update wageRate, department, etc. from req.body
        Object.assign(employee, req.body);
        await employee.save();
      }
    }
    res.json({ msg: 'User approved', user });
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// Update user details
const updateUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    Object.assign(user, req.body);
    await user.save();
    res.json(user);
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// Delete user
const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    await user.delete();
    res.json({ msg: 'User deleted' });
  } catch (err) {
    res.status(500).send('Server error');
  }
};

// Assign role/permissions
const assignRole = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ msg: 'User not found' });
    user.role = req.body.role;
    await user.save();
    res.json({ msg: 'Role updated', user });
  } catch (err) {
    res.status(500).send('Server error');
  }
};

module.exports = {
  getUsers,
  getUserById,
  approveUser,
  updateUser,
  deleteUser,
  assignRole,
};
