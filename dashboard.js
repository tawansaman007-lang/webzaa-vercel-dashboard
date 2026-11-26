const { secrets, validSession, cookieValue } = require('../lib/auth');

module.exports = async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET');
    return res.status(405).json({ error: 'Method not allowed' });
  }

  let config;
  try { config = secrets(); }
  catch (error) { return res.status(500).json({ error: error.message }); }
  if (!validSession(cookieValue(req), config.secret)) {
    return res.status(401).json({ error: 'กรุณาเข้าสู่ระบบใหม่' });
  }

  const month = typeof req.query.month === 'string' ? req.query.month : '';
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
    return res.status(400).json({ error: 'รูปแบบเดือนต้องเป็น YYYY-MM' });
  }
  const endpoint = process.env.SUPABASE_DASHBOARD_URL;
  const token = process.env.DASHBOARD_READ_TOKEN;
  if (!endpoint || !token) {
    return res.status(500).json({ error: 'ตั้งค่า SUPABASE_DASHBOARD_URL และ DASHBOARD_READ_TOKEN ใน Vercel ก่อน' });
  }

  try {
    const upstream = await fetch(`${endpoint}?month=${encodeURIComponent(month)}`, {
      headers: { 'x-dashboard-token': token },
      cache: 'no-store',
      signal: AbortSignal.timeout(15000),
    });
    const text = await upstream.text();
    if (!upstream.ok) {
      console.error('Supabase dashboard request failed:', upstream.status, text);
      return res.status(upstream.status === 401 ? 502 : upstream.status).json({ error: upstream.status === 401 ? 'รหัสเชื่อมต่อ Supabase ไม่ถูกต้อง' : 'โหลดข้อมูลจาก Supabase ไม่สำเร็จ' });
    }
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    return res.status(200).send(text);
  } catch (error) {
    console.error('Dashboard proxy failed:', error);
    return res.status(502).json({ error: 'ติดต่อ Supabase ไม่สำเร็จ' });
  }
};
