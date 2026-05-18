const { query } = require('../config/db');

/**
 * Validate array setting value
 */
const validateArraySetting = (value) => {
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) {
      return { valid: false, error: 'Value must be a JSON array' };
    }
    if (parsed.length === 0) {
      return { valid: false, error: 'Array cannot be empty' };
    }
    // Check for duplicates
    const unique = [...new Set(parsed)];
    if (unique.length !== parsed.length) {
      return { valid: false, error: 'Array contains duplicate values' };
    }
    return { valid: true, value: parsed };
  } catch (e) {
    return { valid: false, error: 'Invalid JSON format' };
  }
};

/**
 * Validate date string
 */
const validateDateString = (value) => {
  const date = new Date(value);
  if (isNaN(date.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }
  return { valid: true, value: date };
};

/**
 * Validate attendance date is not backdated beyond cutoff
 */
const validateNoBackdatedAttendance = async (timestamp, employeeId) => {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    
    // Get cutoff setting
    const cutoffResult = await query(
      `SELECT setting_value FROM settings WHERE setting_key = 'ATTENDANCE_BACKDAYS_CUTOFF' AND is_active = true`
    );
    
    const cutoffDays = cutoffResult.rows.length > 0 
      ? parseInt(cutoffResult.rows[0].setting_value) 
      : 30;
    
    // If cutoff is 0, no restriction
    if (cutoffDays === 0) {
      return { valid: true };
    }
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - cutoffDays);
    
    if (date < cutoffDate) {
      return { 
        valid: false, 
        error: `Attendance date is more than ${cutoffDays} days in the past`,
        canOverride: true,
        cutoffDate: cutoffDate.toISOString()
      };
    }
    
    // Check if date is before employee hire date
    if (employeeId) {
      const employeeResult = await query(
        `SELECT hire_date FROM employees WHERE id = $1`,
        [employeeId]
      );
      
      if (employeeResult.rows.length > 0 && employeeResult.rows[0].hire_date) {
        const hireDate = new Date(employeeResult.rows[0].hire_date);
        if (date < hireDate) {
          return {
            valid: false,
            error: 'Attendance date is before employee hire date',
            canOverride: false,
            hireDate: hireDate.toISOString()
          };
        }
      }
    }
    
    return { valid: true };
  } catch (err) {
    console.error('Error validating backdated attendance:', err);
    return { valid: false, error: 'Validation failed' };
  }
};

/**
 * Analyze impact of setting change
 */
const analyzeImpact = async (settingKey, category, oldValue, newValue) => {
  const impact = {
    affectedRecords: 0,
    affectedTables: [],
    warnings: [],
  };
  
  try {
    const oldParsed = oldValue ? JSON.parse(oldValue) : null;
    const newParsed = newValue ? JSON.parse(newValue) : null;
    
    // Department changes
    if (settingKey === 'DEPARTMENTS' || category === 'departments') {
      const oldDepts = oldParsed || [];
      const newDepts = newParsed || [];
      
      const removed = oldDepts.filter(d => !newDepts.includes(d));
      const added = newDepts.filter(d => !oldDepts.includes(d));
      
      if (removed.length > 0) {
        // Check employees with these departments
        const empResult = await query(
          `SELECT COUNT(*) as count FROM employees WHERE department = ANY($1)`,
          [removed]
        );
        impact.affectedRecords += parseInt(empResult.rows[0].count);
        impact.affectedTables.push('employees');
        impact.warnings.push(`${empResult.rows[0].count} employee(s) have department(s) that will be removed: ${removed.join(', ')}`);
      }
      
      if (added.length > 0) {
        impact.warnings.push(`New department(s) will be added: ${added.join(', ')}`);
      }
    }
    
    // Employment type changes
    if (settingKey === 'EMPLOYMENT_TYPES' || category === 'employment') {
      const oldTypes = oldParsed || [];
      const newTypes = newParsed || [];
      
      const removed = oldTypes.filter(t => !newTypes.includes(t));
      
      if (removed.length > 0) {
        const empResult = await query(
          `SELECT COUNT(*) as count FROM employees WHERE employment_type = ANY($1)`,
          [removed]
        );
        impact.affectedRecords += parseInt(empResult.rows[0].count);
        impact.affectedTables.push('employees');
        impact.warnings.push(`${empResult.rows[0].count} employee(s) have employment type(s) that will be removed: ${removed.join(', ')}`);
      }
    }
    
    // Leave type changes
    if (settingKey === 'LEAVE_TYPES' || category === 'leave') {
      const oldTypes = oldParsed || [];
      const newTypes = newParsed || [];
      
      const removed = oldTypes.filter(t => !newTypes.includes(t));
      
      if (removed.length > 0) {
        const leaveResult = await query(
          `SELECT COUNT(*) as count FROM leaves WHERE type = ANY($1)`,
          [removed]
        );
        impact.affectedRecords += parseInt(leaveResult.rows[0].count);
        impact.affectedTables.push('leaves');
        impact.warnings.push(`${leaveResult.rows[0].count} leave request(s) have type(s) that will be removed: ${removed.join(', ')}`);
      }
    }
    
    // Job status changes
    if (settingKey === 'JOB_STATUSES' || category === 'recruitment') {
      const oldStatuses = oldParsed || [];
      const newStatuses = newParsed || [];
      
      const removed = oldStatuses.filter(s => !newStatuses.includes(s));
      
      if (removed.length > 0) {
        const jobResult = await query(
          `SELECT COUNT(*) as count FROM jobs WHERE status = ANY($1)`,
          [removed]
        );
        impact.affectedRecords += parseInt(jobResult.rows[0].count);
        impact.affectedTables.push('jobs');
        impact.warnings.push(`${jobResult.rows[0].count} job posting(s) have status(es) that will be removed: ${removed.join(', ')}`);
      }
    }
    
    // Complaint status changes
    if (settingKey === 'COMPLAINT_STATUSES' || category === 'complaints') {
      const oldStatuses = oldParsed || [];
      const newStatuses = newParsed || [];
      
      const removed = oldStatuses.filter(s => !newStatuses.includes(s));
      
      if (removed.length > 0) {
        const complaintResult = await query(
          `SELECT COUNT(*) as count FROM complaints WHERE status = ANY($1)`,
          [removed]
        );
        impact.affectedRecords += parseInt(complaintResult.rows[0].count);
        impact.affectedTables.push('complaints');
        impact.warnings.push(`${complaintResult.rows[0].count} complaint(s) have status(es) that will be removed: ${removed.join(', ')}`);
      }
    }
    
  } catch (err) {
    console.error('Error analyzing impact:', err);
    impact.warnings.push('Could not complete impact analysis');
  }
  
  return impact;
};

module.exports = {
  validateArraySetting,
  validateDateString,
  validateNoBackdatedAttendance,
  analyzeImpact,
};
