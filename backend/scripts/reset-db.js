#!/usr/bin/env node

/**
 * Database Reset Script
 * Deletes all sample data (USE WITH CAUTION!)
 * Usage: node scripts/reset-db.js
 */

const { query } = require('../config/db');
require('dotenv').config();

async function resetDatabase() {
  try {
    console.log('⚠️  WARNING: This will delete ALL data from the database!');
    console.log('Proceeding with database reset...\n');

    // Drop all tables in dependency order (handle foreignkey dependencies)
    const tables = [
      'pending_bonuses',
      'employee_kpis',
      'kpi_definitions',
      'leave_requests',
      'leave_balances',
      'leave_policies',
      'project_assignments',
      'pay_rates',
      'payslips',
      'contractor_performance',
      'invoices',
      'projects',
      'application_user_links',
      'job_applications',
      'jobs',
      'profiles',
      'attendance',
      'employees',
      'users',
    ];

    for (const table of tables) {
      try {
        await query(`DROP TABLE IF EXISTS ${table} CASCADE`);
        console.log(`✅ Dropped table: ${table}`);
      } catch (err) {
        console.log(`⚠️  Could not drop ${table}: ${err.message}`);
      }
    }

    console.log('\n✨ Database reset complete!');
    console.log('Run: node scripts/seed.js to repopulate with sample data');

    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting database:', error.message);
    process.exit(1);
  }
}

// Confirm with user
const confirmReset = () => {
  console.log('\n⚠️  CAUTION: This action cannot be undone!');
  console.log('This will delete ALL tables and data from the database.\n');

  // Since this is a script, we'll just proceed for automation
  // In production, you might want to add confirmation prompts
  resetDatabase();
};

confirmReset();
