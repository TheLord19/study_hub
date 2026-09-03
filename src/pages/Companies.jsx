import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useRefresh, useResource } from '../lib/useResource.jsx';
import { Progress, Section, Tag } from '../components/ui.jsx';

function CompanyCard({ c }) {
  const pct = c.total ? Math.round((c.done / c.total) * 100) : 0;
  return (
    <Link
      to={`/companies/${c.slug}`}
      className="bg-surface p-4 flex flex-col gap-2.5 no-underline hover:bg-raised transition-colors group"
    >
      <div className="flex items-baseline gap-2">
        <span className="text-[14.5px] font-bold text-ink group-hover:text-accent transition-colors">{c.name}</span>
        {!!c.targeted && <Tag tone="accent">TARGET</Tag>}
        <span className="ml-auto font-mono text-[11px] text-ink3 tabular-nums">{c.done}/{c.total}</span>
      </div>

      <Progress value={c.done} max={c.total} />

      <div className="flex items-center gap-2 font-mono text-[10.5px] text-ink3">
        <span>{pct}% covered</span>
        {c.solo > 0 && <span className="text-solo">· {c.solo} unaided</span>}
      </div>

      <p className="text-[12.5px] text-ink3 leading-snug line-clamp-3">{c.blurb}</p>
    </Link>
  );
}

export default function Companies() {
  const { tick } = useRefresh();
  const { data, loading } = useResource(() => api.companies(), [tick]);

  if (loading || !data) return <div className="text-ink3 text-[13px]">Loading companies…</div>;

  const targeted = data.companies.filter((c) => c.targeted);

  return (
    <>
      <Section title="Companies" note={`${data.companies.length} sets`}>
        <p className="text-[13.5px] text-ink2 -mt-1 mb-6 max-w-[62ch] leading-relaxed">
          What each company actually leans on, and how much of it you have covered. Progress counts
          a question as done once you have logged it at any verdict — the unaided count is the one
          that matters when you are a week out.
        </p>

        {!!targeted.length && (
          <div className="mb-8">
            <h3 className="eyebrow mb-2.5">Your targets</h3>
            <div className="grid gap-px bg-line border border-line rounded overflow-hidden
                            [grid-template-columns:repeat(auto-fill,minmax(258px,1fr))]">
              {targeted.map((c) => <CompanyCard key={c.slug} c={c} />)}
            </div>
          </div>
        )}

        <div className="flex flex-col gap-7">
          {data.buckets.map((b) => {
            const list = data.companies.filter((c) => c.bucket === b.id);
            if (!list.length) return null;
            return (
              <div key={b.id}>
                <h3 className="eyebrow mb-2.5">{b.label}</h3>
                <div className="grid gap-px bg-line border border-line rounded overflow-hidden
                                [grid-template-columns:repeat(auto-fill,minmax(258px,1fr))]">
                  {list.map((c) => <CompanyCard key={c.slug} c={c} />)}
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </>
  );
}
