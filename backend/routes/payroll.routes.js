const express = require('express');
const router = express.Router();
const payrollController = require('../controllers/payroll.controller');

router.post('/calculate', payrollController.calculatePayroll);
router.get('/calculate/:period', payrollController.calculatePayroll);
router.put('/approve/:id', payrollController.approvePayroll);
router.post('/disburse', payrollController.disbursePayroll);

// ResultURL (success/failure callback)
router.post('/mpesa-callback', payrollController.handleMpesaCallback);
router.post('/mpesa/callback', payrollController.handleMpesaCallback);

// QueueTimeoutURL (timeout callback)
router.post('/mpesa-timeout', payrollController.handleMpesaCallback);
router.post('/mpesa/timeout', payrollController.handleMpesaCallback);
router.get('/', payrollController.getPayslips);

module.exports = router;
