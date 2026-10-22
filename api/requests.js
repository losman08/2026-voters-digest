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
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const token = (req.query && req.query.token) || '';
  if (!process.env.ADMIN_TOKEN || token !== process.env.ADMIN_TOKEN) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  try {
    const arr = await readAll();
    const pending = arr.filter((r) => !r.delivered);
    const claim = req.query && (req.query.claim === '1' || req.query.claim === 'true');
    if (claim && pending.length) {
      const ids = new Set(pending.map((r) => r.id));
      const updated = arr.map((r) => (ids.has(r.id) ? { ...r, delivered: true } : r));
      await put(KEY, JSON.stringify(updated), {
        access: 'private',
        allowOverwrite: true,
        contentType: 'application/json'
      });
    }
    res.status(200).json({ count: pending.length, total: arr.length, requests: pending });
  } catch (e) {
    res.status(500).json({ error: 'Could not read requests.' });
  }
}
