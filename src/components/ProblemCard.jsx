import { useState } from 'react';
import { api } from '../lib/api.js';
import { useRefresh } from '../lib/useResource.jsx';
import { VERDICTS } from '../lib/constants.js';
import { Tag, PlatformTag, DifficultyTag, VerdictTag, Btn, useToast } from './ui.jsx';

const VERDICT_ORDER = ['solo', 'hint', 'edtl', 'stuck'];
const TONE_VAR = {
  solo: 'rgb(var(--c-solo))',
  hint: 'rgb(var(--c-hint))',
  edtl: 'rgb(var(--c-edtl))',
  stuck: 'rgb(var(--c-ink-3))'
};

/* A problem out of the catalogue. Logging is two clicks — "log" then a verdict
 * — because the server fills in title, difficulty and topics from the key. The
 * quick-log form exists for problems that are not in the catalogue. */
export default function ProblemCard({ problem, showFrequency = false }) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const { bump } = useRefresh();
  const toast = useToast();
  const done = !!problem.verdict;

  async function log(verdict) {
    setBusy(true);
    try {
      const saved = await api.logSolve({ url: problem.url, verdict });
      toast(
        verdict === 'stuck'
          ? `${saved.title} → still stuck.`
          : `${saved.title} logged. Next review ${saved.due_on}.`
      );
      setOpen(false);
      bump();
    } catch (e) {
      toast(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={`p-3 flex flex-col gap-2 min-w-0 ${done ? 'bg-raised' : 'bg-surface'}`}>
      <span className={`text-[13.5px] font-semibold leading-snug ${done ? 'text-ink2' : 'text-ink'}`}>
        {problem.title}
      </span>

      <div className="flex flex-wrap items-center gap-1.5">
        <PlatformTag problem={problem} />
        <DifficultyTag problem={problem} />
        {done && <VerdictTag verdict={problem.verdict} />}
        {showFrequency && problem.frequency >= 3 && <Tag tone="accent">ASKED A LOT</Tag>}
        {(problem.topics ?? []).slice(0, 2).map((t) => (
          <Tag key={t} tone="topic">{t}</Tag>
        ))}
      </div>

      <div className="flex flex-wrap gap-1.5 mt-auto pt-1">
        <Btn as="a" size="xs" variant="ghost" href={problem.url} target="_blank" rel="noopener noreferrer">
          open
        </Btn>

        {!done && !open && (
          <Btn size="xs" variant="solid" onClick={() => setOpen(true)}>log</Btn>
        )}

        {!done && open && (
          <>
            {VERDICT_ORDER.map((v) => (
              <button
                key={v}
                type="button"
                disabled={busy}
                onClick={() => log(v)}
                style={{ borderColor: TONE_VAR[v], color: TONE_VAR[v] }}
                className="font-mono text-[11px] px-2 py-0.5 rounded border bg-transparent
                           hover:bg-raised transition-colors disabled:opacity-40"
              >
                {VERDICTS[v].tag.toLowerCase()}
              </button>
            ))}
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="font-mono text-[11px] px-1.5 text-ink3 hover:text-ink"
            >
              ×
            </button>
          </>
        )}
      </div>
    </div>
  );
}

export function ProblemGrid({ children }) {
  return (
    <div className="grid gap-px bg-line border border-line rounded overflow-hidden
                    [grid-template-columns:repeat(auto-fill,minmax(232px,1fr))]">
      {children}
    </div>
  );
}
