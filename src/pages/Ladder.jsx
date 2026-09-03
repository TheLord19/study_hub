import { api } from '../lib/api.js';
import { useRefresh, useResource } from '../lib/useResource.jsx';
import ProblemCard, { ProblemGrid } from '../components/ProblemCard.jsx';
import { Progress, Section } from '../components/ui.jsx';

export default function Ladder() {
  const { tick } = useRefresh();
  const { data, loading } = useResource(() => api.curriculum(), [tick]);

  if (loading || !data) return <div className="text-ink3 text-[13px]">Loading the ladder…</div>;

  const done = data.problems.filter((p) => p.verdict).length;

  return (
    <Section
      title="The ladder"
      note={`${done} of ${data.problems.length} attempted`}
    >
      <p className="text-[13.5px] text-ink2 -mt-1 mb-6 max-w-[62ch] leading-relaxed">
        Ordered so each tier hands you the tools the next one assumes. Solve top to bottom —
        the sequence is the point. LeetCode and Codeforces are interleaved deliberately:
        one trains pattern recall, the other trains solving under pressure.
      </p>

      <div className="flex flex-col gap-8">
        {data.tiers.map((tier, ti) => {
          const items = data.problems.filter((p) => p.tier === ti);
          const n = items.filter((p) => p.verdict).length;
          return (
            <div key={tier.name}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5 mb-2.5">
                <h3 className="text-[12px] font-bold uppercase tracking-[0.1em] text-ink2">{tier.name}</h3>
                <span className="font-mono text-[11px] text-ink3">{n}/{items.length}</span>
                <Progress value={n} max={items.length} className="flex-1 min-w-[120px] max-w-[220px] ml-auto" />
              </div>
              <p className="text-[12.5px] text-ink3 mb-3 max-w-[60ch]">{tier.blurb}</p>
              <ProblemGrid>
                {items.map((p) => <ProblemCard key={p.key} problem={p} />)}
              </ProblemGrid>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
