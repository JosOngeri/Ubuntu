const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();





const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  'postgres://postgres:postgres@127.0.0.1:5432/ubuntu_hrms';

const pool = new Pool({
  connectionString,
  ssl: process.env.PGSSLMODE === 'require' ? { rejectUnauthorized: false } : undefined,
  max: Number(process.env.PGPOOL_MAX || 10),
});

pool.on('error', (error) => {
  console.error('Unexpected PostgreSQL pool error:', error.message);
});

const query = (text, params) => pool.query(text, params);

const initDatabase = async () => {
  await query(`
    CREATE TABLE IF NOT EXISTS users (
      id BIGSERIAL PRIMARY KEY,
      username TEXT NOT NULL UNIQUE,
      email TEXT UNIQUE,
      password TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'manager' CHECK (role IN ('admin', 'manager', 'supervisor', 'employee')),
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('active', 'pending', 'inactive')),
      must_change_password BOOLEAN NOT NULL DEFAULT FALSE,
      reset_token TEXT,
      reset_token_expire TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending'`);
  await query(`ALTER TABLE users DROP CONSTRAINT IF EXISTS users_status_check`);
  await query(`ALTER TABLE users ADD CONSTRAINT users_status_check CHECK (status IN ('active', 'pending', 'inactive'))`);
  await query(`ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE`);

  await query(`
    CREATE TABLE IF NOT EXISTS employees (
      id BIGSERIAL PRIMARY KEY,
      user_id BIGINT UNIQUE REFERENCES users(id) ON DELETE SET NULL,
      status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending', 'terminated')),
      first_name TEXT NOT NULL,
      last_name TEXT NOT NULL,
      email TEXT,
      phone TEXT NOT NULL,
      biometric_device_id TEXT UNIQUE,
      mpesa_phone_number TEXT NOT NULL,
      employment_type TEXT NOT NULL CHECK (employment_type IN ('Daily', 'Contractor', 'Permanent')),
      wage_rate NUMERIC(12,2) NOT NULL CHECK (wage_rate >= 0),
      department TEXT NOT NULL,
      date_joined TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS user_id BIGINT`);
  await query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'`);
  await query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_account_number TEXT`);
  await query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS bank_code TEXT`);
  await query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS payment_method TEXT`);
  await query(`ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_user_id_key`);
  await query(`ALTER TABLE employees ADD CONSTRAINT employees_user_id_key UNIQUE (user_id)`);
  await query(`ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_user_id_fkey`);
  await query(`ALTER TABLE employees ADD CONSTRAINT employees_user_id_fkey FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL`);
  await query(`ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_status_check`);
  await query(`ALTER TABLE employees ADD CONSTRAINT employees_status_check CHECK (status IN ('active', 'inactive', 'pending', 'terminated'))`);
  await query(`UPDATE employees SET payment_method = COALESCE(payment_method, 'MPESA')`);
  await query(`ALTER TABLE employees ALTER COLUMN payment_method SET DEFAULT 'MPESA'`);
  await query(`ALTER TABLE employees ALTER COLUMN payment_method SET NOT NULL`);
  await query(`ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_payment_method_check`);
  await query(`ALTER TABLE employees ADD CONSTRAINT employees_payment_method_check CHECK (payment_method IN ('MPESA', 'BANK'))`);
  
  // Attendance permission for permanent workers
  await query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS can_self_record_attendance BOOLEAN NOT NULL DEFAULT true`);

  // Settings table for work area location and configuration
  await query(`
    CREATE TABLE IF NOT EXISTS settings (
      id BIGSERIAL PRIMARY KEY,
      setting_key TEXT NOT NULL UNIQUE,
      setting_value TEXT NOT NULL,
      description TEXT,
      updated_by BIGINT REFERENCES users(id) ON DELETE SET NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Insert default settings if they don't exist
  await query(`
    INSERT INTO settings (setting_key, setting_value, description)
    VALUES 
      ('OFFICE_LATITUDE', '-1.19293', 'Office location latitude'),
      ('OFFICE_LONGITUDE', '36.93057', 'Office location longitude'),
      ('OFFICE_RADIUS_METERS', '1000', 'Allowed work location radius in meters'),
      ('OFFICE_NAME', 'Main Office', 'Name of the office location')
    ON CONFLICT (setting_key) DO NOTHING
  `);

  // Recruitment: Jobs table
  await query(`
    CREATE TABLE IF NOT EXISTS jobs (
      id SERIAL PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      description TEXT NOT NULL,
      department VARCHAR(100),
      location VARCHAR(100),
      employmentType VARCHAR(50),
      status VARCHAR(20) DEFAULT 'open',
      postedBy INTEGER,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Keep legacy jobs tables in sync with the current recruitment fields.
  await query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS employmenttype VARCHAR(50)`);
  await query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS salaryrange VARCHAR(100)`);
  await query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS requirements TEXT`);
  await query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS responsibilities TEXT`);
  await query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS benefits TEXT`);
  await query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS applicationdeadline DATE`);

  // Contractor-related tables
  await query(`
    CREATE TABLE IF NOT EXISTS projects (
      id SERIAL PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      contractor_id INTEGER REFERENCES users(id),
      status VARCHAR(50) DEFAULT 'active',
      due_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS invoices (
      id VARCHAR(20) PRIMARY KEY,
      contractor_id INTEGER REFERENCES users(id),
      amount DECIMAL(10,2) NOT NULL,
      status VARCHAR(50) DEFAULT 'draft',
      due_date DATE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS contractor_performance (
      id SERIAL PRIMARY KEY,
      contractor_id INTEGER REFERENCES users(id),
      delivery_rate DECIMAL(5,2),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Insert sample data for contractors (assuming user with id 1 is contractor)
  try {
    await query(`
      INSERT INTO projects (name, contractor_id, status, due_date)
      VALUES 
        ('HR System Integrations', 1, 'In Progress', '2026-06-18'),
        ('Payroll Automation', 1, 'Review', '2026-06-24'),
        ('Benefits Onboarding', 1, 'Completed', '2026-05-30')
      ON CONFLICT DO NOTHING
    `);

    await query(`
      INSERT INTO invoices (id, contractor_id, amount, status, due_date)
      VALUES 
        ('INV-202', 1, 1850.00, 'Pending', '2026-06-25'),
        ('INV-203', 1, 920.00, 'Approved', '2026-06-12'),
        ('INV-204', 1, 1340.00, 'Draft', '2026-07-05')
      ON CONFLICT DO NOTHING
    `);

    await query(`
      INSERT INTO contractor_performance (contractor_id, delivery_rate)
      VALUES (1, 92.00)
      ON CONFLICT DO NOTHING
    `);
  } catch (error) {
    console.log('Sample data insertion skipped or failed:', error.message);
  }
  await query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS postedby INTEGER`);
  await query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS createdat TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);
  await query(`ALTER TABLE jobs ADD COLUMN IF NOT EXISTS updatedat TIMESTAMP DEFAULT CURRENT_TIMESTAMP`);

  // Recruitment: Job Applications table
  await query(`
    CREATE TABLE IF NOT EXISTS job_applications (
      id SERIAL PRIMARY KEY,
      jobId INTEGER REFERENCES jobs(id) ON DELETE CASCADE,
      applicantName VARCHAR(255) NOT NULL,
      applicantEmail VARCHAR(255) NOT NULL,
      applicantPhone VARCHAR(50),
      cvPath VARCHAR(255),
      coverLetter TEXT,
      applicationData JSONB,
      recruiterAnnouncement TEXT,
      status VARCHAR(20) DEFAULT 'pending',
      appliedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await query(`ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS coverletter TEXT`);
  await query(`ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS applicationdata JSONB`);
  await query(`ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS recruiterannouncement TEXT`);

  // Legacy and manual linking of applications to users.
  await query(`ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS user_id BIGINT`);
  await query(`ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS linked_via TEXT`);
  await query(`ALTER TABLE job_applications ADD COLUMN IF NOT EXISTS linked_at TIMESTAMPTZ`);

  await query(`
    CREATE TABLE IF NOT EXISTS application_user_links (
      id SERIAL PRIMARY KEY,
      application_id INTEGER NOT NULL UNIQUE REFERENCES job_applications(id) ON DELETE CASCADE,
      user_id BIGINT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      link_reason TEXT,
      linked_by TEXT DEFAULT 'migration',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  // Professional Profile table for job applications
  await query(`
    CREATE TABLE IF NOT EXISTS profiles (
      id SERIAL PRIMARY KEY,
      userId INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
      fullName VARCHAR(255),
      skills TEXT[],
      certifications TEXT[],
      workHistory JSONB,
      education JSONB,
      createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Keep profiles table in sync with expanded profile payload fields.
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS photourl TEXT`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS email VARCHAR(255)`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone VARCHAR(50)`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS address TEXT`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dateofbirth DATE`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS nationalid VARCHAR(100)`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS emergencycontact JSONB`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS professionalheadline TEXT`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS summary TEXT`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employeeid VARCHAR(50)`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS jobtitle VARCHAR(100)`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department VARCHAR(100)`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status VARCHAR(50)`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dateofjoining DATE`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS employmenttype VARCHAR(50)`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS worklocation TEXT`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS reportingmanager VARCHAR(100)`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS projects JSONB`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS awards JSONB`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS languages JSONB`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS memberships JSONB`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS "references" JSONB`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS volunteer JSONB`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS publications JSONB`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS interests TEXT[]`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS payroll JSONB`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS leaveinfo JSONB`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS contracts JSONB`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS performance JSONB`);
  await query(`ALTER TABLE profiles ADD COLUMN IF NOT EXISTS documents JSONB`);

  await query(`
    CREATE TABLE IF NOT EXISTS attendance (
      id BIGSERIAL PRIMARY KEY,
      employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      attendance_date DATE NOT NULL,
      status TEXT NOT NULL DEFAULT 'Present' CHECK (status IN ('Present', 'Absent', 'Leave')),
      shift TEXT CHECK (shift IN ('Morning', 'Afternoon')),
      punch_state TEXT CHECK (punch_state IN ('checkIn', 'breakOut', 'breakIn', 'checkOut')),
      check_in TIMESTAMPTZ,
      break_out TIMESTAMPTZ,
      break_in TIMESTAMPTZ,
      check_out TIMESTAMPTZ,
      total_hours_worked NUMERIC(8,2),
      punch_history JSONB NOT NULL DEFAULT '[]'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (employee_id, attendance_date)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS kpi_definitions (
      id BIGSERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT,
      max_score NUMERIC(8,2) NOT NULL DEFAULT 100,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS employee_kpis (
      id BIGSERIAL PRIMARY KEY,
      employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      evaluator_id BIGINT NOT NULL REFERENCES users(id) ON DELETE SET NULL,
      definition_id BIGINT NOT NULL REFERENCES kpi_definitions(id) ON DELETE CASCADE,
      period TEXT NOT NULL,
      target_value NUMERIC(12,2) NOT NULL,
      achieved_value NUMERIC(12,2),
      final_score NUMERIC(8,2),
      status TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Evaluated', 'Completed', 'Rejected')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS pending_bonuses (
      id BIGSERIAL PRIMARY KEY,
      employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      employee_kpi_id BIGINT NOT NULL REFERENCES employee_kpis(id) ON DELETE CASCADE,
      period TEXT NOT NULL,
      bonus_type TEXT NOT NULL DEFAULT 'KPI Raise',
      bonus_amount NUMERIC(12,2) NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processed', 'paid')),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (employee_kpi_id, period)
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS leave_balances (
      id BIGSERIAL PRIMARY KEY,
      employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INT,
      annual NUMERIC(8,2) NOT NULL DEFAULT 30,
      sick NUMERIC(8,2) NOT NULL DEFAULT 15,
      maternity_paternity NUMERIC(8,2) NOT NULL DEFAULT 30,
      carried_forward_annual NUMERIC(8,2) NOT NULL DEFAULT 0,
      annual_lapsed NUMERIC(8,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE (employee_id, year)
    )
  `);

  await query(`ALTER TABLE leave_balances ALTER COLUMN annual SET DEFAULT 30`);
  await query(`ALTER TABLE leave_balances ALTER COLUMN sick SET DEFAULT 15`);
  await query(`ALTER TABLE leave_balances ALTER COLUMN maternity_paternity SET DEFAULT 30`);
  await query(`ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS year INTEGER NOT NULL DEFAULT EXTRACT(YEAR FROM NOW())::INT`);
  await query(`ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS carried_forward_annual NUMERIC(8,2) NOT NULL DEFAULT 0`);
  await query(`ALTER TABLE leave_balances ADD COLUMN IF NOT EXISTS annual_lapsed NUMERIC(8,2) NOT NULL DEFAULT 0`);
  await query(`ALTER TABLE leave_balances DROP CONSTRAINT IF EXISTS leave_balances_employee_id_key`);
  await query(`ALTER TABLE leave_balances DROP CONSTRAINT IF EXISTS leave_balances_employee_id_unique`);
  await query(`CREATE UNIQUE INDEX IF NOT EXISTS leave_balances_employee_year_unique ON leave_balances (employee_id, year)`);

  await query(`
    CREATE TABLE IF NOT EXISTS leave_policies (
      id BIGSERIAL PRIMARY KEY,
      type TEXT NOT NULL UNIQUE,
      requires_attachment BOOLEAN NOT NULL DEFAULT FALSE,
      max_days INTEGER NOT NULL DEFAULT 30,
      auto_approve_initial BOOLEAN NOT NULL DEFAULT FALSE,
      rule_config JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`ALTER TABLE leave_policies ADD COLUMN IF NOT EXISTS rule_config JSONB NOT NULL DEFAULT '{}'::jsonb`);

  await query(`
    INSERT INTO leave_policies (type, requires_attachment, max_days, auto_approve_initial, rule_config)
    VALUES
      ('annual', false, 30, false, '{"day_count_mode":"working_days","sandwich_weekends":false,"yearly_allocation_days":30,"carry_forward_limit":5,"allow_negative_balance":false,"department_threshold_pct":20,"accrues_during_other_leave":true}'::jsonb),
      ('sick', false, 14, true, '{"day_count_mode":"calendar_days","requires_balance":true,"allow_negative_balance":false,"split_pay":[{"up_to":7,"pay_percent":100},{"up_to":14,"pay_percent":50},{"up_to":9999,"pay_percent":0}]}'::jsonb),
      ('maternity', true, 90, false, '{"day_count_mode":"calendar_days","requires_balance":false,"statutory":true,"annual_accrual_continues":true,"department_threshold_pct":20}'::jsonb),
      ('paternity', true, 14, false, '{"day_count_mode":"calendar_days","requires_balance":false,"statutory":true,"department_threshold_pct":20}'::jsonb),
      ('compassionate', false, 10, false, '{"day_count_mode":"calendar_days","requires_balance":false,"department_threshold_pct":20}'::jsonb),
      ('unpaid', false, 30, false, '{"day_count_mode":"calendar_days","requires_balance":false,"allow_negative_balance":false}'::jsonb)
    ON CONFLICT (type) DO UPDATE SET
      requires_attachment = EXCLUDED.requires_attachment,
      max_days = EXCLUDED.max_days,
      auto_approve_initial = EXCLUDED.auto_approve_initial,
      rule_config = EXCLUDED.rule_config,
      updated_at = NOW()
  `);

  await query(`ALTER TABLE employees ADD COLUMN IF NOT EXISTS gender TEXT`);
  await query(`ALTER TABLE employees DROP CONSTRAINT IF EXISTS employees_status_check`);
  await query(`ALTER TABLE employees ADD CONSTRAINT employees_status_check CHECK (status IN ('active', 'inactive', 'pending', 'terminated', 'on_statutory_leave'))`);

  await query(`
    CREATE TABLE IF NOT EXISTS leave_requests (
      id BIGSERIAL PRIMARY KEY,
      employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      type TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      reason TEXT,
      status TEXT NOT NULL DEFAULT 'Pending',
      approver_id BIGINT REFERENCES users(id) ON DELETE SET NULL,
      attachment_path TEXT,
      documentation_submitted BOOLEAN NOT NULL DEFAULT FALSE,
      requires_attachment BOOLEAN NOT NULL DEFAULT FALSE,
      department_conflict_count INTEGER NOT NULL DEFAULT 0,
      department_conflict_pct NUMERIC(5,2) NOT NULL DEFAULT 0,
      instructions TEXT,
      days_charged INTEGER NOT NULL DEFAULT 0,
      payroll_flags JSONB,
      policy_snapshot JSONB,
      leave_balance_effect JSONB,
      requires_manager_warning BOOLEAN NOT NULL DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      decision_at TIMESTAMPTZ
    )
  `);

  await query(`ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS attachment_path TEXT`);
  await query(`ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS documentation_submitted BOOLEAN NOT NULL DEFAULT FALSE`);
  await query(`ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS requires_attachment BOOLEAN NOT NULL DEFAULT FALSE`);
  await query(`ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS department_conflict_count INTEGER NOT NULL DEFAULT 0`);
  await query(`ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS department_conflict_pct NUMERIC(5,2) NOT NULL DEFAULT 0`);
  await query(`ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS instructions TEXT`);
  await query(`ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS days_charged INTEGER NOT NULL DEFAULT 0`);
  await query(`ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS payroll_flags JSONB`);
  await query(`ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS policy_snapshot JSONB`);
  await query(`ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS leave_balance_effect JSONB`);
  await query(`ALTER TABLE leave_requests ADD COLUMN IF NOT EXISTS requires_manager_warning BOOLEAN NOT NULL DEFAULT FALSE`);

  await query(`ALTER TABLE leave_requests DROP CONSTRAINT IF EXISTS leave_requests_status_check`);
  await query(`ALTER TABLE leave_requests ADD CONSTRAINT leave_requests_status_check CHECK (status IN ('Pending', 'Approved', 'Rejected', 'Pending_Documentation', 'Pending_Approval', 'Awaiting_Documentation', 'On_Statutory_Leave', 'Under Review'))`);

  await query(`
    CREATE TABLE IF NOT EXISTS project_assignments (
      id BIGSERIAL PRIMARY KEY,
      employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      project_name TEXT NOT NULL,
      start_date DATE NOT NULL,
      end_date DATE NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS pay_rates (
      id BIGSERIAL PRIMARY KEY,
      employee_id BIGINT NOT NULL UNIQUE REFERENCES employees(id) ON DELETE CASCADE,
      base_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
      overtime_rate NUMERIC(12,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`
    CREATE TABLE IF NOT EXISTS payslips (
      id BIGSERIAL PRIMARY KEY,
      employee_id BIGINT NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      period TEXT NOT NULL,
      gross_pay NUMERIC(12,2) NOT NULL DEFAULT 0,
      overtime_pay NUMERIC(12,2) NOT NULL DEFAULT 0,
      kpi_bonus NUMERIC(12,2) NOT NULL DEFAULT 0,
      deductions NUMERIC(12,2) NOT NULL DEFAULT 0,
      net_pay NUMERIC(12,2) NOT NULL DEFAULT 0,
      status TEXT NOT NULL DEFAULT 'Draft' CHECK (status IN ('Draft', 'Approved', 'Processing', 'Paid', 'Failed')),
      payment_method TEXT NOT NULL DEFAULT 'MPESA',
      payment_reference TEXT,
      payment_error TEXT,
      mpesa_transaction_id TEXT,
      disbursed_at TIMESTAMPTZ,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  await query(`ALTER TABLE payslips ADD COLUMN IF NOT EXISTS payment_method TEXT`);
  await query(`ALTER TABLE payslips ADD COLUMN IF NOT EXISTS payment_reference TEXT`);
  await query(`ALTER TABLE payslips ADD COLUMN IF NOT EXISTS payment_error TEXT`);
  await query(`ALTER TABLE payslips ALTER COLUMN payment_method SET DEFAULT 'MPESA'`);
  await query(`UPDATE payslips SET payment_method = COALESCE(payment_method, 'MPESA')`);
  await query(`ALTER TABLE payslips ALTER COLUMN payment_method SET NOT NULL`);
  await query(`ALTER TABLE payslips DROP CONSTRAINT IF EXISTS payslips_status_check`);
  await query(`ALTER TABLE payslips ADD CONSTRAINT payslips_status_check CHECK (status IN ('Draft', 'Approved', 'Processing', 'Paid', 'Failed'))`);

  await query(`
    UPDATE users SET updated_at = NOW() WHERE updated_at IS NULL
  `).catch(() => {});

  // Backfill exact matches first, then leave ambiguous rows for manual linking.
  await query(`
    WITH exact_email_matches AS (
      SELECT ja.id AS application_id, u.id AS user_id
      FROM job_applications ja
      JOIN users u ON LOWER(TRIM(ja.applicantemail)) = LOWER(TRIM(u.email))
      WHERE ja.user_id IS NULL
    )
    UPDATE job_applications ja
    SET user_id = m.user_id,
        linked_via = 'migration:email',
        linked_at = NOW()
    FROM exact_email_matches m
    WHERE ja.id = m.application_id
  `).catch(() => {});

  await query(`
    INSERT INTO application_user_links (application_id, user_id, link_reason, linked_by)
    SELECT ja.id, ja.user_id, 'migration:email', 'migration'
    FROM job_applications ja
    WHERE ja.user_id IS NOT NULL
    ON CONFLICT (application_id) DO NOTHING
  `).catch(() => {});

  await query(`
    INSERT INTO leave_balances (employee_id, year, annual, sick, maternity_paternity, created_at, updated_at)
    SELECT id, EXTRACT(YEAR FROM NOW())::INT, 30, 15, 30, NOW(), NOW()
    FROM employees
    ON CONFLICT (employee_id, year) DO NOTHING
  `).catch(err => console.error('Failed to backfill leave balances:', err.message));
};

const connectDB = async () => {
  await initDatabase();
  console.log('PostgreSQL connected');
};

const closeDB = async () => {
  await pool.end();
};

module.exports = {
  connectDB,
  closeDB,
  initDatabase,
  pool,
  query,
};