import { Router } from 'express';
import { db } from '../db.js';
import { schedule, addDays, todayYmd } from '../lib/spaced.js';
import { TIERS, TRACKS } from '../data/prep.js';

export const prepRouter = Router();

const TRACK_IDS = new Set(TRACKS.map((t) => t.id));

const json = (s, fallback) => {
  try { return JSON.parse(s ?? 'null') ?? fallback; } catch { return fallback; }
};

/* An item plus everything known about your history with it. `last` is what the
 * UI leads with; `attempts` is the count, because a design question attempted
 * once is a different object from one attempted four times. */
const shape = (r) => ({
  key: r.key,
  track: r.track,
  title: r.title,
  prompt: r.prompt,
  tier: r.tier,
  seq: r.seq,
  weight: r.weight,
  minutes: r.minutes,
  tags: json(r.tags, []),
  checklist: json(r.checklist, []),
  attempts: r.attempts ?? 0,
  last: r.last_verdict
    ? {
        id: r.last_id,
        verdict: r.last_verdict,
        on: r.last_on,
        minutes: r.last_minutes,
        notes: r.last_notes,
        hit: json(r.last_hit, []),
        due_on: r.last_due,
        reps: r.last_reps
      }
    : null
});

const WITH_LAST = `
  SELECT p.*,
    (SELECT COUNT(*) FROM attempts a WHERE a.item_key = p.key) AS attempts,
    l.id AS last_id, l.verdict AS last_verdict, l.attempted_on AS last_on,
    l.minutes AS last_minutes, l.notes AS last_notes, l.hit AS last_hit,
    l.due_on AS last_due, l.reps AS last_reps
  FROM prep_items p
  LEFT JOIN (
    SELECT item_key, id, verdict, attempted_on, minutes, notes, hit, due_on, reps,
           MAX(printf('%s#%010d', attempted_on, id)) AS latest
    FROM attempts GROUP BY item_key
  ) l ON l.item_key = p.key`;

/* Due first — Express matches in order, so this has to sit above '/:track'. */
prepRouter.get('/due', (_req, res) => {
  const today = todayYmd();
  const rows = db.prepare(`${WITH_LAST}
    WHERE l.due_on IS NOT NULL AND l.due_on <= @today
    ORDER BY l.due_on ASC, p.weight DESC`).all({ today });
  res.json(rows.map(shape));
});

prepRouter.get('/tracks', (_req, res) => {
  const counts = db.prepare(`
    SELECT p.track,
      COUNT(*) AS total,
      SUM(CASE WHEN EXISTS (SELECT 1 FROM attempts a WHERE a.item_key = p.key) THEN 1 ELSE 0 END) AS touched,
      SUM(CASE WHEN EXISTS (SELECT 1 FROM attempts a WHERE a.item_key = p.key AND a.verdict = 'solo') THEN 1 ELSE 0 END) AS solo
    FROM prep_items p GROUP BY p.track`).all();
  const by = Object.fromEntries(counts.map((c) => [c.track, c]));
  res.json(TRACKS.map((t) => ({ ...t, ...(by[t.id] ?? { total: 0, touched: 0, solo: 0 }) })));
});

prepRouter.get('/:track', (req, res) => {
  const { track } = req.params;
  if (!TRACK_IDS.has(track)) return res.status(404).json({ error: 'No such track.' });

  const rows = db.prepare(`${WITH_LAST} WHERE p.track = @track ORDER BY p.tier ASC, p.seq ASC`)
    .all({ track });

  res.json({
    track: TRACKS.find((t) => t.id === track),
    tiers: TIERS[track],
    items: rows.map(shape)
  });
});

prepRouter.post('/:key/attempt', (req, res) => {
  const key = req.params.key;
  const item = db.prepare('SELECT * FROM prep_items WHERE key = ?').get(key);
  if (!item) return res.status(404).json({ error: 'No such item.' });

  const b = req.body ?? {};
  if (!['solo', 'hint', 'edtl', 'stuck'].includes(b.verdict)) {
    return res.status(400).json({ error: 'Pick how it went.' });
  }

  const prev = db.prepare(
    'SELECT reps, interval_days FROM attempts WHERE item_key = ? ORDER BY attempted_on DESC, id DESC LIMIT 1'
  ).get(key);

  const on = b.attempted_on || todayYmd();
  const { reps, interval } = schedule(prev?.interval_days ?? 0, prev?.reps ?? 0, b.verdict);
  const due = b.verdict === 'stuck' ? null : addDays(on, interval);

  const checklistLen = json(item.checklist, []).length;
  const hit = Array.isArray(b.hit)
    ? [...new Set(b.hit.map(Number).filter((n) => Number.isInteger(n) && n >= 0 && n < checklistLen))]
    : [];

  db.prepare(`
    INSERT INTO attempts (item_key, verdict, notes, minutes, hit, attempted_on, reps, interval_days, due_on)
    VALUES (@item_key, @verdict, @notes, @minutes, @hit, @attempted_on, @reps, @interval_days, @due_on)`)
    .run({
      item_key: key,
      verdict: b.verdict,
      notes: (b.notes ?? '').trim() || null,
      minutes: Number.isFinite(Number(b.minutes)) && Number(b.minutes) > 0 ? Math.round(Number(b.minutes)) : null,
      hit: JSON.stringify(hit),
      attempted_on: on,
      reps,
      interval_days: interval,
      due_on: due
    });

  res.status(201).json(shape(db.prepare(`${WITH_LAST} WHERE p.key = @key`).get({ key })));
});

prepRouter.get('/:track/attempts', (req, res) => {
  const { track } = req.params;
  if (!TRACK_IDS.has(track)) return res.status(404).json({ error: 'No such track.' });
  const rows = db.prepare(`
    SELECT a.*, p.title, p.track FROM attempts a
    JOIN prep_items p ON p.key = a.item_key
    WHERE p.track = ?
    ORDER BY a.attempted_on DESC, a.id DESC LIMIT 200`).all(track);
  res.json(rows.map((r) => ({ ...r, hit: json(r.hit, []) })));
});

prepRouter.delete('/attempt/:id', (req, res) => {
  const info = db.prepare('DELETE FROM attempts WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'No such attempt.' });
  res.status(204).end();
});
