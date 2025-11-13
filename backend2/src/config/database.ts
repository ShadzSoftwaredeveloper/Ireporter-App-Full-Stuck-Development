import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'ireporter_db',
  port: parseInt(process.env.DB_PORT || '3306'),
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

const pool = mysql.createPool(dbConfig);

export const getConnection = () => pool.getConnection();
export default pool;