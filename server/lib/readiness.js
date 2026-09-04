import { db } from '../db.js';
import { todayYmd } from './spaced.js';

/* How ready you are, per axis and per company.
 *
 * The premise: "am I ready" is unanswerable, but "how much of what Flipkart
 * asks have I covered, weighted by how much of their loop each axis is worth"
 * is arithmetic. Doing that arithmetic is the only way to notice that four
 * months of LeetCode has moved a number that is 35% of the decision.
 *
 * Credit is verdict-driven, exactly like the spacing:
 *   solo 1.0 — you can do this cold
 *   hint 0.6 — you can do this with a nudge, which is not the same thing
 *   edtl 0.3 — you have seen the answer, which is worth something and not much
 *   stuck 0.0 — you have not covered it, and logging it does not change that
 *
 * Nothing here rounds in your favour. A dashboard that flatters you is worse
 * than no dashboard.
 */
const CREDIT = { solo: 1, hint: 0.6, edtl: 0.3, stuck: 0 };

export const AXES = ['dsa', 'lld', 'hld', 'bhv'];

const clamp01 = (n) => Math.max(0, Math.min(1, n));

/* Best credit ever earned per problem key, and per prep item. One pass each,
 * kept as maps because every company below re-reads them. */
function creditMaps() {
  const problems = new Map();
  for (const r of db.prepare(
    "SELECT problem_key AS k, verdict FROM solves WHERE problem_key IS NOT NULL"
  ).all()) {
    const c = CREDIT[r.verdict] ?? 0;
    if (c > (problems.get(r.k) ?? 0)) problems.set(r.k, c);
  }

  const items = new Map();
  for (const r of db.prepare('SELECT item_key AS k, verdict FROM attempts').all()) {
    const c = CREDIT[r.verdict] ?? 0;
    if (c > (items.get(r.k) ?? 0)) items.set(r.k, c);
  }

  return { problems, items };
}

/* Weighted coverage of a set of [key, weight] pairs. */
function coverage(pairs, credits) {
  let got = 0;
  let max = 0;
  for (const [key, w] of pairs) {
    max += w;
    got += w * (credits.get(key) ?? 0);
  }
  return max > 0 ? clamp01(got / max) : 0;
}

/* Track coverage weights every item by how often it is actually asked, so
 * clearing tier 0 primitives moves the number more than one exotic design. */
function trackCoverage(track, credits) {
  const rows = db.prepare('SELECT key, weight FROM prep_items WHERE track = ?').all(track);
  return coverage(rows.map((r) => [r.key, r.weight]), credits);
}

/* The behavioural axis is not answered by attempting questions — it is
 * answered by owning a bank of stories you can re-aim. Six is the number that
 * covers the usual spread of themes, so the bank counts for a third of it. */
function behaviouralCoverage(credits) {
  const attempted = trackCoverage('bhv', credits);
  const stories = db.prepare('SELECT COUNT(*) AS n FROM stories').get().n;
  const bank = clamp01(stories / 6);
  return clamp01(attempted * 0.7 + bank * 0.3);
}

/* DSA coverage against the questions the companies that clear your target
 * actually ask — weighted by how many of them ask it. This is a sharper
 * measure than "problems solved", which counts a hundred easies as progress. */
function dsaCoverage(credits, targetCtc) {
  const rows = db.prepare(`
    SELECT cq.problem_key AS k, SUM(cq.frequency) AS w
    FROM company_questions cq
    JOIN companies c ON c.id = cq.company_id
    WHERE c.ctc_high >= @targetCtc
    GROUP BY cq.problem_key`).all({ targetCtc });

  /* No company in the catalogue clears the target — fall back to the teaching
   * ladder rather than reporting a meaningless 0. */
  if (!rows.length) {
    const ladder = db.prepare('SELECT problem_key AS k FROM curriculum').all();
    return coverage(ladder.map((r) => [r.k, 1]), credits);
  }
  return coverage(rows.map((r) => [r.k, r.w]), credits);
}

function parseLoop(raw) {
  let loop = {};
  try { loop = JSON.parse(raw ?? '{}'); } catch { loop = {}; }
  const out = {};
  let sum = 0;
  for (const a of AXES) { out[a] = Number(loop[a]) || 0; sum += out[a]; }
  /* A company with no weights recorded gets an even split rather than a zero
   * score, which would silently read as "you are not ready" for no reason. */
  if (sum === 0) for (const a of AXES) out[a] = 25;
  return { weights: out, rounds: loop.rounds ?? null };
}

/* ---------------------------------------------------------------- public -- */

