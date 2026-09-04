import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useRefresh, useResource } from '../lib/useResource.jsx';
import { AXES, AXIS_COLOR, lpa, pct } from '../lib/constants.js';
import { Btn, Empty, Field, Panel, Section, Tag, useToast } from '../components/ui.jsx';

/* The target, and whether you are on it.
 *
 * Everything on this page is arithmetic over the loop weights in the catalogue
 * and the verdicts you have logged. None of it is encouraging by construction:
 * if four months of algorithms have moved a number that is 44% of the decision,
 * the honest thing is to say so on the first screen, because the alternative is
 * finding out in an interview.
 */

function BigNumber({ value, label, note, tone }) {
  return (
    <div>
      <div className="stat-num text-[46px] leading-[0.95]" style={tone ? { color: tone } : undefined}>
        {value}
      </div>
      <div className="eyebrow mt-1.5">{label}</div>
      {note && <div className="text-[12.5px] text-ink3 mt-1 leading-snug">{note}</div>}
    </div>
  );
}

/* One axis: how covered you are, how much it is worth, and — the number that
 * actually decides what you do next — how many points it is costing you. */
function AxisRow({ id, coverage, weight, deficit, rank, count }) {
  const meta = AXES.find((a) => a.id === id);
  const color = AXIS_COLOR[id];

  return (
    <Link
      to={meta.to}
      className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1.5 px-4 py-3.5 bg-surface no-underline
                 hover:bg-raised transition-colors group"
    >
      <div className="flex items-baseline gap-2 min-w-0">
        <span className="text-[14px] font-bold group-hover:text-accent transition-colors">
          {meta.label}
        </span>
        <span className="font-mono text-[10.5px] text-ink3">{weight}% of the loop</span>
        {rank === 0 && <Tag tone="edtl">COSTING YOU MOST</Tag>}
      </div>

      <span className="stat-num text-[17px] tabular-nums" style={{ color }}>
        {pct(coverage)}
      </span>

      <div className="col-span-2 h-2 bg-raised rounded-sm overflow-hidden flex">
        {/* Filled portion is what you have; the ghost is what this axis is
            worth in total, so a wide-but-empty bar reads as expensive. */}
        <div
          className="h-full rounded-sm"
          style={{ width: `${coverage * weight}%`, background: color }}
        />
        <div
          className="h-full"
          style={{ width: `${(1 - coverage) * weight}%`, background: color, opacity: 0.16 }}
        />
      </div>

      <span className="col-span-2 font-mono text-[10.5px] text-ink3">
        {count} items · {Math.round(deficit * 100)} points on the table
      </span>
    </Link>
  );
}

function TargetForm({ settings, onDone }) {
  const toast = useToast();
  const [f, setF] = useState({
    currentCtc: settings?.currentCtc ?? '',
    targetCtc: settings?.targetCtc ?? 30,
    targetDate: settings?.targetDate ?? ''
  });
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await api.saveSettings({
        currentCtc: f.currentCtc === '' ? null : Number(f.currentCtc),
        targetCtc: Number(f.targetCtc),
        targetDate: f.targetDate || null
      });
      toast('Target saved');
      onDone();
    } catch (e) {
      toast(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel className="p-4 mb-6">
      <div className="grid gap-3 sm:grid-cols-3">
        <Field label="Where you are now (LPA)">
          <input className="input" inputMode="decimal" value={f.currentCtc}
                 onChange={(e) => setF({ ...f, currentCtc: e.target.value })} placeholder="4.5" />
        </Field>
        <Field label="Where you are going (LPA)">
          <input className="input" inputMode="decimal" value={f.targetCtc}
                 onChange={(e) => setF({ ...f, targetCtc: e.target.value })} placeholder="30" />
        </Field>
        <Field label="By when">
          <input className="input" type="date" value={f.targetDate}
                 onChange={(e) => setF({ ...f, targetDate: e.target.value })} />
        </Field>
      </div>
      <div className="flex gap-2 mt-3">
        <Btn size="sm" onClick={save} disabled={busy}>{busy ? 'Saving…' : 'Save'}</Btn>
        <Btn size="sm" variant="quiet" onClick={onDone}>Cancel</Btn>
      </div>
    </Panel>
  );
}

