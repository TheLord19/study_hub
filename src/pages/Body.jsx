import { useState } from 'react';
import { api } from '../lib/api.js';
import { useRefresh, useResource } from '../lib/useResource.jsx';
import { todayYmd, shortDate, pace, duration } from '../lib/format.js';
import { LineChart, BarChart } from '../components/Chart.jsx';
import { Btn, DeleteBtn, Empty, Field, Panel, Rows, Section, Tag, useToast } from '../components/ui.jsx';

/* Monday-anchored weeks, so a "week" means the same thing every time. */
function weekKey(ymd) {
  const [y, m, d] = ymd.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  const dow = (dt.getDay() + 6) % 7;
  dt.setDate(dt.getDate() - dow);
  return todayYmd(dt);
}

function Stat({ value, unit, label }) {
  return (
    <div className="px-4 py-3.5 border-r border-lineSoft last:border-r-0
                    [&:nth-child(2)]:border-r-0 sm:[&:nth-child(2)]:border-r
                    [&:nth-child(-n+2)]:border-b sm:[&:nth-child(-n+2)]:border-b-0">
      <div className="flex items-baseline gap-1">
        <span className="stat-num text-[28px] leading-none">{value}</span>
        {unit && <span className="font-mono text-[11px] text-ink3">{unit}</span>}
      </div>
      <span className="eyebrow block mt-1.5">{label}</span>
    </div>
  );
}

