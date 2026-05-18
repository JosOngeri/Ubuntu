const { query, pool } = require('../config/db');
const { normalizeId, toOptionalText, formatDateOnly, toDate } = require('../utils/postgres');

const LEAVE_TYPES = {
  annual: 'annual',
  sick: 'sick',
  maternity: 'maternity',
  paternity: 'paternity',
  'maternity/paternity': 'maternity',
  compassionate: 'compassionate',
  unpaid: 'unpaid',
};

const formatLeaveType = (value) => {
  if (!value) return null;
  const normalized = String(value).trim().toLowerCase();
  return LEAVE_TYPES[normalized] || normalized;
};

const DEFAULT_POLICY_CONFIG = {
  annual: {
    day_count_mode: 'working_days',
    sandwich_weekends: false,
    yearly_allocation_days: 30,
    carry_forward_limit: 5,
    allow_negative_balance: false,
    department_threshold_pct: 20,
    accrues_during_other_leave: true,
  },
  sick: {
    day_count_mode: 'calendar_days',
    requires_balance: true,
    allow_negative_balance: false,
    split_pay: [
      { up_to: 7, pay_percent: 100 },
      { up_to: 14, pay_percent: 50 },
      { up_to: 9999, pay_percent: 0 },
    ],
  },
  maternity: {
    day_count_mode: 'calendar_days',
    requires_balance: false,
    statutory: true,
    annual_accrual_continues: true,
    department_threshold_pct: 20,
  },
  paternity: {
    day_count_mode: 'calendar_days',
    requires_balance: false,
    statutory: true,
    department_threshold_pct: 20,
  },
  compassionate: {
    day_count_mode: 'calendar_days',
    requires_balance: false,
    department_threshold_pct: 20,
  },
  unpaid: {
    day_count_mode: 'calendar_days',
    requires_balance: false,
    allow_negative_balance: false,
  },
};

const DAY_MS = 24 * 60 * 60 * 1000;

const startOfUtcDay = (value) => {
  const date = toDate(value);
  if (!date) return null;
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
};

const isWeekend = (date) => [0, 6].includes(date.getUTCDay());

const getPolicyConfig = (policy) => ({
  ...(DEFAULT_POLICY_CONFIG[policy?.type] || {}),
  ...(policy?.rule_config || {}),
});

const calculateChargeableDays = (startDate, endDate, policyConfig = {}) => {
  const start = startOfUtcDay(startDate);
  const end = startOfUtcDay(endDate);
  if (!start || !end || start > end) {
    return null;
  }

  const dayCountMode = policyConfig.day_count_mode || 'calendar_days';
  if (dayCountMode === 'calendar_days' || policyConfig.sandwich_weekends) {
    return Math.floor((end.getTime() - start.getTime()) / DAY_MS) + 1;
  }

  let count = 0;
  for (let cursor = new Date(start); cursor <= end; cursor = new Date(cursor.getTime() + DAY_MS)) {
    if (!isWeekend(cursor)) {
      count += 1;
    }
  }

  return count;
};

const buildSickPayrollFlags = (days, policyConfig = {}) => {
  const splitPay = Array.isArray(policyConfig.split_pay) && policyConfig.split_pay.length > 0
    ? policyConfig.split_pay
    : DEFAULT_POLICY_CONFIG.sick.split_pay;

  let remaining = days;
  let previousCap = 0;
  const segments = [];

  for (const tier of splitPay) {
    if (remaining <= 0) break;

    const cap = Number(tier.up_to || 0);
    const allowed = Math.max(Math.min(cap - previousCap, remaining), 0);
    if (allowed > 0) {
      segments.push({ days: allowed, pay_percent: Number(tier.pay_percent || 0) });
      remaining -= allowed;
    }
    previousCap = cap;
  }

  if (remaining > 0) {
    segments.push({ days: remaining, pay_percent: 0 });
  }

  return {
    type: 'split_pay',
    segments,
    statutory_notes: 'Payroll should apply split-pay tiers before treating any remaining sick leave as unpaid.',
  };
};

