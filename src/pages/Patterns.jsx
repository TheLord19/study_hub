import { api } from '../lib/api.js';
import { useRefresh, useResource } from '../lib/useResource.jsx';
import { ALL_TOPICS, TOPIC_GROUPS, VERDICTS, DIFFICULTY, cfRank } from '../lib/constants.js';
import { Bar, Btn, Empty, Section, useToast } from '../components/ui.jsx';

const LOCK = 3;

function Cell({ topic, count, solo, next }) {
  const level = !count ? 0 : solo >= LOCK ? 4 : count >= 3 ? 3 : count >= 2 ? 2 : 1;
  const filled = level >= 3;
  return (
    <div
      className={`relative rounded border px-2.5 py-2 flex flex-col gap-0.5
        ${level === 0 ? 'bg-surface border-line' : ''}
        ${level === 1 ? 'bg-accent/15 border-transparent' : ''}
        ${level === 2 ? 'bg-accent/35 border-transparent' : ''}
        ${level === 3 ? 'bg-accent/70 border-transparent' : ''}
        ${level === 4 ? 'bg-accent border-transparent' : ''}
        ${next ? '!border-accent border-dashed' : ''}`}
    >
      {next && (
        <span className="absolute -top-2 right-2 font-mono text-[9px] uppercase tracking-wider font-bold
                         bg-accent text-onAccent px-1.5 rounded-sm">
          next up
        </span>
      )}
      <span className={`text-[12.5px] font-semibold leading-tight ${filled ? 'text-onAccent' : 'text-ink'}`}>
        {topic}
      </span>
      <span className={`font-mono text-[10.5px] tabular-nums ${filled ? 'text-onAccent/80' : 'text-ink3'}`}>
        {count ? `${count} solved · ${solo} solo` : 'not started'}
      </span>
    </div>
  );
}

export default function Patterns({ stats }) {
  const { tick } = useRefresh();
  const { data: notebook } = useResource(() => api.notebook(), [tick]);
  const toast = useToast();

  if (!stats) return <div className="text-ink3 text-[13px]">Loading…</div>;

  const byTopic = new Map(stats.topics.map((t) => [t.topic, t]));
  const firstUnstarted = ALL_TOPICS.find((t) => !(byTopic.get(t)?.total > 0));

  const vMax = Math.max(...stats.verdicts.map((v) => v.n), 1);
  const dMax = Math.max(...stats.difficulty.map((d) => d.n), 1);
  const cfMax = Math.max(...stats.cfBands.map((b) => b.n), 1);

  async function copyNotebook() {
    if (!notebook?.length) { toast('No key ideas written yet.'); return; }
    const md = `# Patterns notebook\n\n${notebook
      .map((t) => `## ${t.topic}\n\n${t.entries.map((e) => `- **${e.title}** — ${e.idea}`).join('\n')}`)
      .join('\n\n')}\n`;
    try {
      await navigator.clipboard.writeText(md);
      toast('Notebook copied as markdown.');
    } catch {
      toast("Couldn't reach the clipboard.");
    }
  }

  return (
    <>
      <Section title="Coverage" note={`A pattern locks at ${LOCK} unassisted solves`}>
        <div className="flex flex-col gap-5">
          {TOPIC_GROUPS.map((g) => {
            const locked = g.topics.filter((t) => (byTopic.get(t)?.solo ?? 0) >= LOCK).length;
            return (
              <div key={g.name}>
                <div className="flex items-baseline gap-2.5 mb-2">
                  <h3 className="text-[12px] font-bold uppercase tracking-[0.1em] text-ink2">{g.name}</h3>
                  <span className="font-mono text-[11px] text-ink3">{locked}/{g.topics.length} locked</span>
                </div>
                <div className="grid gap-1.5 [grid-template-columns:repeat(auto-fill,minmax(150px,1fr))]">
                  {g.topics.map((t) => {
                    const row = byTopic.get(t);
                    return (
                      <Cell key={t} topic={t} count={row?.total ?? 0} solo={row?.solo ?? 0}
                            next={t === firstUnstarted} />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="How you got there">
        <div className="grid md:grid-cols-2 gap-x-8 gap-y-7">
          <div>
            <h3 className="eyebrow mb-3">Verdicts</h3>
            <div className="flex flex-col gap-1.5">
              {Object.entries(VERDICTS).map(([v, meta]) => (
                <Bar
                  key={v} label={meta.label}
                  value={stats.verdicts.find((x) => x.verdict === v)?.n ?? 0}
                  max={vMax}
                  color={`rgb(var(--c-${v === 'stuck' ? 'ink-3' : v}))`}
                />
              ))}
            </div>
            <p className="text-[12px] text-ink3 mt-3 max-w-[46ch] leading-snug">
              The ratio here is the honest measure. A tall editorial bar next to a short solo bar
              means the reps are going in but the recall is not coming out.
            </p>
          </div>

          <div className="flex flex-col gap-7">
            <div>
              <h3 className="eyebrow mb-3">LeetCode difficulty</h3>
              <div className="flex flex-col gap-1.5">
                {Object.entries(DIFFICULTY).map(([d, label]) => (
                  <Bar key={d} label={label}
                       value={stats.difficulty.find((x) => x.difficulty === d)?.n ?? 0}
                       max={dMax}
                       color={`rgb(var(--c-cf-${d === 'easy' ? 'green' : d === 'med' ? 'orange' : 'red'}))`} />
                ))}
              </div>
            </div>

            <div>
              <h3 className="eyebrow mb-3">Codeforces ratings</h3>
              {stats.cfBands.length ? (
                <div className="flex flex-col gap-1.5">
                  {stats.cfBands.map((b) => (
                    <Bar key={b.rating} label={String(b.rating)} value={b.n} max={cfMax}
                         color={cfRank(b.rating).color} />
                  ))}
                </div>
              ) : (
                <Empty>No Codeforces problems logged yet.</Empty>
              )}
            </div>
          </div>
        </div>
      </Section>

      <Section
        title="Your notebook"
        note="Every key idea, grouped by topic. Read this before an interview."
        action={<Btn size="sm" variant="ghost" onClick={copyNotebook}>Copy as markdown</Btn>}
      >
        {notebook?.length ? (
          <div className="flex flex-col gap-5">
            {notebook.map((t) => (
              <div key={t.topic}>
                <h3 className="text-[12px] font-bold uppercase tracking-[0.09em] text-accent pb-1.5 mb-2 hairline">
                  {t.topic}
                </h3>
                <div className="flex flex-col gap-1.5">
                  {t.entries.map((e) => (
                    <div key={e.id} className="grid sm:grid-cols-[minmax(120px,220px)_1fr] gap-x-3.5 text-[13px]">
                      <span className="text-ink2 font-semibold">{e.title}</span>
                      <span className="text-ink">{e.idea}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <Empty>
            Empty for now. Write one line per problem — the trick, not the code — and after a hundred
            problems this page is a reference nobody else has.
          </Empty>
        )}
      </Section>
    </>
  );
}
