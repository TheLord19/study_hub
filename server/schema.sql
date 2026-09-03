PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ---------------------------------------------------------------------------
-- Reference data. `problems` is the single master pool: the ladder and every
-- company question set point at it by key, so a problem's title/url/topics
-- live in exactly one row.
-- Keys are platform-scoped and stable: 'lc:two-sum', 'cf:4A'.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS problems (
  key         TEXT PRIMARY KEY,
  title       TEXT NOT NULL,
  url         TEXT NOT NULL,
  platform    TEXT NOT NULL CHECK (platform IN ('lc','cf','other')),
  difficulty  TEXT CHECK (difficulty IN ('easy','med','hard') OR difficulty IS NULL),
  cf_rating   INTEGER,
  topics      TEXT NOT NULL DEFAULT '[]'   -- JSON array of topic names
);

-- Teaching order. tier 0..4, seq orders within a tier.
CREATE TABLE IF NOT EXISTS curriculum (
  problem_key TEXT PRIMARY KEY REFERENCES problems(key) ON DELETE CASCADE,
  tier        INTEGER NOT NULL,
  seq         INTEGER NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_curriculum_tier ON curriculum(tier, seq);

CREATE TABLE IF NOT EXISTS companies (
  id      INTEGER PRIMARY KEY AUTOINCREMENT,
  slug    TEXT UNIQUE NOT NULL,
  name    TEXT NOT NULL,
  bucket  TEXT NOT NULL,             -- faang | product | indian-product | service
  blurb   TEXT
);

-- frequency: 3 = asked constantly, 2 = common, 1 = shows up
CREATE TABLE IF NOT EXISTS company_questions (
  company_id  INTEGER NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  problem_key TEXT    NOT NULL REFERENCES problems(key) ON DELETE CASCADE,
  frequency   INTEGER NOT NULL DEFAULT 2,
  PRIMARY KEY (company_id, problem_key)
);
CREATE INDEX IF NOT EXISTS idx_cq_company ON company_questions(company_id);

-- ---------------------------------------------------------------------------
-- User data
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS solves (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  problem_key   TEXT,                       -- null for ad-hoc problems off-catalogue
  title         TEXT NOT NULL,
  url           TEXT,
  platform      TEXT NOT NULL DEFAULT 'other',
  ref           TEXT,
  difficulty    TEXT,
  cf_rating     INTEGER,
  verdict       TEXT NOT NULL CHECK (verdict IN ('solo','hint','edtl','stuck')),
  idea          TEXT,
  minutes       INTEGER,
  solved_on     TEXT NOT NULL,              -- YYYY-MM-DD
  reps          INTEGER NOT NULL DEFAULT 0,
  interval_days INTEGER NOT NULL DEFAULT 0,
  due_on        TEXT,                       -- YYYY-MM-DD, null when stuck
  created_at    TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_solves_date ON solves(solved_on DESC);
CREATE INDEX IF NOT EXISTS idx_solves_due  ON solves(due_on);
CREATE INDEX IF NOT EXISTS idx_solves_key  ON solves(problem_key);

CREATE TABLE IF NOT EXISTS solve_topics (
  solve_id INTEGER NOT NULL REFERENCES solves(id) ON DELETE CASCADE,
  topic    TEXT NOT NULL,
  PRIMARY KEY (solve_id, topic)
);
CREATE INDEX IF NOT EXISTS idx_solve_topics_topic ON solve_topics(topic);

-- Which companies you are actively targeting. Drives the Companies dashboard.
CREATE TABLE IF NOT EXISTS targets (
  company_id INTEGER PRIMARY KEY REFERENCES companies(id) ON DELETE CASCADE,
  added_on   TEXT NOT NULL DEFAULT (date('now'))
);

-- ---------------------------------------------------------------------------
-- Body. `source` is the Garmin seam: a future importer writes source='garmin'
-- and everything downstream keeps working untouched.
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS runs (
  id          INTEGER PRIMARY KEY AUTOINCREMENT,
  ran_on      TEXT NOT NULL,
  distance_km REAL NOT NULL,
  duration_min REAL NOT NULL,
  avg_hr      INTEGER,
  perceived   INTEGER,                      -- 1..5 how hard it felt
  notes       TEXT,
  source      TEXT NOT NULL DEFAULT 'manual',
  external_id TEXT UNIQUE,                  -- garmin activity id, keeps imports idempotent
  created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_runs_date ON runs(ran_on DESC);

CREATE TABLE IF NOT EXISTS weights (
  measured_on TEXT PRIMARY KEY,             -- one reading per day, last write wins
  weight_kg   REAL NOT NULL,
  note        TEXT,
  source      TEXT NOT NULL DEFAULT 'manual'
);

-- ---------------------------------------------------------------------------
-- Things you made
-- ---------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS builds (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  name       TEXT NOT NULL,
  blurb      TEXT,
  url        TEXT,
  repo       TEXT,
  status     TEXT NOT NULL DEFAULT 'building'
             CHECK (status IN ('idea','building','shipped','shelved')),
  tags       TEXT NOT NULL DEFAULT '[]',
  started_on TEXT NOT NULL DEFAULT (date('now')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
