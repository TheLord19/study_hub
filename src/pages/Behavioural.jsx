import { useState } from 'react';
import { api } from '../lib/api.js';
import { useRefresh, useResource } from '../lib/useResource.jsx';
import { STORY_THEMES } from '../lib/constants.js';
import { Btn, Chip, Empty, Field, Panel, Section, Tag, useToast } from '../components/ui.jsx';
import Prep from './Prep.jsx';

/* The behavioural round, which is answered by a bank rather than by a list.
 *
 * Six stories with a number attached will cover almost every question below.
 * Thirty separately-memorised answers will cover none of them convincingly,
 * because the interviewer's second follow-up leaves the script immediately.
 * So the bank comes first on this page, and the questions link into it.
 */

const BLANK = { title: '', situation: '', task: '', action: '', result: '', metric: '', themes: [] };

const PARTS = [
  ['situation', 'Situation', 'Where, when, and what was at stake. Two sentences.'],
  ['task', 'Task', 'What was specifically yours to do.'],
  ['action', 'Action', 'What you did, in first person singular. This is the longest part.'],
  ['result', 'Result', 'What changed, and how you know.']
];

function StoryForm({ initial, onSave, onCancel }) {
  const [f, setF] = useState(initial ?? BLANK);
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  async function save() {
    setBusy(true);
    try { await onSave(f); } finally { setBusy(false); }
  }

  return (
    <Panel className="p-4">
      <Field label="What you will call it under pressure" className="mb-3">
        <input
          className="input"
          placeholder="The migration that took down checkout"
          value={f.title}
          onChange={set('title')}
        />
      </Field>

      <div className="grid gap-3 sm:grid-cols-2">
        {PARTS.map(([k, label, hint]) => (
          <Field key={k} label={label}>
            <textarea
              className="input min-h-[76px] resize-y"
              placeholder={hint}
              value={f[k] ?? ''}
              onChange={set(k)}
            />
          </Field>
        ))}
      </div>

      <Field label="The number that makes it land" className="mt-3">
        <input
          className="input"
          placeholder="p99 from 1.8s to 240ms · 40% fewer support tickets · shipped 3 weeks early"
          value={f.metric ?? ''}
          onChange={set('metric')}
        />
      </Field>

      <div className="mt-4">
        <span className="field-label">What it can be aimed at</span>
        <div className="flex flex-wrap gap-1.5 mt-2">
          {STORY_THEMES.map((t) => (
            <Chip
              key={t}
              on={f.themes?.includes(t)}
              onClick={() =>
                setF({
                  ...f,
                  themes: f.themes?.includes(t)
                    ? f.themes.filter((x) => x !== t)
                    : [...(f.themes ?? []), t]
                })
              }
            >
              {t}
            </Chip>
          ))}
        </div>
      </div>

      <div className="flex gap-2 mt-4">
        <Btn size="sm" onClick={save} disabled={!f.title.trim() || busy}>
          {busy ? 'Saving…' : 'Save story'}
        </Btn>
        <Btn size="sm" variant="quiet" onClick={onCancel}>Cancel</Btn>
      </div>
    </Panel>
  );
}

