export const VERDICTS = {
  solo: { label: 'Solved it', tag: 'SOLO', tone: 'solo' },
  hint: { label: 'Used a hint', tag: 'HINT', tone: 'hint' },
  edtl: { label: 'Read editorial', tag: 'EDTL', tone: 'edtl' },
  stuck: { label: "Couldn't get it", tag: 'STUCK', tone: 'stuck' }
};

export const DIFFICULTY = { easy: 'Easy', med: 'Medium', hard: 'Hard' };

export const TOPIC_GROUPS = [
  { name: 'Foundations', topics: ['Arrays', 'Strings', 'Hashing', 'Sorting', 'Two Pointers', 'Prefix Sum', 'Sliding Window', 'Binary Search'] },
  { name: 'Data structures', topics: ['Stack', 'Queue', 'Linked List', 'Heap', 'Trees', 'BST', 'Trie', 'DSU', 'Segment Tree'] },
  { name: 'Techniques', topics: ['Recursion', 'Backtracking', 'Greedy', 'Bit Manipulation', 'Math', 'Number Theory', 'Constructive', 'Implementation', 'Brute Force'] },
  { name: 'Graphs', topics: ['Graphs', 'BFS / DFS', 'Shortest Path', 'Topological Sort'] },
  { name: 'Dynamic programming', topics: ['DP 1D', 'DP 2D', 'DP on Trees', 'Bitmask DP'] }
];

export const ALL_TOPICS = TOPIC_GROUPS.flatMap((g) => g.topics);

export const QUICK_TOPICS = [
  'Arrays', 'Strings', 'Hashing', 'Two Pointers', 'Sliding Window',
  'Binary Search', 'Stack', 'Linked List', 'Trees', 'Graphs', 'Greedy', 'DP 1D'
];

/* Codeforces rank colours — the real ones. A problem's rating is meaningless
   as a bare number to anyone who has not internalised the bands. */
const RANKS = [
  { min: 0, name: 'newbie', varName: '--c-cf-gray' },
  { min: 1200, name: 'pupil', varName: '--c-cf-green' },
  { min: 1400, name: 'specialist', varName: '--c-cf-cyan' },
  { min: 1600, name: 'expert', varName: '--c-cf-blue' },
  { min: 1900, name: 'candidate master', varName: '--c-cf-purple' },
  { min: 2100, name: 'master', varName: '--c-cf-orange' },
  { min: 2400, name: 'grandmaster', varName: '--c-cf-red' }
];

export function cfRank(rating) {
  let out = RANKS[0];
  for (const r of RANKS) if (rating >= r.min) out = r;
  return { ...out, color: `rgb(var(${out.varName}))` };
}

export const BUILD_STATUS = ['idea', 'building', 'shipped', 'shelved'];

/* The four axes a product loop is scored on. DSA is the one everybody grinds
 * and it is well under half the weight — which is the single most useful
 * thing this app has to say. */
export const AXES = [
  { id: 'dsa', label: 'Algorithms',    short: 'DSA', to: '/ladder' },
  { id: 'lld', label: 'Machine coding', short: 'LLD', to: '/machine-coding' },
  { id: 'hld', label: 'System design',  short: 'HLD', to: '/system-design' },
  { id: 'bhv', label: 'Behavioural',    short: 'BHV', to: '/behavioural' }
];

export const AXIS_COLOR = {
  dsa: 'rgb(var(--c-accent))',
  lld: 'rgb(var(--c-solo))',
  hld: 'rgb(var(--c-hint))',
  bhv: 'rgb(var(--c-edtl))'
};

/* Verdict wording changes by track — "solved it" is wrong for a design
 * question you talked through, and wrong again for a story you rehearsed. */
export const TRACK_VERDICTS = {
  hld: {
    solo: 'Held it unaided',
    hint: 'Needed a nudge',
    edtl: 'Read the answer',
    stuck: 'Could not hold it'
  },
  lld: {
    solo: 'Wrote it clean',
    hint: 'Needed a nudge',
    edtl: 'Read a solution',
    stuck: 'Did not finish'
  },
  bhv: {
    solo: 'Told it well',
    hint: 'Rough but there',
    edtl: 'Had to write it out',
    stuck: 'No story yet'
  }
};

export const STORY_THEMES = [
  'ownership', 'conflict', 'failure', 'deadline', 'ambiguity', 'leadership',
  'customer', 'depth', 'learning', 'disagreement', 'simplification', 'scale'
];

export const lpa = (n) =>
  n == null ? '—' : `${Number(n) % 1 === 0 ? Number(n) : Number(n).toFixed(1)}L`;

export const pct = (n) => `${Math.round((n ?? 0) * 100)}%`;
