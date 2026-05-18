const express = require('express');
const router = express.Router();
const kpiController = require('../controllers/kpi.controller');

router.post('/assign', kpiController.assignKPI);
router.put('/:id/evaluate', kpiController.evaluateKPI);
router.get('/employee/:id', kpiController.getEmployeeKPIs);

router.post('/', kpiController.createKPI);
router.get('/', kpiController.getKPIs);
router.put('/:id', kpiController.updateKPI);
router.delete('/:id', kpiController.deleteKPI);

module.exports = router;
