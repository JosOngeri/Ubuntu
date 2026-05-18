#!/usr/bin/env node

/**
 * Ubuntu Employees Database Seed Script
 * Populates all tables with realistic data for 16 Ubuntu employees
 * Usage: node scripts/seed-ubuntu-employees.js
 */

const { pool, query, initDatabase } = require('../config/db');
const bcrypt = require('bcryptjs');
require('dotenv').config();

// Employee data from October 2025
const EMPLOYEE_DATA = [
  {
    name: 'Elizabeth Eregai',
    phone: '0758651098',
    role: 'Waitress',
    department: 'Kitchen',
    employmentType: 'Permanent',
    wageRate: 20000,
    userRole: 'employee'
  },
  {
    name: 'Dorcas Amran',
    phone: '0796855017',
    role: 'Kitchen Steward',
    department: 'Kitchen',
    employmentType: 'Permanent',
    wageRate: 25000,
    userRole: 'employee'
  },
  {
    name: 'Regina Eregai',
    phone: '0701804241',
    role: 'House Keeping',
    department: 'Operations',
    employmentType: 'Permanent',
    wageRate: 18000,
    userRole: 'employee'
  },
  {
    name: 'Josiah Ongesi',
    phone: '0724363290',
    role: 'Contractor',
    department: 'Operations',
    employmentType: 'Contractor',
    wageRate: 1500,
    userRole: 'employee'
  },
  {
    name: 'Adline Mukandoe',
    phone: '0708366911',
    role: 'Masseuse',
    department: 'Operations',
    employmentType: 'Permanent',
    wageRate: 30000,
    userRole: 'employee'
  },
  {
    name: 'Gati George Ogongo',
    phone: '0740512412',
    role: 'Photography & Music',
    department: 'Marketing',
    employmentType: 'Permanent',
    wageRate: 35000,
    userRole: 'employee'
  },
  {
    name: 'Blessed Mukandoe',
    phone: '0769176725',
    role: 'Masseuse Intern',
    department: 'Operations',
    employmentType: 'Permanent',
    wageRate: 18000,
    userRole: 'employee'
  },
  {
    name: 'Chef Makori',
    phone: '0718232265',
    role: 'Chef',
    department: 'Kitchen',
    employmentType: 'Permanent',
    wageRate: 35000,
    userRole: 'employee'
  },
  {
    name: 'Marlon M',
    phone: '0793391636',
    role: 'Chef',
    department: 'Kitchen',
    employmentType: 'Permanent',
    wageRate: 35000,
    userRole: 'employee'
  },
  {
    name: 'Kevo Maina',
    phone: '0707708915',
    role: 'Groundsman & Dog',
    department: 'Grounds',
    employmentType: 'Permanent',
    wageRate: 22000,
    userRole: 'employee'
  },
  {
    name: 'Wekesa Brian',
    phone: '0742884758',
    role: 'Farmhand',
    department: 'Grounds',
    employmentType: 'Permanent',
    wageRate: 20000,
    userRole: 'employee'
  },
  {
    name: 'Hesbon Wafula',
    phone: '0111980772',
    role: 'Games & Grounds',
    department: 'Grounds',
    employmentType: 'Permanent',
    wageRate: 22000,
    userRole: 'employee'
  },
  {
    name: 'Alex Leshan Nyakundi',
    phone: '0729794433',
    role: 'Daily Labor',
    department: 'Operations',
    employmentType: 'Daily',
    wageRate: 600,
    userRole: 'employee'
  },
  {
    name: 'Libson Ochieng',
    phone: '0740453397',
    role: 'Daily Labor',
    department: 'Operations',
    employmentType: 'Daily',
    wageRate: 600,
    userRole: 'employee'
  },
  {
    name: 'Andrew Leparan',
    phone: '0710451355',
    role: 'Manager',
    department: 'Administration',
    employmentType: 'Permanent',
    wageRate: 80000,
    userRole: 'manager'
  },
  {
    name: 'Alex Leshan',
    phone: '0711785412',
    role: 'Watchman',
    department: 'Security',
    employmentType: 'Permanent',
    wageRate: 18000,
    userRole: 'supervisor'
  },
  {
    name: 'Jackson Leshan',
    phone: '0786710108',
    role: 'Watchman',
    department: 'Security',
    employmentType: 'Permanent',
    wageRate: 18000,
    userRole: 'supervisor'
  }
];

