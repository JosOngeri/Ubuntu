const express = require('express');
const router = express.Router();
const leaveController = require('../controllers/leave.controller');
const auth = require('../middleware/auth.middleware');
const upload = require('../middleware/leaveUpload');

router.post('/request', auth, upload.single('attachment'), leaveController.requestLeave);
router.put('/:id/upload-doc', auth, upload.single('attachment'), leaveController.uploadLeaveDocument);
router.put('/:id/status', auth, leaveController.updateLeaveStatus);
router.get('/balance/:employeeId', auth, leaveController.getLeaveBalance);

router.post('/', auth, upload.single('attachment'), leaveController.createLeave);
router.get('/', auth, leaveController.getLeaves);
router.put('/:id', auth, leaveController.updateLeave);
router.delete('/:id', auth, leaveController.deleteLeave);

module.exports = router;
