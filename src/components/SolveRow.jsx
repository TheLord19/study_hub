import { api } from '../lib/api.js';
import { useRefresh } from '../lib/useResource.jsx';
import { shortDate, relativeDue } from '../lib/format.js';
import { Tag, PlatformTag, DifficultyTag, VerdictTag, Btn, useToast } from './ui.jsx';

/* One logged solve. `mode` decides which actions appear:
 *   review  — the three re-rate buttons, for the due queue
 *   unstick — a single "got it now"
 *   plain   — just delete
 */
export default function SolveRow({ solve, today, mode = 'plain' }) {
  const { bump } = useRefresh();
  const toast = useToast();
  const due = mode === 'unstick' ? null : relativeDue(solve.due_on, today);

  async function review(verdict) {
    try {
      const r = await api.review(solve.id, verdict);
      toast(
        verdict === 'stuck'
          ? 'Moved to still stuck.'
          : `Reviewed. Next look ${r.due_on}.`
      );
      bump();
    } catch (e) { toast(e.message); }
  }

  async function remove() {
    try {
      await api.deleteSolve(solve.id);
      toast('Deleted.');
      bump();
    } catch (e) { toast(e.message); }
  }

  return (
    <div className="grid gap-x-3.5 gap-y-2 px-3.5 py-3 border-b border-lineSoft last:border-b-0
                    hover:bg-raised/50 transition-colors
                    grid-cols-1 sm:grid-cols-[86px_minmax(0,1fr)_auto_auto] sm:items-center">
      <span className="font-mono text-[11.5px] text-ink3 tabular-nums">{shortDate(solve.solved_on)}</span>

      <div className="min-w-0">
        <span className="text-[14px] font-semibold block truncate">
          {solve.url ? (
            <a href={solve.url} target="_blank" rel="noopener noreferrer" className="text-ink no-underline hover:text-accent hover:underline">
              {solve.title}
            </a>
          ) : solve.title}
        </span>

        <div className="flex flex-wrap items-center gap-1.5 mt-1">
          <PlatformTag problem={solve} />
          <DifficultyTag problem={solve} />
          <VerdictTag verdict={solve.verdict} />
          {(solve.topics ?? []).slice(0, 3).map((t) => <Tag key={t} tone="topic">{t}</Tag>)}
          {(solve.topics ?? []).length > 3 && <Tag tone="topic">+{solve.topics.length - 3}</Tag>}
        </div>

        {solve.idea && (
          <p className="text-[12.5px] text-ink2 mt-1.5 pl-2.5 border-l-2 border-line leading-snug">
            {solve.idea}
          </p>
        )}
      </div>

      <span className={`font-mono text-[11px] whitespace-nowrap sm:text-right ${due?.now ? 'text-accent font-bold' : 'text-ink3'}`}>
        {due?.text ?? ''}
      </span>

      <div className="flex flex-wrap gap-1.5 sm:justify-end">
        {mode === 'review' && (
          <>
            <Btn size="xs" onClick={() => review('solo')}>solo</Btn>
            <Btn size="xs" variant="ghost" onClick={() => review('hint')}>hint</Btn>
            <Btn size="xs" variant="ghost" onClick={() => review('edtl')}>editorial</Btn>
          </>
        )}
        {mode === 'unstick' && <Btn size="xs" onClick={() => review('solo')}>got it now</Btn>}
        <Btn size="xs" variant="quiet" onClick={remove}>delete</Btn>
      </div>
    </div>
  );
}
