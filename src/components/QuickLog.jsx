import { useMemo, useState } from 'react';
import { api } from '../lib/api.js';
import { useRefresh } from '../lib/useResource.jsx';
import { todayYmd } from '../lib/format.js';
import { QUICK_TOPICS, TOPIC_GROUPS, VERDICTS } from '../lib/constants.js';
import { Btn, Chip, Field, Panel, Seg, useToast } from './ui.jsx';

const VERDICT_OPTS = Object.entries(VERDICTS).map(([value, v]) => ({ value, label: v.label }));
const VERDICT_TONES = {
  solo: 'rgb(var(--c-solo))',
  hint: 'rgb(var(--c-hint))',
  edtl: 'rgb(var(--c-edtl))',
  stuck: 'rgb(var(--c-ink-3))'
};
const DIFF_OPTS = [
  { value: 'easy', label: 'Easy' },
  { value: 'med', label: 'Medium' },
  { value: 'hard', label: 'Hard' }
];

function detect(raw) {
  const s = (raw ?? '').trim();
  if (!s) return null;
  let m = s.match(/leetcode\.com\/problems\/([a-z0-9-]+)/i);
  if (m) {
    const title = m[1].split('-').map((w) =>
      ({ ii: 'II', iii: 'III', iv: 'IV' }[w] ?? w.charAt(0).toUpperCase() + w.slice(1))
    ).join(' ');
    return { platform: 'lc', badge: 'leetcode', title };
  }
  m = s.match(/codeforces\.com\/(?:problemset\/problem|contest|gym)\/(\d+)\/(?:problem\/)?([A-Za-z]\d?)/i);
  if (m) return { platform: 'cf', badge: `CF ${m[1]}${m[2].toUpperCase()}`, title: '' };
  if (/^https?:\/\//i.test(s)) return { platform: 'other', badge: 'link', title: '' };
  return null;
}

const EMPTY = { url: '', title: '', difficulty: '', cf: '', verdict: 'solo', idea: '', minutes: '', topics: [] };

export default function QuickLog() {
  const [f, setF] = useState({ ...EMPTY, date: todayYmd() });
  const [showAll, setShowAll] = useState(false);
  const [busy, setBusy] = useState(false);
  const { bump } = useRefresh();
  const toast = useToast();

  const found = useMemo(() => detect(f.url), [f.url]);
  const set = (patch) => setF((p) => ({ ...p, ...patch }));

  function onUrl(value) {
    const d = detect(value);
    set({ url: value, title: d?.title && !f.title ? d.title : f.title });
  }

  function toggleTopic(t) {
    set({ topics: f.topics.includes(t) ? f.topics.filter((x) => x !== t) : [...f.topics, t] });
  }

  async function submit(e) {
    e.preventDefault();
    if (!f.url.trim() && !f.title.trim()) {
      toast('Add a link or a title first.');
      return;
    }
    setBusy(true);
    try {
      const saved = await api.logSolve({
        url: f.url.trim(),
        title: f.title.trim(),
        verdict: f.verdict,
        difficulty: found?.platform === 'cf' ? null : f.difficulty || null,
        cf_rating: found?.platform === 'cf' && f.cf ? Number(f.cf) : null,
        topics: f.topics,
        idea: f.idea.trim(),
        minutes: f.minutes ? Number(f.minutes) : null,
        solved_on: f.date
      });
      toast(
        f.verdict === 'stuck'
          ? 'Added to still stuck. Come back to it.'
          : `Logged. Next review ${saved.due_on}.`
      );
      setF({ ...EMPTY, date: f.date });
      setShowAll(false);
      bump();
    } catch (err) {
      toast(err.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel className="p-4">
      <form onSubmit={submit} autoComplete="off" className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2.5 items-end">
          <Field label="Problem link or name" htmlFor="ql-url" className="flex-[2_1_320px]">
            <input
              id="ql-url" className="input" value={f.url}
              onChange={(e) => onUrl(e.target.value)}
              placeholder="https://leetcode.com/problems/two-sum/"
            />
          </Field>
          <Field label="Title" htmlFor="ql-title" className="flex-[1_1_200px]">
            <input
              id="ql-title" className="input" value={f.title}
              onChange={(e) => set({ title: e.target.value })}
              placeholder="Two Sum"
            />
          </Field>
          {found && (
            <span className="font-mono text-[11px] text-accent bg-accent/12 rounded-full px-2.5 py-1 mb-1.5 whitespace-nowrap">
              {found.badge}
            </span>
          )}
        </div>

        <div className="flex flex-wrap gap-x-6 gap-y-4">
          {found?.platform === 'cf' ? (
            <Field label="CF rating" htmlFor="ql-cf">
              <input
                id="ql-cf" type="number" min="800" max="3500" step="100"
                className="input w-28" value={f.cf}
                onChange={(e) => set({ cf: e.target.value })} placeholder="800"
              />
            </Field>
          ) : (
            <Field label="Difficulty">
              <Seg
                options={DIFF_OPTS} value={f.difficulty}
                onChange={(v) => set({ difficulty: v === f.difficulty ? '' : v })}
              />
            </Field>
          )}

          <Field label="How it went">
            <Seg options={VERDICT_OPTS} value={f.verdict} tones={VERDICT_TONES}
                 onChange={(v) => set({ verdict: v })} />
          </Field>

          <Field label="Date" htmlFor="ql-date">
            <input id="ql-date" type="date" className="input w-40 font-mono text-[12.5px]"
                   value={f.date} onChange={(e) => set({ date: e.target.value })} />
          </Field>

          <Field label="Minutes" htmlFor="ql-min">
            <input id="ql-min" type="number" min="1" max="600" className="input w-24"
                   value={f.minutes} onChange={(e) => set({ minutes: e.target.value })} placeholder="25" />
          </Field>
        </div>

        <Field label={<>Topics</>}>
          <div className="flex flex-wrap gap-1.5">
            {QUICK_TOPICS.map((t) => (
              <Chip key={t} on={f.topics.includes(t)} onClick={() => toggleTopic(t)}>{t}</Chip>
            ))}
            <button
              type="button" onClick={() => setShowAll((s) => !s)}
              className="rounded-full border border-dashed border-line px-2.5 py-1 font-mono text-[11px] text-ink3 hover:text-ink"
            >
              {showAll ? 'fewer' : 'all topics'}
            </button>
          </div>

          {showAll && (
            <div className="mt-2.5 pt-3 border-t border-dashed border-line flex flex-col gap-2.5">
              {TOPIC_GROUPS.map((g) => (
                <div key={g.name} className="flex flex-wrap gap-1.5 items-center">
                  <span className="w-full text-[10px] font-bold uppercase tracking-[0.1em] text-ink3">{g.name}</span>
                  {g.topics.map((t) => (
                    <Chip key={t} on={f.topics.includes(t)} onClick={() => toggleTopic(t)}>{t}</Chip>
                  ))}
                </div>
              ))}
            </div>
          )}
        </Field>

        <div className="flex flex-wrap gap-3 items-end pt-3 border-t border-lineSoft">
          <Field label="Key idea — what was the trick?" htmlFor="ql-idea" className="flex-1 min-w-[260px]">
            <input
              id="ql-idea" className="input" value={f.idea}
              onChange={(e) => set({ idea: e.target.value })}
              placeholder="Store seen values in a hash map, look for target − x"
            />
          </Field>
          <Btn type="submit" disabled={busy}>{busy ? 'Saving…' : 'Log it'}</Btn>
        </div>
      </form>
    </Panel>
  );
}
