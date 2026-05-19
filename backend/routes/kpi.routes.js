const express = require('express');
const router = express.Router();
const kpiController = require('../controllers/kpi.controller');

router.get('/all', kpiController.getAllAssignedKPIs);
router.post('/assign', kpiController.assignKPI);
router.post('/bulk-assign', kpiController.bulkAssignKPI);
router.put('/:id/evaluate', kpiController.evaluateKPI);
router.put('/:id/self-evaluate', kpiController.selfEvaluateKPI);
router.get('/employee/:id', kpiController.getEmployeeKPIs);

router.post('/', kpiController.createKPI);
router.get('/', kpiController.getKPIs);
router.put('/:id', kpiController.updateKPI);
router.delete('/:id', kpiController.deleteKPI);

module.exports = router;
