import { Router } from 'express';
import { db } from '../db.js';
import { todayYmd } from '../lib/spaced.js';

export const pipelineRouter = Router();

/* The application pipeline.
 *
 * Preparation that never becomes an application is a hobby. This is the part
 * that converts, and it is deliberately blunt about the arithmetic: offers come
 * out of onsites, onsites come out of applications, and the ratio between them
 * is worse than anyone expects. Tracking it is how you find out you need to be
 * applying to fifteen companies rather than three.
 */

export const STAGES = [
  { id: 'wishlist', label: 'Wishlist', live: false },
  { id: 'applied',  label: 'Applied',  live: true },
  { id: 'oa',       label: 'OA',       live: true },
  { id: 'phone',    label: 'Phone screen', live: true },
  { id: 'onsite',   label: 'Onsite',   live: true },
  { id: 'hm',       label: 'Hiring manager', live: true },
  { id: 'offer',    label: 'Offer',    live: false },
  { id: 'rejected', label: 'Rejected', live: false },
  { id: 'ghosted',  label: 'Ghosted',  live: false }
];
const STAGE_IDS = new Set(STAGES.map((s) => s.id));

pipelineRouter.get('/', (_req, res) => {
  const rows = db.prepare(`
    SELECT a.*, c.slug AS company_slug, c.bucket, c.ctc_low, c.ctc_high
    FROM applications a
    LEFT JOIN companies c ON c.id = a.company_id
    ORDER BY
      CASE a.stage WHEN 'offer' THEN 0 WHEN 'hm' THEN 1 WHEN 'onsite' THEN 2
                   WHEN 'phone' THEN 3 WHEN 'oa' THEN 4 WHEN 'applied' THEN 5
                   WHEN 'wishlist' THEN 6 ELSE 7 END,
      COALESCE(a.next_on, '9999') ASC, a.updated_at DESC`).all();

  const events = db.prepare(
    'SELECT * FROM app_events ORDER BY happened_on ASC, id ASC'
  ).all();
  const byApp = new Map();
  for (const e of events) {
    if (!byApp.has(e.application_id)) byApp.set(e.application_id, []);
    byApp.get(e.application_id).push(e);
  }

  const counts = Object.fromEntries(STAGES.map((s) => [s.id, 0]));
  for (const r of rows) counts[r.stage] = (counts[r.stage] ?? 0) + 1;

  /* Everything that has ever reached a stage, not just what sits there now —
   * a rejection after an onsite still proves you can get to onsites. */
  const reached = {};
  for (const s of STAGES) {
    reached[s.id] = db.prepare(
      'SELECT COUNT(DISTINCT application_id) AS n FROM app_events WHERE stage = ?'
    ).get(s.id).n;
  }

  res.json({
    stages: STAGES,
    counts,
    reached,
    applications: rows.map((r) => ({ ...r, events: byApp.get(r.id) ?? [] }))
  });
});

pipelineRouter.post('/', (req, res) => {
  const b = req.body ?? {};
  let companyId = null;
  let name = (b.company_name ?? '').trim();

  if (b.company_slug) {
    const c = db.prepare('SELECT id, name FROM companies WHERE slug = ?').get(b.company_slug);
    if (c) { companyId = c.id; name = name || c.name; }
  }
  if (!name) return res.status(400).json({ error: 'Which company?' });

  const stage = STAGE_IDS.has(b.stage) ? b.stage : 'wishlist';

  const info = db.prepare(`
    INSERT INTO applications (company_id, company_name, role, ctc_lpa, stage, source, applied_on, next_on, notes)
    VALUES (@company_id, @company_name, @role, @ctc_lpa, @stage, @source, @applied_on, @next_on, @notes)`)
    .run({
      company_id: companyId,
      company_name: name,
      role: (b.role ?? '').trim() || null,
      ctc_lpa: Number.isFinite(Number(b.ctc_lpa)) && Number(b.ctc_lpa) > 0 ? Number(b.ctc_lpa) : null,
      stage,
      source: (b.source ?? '').trim() || null,
      applied_on: b.applied_on || (stage === 'wishlist' ? null : todayYmd()),
      next_on: b.next_on || null,
      notes: (b.notes ?? '').trim() || null
    });

  if (stage !== 'wishlist') {
    db.prepare('INSERT INTO app_events (application_id, stage, happened_on) VALUES (?, ?, ?)')
      .run(info.lastInsertRowid, stage, todayYmd());
  }

  res.status(201).json(db.prepare('SELECT * FROM applications WHERE id = ?').get(info.lastInsertRowid));
});

pipelineRouter.patch('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM applications WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'No such application.' });

  const b = req.body ?? {};
  if ('stage' in b && !STAGE_IDS.has(b.stage)) {
    return res.status(400).json({ error: 'Not a stage.' });
  }

  const sets = [];
  const args = { id: row.id };
  for (const f of ['company_name', 'role', 'source', 'notes', 'applied_on', 'next_on', 'stage']) {
    if (f in b) { sets.push(`${f} = @${f}`); args[f] = (b[f] ?? '') === '' ? null : b[f]; }
  }
  if ('ctc_lpa' in b) {
    sets.push('ctc_lpa = @ctc_lpa');
    args.ctc_lpa = Number.isFinite(Number(b.ctc_lpa)) && Number(b.ctc_lpa) > 0 ? Number(b.ctc_lpa) : null;
  }

  if (sets.length) {
    sets.push("updated_at = datetime('now')");
    db.prepare(`UPDATE applications SET ${sets.join(', ')} WHERE id = @id`).run(args);
  }

  /* A stage change is a fact about a date, so it gets recorded rather than
   * overwritten — the funnel below is built entirely out of these. */
  if ('stage' in b && b.stage !== row.stage) {
    db.prepare('INSERT INTO app_events (application_id, stage, happened_on, note) VALUES (?, ?, ?, ?)')
      .run(row.id, b.stage, b.happened_on || todayYmd(), (b.event_note ?? '').trim() || null);
    if (b.stage !== 'wishlist' && !row.applied_on) {
      db.prepare('UPDATE applications SET applied_on = ? WHERE id = ?').run(todayYmd(), row.id);
    }
  }

  res.json(db.prepare('SELECT * FROM applications WHERE id = ?').get(row.id));
});

pipelineRouter.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM applications WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'No such application.' });
  res.status(204).end();
});
