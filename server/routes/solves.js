import { Router } from 'express';
import { db } from '../db.js';
import { schedule, addDays, todayYmd, problemKeyFromUrl } from '../lib/spaced.js';

export const solvesRouter = Router();

const SELECT_SOLVE = `
  SELECT s.*, (
    SELECT json_group_array(topic) FROM solve_topics st WHERE st.solve_id = s.id
  ) AS topics_json
  FROM solves s`;

function hydrate(row) {
  if (!row) return null;
  const { topics_json, ...rest } = row;
  let topics = [];
  try {
    topics = JSON.parse(topics_json ?? '[]').filter(Boolean);
  } catch {
    topics = [];
  }
  return { ...rest, topics };
}

const setTopics = db.transaction((solveId, topics) => {
  db.prepare('DELETE FROM solve_topics WHERE solve_id = ?').run(solveId);
  const ins = db.prepare('INSERT OR IGNORE INTO solve_topics (solve_id, topic) VALUES (?, ?)');
  for (const t of topics) if (t && String(t).trim()) ins.run(solveId, String(t).trim());
});

/* Fill in whatever the client did not send from the catalogue. Lets the UI
 * post nothing but a URL and a verdict and still get a complete row. */
function enrich(body) {
  const url = (body.url ?? '').trim();
  const key = body.problem_key ?? problemKeyFromUrl(url);
  const known = key
    ? db.prepare('SELECT * FROM problems WHERE key = ?').get(key)
    : null;

  let topics = Array.isArray(body.topics) ? body.topics : [];
  if (!topics.length && known) {
    try {
      topics = JSON.parse(known.topics);
    } catch {
      topics = [];
    }
  }

  return {
    problem_key: key ?? null,
    title: (body.title ?? '').trim() || known?.title || url || 'Untitled',
    url: url || known?.url || null,
    platform: body.platform || known?.platform || (key?.startsWith('cf:') ? 'cf' : key ? 'lc' : 'other'),
    ref: body.ref || (key?.startsWith('cf:') ? `CF ${key.slice(3)}` : null),
    difficulty: body.difficulty || known?.difficulty || null,
    cf_rating: body.cf_rating ?? known?.cf_rating ?? null,
    verdict: body.verdict || 'solo',
    idea: (body.idea ?? '').trim() || null,
    minutes: Number.isFinite(body.minutes) ? body.minutes : null,
    solved_on: body.solved_on || todayYmd(),
    topics
  };
}

solvesRouter.get('/', (req, res) => {
  const { q, platform, verdict, topic, limit } = req.query;
  const where = [];
  const args = {};

  if (platform) { where.push('s.platform = @platform'); args.platform = platform; }
  if (verdict) { where.push('s.verdict = @verdict'); args.verdict = verdict; }
  if (topic) {
    where.push('EXISTS (SELECT 1 FROM solve_topics st WHERE st.solve_id = s.id AND st.topic = @topic)');
    args.topic = topic;
  }
  if (q) {
    where.push('(s.title LIKE @q OR IFNULL(s.idea, \'\') LIKE @q OR IFNULL(s.ref, \'\') LIKE @q)');
    args.q = `%${q}%`;
  }

  const sql = `${SELECT_SOLVE}
    ${where.length ? `WHERE ${where.join(' AND ')}` : ''}
    ORDER BY s.solved_on DESC, s.id DESC
    ${limit ? 'LIMIT @limit' : ''}`;
  if (limit) args.limit = Number(limit);

  res.json(db.prepare(sql).all(args).map(hydrate));
});

solvesRouter.get('/due', (_req, res) => {
  const rows = db
    .prepare(`${SELECT_SOLVE}
      WHERE s.due_on IS NOT NULL AND s.due_on <= date('now','localtime') AND s.verdict != 'stuck'
      ORDER BY s.due_on ASC, s.id ASC`)
    .all();
  res.json(rows.map(hydrate));
});

solvesRouter.get('/stuck', (_req, res) => {
  const rows = db
    .prepare(`${SELECT_SOLVE} WHERE s.verdict = 'stuck' ORDER BY s.solved_on DESC, s.id DESC`)
    .all();
  res.json(rows.map(hydrate));
});

