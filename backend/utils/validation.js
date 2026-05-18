const EMPLOYMENT_TYPES = ['Daily', 'Contractor', 'Permanent'];
const PUNCH_STATES = ['checkIn', 'breakOut', 'breakIn', 'checkOut'];

const trimString = (value) => (typeof value === 'string' ? value.trim() : value);

const toDateValue = (value) => {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

const toAttendanceDate = (value) => {
  const date = toDateValue(value);
  if (!date) {
    return null;
  }

  return date.toISOString().slice(0, 10);
};

const normalizeEmployeePayload = (payload = {}) => ({
  firstName: trimString(payload.firstName),
  lastName: trimString(payload.lastName),
  email: trimString(payload.email)?.toLowerCase(),
  phone: trimString(payload.phone),
  biometricDeviceId: trimString(payload.biometricDeviceId),
  mpesaPhoneNumber: trimString(payload.mpesaPhoneNumber),
  employmentType: trimString(payload.employmentType),
  wageRate: payload.wageRate === '' || payload.wageRate === null || payload.wageRate === undefined
    ? payload.wageRate
    : Number(payload.wageRate),
  department: trimString(payload.department),
});

const validateEmployeePayload = (payload = {}, { partial = false } = {}) => {
  const normalized = normalizeEmployeePayload(payload);
  const errors = [];

  const requireField = (fieldName, label) => {
    if (!partial && (normalized[fieldName] === undefined || normalized[fieldName] === null || normalized[fieldName] === '')) {
      errors.push(`Please enter ${label.toLowerCase()}`);
    }
  };

  requireField('firstName', 'First Name');
  requireField('lastName', 'Last Name');
  requireField('phone', 'Phone Number');
  // mpesaPhoneNumber is optional
  requireField('employmentType', 'Employment Type');
  requireField('wageRate', 'Wage Rate');
  requireField('department', 'Department');

  if (normalized.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.email)) {
    errors.push('Please enter a valid email address');
  }

  if (normalized.employmentType && !EMPLOYMENT_TYPES.includes(normalized.employmentType)) {
    errors.push(`Employment type must be one of: ${EMPLOYMENT_TYPES.join(', ')}`);
  }

  if (normalized.wageRate !== undefined && normalized.wageRate !== null && normalized.wageRate !== '' && Number.isNaN(normalized.wageRate)) {
    errors.push('Wage rate must be a valid number');
  }

  if (normalized.wageRate !== undefined && normalized.wageRate !== null && normalized.wageRate !== '' && Number(normalized.wageRate) < 0) {
    errors.push('Wage rate cannot be negative');
  }

  return { normalized, errors };
};

const normalizeAttendancePayload = (payload = {}) => ({
  employeeId: trimString(payload.employeeId),
  biometricDeviceId: trimString(payload.biometricDeviceId),
  punchState: trimString(payload.punchState),
  shift: trimString(payload.shift),
  timestamp: toDateValue(payload.timestamp),
  attendanceDate: toAttendanceDate(payload.attendanceDate),
  checkIn: toDateValue(payload.checkIn),
  breakOut: toDateValue(payload.breakOut),
  breakIn: toDateValue(payload.breakIn),
  checkOut: toDateValue(payload.checkOut),
  status: trimString(payload.status),
});

const validateAttendancePayload = (payload = {}, { requireTimestamp = false } = {}) => {
  const normalized = normalizeAttendancePayload(payload);
  const errors = [];

  if (!normalized.employeeId && !normalized.biometricDeviceId) {
    errors.push('employeeId or biometricDeviceId is required');
  }

  if (!normalized.punchState) {
    errors.push('punchState is required');
  } else if (!PUNCH_STATES.includes(normalized.punchState)) {
    errors.push(`punchState must be one of ${PUNCH_STATES.join(', ')}`);
  }

  if ((requireTimestamp || payload.timestamp !== undefined) && !normalized.timestamp) {
    errors.push('timestamp must be a valid date');
  }

  if (payload.attendanceDate !== undefined && !normalized.attendanceDate) {
    errors.push('attendanceDate must be a valid date');
  }

  return { normalized, errors };
};

const isValidObjectId = (value) => {
  const id = Number(value);
  return Number.isInteger(id) && id > 0;
};

const applyPunchState = (attendance, punchState, punchTime, source = 'biometric') => {
  if (!Array.isArray(attendance.punchHistory)) {
    attendance.punchHistory = [];
  }

  attendance.punchState = punchState;
  attendance.punchHistory.push({ state: punchState, time: punchTime, source });

  switch (punchState) {
    case 'checkIn':
      attendance.checkIn = punchTime;
      attendance.status = 'Present';
      break;
    case 'breakOut':
      attendance.breakOut = punchTime;
      break;
    case 'breakIn':
      attendance.breakIn = punchTime;
      break;
    case 'checkOut':
      attendance.checkOut = punchTime;
      attendance.status = 'Present';
      break;
    default:
      break;
  }

  return attendance;
};

const recomputeTotalHours = (attendance) => {
  if (!attendance.checkIn || !attendance.checkOut) {
    attendance.totalHoursWorked = undefined;
    return attendance;
  }

  const totalMillis = new Date(attendance.checkOut).getTime() - new Date(attendance.checkIn).getTime();
  let breakMillis = 0;

  if (attendance.breakOut && attendance.breakIn && new Date(attendance.breakIn).getTime() > new Date(attendance.breakOut).getTime()) {
    breakMillis = new Date(attendance.breakIn).getTime() - new Date(attendance.breakOut).getTime();
  }

  attendance.totalHoursWorked = Math.max((totalMillis - breakMillis) / (1000 * 60 * 60), 0);
  return attendance;
};

module.exports = {
  EMPLOYMENT_TYPES,
  PUNCH_STATES,
  applyPunchState,
  isValidObjectId,
  normalizeAttendancePayload,
  normalizeEmployeePayload,
  recomputeTotalHours,
  toAttendanceDate,
  toDateValue,
  validateAttendancePayload,
  validateEmployeePayload,
};