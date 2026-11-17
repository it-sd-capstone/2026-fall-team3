
require('dotenv').config();

const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');

async function initializeDatabase() {
  const url = process.env.DATABASE_URL || process.env.MYSQL_URL;

  if (!url) {
    throw new Error('MySQL connection URL is missing.');
  }

  const connection = await mysql.createConnection(url);

  try {
    for (const filename of ['schema.sql', 'seed.sql']) {
      const filePath = path.join(__dirname, filename);
      const sql = fs.readFileSync(filePath, 'utf8');

      const statements = sql
        .split(';')
        .map(statement => statement.trim())
        .filter(Boolean);

      for (const statement of statements) {
        await connection.query(statement);
      }

      console.log(`Executed ${filename}`);
    }

    const [rows] = await connection.query(
      'SELECT COUNT(*) AS total FROM media_items'
    );

    console.log(`Database ready: ${rows[0].total} media items`);
  } finally {
    await connection.end();
  }
}

initializeDatabase().catch(error => {
  console.error('Database initialization failed:', error.message);
  process.exitCode = 1;
});
