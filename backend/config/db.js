const mysql = require('mysql2/promise');

const DB_NAME = process.env.DB_NAME || 'acore_chat';

const config = {
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
  waitForConnections: true,
  connectionLimit: 10,
};

let pool;

async function initPool() {
  const conn = await mysql.createConnection(config);
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\``);
  await conn.end();

  pool = mysql.createPool({ ...config, database: DB_NAME });
}

function getPool() {
  if (!pool) throw new Error('Pool not initialized');
  return pool;
}

module.exports = { initPool, getPool, DB_NAME };