solvesRouter.post('/', (req, res) => {
  const body = Array.isArray(req.body) ? null : req.body;
  if (!body) return res.status(400).json({ error: 'Expected a single solve object.' });

  const s = enrich(body);
  const { reps, interval } = schedule(0, 0, s.verdict);
  const due = s.verdict === 'stuck' ? null : addDays(s.solved_on, interval);

  const info = db
    .prepare(`INSERT INTO solves
      (problem_key, title, url, platform, ref, difficulty, cf_rating, verdict, idea,
       minutes, solved_on, reps, interval_days, due_on)
      VALUES (@problem_key, @title, @url, @platform, @ref, @difficulty, @cf_rating,
              @verdict, @idea, @minutes, @solved_on, @reps, @interval, @due)`)
    .run({ ...s, topics: undefined, reps, interval, due });

  setTopics(info.lastInsertRowid, s.topics);
  res.status(201).json(hydrate(db.prepare(`${SELECT_SOLVE} WHERE s.id = ?`).get(info.lastInsertRowid)));
});

/* Bulk backfill. Takes a list of URLs and one verdict for all of them;
 * anything already logged is skipped rather than duplicated. */
solvesRouter.post('/bulk', (req, res) => {
  const { urls = [], verdict = 'solo', solved_on } = req.body ?? {};
  if (!Array.isArray(urls) || !urls.length) {
    return res.status(400).json({ error: 'Send a non-empty urls array.' });
  }

  const date = solved_on || todayYmd();
  const { reps, interval } = schedule(0, 0, verdict);
  const due = verdict === 'stuck' ? null : addDays(date, interval);
  const existing = new Set(
    db.prepare('SELECT problem_key FROM solves WHERE problem_key IS NOT NULL')
      .all().map((r) => r.problem_key)
  );

  let added = 0;
  const skipped = [];

  db.transaction(() => {
    for (const raw of urls) {
      const url = String(raw).trim();
      if (!url) continue;
      const key = problemKeyFromUrl(url);
      if (key && existing.has(key)) { skipped.push(url); continue; }
      if (!key && !/^https?:\/\//i.test(url)) { skipped.push(url); continue; }

      const s = enrich({ url, verdict, solved_on: date });
      const info = db
        .prepare(`INSERT INTO solves
          (problem_key, title, url, platform, ref, difficulty, cf_rating, verdict, idea,
           minutes, solved_on, reps, interval_days, due_on)
          VALUES (@problem_key, @title, @url, @platform, @ref, @difficulty, @cf_rating,
                  @verdict, @idea, @minutes, @solved_on, @reps, @interval, @due)`)
        .run({ ...s, topics: undefined, reps, interval, due });
      setTopics(info.lastInsertRowid, s.topics);
      if (key) existing.add(key);
      added += 1;
    }
  })();

  res.json({ added, skipped: skipped.length });
});

/* Re-rate a problem you have come back to. Reschedules from the row's own
 * history rather than starting over. */
solvesRouter.post('/:id/review', (req, res) => {
  const row = db.prepare('SELECT * FROM solves WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'No such solve.' });

  const verdict = req.body?.verdict ?? 'solo';
  const { reps, interval } = schedule(row.interval_days, row.reps, verdict);
  const today = todayYmd();
  const due = verdict === 'stuck' ? null : addDays(today, interval);

  db.prepare(
    `UPDATE solves SET verdict = ?, reps = ?, interval_days = ?, due_on = ?,
       solved_on = ?, updated_at = datetime('now') WHERE id = ?`
  ).run(verdict, reps, interval, due, today, row.id);

  res.json(hydrate(db.prepare(`${SELECT_SOLVE} WHERE s.id = ?`).get(row.id)));
});

solvesRouter.patch('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM solves WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'No such solve.' });

  const allowed = ['title', 'url', 'difficulty', 'cf_rating', 'idea', 'minutes', 'solved_on'];
  const sets = [];
  const args = { id: row.id };
  for (const f of allowed) {
    if (f in (req.body ?? {})) { sets.push(`${f} = @${f}`); args[f] = req.body[f]; }
  }
  if (sets.length) {
    db.prepare(`UPDATE solves SET ${sets.join(', ')}, updated_at = datetime('now') WHERE id = @id`).run(args);
  }
  if (Array.isArray(req.body?.topics)) setTopics(row.id, req.body.topics);

  res.json(hydrate(db.prepare(`${SELECT_SOLVE} WHERE s.id = ?`).get(row.id)));
});

solvesRouter.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM solves WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'No such solve.' });
  res.status(204).end();
});
