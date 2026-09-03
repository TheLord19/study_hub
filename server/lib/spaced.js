/* Spaced repetition, driven by the verdict rather than a self-rated score.
 *
 * The premise: "did you solve it" is almost no information. "How did you get
 * there" is. Solving it unaided pushes the next look a long way out; needing a
 * hint pushes it out a little; reading the editorial means you did not know it,
 * so it comes back tomorrow regardless of history.
 */
const MAX_INTERVAL_DAYS = 180;

export function schedule(prevInterval = 0, reps = 0, verdict = 'solo') {
  let interval;
  let nextReps = reps || 0;

  switch (verdict) {
    case 'solo':
      nextReps += 1;
      interval = nextReps <= 1 ? 4 : Math.round((prevInterval || 4) * 2.5);
      break;
    case 'hint':
      nextReps += 1;
      interval = nextReps <= 1 ? 2 : Math.max(2, Math.round((prevInterval || 2) * 1.5));
      break;
    case 'edtl':
      nextReps = 0;
      interval = 1;
      break;
    default: // 'stuck' — not scheduled at all, it lives on the stuck list
      return { reps: 0, interval: 0, due: null };
  }

  return { reps: nextReps, interval: Math.min(interval, MAX_INTERVAL_DAYS) };
}

export function addDays(ymd, n) {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + n);
  return dt.toISOString().slice(0, 10);
}

export function todayYmd(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/* Normalise any problem URL into the key space the catalogue uses. */
export function problemKeyFromUrl(url) {
  if (!url) return null;
  const u = String(url);
  let m = u.match(/leetcode\.com\/problems\/([a-z0-9-]+)/i);
  if (m) return `lc:${m[1].toLowerCase()}`;
  m = u.match(/codeforces\.com\/problemset\/problem\/(\d+)\/([A-Za-z]\d?)/i);
  if (m) return `cf:${m[1]}${m[2].toUpperCase()}`;
  m = u.match(/codeforces\.com\/(?:contest|gym)\/(\d+)\/problem\/([A-Za-z]\d?)/i);
  if (m) return `cf:${m[1]}${m[2].toUpperCase()}`;
  return null;
}
