import Database from 'better-sqlite3';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { seedReferenceData } from './seed.js';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, '..', 'data');
const dbPath = process.env.GRIND_DB ?? path.join(dataDir, 'grind.db');

fs.mkdirSync(dataDir, { recursive: true });

export const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(fs.readFileSync(path.join(here, 'schema.sql'), 'utf8'));

/* Columns added after the first release. CREATE TABLE IF NOT EXISTS will not
 * touch a table that already exists, so a database created before these landed
 * needs them added by hand. Adding a column is the only migration shape used
 * here — anything destructive should be a new table plus a copy, deliberately. */
function addColumn(table, column, decl) {
  const has = db.prepare(`PRAGMA table_info(${table})`).all().some((c) => c.name === column);
  if (!has) db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${decl}`);
}
addColumn('companies', 'ctc_low', 'REAL');
addColumn('companies', 'ctc_high', 'REAL');
addColumn('companies', 'loop', "TEXT NOT NULL DEFAULT '{}'");

seedReferenceData(db);

/* Settings are a tiny key/value table; JSON in, JSON out. */
export function getSetting(key, fallback) {
  const row = db.prepare('SELECT value FROM settings WHERE key = ?').get(key);
  if (!row) return fallback;
  try {
    return JSON.parse(row.value);
  } catch {
    return fallback;
  }
}

export function setSetting(key, value) {
  db.prepare(
    `INSERT INTO settings (key, value) VALUES (?, ?)
     ON CONFLICT(key) DO UPDATE SET value = excluded.value`
  ).run(key, JSON.stringify(value));
}

export { dbPath };
