
const crypto = require('node:crypto');

const COOKIE_NAME = 'shelfspace_admin';
const SESSION_SECONDS = 2 * 60 * 60;

// Authentication is disabled until both secrets
// are configured in Railway environment variables.
function isAuthConfigured() {
  return (
    typeof process.env.ADMIN_PASSWORD === 'string' &&
    process.env.ADMIN_PASSWORD.length >= 12 &&
    typeof process.env.ADMIN_SESSION_SECRET === 'string' &&
    process.env.ADMIN_SESSION_SECRET.length >= 32
  );
}

// Verify the administrator password.
function verifyPassword(password) {
  if (
    !isAuthConfigured() ||
    typeof password !== 'string' ||
    password.length > 1024
  ) {
    return false;
  }

  const expected = crypto
    .createHash('sha256')
    .update(process.env.ADMIN_PASSWORD)
    .digest();

  const actual = crypto
    .createHash('sha256')
    .update(password)
    .digest();

  return crypto.timingSafeEqual(actual, expected);
}

// Sign a session so visitors cannot forge
// administrator access.
function signPayload(payload) {
  return crypto
    .createHmac(
      'sha256',
      process.env.ADMIN_SESSION_SECRET
    )
    .update(payload)
    .digest('hex');
}

function cookieSecurity() {
  return (
    process.env.NODE_ENV === 'production' ||
    Boolean(process.env.RAILWAY_ENVIRONMENT)
  ) ? '; Secure' : '';
}

// Create a two-hour administrator session.
function makeLoginCookie() {
  if (!isAuthConfigured()) {
    throw new Error(
      'Administrator authentication is not configured.'
    );
  }

  const expires =
    Math.floor(Date.now() / 1000) + SESSION_SECONDS;

  const nonce = crypto.randomBytes(16).toString('hex');
  const payload = `${expires}.${nonce}`;
  const signature = signPayload(payload);

  const token = `${payload}.${signature}`;

  return (
    `${COOKIE_NAME}=${token}; ` +
    'Path=/; HttpOnly; SameSite=Strict; ' +
    `Max-Age=${SESSION_SECONDS}` +
    cookieSecurity()
  );
}

// Read the session cookie from an incoming request.
function readSessionCookie(req) {
  const header = req.headers.cookie;

  if (typeof header !== 'string') {
    return null;
  }

  const entry = header
    .split(';')
    .map(part => part.trim())
    .find(part => part.startsWith(`${COOKIE_NAME}=`));

  return entry
    ? entry.slice(COOKIE_NAME.length + 1)
    : null;
}

// Verify the session signature and expiration.
function hasAdminSession(req) {
  if (!isAuthConfigured()) {
    return false;
  }

  const token = readSessionCookie(req);

  if (!token || token.length > 150) {
    return false;
  }

  const match = token.match(
    /^(\d{10})\.([0-9a-f]{32})\.([0-9a-f]{64})$/
  );

  if (!match) {
    return false;
  }

  const [, expires, nonce, signature] = match;

  if (Number(expires) <= Math.floor(Date.now() / 1000)) {
    return false;
  }

  const payload = `${expires}.${nonce}`;

  const expected = Buffer.from(
    signPayload(payload),
    'hex'
  );

  const actual = Buffer.from(signature, 'hex');

  return crypto.timingSafeEqual(actual, expected);
}

// Protect administrator-only Express routes.
function requireAdmin(req, res, next) {
  if (!isAuthConfigured()) {
    return res.status(503).json({
      error: 'Administrator access is not configured.'
    });
  }

  if (!hasAdminSession(req)) {
    return res.status(401).json({
      error: 'Administrator login required.'
    });
  }

  next();
}

// Remove the browser's administrator session.
function makeLogoutCookie() {
  return (
    `${COOKIE_NAME}=; Path=/; HttpOnly; ` +
    'SameSite=Strict; Max-Age=0' +
    cookieSecurity()
  );
}

module.exports = {
  isAuthConfigured,
  verifyPassword,
  makeLoginCookie,
  makeLogoutCookie,
  hasAdminSession,
  requireAdmin
};
