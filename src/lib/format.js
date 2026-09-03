const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function todayYmd(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export function parseYmd(s) {
  const [y, m, d] = String(s).split('-').map(Number);
  return new Date(y, m - 1, d);
}

export function addDays(ymd, n) {
  const d = parseYmd(ymd);
  d.setDate(d.getDate() + n);
  return todayYmd(d);
}

export function dayDiff(from, to) {
  return Math.round((parseYmd(to) - parseYmd(from)) / 86400000);
}

export function shortDate(s) {
  if (!s) return '';
  const d = parseYmd(s);
  return `${String(d.getDate()).padStart(2, '0')} ${MONTHS[d.getMonth()]}`;
}

export function monthLabel(date) {
  return MONTHS[date.getMonth()];
}

/* 31.5 minutes over 5.2km reads as 6:04 /km, not 6.06 */
export function pace(minutes, km) {
  if (!km || km <= 0) return '—';
  const perKm = minutes / km;
  const m = Math.floor(perKm);
  const s = Math.round((perKm - m) * 60);
  return `${m}:${String(s === 60 ? 0 : s).padStart(2, '0')}`;
}

export function duration(minutes) {
  const m = Math.floor(minutes);
  const h = Math.floor(m / 60);
  return h > 0 ? `${h}h ${m % 60}m` : `${m}m`;
}

export function relativeDue(due, today) {
  if (!due) return null;
  const d = dayDiff(today, due);
  if (d <= 0) return { text: 'review now', now: true };
  if (d === 1) return { text: 'review tomorrow', now: false };
  return { text: `review in ${d}d`, now: false };
}
