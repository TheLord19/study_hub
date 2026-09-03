# Grind Log

DSA practice ledger, company interview prep, and body log. React + Tailwind on the
front, Express + SQLite behind it.

## Run it

```bash
npm install     # once
npm run dev
```

- app → http://localhost:5173
- api → http://localhost:5174

`npm run dev` starts both. Vite serves the client and proxies `/api` to the server.

Other scripts:

| command | what it does |
| --- | --- |
| `npm run build` | builds the client into `dist/` |
| `npm start` | serves the built client and the API together on 5174 |
| `npm run db:reset` | deletes the database — the next start rebuilds it |

## How it's put together

```
server/
  schema.sql          tables
  db.js               connection, opens + migrates + seeds on boot
  seed.js             re-asserts reference data every boot
  data/               the catalogue — edit these, restart, done
    problems.js         211 problems, the master pool
    curriculum.js       96 of them ordered into 5 tiers
    companies.js        24 companies and what they ask
  lib/spaced.js       review scheduling
  routes/             solves · catalogue · body · builds · stats
src/
  pages/              Today · Ladder · Companies · Log · Patterns · Body · Builds
  components/         shell, quick log, rows, charts, heatmap, primitives
  lib/                api client, date maths, constants
data/grind.db         your data (gitignored)
```

### The idea it's built around

A solve is recorded as a **verdict**, not a checkmark: *solved it / used a hint /
read the editorial / couldn't get it*. That single field drives everything —
the review schedule, the "patterns locked" count, and the stuck list. Solved-unaided
pushes the next review out ×2.5; a hint ×1.5; the editorial resets it to tomorrow.

The headline number is **patterns locked** (three unassisted solves in a topic),
not total solved, because 300 easies is not progress.

### The catalogue is code

`server/data/*.js` are plain arrays. Edit one, restart, and the change is live —
`seed.js` re-asserts reference data on every boot and refuses to start if a
company or the ladder points at a problem that isn't in the pool. Your own rows
are never touched by seeding.

### Adding problems

```js
// server/data/problems.js
['some-leetcode-slug', 'Title', 'med', ['Topic A', 'Topic B']]
[1352, 'A', 'CF problem title', 800, ['Greedy']]
```

## The Garmin seam

`runs` already carries `source` and a `UNIQUE external_id`. An importer writes:

```js
POST /api/body/runs
{ ran_on, distance_km, duration_min, avg_hr,
  source: 'garmin', external_id: '<garmin activity id>' }
```

`external_id` makes imports idempotent — re-running updates rather than duplicating,
and hand-entered runs keep `source: 'manual'` so the two never collide. Nothing in
the schema or UI needs to change to switch it on.

## Moving to Postgres

The SQL is deliberately plain. When SQLite stops being enough: swap `better-sqlite3`
for `pg`, change `AUTOINCREMENT` to `GENERATED ALWAYS AS IDENTITY`, `datetime('now')`
to `now()`, and `json_group_array` to `array_agg`. The queries and schema shape
carry over.
