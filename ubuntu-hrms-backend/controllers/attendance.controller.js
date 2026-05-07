const Attendance = require('../models/Attendance.model');
const Employee = require('../models/Employee.model');
const { pool, query } = require('../config/db');
const {
  applyPunchState,
  isValidObjectId,
  recomputeTotalHours,
  toAttendanceDate,
  toDateValue,
  validateAttendancePayload,
} = require('../utils/validation');

const findOrCreateAttendance = async (employeeId, punchTime, shift) => {
  const attendanceDate = toAttendanceDate(punchTime);
  let attendance = await Attendance.findOne({ employeeId, attendanceDate });

  if (!attendance) {
    attendance = new Attendance({
      employeeId,
      attendanceDate,
      shift: shift || 'Morning',
      status: 'Present',
    });
  } else if (!attendance.shift && shift) {
    attendance.shift = shift;
  }

  return attendance;
};

const pushBiometric = async (req, res) => {
  const { normalized, errors } = validateAttendancePayload(req.body, { requireTimestamp: true });

  if (errors.length > 0) {
    return res.status(400).json({ msg: 'Validation failed', errors });
  }

  const { biometricDeviceId, timestamp, punchState, shift } = normalized;

  try {
    const employee = await Employee.findOne({ biometricDeviceId });
    if (!employee) {
      return res.status(404).json({ msg: 'Employee not found' });
    }

    const attendance = await findOrCreateAttendance(employee.id, timestamp, shift);
    applyPunchState(attendance, punchState, timestamp, 'biometric');

    recomputeTotalHours(attendance);

    await attendance.save();
    return res.status(200).json({ msg: 'Biometric attendance recorded', attendance });
  } catch (err) {
    return res.status(500).send('Server error');
  }
};


// Fetch office location from settings
const getOfficeLocation = async () => {
  try {
    const result = await query(
      `SELECT setting_value FROM settings WHERE setting_key IN ('OFFICE_LATITUDE', 'OFFICE_LONGITUDE', 'OFFICE_RADIUS_METERS')`
    );
    
    let lat = -1.19293;
    let lng = 36.93057;
    let radius = 1000;
    
    result.rows.forEach(row => {
      if (row.setting_key === 'OFFICE_LATITUDE') lat = parseFloat(row.setting_value);
      if (row.setting_key === 'OFFICE_LONGITUDE') lng = parseFloat(row.setting_value);
      if (row.setting_key === 'OFFICE_RADIUS_METERS') radius = parseInt(row.setting_value);
    });
    
    return { lat, lng, radius };
  } catch (err) {
    console.error('Error fetching office location from settings:', err);
    // Return defaults if error
    return { lat: -1.19293, lng: 36.93057, radius: 1000 };
  }
};

