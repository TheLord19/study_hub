/* Deletes the database file so the next boot rebuilds it from schema + seed.
 * User data goes with it — that is the point of the command. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(here, '..', 'data');

let removed = 0;
for (const f of ['grind.db', 'grind.db-wal', 'grind.db-shm', 'grind.db-journal']) {
  const p = path.join(dataDir, f);
  if (fs.existsSync(p)) { fs.rmSync(p); removed += 1; }
}
console.log(removed ? `Removed ${removed} database file(s). Next start rebuilds them.` : 'No database to remove.');
