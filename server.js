require('dotenv').config();
const path = require('node:path');
const express = require('express');
const { checkDatabase } = require('./database');

const app = express();

app.use(express.static(path.join(__dirname, 'public')));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', application: 'ShelfSpace' });
});

app.get('/health/db', async (_req, res) => {
  try {
    await checkDatabase();
    res.json({ database: 'connected', query: 'SELECT 1' });
  } catch (error) {
    console.error('Database health check failed:', error.message);
    res.status(503).json({ database: 'unavailable' });
  }
});

if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`ShelfSpace listening on port ${port}`);
  });
}

module.exports = app;
