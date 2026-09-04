import { useState } from 'react';
import { api } from '../lib/api.js';
import { useRefresh, useResource } from '../lib/useResource.jsx';
import { lpa } from '../lib/constants.js';
import { Btn, Empty, Field, Panel, Section, Seg, Tag, useToast } from '../components/ui.jsx';

/* Applications.
 *
 * The uncomfortable arithmetic: preparation converts through a funnel with a
 * bad ratio, and the only way to find out yours is to record it. Somebody who
 * applies to three companies and is rejected by three has learned nothing about
 * whether they were ready; somebody who applied to twenty and reached four
 * onsites knows exactly which stage is leaking.
 */

const LIVE = new Set(['applied', 'oa', 'phone', 'onsite', 'hm']);
const DEAD = new Set(['rejected', 'ghosted']);

const STAGE_TONE = (s) =>
  s === 'offer' ? 'solo' : DEAD.has(s) ? 'stuck' : s === 'wishlist' ? 'plain' : 'hint';

function Funnel({ reached, stages }) {
  const path = ['applied', 'oa', 'phone', 'onsite', 'hm', 'offer'];
  const top = Math.max(reached.applied ?? 0, 1);

  return (
    <div className="grid gap-px bg-line border border-line rounded overflow-hidden
                    [grid-template-columns:repeat(auto-fit,minmax(112px,1fr))]">
      {path.map((id, i) => {
        const n = reached[id] ?? 0;
        const prev = i === 0 ? null : reached[path[i - 1]] ?? 0;
        const rate = prev ? Math.round((n / prev) * 100) : null;
        return (
          <div key={id} className="bg-surface px-3 py-3">
            <div className="stat-num text-[24px]">{n}</div>
            <div className="text-[12px] font-semibold mt-0.5">
              {stages.find((s) => s.id === id)?.label}
            </div>
            <div className="font-mono text-[10.5px] text-ink3 mt-0.5">
              {rate == null ? `${Math.round((n / top) * 100)}% of total` : `${rate}% carried`}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function AddForm({ companies, onDone }) {
  const toast = useToast();
  const [f, setF] = useState({ company_slug: '', company_name: '', role: '', ctc_lpa: '', source: '', stage: 'wishlist' });
  const [busy, setBusy] = useState(false);

  async function save() {
    setBusy(true);
    try {
      await api.addApplication(f);
      toast('Added to the pipeline');
      onDone();
    } catch (e) {
      toast(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <Panel className="p-4 mb-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Field label="From the catalogue">
          <select
            className="input"
            value={f.company_slug}
            onChange={(e) => setF({ ...f, company_slug: e.target.value })}
          >
            <option value="">— or type a name —</option>
            {companies.map((c) => (
              <option key={c.slug} value={c.slug}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Company">
          <input className="input" value={f.company_name} placeholder="Only if not in the list"
                 onChange={(e) => setF({ ...f, company_name: e.target.value })} />
        </Field>
        <Field label="Role">
          <input className="input" value={f.role} placeholder="SDE-2"
                 onChange={(e) => setF({ ...f, role: e.target.value })} />
        </Field>
        <Field label="Expected LPA">
          <input className="input" inputMode="decimal" value={f.ctc_lpa} placeholder="32"
                 onChange={(e) => setF({ ...f, ctc_lpa: e.target.value })} />
        </Field>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 mt-3">
        <Field label="How you got in">
          <input className="input" value={f.source} placeholder="referral from a friend · careers page · recruiter"
                 onChange={(e) => setF({ ...f, source: e.target.value })} />
        </Field>
        <Field label="Where it is now">
          <Seg
            size="sm"
            value={f.stage}
            onChange={(stage) => setF({ ...f, stage })}
            options={[
              { value: 'wishlist', label: 'Wishlist' },
              { value: 'applied', label: 'Applied' },
              { value: 'oa', label: 'OA' }
            ]}
          />
        </Field>
      </div>

      <div className="flex gap-2 mt-4">
        <Btn size="sm" onClick={save} disabled={busy || (!f.company_slug && !f.company_name.trim())}>
          {busy ? 'Saving…' : 'Add'}
        </Btn>
        <Btn size="sm" variant="quiet" onClick={onDone}>Cancel</Btn>
      </div>
    </Panel>
  );
}

function Row({ a, stages, onChange, onDelete }) {
  const [open, setOpen] = useState(false);
  const below = a.ctc_lpa == null ? null : a.ctc_lpa;

  return (
    <div className="bg-surface">
      <div className="px-4 py-3 flex flex-wrap items-baseline gap-x-3 gap-y-1.5">
        <button
          type="button"
          onClick={() => setOpen(!open)}
          className="text-[14.5px] font-bold hover:text-accent transition-colors text-left"
        >
          {a.company_name}
        </button>
        {a.role && <span className="text-[12.5px] text-ink3">{a.role}</span>}
        <Tag tone={STAGE_TONE(a.stage)}>
          {stages.find((s) => s.id === a.stage)?.label ?? a.stage}
        </Tag>
        {below != null && (
          <span className="font-mono text-[11px] text-ink2">{lpa(below)}</span>
        )}
        {a.next_on && (
          <span className="font-mono text-[10.5px] text-hint">next {a.next_on}</span>
        )}
        <span className="ml-auto font-mono text-[10.5px] text-ink3">
          {a.events.length} step{a.events.length === 1 ? '' : 's'}
        </span>
      </div>

      {open && (
        <div className="px-4 pb-4 border-t border-lineSoft pt-3">
          <span className="field-label">Move it to</span>
          <div className="flex flex-wrap gap-1.5 mt-2 mb-4">
            {stages.map((s) => (
              <Btn
                key={s.id}
                size="xs"
                variant={a.stage === s.id ? 'solid' : 'ghost'}
                onClick={() => onChange(a, { stage: s.id })}
              >
                {s.label}
              </Btn>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Next round on">
              <input
                className="input" type="date" defaultValue={a.next_on ?? ''}
                onBlur={(e) => e.target.value !== (a.next_on ?? '') && onChange(a, { next_on: e.target.value })}
              />
            </Field>
            <Field label="Expected LPA">
              <input
                className="input" inputMode="decimal" defaultValue={a.ctc_lpa ?? ''}
                onBlur={(e) => Number(e.target.value) !== a.ctc_lpa && onChange(a, { ctc_lpa: e.target.value })}
              />
            </Field>
          </div>

          <Field label="Notes" className="mt-3">
            <textarea
              className="input min-h-[62px] resize-y" defaultValue={a.notes ?? ''}
              placeholder="Who you spoke to, what they asked, what to fix before the next one."
              onBlur={(e) => e.target.value !== (a.notes ?? '') && onChange(a, { notes: e.target.value })}
            />
          </Field>

          {!!a.events.length && (
            <div className="mt-3">
              <span className="eyebrow">History</span>
              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1.5 font-mono text-[11px] text-ink3">
                {a.events.map((e) => (
                  <span key={e.id}>
                    {e.happened_on} {stages.find((s) => s.id === e.stage)?.label ?? e.stage}
                  </span>
                ))}
              </div>
            </div>
          )}

          <Btn size="xs" variant="quiet" className="mt-3" onClick={() => onDelete(a)}>delete</Btn>
        </div>
      )}
    </div>
  );
}

export default function Pipeline() {
  const { tick, refresh } = useRefresh();
  const toast = useToast();
  const { data, loading } = useResource(() => api.pipeline(), [tick]);
  const { data: cat } = useResource(() => api.companies(), [tick]);
  const [adding, setAdding] = useState(false);
  const [view, setView] = useState('live');

  if (loading || !data) return <div className="text-ink3 text-[13px]">Loading pipeline…</div>;

  async function change(a, patch) {
    try {
      await api.updateApplication(a.id, patch);
      refresh();
    } catch (e) {
      toast(e.message);
    }
  }

  async function remove(a) {
    await api.deleteApplication(a.id);
    toast('Removed');
    refresh();
  }

  const apps = data.applications.filter((a) => {
    if (view === 'live') return LIVE.has(a.stage);
    if (view === 'wishlist') return a.stage === 'wishlist';
    if (view === 'closed') return DEAD.has(a.stage) || a.stage === 'offer';
    return true;
  });

  const liveCount = data.applications.filter((a) => LIVE.has(a.stage)).length;

  return (
    <>
      <Section
        title="Pipeline"
        note={`${liveCount} live · ${data.applications.length} total`}
        action={adding ? null : <Btn size="sm" onClick={() => setAdding(true)}>Add</Btn>}
      >
        <p className="text-[13.5px] text-ink2 -mt-1 mb-5 max-w-[66ch] leading-relaxed">
          Preparation that never becomes an application is a hobby. The funnel below counts everything
          that has ever reached a stage, not what sits there now — a rejection after an onsite still
          proves you can reach onsites, and that is the number worth watching.
        </p>

        {adding && <AddForm companies={cat?.companies ?? []} onDone={() => { setAdding(false); refresh(); }} />}

        <Funnel reached={data.reached} stages={data.stages} />

        {data.reached.applied > 0 && data.reached.onsite === 0 && data.reached.applied >= 5 && (
          <p className="text-[12.5px] text-hint mt-3 max-w-[66ch] leading-snug">
            {data.reached.applied} applications and no onsite yet. That is usually a resume or referral
            problem rather than a preparation one — worth fixing before adding another month of practice.
          </p>
        )}
      </Section>

      <Section title="Applications">
        <div className="flex flex-wrap gap-1.5 mb-4">
          <Seg
            size="sm"
            value={view}
            onChange={setView}
            options={[
              { value: 'live', label: `Live ${liveCount}` },
              { value: 'wishlist', label: 'Wishlist' },
              { value: 'closed', label: 'Closed' },
              { value: 'all', label: 'All' }
            ]}
          />
        </div>

        {apps.length ? (
          <div className="grid gap-px bg-line border border-line rounded overflow-hidden">
            {apps.map((a) => (
              <Row key={a.id} a={a} stages={data.stages} onChange={change} onDelete={remove} />
            ))}
          </div>
        ) : (
          <Empty>
            {view === 'live'
              ? 'Nothing live. Applications are the only step that can actually produce an offer — add one.'
              : 'Nothing here.'}
          </Empty>
        )}
      </Section>
    </>
  );
}
