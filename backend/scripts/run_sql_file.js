const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
  const sqlPath = path.join(__dirname, '..', 'sql', 'init_full.sql');
  if (!fs.existsSync(sqlPath)) {
    console.error('SQL file not found:', sqlPath);
    process.exit(2);
  }

  const sql = fs.readFileSync(sqlPath, 'utf8');

  const config = {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT ? parseInt(process.env.DB_PORT, 10) : 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'Love123',
    multipleStatements: true,
    // Do not set database here because the script contains CREATE DATABASE / USE
  };

  let conn;
  try {
    console.log('Connecting to MySQL with', { host: config.host, port: config.port, user: config.user });
    conn = await mysql.createConnection(config);
    console.log('Connected. Executing SQL file...');

    const [results] = await conn.query(sql);
    console.log('Execution completed. Results (first statement):');
    console.log(Array.isArray(results) ? JSON.stringify(results[0], null, 2) : JSON.stringify(results, null, 2));
    console.log('✅ SQL file executed.');
  } catch (err) {
    console.error('❌ SQL execution failed:', err.message || err);
    process.exitCode = 2;
  } finally {
    if (conn) await conn.end();
  }
})();
