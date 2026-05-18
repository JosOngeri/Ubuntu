const { query } = require('../config/db');
const { normalizeId, toOptionalText, toDate } = require('../utils/postgres');

const toJsonb = (value, fallback = null) => JSON.stringify(value ?? fallback);

const mapRow = (row) => {
  if (!row) {
    return null;
  }

  return new Employee({
    id: row.id,
    userId: row.user_id,
    status: row.status,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone,
    biometricDeviceId: row.biometric_device_id,
    mpesaPhoneNumber: row.mpesa_phone_number,
    employmentType: row.employment_type,
    wageRate: row.wage_rate === null ? null : Number(row.wage_rate),
    department: row.department,
    dateJoined: row.date_joined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    dateOfBirth: row.date_of_birth,
    gender: row.gender,
    maritalStatus: row.marital_status,
    nationality: row.nationality,
    nationalId: row.national_id,
    residentialAddress: row.residential_address,
    emergencyContact: row.emergency_contact,
    educationHistory: row.education_history,
    employmentHistory: row.employment_history,
    skills: row.skills,
    certifications: row.certifications,
  });
};

class Employee {
  constructor(data = {}) {
    this.id = normalizeId(data.id) ?? data.id ?? null;
    this.userId = data.userId ?? null;
    this.status = data.status ?? 'active';
    this.firstName = data.firstName ?? null;
    this.lastName = data.lastName ?? null;
    this.email = data.email ?? null;
    this.phone = data.phone ?? null;
    this.biometricDeviceId = data.biometricDeviceId ?? null;
    this.mpesaPhoneNumber = data.mpesaPhoneNumber ?? null;
    this.employmentType = data.employmentType ?? null;
    this.wageRate = data.wageRate ?? null;
    this.department = data.department ?? null;
    this.dateJoined = data.dateJoined ?? data.date_joined ?? null;
    this.createdAt = data.createdAt ?? data.created_at ?? null;
    this.updatedAt = data.updatedAt ?? data.updated_at ?? null;
    this.dateOfBirth = data.dateOfBirth ?? null;
    this.gender = data.gender ?? null;
    this.maritalStatus = data.maritalStatus ?? null;
    this.nationality = data.nationality ?? null;
    this.nationalId = data.nationalId ?? null;
    this.residentialAddress = data.residentialAddress ?? null;
    this.emergencyContact = data.emergencyContact ?? null;
    this.educationHistory = data.educationHistory ?? null;
    this.employmentHistory = data.employmentHistory ?? null;
    this.skills = data.skills ?? null;
    this.certifications = data.certifications ?? null;
  }

  static fromRow(row) {
    return mapRow(row);
  }

  static async find() {
    const { rows } = await query('SELECT * FROM employees ORDER BY created_at DESC');
    return rows.map(mapRow);
  }

  static async findById(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) {
      return null;
    }