const buildAnnualBalanceEffect = (days, currentBalance, policyConfig = {}) => {
  const allowNegativeBalance = Boolean(policyConfig.allow_negative_balance);
  const remaining = Number(currentBalance || 0) - days;
  return {
    days,
    before: Number(currentBalance || 0),
    after: remaining,
    allow_negative_balance: allowNegativeBalance,
    requires_unpaid_conversion: remaining < 0 && !allowNegativeBalance,
  };
};

const getLeavePolicy = async (type) => {
  const normalized = formatLeaveType(type);
  const { rows } = await query('SELECT * FROM leave_policies WHERE type = $1 LIMIT 1', [normalized]);
  if (rows[0]) return rows[0];
  throw new Error(`Unsupported leave type: ${type}`);
};

const getEmployeeByUserId = async (userId) => {
  const { rows } = await query('SELECT * FROM employees WHERE user_id = $1 LIMIT 1', [userId]);
  return rows[0];
};

const getCurrentYear = () => new Date().getFullYear();

const getLeaveBalanceRow = async (employeeId) => {
  const year = getCurrentYear();
  const { rows: currentRows } = await query(
    'SELECT * FROM leave_balances WHERE employee_id = $1 AND year = $2 LIMIT 1',
    [employeeId, year]
  );
  if (currentRows[0]) {
    return currentRows[0];
  }

  const { rows: annualPolicyRows } = await query('SELECT * FROM leave_policies WHERE type = $1 LIMIT 1', ['annual']);
  const annualPolicy = annualPolicyRows[0];
  const annualConfig = getPolicyConfig(annualPolicy);
  const yearlyAllocation = Number(annualConfig.yearly_allocation_days ?? 30);
  const carryForwardLimit = Number(annualConfig.carry_forward_limit ?? 0);

  let carriedForwardAnnual = 0;
  let annualLapsed = 0;

  const { rows: previousRows } = await query(
    'SELECT * FROM leave_balances WHERE employee_id = $1 AND year = $2 LIMIT 1',
    [employeeId, year - 1]
  );

  if (previousRows[0] && carryForwardLimit > 0) {
    const previousAnnual = Math.max(Number(previousRows[0].annual || 0), 0);
    carriedForwardAnnual = Math.min(previousAnnual, carryForwardLimit);
    annualLapsed = Math.max(previousAnnual - carriedForwardAnnual, 0);
  }

  const { rows } = await query(
    `INSERT INTO leave_balances (employee_id, year, annual, sick, maternity_paternity, created_at, updated_at)
     VALUES ($1, $2, $3, 15, 30, NOW(), NOW())
     ON CONFLICT (employee_id, year) DO UPDATE SET year = EXCLUDED.year
     RETURNING *`,
    [employeeId, year, yearlyAllocation + carriedForwardAnnual]
  );

  if (carriedForwardAnnual > 0 || annualLapsed > 0) {
    await query(
      `UPDATE leave_balances
       SET carried_forward_annual = $1,
           annual_lapsed = $2,
           updated_at = NOW()
       WHERE employee_id = $3 AND year = $4`,
      [carriedForwardAnnual, annualLapsed, employeeId, year]
    );
  }

  return rows[0];
};

const calculateDays = (startDate, endDate) => {
  const start = toDate(startDate);
  const end = toDate(endDate);
  if (!start || !end || start > end) {
    return null;
  }

  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.floor((end.setHours(0, 0, 0, 0) - start.setHours(0, 0, 0, 0)) / msPerDay) + 1;
};

const hasLeaveOverlap = async (employeeId, startDate, endDate) => {
  const { rows } = await query(
    `SELECT 1 FROM leave_requests
     WHERE employee_id = $1
       AND status IN ('Pending', 'Approved', 'Pending_Documentation', 'Awaiting_Documentation', 'Pending_Approval')
       AND start_date <= $2
       AND end_date >= $3
     LIMIT 1`,
    [employeeId, endDate, startDate]
  );
  return rows.length > 0;
};

const getDepartmentLeaveConflictCount = async (department, startDate, endDate) => {
  if (!department) return 0;
  const { rows } = await query(
    `SELECT COUNT(DISTINCT lr.employee_id) AS count
     FROM leave_requests lr
     JOIN employees e ON e.id = lr.employee_id
     WHERE e.department = $1
       AND lr.status IN ('Pending', 'Approved', 'Pending_Documentation', 'Awaiting_Documentation', 'Pending_Approval')
       AND lr.start_date <= $2
       AND lr.end_date >= $3`,
    [department, endDate, startDate]
  );
  return Number(rows[0]?.count || 0);
};

