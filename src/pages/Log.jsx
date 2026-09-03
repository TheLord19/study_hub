import { useState } from 'react';
import { api } from '../lib/api.js';
import { useRefresh, useResource } from '../lib/useResource.jsx';
import { ALL_TOPICS, VERDICTS } from '../lib/constants.js';
import SolveRow from '../components/SolveRow.jsx';
import { Btn, Empty, Field, Panel, Rows, Section, useToast } from '../components/ui.jsx';
import { todayYmd } from '../lib/format.js';

export default function Log() {
  const { tick, bump } = useRefresh();
  const [f, setF] = useState({ q: '', platform: '', verdict: '', topic: '' });
  const [bulkOpen, setBulkOpen] = useState(false);
  const [bulk, setBulk] = useState({ text: '', verdict: 'solo', busy: false });
  const toast = useToast();

  const { data: solves, loading } = useResource(() => api.solves(f), [tick, f.q, f.platform, f.verdict, f.topic]);
  const set = (patch) => setF((p) => ({ ...p, ...patch }));

  async function runBulk() {
    const urls = bulk.text.split(/[\s,]+/).map((s) => s.trim()).filter(Boolean);
    if (!urls.length) { toast('Paste some problem links first.'); return; }
    setBulk((b) => ({ ...b, busy: true }));
    try {
      const r = await api.bulkSolves({ urls, verdict: bulk.verdict, solved_on: todayYmd() });
      toast(`Logged ${r.added}${r.skipped ? ` · skipped ${r.skipped} already logged` : ''}.`);
      setBulk({ text: '', verdict: 'solo', busy: false });
      setBulkOpen(false);
      bump();
    } catch (e) {
      toast(e.message);
      setBulk((b) => ({ ...b, busy: false }));
    }
  }

  return (
    <Section
      title="Everything you've logged"
      note={solves ? `${solves.length} ${solves.length === 1 ? 'entry' : 'entries'}` : undefined}
      action={
        <Btn size="sm" variant="ghost" onClick={() => setBulkOpen((s) => !s)}>
          {bulkOpen ? 'Close' : 'Bulk backfill'}
        </Btn>
      }
    >
      {bulkOpen && (
        <Panel className="p-4 mb-5 flex flex-col gap-3">
          <Field label="One problem link per line" htmlFor="bulk">
            <textarea
              id="bulk" rows={5}
              className="input font-mono text-[11.5px] leading-relaxed resize-y"
              value={bulk.text}
              onChange={(e) => setBulk((b) => ({ ...b, text: e.target.value }))}
              placeholder={'https://leetcode.com/problems/two-sum/\nhttps://leetcode.com/problems/valid-anagram/\nhttps://codeforces.com/problemset/problem/4/A'}
            />
          </Field>
          <div className="flex flex-wrap items-end gap-3">
            <Field label="Log all of them as">
              <select
                className="input w-48"
                value={bulk.verdict}
                onChange={(e) => setBulk((b) => ({ ...b, verdict: e.target.value }))}
              >
                {Object.entries(VERDICTS).map(([v, meta]) => (
                  <option key={v} value={v}>{meta.label}</option>
                ))}
              </select>
            </Field>
            <Btn size="sm" onClick={runBulk} disabled={bulk.busy}>
              {bulk.busy ? 'Logging…' : 'Log them'}
            </Btn>
            <p className="text-[12px] text-ink3 flex-1 min-w-[220px]">
              Anything in the catalogue brings its own title, difficulty and topics.
              Links you have already logged are skipped rather than duplicated.
            </p>
          </div>
        </Panel>
      )}

      <div className="flex flex-wrap gap-3 items-end mb-4">
        <Field label="Search" htmlFor="lg-q" className="flex-[1_1_240px]">
          <input id="lg-q" className="input" value={f.q}
                 onChange={(e) => set({ q: e.target.value })} placeholder="title, note, ref…" />
        </Field>
        <Field label="Platform" htmlFor="lg-p" className="flex-[0_1_170px]">
          <select id="lg-p" className="input" value={f.platform} onChange={(e) => set({ platform: e.target.value })}>
            <option value="">All</option>
            <option value="lc">LeetCode</option>
            <option value="cf">Codeforces</option>
            <option value="other">Other</option>
          </select>
        </Field>
        <Field label="Verdict" htmlFor="lg-v" className="flex-[0_1_180px]">
          <select id="lg-v" className="input" value={f.verdict} onChange={(e) => set({ verdict: e.target.value })}>
            <option value="">All</option>
            {Object.entries(VERDICTS).map(([v, meta]) => <option key={v} value={v}>{meta.label}</option>)}
          </select>
        </Field>
        <Field label="Topic" htmlFor="lg-t" className="flex-[0_1_190px]">
          <select id="lg-t" className="input" value={f.topic} onChange={(e) => set({ topic: e.target.value })}>
            <option value="">All</option>
            {ALL_TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
          </select>
        </Field>
      </div>

      {loading && <div className="text-ink3 text-[13px]">Loading…</div>}
      {!loading && (solves?.length ? (
        <Rows>{solves.map((s) => <SolveRow key={s.id} solve={s} today={todayYmd()} />)}</Rows>
      ) : (
        <Empty>Nothing matches those filters.</Empty>
      ))}
    </Section>
  );
}
