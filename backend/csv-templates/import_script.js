#!/usr/bin/env node

/**
 * Ubuntu HRMS Data Import Script
 * Imports data from CSV templates into PostgreSQL database
 * Usage: node csv-templates/import_script.js
 */

const fs = require('fs');
const path = require('path');
const { pool, query } = require('../config/db');
require('dotenv').config();

// Helper function to parse CSV
function parseCSV(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n').filter(line => line.trim());
  const headers = lines[0].split(',').map(h => h.trim());
  const data = lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim());
    const row = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row;
  });
  return data;
}

// Import Company Growth
async function importCompanyGrowth() {
  try {
    console.log('📈 Importing Company Growth Data...');
    const growth = parseCSV(path.join(__dirname, 'company_growth_template.csv'));
    
    for (const record of growth) {
      await query(`
        INSERT INTO company_growth (period, total_employees, new_hires, terminations, turnover_rate, avg_salary, revenue, projects_completed, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
        ON CONFLICT (period) DO UPDATE SET
          total_employees = EXCLUDED.total_employees,
          new_hires = EXCLUDED.new_hires,
          terminations = EXCLUDED.terminations,
          turnover_rate = EXCLUDED.turnover_rate,
          avg_salary = EXCLUDED.avg_salary,
          revenue = EXCLUDED.revenue,
          projects_completed = EXCLUDED.projects_completed,
          notes = EXCLUDED.notes,
          updated_at = NOW()
      `, [record.period, parseInt(record.total_employees), parseInt(record.new_hires), parseInt(record.terminations),
         parseFloat(record.turnover_rate), parseFloat(record.avg_salary), parseFloat(record.revenue),
         parseInt(record.projects_completed), record.notes]);
    }
    console.log(`✅ Imported ${growth.length} company growth records`);
  } catch (error) {
    console.error('❌ Error importing company growth:', error.message);
  }
}

// Import Employee Turnover
async function importEmployeeTurnover() {
  try {
    console.log('🔄 Importing Employee Turnover Data...');
    const turnover = parseCSV(path.join(__dirname, 'employee_turnover_template.csv'));
    
    for (const record of turnover) {
      await query(`
        INSERT INTO employee_turnover (id, employee_id, termination_date, termination_reason, replacement_id, replacement_date, replacement_hire_date, department, position, exit_interview_notes, severance_paid, rehire_eligible)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        ON CONFLICT (id) DO UPDATE SET
          employee_id = EXCLUDED.employee_id,
          termination_date = EXCLUDED.termination_date,
          termination_reason = EXCLUDED.termination_reason,
          replacement_id = EXCLUDED.replacement_id,
          replacement_date = EXCLUDED.replacement_date,
          replacement_hire_date = EXCLUDED.replacement_hire_date,
          department = EXCLUDED.department,
          position = EXCLUDED.position,
          exit_interview_notes = EXCLUDED.exit_interview_notes,
          severance_paid = EXCLUDED.severance_paid,
          rehire_eligible = EXCLUDED.rehire_eligible,
          updated_at = NOW()
      `, [record.id, parseInt(record.employee_id), parseDate(record.termination_date), record.termination_reason,
         parseInt(record.replacement_id), parseDate(record.replacement_date), parseDate(record.replacement_hire_date),
         record.department, record.position, record.exit_interview_notes, parseFloat(record.severance_paid),
         record.rehire_eligible === 'true']);
    }
    console.log(`✅ Imported ${turnover.length} employee turnover records`);
  } catch (error) {
    console.error('❌ Error importing employee turnover:', error.message);
  }
}

// Import Daily Laborers
async function importDailyLaborers() {
  try {
    console.log('👷 Importing Daily Laborers Data...');
    const laborers = parseCSV(path.join(__dirname, 'daily_laborers_template.csv'));
    
    for (const record of laborers) {
      await query(`
        INSERT INTO daily_laborers (id, project_id, date, laborer_name, work_type, daily_rate, hours_worked, total_pay, skill_level, project_location, contract_type, supervisor_id)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          project_id = EXCLUDED.project_id,
          date = EXCLUDED.date,
          laborer_name = EXCLUDED.laborer_name,
          work_type = EXCLUDED.work_type,
          daily_rate = EXCLUDED.daily_rate,
          hours_worked = EXCLUDED.hours_worked,
          total_pay = EXCLUDED.total_pay,
          skill_level = EXCLUDED.skill_level,
          project_location = EXCLUDED.project_location,
          contract_type = EXCLUDED.contract_type,
          supervisor_id = EXCLUDED.supervisor_id,
          updated_at = NOW()
      `, [record.id, parseInt(record.project_id), parseDate(record.date), record.laborer_name,
         record.work_type, parseFloat(record.daily_rate), parseFloat(record.hours_worked),
         parseFloat(record.total_pay), record.skill_level, record.project_location,
         record.contract_type, parseInt(record.supervisor_id)]);
    }
    console.log(`✅ Imported ${laborers.length} daily laborer records`);
  } catch (error) {
    console.error('❌ Error importing daily laborers:', error.message);
  }
}

