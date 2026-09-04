/* Company question sets.
 *
 * frequency: 3 = shows up constantly, 2 = common, 1 = appears sometimes.
 * These are drawn from the widely-reported interview patterns for each
 * company, not from any private question bank — treat them as "the shape of
 * what they ask", not a leak. The service-company sets are deliberately much
 * easier than the product sets, because that is genuinely how those loops
 * differ: mass campus hiring tests fundamentals and speed, not hard graphs.
 */
export const COMPANIES = [
  {
    slug: 'google', name: 'Google', bucket: 'faang',
    blurb: 'Two or three algorithmic rounds. Expect to justify complexity out loud and handle a follow-up that breaks your first solution.',
    q: [
      ['lc:longest-substring-without-repeating-characters', 3],
      ['lc:merge-intervals', 3], ['lc:word-ladder', 3],
      ['lc:trapping-rain-water', 3], ['lc:median-of-two-sorted-arrays', 2],
      ['lc:word-search-ii', 2], ['lc:edit-distance', 2],
      ['lc:lru-cache', 2], ['lc:course-schedule-ii', 2],
      ['lc:number-of-islands', 2], ['lc:binary-tree-maximum-path-sum', 2],
      ['lc:min-cost-to-connect-all-points', 1], ['lc:burst-balloons', 1],
      ['lc:largest-rectangle-in-histogram', 1]
    ]
  },
  {
    slug: 'amazon', name: 'Amazon', bucket: 'faang',
    blurb: 'Heavy on graphs, heaps and intervals. Every round is half algorithms, half Leadership Principles — prepare stories too.',
    q: [
      ['lc:two-sum', 3], ['lc:number-of-islands', 3], ['lc:lru-cache', 3],
      ['lc:merge-intervals', 3], ['lc:k-closest-points-to-origin', 3],
      ['lc:top-k-frequent-elements', 2], ['lc:copy-list-with-random-pointer', 2],
      ['lc:course-schedule', 2], ['lc:word-ladder', 2],
      ['lc:trapping-rain-water', 2], ['lc:rotting-oranges', 2],
      ['lc:merge-k-sorted-lists', 2], ['lc:task-scheduler', 1],
      ['lc:search-a-2d-matrix', 1], ['lc:reorder-list', 1]
    ]
  },
  {
    slug: 'microsoft', name: 'Microsoft', bucket: 'faang',
    blurb: 'Linked lists, trees and string parsing come up more than anywhere else. Clean, bug-free code matters more than cleverness.',
    q: [
      ['lc:reverse-linked-list', 3], ['lc:lru-cache', 3],
      ['lc:valid-parentheses', 3], ['lc:spiral-matrix', 3],
      ['lc:add-two-numbers', 2], ['lc:trapping-rain-water', 2],
      ['lc:serialize-and-deserialize-binary-tree', 2],
      ['lc:string-to-integer-atoi', 2], ['lc:merge-intervals', 2],
      ['lc:binary-tree-level-order-traversal', 2],
      ['lc:copy-list-with-random-pointer', 1], ['lc:rotate-image', 1],
      ['lc:find-median-from-data-stream', 1]
    ]
  },
  {
    slug: 'meta', name: 'Meta', bucket: 'faang',
    blurb: 'Two 45-minute rounds, usually two questions each. Speed is the constraint — they expect a working solution fast, then optimisation.',
    q: [
      ['lc:valid-palindrome', 3], ['lc:minimum-window-substring', 3],
      ['lc:merge-intervals', 3], ['lc:subarray-sum-equals-k', 3],
      ['lc:binary-tree-right-side-view', 2],
      ['lc:lowest-common-ancestor-of-a-binary-tree', 2],
      ['lc:add-two-numbers', 2], ['lc:k-closest-points-to-origin', 2],
      ['lc:product-of-array-except-self', 2], ['lc:valid-parenthesis-string', 2],
      ['lc:kth-largest-element-in-an-array', 1], ['lc:word-break', 1]
    ]
  },
  {
    slug: 'apple', name: 'Apple', bucket: 'faang',
    blurb: 'Varies wildly by team. Expect fundamentals plus deep questions about whatever is on your CV.',
    q: [
      ['lc:two-sum', 3], ['lc:lru-cache', 3], ['lc:merge-intervals', 2],
      ['lc:valid-parentheses', 2], ['lc:trapping-rain-water', 2],
      ['lc:spiral-matrix', 2], ['lc:longest-substring-without-repeating-characters', 2],
      ['lc:reverse-linked-list', 2], ['lc:group-anagrams', 1],
      ['lc:number-of-islands', 1], ['lc:min-stack', 1]
    ]
  },
  {
    slug: 'netflix', name: 'Netflix', bucket: 'faang',
    blurb: 'Very few, very senior openings. Less algorithm trivia, far more system design and real engineering judgement.',
    q: [
      ['lc:lru-cache', 3], ['lc:merge-intervals', 2],
      ['lc:find-median-from-data-stream', 2], ['lc:top-k-frequent-elements', 2],
      ['lc:design-twitter', 1], ['lc:time-based-key-value-store', 1],
      ['lc:course-schedule', 1]
    ]
  },
  {
    slug: 'adobe', name: 'Adobe', bucket: 'product',
    blurb: 'Arrays, strings and matrices, plus solid OOP questions. Rounds are usually more relaxed than FAANG.',
    q: [
      ['lc:spiral-matrix', 3], ['lc:rotate-image', 3], ['lc:merge-intervals', 2],
      ['lc:lru-cache', 2], ['lc:set-matrix-zeroes', 2],
      ['lc:longest-palindromic-substring', 2], ['lc:maximum-subarray', 2],
      ['lc:group-anagrams', 2], ['lc:trapping-rain-water', 1],
      ['lc:sort-colors', 1], ['lc:next-permutation', 1]
    ]
  },
  {
    slug: 'uber', name: 'Uber', bucket: 'product',
    blurb: 'Graphs and intervals, often dressed up as maps and trip scheduling. Expect a design round early.',
    q: [
      ['lc:merge-intervals', 3], ['lc:number-of-islands', 3], ['lc:lru-cache', 2],
      ['lc:word-search', 2], ['lc:top-k-frequent-elements', 2],
      ['lc:course-schedule', 2], ['lc:network-delay-time', 2],
      ['lc:cheapest-flights-within-k-stops', 2], ['lc:insert-interval', 1],
      ['lc:k-closest-points-to-origin', 1]
    ]
  },
  {
    slug: 'atlassian', name: 'Atlassian', bucket: 'product',
    blurb: 'Practical, product-shaped problems over puzzle questions. Strong emphasis on values and collaboration rounds.',
    q: [
      ['lc:merge-intervals', 3], ['lc:lru-cache', 2], ['lc:group-anagrams', 2],
      ['lc:time-based-key-value-store', 2], ['lc:design-hashmap', 2],
      ['lc:valid-parentheses', 2], ['lc:course-schedule', 1],
      ['lc:partition-labels', 1], ['lc:task-scheduler', 1]
    ]
  },
  {
    slug: 'goldman-sachs', name: 'Goldman Sachs', bucket: 'product',
    blurb: 'Arrays, hashing and a lot of maths. Also expect probability and puzzle questions alongside the coding.',
    q: [
      ['lc:trapping-rain-water', 3], ['lc:two-sum', 2], ['lc:lru-cache', 2],
      ['lc:merge-intervals', 2], ['lc:maximum-subarray', 2],
      ['lc:happy-number', 2], ['lc:missing-number', 2],
      ['lc:longest-consecutive-sequence', 1], ['lc:coin-change', 1],
      ['lc:plus-one', 1]
    ]
  },
  {
    slug: 'salesforce', name: 'Salesforce', bucket: 'product',
    blurb: 'Moderate difficulty, broad coverage. Strings, trees and a design discussion.',
    q: [
      ['lc:valid-parentheses', 2], ['lc:group-anagrams', 2],
      ['lc:binary-tree-level-order-traversal', 2], ['lc:merge-intervals', 2],
      ['lc:longest-substring-without-repeating-characters', 2],
      ['lc:lru-cache', 2], ['lc:two-sum', 1], ['lc:word-break', 1],
      ['lc:course-schedule', 1]
    ]
  },
  {
    slug: 'oracle', name: 'Oracle', bucket: 'product',
    blurb: 'Fundamentals-first, with real database and OS questions in the mix. Do not neglect DBMS theory.',
    q: [
      ['lc:two-sum', 2], ['lc:merge-intervals', 2], ['lc:lru-cache', 2],
      ['lc:reverse-linked-list', 2], ['lc:valid-parentheses', 2],
      ['lc:maximum-subarray', 2], ['lc:spiral-matrix', 1],
      ['lc:kth-largest-element-in-an-array', 1], ['lc:add-two-numbers', 1]
    ]
  },
  {
    slug: 'nvidia', name: 'NVIDIA', bucket: 'product',
    blurb: 'Depends hard on the team. Systems roles go deep on C++, memory and concurrency alongside the algorithms.',
    q: [
      ['lc:lru-cache', 2], ['lc:merge-intervals', 2], ['lc:number-of-islands', 2],
      ['lc:maximum-subarray', 2], ['lc:single-number', 2],
      ['lc:counting-bits', 2], ['lc:reverse-bits', 1], ['lc:sort-colors', 1],
      ['lc:trapping-rain-water', 1]
    ]
  },
  {
    slug: 'flipkart', name: 'Flipkart', bucket: 'indian-product',
    blurb: 'One of the harder Indian loops. Machine coding round is the differentiator — you build a small working system in 90 minutes.',
    q: [
      ['lc:lru-cache', 3], ['lc:trapping-rain-water', 3], ['lc:merge-intervals', 3],
      ['lc:number-of-islands', 2], ['lc:coin-change', 2],
      ['lc:longest-increasing-subsequence', 2], ['lc:course-schedule', 2],
      ['lc:top-k-frequent-elements', 2], ['lc:min-stack', 2],
      ['lc:maximum-product-subarray', 1], ['lc:word-break', 1],
      ['lc:find-median-from-data-stream', 1]
    ]
  },
  {
    slug: 'swiggy', name: 'Swiggy', bucket: 'indian-product',
    blurb: 'Arrays, hashing and sliding window, then a machine coding round modelling something delivery-shaped.',
    q: [
      ['lc:two-sum', 3], ['lc:merge-intervals', 3],
      ['lc:longest-substring-without-repeating-characters', 2],
      ['lc:lru-cache', 2], ['lc:top-k-frequent-elements', 2],
      ['lc:k-closest-points-to-origin', 2], ['lc:number-of-islands', 2],
      ['lc:group-anagrams', 1], ['lc:subarray-sum-equals-k', 1],
      ['lc:task-scheduler', 1]
    ]
  },
  {
    slug: 'zomato', name: 'Zomato', bucket: 'indian-product',
    blurb: 'Practical problem solving plus a strong low-level design round. They care whether your code would survive production.',
    q: [
      ['lc:merge-intervals', 3], ['lc:lru-cache', 2], ['lc:two-sum', 2],
      ['lc:group-anagrams', 2], ['lc:number-of-islands', 2],
      ['lc:longest-substring-without-repeating-characters', 2],
      ['lc:min-stack', 1], ['lc:top-k-frequent-elements', 1],
      ['lc:valid-parentheses', 1]
    ]
  },
  {
    slug: 'paytm', name: 'Paytm', bucket: 'indian-product',
    blurb: 'Arrays, strings and DP at moderate difficulty, with real questions about how you would handle money and idempotency.',
    q: [
      ['lc:two-sum', 2], ['lc:maximum-subarray', 2], ['lc:merge-intervals', 2],
      ['lc:coin-change', 2], ['lc:climbing-stairs', 2],
      ['lc:valid-parentheses', 2], ['lc:longest-common-prefix', 1],
      ['lc:reverse-linked-list', 1], ['lc:house-robber', 1]
    ]
  },
  {
    slug: 'razorpay', name: 'Razorpay', bucket: 'indian-product',
    blurb: 'Strong engineering bar for a fintech. Expect a machine coding round and pointed questions on concurrency and correctness.',
    q: [
      ['lc:lru-cache', 3], ['lc:merge-intervals', 2], ['lc:min-stack', 2],
      ['lc:time-based-key-value-store', 2], ['lc:coin-change', 2],
      ['lc:number-of-islands', 2], ['lc:top-k-frequent-elements', 2],
      ['lc:design-hashmap', 1], ['lc:course-schedule', 1]
    ]
  },
  {
    slug: 'phonepe', name: 'PhonePe', bucket: 'indian-product',
    blurb: 'Hard DSA rounds, comparable to Flipkart. They go deep on one problem rather than broad across several.',
    q: [
      ['lc:trapping-rain-water', 3], ['lc:lru-cache', 3],
      ['lc:merge-intervals', 2], ['lc:longest-increasing-subsequence', 2],
      ['lc:coin-change', 2], ['lc:word-break', 2], ['lc:number-of-islands', 2],
      ['lc:find-median-from-data-stream', 2], ['lc:edit-distance', 1],
      ['lc:largest-rectangle-in-histogram', 1]
    ]
  },
  {
    slug: 'zoho', name: 'Zoho', bucket: 'indian-product',
    blurb: 'A long multi-stage day. Famous for pattern printing, matrix manipulation and string puzzles rather than classic DSA.',
    q: [
      ['lc:spiral-matrix', 3], ['lc:rotate-image', 3], ['lc:fizz-buzz', 2],
      ['lc:valid-anagram', 2], ['lc:roman-to-integer', 2],
      ['lc:longest-common-prefix', 2], ['lc:set-matrix-zeroes', 2],
      ['lc:plus-one', 2], ['lc:reverse-integer', 2], ['lc:palindrome-number', 2],
      ['lc:string-to-integer-atoi', 1], ['lc:sort-colors', 1]
    ]
  },
  {
    slug: 'tcs', name: 'TCS', bucket: 'service',
    blurb: 'NQT is aptitude plus basic coding. Two straightforward programs, usually loops, strings and simple maths.',
    q: [
      ['lc:fizz-buzz', 3], ['lc:palindrome-number', 3], ['lc:reverse-integer', 3],
      ['lc:two-sum', 2], ['lc:valid-anagram', 2], ['lc:longest-common-prefix', 2],
      ['lc:plus-one', 2], ['lc:missing-number', 2], ['lc:happy-number', 1],
      ['lc:add-binary', 1], ['lc:contains-duplicate', 1]
    ]
  },
  {
    slug: 'infosys', name: 'Infosys', bucket: 'service',
    blurb: 'Aptitude, pseudocode and two basic programs. Puzzles carry real weight in the written round.',
    q: [
      ['lc:fizz-buzz', 3], ['lc:roman-to-integer', 2], ['lc:valid-palindrome', 2],
      ['lc:two-sum', 2], ['lc:majority-element', 2], ['lc:plus-one', 2],
      ['lc:reverse-integer', 2], ['lc:contains-duplicate', 1],
      ['lc:longest-common-prefix', 1], ['lc:happy-number', 1]
    ]
  },
  {
    slug: 'wipro', name: 'Wipro', bucket: 'service',
    blurb: 'Elite NTH is the harder track and worth targeting — the standard track stays at basic loops and strings.',
    q: [
      ['lc:fizz-buzz', 2], ['lc:valid-anagram', 2], ['lc:two-sum', 2],
      ['lc:palindrome-number', 2], ['lc:missing-number', 2],
      ['lc:maximum-subarray', 2], ['lc:longest-common-prefix', 1],
      ['lc:climbing-stairs', 1], ['lc:add-binary', 1]
    ]
  },
  {
    slug: 'accenture', name: 'Accenture', bucket: 'service',
    blurb: 'Cognitive and technical assessment, then a short coding round. Fundamentals and communication carry it.',
    q: [
      ['lc:fizz-buzz', 2], ['lc:two-sum', 2], ['lc:valid-anagram', 2],
      ['lc:reverse-integer', 2], ['lc:contains-duplicate', 2],
      ['lc:plus-one', 1], ['lc:longest-common-prefix', 1],
      ['lc:palindrome-number', 1], ['lc:majority-element', 1]
    ]
  },
  {
    slug: 'sprinklr', name: 'Sprinklr', bucket: 'indian-product',
    blurb: 'Algorithm-heavy and hires in volume. Comp band and difficulty flavor check out against real reports; this question list is trimmed to the two problems independently corroborated against Sprinklr’s actual LeetCode tag — treat coverage here as a floor, not the full picture.',
    q: [
      ['lc:trapping-rain-water', 1], ['lc:edit-distance', 1]
    ]
  },
  {
    slug: 'arcesium', name: 'Arcesium', bucket: 'indian-product',
    blurb: 'D. E. Shaw spinout. Reputation for the hardest pure-algorithm bar in this bucket holds up against real reports. Question list trimmed to what’s corroborated (Arcesium’s own tagged sample is small, so absence elsewhere is weak evidence, not proof against) — treat coverage here as a floor, not the full picture.',
    q: [
      ['lc:median-of-two-sorted-arrays', 1], ['lc:find-median-from-data-stream', 1],
      ['lc:word-ladder', 1]
    ]
  },
  {
    slug: 'servicenow', name: 'ServiceNow', bucket: 'indian-product',
    blurb: 'Good comp with noticeably less competition than the consumer names. The best-verified company in this catalogue — 8 of 12 originally-claimed questions matched ServiceNow’s real LeetCode company tag directly.',
    q: [
      ['lc:two-sum', 1], ['lc:merge-intervals', 1], ['lc:lru-cache', 1],
      ['lc:number-of-islands', 1], ['lc:valid-parentheses', 1],
      ['lc:longest-substring-without-repeating-characters', 1],
      ['lc:top-k-frequent-elements', 1], ['lc:coin-change', 1]
    ]
  }
];

export const BUCKETS = [
  { id: 'faang',          label: 'Big tech' },
  { id: 'product',        label: 'Global product' },
  { id: 'indian-product', label: 'Indian product' },
  { id: 'service',        label: 'Service / mass hiring' }
];
