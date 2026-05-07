const { query } = require('../config/db');
const { normalizeId, formatDateOnly, toDate, toOptionalText } = require('../utils/postgres');
const { sendMpesaB2C } = require('../utils/mpesa');

const getEmployee = async (employeeId) => {
  const { rows } = await query('SELECT * FROM employees WHERE id = $1 LIMIT 1', [employeeId]);
  return rows[0] || null;
};

const getPayRate = async (employeeId) => {
  const { rows } = await query('SELECT * FROM pay_rates WHERE employee_id = $1 LIMIT 1', [employeeId]);
  return rows[0] || null;
};

const parsePeriod = (value) => {
  if (!value) {
    return null;
  }

  const source = String(value).trim();
  const match = source.match(/^(\d{4})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) {
    return null;
  }

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0));
  return {
    period: source,
    startDate: formatDateOnly(startDate),
    endDate: formatDateOnly(endDate),
  };
};

const getAttendanceHours = async (employeeId, startDate, endDate) => {
  const { rows } = await query(
    `SELECT COALESCE(SUM(total_hours_worked), 0) AS total_hours
     FROM attendance
     WHERE employee_id = $1
       AND attendance_date BETWEEN $2 AND $3`,
    [employeeId, startDate, endDate]
  );
  return Number(rows[0]?.total_hours || 0);
};

const getKpiBonus = async (employeeId, period) => {
  const { rows } = await query(
    `SELECT COALESCE(SUM(bonus_amount), 0) AS total_bonus
     FROM pending_bonuses
     WHERE employee_id = $1
       AND period = $2
       AND status = 'pending'`,
    [employeeId, period]
  );
  return Number(rows[0]?.total_bonus || 0);
};

const getUnpaidLeaveDeduction = async (employeeId, startDate, endDate, hourlyRate) => {
  const { rows } = await query(
    `SELECT start_date, end_date, type
     FROM leave_requests
     WHERE employee_id = $1
       AND status = 'Approved'
       AND type = 'Unpaid'
       AND start_date <= $2
       AND end_date >= $3`,
    [employeeId, endDate, startDate]
  );

  if (!rows.length || Number.isNaN(hourlyRate) || hourlyRate <= 0) {
    return 0;
  }

  const dailyRate = hourlyRate * 8;
  const calculateDays = (start, end) => {
    const from = toDate(start);
    const to = toDate(end);
    if (!from || !to || from > to) return 0;
    return Math.floor((to.setHours(0, 0, 0, 0) - from.setHours(0, 0, 0, 0)) / (24 * 60 * 60 * 1000)) + 1;
  };

  return rows.reduce((sum, request) => {
    return sum + calculateDays(request.start_date, request.end_date) * dailyRate;
  }, 0);
};

const normalizePaymentMethod = (value) => {
  const source = String(value || 'MPESA').trim().toUpperCase();
  return source === 'BANK' ? 'BANK' : 'MPESA';
};

const getApprovedPayslips = async () => {
  const { rows } = await query(
    `SELECT p.id,
            p.employee_id,
            p.period,
            p.gross_pay,
            p.overtime_pay,
            p.kpi_bonus,
            p.deductions,
            p.net_pay,
            p.status,
            COALESCE(p.payment_method, e.payment_method, 'MPESA') AS payment_method,
            p.payment_reference,
            p.payment_error,
            p.mpesa_transaction_id,
            p.disbursed_at,
            p.created_at,
            p.updated_at,
            e.first_name,
            e.last_name,
            e.phone AS phone_number,
            e.mpesa_phone_number,
            e.bank_account_number,
            e.bank_code,
            e.department
     FROM payslips p
     JOIN employees e ON e.id = p.employee_id
     WHERE p.status = 'Approved'
     ORDER BY p.created_at ASC`
  );

  return rows;
};

const getPayslipById = async (id) => {
  const { rows } = await query(
    `SELECT p.id,
            p.employee_id,
            p.period,
            p.gross_pay,
            p.overtime_pay,
            p.kpi_bonus,
            p.deductions,
            p.net_pay,
            p.status,
            COALESCE(p.payment_method, e.payment_method, 'MPESA') AS payment_method,
            p.payment_reference,
            p.payment_error,
            p.mpesa_transaction_id,
            p.disbursed_at,
            p.created_at,
            p.updated_at,
            e.first_name,
            e.last_name,
            e.phone AS phone_number,
            e.mpesa_phone_number,
            e.bank_account_number,
            e.bank_code,
            e.department
     FROM payslips p
     JOIN employees e ON e.id = p.employee_id
     WHERE p.id = $1`, [id]
  );
  return rows[0] || null;
};

