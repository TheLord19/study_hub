import { useState } from 'react';
import { api } from '../lib/api.js';
import { useRefresh, useResource } from '../lib/useResource.jsx';
import { shortDate } from '../lib/format.js';
import { BUILD_STATUS } from '../lib/constants.js';
import { Btn, Empty, Field, Panel, Rows, Section, Seg, Tag, useToast } from '../components/ui.jsx';

const STATUS_OPTS = BUILD_STATUS.map((s) => ({ value: s, label: s[0].toUpperCase() + s.slice(1) }));
const STATUS_TONE = { idea: 'plain', building: 'accent', shipped: 'solo', shelved: 'stuck' };

const EMPTY = { name: '', blurb: '', url: '', repo: '', status: 'building' };

export default function Builds() {
  const { tick, bump } = useRefresh();
  const { data: builds, loading } = useResource(() => api.builds(), [tick]);
  const [f, setF] = useState(EMPTY);
  const toast = useToast();

  async function submit(e) {
    e.preventDefault();
    if (!f.name.trim()) { toast('Give it a name.'); return; }
    try {
      await api.addBuild(f);
      toast('Added.');
      setF(EMPTY);
      bump();
    } catch (err) { toast(err.message); }
  }

  async function cycle(b) {
    const next = BUILD_STATUS[(BUILD_STATUS.indexOf(b.status) + 1) % BUILD_STATUS.length];
    try { await api.updateBuild(b.id, { status: next }); bump(); } catch (e) { toast(e.message); }
  }

  async function remove(id) {
    try { await api.deleteBuild(id); toast('Deleted.'); bump(); } catch (e) { toast(e.message); }
  }

  return (
    <>
      <Section title="Add something you made">
        <Panel className="p-4">
          <form onSubmit={submit} autoComplete="off" className="flex flex-col gap-4">
            <div className="flex flex-wrap gap-2.5">
              <Field label="Name" htmlFor="b-name" className="flex-[1_1_220px]">
                <input id="b-name" className="input" value={f.name}
                       onChange={(e) => setF({ ...f, name: e.target.value })}
                       placeholder="Garmin health analysis" />
              </Field>
              <Field label="What is it?" htmlFor="b-blurb" className="flex-[2_1_300px]">
                <input id="b-blurb" className="input" value={f.blurb}
                       onChange={(e) => setF({ ...f, blurb: e.target.value })}
                       placeholder="One line — what it does and what you built it with" />
              </Field>
            </div>
            <div className="flex flex-wrap gap-3 items-end">
              <Field label="Live link" htmlFor="b-url" className="flex-[1_1_200px]">
                <input id="b-url" className="input" value={f.url}
                       onChange={(e) => setF({ ...f, url: e.target.value })} placeholder="https://…" />
              </Field>
              <Field label="Repo" htmlFor="b-repo" className="flex-[1_1_200px]">
                <input id="b-repo" className="input" value={f.repo}
                       onChange={(e) => setF({ ...f, repo: e.target.value })} placeholder="https://github.com/…" />
              </Field>
              <Field label="Status">
                <Seg options={STATUS_OPTS} value={f.status} onChange={(v) => setF({ ...f, status: v })} size="sm" />
              </Field>
              <Btn type="submit" size="sm">Add</Btn>
            </div>
          </form>
        </Panel>
      </Section>

      <Section
        title="What you've made"
        note={builds ? `${builds.length} ${builds.length === 1 ? 'project' : 'projects'}` : undefined}
      >
        {loading && <div className="text-ink3 text-[13px]">Loading…</div>}
        {!loading && (builds?.length ? (
          <Rows>
            {builds.map((b) => (
              <div key={b.id} className="grid gap-x-3.5 gap-y-2 px-3.5 py-3 border-b border-lineSoft last:border-0
                                          grid-cols-1 sm:grid-cols-[86px_minmax(0,1fr)_auto_auto] sm:items-center
                                          hover:bg-raised/50 transition-colors">
                <span className="font-mono text-[11.5px] text-ink3 tabular-nums">{shortDate(b.started_on)}</span>
                <div className="min-w-0">
                  <span className="text-[14px] font-semibold block truncate">
                    {b.url ? (
                      <a href={b.url} target="_blank" rel="noopener noreferrer"
                         className="text-ink no-underline hover:text-accent hover:underline">{b.name}</a>
                    ) : b.name}
                  </span>
                  {b.blurb && <p className="text-[12.5px] text-ink2 mt-1 leading-snug">{b.blurb}</p>}
                  {b.repo && (
                    <a href={b.repo} target="_blank" rel="noopener noreferrer"
                       className="font-mono text-[11px] text-ink3 hover:text-accent no-underline">repo ↗</a>
                  )}
                </div>
                <button type="button" onClick={() => cycle(b)} title="Click to advance the status">
                  <Tag tone={STATUS_TONE[b.status]}>{b.status}</Tag>
                </button>
                <Btn size="xs" variant="quiet" onClick={() => remove(b.id)}>delete</Btn>
              </div>
            ))}
          </Rows>
        ) : (
          <Empty>
            Nothing here yet. Hackathon entries, side projects, half-finished experiments — all of it
            counts as evidence of work, and this is the list you will want when someone asks what
            you have built.
          </Empty>
        ))}
      </Section>
    </>
  );
}
