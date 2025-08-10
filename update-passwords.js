const bcrypt = require('bcryptjs');
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'crams_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres123',
  ssl: false
});

async function updatePasswords() {
  try {
    console.log('🔐 Updating demo account passwords...');
    
    // Hash the password 'password123'
    const hashedPassword = await bcrypt.hash('password123', 12);
    console.log('✅ Generated password hash:', hashedPassword);
    
    // Update all demo accounts with the same password
    const updateQuery = 'UPDATE users SET password = $1 WHERE email IN ($2, $3, $4, $5, $6, $7, $8, $9)';
    const emails = [
      'admin@crams.edu',
      'advisor1@advisor.com', 
      'advisor2@advisor.com',
      'advisor3@advisor.com',
      'student1@student.com',
      'student2@student.com', 
      'student3@student.com',
      'student4@student.com'
    ];
    
    // Update email addresses in database
    await pool.query('UPDATE users SET email = $1 WHERE email = $2', ['advisor1@advisor.com', 'advisor1@crams.edu']);
    await pool.query('UPDATE users SET email = $1 WHERE email = $2', ['advisor2@advisor.com', 'advisor2@crams.edu']);
    await pool.query('UPDATE users SET email = $1 WHERE email = $2', ['advisor3@advisor.com', 'advisor3@crams.edu']);
    await pool.query('UPDATE users SET email = $1 WHERE email = $2', ['student1@student.com', 'student1@crams.edu']);
    await pool.query('UPDATE users SET email = $1 WHERE email = $2', ['student2@student.com', 'student2@crams.edu']);
    await pool.query('UPDATE users SET email = $1 WHERE email = $2', ['student3@student.com', 'student3@crams.edu']);
    await pool.query('UPDATE users SET email = $1 WHERE email = $2', ['student4@student.com', 'student4@crams.edu']);
    console.log('✅ Updated email addresses to new domains');
    
    const result = await pool.query(updateQuery, [hashedPassword, ...emails]);
    console.log(`✅ Updated ${result.rowCount} user passwords`);
    
    // Test the password verification
    const testResult = await bcrypt.compare('password123', hashedPassword);
    console.log('✅ Password verification test:', testResult);
    
    console.log('🎉 All demo accounts now use password: password123');
    
  } catch (error) {
    console.error('❌ Error updating passwords:', error);
  } finally {
    await pool.end();
  }
}

updatePasswords();
