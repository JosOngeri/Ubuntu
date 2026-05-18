const express = require('express');
const router = express.Router();
const contractController = require('../controllers/contract.controller');
const upload = require('../utils/multer'); // Import your existing multer utility

// Add the multer middleware to your create and update routes

router.post('/', upload.single('document'),  contractController.createContract);
router.get('/', contractController.getContracts);
router.put('/:id', upload.single('document'), contractController.updateContract);
router.delete('/:id', contractController.deleteContract);

module.exports = router;
