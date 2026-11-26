const { secrets, safeEqual, createSession, validSession, cookieValue, cookieHeader, SESSION_SECONDS } = require('../lib/auth');

module.exports = function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (!['GET', 'POST', 'DELETE'].includes(req.method)) {
    res.setHeader('Allow', 'GET, POST, DELETE');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let config;
  try { config = secrets(); }
  catch (error) { return res.status(500).json({ error: error.message }); }

  if (req.method === 'GET') {
    const authenticated = validSession(cookieValue(req), config.secret);
    return res.status(authenticated ? 200 : 401).json({ authenticated });
  }
  if (req.method === 'DELETE') {
    res.setHeader('Set-Cookie', cookieHeader('', 0));
    return res.status(200).json({ authenticated: false });
  }

  const body = req.body && typeof req.body === 'object' ? req.body : {};
  if (!safeEqual(body.password || '', config.password)) {
    return res.status(401).json({ error: 'รหัสผ่านไม่ถูกต้อง' });
  }
  res.setHeader('Set-Cookie', cookieHeader(createSession(config.secret), SESSION_SECONDS));
  return res.status(200).json({ authenticated: true });
};
