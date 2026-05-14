const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const ctrl = require('../controllers/contractorLifecycle.controller');

router.use(auth);

router.get('/quotes', ctrl.getAllQuotes);
router.post('/quotes', ctrl.createQuote);
router.put('/quotes/:id/approve', ctrl.approveQuote);
router.put('/quotes/:id/reject', ctrl.rejectQuote);

router.get('/milestones', ctrl.getAllMilestones);
router.post('/milestones', ctrl.createMilestone);
router.put('/milestones/:id/progress', ctrl.updateProgress);
router.put('/milestones/:id/verify', ctrl.verifyMilestone);
router.put('/milestones/:id/payment', ctrl.releasePayment);
router.post('/milestones/:id/daily-wage', ctrl.addDailyWageDay);

router.get('/kpi/:contractorId?', ctrl.getContractorKPI);

module.exports = router;
