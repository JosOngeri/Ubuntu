const express = require('express');
const router = express.Router();
const contractorController = require('../controllers/contractor.controller');
const auth = require('../middleware/auth.middleware');

router.get('/stats', auth, contractorController.getContractorStats);
router.get('/projects', auth, contractorController.getContractorProjects);
router.get('/invoices', auth, contractorController.getContractorInvoices);

module.exports = router;