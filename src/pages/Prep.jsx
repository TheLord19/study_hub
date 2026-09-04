import { useEffect, useMemo, useRef, useState } from 'react';
import { api } from '../lib/api.js';
import { useRefresh, useResource } from '../lib/useResource.jsx';
import { TRACK_VERDICTS, AXIS_COLOR } from '../lib/constants.js';
import { Btn, Chip, Empty, Progress, Section, Seg, Tag, useToast } from '../components/ui.jsx';

/* System design, machine coding and behavioural share this page.
 *
 * They are the same object — a prompt, a time budget, and a list of the points
 * a strong answer reaches — so they get one component rather than three that
 * drift apart. What changes per track is only the wording of the verdicts and
 * what "attempting" means, both of which come from the track itself.
 */

const VERDICT_TONE = { solo: 'solo', hint: 'hint', edtl: 'edtl', stuck: 'stuck' };

/* ------------------------------------------------------------------ timer -- */

/* Counts up, not down. A round does not stop at the buzzer, and knowing you
 * ran twelve minutes over is more useful than a zero. */
function Timer({ budget, onStop }) {
  const [running, setRunning] = useState(false);
  const [secs, setSecs] = useState(0);
  const started = useRef(null);

  useEffect(() => {
    if (!running) return undefined;
    const id = setInterval(() => setSecs(Math.round((Date.now() - started.current) / 1000)), 500);
    return () => clearInterval(id);
  }, [running]);

  const mins = Math.floor(secs / 60);
  const over = budget && mins > budget;
  const label = `${String(mins).padStart(2, '0')}:${String(secs % 60).padStart(2, '0')}`;

  return (
    <div className="flex items-center gap-2">
      <span
        className={`stat-num text-[19px] tabular-nums ${over ? 'text-edtl' : running ? 'text-ink' : 'text-ink3'}`}
        title={budget ? `The real round gives you ${budget} minutes` : undefined}
      >
        {label}
      </span>
      {budget ? <span className="font-mono text-[10.5px] text-ink3">/ {budget}m</span> : null}
      {!running ? (
        <Btn
          size="xs"
          variant="ghost"
          onClick={() => { started.current = Date.now() - secs * 1000; setRunning(true); }}
        >
          {secs ? 'resume' : 'start'}
        </Btn>
      ) : (
        <Btn
          size="xs"
          variant="ghost"
          onClick={() => { setRunning(false); onStop?.(mins); }}
        >
          stop
        </Btn>
      )}
      {secs > 0 && !running && (
        <button
          type="button"
          onClick={() => setSecs(0)}
          className="font-mono text-[10.5px] text-ink3 hover:text-ink"
        >
          reset
        </button>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- item -- */

function Item({ item, track, open, onToggle, onLogged }) {
  const toast = useToast();
  const [hit, setHit] = useState(() => new Set(item.last?.hit ?? []));
  const [verdict, setVerdict] = useState(null);
  const [minutes, setMinutes] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);

  const words = TRACK_VERDICTS[track];
  const last = item.last;
  const covered = hit.size;
  const total = item.checklist.length;

  async function log() {
    if (!verdict) return;
    setBusy(true);
    try {
      await api.logAttempt(item.key, {
        verdict,
        minutes: minutes === '' ? null : Number(minutes),
        notes,
        hit: [...hit]
      });
      toast(`Logged — ${item.title}`);
      setVerdict(null);
      setNotes('');
      setMinutes('');
      onLogged();
    } catch (e) {
      toast(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="bg-surface">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full text-left px-4 py-3 flex items-start gap-3 hover:bg-raised transition-colors"
      >
        <span
          className="mt-[7px] w-1.5 h-1.5 rounded-full shrink-0"
          style={{
            background: last ? AXIS_COLOR[track] : 'rgb(var(--c-line))',
            opacity: last ? (last.verdict === 'solo' ? 1 : 0.5) : 1
          }}
        />

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
            <span className="text-[14.5px] font-bold">{item.title}</span>
            {item.weight === 3 && <Tag tone="accent">ASKED A LOT</Tag>}
            {last && <Tag tone={VERDICT_TONE[last.verdict]}>{words[last.verdict]}</Tag>}
            {item.attempts > 1 && (
              <span className="font-mono text-[10.5px] text-ink3">×{item.attempts}</span>
            )}
            <span className="ml-auto font-mono text-[10.5px] text-ink3 whitespace-nowrap">
              {item.minutes}m
            </span>
          </span>
          <span className="block text-[13px] text-ink2 leading-snug mt-1 pr-4">{item.prompt}</span>
          {last?.due_on && (
            <span className="block font-mono text-[10.5px] text-ink3 mt-1">
              due {last.due_on}
            </span>
          )}
        </span>
      </button>

      {open && (
        <div className="px-4 pb-4 pt-1 border-t border-lineSoft">
          <div className="flex flex-wrap items-center gap-3 justify-between mb-3">
            <p className="eyebrow">A strong answer reaches</p>
            <Timer budget={item.minutes} onStop={(m) => setMinutes(String(m))} />
          </div>

          {/* The checklist is the point of the page: it is the difference
              between having watched a video and being able to hold the room. */}
          <ul className="flex flex-col gap-1.5 mb-4">
            {item.checklist.map((c, i) => {
              const on = hit.has(i);
              return (
                <li key={c}>
                  <button
                    type="button"
                    aria-pressed={on}
                    onClick={() =>
                      setHit((prev) => {
                        const next = new Set(prev);
                        if (next.has(i)) next.delete(i); else next.add(i);
                        return next;
                      })
                    }
                    className="w-full text-left flex items-start gap-2.5 group"
                  >
                    <span
                      className={`mt-[3px] w-3.5 h-3.5 rounded-sm border shrink-0 grid place-items-center
                        transition-colors ${on ? 'border-transparent' : 'border-line group-hover:border-ink3'}`}
                      style={on ? { background: AXIS_COLOR[track] } : undefined}
                    >
                      {on && (
                        <svg viewBox="0 0 10 10" className="w-2.5 h-2.5" aria-hidden="true">
                          <path d="M1.5 5.2 L4 7.5 L8.5 2.5" fill="none"
                                stroke="rgb(var(--c-on-accent))" strokeWidth="1.8"
                                strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      )}
                    </span>
                    <span className={`text-[13px] leading-snug ${on ? 'text-ink' : 'text-ink2'}`}>{c}</span>
                  </button>
                </li>
              );
            })}
          </ul>

          <div className="flex items-center gap-2.5 mb-4">
            <Progress value={covered} max={total} className="flex-1" />
            <span className="font-mono text-[11px] text-ink3 tabular-nums whitespace-nowrap">
              {covered}/{total}
            </span>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div className="flex flex-col gap-1.5">
              <span className="field-label">How did it go</span>
              <Seg
                size="sm"
                value={verdict}
                onChange={setVerdict}
                options={Object.entries(words).map(([id, label]) => ({ value: id, label }))}
                tones={{
                  solo: 'rgb(var(--c-solo))',
                  hint: 'rgb(var(--c-hint))',
                  edtl: 'rgb(var(--c-edtl))'
                }}
              />
            </div>

            <div className="flex flex-col gap-1.5 w-[86px]">
              <label className="field-label" htmlFor={`m-${item.key}`}>Minutes</label>
              <input
                id={`m-${item.key}`}
                className="input"
                inputMode="numeric"
                placeholder={String(item.minutes)}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value.replace(/\D/g, ''))}
              />
            </div>
          </div>

          <textarea
            className="input mt-3 min-h-[62px] resize-y"
            placeholder={
              track === 'bhv'
                ? 'Which story did you use, and where did it get thin?'
                : 'What did you miss, and what would you open with next time?'
            }
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
          />

          <div className="flex items-center gap-3 mt-3">
            <Btn onClick={log} disabled={!verdict || busy} size="sm">
              {busy ? 'Saving…' : 'Log attempt'}
            </Btn>
            {last?.notes && (
              <span className="text-[12.5px] text-ink3 truncate" title={last.notes}>
                last time: {last.notes}
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------- page -- */

export default function Prep({ track }) {
  const { tick, refresh } = useRefresh();
  const { data, loading } = useResource(() => api.prep(track), [track, tick]);
  const [open, setOpen] = useState(null);
  const [filter, setFilter] = useState('all');

  useEffect(() => { setOpen(null); }, [track]);

  const stats = useMemo(() => {
    const items = data?.items ?? [];
    return {
      total: items.length,
      touched: items.filter((i) => i.last).length,
      solid: items.filter((i) => i.last?.verdict === 'solo').length,
      due: items.filter((i) => i.last?.due_on && i.last.due_on <= new Date().toISOString().slice(0, 10)).length
    };
  }, [data]);

  if (loading || !data) return <div className="text-ink3 text-[13px]">Loading…</div>;

  const today = new Date().toISOString().slice(0, 10);
  const match = (i) => {
    if (filter === 'untouched') return !i.last;
    if (filter === 'due') return i.last?.due_on && i.last.due_on <= today;
    if (filter === 'weak') return i.last && i.last.verdict !== 'solo';
    if (filter === 'top') return i.weight === 3;
    return true;
  };

  return (
    <Section
      title={data.track.label}
      note={`${stats.solid} solid · ${stats.touched}/${stats.total} attempted`}
    >
      <p className="text-[13.5px] text-ink2 -mt-1 mb-5 max-w-[64ch] leading-relaxed">
        {data.track.blurb}
      </p>

      <div className="flex flex-wrap gap-1.5 mb-6">
        {[
          ['all', `All ${stats.total}`],
          ['top', 'Asked a lot'],
          ['untouched', `Not attempted ${stats.total - stats.touched}`],
          ['weak', 'Not solid yet'],
          ['due', `Due ${stats.due}`]
        ].map(([id, label]) => (
          <Chip key={id} on={filter === id} onClick={() => setFilter(id)}>{label}</Chip>
        ))}
      </div>

      <div className="flex flex-col gap-8">
        {data.tiers.map((tier) => {
          const items = data.items.filter((i) => i.tier === tier.id && match(i));
          if (!items.length) return null;
          const done = data.items.filter((i) => i.tier === tier.id && i.last?.verdict === 'solo').length;
          const all = data.items.filter((i) => i.tier === tier.id).length;

          return (
            <div key={tier.id}>
              <div className="flex items-baseline gap-3 mb-1.5">
                <h3 className="eyebrow">{tier.label}</h3>
                <span className="font-mono text-[10.5px] text-ink3 ml-auto tabular-nums">
                  {done}/{all} solid
                </span>
              </div>
              <p className="text-[12.5px] text-ink3 leading-snug mb-3 max-w-[68ch]">{tier.note}</p>

              <div className="grid gap-px bg-line border border-line rounded overflow-hidden">
                {items.map((i) => (
                  <Item
                    key={i.key}
                    item={i}
                    track={track}
                    open={open === i.key}
                    onToggle={() => setOpen(open === i.key ? null : i.key)}
                    onLogged={refresh}
                  />
                ))}
              </div>
            </div>
          );
        })}

        {!data.items.some(match) && <Empty>Nothing matches that filter.</Empty>}
      </div>
    </Section>
  );
}
