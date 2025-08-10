import { Pool } from 'pg';

let pool;

export async function getConnection() {
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });
  }
  return pool;
}

export async function query(sql, params = []) {
  try {
    const pool = await getConnection();
    const result = await pool.query(sql, params);
    return result.rows;
  } catch (error) {
    console.error('Database query error:', error);
    throw error;
  }
}

export async function closeConnection() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}
