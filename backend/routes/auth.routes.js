const express = require('express');
const { register, login, forgotPassword, resetPassword, adminResetPassword } = require('../controllers/auth.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/register', register); 
router.post('/login', login);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/admin/reset-password', auth, role(['admin']), adminResetPassword);

module.exports = router;