export default function Plan() {
  const { tick, refresh } = useRefresh();
  const { data: r, loading } = useResource(() => api.readiness(), [tick]);
  const { data: settings } = useResource(() => api.settings(), [tick]);
  const [editing, setEditing] = useState(false);

  if (loading || !r) return <div className="text-ink3 text-[13px]">Working out where you are…</div>;

  const { pace } = r;
  const jump = settings?.currentCtc ? (r.targetCtc / settings.currentCtc) : null;
  const reachable = r.companies.filter((c) => c.clearsTarget);
  const best = r.companies.filter((c) => c.clearsTarget).slice(0, 12);

  return (
    <>
      <Section
        title="The plan"
        action={editing ? null : <Btn size="sm" variant="ghost" onClick={() => setEditing(true)}>Edit target</Btn>}
      >
        {editing && <TargetForm settings={settings} onDone={() => { setEditing(false); refresh(); }} />}

        <div className="grid gap-6 sm:grid-cols-3 mb-7">
          <BigNumber
            value={pct(r.overall)}
            label="Ready for the target"
            tone={AXIS_COLOR[r.order[0]]}
            note={
              r.poolIsTargets
                ? `Weighted across the ${r.poolSize} companies you are targeting.`
                : `Weighted across the ${r.poolSize} companies in the catalogue whose band reaches ${lpa(r.targetCtc)}.`
            }
          />
          <BigNumber
            value={settings?.currentCtc ? `${lpa(settings.currentCtc)}→${lpa(r.targetCtc)}` : lpa(r.targetCtc)}
            label="The jump"
            note={jump ? `${jump.toFixed(1)}× your current package. ${reachable.length} companies here clear it.` : `${reachable.length} companies here clear it.`}
          />
          <BigNumber
            value={pace.weeks != null ? `${pace.weeks}w` : '—'}
            label={pace.weeks != null ? 'Left' : 'No date set'}
            note={
              pace.weeks != null
                ? `${pace.targetDate}. Everything below is divided by this.`
                : 'Set one — an untimed plan is a wish, and the weekly rate below needs a denominator.'
            }
          />
        </div>

        {/* ------------------------------------------------------------ axes */}
        <h3 className="eyebrow mb-2.5">Where the gap is</h3>
        <p className="text-[13px] text-ink2 mb-3 max-w-[68ch] leading-relaxed">
          Ordered by what each axis is costing you, not by which score is lowest — a weak axis worth
          10% of the loop matters less than a middling one worth 35%. Algorithms are{' '}
          <b className="text-ink">{Math.round(r.blend.dsa)}%</b> of the decision at the companies you are
          chasing. The other {100 - Math.round(r.blend.dsa)}% is the three tracks below it.
        </p>

        <div className="grid gap-px bg-line border border-line rounded overflow-hidden">
          {r.order.map((id, i) => (
            <AxisRow
              key={id}
              id={id}
              rank={i}
              coverage={r.axis[id]}
              weight={Math.round(r.blend[id])}
              deficit={r.deficit[id]}
              count={pace.counts[id]}
            />
          ))}
        </div>

        {/* ------------------------------------------------------------ pace */}
        {pace.weeks > 0 && (
          <div className="mt-7">
            <h3 className="eyebrow mb-2.5">What that is per week</h3>
            <div className="grid gap-px bg-line border border-line rounded overflow-hidden
                            [grid-template-columns:repeat(auto-fit,minmax(150px,1fr))]">
              {AXES.map((a) => (
                <div key={a.id} className="bg-surface px-4 py-3.5">
                  <div className="stat-num text-[26px]" style={{ color: AXIS_COLOR[a.id] }}>
                    {pace.perWeek[a.id] ?? '—'}
                  </div>
                  <div className="text-[12.5px] font-semibold mt-0.5">{a.label}</div>
                  <div className="font-mono text-[10.5px] text-ink3 mt-0.5">
                    {pace.remaining[a.id]} left / {pace.weeks}w
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[12.5px] text-ink3 mt-2.5 max-w-[68ch] leading-snug">
              This assumes every item gets one clean unaided pass. It is a floor, not a schedule —
              spaced review on top of it is what makes the first pass stick, and that is what the
              due count on Today is for.
            </p>
          </div>
        )}
      </Section>

      {/* ------------------------------------------------------- companies */}
      <Section
        title="Readiness by company"
        note={`${reachable.length} clear ${lpa(r.targetCtc)}`}
      >
        <p className="text-[13.5px] text-ink2 -mt-1 mb-5 max-w-[66ch] leading-relaxed">
          Each company scored against its own loop, not a generic one. Being 70% ready for Google
          says nothing about Swiggy — one is almost pure algorithms, the other is a third machine
          coding. The weak column is the axis costing you the most points there.
        </p>

        {best.length ? (
          <div className="border border-line rounded overflow-hidden overflow-x-auto">
            <table className="w-full text-[13px] bg-surface">
              <thead>
                <tr className="border-b border-line">
                  {['Company', 'Band', 'Ready', 'Weakest there', 'Loop'].map((h, i) => (
                    <th key={h} className={`px-3 py-2 eyebrow ${i > 1 ? 'text-right' : 'text-left'}`}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {best.map((c) => (
                  <tr key={c.slug} className="border-b border-lineSoft last:border-0 hover:bg-raised">
                    <td className="px-3 py-2">
                      <Link to={`/companies/${c.slug}`} className="font-semibold no-underline hover:text-accent">
                        {c.name}
                      </Link>
                      {c.targeted && <Tag tone="accent">TARGET</Tag>}
                    </td>
                    <td className="px-3 py-2 font-mono text-[11.5px] text-ink3 whitespace-nowrap">
                      {lpa(c.ctc[0])}–{lpa(c.ctc[1])}
                    </td>
                    <td className="px-3 py-2 text-right stat-num tabular-nums"
                        style={{ color: AXIS_COLOR[c.weakest] }}>
                      {pct(c.score)}
                    </td>
                    <td className="px-3 py-2 text-right text-[12.5px]">
                      {AXES.find((a) => a.id === c.weakest)?.label}
                    </td>
                    <td className="px-3 py-2">
                      <div className="flex h-2.5 w-[104px] ml-auto rounded-sm overflow-hidden">
                        {AXES.map((a) => (
                          <span
                            key={a.id}
                            title={`${a.label} ${c.weights[a.id]}%`}
                            style={{ width: `${c.weights[a.id]}%`, background: AXIS_COLOR[a.id],
                                     opacity: 0.3 + c.axis[a.id] * 0.7 }}
                          />
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Empty>No company in the catalogue reaches that band. Lower the target or add one.</Empty>
        )}

        <p className="text-[12px] text-ink3 mt-3 leading-snug max-w-[66ch]">
          Bands are realistic total-comp ranges for a 1–3 year SDE hire in India, not the outlier
          screenshots. Treat them as the shape of the market, and verify against a live offer before
          you make a decision on one.
        </p>
      </Section>
    </>
  );
}