export default function Body() {
  const { tick, bump } = useRefresh();
  const { data, loading } = useResource(() => api.bodySummary(), [tick]);
  const toast = useToast();

  const [run, setRun] = useState({ ran_on: todayYmd(), distance_km: '', duration_min: '', avg_hr: '', notes: '' });
  const [wt, setWt] = useState({ measured_on: todayYmd(), weight_kg: '', note: '' });

  async function addRun(e) {
    e.preventDefault();
    try {
      await api.addRun({ ...run, distance_km: Number(run.distance_km), duration_min: Number(run.duration_min) });
      toast(`Logged ${run.distance_km} km.`);
      setRun({ ran_on: todayYmd(), distance_km: '', duration_min: '', avg_hr: '', notes: '' });
      bump();
    } catch (err) { toast(err.message); }
  }

  async function addWeight(e) {
    e.preventDefault();
    try {
      await api.addWeight({ ...wt, weight_kg: Number(wt.weight_kg) });
      toast(`Logged ${wt.weight_kg} kg.`);
      setWt({ measured_on: todayYmd(), weight_kg: '', note: '' });
      bump();
    } catch (err) { toast(err.message); }
  }

  async function removeRun(id) {
    try { await api.deleteRun(id); toast('Deleted.'); bump(); } catch (e) { toast(e.message); }
  }

  if (loading || !data) return <div className="text-ink3 text-[13px]">Loading…</div>;

  const weightPoints = data.weights.map((w) => ({ x: w.measured_on, y: w.weight_kg }));

  const weekly = new Map();
  for (const r of data.runs) {
    const k = weekKey(r.ran_on);
    weekly.set(k, (weekly.get(k) ?? 0) + r.distance_km);
  }
  const weekBars = [...weekly.entries()]
    .sort((a, b) => (a[0] < b[0] ? -1 : 1))
    .slice(-14)
    .map(([k, km]) => ({ x: k, y: Number(km.toFixed(1)), label: shortDate(k) }));

  const trend = data.weightChange;

  return (
    <>
      <Section title="Where the body is" note="Sleep and training move how well the rest of this works.">
        <div className="grid grid-cols-2 sm:grid-cols-4 bg-surface border border-line rounded overflow-hidden">
          <Stat value={data.weekKm} unit="km" label="This week" />
          <Stat value={data.runCount} label="Runs logged" />
          <Stat
            value={data.avgPace ? pace(data.avgPace, 1) : '—'}
            unit={data.avgPace ? '/km' : ''}
            label="Average pace"
          />
          <Stat
            value={data.weightNow ?? '—'}
            unit={data.weightNow ? 'kg' : ''}
            label={trend == null ? 'Weight' : `Weight · ${trend > 0 ? '+' : ''}${trend} kg`}
          />
        </div>
      </Section>

      <Section title="Log it">
        <div className="grid lg:grid-cols-2 gap-4">
          <Panel className="p-4">
            <h3 className="eyebrow mb-3">A run</h3>
            <form onSubmit={addRun} className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2.5">
                <Field label="Date" htmlFor="r-date" className="flex-[0_1_150px]">
                  <input id="r-date" type="date" className="input font-mono text-[12.5px]"
                         value={run.ran_on} onChange={(e) => setRun({ ...run, ran_on: e.target.value })} />
                </Field>
                <Field label="Distance (km)" htmlFor="r-km" className="flex-[1_1_110px]">
                  <input id="r-km" type="number" step="0.01" min="0.1" required className="input"
                         value={run.distance_km} onChange={(e) => setRun({ ...run, distance_km: e.target.value })}
                         placeholder="5.2" />
                </Field>
                <Field label="Time (min)" htmlFor="r-min" className="flex-[1_1_110px]">
                  <input id="r-min" type="number" step="0.1" min="1" required className="input"
                         value={run.duration_min} onChange={(e) => setRun({ ...run, duration_min: e.target.value })}
                         placeholder="31.5" />
                </Field>
                <Field label="Avg HR" htmlFor="r-hr" className="flex-[0_1_100px]">
                  <input id="r-hr" type="number" min="40" max="230" className="input"
                         value={run.avg_hr} onChange={(e) => setRun({ ...run, avg_hr: e.target.value })}
                         placeholder="158" />
                </Field>
              </div>
              <div className="flex gap-2.5 items-end">
                <Field label="Notes" htmlFor="r-note" className="flex-1">
                  <input id="r-note" className="input" value={run.notes}
                         onChange={(e) => setRun({ ...run, notes: e.target.value })}
                         placeholder="Easy pace, legs felt heavy" />
                </Field>
                <Btn type="submit" size="sm">Add run</Btn>
              </div>
            </form>
          </Panel>

          <Panel className="p-4">
            <h3 className="eyebrow mb-3">Weight</h3>
            <form onSubmit={addWeight} className="flex flex-col gap-3">
              <div className="flex flex-wrap gap-2.5">
                <Field label="Date" htmlFor="w-date" className="flex-[0_1_150px]">
                  <input id="w-date" type="date" className="input font-mono text-[12.5px]"
                         value={wt.measured_on} onChange={(e) => setWt({ ...wt, measured_on: e.target.value })} />
                </Field>
                <Field label="Weight (kg)" htmlFor="w-kg" className="flex-[1_1_120px]">
                  <input id="w-kg" type="number" step="0.1" min="20" max="300" required className="input"
                         value={wt.weight_kg} onChange={(e) => setWt({ ...wt, weight_kg: e.target.value })}
                         placeholder="72.4" />
                </Field>
              </div>
              <div className="flex gap-2.5 items-end">
                <Field label="Note" htmlFor="w-note" className="flex-1">
                  <input id="w-note" className="input" value={wt.note}
                         onChange={(e) => setWt({ ...wt, note: e.target.value })}
                         placeholder="Morning, before food" />
                </Field>
                <Btn type="submit" size="sm">Add weight</Btn>
              </div>
              <p className="text-[12px] text-ink3">
                One reading per day — logging twice corrects the day rather than adding noise.
              </p>
            </form>
          </Panel>
        </div>
      </Section>

      {/* Two charts, never one with twin axes: kilometres and kilograms share
          no scale and overlaying them would invent a relationship. */}
      <Section title="Weight over time" note={trend == null ? undefined : `${trend > 0 ? '+' : ''}${trend} kg since you started logging`}>
        <LineChart points={weightPoints} unit=" kg" label="Weight" />
      </Section>

      <Section title="Weekly distance" note="Monday-anchored weeks, last 14">
        <BarChart bars={weekBars} unit=" km" label="Distance" />
      </Section>

      <Section title="Runs" note={`${data.runs.length} logged`}>
        {data.runs.length ? (
          <Rows>
            {data.runs.slice().reverse().map((r) => (
              <div key={r.id} className="grid gap-x-3.5 gap-y-1.5 px-3.5 py-3 border-b border-lineSoft last:border-0
                                          grid-cols-1 sm:grid-cols-[86px_auto_auto_auto_1fr_auto] sm:items-center
                                          hover:bg-raised/50 transition-colors">
                <span className="font-mono text-[11.5px] text-ink3 tabular-nums">{shortDate(r.ran_on)}</span>
                <span className="stat-num text-[15px]">{r.distance_km}<span className="font-mono text-[10.5px] text-ink3 ml-0.5">km</span></span>
                <span className="font-mono text-[12px] text-ink2">{duration(r.duration_min)}</span>
                <span className="font-mono text-[12px] text-accent">{pace(r.duration_min, r.distance_km)}/km</span>
                <span className="text-[12.5px] text-ink3 truncate">
                  {r.avg_hr ? <Tag>{r.avg_hr} bpm</Tag> : null}
                  {r.source !== 'manual' && <Tag tone="accent">{r.source}</Tag>}
                  {r.notes ? <span className="ml-2">{r.notes}</span> : null}
                </span>
                <DeleteBtn onConfirm={() => removeRun(r.id)} />
              </div>
            ))}
          </Rows>
        ) : (
          <Empty>
            No runs yet. When you wire up the Garmin import, activities land here automatically —
            the table already carries a source column for exactly that.
          </Empty>
        )}
      </Section>
    </>
  );
}
