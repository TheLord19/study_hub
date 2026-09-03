import express from 'express';
import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';

import { db, dbPath, getSetting, setSetting } from './db.js';
import { solvesRouter } from './routes/solves.js';
import { catalogueRouter } from './routes/catalogue.js';
import { bodyRouter } from './routes/body.js';
import { buildsRouter } from './routes/builds.js';
import { statsRouter } from './routes/stats.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(here, '..');
const PORT = Number(process.env.PORT ?? 5174);

const app = express();
app.use(express.json({ limit: '2mb' }));

app.use('/api/solves', solvesRouter);
app.use('/api', catalogueRouter);
app.use('/api/body', bodyRouter);
app.use('/api/builds', buildsRouter);
app.use('/api/stats', statsRouter);

app.get('/api/settings', (_req, res) => {
  res.json({
    dailyGoal: getSetting('dailyGoal', 2),
    theme: getSetting('theme', 'dark')
  });
});

app.put('/api/settings', (req, res) => {
  const { dailyGoal, theme } = req.body ?? {};
  if (Number.isFinite(Number(dailyGoal))) {
    setSetting('dailyGoal', Math.min(Math.max(Number(dailyGoal), 1), 20));
  }
  if (['dark', 'light', 'system'].includes(theme)) setSetting('theme', theme);
  res.json({ dailyGoal: getSetting('dailyGoal', 2), theme: getSetting('theme', 'dark') });
});

/* Whole-database export, so the data is portable and yours. */
app.get('/api/export', (_req, res) => {
  const table = (name) => db.prepare(`SELECT * FROM ${name}`).all();
  res.setHeader('Content-Disposition', `attachment; filename="grind-log-${new Date().toISOString().slice(0, 10)}.json"`);
  res.json({
    v: 1,
    exportedAt: new Date().toISOString(),
    solves: table('solves'),
    solve_topics: table('solve_topics'),
    runs: table('runs'),
    weights: table('weights'),
    builds: table('builds'),
    targets: table('targets'),
    settings: table('settings')
  });
});

/* Once built, the API also serves the client. In dev, Vite serves it on 5173
 * and proxies /api here. */
const dist = path.join(root, 'dist');
if (fs.existsSync(dist)) {
  app.use(express.static(dist));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

/* Last, so it catches everything above it. */
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: err.message ?? 'Something broke on the server.' });
});

app.listen(PORT, () => {
  const problems = db.prepare('SELECT COUNT(*) AS n FROM problems').get().n;
  const companies = db.prepare('SELECT COUNT(*) AS n FROM companies').get().n;
  const ladder = db.prepare('SELECT COUNT(*) AS n FROM curriculum').get().n;
  console.log(`grind-log api  →  http://localhost:${PORT}`);
  console.log(`db             →  ${dbPath}`);
  console.log(`catalogue      →  ${problems} problems · ${ladder} on the ladder · ${companies} companies`);
});
