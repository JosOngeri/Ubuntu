const { query } = require('../config/db');

/**
 * Get all settings
 */
const getSettings = async (req, res) => {
  try {
    const result = await query(`
      SELECT setting_key, setting_value, description, updated_at, updated_by
      FROM settings
      ORDER BY setting_key
    `);

    res.status(200).json({
      msg: 'Settings retrieved successfully',
      settings: result.rows,
    });
  } catch (err) {
    console.error('Error fetching settings:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Get a specific setting by key
 */
const getSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;

    const result = await query(
      `SELECT setting_key, setting_value, description, updated_at FROM settings WHERE setting_key = $1`,
      [key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Setting not found' });
    }

    res.status(200).json({
      msg: 'Setting retrieved successfully',
      setting: result.rows[0],
    });
  } catch (err) {
    console.error('Error fetching setting:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Update a setting
 */
const updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { setting_value, description } = req.body;

    if (!setting_value) {
      return res.status(400).json({ msg: 'setting_value is required' });
    }

    const result = await query(
      `
        UPDATE settings
        SET setting_value = $1, description = COALESCE($2, description), updated_at = NOW(), updated_by = $3
        WHERE setting_key = $4
        RETURNING setting_key, setting_value, description, updated_at
      `,
      [setting_value, description, req.user?.id || null, key]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Setting not found' });
    }

    res.status(200).json({
      msg: 'Setting updated successfully',
      setting: result.rows[0],
    });
  } catch (err) {
    console.error('Error updating setting:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Get office location configuration
 */
const getOfficeLocation = async (req, res) => {
  try {
    const result = await query(
      `
        SELECT setting_value
        FROM settings
        WHERE setting_key IN ('OFFICE_LATITUDE', 'OFFICE_LONGITUDE', 'OFFICE_RADIUS_METERS', 'OFFICE_NAME')
      `
    );

    const location = {
      latitude: -1.19293,
      longitude: 36.93057,
      radius_meters: 1000,
      name: 'Main Office',
    };

    result.rows.forEach(row => {
      switch (row.setting_key) {
        case 'OFFICE_LATITUDE':
          location.latitude = parseFloat(row.setting_value);
          break;
        case 'OFFICE_LONGITUDE':
          location.longitude = parseFloat(row.setting_value);
          break;
        case 'OFFICE_RADIUS_METERS':
          location.radius_meters = parseInt(row.setting_value);
          break;
        case 'OFFICE_NAME':
          location.name = row.setting_value;
          break;
      }
    });

    res.status(200).json({
      msg: 'Office location retrieved successfully',
      location,
    });
  } catch (err) {
    console.error('Error fetching office location:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Update office location configuration
 */
const updateOfficeLocation = async (req, res) => {
  try {
    const { latitude, longitude, radius_meters, name } = req.body;

    // Validate inputs
    if (latitude === undefined || longitude === undefined || radius_meters === undefined) {
      return res.status(400).json({
        msg: 'latitude, longitude, and radius_meters are required',
      });
    }

    if (isNaN(latitude) || isNaN(longitude) || isNaN(radius_meters)) {
      return res.status(400).json({
        msg: 'latitude, longitude, and radius_meters must be valid numbers',
      });
    }

    // Update settings
    await query(
      `
        UPDATE settings SET setting_value = $1, updated_at = NOW(), updated_by = $2
        WHERE setting_key = 'OFFICE_LATITUDE'
      `,
      [latitude.toString(), req.user?.id || null]
    );

    await query(
      `
        UPDATE settings SET setting_value = $1, updated_at = NOW(), updated_by = $2
        WHERE setting_key = 'OFFICE_LONGITUDE'
      `,
      [longitude.toString(), req.user?.id || null]
    );

    await query(
      `
        UPDATE settings SET setting_value = $1, updated_at = NOW(), updated_by = $2
        WHERE setting_key = 'OFFICE_RADIUS_METERS'
      `,
      [radius_meters.toString(), req.user?.id || null]
    );

    if (name) {
      await query(
        `
          UPDATE settings SET setting_value = $1, updated_at = NOW(), updated_by = $2
          WHERE setting_key = 'OFFICE_NAME'
        `,
        [name, req.user?.id || null]
      );
    }

    res.status(200).json({
      msg: 'Office location updated successfully',
      location: {
        latitude,
        longitude,
        radius_meters,
        name: name || 'Main Office',
      },
    });
  } catch (err) {
    console.error('Error updating office location:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Update employee attendance permission
 */
const updateEmployeeAttendancePermission = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { can_self_record_attendance } = req.body;

    if (typeof can_self_record_attendance !== 'boolean') {
      return res.status(400).json({
        msg: 'can_self_record_attendance must be a boolean',
      });
    }

    const result = await query(
      `
        UPDATE employees
        SET can_self_record_attendance = $1, updated_at = NOW()
        WHERE id = $2
        RETURNING id, first_name, last_name, can_self_record_attendance
      `,
      [can_self_record_attendance, employeeId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ msg: 'Employee not found' });
    }

    res.status(200).json({
      msg: 'Employee attendance permission updated successfully',
      employee: result.rows[0],
    });
  } catch (err) {
    console.error('Error updating employee attendance permission:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

/**
 * Get all employees with their attendance permission status
 */
const getEmployeesAttendanceStatus = async (req, res) => {
  try {
    const result = await query(
      `
        SELECT id, first_name, last_name, email, employment_type, department, can_self_record_attendance
        FROM employees
        WHERE status != 'terminated'
        ORDER BY first_name, last_name
      `
    );

    res.status(200).json({
      msg: 'Employee attendance status retrieved successfully',
      employees: result.rows,
    });
  } catch (err) {
    console.error('Error fetching employee attendance status:', err);
    res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

module.exports = {
  getSettings,
  getSettingByKey,
  updateSetting,
  getOfficeLocation,
  updateOfficeLocation,
  updateEmployeeAttendancePermission,
  getEmployeesAttendanceStatus,
};
