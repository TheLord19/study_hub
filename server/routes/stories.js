import { Router } from 'express';
import { db } from '../db.js';

export const storiesRouter = Router();

/* The STAR bank.
 *
 * The unit of behavioural preparation is the story, not the question. Six
 * well-shaped stories, each tagged with the themes it can serve, will answer
 * thirty questions; thirty separately-memorised answers will answer none of
 * them convincingly. So stories are first-class rows and questions link to
 * them, rather than each question owning a scrap of text.
 */

const THEMES = [
  'ownership', 'conflict', 'failure', 'deadline', 'ambiguity', 'leadership',
  'customer', 'depth', 'learning', 'disagreement', 'simplification', 'scale'
];

const parse = (r) => {
  if (!r) return null;
  let themes = [];
  try { themes = JSON.parse(r.themes ?? '[]'); } catch { themes = []; }
  return { ...r, themes };
};

/* A story is only useful once it has all four STAR parts and a number. This is
 * the honest completeness check the Behavioural page leads with — a bank of
 * six half-written stories is not a bank of six stories. */
function strength(s) {
  const parts = [s.situation, s.task, s.action, s.result];
  const filled = parts.filter((p) => (p ?? '').trim().length >= 20).length;
  const hasMetric = (s.metric ?? '').trim().length > 0;
  return {
    parts: filled,
    hasMetric,
    ready: filled === 4 && hasMetric
  };
}

storiesRouter.get('/', (_req, res) => {
  const rows = db.prepare('SELECT * FROM stories ORDER BY updated_at DESC, id DESC').all().map(parse);
  const links = db.prepare(`
    SELECT sl.story_id, sl.item_key, p.title, p.track
    FROM story_links sl JOIN prep_items p ON p.key = sl.item_key`).all();

  const byStory = new Map();
  for (const l of links) {
    if (!byStory.has(l.story_id)) byStory.set(l.story_id, []);
    byStory.get(l.story_id).push({ key: l.item_key, title: l.title, track: l.track });
  }

  res.json({
    themes: THEMES,
    stories: rows.map((s) => ({ ...s, links: byStory.get(s.id) ?? [], strength: strength(s) }))
  });
});

storiesRouter.post('/', (req, res) => {
  const b = req.body ?? {};
  const title = (b.title ?? '').trim();
  if (!title) return res.status(400).json({ error: 'Give the story a name you will recognise under pressure.' });

  const info = db.prepare(`
    INSERT INTO stories (title, situation, task, action, result, metric, themes)
    VALUES (@title, @situation, @task, @action, @result, @metric, @themes)`).run({
    title,
    situation: (b.situation ?? '').trim() || null,
    task: (b.task ?? '').trim() || null,
    action: (b.action ?? '').trim() || null,
    result: (b.result ?? '').trim() || null,
    metric: (b.metric ?? '').trim() || null,
    themes: JSON.stringify(Array.isArray(b.themes) ? b.themes.filter((t) => THEMES.includes(t)) : [])
  });

  res.status(201).json(parse(db.prepare('SELECT * FROM stories WHERE id = ?').get(info.lastInsertRowid)));
});

storiesRouter.patch('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM stories WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'No such story.' });

  const b = req.body ?? {};
  const sets = [];
  const args = { id: row.id };
  for (const f of ['title', 'situation', 'task', 'action', 'result', 'metric']) {
    if (f in b) { sets.push(`${f} = @${f}`); args[f] = (b[f] ?? '').trim() || null; }
  }
  if ('themes' in b) {
    sets.push('themes = @themes');
    args.themes = JSON.stringify(Array.isArray(b.themes) ? b.themes.filter((t) => THEMES.includes(t)) : []);
  }
  if (sets.length) {
    sets.push("updated_at = datetime('now')");
    db.prepare(`UPDATE stories SET ${sets.join(', ')} WHERE id = @id`).run(args);
  }

  res.json(parse(db.prepare('SELECT * FROM stories WHERE id = ?').get(row.id)));
});

storiesRouter.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM stories WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'No such story.' });
  res.status(204).end();
});

/* Aim a story at a question, or unaim it. */
storiesRouter.post('/:id/link', (req, res) => {
  const story = db.prepare('SELECT id FROM stories WHERE id = ?').get(req.params.id);
  if (!story) return res.status(404).json({ error: 'No such story.' });

  const key = (req.body ?? {}).item_key;
  const item = db.prepare("SELECT key FROM prep_items WHERE key = ? AND track = 'bhv'").get(key);
  if (!item) return res.status(400).json({ error: 'No such behavioural question.' });

  if ((req.body ?? {}).linked === false) {
    db.prepare('DELETE FROM story_links WHERE story_id = ? AND item_key = ?').run(story.id, key);
  } else {
    db.prepare('INSERT OR IGNORE INTO story_links (story_id, item_key) VALUES (?, ?)').run(story.id, key);
  }

  res.json({ ok: true });
});

/* Which behavioural questions have no story pointing at them yet. This is the
 * list that tells you what to write next, and it is the whole point of the
 * linking table. */
storiesRouter.get('/gaps', (_req, res) => {
  const rows = db.prepare(`
    SELECT p.key, p.title, p.prompt, p.weight, p.tier
    FROM prep_items p
    WHERE p.track = 'bhv'
      AND NOT EXISTS (SELECT 1 FROM story_links sl WHERE sl.item_key = p.key)
    ORDER BY p.weight DESC, p.tier ASC, p.seq ASC`).all();
  res.json(rows);
});
