
require('dotenv').config();

const path = require('node:path');
const express = require('express');

const { checkDatabase } = require('./database');
const { getMedia } = require('./services/mediaService');

const {
  createMedia,
  updateMedia,
  deleteMedia
} = require('./services/mediaManagementService');

const {
  isAuthConfigured,
  verifyPassword,
  makeLoginCookie,
  makeLogoutCookie,
  hasAdminSession,
  requireAdmin
} = require('./middleware/adminAuth');

const app = express();

app.use(express.json({ limit: '16kb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Reject requests from other websites.
function requireSameOrigin(req, res, next) {
  const origin = req.get('origin');
  const fetchSite = req.get('sec-fetch-site');

  if (fetchSite === 'cross-site') {
    return res.status(403).json({
      error: 'Cross-site requests are not allowed.'
    });
  }

  if (origin) {
    try {
      if (new URL(origin).host !== req.get('host')) {
        return res.status(403).json({
          error: 'Request origin is not allowed.'
        });
      }
    } catch {
      return res.status(403).json({
        error: 'Invalid request origin.'
      });
    }
  }

  next();
}

// Limit failed administrator login attempts.
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000;

function loginLimited(req) {
  const key = req.socket.remoteAddress || 'unknown';
  const current = loginAttempts.get(key);

  if (!current || Date.now() > current.until) {
    loginAttempts.set(key, {
      count: 0,
      until: Date.now() + WINDOW_MS
    });
    return false;
  }

  return current.count >= MAX_ATTEMPTS;
}

function recordFailedLogin(req) {
  const key = req.socket.remoteAddress || 'unknown';
  const current = loginAttempts.get(key);

  if (current) {
    current.count++;
  }
}

function clearLoginAttempts(req) {
  const key = req.socket.remoteAddress || 'unknown';
  loginAttempts.delete(key);
}

// Handle validation, missing records and database errors.
function handleMediaError(error, res) {
  if (error.status === 400 || error.status === 404) {
    return res.status(error.status).json({
      error: error.message
    });
  }

  console.error('Media operation failed:', error.message);

  return res.status(503).json({
    error: 'Unable to complete the media operation.'
  });
}

// Website health check.
app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    application: 'ShelfSpace'
  });
});

// Database health check.
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

// Public library browsing.
app.get('/api/media', async (req, res) => {
  try {
    const media = await getMedia({
      search: req.query.search,
      category: req.query.category,
      status: req.query.status,
      sort: req.query.sort,
      order: req.query.order
    });

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

// Administrator authentication status.
app.get('/api/admin/status', (req, res) => {
  res.json({
    configured: isAuthConfigured(),
    authenticated: hasAdminSession(req)
  });
});

// Administrator login.
app.post(
  '/api/admin/login',
  requireSameOrigin,
  (req, res) => {
    if (!isAuthConfigured()) {
      return res.status(503).json({
        error: 'Administrator login is not configured.'
      });
    }

    if (loginLimited(req)) {
      return res.status(429).json({
        error: 'Too many login attempts. Try later.'
      });
    }

    const password = req.body?.password;

    if (!verifyPassword(password)) {
      recordFailedLogin(req);

      return res.status(401).json({
        error: 'Incorrect administrator password.'
      });
    }

    clearLoginAttempts(req);

    res.setHeader('Set-Cookie', makeLoginCookie());

    res.json({
      authenticated: true,
      message: 'Administrator login successful.'
    });
  }
);

// Administrator logout.
app.post(
  '/api/admin/logout',
  requireSameOrigin,
  (_req, res) => {
    res.setHeader('Set-Cookie', makeLogoutCookie());

    res.json({
      authenticated: false,
      message: 'Administrator logged out.'
    });
  }
);

// Verify administrator session.
app.get(
  '/api/admin/check',
  requireAdmin,
  (_req, res) => {
    res.json({
      authorized: true,
      message: 'Administrator access confirmed.'
    });
  }
);

// ADD a media record.
// Only authenticated administrators may use this route.
app.post(
  '/api/media',
  requireAdmin,
  requireSameOrigin,
  async (req, res) => {
    try {
      const result = await createMedia(req.body);

      res.status(201).json(result);
    } catch (error) {
      handleMediaError(error, res);
    }
  }
);

// EDIT a media record.
app.put(
  '/api/media/:id',
  requireAdmin,
  requireSameOrigin,
  async (req, res) => {
    try {
      const result = await updateMedia(
        req.params.id,
        req.body
      );

      res.json(result);
    } catch (error) {
      handleMediaError(error, res);
    }
  }
);

// DELETE a media record.
app.delete(
  '/api/media/:id',
  requireAdmin,
  requireSameOrigin,
  async (req, res) => {
    try {
      const result = await deleteMedia(req.params.id);

      res.json(result);
    } catch (error) {
      handleMediaError(error, res);
    }
  }
);

// Start ShelfSpace.
if (require.main === module) {
  const port = Number(process.env.PORT) || 3000;

  app.listen(port, '0.0.0.0', () => {
    console.log(
      `ShelfSpace listening on port ${port}`
    );
  });
}

module.exports = app;
