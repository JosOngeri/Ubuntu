const { query } = require('../config/db');
const { formatDateOnly, normalizeId, parseJson, toDate } = require('../utils/postgres');

const mapRow = (row) => {
  if (!row) {
    return null;
  }

  return new Attendance({
    id: row.id,
    employeeId: row.employee_id,
    attendanceDate: row.attendance_date,
    status: row.status,
    shift: row.shift,
    punchState: row.punch_state,
    checkIn: row.check_in,
    breakOut: row.break_out,
    breakIn: row.break_in,
    checkOut: row.check_out,
    totalHoursWorked: row.total_hours_worked === null ? null : Number(row.total_hours_worked),
    punchHistory: parseJson(row.punch_history, []),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  });
};

class Attendance {
  constructor(data = {}) {
    this.id = normalizeId(data.id) ?? data.id ?? null;
    this.employeeId = normalizeId(data.employeeId) ?? data.employeeId ?? null;
    this.attendanceDate = data.attendanceDate ?? null;
    this.status = data.status ?? 'Present';
    this.shift = data.shift ?? null;
    this.punchState = data.punchState ?? null;
    this.checkIn = data.checkIn ?? null;
    this.breakOut = data.breakOut ?? null;
    this.breakIn = data.breakIn ?? null;
    this.checkOut = data.checkOut ?? null;
    this.totalHoursWorked = data.totalHoursWorked ?? null;
    this.punchHistory = Array.isArray(data.punchHistory) ? data.punchHistory : (data.punchHistory ?? []);
    this.createdAt = data.createdAt ?? data.created_at ?? null;
    this.updatedAt = data.updatedAt ?? data.updated_at ?? null;
  }

  static fromRow(row) {
    return mapRow(row);
  }

  static async find(criteria = {}) {
    if (criteria.employeeId !== undefined && criteria.attendanceDate !== undefined) {
      const { rows } = await query(
        'SELECT * FROM attendance WHERE employee_id = $1 AND attendance_date = $2 LIMIT 1',
        [normalizeId(criteria.employeeId), formatDateOnly(criteria.attendanceDate)]
      );
      return rows.map(mapRow);
    }

    if (criteria.employeeId !== undefined) {
      const { rows } = await query(
        'SELECT * FROM attendance WHERE employee_id = $1 ORDER BY attendance_date DESC, created_at DESC',
        [normalizeId(criteria.employeeId)]
      );
      return rows.map(mapRow);
    }

    const { rows } = await query('SELECT * FROM attendance ORDER BY attendance_date DESC, created_at DESC');
    return rows.map(mapRow);
  }

  static async findByEmployeeId(employeeId) {
    return Attendance.find({ employeeId });
  }

  static async findOne(criteria = {}) {
    const matches = await Attendance.find(criteria);
    return matches[0] || null;
  }

  static async findById(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) {
      return null;
    }

    const { rows } = await query('SELECT * FROM attendance WHERE id = $1 LIMIT 1', [normalizedId]);
    return mapRow(rows[0]);
  }

  static async findByIdAndDelete(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) {
      return null;
    }

    const { rows } = await query('DELETE FROM attendance WHERE id = $1 RETURNING *', [normalizedId]);
    return mapRow(rows[0]);
  }

  static async deleteMany(criteria = {}) {
    if (criteria.employeeId !== undefined) {
      await query('DELETE FROM attendance WHERE employee_id = $1', [normalizeId(criteria.employeeId)]);
    }
  }

  static async findByIdAndUpdate(id, update = {}) {
    const attendance = await Attendance.findById(id);
    if (!attendance) {
      return null;
    }

    attendance.set(update);
    await attendance.save();
    return attendance;
  }

  set(update = {}) {
    Object.assign(this, update);
  }

  async save() {
    const now = new Date();
    const employeeId = normalizeId(this.employeeId);
    const attendanceDate = formatDateOnly(this.attendanceDate);
    const checkIn = this.checkIn ? toDate(this.checkIn) : null;
    const breakOut = this.breakOut ? toDate(this.breakOut) : null;
    const breakIn = this.breakIn ? toDate(this.breakIn) : null;
    const checkOut = this.checkOut ? toDate(this.checkOut) : null;
    const punchHistory = JSON.stringify(this.punchHistory || []);
    const totalHoursWorked = this.totalHoursWorked === null || this.totalHoursWorked === undefined
      ? null
      : Number(this.totalHoursWorked);

    if (this.id) {
      const { rows } = await query(
        `
          UPDATE attendance
          SET employee_id = $1,
              attendance_date = $2,
              status = $3,
              shift = $4,
              punch_state = $5,
              check_in = $6,
              break_out = $7,
              break_in = $8,
              check_out = $9,
              total_hours_worked = $10,
              punch_history = $11::jsonb,
              updated_at = $12
          WHERE id = $13
          RETURNING *
        `,
        [
          employeeId,
          attendanceDate,
          this.status,
          this.shift,
          this.punchState,
          checkIn,
          breakOut,
          breakIn,
          checkOut,
          totalHoursWorked,
          punchHistory,
          now,
          this.id,
        ]
      );

      Object.assign(this, mapRow(rows[0]));
      return this;
    }

    const { rows } = await query(
      `
        INSERT INTO attendance (
          employee_id, attendance_date, status, shift, punch_state,
          check_in, break_out, break_in, check_out, total_hours_worked, punch_history,
          created_at, updated_at
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11::jsonb, $12, $12)
        ON CONFLICT (employee_id, attendance_date)
        DO UPDATE SET
          status = EXCLUDED.status,
          shift = EXCLUDED.shift,
          punch_state = EXCLUDED.punch_state,
          check_in = EXCLUDED.check_in,
          break_out = EXCLUDED.break_out,
          break_in = EXCLUDED.break_in,
          check_out = EXCLUDED.check_out,
          total_hours_worked = EXCLUDED.total_hours_worked,
          punch_history = EXCLUDED.punch_history,
          updated_at = EXCLUDED.updated_at
        RETURNING *
      `,
      [
        employeeId,
        attendanceDate,
        this.status,
        this.shift,
        this.punchState,
        checkIn,
        breakOut,
        breakIn,
        checkOut,
        totalHoursWorked,
        punchHistory,
        now,
      ]
    );

    Object.assign(this, mapRow(rows[0]));
    return this;
  }

  toJSON() {
    return {
      _id: String(this.id),
      id: String(this.id),
      employeeId: String(this.employeeId),
      attendanceDate: this.attendanceDate,
      status: this.status,
      shift: this.shift,
      punchState: this.punchState,
      checkIn: this.checkIn,
      breakOut: this.breakOut,
      breakIn: this.breakIn,
      checkOut: this.checkOut,
      totalHoursWorked: this.totalHoursWorked,
      punchHistory: this.punchHistory,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

module.exports = Attendance;