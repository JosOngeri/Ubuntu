const { query } = require('../config/db');
require('dotenv').config();

async function checkDatabase() {
  try {
    console.log('🔍 Checking database connection...\n');
    
    // Get current connection details
    const dbNameRes = await query('SELECT current_database() as db_name, current_user as user_name');
    console.log(`✅ Connected to Database: \x1b[36m${dbNameRes.rows[0].db_name}\x1b[0m`);
    console.log(`✅ Connected as User: \x1b[36m${dbNameRes.rows[0].user_name}\x1b[0m\n`);

    // Fetch all tables in the public schema
    const tablesRes = await query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
    `);
    
    if (tablesRes.rows.length === 0) {
      console.log('⚠️  No tables found in this database. It is completely empty.');
    } else {
      console.log(`📊 Found ${tablesRes.rows.length} tables. Checking row counts...`);
      for (const row of tablesRes.rows) {
        const countRes = await query(`SELECT COUNT(*) FROM ${row.table_name}`);
        console.log(`   - ${row.table_name}: ${countRes.rows[0].count} rows`);
      }
    }
    process.exit(0);
  } catch (err) {
    console.error('❌ Connection failed:', err.message);
    process.exit(1);
  }
}

checkDatabase();