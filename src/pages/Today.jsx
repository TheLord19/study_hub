import { api } from '../lib/api.js';
import { useRefresh, useResource } from '../lib/useResource.jsx';
import { Link } from 'react-router-dom';
import { ALL_TOPICS, AXES, AXIS_COLOR, pct } from '../lib/constants.js';
import QuickLog from '../components/QuickLog.jsx';
import SolveRow from '../components/SolveRow.jsx';
import Heatmap from '../components/Heatmap.jsx';
import ProblemCard, { ProblemGrid } from '../components/ProblemCard.jsx';
import { Empty, Rows, Section } from '../components/ui.jsx';

function Stat({ value, label, sub, lead, pips }) {
  return (
    <div className="px-4 py-3.5 border-r border-lineSoft last:border-r-0
                    [&:nth-child(2)]:border-r-0 sm:[&:nth-child(2)]:border-r
                    [&:nth-child(-n+2)]:border-b sm:[&:nth-child(-n+2)]:border-b-0">
      <span className={`stat-num block text-[30px] leading-none ${lead ? 'text-accent' : ''}`}>{value}</span>
      <span className="eyebrow block mt-1.5">{label}</span>
      {pips ? (
        <div className="flex gap-[3px] mt-2">{pips}</div>
      ) : (
        <span className="block font-mono text-[10.5px] text-ink3 mt-1">{sub}</span>
      )}
    </div>
  );
}

export default function Today({ stats }) {
  const { tick } = useRefresh();
  const { data: due } = useResource(() => api.due(), [tick]);
  const { data: stuck } = useResource(() => api.stuck(), [tick]);
  const { data: next } = useResource(() => api.nextUp(), [tick]);
  const { data: recent } = useResource(() => api.solves({ limit: 8 }), [tick]);
  const { data: prepDue } = useResource(() => api.prepDue(), [tick]);
  const { data: readiness } = useResource(() => api.readiness(), [tick]);

  if (!stats) return <div className="text-ink3 text-[13px]">Loading…</div>;

  const today = stats.today;
  const goal = 2;
  const pipCount = Math.max(goal, Math.min(stats.todayCount, 8));
  const pips = Array.from({ length: pipCount }, (_, i) => (
    <span key={i} className={`h-[5px] flex-1 max-w-[26px] rounded-sm ${i < stats.todayCount ? 'bg-accent' : 'bg-raised'}`} />
  ));

  const loggedToday = (recent ?? []).filter((s) => s.solved_on === today);

  return (
    <>
      <Section
        title="Log a solve"
        note="Paste the link — title, platform and topics fill themselves in."
      >
        <QuickLog />
      </Section>

      <Section title="Where you stand">
        <div className="grid grid-cols-2 sm:grid-cols-4 bg-surface border border-line rounded overflow-hidden">
          <Stat lead value={readiness ? pct(readiness.overall) : '—'} label="Ready for the target"
                sub={readiness ? `${readiness.poolSize} companies clear it` : 'working it out'} />
          <Stat value={stats.locked} label="Patterns locked"
                sub={`of ${ALL_TOPICS.length} · 3 unassisted each`} />
          <Stat value={stats.todayCount + (stats.prepToday ?? 0)} label="Logged today" pips={pips} />
          <Stat value={stats.due + (stats.prepDue ?? 0)} label="Due for review"
                sub={`${stats.due} problems · ${stats.prepDue ?? 0} prep`} />
        </div>

        {/* Four bars, one per axis, so the shape of the gap is visible before
            you scroll. Algorithms being the tallest is the normal failure. */}
        {readiness && (
          <div className="grid gap-px bg-line border border-line rounded overflow-hidden mt-px
                          [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
            {AXES.map((a) => (
              <Link key={a.id} to={a.to}
                    className="bg-surface px-4 py-3 no-underline hover:bg-raised transition-colors">
                <div className="flex items-baseline gap-2">
                  <span className="text-[12.5px] font-semibold">{a.label}</span>
                  <span className="ml-auto font-mono text-[11.5px] tabular-nums"
                        style={{ color: AXIS_COLOR[a.id] }}>
                    {pct(readiness.axis[a.id])}
                  </span>
                </div>
                <div className="h-1.5 bg-raised rounded-sm overflow-hidden mt-2">
                  <div className="h-full rounded-sm"
                       style={{ width: `${readiness.axis[a.id] * 100}%`, background: AXIS_COLOR[a.id] }} />
                </div>
                <div className="font-mono text-[10px] text-ink3 mt-1.5">
                  {Math.round(readiness.blend[a.id])}% of the loop
                </div>
              </Link>
            ))}
          </div>
        )}
      </Section>

      {!!prepDue?.length && (
        <Section
          title="Prep due"
          note="Design and behavioural come back on the same spacing as problems."
        >
          <div className="grid gap-px bg-line border border-line rounded overflow-hidden">
            {prepDue.slice(0, 6).map((p) => (
              <Link
                key={p.key}
                to={p.track === 'hld' ? '/system-design' : p.track === 'lld' ? '/machine-coding' : '/behavioural'}
                className="bg-surface px-4 py-2.5 flex items-baseline gap-3 no-underline hover:bg-raised transition-colors"
              >
                <span className="w-1.5 h-1.5 rounded-full shrink-0"
                      style={{ background: AXIS_COLOR[p.track] }} />
                <span className="text-[13.5px] font-semibold">{p.title}</span>
                <span className="font-mono text-[10.5px] text-ink3">{p.minutes}m</span>
                <span className="ml-auto font-mono text-[10.5px] text-ink3">due {p.last.due_on}</span>
              </Link>
            ))}
          </div>
        </Section>
      )}

      <Section
        title="Due for review"
        note="Re-solve from scratch. Don't read your old answer first."
      >
        {due?.length ? (
          <Rows>{due.map((s) => <SolveRow key={s.id} solve={s} today={today} mode="review" />)}</Rows>
        ) : (
          <Empty>
            Nothing due. Reviews schedule themselves when you log — solving it unaided pushes
            the next look a long way out, reading the editorial brings it back to tomorrow.
          </Empty>
        )}
      </Section>

      <Section
        title="Next up"
        note={next ? `${next.done} of ${next.total} on the ladder` : undefined}
      >
        {next?.problems?.length ? (
          <ProblemGrid>
            {next.problems.map((p) => <ProblemCard key={p.key} problem={p} />)}
          </ProblemGrid>
        ) : (
          <Empty>You have been through the whole ladder. Time to pick your own — or start upsolving contests.</Empty>
        )}
      </Section>

      {!!stuck?.length && (
        <Section
          title="Still stuck"
          note="The list that should be driving what you study."
        >
          <Rows>{stuck.map((s) => <SolveRow key={s.id} solve={s} today={today} mode="unstick" />)}</Rows>
        </Section>
      )}

      <Section title={loggedToday.length ? 'Logged today' : 'Recently logged'}>
        {recent?.length ? (
          <Rows>
            {(loggedToday.length ? loggedToday : recent.slice(0, 5)).map((s) => (
              <SolveRow key={s.id} solve={s} today={today} />
            ))}
          </Rows>
        ) : (
          <Empty>Nothing logged yet. Solve one problem, paste the link above, and this fills in.</Empty>
        )}
      </Section>

      <Section title="Last six months">
        <Heatmap data={stats.heatmap} />
      </Section>
    </>
  );
}
