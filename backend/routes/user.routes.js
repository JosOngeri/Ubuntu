const express = require('express');
const auth = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/roleMiddleware');
const {
  getUsers,
  getUserById,
  approveUser,
  updateUser,
  deleteUser,
  assignRole,
} = require('../controllers/user.controller');

const router = express.Router();

// List all users (admin/hr)
router.get('/', auth, roleMiddleware(['admin', 'hr']), getUsers);
// Get single user (admin/hr)
router.get('/:id', auth, roleMiddleware(['admin', 'hr']), getUserById);
// Approve user (admin/hr)
router.post('/:id/approve', auth, roleMiddleware(['admin', 'hr']), approveUser);
// Update user (admin/hr)
router.put('/:id', auth, roleMiddleware(['admin', 'hr']), updateUser);
// Delete user (admin)
router.delete('/:id', auth, roleMiddleware(['admin']), deleteUser);
// Assign role/permissions (admin)
router.post('/:id/role', auth, roleMiddleware(['admin']), assignRole);

module.exports = router;
