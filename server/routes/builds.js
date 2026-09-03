import { Router } from 'express';
import { db } from '../db.js';
import { todayYmd } from '../lib/spaced.js';

export const buildsRouter = Router();

const parse = (row) => {
  if (!row) return null;
  try {
    return { ...row, tags: JSON.parse(row.tags ?? '[]') };
  } catch {
    return { ...row, tags: [] };
  }
};

buildsRouter.get('/', (_req, res) => {
  res.json(
    db.prepare('SELECT * FROM builds ORDER BY started_on DESC, id DESC').all().map(parse)
  );
});

buildsRouter.post('/', (req, res) => {
  const b = req.body ?? {};
  const name = (b.name ?? '').trim();
  if (!name) return res.status(400).json({ error: 'Give the project a name.' });

  const info = db
    .prepare(`INSERT INTO builds (name, blurb, url, repo, status, tags, started_on)
              VALUES (@name, @blurb, @url, @repo, @status, @tags, @started_on)`)
    .run({
      name,
      blurb: (b.blurb ?? '').trim() || null,
      url: (b.url ?? '').trim() || null,
      repo: (b.repo ?? '').trim() || null,
      status: ['idea', 'building', 'shipped', 'shelved'].includes(b.status) ? b.status : 'building',
      tags: JSON.stringify(Array.isArray(b.tags) ? b.tags : []),
      started_on: b.started_on || todayYmd()
    });

  res.status(201).json(parse(db.prepare('SELECT * FROM builds WHERE id = ?').get(info.lastInsertRowid)));
});

buildsRouter.patch('/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM builds WHERE id = ?').get(req.params.id);
  if (!row) return res.status(404).json({ error: 'No such project.' });

  const allowed = ['name', 'blurb', 'url', 'repo', 'status'];
  const sets = [];
  const args = { id: row.id };
  for (const f of allowed) {
    if (f in (req.body ?? {})) { sets.push(`${f} = @${f}`); args[f] = req.body[f]; }
  }
  if (sets.length) db.prepare(`UPDATE builds SET ${sets.join(', ')} WHERE id = @id`).run(args);

  res.json(parse(db.prepare('SELECT * FROM builds WHERE id = ?').get(row.id)));
});

buildsRouter.delete('/:id', (req, res) => {
  const info = db.prepare('DELETE FROM builds WHERE id = ?').run(req.params.id);
  if (!info.changes) return res.status(404).json({ error: 'No such project.' });
  res.status(204).end();
});
