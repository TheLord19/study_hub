import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useRefresh, useResource } from '../lib/useResource.jsx';
import ProblemCard, { ProblemGrid } from '../components/ProblemCard.jsx';
import { Btn, Progress, Section, useToast } from '../components/ui.jsx';

const BANDS = [
  { freq: 3, title: 'Asked constantly', note: 'If you only get through one group, make it this one.' },
  { freq: 2, title: 'Common', note: 'Reliably in rotation.' },
  { freq: 1, title: 'Shows up', note: 'Worth a look once the rest is solid.' }
];

export default function CompanyDetail() {
  const { slug } = useParams();
  const { tick, bump } = useRefresh();
  const { data: c, loading, error } = useResource(() => api.company(slug), [slug, tick]);
  const toast = useToast();

  if (loading) return <div className="text-ink3 text-[13px]">Loading…</div>;
  if (error) return <div className="text-ink3 text-[13px]">{error.message}</div>;

  const done = c.questions.filter((q) => q.verdict && q.verdict !== 'stuck').length;
  const solo = c.questions.filter((q) => q.verdict === 'solo').length;

  async function toggleTarget() {
    try {
      await api.setTarget(slug, !c.targeted);
      toast(c.targeted ? `Removed ${c.name} from your targets.` : `${c.name} added to your targets.`);
      bump();
    } catch (e) { toast(e.message); }
  }

  return (
    <>
      <Link to="/companies" className="font-mono text-[11.5px] text-ink3 hover:text-ink no-underline">
        ← all companies
      </Link>

      <div className="mt-4 mb-7">
        <div className="flex flex-wrap items-center gap-3 mb-2">
          <h1 className="text-[26px] font-bold" style={{ fontStretch: '110%' }}>{c.name}</h1>
          <Btn size="sm" variant={c.targeted ? 'solid' : 'ghost'} onClick={toggleTarget}>
            {c.targeted ? 'Targeting' : 'Add to targets'}
          </Btn>
        </div>

        <p className="text-[13.5px] text-ink2 max-w-[64ch] leading-relaxed">{c.blurb}</p>

        <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-baseline gap-2">
            <span className="stat-num text-[24px] text-accent">{done}</span>
            <span className="text-ink3 text-[13px]">of {c.questions.length} covered</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="stat-num text-[24px]">{solo}</span>
            <span className="text-ink3 text-[13px]">unaided</span>
          </div>
          <Progress value={done} max={c.questions.length} className="flex-1 min-w-[140px] max-w-[280px]" />
        </div>
      </div>

      {BANDS.map((b) => {
        const list = c.questions.filter((q) => q.frequency === b.freq);
        if (!list.length) return null;
        const n = list.filter((q) => q.verdict && q.verdict !== 'stuck').length;
        return (
          <Section key={b.freq} title={b.title} note={`${n}/${list.length} · ${b.note}`}>
            <ProblemGrid>
              {list.map((q) => <ProblemCard key={q.key} problem={q} showFrequency />)}
            </ProblemGrid>
          </Section>
        );
      })}
    </>
  );
}
