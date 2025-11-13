import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

export const pool = mysql.createPool(dbConfig);

export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    console.log('✅ MySQL Database connected successfully');
    connection.release();
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error.message);
    return false;
  }
};

// Example SQL query to alter the table
const alterMediaFilesTable = `
  ALTER TABLE media_files
  MODIFY COLUMN url VARCHAR(2083); -- Increase length to accommodate longer URLs
`;

// Execute the query to update the schema
const updateSchema = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.query(alterMediaFilesTable);
    console.log('✅ Database schema updated successfully.');
    connection.release();
  } catch (error) {
    console.error('❌ Failed to update database schema:', error.message);
  }
};

updateSchema();