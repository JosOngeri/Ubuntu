const express = require('express');
const router = express.Router();
const advertisementController = require('../controllers/advertisement.controller');
const auth = require('../middleware/auth.middleware');
const role = require('../middleware/roleMiddleware');
const upload = require('../middleware/cvUpload');

router.post('/upload-letterhead', auth, role(['admin', 'manager', 'hr']), upload.single('letterhead'), advertisementController.uploadLetterhead);
router.post('/generate/:jobId', auth, role(['admin', 'manager', 'hr']), advertisementController.generateAdvertisement);
router.get('/download/:jobId/:format', auth, role(['admin', 'manager', 'hr']), advertisementController.downloadAdvertisement);

module.exports = router;
