#!/usr/bin/env node

/**
 * Database Seed Script
 * Populates all tables with sample data (15+ records per table)
 * Usage: node scripts/seed.js
 */

const { pool, query, initDatabase } = require('../config/db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const SAMPLE_DATA = {
  departments: ['HR', 'IT', 'Finance', 'Operations', 'Sales', 'Marketing'],
  
  firstNames: [
    'John', 'Jane', 'Michael', 'Sarah', 'David', 'Emily', 'James', 'Jessica',
    'Robert', 'Lisa', 'William', 'Mary', 'Richard', 'Patricia', 'Joseph', 'Jennifer'
  ],
  
  lastNames: [
    'Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis',
    'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson', 'Thomas'
  ],

  jobTitles: [
    'Software Engineer', 'HR Manager', 'Finance Analyst', 'Data Scientist', 'Project Manager',
    'DevOps Engineer', 'UX Designer', 'Business Analyst', 'QA Engineer', 'System Administrator',
    'Graphic Designer', 'Content Writer', 'Sales Representative', 'Marketing Manager', 'Support Specialist'
  ],
};

// Helper function to generate random value from array
function randomFrom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Helper function to generate random number between min and max
function randomBetween(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Helper function to hash password
async function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

// Helper function to generate unique email
function generateEmail(firstName, lastName, index) {
  const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index > 0 ? index : ''}`;
  return `${username}@ubuntu-hrms.local`;
}

// Helper function to generate phone number
function generatePhoneNumber() {
  return `254${randomBetween(70, 79)}${randomBetween(1000000, 9999999)}`;
}

// Helper function to generate date within range
function generateDate(daysAgo = 730) {
  const date = new Date();
  date.setDate(date.getDate() - randomBetween(0, daysAgo));
  return date.toISOString().split('T')[0];
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting database seeding...');

    // Ensure the schema and tables exist before seeding (especially after a reset)
    console.log('🏗️  Initializing database schema...');
    await initDatabase();

    // 1. CREATE USERS (2 admins + managers, supervisors, employees)
    console.log('\n📝 Creating users...');
    const hashedAdminPassword = await hashPassword('Admin@123');
    const hashedPassword = await hashPassword('Password@123');

    const adminUsers = [
      {
        username: 'admin1',
        email: 'admin1@ubuntu-hrms.local',
        password: hashedAdminPassword,
        role: 'admin',
        status: 'active',
      },
      {
        username: 'admin2',
        email: 'admin2@ubuntu-hrms.local',
        password: hashedAdminPassword,
        role: 'admin',
        status: 'active',
      },
    ];

    const otherUsers = [];
    const userIds = [];

    // Insert admin users
    for (const admin of adminUsers) {
      const result = await query(
        `INSERT INTO users (username, email, password, role, status) VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (username) DO UPDATE SET updated_at = NOW() RETURNING id`,
        [admin.username, admin.email, admin.password, admin.role, admin.status]
      );
      userIds.push(result.rows[0].id);
    }

    // Generate other users (managers, supervisors, employees)
    const roles = ['manager', 'supervisor', 'employee'];
    const generatedUserData = [];
    for (let i = 0; i < 18; i++) {
      const firstName = randomFrom(SAMPLE_DATA.firstNames);
      const lastName = randomFrom(SAMPLE_DATA.lastNames);
      const role = roles[i % roles.length];
      
      const username = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${i > 0 ? i : ''}`;

      const result = await query(
        `INSERT INTO users (username, email, password, role, status) VALUES ($1, $2, $3, $4, $5) 
         ON CONFLICT (username) DO UPDATE SET updated_at = NOW() RETURNING id`,
        [
          username,
          `${username}@ubuntu-hrms.local`,
          hashedPassword,
          role,
          'active',
        ]
      );
      userIds.push(result.rows[0].id);
      generatedUserData.push({ firstName, lastName, email: `${username}@ubuntu-hrms.local`, username });
    }

    console.log(`✅ Created ${userIds.length} users`);

    // 2. CREATE EMPLOYEES (20 records)
    console.log('\n👥 Creating employees...');
    const employmentTypes = ['Permanent', 'Daily', 'Contractor'];
    const employeeIds = [];

    for (let i = 0; i < 20; i++) {
      let firstName, lastName, email;
      
      if (i < 2) {
        firstName = randomFrom(SAMPLE_DATA.firstNames);
        lastName = randomFrom(SAMPLE_DATA.lastNames);
        email = `admin${i + 1}@ubuntu-hrms.local`;
      } else {
        const userData = generatedUserData[i - 2];
        firstName = userData.firstName;
        lastName = userData.lastName;
        email = userData.email;
      }
      const dept = randomFrom(SAMPLE_DATA.departments);
      const empType = randomFrom(employmentTypes);
      
      // Restrict some permanent workers from self-recording (every 4th employee)
      const canSelfRecord = i % 4 !== 0;

      const result = await query(
        `INSERT INTO employees (
          user_id, first_name, last_name, email, phone, mpesa_phone_number, 
          employment_type, wage_rate, department, status, payment_method,
          can_self_record_attendance, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW()) 
         ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW() RETURNING id`,
        [
          userIds[i % userIds.length] || null,
          firstName,
          lastName,
          email,
          generatePhoneNumber(),
          generatePhoneNumber(),
          empType,
          randomBetween(20000, 100000),
          dept,
          'active',
          randomFrom(['MPESA', 'BANK']),
          canSelfRecord,
        ]
      );
      employeeIds.push(result.rows[0].id);
    }

    console.log(`✅ Created ${employeeIds.length} employees`);

    // 3. CREATE LEAVE BALANCES (auto-created with employees, add more if needed)
    console.log('\n📅 Ensuring leave balances...');
    const currentYear = new Date().getFullYear();
    for (const empId of employeeIds) {
      await query(
        `INSERT INTO leave_balances (employee_id, year, annual, sick, maternity_paternity)
         VALUES ($1, $2, 30, 15, 30) ON CONFLICT (employee_id, year) DO NOTHING`,
        [empId, currentYear]
      );
    }
    console.log(`✅ Leave balances ready for ${employeeIds.length} employees`);

    // 4. CREATE ATTENDANCE RECORDS (100 records - 5 per employee)
    console.log('\n⏰ Creating attendance records...');
    let attendanceCount = 0;
    for (const empId of employeeIds.slice(0, 10)) {
      for (let day = 0; day < 10; day++) {
        const date = new Date();
        date.setDate(date.getDate() - day);
        const dateStr = date.toISOString().split('T')[0];

        await query(
          `INSERT INTO attendance (
            employee_id, attendance_date, status, shift, check_in, check_out,
            total_hours_worked, punch_history, created_at
          ) VALUES ($1, $2, $3, $4, NOW(), NOW() + INTERVAL '8 hours', 8.0, '[]'::jsonb, NOW())
           ON CONFLICT (employee_id, attendance_date) DO NOTHING`,
          [empId, dateStr, randomFrom(['Present', 'Absent']), randomFrom(['Morning', 'Afternoon'])]
        );
        attendanceCount++;
      }
    }
    console.log(`✅ Created ${attendanceCount} attendance records`);

    // 5. CREATE JOBS (15 records)
    console.log('\n💼 Creating job postings...');
    const jobIds = [];
    for (let i = 0; i < 15; i++) {
      const result = await query(
        `INSERT INTO jobs (
          title, description, department, location, employmenttype, status, createdat
        ) VALUES ($1, $2, $3, $4, $5, $6, NOW()) RETURNING id`,
        [
          randomFrom(SAMPLE_DATA.jobTitles),
          `We are looking for an experienced professional to join our ${randomFrom(SAMPLE_DATA.departments)} team.`,
          randomFrom(SAMPLE_DATA.departments),
          'Nairobi, Kenya',
          randomFrom(employmentTypes),
          randomFrom(['open', 'closed', 'filled']),
        ]
      );
      jobIds.push(result.rows[0].id);
    }
    console.log(`✅ Created ${jobIds.length} job postings`);

    // 6. CREATE JOB APPLICATIONS (20 records)
    console.log('\n📋 Creating job applications...');
    let appCount = 0;
    for (let i = 0; i < 20; i++) {
      const firstName = randomFrom(SAMPLE_DATA.firstNames);
      const lastName = randomFrom(SAMPLE_DATA.lastNames);
      
      await query(
        `INSERT INTO job_applications (
          jobid, applicantname, applicantemail, applicantphone, status, appliedat
        ) VALUES ($1, $2, $3, $4, $5, NOW())`,
        [
          randomFrom(jobIds),
          `${firstName} ${lastName}`,
          generateEmail(firstName, lastName, i),
          generatePhoneNumber(),
          randomFrom(['pending', 'under_review', 'accepted', 'rejected']),
        ]
      );
      appCount++;
    }
    console.log(`✅ Created ${appCount} job applications`);

    // 7. CREATE KPI DEFINITIONS (15 records)
    console.log('\n🎯 Creating KPI definitions...');
    const kpiDefinitionIds = [];
    const kpiTitles = [
      'Sales Target', 'Customer Satisfaction', 'Project Delivery', 'Code Quality',
      'Response Time', 'Error Rate Reduction', 'Team Collaboration', 'Innovation Score',
      'Attendance Rate', 'Training Completion', 'Budget Efficiency', 'Process Improvement',
      'Client Retention', 'Product Knowledge', 'Work Quality'
    ];

    for (const kpiTitle of kpiTitles) {
      const result = await query(
        `INSERT INTO kpi_definitions (title, description, max_score, created_at)
         VALUES ($1, $2, $3, NOW()) RETURNING id`,
        [
          kpiTitle,
          `Performance metric: ${kpiTitle}`,
          randomBetween(80, 100),
        ]
      );
      kpiDefinitionIds.push(result.rows[0].id);
    }
    console.log(`✅ Created ${kpiDefinitionIds.length} KPI definitions`);

    // 8. CREATE EMPLOYEE KPIs (30 records)
    console.log('\n📊 Creating employee KPIs...');
    let kpiCount = 0;
    const periods = ['Q1-2024', 'Q2-2024', 'Q3-2024', 'Q4-2024'];
    
    for (let i = 0; i < 30; i++) {
      const empId = employeeIds[i % employeeIds.length];
      const defId = kpiDefinitionIds[i % kpiDefinitionIds.length];
      const evaluatorId = userIds[randomBetween(0, Math.min(4, userIds.length - 1))];
      const period = randomFrom(periods);

      await query(
        `INSERT INTO employee_kpis (
          employee_id, evaluator_id, definition_id, period, target_value,
          achieved_value, final_score, status, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [
          empId,
          evaluatorId,
          defId,
          period,
          randomBetween(80, 100),
          randomBetween(50, 100),
          randomBetween(50, 100),
          randomFrom(['Pending', 'Evaluated', 'Completed']),
        ]
      );
      kpiCount++;
    }
    console.log(`✅ Created ${kpiCount} employee KPIs`);

    // 9. CREATE LEAVE REQUESTS (20 records)
    console.log('\n🗓️  Creating leave requests...');
    const leaveTypes = ['annual', 'sick', 'maternity', 'paternity', 'compassionate', 'unpaid'];
    let leaveCount = 0;

    for (let i = 0; i < 20; i++) {
      const empId = employeeIds[i % employeeIds.length];
      const startDate = generateDate(90);
      const endDate = new Date(new Date(startDate).getTime() + randomBetween(1, 14) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];
      const leaveType = randomFrom(leaveTypes);

      await query(
        `INSERT INTO leave_requests (
          employee_id, type, start_date, end_date, reason, status,
          approver_id, days_charged, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [
          empId,
          leaveType,
          startDate,
          endDate,
          `Request for ${leaveType} leave`,
          randomFrom(['Pending', 'Approved', 'Rejected']),
          userIds[randomBetween(0, Math.min(4, userIds.length - 1))] || null,
          randomBetween(1, 14),
        ]
      );
      leaveCount++;
    }
    console.log(`✅ Created ${leaveCount} leave requests`);

    // 10. CREATE PAY RATES (20 records)
    console.log('\n💰 Creating pay rates...');
    for (let i = 0; i < 20; i++) {
      const empId = employeeIds[i];
      if (!empId) continue;

      await query(
        `INSERT INTO pay_rates (employee_id, base_rate, overtime_rate, created_at)
         VALUES ($1, $2, $3, NOW()) ON CONFLICT (employee_id) DO NOTHING`,
        [
          empId,
          randomBetween(30000, 150000),
          randomBetween(500, 2000),
        ]
      );
    }
    console.log(`✅ Created pay rates for 20 employees`);

    // 11. CREATE PAYSLIPS (25 records)
    console.log('\n💸 Creating payslips...');
    const months = ['2024-01', '2024-02', '2024-03', '2024-04', '2024-05', '2024-06'];
    let payslipCount = 0;

    for (let i = 0; i < 25; i++) {
      const empId = employeeIds[i % employeeIds.length];
      const grossPay = randomBetween(30000, 150000);
      const overtime = randomBetween(0, 15000);
      const kpiBonus = randomBetween(0, 10000);
      const deductions = randomBetween(2000, 20000);

      await query(
        `INSERT INTO payslips (
          employee_id, period, gross_pay, overtime_pay, kpi_bonus,
          deductions, net_pay, status, payment_method, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
        [
          empId,
          randomFrom(months),
          grossPay,
          overtime,
          kpiBonus,
          deductions,
          grossPay + overtime + kpiBonus - deductions,
          randomFrom(['Draft', 'Approved', 'Paid']),
          randomFrom(['MPESA', 'BANK']),
        ]
      );
      payslipCount++;
    }
    console.log(`✅ Created ${payslipCount} payslips`);

    // 12. CREATE PROJECT ASSIGNMENTS (20 records)
    console.log('\n📌 Creating project assignments...');
    const projects = [
      'ERP System Upgrade', 'Mobile App Development', 'Database Migration',
      'Cloud Infrastructure', 'Security Audit', 'UI/UX Redesign', 'API Development',
      'Performance Optimization', 'Documentation', 'Testing & QA'
    ];

    for (let i = 0; i < 20; i++) {
      const empId = employeeIds[i % employeeIds.length];
      const startDate = generateDate(180);
      const endDate = new Date(new Date(startDate).getTime() + randomBetween(30, 180) * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0];

      await query(
        `INSERT INTO project_assignments (employee_id, project_name, start_date, end_date, created_at)
         VALUES ($1, $2, $3, $4, NOW())`,
        [empId, randomFrom(projects), startDate, endDate]
      );
    }
    console.log(`✅ Created 20 project assignments`);

    // 13. CREATE PROFILES (15 records)
    console.log('\n👤 Creating employee profiles...');
    const skillsList = ['JavaScript', 'Python', 'Java', 'React', 'Node.js', 'SQL', 'Cloud Services', 'Leadership'];
    
    for (let i = 0; i < 15; i++) {
      const userId = userIds[i % userIds.length];
      if (!userId) continue;

      try {
        await query(
          `INSERT INTO profiles (
            userid, fullname, skills, email, phone, status
          ) VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            userId,
            `${randomFrom(SAMPLE_DATA.firstNames)} ${randomFrom(SAMPLE_DATA.lastNames)}`,
            `{${randomFrom(skillsList)},${randomFrom(skillsList)}}`,
            `prof${i}@ubuntu-hrms.local`,
            generatePhoneNumber(),
            'active',
          ]
        );
      } catch (err) {
        // Profile might already exist, skip
      }
    }
    console.log(`✅ Created 15 employee profiles`);

    // 14. CREATE PROJECTS (15 records - contractor)
    console.log('\n🏗️  Creating contractor projects...');
    let projectCount = 0;
    for (let i = 0; i < 15; i++) {
      const contractorId = userIds[randomBetween(0, Math.min(5, userIds.length - 1))];

      await query(
        `INSERT INTO projects (name, contractor_id, status, due_date, created_at)
         VALUES ($1, $2, $3, $4::date, NOW())`,
        [
          `Project ${i + 1}: ${randomFrom(['System Integration', 'Mobile App', 'Web Portal', 'API Development', 'Data Analysis'])}`,
          contractorId,
          randomFrom(['active', 'in_progress', 'completed', 'on_hold']),
          generateDate(90),
        ]
      );
      projectCount++;
    }
    console.log(`✅ Created ${projectCount} contractor projects`);

    // 15. CREATE INVOICES (15 records - contractor)
    console.log('\n📄 Creating contractor invoices...');
    let invoiceCount = 0;
    for (let i = 0; i < 15; i++) {
      const invoiceId = `INV-${Date.now()}-${i}`;
      const contractorId = userIds[randomBetween(0, Math.min(5, userIds.length - 1))];

      await query(
        `INSERT INTO invoices (id, contractor_id, amount, status, due_date, created_at)
         VALUES ($1, $2, $3, $4, $5::date, NOW())`,
        [
          invoiceId,
          contractorId,
          randomBetween(5000, 50000),
          randomFrom(['Draft', 'Submitted', 'Approved', 'Paid', 'Overdue']),
          generateDate(60),
        ]
      );
      invoiceCount++;
    }
    console.log(`✅ Created ${invoiceCount} contractor invoices`);

    // 16. CREATE PENDING BONUSES (15 records)
    console.log('\n🎁 Creating pending bonuses...');
    let bonusCount = 0;
    for (let i = 0; i < 15; i++) {
      const empId = employeeIds[i % employeeIds.length];
      const kpiId = kpiDefinitionIds[i % kpiDefinitionIds.length];

      // Get an employee_kpi for this employee
      const kpiResult = await query(
        `SELECT id FROM employee_kpis WHERE employee_id = $1 LIMIT 1`,
        [empId]
      );

      if (kpiResult.rows.length > 0) {
        await query(
          `INSERT INTO pending_bonuses (employee_id, employee_kpi_id, period, bonus_type, bonus_amount, status, created_at)
           VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
          [
            empId,
            kpiResult.rows[0].id,
            randomFrom(periods),
            'KPI Raise',
            randomBetween(5000, 50000),
            randomFrom(['pending', 'processed', 'paid']),
          ]
        );
        bonusCount++;
      }
    }
    console.log(`✅ Created ${bonusCount} pending bonuses`);

    console.log('\n✨ Database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Users: ${userIds.length} (2 admins)`);
    console.log(`   - Employees: ${employeeIds.length}`);
    console.log(`   - Attendance Records: ${attendanceCount}`);
    console.log(`   - Job Postings: ${jobIds.length}`);
    console.log(`   - Job Applications: ${appCount}`);
    console.log(`   - KPI Definitions: ${kpiDefinitionIds.length}`);
    console.log(`   - Employee KPIs: ${kpiCount}`);
    console.log(`   - Leave Requests: ${leaveCount}`);
    console.log(`   - Payslips: ${payslipCount}`);
    console.log(`   - Project Assignments: 20`);
    console.log(`   - Profiles: 15`);
    console.log(`   - Contractor Projects: ${projectCount}`);
    console.log(`   - Contractor Invoices: ${invoiceCount}`);
    console.log(`   - Pending Bonuses: ${bonusCount}`);

    console.log('\n🔐 Default credentials:');
    console.log('   Admin 1: admin1 / Admin@123');
    console.log('   Admin 2: admin2 / Admin@123');
    console.log(`   Others (e.g. ${generatedUserData[0].username}): Password@123`);

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    if (error.code === '23505') {
      console.log('\n💡 Tip: Run `node scripts/reset-db.js` first to clear existing data before seeding.');
    }
    process.exit(1);
  }
}

// Run seeding
seedDatabase();
