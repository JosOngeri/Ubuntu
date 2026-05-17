const express = require('express');
const router = express.Router();
const {
  getSettings,
  getSettingsByCategory,
  getCategories,
  getSettingByKey,
  updateSetting,
  createSetting,
  deleteSetting,
  getAuditLog,
  getAllAuditLogs,
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
router.get('/categories', getCategories);
router.get('/category/:category', getSettingsByCategory);
router.get('/:key', getSettingByKey);
router.put('/:key', roleMiddleware(['owner', 'manager']), updateSetting);
router.post('/', roleMiddleware(['owner', 'manager']), createSetting);
router.delete('/:key', roleMiddleware(['owner', 'manager']), deleteSetting);

/**
 * Audit log endpoints (owner/manager only)
 */
router.get('/audit/:key', roleMiddleware(['owner', 'manager']), getAuditLog);
router.get('/audit/all', roleMiddleware(['owner', 'manager']), getAllAuditLogs);

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
