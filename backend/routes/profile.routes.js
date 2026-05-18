const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profile.controller');
const auth = require('../middleware/auth.middleware');

// Get current user's profile
router.get('/me', auth, profileController.getProfile);
// Create or update current user's profile
router.post('/me', auth, profileController.upsertProfile);

module.exports = router;
