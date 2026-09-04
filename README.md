# Grind Log

Interview preparation tracked against a target package, not a problem count.
React + Tailwind on the front, Express + SQLite behind it.

A product-company loop is four things — algorithms, machine coding, system design
and the hiring-manager round — and across the companies in this catalogue that
pay 30 LPA or more, algorithms are **44%** of the weighted decision. This app
tracks all four, weights each company's loop the way that company actually runs
it, and tells you which axis is costing you the most points.

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
    companies.js        34 companies and what they ask
    loops.js            what each loop is made of, and what it pays
    prep.js             90 design / machine-coding / behavioural items
  lib/spaced.js       review scheduling
  lib/readiness.js    the per-axis and per-company scoring
  routes/             solves · catalogue · prep · stories · pipeline · body · builds · stats
src/
  pages/              Today · Plan · Ladder · Prep · Behavioural · Companies
                      Pipeline · Log · Patterns · Body · Builds
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

System design, machine coding and behavioural questions run through the *same*
verdict and spacing machinery — a design question you held unaided comes back in
a month, one you had to read the answer to comes back tomorrow. Each carries a
checklist of the points a strong answer actually reaches, which is the only
honest way to tell watching a video apart from being able to hold a room.

### Readiness

`server/lib/readiness.js` scores four axes and blends them per company using that
company's own round weights from `loops.js`. Credit is verdict-driven —
unaided 1.0, hint 0.6, editorial 0.3, stuck 0.0 — and nothing rounds in your
favour. The behavioural axis is 70% attempts and 30% the size of your STAR bank,
because that round is answered by having six re-aimable stories, not by having
read thirty questions.

The ranking that matters is by **deficit** (`weight × (1 − coverage)`), not by
lowest score: a weak axis worth 10% of a loop matters less than a middling one
worth 35%.

### The catalogue is code

`server/data/*.js` are plain arrays. Edit one, restart, and the change is live —
`seed.js` re-asserts reference data on every boot and refuses to start if a
company or the ladder points at a problem that isn't in the pool. Your own rows
are never touched by seeding.

### Adding prep items or companies

```js
// server/data/prep.js — [slug, title, prompt, weight, minutes, tags, checklist]
['url-shortener', 'Design a URL shortener', 'Design TinyURL...', 3, 40, ['classic'],
 ['Pins scope first', 'Does the number work', ...]]

// server/data/loops.js — every company in companies.js needs an entry here,
// and seed.js refuses to boot if one is missing.
flipkart: { ctc: [26, 50], loop: { dsa: 35, lld: 30, hld: 25, bhv: 10 }, rounds: '...' }
```

Band figures are realistic India total-comp ranges for a 1–3 year SDE hire, not
outlier screenshots. They decide which companies the app treats as clearing your
target, so keep them honest rather than aspirational.

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
