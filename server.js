
require('dotenv').config();

const path = require('node:path');
const express = require('express');

const { checkDatabase } = require('./database');
const { getMedia } = require('./services/mediaService');

const app = express();

// Serve the ShelfSpace website.
app.use(express.static(path.join(__dirname, 'public')));

// Website health check.
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    application: 'ShelfSpace'
  });
});

// MySQL connection health check.
app.get('/health/db', async (_req, res) => {
  try {
    await checkDatabase();

    res.json({
      database: 'connected',
      query: 'SELECT 1'
    });
  } catch (error) {
    console.error(
      'Database health check failed:',
      error.message
    );

    res.status(503).json({
      database: 'unavailable'
    });
  }
});

// Retrieve media from the shared library.
app.get('/api/media', async (req, res) => {
  try {
    const options = {
      search: req.query.search,
      category: req.query.category,
      status: req.query.status,
      sort: req.query.sort,
      order: req.query.order
    };

    const media = await getMedia(options);

    res.json(media);
  } catch (error) {
    console.error(
      'Failed to retrieve media:',
      error.message
    );

    res.status(503).json({
      error: 'Unable to retrieve media records.'
    });
  }
});

// Start the website.
if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;

  app.listen(port, '0.0.0.0', () => {
    console.log(
      `ShelfSpace listening on port ${port}`
    );
  });
}

module.exports = app;