const calculatePayroll = async (req, res) => {
  try {
    const employeeId = normalizeId(req.body.employeeId || req.query.employeeId);
    const periodValue = req.body.period || req.query.period || req.params.period;

    if (!employeeId || !periodValue) {
      return res.status(400).json({ error: 'employeeId and period are required' });
    }

    const period = parsePeriod(periodValue);
    if (!period) {
      return res.status(400).json({ error: 'period must be in YYYY-MM format' });
    }

    const employee = await getEmployee(employeeId);
    if (!employee) {
      return res.status(404).json({ error: 'Employee not found' });
    }

    const payRate = await getPayRate(employeeId);
    const baseRate = payRate?.base_rate !== null && payRate?.base_rate !== undefined
      ? Number(payRate.base_rate)
      : Number(employee.wage_rate || 0);
    const overtimeRate = payRate?.overtime_rate !== null && payRate?.overtime_rate !== undefined
      ? Number(payRate.overtime_rate)
      : Number((baseRate * 1.5).toFixed(2));

    const totalHours = await getAttendanceHours(employeeId, period.startDate, period.endDate);
    const standardHours = 160;
    const overtimeHours = Math.max(0, totalHours - standardHours);
    const regularHours = Math.min(totalHours, standardHours);
    const grossPay = Number((regularHours * baseRate).toFixed(2));
    const overtimePay = Number((overtimeHours * overtimeRate).toFixed(2));
    const kpiBonus = Number((await getKpiBonus(employeeId, period.period)).toFixed(2));
    const deductions = Number((await getUnpaidLeaveDeduction(employeeId, period.startDate, period.endDate, baseRate)).toFixed(2));
    const netPay = Number((grossPay + overtimePay + kpiBonus - deductions).toFixed(2));
    const paymentMethod = normalizePaymentMethod(employee.payment_method || 'MPESA');

    const { rows } = await query(
      `INSERT INTO payslips (
         employee_id, period, gross_pay, overtime_pay, kpi_bonus, deductions, net_pay,
         status, payment_method, created_at, updated_at
       )
       VALUES ($1, $2, $3, $4, $5, $6, $7, 'Draft', $8, NOW(), NOW())
       RETURNING *`,
      [employeeId, period.period, grossPay, overtimePay, kpiBonus, deductions, netPay, paymentMethod]
    );

    return res.status(201).json({ payslip: rows[0] });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const approvePayroll = async (req, res) => {
  try {
    const id = normalizeId(req.params.id);
    if (!id) {
      return res.status(400).json({ error: 'Invalid payslip id' });
    }

    const { rows } = await query(
      `UPDATE payslips
       SET status = 'Approved', updated_at = NOW()
       WHERE id = $1 AND status = 'Draft'
       RETURNING *`,
      [id]
    );

    if (!rows[0]) {
      return res.status(404).json({ error: 'Payslip not found or not in draft status' });
    }

    return res.json(rows[0]);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

const buildBankTransferRecord = (payslip) => {
  const reference = `BANK-${payslip.id}-${Date.now()}`;
  const csvLine = [
    payslip.employee_id,
    payslip.first_name,
    payslip.last_name,
    payslip.bank_code || '',
    payslip.bank_account_number || '',
    Number(payslip.net_pay || 0).toFixed(2),
    reference,
  ].join(',');

  return { reference, csvLine };
};

const extractMpesaCallback = (body = {}) => {
  const callback = body.Result || body.result || body.Body?.stkCallback || body.body?.stkCallback || body;
  const resultParameters = Array.isArray(callback?.ResultParameters?.ResultParameter)
    ? callback.ResultParameters.ResultParameter
    : Array.isArray(callback?.ResultParameters)
      ? callback.ResultParameters
      : [];

  const parameterMap = resultParameters.reduce((accumulator, item) => {
    if (item?.Key) {
      accumulator[item.Key] = item.Value;
    }
    return accumulator;
  }, {});

  const reference =
    callback?.OriginatorConversationID ||
    callback?.ConversationID ||
    callback?.TransactionID ||
    callback?.TransactionId ||
    callback?.MpesaReceiptNumber ||
    parameterMap.OriginatorConversationID ||
    parameterMap.ConversationID ||
    parameterMap.TransactionID ||
    parameterMap.TransactionId ||
    parameterMap.MpesaReceiptNumber ||
    null;

  const resultCodeValue =
    callback?.ResultCode ??
    callback?.resultCode ??
    callback?.Body?.stkCallback?.ResultCode ??
    body?.ResultCode ??
    parameterMap.ResultCode ??
    null;

  return {
    reference,
    resultCode: Number(resultCodeValue),
    resultDesc: callback?.ResultDesc || callback?.ResultDescription || body?.ResultDesc || 'Callback received',
    raw: callback,
    parameterMap,
  };
};

const disbursePayroll = async (req, res) => {
  try {
    let payslipsToProcess = [];
    if (req.body && req.body.payslipId) {
      const payslip = await getPayslipById(req.body.payslipId);
      if (payslip && ['Approved', 'Failed'].includes(payslip.status)) {
        payslipsToProcess = [payslip];
      }
    } else {
      payslipsToProcess = await getApprovedPayslips();
    }

    if (!payslipsToProcess.length) {
      return res.json({
        success: true,
        message: 'No valid approved or failed payslips found to disburse',
        summary: { total: 0, paid: 0, processing: 0, failed: 0, mpesa: 0, bank: 0 },
        results: [],
      });
    }

    const summary = {
      total: payslipsToProcess.length,
      paid: 0,
      processing: 0,
      failed: 0,
      mpesa: 0,
      bank: 0,
    };
    const results = [];

    for (const payslip of payslipsToProcess) {
      const paymentMethod = normalizePaymentMethod(payslip.payment_method);

      if (paymentMethod === 'BANK') {
        const bankRecord = buildBankTransferRecord(payslip);
        console.log('[Payroll] Bank transfer batch item', bankRecord);

        await query(
          `UPDATE payslips
           SET status = 'Paid',
               payment_method = 'BANK',
               payment_reference = $2,
               payment_error = NULL,
               disbursed_at = NOW(),
               updated_at = NOW()
           WHERE id = $1`,
          [payslip.id, bankRecord.reference]
        );

        summary.paid += 1;
        summary.bank += 1;
        results.push({ id: payslip.id, employeeId: payslip.employee_id, paymentMethod: 'BANK', status: 'Paid', reference: bankRecord.reference });
        continue;
      }

      const phoneNumber = payslip.mpesa_phone_number || payslip.phone_number;
      if (!phoneNumber) {
        const errorMessage = 'Missing employee phone number for M-Pesa disbursement';
        console.error('[Payroll] ' + errorMessage, { payslipId: payslip.id, employeeId: payslip.employee_id });
        await query(
          `UPDATE payslips
           SET status = 'Failed',
               payment_method = 'MPESA',
               payment_error = $2,
               updated_at = NOW()
           WHERE id = $1`,
          [payslip.id, errorMessage]
        );
        summary.failed += 1;
        results.push({ id: payslip.id, employeeId: payslip.employee_id, paymentMethod: 'MPESA', status: 'Failed', error: errorMessage });
        continue;
      }

      const localReference = `PAYSLIP-${payslip.id}-${Date.now()}`;
      await query(
        `UPDATE payslips
         SET status = 'Processing',
             payment_method = 'MPESA',
             payment_reference = $2,
             payment_error = NULL,
             updated_at = NOW()
         WHERE id = $1`,
        [payslip.id, localReference]
      );

      try {
        console.log('[Payroll] Sending M-Pesa B2C payment', {
          payslipId: payslip.id,
          employeeId: payslip.employee_id,
          amount: Number(payslip.net_pay || 0),
          phoneNumber,
          reference: localReference,
        });

        const mpesaResult = await sendMpesaB2C({
          amount: payslip.net_pay,
          partyB: phoneNumber,
          reference: localReference,
        });

        const storedReference = mpesaResult.originatorConversationId || mpesaResult.conversationId || localReference;

        await query(
          `UPDATE payslips
           SET status = 'Processing',
               payment_reference = $2,
               mpesa_transaction_id = $3,
               payment_method = 'MPESA',
               updated_at = NOW()
           WHERE id = $1`,
          [payslip.id, storedReference, mpesaResult.conversationId || mpesaResult.originatorConversationId]
        );

        summary.processing += 1;
        summary.mpesa += 1;
        results.push({
          id: payslip.id,
          employeeId: payslip.employee_id,
          paymentMethod: 'MPESA',
          status: 'Processing',
          reference: storedReference,
          responseCode: mpesaResult.responseCode,
          responseDescription: mpesaResult.responseDescription,
        });
      } catch (error) {
        console.error('[Payroll] M-Pesa disbursement failed', {
          payslipId: payslip.id,
          employeeId: payslip.employee_id,
          error: error.message,
        });

        await query(
          `UPDATE payslips
           SET status = 'Failed',
               payment_error = $2,
               updated_at = NOW()
           WHERE id = $1`,
          [payslip.id, error.message]
        );

        summary.failed += 1;
        results.push({ id: payslip.id, employeeId: payslip.employee_id, paymentMethod: 'MPESA', status: 'Failed', error: error.message });
      }
    }

    return res.json({
      success: true,
      message: 'Payroll disbursement processed',
      summary,
      results,
    });
  } catch (err) {
    console.error('[Payroll] Disbursement error', err);
    return res.status(500).json({ error: err.message });
  }
};

const handleMpesaCallback = async (req, res) => {
  try {
    const callback = extractMpesaCallback(req.body);

    if (!callback.reference) {
      console.error('[Payroll] M-Pesa callback missing reference', req.body);
      return res.status(400).json({ error: 'Callback reference missing' });
    }

    const isSuccess = Number(callback.resultCode) === 0;
    const newStatus = isSuccess ? 'Paid' : 'Failed';
    const paymentError = isSuccess ? null : callback.resultDesc;

    const { rows } = await query(
      `UPDATE payslips
       SET status = $1,
           payment_error = $2,
           disbursed_at = CASE WHEN $1 = 'Paid' THEN COALESCE(disbursed_at, NOW()) ELSE disbursed_at END,
           updated_at = NOW()
       WHERE payment_reference = $3
          OR mpesa_transaction_id = $3
          OR CAST(id AS TEXT) = $3
       RETURNING *`,
      [newStatus, paymentError, callback.reference]
    );

    if (!rows[0]) {
      console.error('[Payroll] No payslip found for callback reference', callback.reference);
      return res.status(404).json({ error: 'Payslip not found for callback reference' });
    }

    if (!isSuccess) {
      console.error('[Payroll] M-Pesa callback reported failure', {
        reference: callback.reference,
        resultCode: callback.resultCode,
        resultDesc: callback.resultDesc,
      });
    }

    return res.json({ success: true, payslip: rows[0], callback });
  } catch (err) {
    console.error('[Payroll] Callback handler error', err);
    return res.status(500).json({ error: err.message });
  }
};

const getPayslips = async (req, res) => {
  try {
    const statusFilter = toOptionalText(req.query.status);
    const params = [];
    let whereClause = '';

    if (statusFilter) {
      params.push(statusFilter);
      whereClause = `WHERE p.status = $${params.length}`;
    }

    const { rows } = await query(
      `SELECT p.id,
              p.employee_id,
              p.period,
              p.gross_pay,
              p.overtime_pay,
              p.kpi_bonus,
              p.deductions,
              p.net_pay,
              p.status,
              p.payment_method,
              p.payment_reference,
              p.payment_error,
              p.mpesa_transaction_id,
              p.disbursed_at,
              p.created_at,
              p.updated_at,
              e.first_name,
              e.last_name,
              e.phone AS phone_number,
              e.mpesa_phone_number,
              e.bank_account_number,
              e.bank_code,
              e.department
       FROM payslips p
       JOIN employees e ON e.id = p.employee_id
       ${whereClause}
       ORDER BY p.created_at DESC`,
      params
    );

    return res.json(rows);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};

module.exports = {
  calculatePayroll,
  approvePayroll,
  disbursePayroll,
  handleMpesaCallback,
  getPayslips,
};