// KPI definitions by department
const KPI_DEFINITIONS = {
  Kitchen: [
    { title: 'Food Quality Score', description: 'Quality of food prepared', maxScore: 90 },
    { title: 'Kitchen Cleanliness Standards', description: 'Maintain kitchen hygiene', maxScore: 95 },
    { title: 'Order Accuracy Rate', description: 'Accuracy of orders', maxScore: 98 },
    { title: 'Food Cost Control', description: 'Control food waste and costs', maxScore: 85 },
    { title: 'Meal Preparation Time', description: 'Timely meal preparation', maxScore: 90 }
  ],
  Operations: [
    { title: 'Customer Satisfaction Rating', description: 'Guest satisfaction scores', maxScore: 90 },
    { title: 'Task Completion Time', description: 'Complete tasks on time', maxScore: 90 },
    { title: 'Service Quality', description: 'Quality of service provided', maxScore: 85 }
  ],
  Marketing: [
    { title: 'Event Coverage Quality', description: 'Quality of event coverage', maxScore: 90 },
    { title: 'Client Satisfaction', description: 'Client satisfaction scores', maxScore: 90 },
    { title: 'Equipment Maintenance', description: 'Maintain photography/music equipment', maxScore: 95 },
    { title: 'Booking Completion Rate', description: 'Complete bookings successfully', maxScore: 85 }
  ],
  Grounds: [
    { title: 'Grounds Maintenance Quality', description: 'Quality of grounds maintenance', maxScore: 90 },
    { title: 'Landscaping Standards', description: 'Maintain landscaping standards', maxScore: 85 },
    { title: 'Safety Compliance', description: 'Follow safety protocols', maxScore: 100 },
    { title: 'Equipment Maintenance', description: 'Maintain grounds equipment', maxScore: 90 }
  ],
  Security: [
    { title: 'Incident Response Time', description: 'Response time to incidents', maxScore: 95 },
    { title: 'Patrol Completion Rate', description: 'Complete security patrols', maxScore: 100 },
    { title: 'Safety Incident Reduction', description: 'Reduce safety incidents', maxScore: 90 },
    { title: 'Report Accuracy', description: 'Accurate security reports', maxScore: 95 }
  ],
  Administration: [
    { title: 'Team Productivity', description: 'Team productivity metrics', maxScore: 85 },
    { title: 'Cost Control', description: 'Control operational costs', maxScore: 90 },
    { title: 'Overall Guest Satisfaction', description: 'Overall guest satisfaction', maxScore: 90 },
    { title: 'Staff Attendance Rate', description: 'Staff attendance monitoring', maxScore: 95 }
  ]
};

// Helper functions
function parseName(fullName) {
  const parts = fullName.trim().split(' ');
  const firstName = parts[0];
  const lastName = parts.length > 1 ? parts.slice(1).join(' ') : '';
  return { firstName, lastName };
}

function generateEmail(firstName, lastName) {
  const uniqueName = lastName ? `${firstName}.${lastName}` : firstName;
  return `hbjoscards+${uniqueName.toLowerCase().replace(/\s+/g, '')}@gmail.com`;
}

function generateUsername(firstName, lastName) {
  return `${firstName}.${lastName}`.toLowerCase().replace(/\s+/g, '');
}

function hashPassword(password) {
  return bcrypt.hash(password, 10);
}