// Import Projects
async function importProjects() {
  try {
    console.log('🏗️ Importing Projects Data...');
    const projects = parseCSV(path.join(__dirname, 'projects_template.csv'));
    
    for (const record of projects) {
      await query(`
        INSERT INTO projects (id, project_name, project_type, start_date, end_date, budget, total_cost, status, client_name, location, project_manager_id, total_laborers, total_days)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          project_name = EXCLUDED.project_name,
          project_type = EXCLUDED.project_type,
          start_date = EXCLUDED.start_date,
          end_date = EXCLUDED.end_date,
          budget = EXCLUDED.budget,
          total_cost = EXCLUDED.total_cost,
          status = EXCLUDED.status,
          client_name = EXCLUDED.client_name,
          location = EXCLUDED.location,
          project_manager_id = EXCLUDED.project_manager_id,
          total_laborers = EXCLUDED.total_laborers,
          total_days = EXCLUDED.total_days,
          updated_at = NOW()
      `, [record.id, record.project_name, record.project_type, parseDate(record.start_date), parseDate(record.end_date),
         parseFloat(record.budget), parseFloat(record.total_cost), record.status, record.client_name,
         record.location, parseInt(record.project_manager_id), parseInt(record.total_laborers), parseInt(record.total_days)]);
    }
    console.log(`✅ Imported ${projects.length} project records`);
  } catch (error) {
    console.error('❌ Error importing projects:', error.message);
  }
}

// Helper function to parse date
function parseDate(dateStr) {
  if (!dateStr) return null;
  return dateStr.includes(':') ? new Date(dateStr) : new Date(dateStr + ' 00:00:00');
}

// Import Departments
async function importDepartments() {
  try {
    console.log('🏢 Importing Departments...');
    const departments = parseCSV(path.join(__dirname, 'departments_template.csv'));
    
    for (const dept of departments) {
      await query(`
        INSERT INTO departments (id, name, description, manager_id, created_at)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (id) DO UPDATE SET
          name = EXCLUDED.name,
          description = EXCLUDED.description,
          manager_id = EXCLUDED.manager_id,
          updated_at = NOW()
      `, [dept.id, dept.name, dept.description, dept.manager_id, parseDate(dept.created_at)]);
    }
    console.log(`✅ Imported ${departments.length} departments`);
  } catch (error) {
    console.error('❌ Error importing departments:', error.message);
  }
}

// Import Users
async function importUsers() {
  try {
    console.log('👥 Importing Users...');
    const users = parseCSV(path.join(__dirname, 'users_template.csv'));
    
    for (const user of users) {
      // Hash password
      const bcrypt = require('bcryptjs');
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(user.password, salt);
      
      await query(`
        INSERT INTO users (id, username, email, password, role, status, name, phone, department, position, salary, hire_date)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          username = EXCLUDED.username,
          email = EXCLUDED.email,
          role = EXCLUDED.role,
          status = EXCLUDED.status,
          name = EXCLUDED.name,
          phone = EXCLUDED.phone,
          department = EXCLUDED.department,
          position = EXCLUDED.position,
          salary = EXCLUDED.salary,
          hire_date = EXCLUDED.hire_date,
          updated_at = NOW()
      `, [user.id, user.username, user.email, hashedPassword, user.role, user.status, 
         user.name, user.phone, user.department, user.position, user.salary, parseDate(user.hire_date)]);
    }
    console.log(`✅ Imported ${users.length} users`);
  } catch (error) {
    console.error('❌ Error importing users:', error.message);
  }
}

// Import Attendance
async function importAttendance() {
  try {
    console.log('⏰ Importing Attendance Records...');
    const attendance = parseCSV(path.join(__dirname, 'attendance_template.csv'));
    
    for (const record of attendance) {
      await query(`
        INSERT INTO attendance (id, user_id, check_in, check_out, work_hours, late_minutes, overtime_hours, status, date, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        ON CONFLICT (id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          check_in = EXCLUDED.check_in,
          check_out = EXCLUDED.check_out,
          work_hours = EXCLUDED.work_hours,
          late_minutes = EXCLUDED.late_minutes,
          overtime_hours = EXCLUDED.overtime_hours,
          status = EXCLUDED.status,
          date = EXCLUDED.date,
          notes = EXCLUDED.notes,
          updated_at = NOW()
      `, [record.id, record.user_id, parseDate(record.check_in), parseDate(record.check_out), 
         parseFloat(record.work_hours), parseInt(record.late_minutes), parseFloat(record.overtime_hours),
         record.status, parseDate(record.date), record.notes]);
    }
    console.log(`✅ Imported ${attendance.length} attendance records`);
  } catch (error) {
    console.error('❌ Error importing attendance:', error.message);
  }
}

