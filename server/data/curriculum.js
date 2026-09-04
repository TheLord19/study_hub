/* Teaching order. Each tier hands you the tools the next one assumes.
 * Entries are problem keys from the master pool; order inside a tier is
 * the order to solve them. Codeforces problems are interleaved on purpose —
 * LeetCode trains pattern recall, Codeforces trains solving under pressure,
 * and they are different muscles.
 */
export const TIERS = [
  { name: 'Foundations',        blurb: 'Array, string and hash-map reflexes. Nothing here should need a trick.' },
  { name: 'Core patterns',      blurb: 'Sliding window, two pointers, binary search on the answer.' },
  { name: 'Structures',         blurb: 'Stacks, linked lists, heaps, tries — build them, do not just use them.' },
  { name: 'Trees & graphs',     blurb: 'Recursion you trust, then traversal you can write without thinking.' },
  { name: 'DP & advanced',      blurb: 'State, transition, base case. The tier that takes the longest.' }
];

export const CURRICULUM = [
  // Tier 0 — Foundations
  ['lc:two-sum', 0], ['lc:contains-duplicate', 0], ['lc:valid-anagram', 0],
  ['lc:valid-palindrome', 0], ['lc:best-time-to-buy-and-sell-stock', 0],
  ['lc:binary-search', 0], ['lc:move-zeroes', 0], ['lc:squares-of-a-sorted-array', 0],
  ['lc:running-sum-of-1d-array', 0], ['lc:find-pivot-index', 0], ['lc:majority-element', 0],
  ['cf:4A', 0], ['cf:71A', 0], ['cf:231A', 0], ['cf:158A', 0], ['cf:282A', 0],
  ['cf:50A', 0], ['cf:112A', 0], ['cf:236A', 0], ['cf:263A', 0], ['cf:617A', 0],

  // Tier 1 — Core patterns
  ['lc:group-anagrams', 1], ['lc:top-k-frequent-elements', 1],
  ['lc:product-of-array-except-self', 1],
  ['lc:longest-substring-without-repeating-characters', 1],
  ['lc:longest-repeating-character-replacement', 1],
  ['lc:minimum-size-subarray-sum', 1], ['lc:3sum', 1],
  ['lc:container-with-most-water', 1], ['lc:search-in-rotated-sorted-array', 1],
  ['lc:find-minimum-in-rotated-sorted-array', 1], ['lc:koko-eating-bananas', 1],
  ['cf:96A', 1], ['cf:266B', 1], ['cf:339A', 1], ['cf:118A', 1], ['cf:486A', 1],
  ['cf:271A', 1], ['cf:148A', 1], ['cf:546A', 1], ['cf:200B', 1], ['cf:122A', 1],

  // Tier 2 — Structures
  ['lc:valid-parentheses', 2], ['lc:min-stack', 2],
  ['lc:evaluate-reverse-polish-notation', 2], ['lc:daily-temperatures', 2],
  ['lc:reverse-linked-list', 2], ['lc:merge-two-sorted-lists', 2],
  ['lc:linked-list-cycle', 2], ['lc:remove-nth-node-from-end-of-list', 2],
  ['lc:reorder-list', 2], ['lc:kth-largest-element-in-an-array', 2],
  ['lc:implement-trie-prefix-tree', 2],
  ['cf:133A', 2], ['cf:337A', 2], ['cf:141A', 2], ['cf:469A', 2], ['cf:158B', 2],

  // Tier 3 — Trees & graphs
  ['lc:invert-binary-tree', 3], ['lc:maximum-depth-of-binary-tree', 3],
  ['lc:same-tree', 3], ['lc:diameter-of-binary-tree', 3],
  ['lc:balanced-binary-tree', 3], ['lc:binary-tree-level-order-traversal', 3],
  ['lc:validate-binary-search-tree', 3],
  ['lc:lowest-common-ancestor-of-a-binary-search-tree', 3],
  ['lc:kth-smallest-element-in-a-bst', 3], ['lc:number-of-islands', 3],
  ['lc:rotting-oranges', 3], ['lc:clone-graph', 3],
  ['lc:pacific-atlantic-water-flow', 3], ['lc:course-schedule', 3],
  ['cf:474B', 3], ['cf:313B', 3],

  // Tier 4 — DP & advanced
  ['lc:climbing-stairs', 4], ['lc:min-cost-climbing-stairs', 4],
  ['lc:maximum-subarray', 4], ['lc:house-robber', 4], ['lc:house-robber-ii', 4],
  ['lc:coin-change', 4], ['lc:longest-increasing-subsequence', 4],
  ['lc:word-break', 4], ['lc:unique-paths', 4],
  ['lc:longest-common-subsequence', 4], ['lc:jump-game', 4],
  ['lc:subsets', 4], ['lc:combination-sum', 4], ['lc:permutations', 4],
  ['lc:word-search', 4], ['lc:single-number', 4], ['lc:number-of-1-bits', 4],
  ['lc:counting-bits', 4], ['lc:reverse-bits', 4],
  ['cf:455A', 4], ['cf:520B', 4], ['cf:230B', 4]
];
