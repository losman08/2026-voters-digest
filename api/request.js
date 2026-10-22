import { get, put } from '@vercel/blob';

const KEY = 'requests.json';

async function readAll() {
  let arr = [];
  let existing = null;
  try { existing = await get(KEY, { access: 'private' }); } catch (e) { existing = null; }
  if (existing && existing.statusCode === 200 && existing.stream) {
    try { arr = JSON.parse(await new Response(existing.stream).text()); } catch (e) { arr = []; }
  }
  return Array.isArray(arr) ? arr : [];
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  try {
    const b = (req.body && typeof req.body === 'object') ? req.body : {};
    const clean = (v, n) => (v == null ? '' : String(v)).trim().slice(0, n);
    const name = clean(b.name, 120);
    const phone = clean(b.phone, 40);
    const state = clean(b.state, 60);
    const county = clean(b.county, 80);
    const city = clean(b.city, 80);
    if (!name || !phone || !state) {
      res.status(400).json({ error: 'Name, phone, and state are required.' });
      return;
    }
    const arr = await readAll();
    arr.push({
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      name, phone, state, county, city,
      ts: new Date().toISOString(),
      delivered: false
    });
    const trimmed = arr.length > 2000 ? arr.slice(-2000) : arr;
    await put(KEY, JSON.stringify(trimmed), {
      access: 'private',
      allowOverwrite: true,
      contentType: 'application/json'
    });
    res.status(200).json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: 'Could not save request.' });
  }
}