export function readiness({ targetCtc = 30 } = {}) {
  const credits = creditMaps();

  const axis = {
    dsa: dsaCoverage(credits.problems, targetCtc),
    lld: trackCoverage('lld', credits.items),
    hld: trackCoverage('hld', credits.items),
    bhv: behaviouralCoverage(credits.items)
  };

  const companies = db.prepare(`
    SELECT id, slug, name, bucket, ctc_low, ctc_high, loop,
           EXISTS (SELECT 1 FROM targets t WHERE t.company_id = companies.id) AS targeted
    FROM companies`).all();

  const scored = companies.map((c) => {
    const { weights, rounds } = parseLoop(c.loop);

    /* Per-company DSA is measured against that company's own set, not the
     * global one — being 70% ready for Google says nothing about Swiggy. */
    const own = db.prepare(
      'SELECT problem_key AS k, frequency AS w FROM company_questions WHERE company_id = ?'
    ).all(c.id);
    const companyAxis = {
      ...axis,
      dsa: own.length ? coverage(own.map((r) => [r.k, r.w]), credits.problems) : axis.dsa
    };

    let score = 0;
    const contribution = {};
    const deficit = {};
    for (const a of AXES) {
      const w = weights[a] / 100;
      contribution[a] = w * companyAxis[a];
      deficit[a] = w * (1 - companyAxis[a]);
      score += contribution[a];
    }

    return {
      slug: c.slug,
      name: c.name,
      bucket: c.bucket,
      ctc: [c.ctc_low, c.ctc_high],
      clearsTarget: (c.ctc_high ?? 0) >= targetCtc,
      targeted: !!c.targeted,
      weights,
      rounds,
      axis: companyAxis,
      score: clamp01(score),
      /* The axis costing you the most points, which is where the next hour
       * should go. Not the lowest axis — the lowest weighted axis. */
      weakest: AXES.slice().sort((a, b) => deficit[b] - deficit[a])[0],
      deficit
    };
  });

  /* The headline number is measured against the loop shape of the companies
   * you are actually chasing: your targets if you have set any, otherwise
   * every company in the catalogue whose band reaches the goal. */
  const pool = scored.filter((c) => c.targeted).length
    ? scored.filter((c) => c.targeted)
    : scored.filter((c) => c.clearsTarget);

  const blend = {};
  for (const a of AXES) {
    blend[a] = pool.length
      ? pool.reduce((s, c) => s + c.weights[a], 0) / pool.length
      : 25;
  }

  let overall = 0;
  const deficit = {};
  for (const a of AXES) {
    overall += (blend[a] / 100) * axis[a];
    deficit[a] = (blend[a] / 100) * (1 - axis[a]);
  }

  return {
    targetCtc,
    axis,
    /* What the axes are worth across the companies you are chasing. */
    blend,
    overall: clamp01(overall),
    deficit,
    order: AXES.slice().sort((a, b) => deficit[b] - deficit[a]),
    poolSize: pool.length,
    poolIsTargets: scored.some((c) => c.targeted),
    companies: scored.sort((a, b) => b.score - a.score)
  };
}

/* Work remaining, converted into a weekly rate. A target date with no rate
 * attached is a wish; this is the arithmetic that turns it into a schedule. */
export function pace({ targetDate, targetCtc = 30 }) {
  const today = todayYmd();
  const r = readiness({ targetCtc });

  const counts = {
    dsa: db.prepare(`
      SELECT COUNT(DISTINCT cq.problem_key) AS n
      FROM company_questions cq JOIN companies c ON c.id = cq.company_id
      WHERE c.ctc_high >= ?`).get(targetCtc).n,
    lld: db.prepare("SELECT COUNT(*) AS n FROM prep_items WHERE track = 'lld'").get().n,
    hld: db.prepare("SELECT COUNT(*) AS n FROM prep_items WHERE track = 'hld'").get().n,
    bhv: db.prepare("SELECT COUNT(*) AS n FROM prep_items WHERE track = 'bhv'").get().n
  };

  let weeks = null;
  if (targetDate) {
    const ms = new Date(`${targetDate}T00:00:00Z`) - new Date(`${today}T00:00:00Z`);
    weeks = Math.max(0, Math.round((ms / 86400000 / 7) * 10) / 10);
  }

  const remaining = {};
  const perWeek = {};
  for (const a of AXES) {
    remaining[a] = Math.round(counts[a] * (1 - r.axis[a]));
    perWeek[a] = weeks && weeks > 0 ? Math.ceil(remaining[a] / weeks) : null;
  }

  return { today, targetDate, weeks, counts, remaining, perWeek };
}
