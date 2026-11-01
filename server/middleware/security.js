const LOGIN_WINDOW_MS = 15 * 60 * 1000;
const LOGIN_ATTEMPT_LIMIT = 10;
const loginAttempts = new Map();

const securityHeaders = (req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  res.setHeader('Cross-Origin-Resource-Policy', 'same-site');
  next();
};

const loginRateLimit = (req, res, next) => {
  const now = Date.now();
  if (loginAttempts.size > 5000) {
    for (const [key, value] of loginAttempts) {
      if (value.resetAt <= now || loginAttempts.size > 5000) loginAttempts.delete(key);
    }
  }
  const username = typeof req.body?.username === 'string'
    ? req.body.username.trim().toLowerCase().slice(0, 128)
    : 'invalid';
  const key = `${req.ip || 'unknown'}:${username}`;
  const existing = loginAttempts.get(key);
  const record = !existing || existing.resetAt <= now
    ? { count: 0, resetAt: now + LOGIN_WINDOW_MS }
    : existing;

  record.count += 1;
  loginAttempts.set(key, record);

  if (record.count > LOGIN_ATTEMPT_LIMIT) {
    const retryAfter = Math.max(1, Math.ceil((record.resetAt - now) / 1000));
    res.setHeader('Retry-After', String(retryAfter));
    return res.status(429).json({ code: 429, message: 'Too many login attempts. Try again later.' });
  }

  res.on('finish', () => {
    if (res.statusCode < 400 && res.locals?.serviceCode === 200) loginAttempts.delete(key);
  });
  return next();
};

module.exports = { securityHeaders, loginRateLimit };
