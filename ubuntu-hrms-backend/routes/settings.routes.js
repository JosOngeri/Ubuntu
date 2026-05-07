const express = require('express');
const router = express.Router();
const {
  getSettings,
  getSettingByKey,
  updateSetting,
  getOfficeLocation,
  updateOfficeLocation,
  updateEmployeeAttendancePermission,
  getEmployeesAttendanceStatus,
} = require('../controllers/settings.controller');
const auth = require('../middleware/auth.middleware');
const roleMiddleware = require('../middleware/roleMiddleware');

// All settings routes require authentication
router.use(auth);

/**
 * Settings CRUD endpoints
 */
router.get('/', getSettings);
router.get('/:key', getSettingByKey);
router.put('/:key', roleMiddleware(['admin']), updateSetting);

/**
 * Office Location endpoints (admin only)
 */
router.get('/location/office', getOfficeLocation);
router.put('/location/office', roleMiddleware(['admin']), updateOfficeLocation);

/**
 * Employee Attendance Permission endpoints (admin only)
 */
router.get('/attendance/employees', roleMiddleware(['admin']), getEmployeesAttendanceStatus);
router.put('/attendance/employee/:employeeId', roleMiddleware(['admin']), updateEmployeeAttendancePermission);

module.exports = router;