const getDepartmentSize = async (department) => {
  if (!department) return 0;
  const { rows } = await query('SELECT COUNT(*) AS count FROM employees WHERE department = $1', [department]);
  return Number(rows[0]?.count || 0);
};

const requestLeave = async (req, res) => {
  try {
    const userId = normalizeId(req.user?.id);
    const employee = await getEmployeeByUserId(userId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee profile not found for authenticated user.' });
    }

    const type = formatLeaveType(req.body.type);
    const startDate = formatDateOnly(req.body.startDate);
    const endDate = formatDateOnly(req.body.endDate);
    const reason = toOptionalText(req.body.reason);
    const attachment = req.file;

    if (!type || !startDate || !endDate) {
      return res.status(400).json({ error: 'Leave type, start date and end date are required.' });
    }

    const days = calculateDays(startDate, endDate);
    const policy = await getLeavePolicy(type);
    const policyConfig = getPolicyConfig(policy);
    const chargeableDays = calculateChargeableDays(startDate, endDate, policyConfig);

    if (days === null || days <= 0) {
      return res.status(400).json({ error: 'Invalid leave dates. Ensure the start date is before or equal to the end date.' });
    }

    if (chargeableDays === null || chargeableDays <= 0) {
      return res.status(400).json({ error: 'Invalid leave dates. Ensure the start date is before or equal to the end date.' });
    }

    if (chargeableDays > policy.max_days) {
      return res.status(400).json({ error: `A ${type} leave request cannot exceed ${policy.max_days} days.` });
    }

    const balanceRow = await getLeaveBalanceRow(employee.id);
    const requiresBalance = policyConfig.requires_balance !== false && !['maternity', 'paternity', 'compassionate', 'unpaid'].includes(type);

    if (type === 'sick' && requiresBalance) {
      if (Number(balanceRow.sick) < chargeableDays && !policyConfig.allow_negative_balance) {
        return res.status(400).json({ error: 'Insufficient sick leave balance.' });
      }
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(today.getDate() - 1);
      const selected = new Date(startDate);
      if (selected.toDateString() !== today.toDateString() && selected.toDateString() !== yesterday.toDateString()) {
        return res.status(400).json({ error: 'Sick leave must start today or yesterday.' });
      }
    }

    if (type === 'annual' && requiresBalance) {
      const annualEffect = buildAnnualBalanceEffect(chargeableDays, balanceRow.annual, policyConfig);
      if (annualEffect.requires_unpaid_conversion) {
        return res.status(400).json({ error: 'Insufficient annual leave balance.' });
      }
    }

    if (type === 'maternity') {
      const tenureDays = calculateDays(employee.date_joined, new Date().toISOString().slice(0, 10));
      if (!employee.date_joined || tenureDays < 180) {
        return res.status(400).json({ error: 'Maternity leave requires at least 180 days of service.' });
      }
      if (policy.requires_attachment && !attachment) {
        return res.status(400).json({ error: 'Medical documentation is required for maternity leave requests.' });
      }
      if (employee.gender && employee.gender.toLowerCase() !== 'female') {
        return res.status(400).json({ error: 'Maternity leave requires a female employee record.' });
      }
    }

    if (type === 'paternity' && policy.requires_attachment && !attachment) {
      return res.status(400).json({ error: 'Paternity leave requires a supporting document.' });
    }

    if (policy.requires_attachment && !attachment && type !== 'sick') {
      return res.status(400).json({ error: 'A supporting attachment is required for this leave type.' });
    }

    if (await hasLeaveOverlap(employee.id, startDate, endDate)) {
      return res.status(409).json({ error: 'Leave request overlaps an existing request for the same dates.' });
    }

    const conflictCount = employee.department
      ? await getDepartmentLeaveConflictCount(employee.department, startDate, endDate)
      : 0;
    const departmentSize = conflictCount > 0 ? await getDepartmentSize(employee.department) : 0;
    const departmentConflictPct = departmentSize > 0 ? Number(((conflictCount / departmentSize) * 100).toFixed(2)) : 0;
    const managerWarningThreshold = Number(policyConfig.department_threshold_pct ?? 0);
    const requiresManagerWarning = managerWarningThreshold > 0 && departmentConflictPct >= managerWarningThreshold;

    let status = 'Pending';
    let instructions = null;

    if (type === 'sick') {
      if (chargeableDays > 2) {
        status = 'Pending_Documentation';
        instructions = 'A doctor’s note is required after your sick leave if it exceeds 2 days.';
      } else {
        status = policy.auto_approve_initial ? 'Approved' : 'Pending';
      }
    }

    if (['maternity', 'paternity', 'compassionate'].includes(type)) {
      status = 'Pending_Approval';
      instructions = type === 'maternity'
        ? 'Maternity leave is statutory and will be reviewed by a manager or admin before final approval. Annual leave continues to accrue during this absence.'
        : `This ${type} leave request will be reviewed by management.`;
    }

    if (requiresManagerWarning) {
      instructions = instructions
        ? `${instructions} Department leave coverage is above the configured threshold.`
        : 'Department leave coverage is above the configured threshold.';
    }

    const attachmentPath = attachment ? `/uploads/leave_docs/${attachment.filename}` : null;
    const payrollFlags = type === 'sick'
      ? buildSickPayrollFlags(chargeableDays, policyConfig)
      : type === 'maternity'
        ? {
            statutory: true,
            annual_accrual_continues: true,
            requires_balance: false,
          }
        : null;

    const leaveBalanceEffect = type === 'annual'
      ? buildAnnualBalanceEffect(chargeableDays, balanceRow.annual, policyConfig)
      : type === 'sick'
        ? {
            days: chargeableDays,
            before: Number(balanceRow.sick || 0),
            after: Number(balanceRow.sick || 0) - chargeableDays,
            allow_negative_balance: Boolean(policyConfig.allow_negative_balance),
          }
        : {
            days: chargeableDays,
            before: null,
            after: null,
            allow_negative_balance: false,
            statutory: type === 'maternity' || type === 'paternity',
          };

    const { rows } = await query(
      `INSERT INTO leave_requests (
         employee_id, type, start_date, end_date, reason, status,
         attachment_path, documentation_submitted, requires_attachment,
         department_conflict_count, department_conflict_pct, instructions,
         days_charged, payroll_flags, policy_snapshot, leave_balance_effect,
         requires_manager_warning, created_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, NOW(), NOW())
       RETURNING *`,
      [
        employee.id,
        type,
        startDate,
        endDate,
        reason,
        status,
        attachmentPath,
        Boolean(attachment),
        policy.requires_attachment,
        conflictCount,
        departmentConflictPct,
        instructions,
        chargeableDays,
        payrollFlags,
        {
          type,
          policy: policyConfig,
          days_requested: days,
          days_charged: chargeableDays,
        },
        leaveBalanceEffect,
        requiresManagerWarning,
      ]
    );

    return res.status(201).json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const uploadLeaveDocument = async (req, res) => {
  try {
    const leaveId = normalizeId(req.params.id);
    if (!leaveId) {
      return res.status(400).json({ error: 'Invalid leave request id.' });
    }

    if (!req.file) {
      return res.status(400).json({ error: 'Please upload a valid document (PDF, DOC, DOCX).' });
    }

    const { rows } = await query('SELECT * FROM leave_requests WHERE id = $1', [leaveId]);
    const leaveRequest = rows[0];
    if (!leaveRequest) {
      return res.status(404).json({ error: 'Leave request not found.' });
    }

    const newStatus = leaveRequest.status === 'Pending_Documentation'
      ? 'Awaiting_Documentation'
      : leaveRequest.status;

    const attachmentPath = `/uploads/leave_docs/${req.file.filename}`;
    const { rows: updatedRows } = await query(
      `UPDATE leave_requests
       SET attachment_path = $1,
           documentation_submitted = TRUE,
           status = $2,
           updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [attachmentPath, newStatus, leaveId]
    );

    return res.json(updatedRows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const updateLeaveStatus = async (req, res) => {
  const employeeRequestId = normalizeId(req.params.id);
  const approverId = normalizeId(req.body.approverId);
  const status = toOptionalText(req.body.status);

  if (!employeeRequestId || !['Approved', 'Rejected', 'Pending', 'Pending_Approval', 'Pending_Documentation', 'Awaiting_Documentation'].includes(status)) {
    return res.status(400).json({ error: 'Valid leave request id and status are required.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { rows } = await client.query('SELECT * FROM leave_requests WHERE id = $1 FOR UPDATE', [employeeRequestId]);
    const leaveRequest = rows[0];
    if (!leaveRequest) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Leave request not found.' });
    }

    if (status === 'Approved' && leaveRequest.status !== 'Approved') {
      const days = Number(leaveRequest.days_charged || calculateDays(leaveRequest.start_date, leaveRequest.end_date));
      const typeKey = formatLeaveType(leaveRequest.type);
      const balanceEffect = leaveRequest.leave_balance_effect || {};
      if (['sick', 'annual'].includes(typeKey)) {
        const { rows: balanceRows } = await client.query('SELECT * FROM leave_balances WHERE employee_id = $1 AND year = $2 FOR UPDATE', [leaveRequest.employee_id, getCurrentYear()]);
        if (!balanceRows[0]) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: 'Leave balance record not found.' });
        }

        const column = typeKey === 'annual' ? 'annual' : 'sick';
        const currentBalance = Number(balanceRows[0][column] || 0);
        const remaining = currentBalance - days;
        if (remaining < 0 && !balanceEffect.allow_negative_balance) {
          await client.query('ROLLBACK');
          return res.status(400).json({ error: `Insufficient ${leaveRequest.type.toLowerCase()} balance to approve this leave.` });
        }

        await client.query(
          `UPDATE leave_balances SET ${column} = $1, updated_at = NOW() WHERE employee_id = $2`,
          [remaining, leaveRequest.employee_id]
        );
      }

      if (typeKey === 'maternity') {
        await client.query(
          `UPDATE employees SET status = 'on_statutory_leave', updated_at = NOW() WHERE id = $1`,
          [leaveRequest.employee_id]
        );
      }
    }

    const { rows: updatedRows } = await client.query(
      `UPDATE leave_requests
       SET status = $1,
           approver_id = $2,
           updated_at = NOW(),
           decision_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [status, approverId, employeeRequestId]
    );

    await client.query('COMMIT');
    return res.json(updatedRows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    return res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
};

const getLeaveBalance = async (req, res) => {
  try {
    const employeeId = normalizeId(req.params.employeeId);
    if (!employeeId) {
      return res.status(400).json({ error: 'Invalid employee id.' });
    }

    const balanceRow = await getLeaveBalanceRow(employeeId);
    return res.json(balanceRow);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const getLeaves = async (req, res) => {
  try {
    const { rows } = await query('SELECT * FROM leave_requests ORDER BY created_at DESC');
    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const createLeave = async (req, res) => {
  return requestLeave(req, res);
};

const updateLeave = async (req, res) => {
  try {
    const id = normalizeId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid leave request id.' });
    }

    const fields = [];
    const values = [];
    const allowed = ['type', 'start_date', 'end_date', 'reason', 'status', 'approver_id'];

    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        values.push(req.body[key]);
        fields.push(`${key} = $${values.length}`);
      }
    }

    if (fields.length === 0) {
      return res.status(400).json({ error: 'No fields provided to update.' });
    }

    values.push(id);
    const { rows } = await query(
      `UPDATE leave_requests SET ${fields.join(', ')}, updated_at = NOW() WHERE id = $${values.length} RETURNING *`,
      values
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Leave request not found.' });
    }

    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const deleteLeave = async (req, res) => {
  try {
    const id = normalizeId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid leave request id.' });
    }

    const { rows } = await query('DELETE FROM leave_requests WHERE id = $1 RETURNING *', [id]);
    if (!rows[0]) {
      return res.status(404).json({ error: 'Leave request not found.' });
    }

    return res.json({ success: true, deleted: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  requestLeave,
  uploadLeaveDocument,
  updateLeaveStatus,
  getLeaveBalance,
  getLeaves,
  createLeave,
  updateLeave,
  deleteLeave,
};