    const { rows } = await query('SELECT * FROM employees WHERE id = $1 LIMIT 1', [normalizedId]);
    return mapRow(rows[0]);
  }

  static async findOne(criteria = {}) {
    if (criteria.userId !== undefined) {
      const normalizedUserId = normalizeId(criteria.userId);
      if (!normalizedUserId) {
        return null;
      }

      const { rows } = await query(
        'SELECT * FROM employees WHERE user_id = $1 LIMIT 1',
        [normalizedUserId]
      );
      return mapRow(rows[0]);
    }

    if (criteria.biometricDeviceId !== undefined) {
      const { rows } = await query(
        'SELECT * FROM employees WHERE biometric_device_id = $1 LIMIT 1',
        [criteria.biometricDeviceId]
      );
      return mapRow(rows[0]);
    }

    if (criteria.email !== undefined) {
      const { rows } = await query('SELECT * FROM employees WHERE email = $1 LIMIT 1', [criteria.email]);
      return mapRow(rows[0]);
    }

    return null;
  }

  static async findByIdAndDelete(id) {
    const normalizedId = normalizeId(id);
    if (!normalizedId) {
      return null;
    }

    const { rows } = await query('DELETE FROM employees WHERE id = $1 RETURNING *', [normalizedId]);
    return mapRow(rows[0]);
  }

  static async findByIdAndUpdate(id, update = {}) {
    const employee = await Employee.findById(id);
    if (!employee) {
      return null;
    }

    employee.set(update);
    await employee.save();
    return employee;
  }

  set(update = {}) {
    Object.assign(this, update);
  }

  async save() {
    const now = new Date();
    const normalizedEmail = toOptionalText(this.email);
    const normalizedPhone = toOptionalText(this.phone);
    const normalizedBiometricDeviceId = toOptionalText(this.biometricDeviceId);
    const normalizedMpesaPhoneNumber = toOptionalText(this.mpesaPhoneNumber);
    const normalizedDepartment = toOptionalText(this.department);
    const normalizedWageRate = this.wageRate === null || this.wageRate === undefined ? null : Number(this.wageRate);
    const normalizedDateJoined = this.dateJoined ? toDate(this.dateJoined) : now;
    const normalizedDateOfBirth = this.dateOfBirth ? toDate(this.dateOfBirth) : null;

    if (this.id) {
      const { rows } = await query(
        `
          UPDATE employees
          SET first_name = $1,
              last_name = $2,
              email = $3,
              phone = $4,
              biometric_device_id = $5,
              mpesa_phone_number = $6,
              employment_type = $7,
              wage_rate = $8,
              department = $9,
              date_joined = COALESCE($10, date_joined),
              updated_at = $11,
              date_of_birth = $12,
              gender = $13,
              marital_status = $14,
              nationality = $15,
              national_id = $16,
              residential_address = $17,
              emergency_contact = $18,
              education_history = $19,
              employment_history = $20,
              skills = $21,
              certifications = $22
          WHERE id = $23
          RETURNING *
        `,
        [
          this.firstName,
          this.lastName,
          normalizedEmail,
          normalizedPhone,
          normalizedBiometricDeviceId,
          normalizedMpesaPhoneNumber,
          this.employmentType,
          normalizedWageRate,
          normalizedDepartment,
          normalizedDateJoined,
          now,
          normalizedDateOfBirth,
          this.gender,
          this.maritalStatus,
          this.nationality,
          this.nationalId,
          toJsonb(this.residentialAddress),
          toJsonb(this.emergencyContact),
          toJsonb(this.educationHistory),
          toJsonb(this.employmentHistory),
          toJsonb(this.skills),
          toJsonb(this.certifications),
          this.id,
        ]
      );

      Object.assign(this, mapRow(rows[0]));
      return this;
    }

    const { rows } = await query(
      `
        INSERT INTO employees (
          user_id, status, first_name, last_name, email, phone, biometric_device_id, mpesa_phone_number,
          employment_type, wage_rate, department, date_joined, created_at, updated_at,
          date_of_birth, gender, marital_status, nationality, national_id,
          residential_address, emergency_contact, education_history, employment_history, skills, certifications
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $13,
          $14, $15, $16, $17, $18, $19, $20, $21, $22, $23)
        RETURNING *
      `,
      [
        this.userId,
        this.status,
        this.firstName,
        this.lastName,
        normalizedEmail,
        normalizedPhone,
        normalizedBiometricDeviceId,
        normalizedMpesaPhoneNumber,
        this.employmentType,
        normalizedWageRate,
        normalizedDepartment,
        normalizedDateJoined,
        now,
        normalizedDateOfBirth,
        this.gender,
        this.maritalStatus,
        this.nationality,
        this.nationalId,
        toJsonb(this.residentialAddress),
        toJsonb(this.emergencyContact),
        toJsonb(this.educationHistory),
        toJsonb(this.employmentHistory),
        toJsonb(this.skills),
        toJsonb(this.certifications),
      ]
    );

    Object.assign(this, mapRow(rows[0]));
    return this;
  }

  get fullName() {
    return `${this.firstName || ''} ${this.lastName || ''}`.trim();
  }

  toJSON() {
    return {
      _id: String(this.id),
      id: String(this.id),
      userId: this.userId,
      status: this.status,
      firstName: this.firstName,
      lastName: this.lastName,
      fullName: this.fullName,
      email: this.email,
      phone: this.phone,
      biometricDeviceId: this.biometricDeviceId,
      mpesaPhoneNumber: this.mpesaPhoneNumber,
      employmentType: this.employmentType,
      wageRate: this.wageRate === null || this.wageRate === undefined ? null : Number(this.wageRate),
      department: this.department,
      dateJoined: this.dateJoined,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      dateOfBirth: this.dateOfBirth,
      gender: this.gender,
      maritalStatus: this.maritalStatus,
      nationality: this.nationality,
      nationalId: this.nationalId,
      residentialAddress: this.residentialAddress,
      emergencyContact: this.emergencyContact,
      educationHistory: this.educationHistory,
      employmentHistory: this.employmentHistory,
      skills: this.skills,
      certifications: this.certifications,
    };
  }
}

module.exports = Employee;