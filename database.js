require('dotenv').config();
const mysql = require('mysql2/promise');

async function checkDatabase() {
  const url = process.env.DATABASE_URL || process.env.MYSQL_URL;

  if (!url) {
    throw new Error('Set DATABASE_URL or MYSQL_URL before database testing.');
  }

  const connection = await mysql.createConnection(url);
  try {
    const [rows] = await connection.query('SELECT 1 AS result');
    if (rows.length !== 1 || rows[0].result !== 1) {
      throw new Error('The database did not return the expected result.');
    }
    return true;
  } finally {
    await connection.end();
  }
}

module.exports = { checkDatabase };