function StoryCard({ s, onEdit, onDelete }) {
  const [show, setShow] = useState(false);
  const missing = PARTS.filter(([k]) => (s[k] ?? '').trim().length < 20).map(([, l]) => l);

  return (
    <div className="bg-surface p-4">
      <div className="flex items-baseline gap-2 flex-wrap">
        <button
          type="button"
          onClick={() => setShow(!show)}
          className="text-[14.5px] font-bold text-left hover:text-accent transition-colors"
        >
          {s.title}
        </button>
        {s.strength.ready
          ? <Tag tone="solo">READY</Tag>
          : <Tag tone="hint">{s.strength.parts}/4 written</Tag>}
        <span className="ml-auto font-mono text-[10.5px] text-ink3">
          aimed at {s.links.length}
        </span>
      </div>

      {s.metric && (
        <p className="font-mono text-[11.5px] text-accent mt-1.5">{s.metric}</p>
      )}

      {!!s.themes.length && (
        <div className="flex flex-wrap gap-1 mt-2">
          {s.themes.map((t) => <Tag key={t} tone="topic">{t}</Tag>)}
        </div>
      )}

      {!s.strength.ready && (
        <p className="text-[12.5px] text-ink3 mt-2">
          {missing.length ? `Still thin: ${missing.join(', ').toLowerCase()}.` : ''}
          {!s.strength.hasMetric && ' No number attached — add one, it is what makes the story land.'}
        </p>
      )}

      {show && (
        <div className="mt-3 flex flex-col gap-2.5 border-t border-lineSoft pt-3">
          {PARTS.map(([k, label]) =>
            (s[k] ?? '').trim() ? (
              <div key={k}>
                <span className="eyebrow">{label}</span>
                <p className="text-[13px] text-ink2 leading-relaxed mt-0.5 whitespace-pre-wrap">{s[k]}</p>
              </div>
            ) : null
          )}
          {!!s.links.length && (
            <div>
              <span className="eyebrow">Answers</span>
              <p className="text-[12.5px] text-ink3 mt-0.5">
                {s.links.map((l) => l.title).join(' · ')}
              </p>
            </div>
          )}
          <div className="flex gap-2 mt-1">
            <Btn size="xs" variant="ghost" onClick={onEdit}>edit</Btn>
            <Btn size="xs" variant="quiet" onClick={onDelete}>delete</Btn>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Behavioural() {
  const { tick, refresh } = useRefresh();
  const toast = useToast();
  const { data } = useResource(() => api.stories(), [tick]);
  const { data: gaps } = useResource(() => api.storyGaps(), [tick]);
  const [editing, setEditing] = useState(null); // null | 'new' | story object

  const stories = data?.stories ?? [];
  const ready = stories.filter((s) => s.strength.ready).length;

  async function save(f) {
    try {
      if (editing === 'new') await api.addStory(f);
      else await api.updateStory(editing.id, f);
      toast('Story saved');
      setEditing(null);
      refresh();
    } catch (e) {
      toast(e.message);
    }
  }

  async function remove(s) {
    await api.deleteStory(s.id);
    toast('Story deleted');
    refresh();
  }

  return (
    <>
      <Section
        title="Story bank"
        note={`${ready} ready · ${stories.length} written`}
        action={
          editing ? null : (
            <Btn size="sm" onClick={() => setEditing('new')}>Add a story</Btn>
          )
        }
      >
        <p className="text-[13.5px] text-ink2 -mt-1 mb-5 max-w-[64ch] leading-relaxed">
          Six stories, each with a number in the result, will answer almost every question below —
          the same project can be a story about ownership, about conflict, and about a deadline
          depending on which part you lead with. A story counts as ready when all four STAR parts
          are actually written and there is a number attached.
        </p>

        {editing && (
          <div className="mb-5">
            <StoryForm
              initial={editing === 'new' ? BLANK : editing}
              onSave={save}
              onCancel={() => setEditing(null)}
            />
          </div>
        )}

        {stories.length ? (
          <div className="grid gap-px bg-line border border-line rounded overflow-hidden
                          [grid-template-columns:repeat(auto-fill,minmax(300px,1fr))]">
            {stories.map((s) => (
              <StoryCard
                key={s.id}
                s={s}
                onEdit={() => setEditing(s)}
                onDelete={() => remove(s)}
              />
            ))}
          </div>
        ) : (
          !editing && (
            <Empty>
              Nothing here yet. Start with the project you would pick if someone asked for the
              hardest thing you have built — that one story usually covers four of the questions below.
            </Empty>
          )
        )}

        {!!gaps?.length && stories.length > 0 && (
          <div className="mt-6">
            <h3 className="eyebrow mb-2">
              {gaps.length} questions have no story aimed at them
            </h3>
            <p className="text-[12.5px] text-ink3 mb-2.5 max-w-[64ch]">
              Not all of these need their own story — most should be answerable by re-aiming one you
              already have. The ones marked as asked a lot are the ones to check first.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {gaps.slice(0, 14).map((g) => (
                <Tag key={g.key} tone={g.weight === 3 ? 'accent' : 'plain'}>{g.title}</Tag>
              ))}
            </div>
          </div>
        )}
      </Section>

      <Prep track="bhv" />
    </>
  );
}
