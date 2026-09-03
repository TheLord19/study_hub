import { Router } from 'express';
import { db } from '../db.js';
import { todayYmd } from '../lib/spaced.js';

export const bodyRouter = Router();

/* ---------------------------------------------------------------- runs ---
 * `source` and `external_id` exist so a Garmin import can drop activities in
 * beside hand-entered ones without a schema change. external_id is UNIQUE, so
 * re-running an import updates rather than duplicates.
 */
bodyRouter.get('/runs', (req, res) => {
  const limit = Number(req.query.limit ?? 200);
  res.json(db.prepare('SELECT * FROM runs ORDER BY ran_on DESC, id DESC LIMIT ?').all(limit));
});

bodyRouter.post('/runs', (req, res) => {
  const b = req.body ?? {};
  const distance = Number(b.distance_km);
  const duration = Number(b.duration_min);
  if (!Number.isFinite(distance) || distance <= 0) {
    return res.status(400).json({ error: 'Distance must be a positive number of kilometres.' });
  }
  if (!Number.isFinite(duration) || duration <= 0) {
    return res.status(400).json({ error: 'Duration must be a positive number of minutes.' });
  }

  const info = db
    .prepare(`INSERT INTO runs (ran_on, distance_km, duration_min, avg_hr, perceived, notes, source, external_id)
              VALUES (@ran_on, @distance_km, @duration_min, @avg_hr, @perceived, @notes, @source, @external_id)
              ON CONFLICT(external_id) DO UPDATE SET
                ran_on = excluded.ran_on, distance_km = excluded.distance_km,
                duration_min = excluded.duration_min, avg_hr = excluded.avg_hr`)
    .run({
      ran_on: b.ran_on || todayYmd(),
      distance_km: distance,
      duration_min: duration,
      avg_hr: Number.isFinite(Number(b.avg_hr)) && b.avg_hr !== '' ? Number(b.avg_hr) : null,
      perceived: Number.isFinite(Number(b.perceived)) && b.perceived !== '' ? Number(b.perceived) : null,
      notes: (b.notes ?? '').trim() || null,
      source: b.source || 'manual',
      external_id: b.external_id || null
    });

  res.status(201).json(db.prepare('SELECT * FROM runs WHERE id = ?').get(info.lastInsertRowid));
});

bodyRouter.delete('/runs/:id', (req, res) => {
  const info = db.prepare('DELETE FROM runs WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'No such run.' });
  res.status(204).end();
});

/* ------------------------------------------------------------- weights ---
 * One reading per day by design — measured_on is the primary key, so logging
 * twice in a day corrects the day rather than adding noise.
 */
bodyRouter.get('/weights', (req, res) => {
  const limit = Number(req.query.limit ?? 400);
  res.json(
    db.prepare('SELECT * FROM weights ORDER BY measured_on DESC LIMIT ?').all(limit)
  );
});

bodyRouter.post('/weights', (req, res) => {
  const b = req.body ?? {};
  const kg = Number(b.weight_kg);
  if (!Number.isFinite(kg) || kg <= 0) {
    return res.status(400).json({ error: 'Weight must be a positive number of kilograms.' });
  }

  const measured_on = b.measured_on || todayYmd();
  db.prepare(
    `INSERT INTO weights (measured_on, weight_kg, note, source) VALUES (?, ?, ?, ?)
     ON CONFLICT(measured_on) DO UPDATE SET
       weight_kg = excluded.weight_kg, note = excluded.note`
  ).run(measured_on, kg, (b.note ?? '').trim() || null, b.source || 'manual');

  res.status(201).json(db.prepare('SELECT * FROM weights WHERE measured_on = ?').get(measured_on));
});

bodyRouter.delete('/weights/:date', (req, res) => {
  const info = db.prepare('DELETE FROM weights WHERE measured_on = ?').run(req.params.date);
  if (!info.changes) return res.status(404).json({ error: 'No reading on that date.' });
  res.status(204).end();
});

/* Summary for the Body page: weekly mileage, pace trend, weight change. */
bodyRouter.get('/summary', (_req, res) => {
  const runs = db.prepare('SELECT * FROM runs ORDER BY ran_on ASC').all();
  const weights = db.prepare('SELECT * FROM weights ORDER BY measured_on ASC').all();

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 6);
  const weekKey = weekAgo.toISOString().slice(0, 10);

  const thisWeek = runs.filter((r) => r.ran_on >= weekKey);
  const km = (rows) => rows.reduce((a, r) => a + r.distance_km, 0);
  const totalKm = km(runs);
  const totalMin = runs.reduce((a, r) => a + r.duration_min, 0);

  const first = weights[0] ?? null;
  const last = weights[weights.length - 1] ?? null;

  res.json({
    runCount: runs.length,
    totalKm: Number(totalKm.toFixed(1)),
    weekKm: Number(km(thisWeek).toFixed(1)),
    weekRuns: thisWeek.length,
    avgPace: totalKm > 0 ? Number((totalMin / totalKm).toFixed(2)) : null,
    longestKm: runs.length ? Math.max(...runs.map((r) => r.distance_km)) : 0,
    weightNow: last?.weight_kg ?? null,
    weightChange:
      first && last && first.measured_on !== last.measured_on
        ? Number((last.weight_kg - first.weight_kg).toFixed(1))
        : null,
    runs,
    weights
  });
});
