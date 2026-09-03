import { api } from '../lib/api.js';
import { useRefresh, useResource } from '../lib/useResource.jsx';
import { ALL_TOPICS } from '../lib/constants.js';
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
          <Stat lead value={stats.locked} label="Patterns locked"
                sub={`of ${ALL_TOPICS.length} · 3 unassisted each`} />
          <Stat value={stats.todayCount} label="Solved today" pips={pips} />
          <Stat value={stats.weekCount} label="This week"
                sub={`${stats.lc} leetcode · ${stats.cf} codeforces`} />
          <Stat value={stats.due} label="Due for review"
                sub={`${stats.total} logged all-time`} />
        </div>
      </Section>

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
