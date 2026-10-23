/**
 * Database Configuration for MyQuizApp
 * PostgreSQL connection using pg library
 * Uses environment variables for configuration
 */

const { Pool } = require('pg');
require('dotenv').config();

// Create connection pool
// For Replit: use DATABASE_URL (PostgreSQL) or REPLIT_DB_URL
// For local: use DB_URL or individual connection params
// Note: If connectionString is provided, other options are ignored
const dbConfig = {};

// Use connection string if available
const connString = process.env.DATABASE_URL || process.env.REPLIT_DB_URL || process.env.DB_URL;
if (connString) {
  dbConfig.connectionString = connString;
} else {
  // Fallback to individual params
  dbConfig.host = process.env.DB_HOST || 'localhost';
  dbConfig.port = parseInt(process.env.DB_PORT, 10) || 5432;
  dbConfig.database = process.env.DB_NAME || process.env.PGDATABASE || 'myquizapp';
  dbConfig.user = process.env.DB_USER || 'postgres';
  dbConfig.password = process.env.DB_PASSWORD || '';
}

const pool = new Pool({
  ...dbConfig,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: connString && connString.includes('sslmode=disable') ? false : undefined,
});

// Log connection events
pool.on('connect', () => {
  console.log('✓ Connected to PostgreSQL database');
});

pool.on('error', (err) => {
  console.error('✗ Database error:', err);
});

/**
 * Execute a query with parameters (prevents SQL injection)
 */
const query = async (text, params) => {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Query error:', error);
    throw error;
  }
};

/**
 * Get a client from the pool for transactions
 */
const getClient = async () => {
  return pool.connect();
};

module.exports = {
  pool,
  query,
  getClient,
};
