import { PROBLEMS, PROBLEM_KEYS } from './data/problems.js';
import { CURRICULUM } from './data/curriculum.js';
import { COMPANIES } from './data/companies.js';
import { LOOPS } from './data/loops.js';
import { PREP_ITEMS } from './data/prep.js';

/* Reference data is code, not user data: every boot re-asserts it so editing
 * the data files is enough to update the catalogue. User rows are never
 * touched here. Runs inside one transaction so a bad edit cannot leave a
 * half-written catalogue behind. */
export function seedReferenceData(db) {
  const unknown = [];
  for (const c of COMPANIES) {
    for (const [key] of c.q) {
      if (!PROBLEM_KEYS.has(key)) unknown.push(`${c.slug} -> ${key}`);
    }
  }
  for (const [key] of CURRICULUM) {
    if (!PROBLEM_KEYS.has(key)) unknown.push(`curriculum -> ${key}`);
  }
  for (const c of COMPANIES) {
    if (!LOOPS[c.slug]) unknown.push(`loops -> ${c.slug} (no band or round weights)`);
  }
  if (unknown.length) {
    throw new Error(
      `Catalogue references problems that are not in the pool:\n  ${unknown.join('\n  ')}`
    );
  }

  const upsertProblem = db.prepare(
    `INSERT INTO problems (key, title, url, platform, difficulty, cf_rating, topics)
     VALUES (@key, @title, @url, @platform, @difficulty, @cf_rating, @topics)
     ON CONFLICT(key) DO UPDATE SET
       title = excluded.title, url = excluded.url, platform = excluded.platform,
       difficulty = excluded.difficulty, cf_rating = excluded.cf_rating,
       topics = excluded.topics`
  );
  const upsertCurriculum = db.prepare(
    `INSERT INTO curriculum (problem_key, tier, seq) VALUES (?, ?, ?)
     ON CONFLICT(problem_key) DO UPDATE SET tier = excluded.tier, seq = excluded.seq`
  );
  const upsertCompany = db.prepare(
    `INSERT INTO companies (slug, name, bucket, blurb, ctc_low, ctc_high, loop)
     VALUES (@slug, @name, @bucket, @blurb, @ctc_low, @ctc_high, @loop)
     ON CONFLICT(slug) DO UPDATE SET
       name = excluded.name, bucket = excluded.bucket, blurb = excluded.blurb,
       ctc_low = excluded.ctc_low, ctc_high = excluded.ctc_high, loop = excluded.loop`
  );
  const upsertPrep = db.prepare(
    `INSERT INTO prep_items (key, track, title, prompt, blurb, tier, seq, weight, minutes, tags, checklist)
     VALUES (@key, @track, @title, @prompt, @blurb, @tier, @seq, @weight, @minutes, @tags, @checklist)
     ON CONFLICT(key) DO UPDATE SET
       track = excluded.track, title = excluded.title, prompt = excluded.prompt,
       blurb = excluded.blurb, tier = excluded.tier, seq = excluded.seq,
       weight = excluded.weight, minutes = excluded.minutes,
       tags = excluded.tags, checklist = excluded.checklist`
  );
  const companyIdBySlug = db.prepare('SELECT id FROM companies WHERE slug = ?');
  const clearCompanyQs = db.prepare('DELETE FROM company_questions WHERE company_id = ?');
  const insertCompanyQ = db.prepare(
    'INSERT INTO company_questions (company_id, problem_key, frequency) VALUES (?, ?, ?)'
  );

  db.transaction(() => {
    for (const p of PROBLEMS) {
      upsertProblem.run({ ...p, topics: JSON.stringify(p.topics) });
    }

    const perTier = new Map();
    for (const [key, tier] of CURRICULUM) {
      const seq = perTier.get(tier) ?? 0;
      perTier.set(tier, seq + 1);
      upsertCurriculum.run(key, tier, seq);
    }

    for (const i of PREP_ITEMS) {
      upsertPrep.run({
        ...i,
        tags: JSON.stringify(i.tags),
        checklist: JSON.stringify(i.checklist)
      });
    }

    for (const c of COMPANIES) {
      const l = LOOPS[c.slug];
      upsertCompany.run({
        slug: c.slug, name: c.name, bucket: c.bucket, blurb: c.blurb,
        ctc_low: l?.ctc?.[0] ?? null,
        ctc_high: l?.ctc?.[1] ?? null,
        loop: JSON.stringify({ ...(l?.loop ?? {}), rounds: l?.rounds ?? null })
      });
      const { id } = companyIdBySlug.get(c.slug);
      clearCompanyQs.run(id);
      for (const [key, freq] of c.q) insertCompanyQ.run(id, key, freq);
    }
  })();
}
