import { Router } from 'express';
import { db } from '../db.js';
import { TIERS } from '../data/curriculum.js';
import { BUCKETS } from '../data/companies.js';

export const catalogueRouter = Router();

const parseTopics = (row) => {
  try {
    return { ...row, topics: JSON.parse(row.topics ?? '[]') };
  } catch {
    return { ...row, topics: [] };
  }
};

/* The ladder, with each problem's verdict attached if it has been attempted.
 * The LEFT JOIN is what makes "what have I not done yet" a single query. */
catalogueRouter.get('/curriculum', (_req, res) => {
  const rows = db
    .prepare(`
      SELECT p.*, c.tier, c.seq, a.verdict, a.solved_on
      FROM curriculum c
      JOIN problems p ON p.key = c.problem_key
      LEFT JOIN (
        SELECT problem_key, verdict, solved_on, MAX(solved_on) AS latest
        FROM solves WHERE problem_key IS NOT NULL
        GROUP BY problem_key
      ) a ON a.problem_key = p.key
      ORDER BY c.tier ASC, c.seq ASC`)
    .all()
    .map(parseTopics);

  res.json({ tiers: TIERS, problems: rows });
});

/* Today's plate: next unattempted problems in teaching order, balanced across
 * platforms because they train different things. */
catalogueRouter.get('/next-up', (req, res) => {
  const nLc = Number(req.query.lc ?? 3);
  const nCf = Number(req.query.cf ?? 2);

  const pick = db.prepare(`
    SELECT p.*, c.tier, c.seq
    FROM curriculum c
    JOIN problems p ON p.key = c.problem_key
    WHERE p.platform = ?
      AND NOT EXISTS (SELECT 1 FROM solves s WHERE s.problem_key = p.key)
    ORDER BY c.tier ASC, c.seq ASC
    LIMIT ?`);

  const done = db.prepare(`
    SELECT COUNT(*) AS n FROM curriculum c
    WHERE EXISTS (SELECT 1 FROM solves s WHERE s.problem_key = c.problem_key)`).get().n;
  const total = db.prepare('SELECT COUNT(*) AS n FROM curriculum').get().n;

  res.json({
    done,
    total,
    problems: [...pick.all('lc', nLc), ...pick.all('cf', nCf)].map(parseTopics)
  });
});

catalogueRouter.get('/companies', (_req, res) => {
  const rows = db
    .prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM company_questions q WHERE q.company_id = c.id) AS total,
        (SELECT COUNT(*) FROM company_questions q
           WHERE q.company_id = c.id
             AND EXISTS (SELECT 1 FROM solves s WHERE s.problem_key = q.problem_key
                          AND s.verdict != 'stuck')) AS done,
        (SELECT COUNT(*) FROM company_questions q
           WHERE q.company_id = c.id
             AND EXISTS (SELECT 1 FROM solves s WHERE s.problem_key = q.problem_key
                          AND s.verdict = 'solo')) AS solo,
        EXISTS (SELECT 1 FROM targets t WHERE t.company_id = c.id) AS targeted
      FROM companies c
      ORDER BY c.name ASC`)
    .all();

  res.json({ buckets: BUCKETS, companies: rows });
});

catalogueRouter.get('/companies/:slug', (req, res) => {
  const company = db.prepare('SELECT * FROM companies WHERE slug = ?').get(req.params.slug);
  if (!company) return res.status(404).json({ error: 'No such company.' });

  const questions = db
    .prepare(`
      SELECT p.*, q.frequency, a.verdict, a.solved_on
      FROM company_questions q
      JOIN problems p ON p.key = q.problem_key
      LEFT JOIN (
        SELECT problem_key, verdict, solved_on, MAX(solved_on) AS latest
        FROM solves WHERE problem_key IS NOT NULL
        GROUP BY problem_key
      ) a ON a.problem_key = p.key
      WHERE q.company_id = ?
      ORDER BY q.frequency DESC, p.difficulty ASC, p.title ASC`)
    .all(company.id)
    .map(parseTopics);

  const targeted = !!db.prepare('SELECT 1 FROM targets WHERE company_id = ?').get(company.id);
  res.json({ ...company, targeted, questions });
});

catalogueRouter.post('/companies/:slug/target', (req, res) => {
  const company = db.prepare('SELECT id FROM companies WHERE slug = ?').get(req.params.slug);
  if (!company) return res.status(404).json({ error: 'No such company.' });

  if (req.body?.targeted === false) {
    db.prepare('DELETE FROM targets WHERE company_id = ?').run(company.id);
    return res.json({ targeted: false });
  }
  db.prepare('INSERT OR IGNORE INTO targets (company_id) VALUES (?)').run(company.id);
  res.json({ targeted: true });
});

catalogueRouter.get('/topics', (_req, res) => {
  const rows = db
    .prepare(`
      SELECT st.topic,
        COUNT(*) AS total,
        SUM(CASE WHEN s.verdict = 'solo' THEN 1 ELSE 0 END) AS solo
      FROM solve_topics st
      JOIN solves s ON s.id = st.solve_id
      WHERE s.verdict != 'stuck'
      GROUP BY st.topic`)
    .all();
  res.json(rows);
});
