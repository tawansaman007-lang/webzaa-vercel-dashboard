const crypto = require('node:crypto');

const COOKIE_NAME = 'webzaa_session';
const SESSION_SECONDS = 60 * 60 * 12;

function secrets() {
  const password = process.env.DASHBOARD_PASSWORD;
  const secret = process.env.SESSION_SECRET;
  if (!password || !secret || secret.length < 32) {
    throw new Error('Set DASHBOARD_PASSWORD and a SESSION_SECRET of at least 32 characters.');
  }
  return { password, secret };
}

function safeEqual(left, right) {
  const a = Buffer.from(String(left));
  const b = Buffer.from(String(right));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

function sign(value, secret) {
  return crypto.createHmac('sha256', secret).update(value).digest('base64url');
}

function createSession(secret) {
  const expires = Math.floor(Date.now() / 1000) + SESSION_SECONDS;
  const payload = Buffer.from(JSON.stringify({ exp: expires })).toString('base64url');
  return `${payload}.${sign(payload, secret)}`;
}

function validSession(token, secret) {
  if (!token || typeof token !== 'string') return false;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra) return false;
  if (!safeEqual(signature, sign(payload, secret))) return false;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return Number.isInteger(data.exp) && data.exp > Math.floor(Date.now() / 1000);
  } catch {
    return false;
  }
}

function cookieValue(req) {
  const cookies = String(req.headers.cookie || '').split(';');
  const prefix = `${COOKIE_NAME}=`;
  const item = cookies.map((part) => part.trim()).find((part) => part.startsWith(prefix));
  return item ? decodeURIComponent(item.slice(prefix.length)) : '';
}

function cookieHeader(value, maxAge) {
  return `${COOKIE_NAME}=${encodeURIComponent(value)}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}

module.exports = {
  secrets,
  safeEqual,
  createSession,
  validSession,
  cookieValue,
  cookieHeader,
  SESSION_SECONDS,
};