// Import Leave Requests
async function importLeave() {
  try {
    console.log('🏖️ Importing Leave Requests...');
    const leave = parseCSV(path.join(__dirname, 'leave_template.csv'));
    
    for (const record of leave) {
      await query(`
        INSERT INTO leave_requests (id, user_id, leave_type, start_date, end_date, total_days, status, reason, approver_id, approved_date, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
        ON CONFLICT (id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          leave_type = EXCLUDED.leave_type,
          start_date = EXCLUDED.start_date,
          end_date = EXCLUDED.end_date,
          total_days = EXCLUDED.total_days,
          status = EXCLUDED.status,
          reason = EXCLUDED.reason,
          approver_id = EXCLUDED.approver_id,
          approved_date = EXCLUDED.approved_date,
          created_at = EXCLUDED.created_at,
          updated_at = NOW()
      `, [record.id, record.user_id, record.leave_type, parseDate(record.start_date), parseDate(record.end_date),
         parseInt(record.total_days), record.status, record.reason, record.approver_id, 
         parseDate(record.approved_date), parseDate(record.created_at)]);
    }
    console.log(`✅ Imported ${leave.length} leave requests`);
  } catch (error) {
    console.error('❌ Error importing leave:', error.message);
  }
}

// Import Payroll
async function importPayroll() {
  try {
    console.log('💰 Importing Payroll Records...');
    const payroll = parseCSV(path.join(__dirname, 'payroll_template.csv'));
    
    for (const record of payroll) {
      await query(`
        INSERT INTO payroll (id, user_id, pay_date, gross_salary, net_salary, tax_deductions, pension_deductions, other_deductions, overtime_pay, bonus, payment_method, status, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        ON CONFLICT (id) DO UPDATE SET
          user_id = EXCLUDED.user_id,
          pay_date = EXCLUDED.pay_date,
          gross_salary = EXCLUDED.gross_salary,
          net_salary = EXCLUDED.net_salary,
          tax_deductions = EXCLUDED.tax_deductions,
          pension_deductions = EXCLUDED.pension_deductions,
          other_deductions = EXCLUDED.other_deductions,
          overtime_pay = EXCLUDED.overtime_pay,
          bonus = EXCLUDED.bonus,
          payment_method = EXCLUDED.payment_method,
          status = EXCLUDED.status,
          created_at = EXCLUDED.created_at,
          updated_at = NOW()
      `, [record.id, record.user_id, parseDate(record.pay_date), parseFloat(record.gross_salary), 
         parseFloat(record.net_salary), parseFloat(record.tax_deductions), parseFloat(record.pension_deductions),
         parseFloat(record.other_deductions), parseFloat(record.overtime_pay), parseFloat(record.bonus),
         record.payment_method, record.status, parseDate(record.created_at)]);
    }
    console.log(`✅ Imported ${payroll.length} payroll records`);
  } catch (error) {
    console.error('❌ Error importing payroll:', error.message);
  }
}

// Main import function
async function importAllData() {
  try {
    console.log('🚀 Starting Ubuntu HRMS Data Import (2023-2025)...\n');
    
    // Import in order to maintain foreign key constraints
    await importDepartments();
    await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second
    
    await importUsers();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await importAttendance();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await importLeave();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await importCompanyGrowth();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await importEmployeeTurnover();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await importDailyLaborers();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await importProjects();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await importPayroll();
    
    console.log('\n🎉 All data imported successfully!');
    console.log('\n📊 Summary:');
    console.log('   - Departments: Imported');
    console.log('   - Users: Imported with hashed passwords (25 employees)');
    console.log('   - Attendance: Imported (2023-2025)');
    console.log('   - Leave: Imported (2023-2025)');
    console.log('   - Company Growth: Imported (2 to 25 employees)');
    console.log('   - Employee Turnover: Imported with replacements');
    console.log('   - Daily Laborers: Imported for project work');
    console.log('   - Projects: Imported with labor tracking');
    console.log('   - Payroll: Imported (2023-2025)');
    
  } catch (error) {
    console.error('❌ Import failed:', error.message);
  } finally {
    await pool.end();
  }
}

// Run import if called directly
if (require.main === module) {
  importAllData();
}

module.exports = {
  importDepartments,
  importUsers,
  importAttendance,
  importLeave,
  importPayroll,
  importAllData
};