function haversineDistance(lat1, lng1, lat2, lng2) {
  function toRad(x) { return x * Math.PI / 180; }
  const R = 6371000; // meters
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng/2) * Math.sin(dLng/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Dummy function for remote/leave check (replace with real logic)
function isEmployeeAllowedRemote(employee) {
  // TODO: Check employee's leave/remote status from DB
  return false;
}

const manualSelfPunch = async (req, res) => {
  const { normalized, errors } = validateAttendancePayload(req.body);

  if (errors.length > 0) {
    return res.status(400).json({ msg: 'Validation failed', errors });
  }

  const { biometricDeviceId, punchState, shift } = normalized;
  const { geolocation } = req.body;

  try {
    let employee = null;

    if (req.user?.id) {
      employee = await Employee.findOne({ userId: req.user.id });
    }

    if (!employee && biometricDeviceId) {
      employee = await Employee.findOne({ biometricDeviceId });
    }

    if (!employee) {
      return res.status(404).json({ msg: 'Employee not found' });
    }

    // Check if employee is allowed to self-record attendance
    if (!employee.can_self_record_attendance) {
      return res.status(403).json({ 
        msg: 'You are not allowed to self-record attendance. Please contact your manager.' 
      });
    }

    if (employee.biometricDeviceId && biometricDeviceId && employee.biometricDeviceId !== biometricDeviceId) {
      return res.status(400).json({
        msg: 'Biometric device mismatch for logged-in user',
        expectedBiometricDeviceId: employee.biometricDeviceId,
      });
    }

    // Fetch office location from settings
    const officeLocation = await getOfficeLocation();

    // Geolocation validation
    const hasValidGeo =
      geolocation &&
      Number.isFinite(Number(geolocation.lat)) &&
      Number.isFinite(Number(geolocation.lng));

    if (hasValidGeo) {
      const dist = haversineDistance(
        Number(geolocation.lat), Number(geolocation.lng),
        officeLocation.lat, officeLocation.lng
      );
      if (dist > officeLocation.radius && !isEmployeeAllowedRemote(employee)) {
        return res.status(403).json({ msg: 'You are not at the allowed work location.' });
      }
    } else {
      return res.status(400).json({ msg: 'Location required to log attendance.' });
    }

    const serverNow = new Date();
    const attendance = await findOrCreateAttendance(employee.id, serverNow, shift);
    applyPunchState(attendance, punchState, serverNow, 'manual-self');

    recomputeTotalHours(attendance);
    await attendance.save();

    return res.status(200).json({
      msg: 'Manual attendance recorded with server time',
      recordedTime: serverNow,
      attendance,
    });
  } catch (err) {
    console.error('manualSelfPunch error:', err);
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

const managerPunchForEmployee = async (req, res) => {
  const { normalized, errors } = validateAttendancePayload(req.body, { requireTimestamp: true });

  if (errors.length > 0) {
    return res.status(400).json({ msg: 'Validation failed', errors });
  }

  const { employeeId, biometricDeviceId, punchState, timestamp, shift } = normalized;

  try {
    const employee = employeeId
      ? await Employee.findById(employeeId)
      : await Employee.findOne({ biometricDeviceId });

    if (!employee) {
      return res.status(404).json({ msg: 'Employee not found' });
    }

    const attendance = await findOrCreateAttendance(employee.id, timestamp, shift);
    applyPunchState(attendance, punchState, timestamp, 'manual-manager');

    recomputeTotalHours(attendance);
    await attendance.save();

    return res.status(200).json({
      msg: 'Manager/supervisor attendance entry recorded',
      attendance,
    });
  } catch (err) {
    return res.status(500).send('Server error');
  }
};

const getAttendance = async (req, res) => {
  try {
    const { employeeId: requestedEmployeeId } = req.params;

    if (!isValidObjectId(requestedEmployeeId)) {
      return res.status(400).json({ msg: 'Invalid employee id' });
    }

    let employee = null;

    if (req.user?.role === 'employee') {
      employee = await Employee.findOne({ userId: req.user?.id });
      if (!employee) {
        return res.status(404).json({ msg: 'Employee profile not found for logged in user' });
      }
    } else {
      employee = await Employee.findById(requestedEmployeeId);
    }

    if (!employee || String(employee.status || '').toLowerCase() !== 'active') {
      return res.status(404).json({ msg: 'Active employee not found' });
    }

    const attendance = await Attendance.findByEmployeeId(employee.id);
    return res.json(attendance);
  } catch (err) {
    return res.status(500).send('Server error');
  }
};

const getAttendanceById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!isValidObjectId(id)) {
      return res.status(400).json({ msg: 'Invalid attendance id' });
    }

    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return res.status(404).json({ msg: 'Attendance not found' });
    }

    if (req.user?.role === 'employee') {
      const employee = await Employee.findOne({ userId: req.user?.id });
      if (!employee) {
        return res.status(404).json({ msg: 'Employee profile not found for logged in user' });
      }

      if (String(attendance.employeeId) !== String(employee.id)) {
        return res.status(403).json({ msg: 'Access denied' });
      }
    }

    return res.json(attendance);
  } catch (err) {
    return res.status(500).json({ msg: 'Server error', error: err.message });
  }
};

const adjustAttendance = async (req, res) => {
  try {
    if (!isValidObjectId(req.params.id)) {
      return res.status(400).json({ msg: 'Invalid attendance id' });
    }

    const attendance = await Attendance.findById(req.params.id);
    if (!attendance) {
      return res.status(404).json({ msg: 'Attendance not found' });
    }

    const allowedFields = ['attendanceDate', 'status', 'shift', 'checkIn', 'breakOut', 'breakIn', 'checkOut', 'punchState'];
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        attendance[field] = field === 'attendanceDate' || field === 'checkIn' || field === 'breakOut' || field === 'breakIn' || field === 'checkOut'
          ? toDateValue(req.body[field])
          : req.body[field];
      }
    }

    recomputeTotalHours(attendance);
    await attendance.save();

    return res.json(attendance);
  } catch (err) {
    return res.status(500).send('Server error');
  }
};

module.exports = {
  pushBiometric,
  manualSelfPunch,
  managerPunchForEmployee,
  getAttendance,
  getAttendanceById,
  adjustAttendance,
};