function randomDate(start, end) {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function formatDate(date) {
  return date.toISOString().split('T')[0];
}

function generateDateJoined() {
  // Random date between May and July 2025
  const start = new Date('2025-05-01');
  const end = new Date('2025-07-31');
  return randomDate(start, end);
}

async function seedDatabase() {
  try {
    console.log('🌱 Starting Ubuntu employees database seeding...');

    // Ensure the schema and tables exist
    console.log('🏗️  Initializing database schema...');
    await initDatabase();

    // 1. CREATE USERS
    console.log('\n📝 Creating users...');
    const userIds = {};
    
    for (const emp of EMPLOYEE_DATA) {
      const { firstName, lastName } = parseName(emp.name);
      const username = generateUsername(firstName, lastName);
      const email = generateEmail(firstName, lastName);
      const password = await hashPassword(`${firstName}@123`);
      
      const result = await query(
        `INSERT INTO users (username, email, password, role, status, must_change_password)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (username) DO UPDATE SET updated_at = NOW() RETURNING id`,
        [username, email, password, emp.userRole, 'active', true]
      );
      
      userIds[emp.name] = result.rows[0].id;
      console.log(`  ✅ Created user: ${username}`);
    }

    console.log(`✅ Created ${Object.keys(userIds).length} users`);

    // 2. CREATE EMPLOYEES
    console.log('\n👥 Creating employees...');
    const employeeIds = {};
    const employeeData = {};
    
    for (const emp of EMPLOYEE_DATA) {
      const { firstName, lastName } = parseName(emp.name);
      const dateJoined = generateDateJoined();
      
      const result = await query(
        `INSERT INTO employees (
          user_id, first_name, last_name, email, phone, mpesa_phone_number,
          employment_type, wage_rate, department, status, payment_method,
          can_self_record_attendance, date_joined, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW())
         ON CONFLICT (user_id) DO UPDATE SET updated_at = NOW() RETURNING id`,
        [
          userIds[emp.name],
          firstName,
          lastName,
          generateEmail(firstName, lastName),
          emp.phone,
          emp.phone,
          emp.employmentType,
          emp.wageRate,
          emp.department,
          'active',
          'MPESA',
          true,
          dateJoined
        ]
      );
      
      employeeIds[emp.name] = result.rows[0].id;
      employeeData[emp.name] = { ...emp, dateJoined, userId: userIds[emp.name] };
      console.log(`  ✅ Created employee: ${emp.name}`);
    }

    console.log(`✅ Created ${Object.keys(employeeIds).length} employees`);

    // 3. CREATE LEAVE BALANCES
    console.log('\n📅 Creating leave balances...');
    const currentYear = new Date().getFullYear();
    
    for (const empName of Object.keys(employeeIds)) {
      await query(
        `INSERT INTO leave_balances (employee_id, year, annual, sick, maternity_paternity)
         VALUES ($1, $2, 30, 15, 30)
         ON CONFLICT (employee_id, year) DO NOTHING`,
        [employeeIds[empName], currentYear]
      );
    }
    console.log(`✅ Leave balances created for ${Object.keys(employeeIds).length} employees`);

    // 4. CREATE ATTENDANCE RECORDS
    console.log('\n⏰ Creating attendance records...');
    const yesterday = new Date('2026-05-15');
    let attendanceCount = 0;
    
    for (const empName of Object.keys(employeeIds)) {
      const emp = employeeData[empName];
      const startDate = new Date(emp.dateJoined);
      const empId = employeeIds[empName];
      
      // Special handling for Leshan brothers and Andrew Leparan
      const isLeshanBrother = empName.includes('Alex Leshan') || empName.includes('Jackson Leshan');
      const isAndrewLeparan = empName.includes('Andrew Leparan');
      const isWaiterOrHousekeeping = emp.role === 'Waitress' || emp.role === 'House Keeping';
      
      let currentDate = new Date(startDate);
      while (currentDate <= yesterday) {
        const dayOfWeek = currentDate.getDay();
        const dateStr = formatDate(currentDate);
        
        // Skip weekends (0 = Sunday, 6 = Saturday)
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          currentDate.setDate(currentDate.getDate() + 1);
          continue;
        }
        
        // Determine if employee is present
        let isPresent = true;
        let shift = 'Morning';
        let checkInTime, checkOutTime;
        
        if (isLeshanBrother) {
          // Leshan brothers: 100% night shift, sometimes extra day (10%)
          isPresent = true; // No off-days
          shift = Math.random() < 0.9 ? 'Night' : 'Afternoon';
          if (shift === 'Night') {
            checkInTime = new Date(currentDate);
            checkInTime.setHours(20, 0, 0, 0); // 8:00 PM
            checkOutTime = new Date(currentDate);
            checkOutTime.setHours(8, 0, 0, 0); // 8:00 AM next day
            checkOutTime.setDate(checkOutTime.getDate() + 1);
          } else {
            checkInTime = new Date(currentDate);
            checkInTime.setHours(8, 0, 0, 0); // 8:00 AM
            checkOutTime = new Date(currentDate);
            checkOutTime.setHours(20, 0, 0, 0); // 8:00 PM
          }
        } else if (isAndrewLeparan) {
          // Andrew Leparan: Day shift only, no off-days
          isPresent = true;
          shift = 'Morning';
          checkInTime = new Date(currentDate);
          checkInTime.setHours(8, 0, 0, 0); // 8:00 AM
          checkOutTime = new Date(currentDate);
          checkOutTime.setHours(20, 0, 0, 0); // 8:00 PM
        } else {
          // Other employees: 90% present, 10% off-day (Tue/Wed/Thu)
          if (dayOfWeek === 2 || dayOfWeek === 3 || dayOfWeek === 4) {
            isPresent = Math.random() < 0.9;
          } else {
            isPresent = Math.random() < 0.95;
          }
          
          if (isPresent) {
            shift = 'Morning';
            checkInTime = new Date(currentDate);
            checkInTime.setHours(8, 0, 0, 0); // 8:00 AM
            checkOutTime = new Date(currentDate);
            checkOutTime.setHours(20, 0, 0); // 8:00 PM
            
            // Waiters and Housekeeping: occasionally work after-hours
            if (isWaiterOrHousekeeping && Math.random() < 0.15) {
              checkOutTime.setHours(22, 0, 0, 0); // 10:00 PM
            }
          }
        }
        
        if (isPresent) {
          const totalHours = (checkOutTime - checkInTime) / (1000 * 60 * 60);
          
          await query(
            `INSERT INTO attendance (
              employee_id, attendance_date, status, shift, check_in, check_out,
              total_hours_worked, punch_history, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, '[]'::jsonb, NOW())
             ON CONFLICT (employee_id, attendance_date) DO NOTHING`,
            [
              empId,
              dateStr,
              'Present',
              shift,
              checkInTime,
              checkOutTime,
              totalHours
            ]
          );
          attendanceCount++;
        }
        
        currentDate.setDate(currentDate.getDate() + 1);
      }
    }
    console.log(`✅ Created ${attendanceCount} attendance records`);

    // 5. CREATE LEAVE REQUESTS
    console.log('\n🗓️  Creating leave requests...');
    const leaveTypes = ['annual', 'sick', 'compassionate', 'unpaid', 'off-day'];
    const leaveStatuses = ['Approved', 'Pending', 'Rejected'];
    let leaveCount = 0;
    
    for (const empName of Object.keys(employeeIds)) {
      const emp = employeeData[empName];
      const empId = employeeIds[empName];
      const isLeshanBrother = empName.includes('Alex Leshan') || empName.includes('Jackson Leshan');
      const isAndrewLeparan = empName.includes('Andrew Leparan');
      
      // Watchmen and manager don't take off-days
      const canTakeOffDay = !isLeshanBrother && !isAndrewLeparan;
      
      // Generate 3-5 leave requests per employee
      const numRequests = Math.floor(Math.random() * 3) + 3;
      
      for (let i = 0; i < numRequests; i++) {
        const startDate = randomDate(new Date(emp.dateJoined), yesterday);
        const endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 3) + 1);
        
        let leaveType = leaveTypes[Math.floor(Math.random() * leaveTypes.length)];
        
        // Don't assign off-day to watchmen or manager
        if (leaveType === 'off-day' && !canTakeOffDay) {
          leaveType = 'annual';
        }
        
        const status = leaveStatuses[Math.floor(Math.random() * leaveStatuses.length)];
        
        await query(
          `INSERT INTO leave_requests (
            employee_id, type, start_date, end_date, reason, status,
            approver_id, days_charged, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
          [
            empId,
            leaveType,
            formatDate(startDate),
            formatDate(endDate),
            `Request for ${leaveType} leave`,
            status,
            status === 'Approved' ? userIds['Andrew Leparan'] : null,
            Math.ceil((endDate - startDate) / (1000 * 60 * 60 * 24))
          ]
        );
        leaveCount++;
      }
    }
    console.log(`✅ Created ${leaveCount} leave requests`);

    // 6. CREATE KPI DEFINITIONS
    console.log('\n🎯 Creating KPI definitions...');
    const kpiDefinitionIds = {};
    
    for (const [dept, kpis] of Object.entries(KPI_DEFINITIONS)) {
      for (const kpi of kpis) {
        const result = await query(
          `INSERT INTO kpi_definitions (title, description, max_score, created_at)
           VALUES ($1, $2, $3, NOW())
           ON CONFLICT DO NOTHING
           RETURNING id`,
          [kpi.title, kpi.description, kpi.maxScore]
        );
        if (result.rows.length > 0) {
          kpiDefinitionIds[`${dept}-${kpi.title}`] = result.rows[0].id;
        }
      }
    }
    console.log(`✅ Created KPI definitions`);

    // 7. CREATE EMPLOYEE KPIs
    console.log('\n📊 Creating employee KPIs...');
    let kpiCount = 0;
    const periods = ['Q3-2025', 'Q4-2025', 'Q1-2026'];
    
    for (const empName of Object.keys(employeeIds)) {
      const emp = employeeData[empName];
      const empId = employeeIds[empName];
      const deptKpis = KPI_DEFINITIONS[emp.department] || [];
      
      // Assign 2-3 KPIs per employee per period
      for (const period of periods) {
        const numKpis = Math.min(deptKpis.length, Math.floor(Math.random() * 2) + 2);
        const shuffledKpis = deptKpis.sort(() => 0.5 - Math.random()).slice(0, numKpis);
        
        for (const kpi of shuffledKpis) {
          const defId = kpiDefinitionIds[`${emp.department}-${kpi.title}`];
          if (!defId) continue;
          
          const targetValue = kpi.maxScore;
          const achievedValue = targetValue * (0.7 + Math.random() * 0.25); // 70-95% achievement
          const finalScore = (achievedValue / targetValue) * 100;
          
          await query(
            `INSERT INTO employee_kpis (
              employee_id, evaluator_id, definition_id, period, target_value,
              achieved_value, final_score, status, created_at
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
            [
              empId,
              userIds['Andrew Leparan'],
              defId,
              period,
              targetValue,
              achievedValue,
              finalScore,
              'Completed'
            ]
          );
          kpiCount++;
        }
      }
    }
    console.log(`✅ Created ${kpiCount} employee KPIs`);

    // 8. CREATE PAY RATES
    console.log('\n💰 Creating pay rates...');
    for (const empName of Object.keys(employeeIds)) {
      const emp = employeeData[empName];
      const empId = employeeIds[empName];
      
      await query(
        `INSERT INTO pay_rates (employee_id, base_rate, overtime_rate, created_at)
         VALUES ($1, $2, $3, NOW())
         ON CONFLICT (employee_id) DO NOTHING`,
        [empId, emp.wageRate, emp.wageRate * 0.05]
      );
    }
    console.log(`✅ Created pay rates for ${Object.keys(employeeIds).length} employees`);

    // 9. CREATE PAYSLIPS
    console.log('\n💸 Creating payslips...');
    let payslipCount = 0;
    const months = ['2025-08', '2025-09', '2025-10', '2025-11', '2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05'];
    
    for (const empName of Object.keys(employeeIds)) {
      const emp = employeeData[empName];
      const empId = employeeIds[empName];
      const joinedDate = new Date(emp.dateJoined);
      
      for (const month of months) {
        const [year, monthNum] = month.split('-').map(Number);
        const monthDate = new Date(year, monthNum - 1, 1);
        
        // Only create payslips for months after employee joined
        if (monthDate < joinedDate) continue;
        
        const grossPay = emp.wageRate;
        const overtime = Math.random() < 0.3 ? grossPay * 0.1 : 0;
        const kpiBonus = Math.random() < 0.4 ? grossPay * 0.05 : 0;
        const deductions = grossPay * 0.1;
        
        await query(
          `INSERT INTO payslips (
            employee_id, period, gross_pay, overtime_pay, kpi_bonus,
            deductions, net_pay, status, payment_method, created_at
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, NOW())`,
          [
            empId,
            month,
            grossPay,
            overtime,
            kpiBonus,
            deductions,
            grossPay + overtime + kpiBonus - deductions,
            Math.random() < 0.7 ? 'Paid' : 'Approved',
            'MPESA'
          ]
        );
        payslipCount++;
      }
    }
    console.log(`✅ Created ${payslipCount} payslips`);

    // 10. CREATE PROFILES
    console.log('\n👤 Creating employee profiles...');
    for (const empName of Object.keys(employeeIds)) {
      const emp = employeeData[empName];
      const { firstName, lastName } = parseName(emp.name);
      const userId = userIds[empName];
      
      await query(
        `INSERT INTO profiles (
          userid, fullname, email, phone, status, jobtitle, department,
          employmenttype, dateofjoining
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
         ON CONFLICT (userid) DO NOTHING`,
        [
          userId,
          emp.name,
          generateEmail(firstName, lastName),
          emp.phone,
          'active',
          emp.role,
          emp.department,
          emp.employmentType,
          formatDate(emp.dateJoined)
        ]
      );
    }
    console.log(`✅ Created profiles for ${Object.keys(employeeIds).length} employees`);

    // 11. CREATE CONTRACTOR DATA (for Josiah Ongesi)
    console.log('\n🏗️  Creating contractor data...');
    const contractorName = 'Josiah Ongesi';
    const contractorUserId = userIds[contractorName];
    
    if (contractorUserId) {
      // Create projects
      await query(
        `INSERT INTO projects (name, contractor_id, status, due_date, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT DO NOTHING`,
        ['Kitchen Renovation', contractorUserId, 'completed', '2025-09-30']
      );

      await query(
        `INSERT INTO projects (name, contractor_id, status, due_date, created_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT DO NOTHING`,
        ['Security System Upgrade', contractorUserId, 'in_progress', '2026-06-30']
      );

      // Create invoices
      await query(
        `INSERT INTO invoices (id, contractor_id, amount, status, due_date, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (id) DO NOTHING`,
        ['INV-UB-001', contractorUserId, 45000, 'Paid', '2025-09-15']
      );

      await query(
        `INSERT INTO invoices (id, contractor_id, amount, status, due_date, created_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (id) DO NOTHING`,
        ['INV-UB-002', contractorUserId, 30000, 'Pending', '2026-06-15']
      );
      
      // Create performance record
      await query(
        `INSERT INTO contractor_performance (contractor_id, delivery_rate, created_at)
         VALUES ($1, $2, NOW())`,
        [contractorUserId, 92.00]
      );
      
      console.log(`  ✅ Created contractor data for ${contractorName}`);
    }

    console.log('\n✨ Ubuntu employees database seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`   - Users: ${Object.keys(userIds).length}`);
    console.log(`   - Employees: ${Object.keys(employeeIds).length}`);
    console.log(`   - Attendance Records: ${attendanceCount}`);
    console.log(`   - Leave Requests: ${leaveCount}`);
    console.log(`   - KPI Definitions: ${Object.keys(kpiDefinitionIds).length}`);
    console.log(`   - Employee KPIs: ${kpiCount}`);
    console.log(`   - Payslips: ${payslipCount}`);
    console.log(`   - Profiles: ${Object.keys(employeeIds).length}`);

    console.log('\n🔐 Default credentials (username / password):');
    for (const emp of EMPLOYEE_DATA) {
      const { firstName, lastName } = parseName(emp.name);
      const username = generateUsername(firstName, lastName);
      console.log(`   ${emp.name}: ${username} / ${firstName}@123`);
    }

    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    process.exit(1);
  }
}

// Run seeding
seedDatabase();
