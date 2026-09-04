import { Router } from 'express';
import { db } from '../db.js';
import { todayYmd, addDays } from '../lib/spaced.js';
import { readiness, pace } from '../lib/readiness.js';
import { getSetting } from '../db.js';

export const statsRouter = Router();

/* A pattern counts as locked once you have three unassisted solves in it.
 * Raw solve count is a vanity number — 300 easies is not progress — so the
 * dashboard leads with this instead. */
const LOCK_THRESHOLD = 3;

function streakFrom(daysWithSolves) {
  const set = new Set(daysWithSolves);
  const today = todayYmd();
  let cursor;
  let risk = false;

  if (set.has(today)) cursor = today;
  else if (set.has(addDays(today, -1))) { cursor = addDays(today, -1); risk = true; }
  else return { days: 0, risk: false };

  let n = 0;
  while (set.has(cursor)) { n += 1; cursor = addDays(cursor, -1); }
  return { days: n, risk };
}

statsRouter.get('/', (_req, res) => {
  const today = todayYmd();
  const weekStart = addDays(today, -6);

  const days = db
    .prepare("SELECT DISTINCT solved_on FROM solves WHERE verdict != 'stuck'")
    .all()
    .map((r) => r.solved_on);

  const counts = db.prepare(`
    SELECT
      COUNT(*) AS total,
      SUM(CASE WHEN solved_on = @today THEN 1 ELSE 0 END) AS today,
      SUM(CASE WHEN solved_on >= @weekStart THEN 1 ELSE 0 END) AS week,
      SUM(CASE WHEN platform = 'lc' THEN 1 ELSE 0 END) AS lc,
      SUM(CASE WHEN platform = 'cf' THEN 1 ELSE 0 END) AS cf
    FROM solves WHERE verdict != 'stuck'`).get({ today, weekStart });

  const due = db.prepare(
    "SELECT COUNT(*) AS n FROM solves WHERE due_on IS NOT NULL AND due_on <= @today AND verdict != 'stuck'"
  ).get({ today }).n;

  const stuck = db.prepare("SELECT COUNT(*) AS n FROM solves WHERE verdict = 'stuck'").get().n;

  /* Prep runs on the same spacing machinery, so its due count sits alongside
   * the solve one — Today should show the whole day's work, not the DSA half. */
  const prepDue = db.prepare(
    'SELECT COUNT(*) AS n FROM attempts a WHERE a.due_on IS NOT NULL AND a.due_on <= @today '
    + 'AND a.id = (SELECT MAX(b.id) FROM attempts b WHERE b.item_key = a.item_key)'
  ).get({ today }).n;

  const prepToday = db.prepare(
    'SELECT COUNT(*) AS n FROM attempts WHERE attempted_on = @today'
  ).get({ today }).n;

  const prepByTrack = db.prepare(`
    SELECT p.track,
      COUNT(*) AS total,
      SUM(CASE WHEN EXISTS (SELECT 1 FROM attempts a WHERE a.item_key = p.key) THEN 1 ELSE 0 END) AS touched
    FROM prep_items p GROUP BY p.track`).all();

  const topics = db.prepare(`
    SELECT st.topic,
      COUNT(*) AS total,
      SUM(CASE WHEN s.verdict = 'solo' THEN 1 ELSE 0 END) AS solo
    FROM solve_topics st JOIN solves s ON s.id = st.solve_id
    WHERE s.verdict != 'stuck'
    GROUP BY st.topic`).all();

  const verdicts = db.prepare(
    'SELECT verdict, COUNT(*) AS n FROM solves GROUP BY verdict'
  ).all();

  const difficulty = db.prepare(`
    SELECT difficulty, COUNT(*) AS n FROM solves
    WHERE platform = 'lc' AND difficulty IS NOT NULL AND verdict != 'stuck'
    GROUP BY difficulty`).all();

  const cfBands = db.prepare(`
    SELECT cf_rating AS rating, COUNT(*) AS n FROM solves
    WHERE platform = 'cf' AND cf_rating IS NOT NULL AND verdict != 'stuck'
    GROUP BY cf_rating ORDER BY cf_rating ASC`).all();

  const heatmap = db.prepare(`
    SELECT solved_on AS date, COUNT(*) AS n FROM solves
    WHERE verdict != 'stuck' AND solved_on >= @from
    GROUP BY solved_on`).all({ from: addDays(today, -181) });

  const ladder = db.prepare(`
    SELECT COUNT(*) AS total,
      SUM(CASE WHEN EXISTS (SELECT 1 FROM solves s WHERE s.problem_key = c.problem_key)
          THEN 1 ELSE 0 END) AS done
    FROM curriculum c`).get();

  res.json({
    today,
    streak: streakFrom(days),
    total: counts.total ?? 0,
    todayCount: counts.today ?? 0,
    weekCount: counts.week ?? 0,
    lc: counts.lc ?? 0,
    cf: counts.cf ?? 0,
    due,
    stuck,
    locked: topics.filter((t) => t.solo >= LOCK_THRESHOLD).length,
    topics,
    verdicts,
    difficulty,
    cfBands,
    heatmap,
    ladder,
    prepDue,
    prepToday,
    prepByTrack
  });
});

/* Readiness against the target, per axis and per company. The one number in
 * the app that is allowed to be discouraging. */
statsRouter.get('/readiness', (_req, res) => {
  const targetCtc = Number(getSetting('targetCtc', 30));
  res.json({
    ...readiness({ targetCtc }),
    pace: pace({ targetDate: getSetting('targetDate', null), targetCtc })
  });
});

/* Every key idea you have written, grouped by topic. The compounding artefact:
 * after a hundred problems this is a reference that did not exist before. */
statsRouter.get('/notebook', (_req, res) => {
  const rows = db.prepare(`
    SELECT s.id, s.title, s.ref, s.url, s.idea, s.verdict, s.solved_on,
      (SELECT json_group_array(topic) FROM solve_topics st WHERE st.solve_id = s.id) AS topics_json
    FROM solves s
    WHERE s.idea IS NOT NULL AND TRIM(s.idea) != ''
    ORDER BY s.solved_on DESC, s.id DESC`).all();

  const byTopic = new Map();
  for (const r of rows) {
    let topics = [];
    try { topics = JSON.parse(r.topics_json ?? '[]').filter(Boolean); } catch { topics = []; }
    if (!topics.length) topics = ['Untagged'];
    const { topics_json, ...entry } = r;
    for (const t of topics) {
      if (!byTopic.has(t)) byTopic.set(t, []);
      byTopic.get(t).push(entry);
    }
  }

  res.json([...byTopic.entries()].map(([topic, entries]) => ({ topic, entries })));
});
