const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth.middleware');
const ctrl = require('../controllers/dailyLabourer.controller');

router.use(auth);

router.get('/', ctrl.getAll);
router.get('/attendance', ctrl.getAttendance);
router.get('/wages', ctrl.getWageSummary);
router.get('/:id', ctrl.getById);
router.post('/', ctrl.create);
router.post('/attendance', ctrl.recordAttendance);
router.put('/:id', ctrl.update);
router.delete('/:id', ctrl.remove);
router.post('/:id/convert', ctrl.convertToEmployee);

module.exports = router;
