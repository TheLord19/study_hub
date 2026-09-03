import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { VERDICTS, DIFFICULTY, cfRank } from '../lib/constants.js';

/* ------------------------------------------------------------------ tags -- */

const TONE = {
  solo: 'bg-solo/15 text-solo border-transparent font-bold',
  hint: 'bg-hint/15 text-hint border-transparent font-bold',
  edtl: 'bg-edtl/15 text-edtl border-transparent font-bold',
  stuck: 'bg-raised text-ink2 border-ink3 font-bold',
  plain: 'bg-raised text-ink2 border-lineSoft',
  topic: 'bg-transparent text-ink3 border-line',
  accent: 'bg-accent/15 text-accent border-transparent font-bold'
};

export function Tag({ tone = 'plain', style, title, children }) {
  return (
    <span
      title={title}
      style={style}
      className={`font-mono text-2xs tracking-[0.03em] px-1.5 py-px rounded-sm border whitespace-nowrap ${TONE[tone] ?? TONE.plain}`}
    >
      {children}
    </span>
  );
}

export function VerdictTag({ verdict }) {
  const v = VERDICTS[verdict];
  if (!v) return null;
  return <Tag tone={v.tone}>{v.tag}</Tag>;
}

export function PlatformTag({ problem }) {
  if (problem.platform === 'cf') return <Tag>{problem.ref ?? `CF ${String(problem.key ?? '').slice(3)}`}</Tag>;
  if (problem.platform === 'lc') return <Tag>LC</Tag>;
  return null;
}

export function DifficultyTag({ problem }) {
  const rating = problem.cf_rating;
  if (rating) {
    const r = cfRank(rating);
    return (
      <span
        title={r.name}
        style={{ color: r.color, borderColor: 'currentColor' }}
        className="font-mono text-2xs font-bold px-1.5 py-px rounded-sm border bg-transparent whitespace-nowrap"
      >
        {rating}
      </span>
    );
  }
  if (problem.difficulty) return <Tag>{DIFFICULTY[problem.difficulty]}</Tag>;
  return null;
}

/* --------------------------------------------------------------- buttons -- */

const BTN = {
  solid: 'bg-accent text-onAccent border-accent hover:opacity-90',
  ghost: 'bg-surface text-ink2 border-line hover:text-ink hover:border-ink3',
  quiet: 'bg-transparent text-ink3 border-transparent hover:text-ink hover:bg-raised'
};
const SIZE = {
  md: 'px-5 py-2 text-[13.5px] font-bold',
  sm: 'px-3 py-1.5 text-[12px] font-semibold',
  xs: 'px-2 py-0.5 text-[11px] font-medium font-mono'
};

export function Btn({ variant = 'solid', size = 'md', className = '', as, ...props }) {
  const Cmp = as ?? 'button';
  return (
    <Cmp
      {...(Cmp === 'button' ? { type: props.type ?? 'button' } : null)}
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded border whitespace-nowrap
        transition-colors disabled:opacity-40 disabled:cursor-not-allowed no-underline
        ${BTN[variant]} ${SIZE[size]} ${className}`}
    />
  );
}

/* Segmented control. `tones` colours the selected state per option — used to
   make the verdict buttons carry their own meaning. */
export function Seg({ options, value, onChange, tones, size = 'md' }) {
  const pad = size === 'sm' ? 'px-2.5 py-1 text-[11.5px]' : 'px-3 py-1.5 text-[12.5px]';
  return (
    <div className="inline-flex border border-line rounded overflow-hidden w-max max-w-full">
      {options.map((o, i) => {
        const on = o.value === value;
        const tone = tones?.[o.value];
        return (
          <button
            key={o.value}
            type="button"
            aria-pressed={on}
            onClick={() => onChange(o.value)}
            style={on && tone ? { background: tone, color: 'rgb(var(--c-on-accent))' } : undefined}
            className={`${pad} font-semibold transition-colors ${i > 0 ? 'border-l border-line' : ''}
              ${on ? (tone ? '' : 'bg-accent text-onAccent') : 'bg-surface text-ink2 hover:bg-raised hover:text-ink'}`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

export function Chip({ on, children, ...props }) {
  return (
    <button
      type="button"
      aria-pressed={!!on}
      {...props}
      className={`rounded-full border px-2.5 py-1 text-[12px] transition-colors
        ${on
          ? 'bg-accent border-accent text-onAccent font-semibold'
          : 'bg-surface border-line text-ink2 hover:text-ink hover:border-ink3'}`}
    >
      {children}
    </button>
  );
}

/* ---------------------------------------------------------------- layout -- */

export function Field({ label, htmlFor, className = '', children }) {
  return (
    <div className={`flex flex-col gap-1.5 min-w-0 ${className}`}>
      {label && <label htmlFor={htmlFor} className="field-label">{label}</label>}
      {children}
    </div>
  );
}

export function SectionHead({ title, note, children }) {
  return (
    <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1 pb-2.5 mb-3.5 hairline">
      <h2 className="text-[13px] font-bold uppercase tracking-[0.11em]">{title}</h2>
      {note && <span className="text-[12px] text-ink3 ml-auto text-right">{note}</span>}
      {children}
    </div>
  );
}

export function Section({ title, note, children, action }) {
  return (
    <section className="mt-9 first:mt-0">
      <SectionHead title={title} note={note}>{action}</SectionHead>
      {children}
    </section>
  );
}

export function Panel({ className = '', children }) {
  return <div className={`bg-surface border border-line rounded ${className}`}>{children}</div>;
}

export function Empty({ children }) {
  return (
    <div className="border border-dashed border-line rounded bg-surface px-4 py-5 text-[13px] text-ink3">
      {children}
    </div>
  );
}

export function Rows({ children }) {
  return <div className="bg-surface border border-line rounded overflow-hidden">{children}</div>;
}

export function Bar({ label, value, max, color = 'rgb(var(--c-accent))' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className="grid grid-cols-[88px_1fr_34px] items-center gap-2.5">
      <span className="font-mono text-[11.5px] text-ink2 text-right truncate">{label}</span>
      <div className="h-3.5 bg-raised rounded-sm overflow-hidden">
        <div className="h-full rounded-sm min-w-[2px]" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="font-mono text-[11.5px] text-ink2 tabular-nums">{value}</span>
    </div>
  );
}

export function Progress({ value, max, className = '' }) {
  const pct = max > 0 ? Math.round((value / max) * 100) : 0;
  return (
    <div className={`h-1.5 bg-raised rounded-sm overflow-hidden ${className}`}>
      <div className="h-full bg-accent rounded-sm" style={{ width: `${pct}%` }} />
    </div>
  );
}

/* ---------------------------------------------------------------- toasts -- */

const ToastCtx = createContext(() => {});
export const useToast = () => useContext(ToastCtx);

export function ToastHost({ children }) {
  const [msg, setMsg] = useState(null);

  const push = useCallback((text) => {
    setMsg({ text, id: Date.now() });
    setTimeout(() => setMsg((m) => (m && Date.now() - m.id >= 3200 ? null : m)), 3400);
  }, []);

  const value = useMemo(() => push, [push]);

  return (
    <ToastCtx.Provider value={value}>
      {children}
      {msg && (
        <div
          role="status"
          className="fixed left-1/2 -translate-x-1/2 bottom-6 z-50 max-w-[calc(100vw-2rem)]
                     bg-ink text-ground px-4 py-2.5 rounded text-[13px] font-semibold text-center shadow-lg"
        >
          {msg.text}
        </div>
      )}
    </ToastCtx.Provider>
  );
}
