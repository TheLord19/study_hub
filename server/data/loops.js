/* What each company's loop is actually made of, and what it pays in India.
 *
 * Two things live here that the question sets cannot express:
 *
 * 1. `ctc` — the realistic total-comp band in LPA for an SDE-1/SDE-2 hire with
 *    1-3 years of experience, India. Not the outlier screenshots. This is what
 *    lets the app tell you which companies clear your target at all, and stop
 *    you spending a month on a set that tops out below it.
 *
 * 2. `loop` — how the rounds are weighted, out of 100. This is the number most
 *    people get wrong. Google is close to pure algorithms; Amazon is a third
 *    Leadership Principles; the Indian product companies run machine-coding
 *    rounds that decide the offer and that almost nobody prepares for. Grinding
 *    LeetCode for Flipkart is preparing 35% of the interview.
 *
 * Sources are the publicly-reported shape of these loops, not any private
 * question bank. Treat as "the shape of what they ask", not a leak.
 *
 * dsa = algorithm rounds        lld = machine coding / OOD round
 * hld = system design round     bhv = hiring manager / values round
 */
export const LOOPS = {
  /* ---------------------------------------------------------------- faang -- */
  google:        { ctc: [32, 65], loop: { dsa: 60, lld: 0,  hld: 25, bhv: 15 },
                   rounds: '2-3 algorithm rounds, 1 design round for L4, 1 Googleyness. No machine coding.' },
  amazon:        { ctc: [28, 55], loop: { dsa: 40, lld: 10, hld: 15, bhv: 35 },
                   rounds: 'Every round is half algorithms, half Leadership Principles. The LP half is not a formality — it fails people.' },
  microsoft:     { ctc: [30, 55], loop: { dsa: 50, lld: 10, hld: 20, bhv: 20 },
                   rounds: '3-4 rounds, then an as-appropriate round with a senior. Clean bug-free code is weighted heavily.' },
  meta:          { ctc: [40, 80], loop: { dsa: 55, lld: 0,  hld: 25, bhv: 20 },
                   rounds: 'Two 45-min coding rounds, two questions each. Speed is the real constraint.' },
  apple:         { ctc: [32, 60], loop: { dsa: 45, lld: 15, hld: 20, bhv: 20 },
                   rounds: 'Team-dependent and inconsistent. Expect deep questions on whatever your resume claims.' },
  netflix:       { ctc: [60, 100], loop: { dsa: 35, lld: 10, hld: 30, bhv: 25 },
                   rounds: 'Tiny India footprint, senior-only in practice. Culture fit is a real filter, not a chat.' },

  /* -------------------------------------------------------------- product -- */
  adobe:         { ctc: [25, 45], loop: { dsa: 50, lld: 15, hld: 20, bhv: 15 },
                   rounds: 'Solid mid-level algorithms plus one OOD round. Rarely exotic.' },
  uber:          { ctc: [35, 65], loop: { dsa: 40, lld: 25, hld: 25, bhv: 10 },
                   rounds: 'Strong machine-coding round alongside algorithms. Design round is real for SDE-2.' },
  atlassian:     { ctc: [35, 60], loop: { dsa: 35, lld: 25, hld: 20, bhv: 20 },
                   rounds: 'The values round is scored like a technical round. Prepare it like one.' },
  'goldman-sachs': { ctc: [25, 45], loop: { dsa: 50, lld: 20, hld: 15, bhv: 15 },
                   rounds: 'Many short rounds. Expect OOD and a lot of "why this design".' },
  salesforce:    { ctc: [28, 50], loop: { dsa: 40, lld: 20, hld: 25, bhv: 15 },
                   rounds: 'Balanced loop. Design weight rises fast above SDE-1.' },
  oracle:        { ctc: [20, 38], loop: { dsa: 55, lld: 10, hld: 20, bhv: 15 },
                   rounds: 'Algorithm-led, low ceremony. OCI teams pay materially better than the rest.' },
  nvidia:        { ctc: [28, 50], loop: { dsa: 55, lld: 10, hld: 20, bhv: 15 },
                   rounds: 'Algorithms plus depth in whatever systems area the team owns.' },

  /* ------------------------------------------------------- indian product -- */
  flipkart:      { ctc: [26, 50], loop: { dsa: 35, lld: 30, hld: 25, bhv: 10 },
                   rounds: 'The machine-coding round is the one that decides it. 90 minutes, working code, extensible design.' },
  swiggy:        { ctc: [24, 45], loop: { dsa: 30, lld: 35, hld: 25, bhv: 10 },
                   rounds: 'Most LLD-weighted loop on this list. They want a runnable, well-factored program under time.' },
  zomato:        { ctc: [22, 42], loop: { dsa: 35, lld: 30, hld: 25, bhv: 10 },
                   rounds: 'Machine coding then design. Pragmatism over cleverness.' },
  paytm:         { ctc: [18, 35], loop: { dsa: 45, lld: 25, hld: 20, bhv: 10 },
                   rounds: 'Variable bar across teams. Payments teams go deep on consistency and idempotency.' },
  razorpay:      { ctc: [24, 45], loop: { dsa: 35, lld: 30, hld: 25, bhv: 10 },
                   rounds: 'Strong LLD round, and design questions land on payments: retries, idempotency, reconciliation.' },
  phonepe:       { ctc: [26, 50], loop: { dsa: 40, lld: 25, hld: 25, bhv: 10 },
                   rounds: 'Sharp algorithm rounds plus a scale-focused design round. High bar, high pay.' },
  zoho:          { ctc: [8, 18],  loop: { dsa: 50, lld: 30, hld: 10, bhv: 10 },
                   rounds: 'Long multi-stage programming test. Good practice, but the band does not reach your target.' },

  /* -------------------------------------- indian product, high band, hiring -- */
  walmart:       { ctc: [28, 50], loop: { dsa: 40, lld: 25, hld: 25, bhv: 10 },
                   rounds: 'Large, steady hirer with a genuine SDE-2 bar. Design round is not skippable.' },
  navi:          { ctc: [30, 55], loop: { dsa: 45, lld: 25, hld: 20, bhv: 10 },
                   rounds: 'Aggressive comp, aggressive bar. Fast algorithm rounds, then a hard LLD.' },
  cred:          { ctc: [30, 55], loop: { dsa: 35, lld: 30, hld: 25, bhv: 10 },
                   rounds: 'Small team, high bar, strong opinions on code quality. Craft matters visibly.' },
  groww:         { ctc: [28, 50], loop: { dsa: 40, lld: 30, hld: 20, bhv: 10 },
                   rounds: 'Machine coding plus algorithms. Trading-adjacent teams ask about consistency.' },
  meesho:        { ctc: [28, 50], loop: { dsa: 40, lld: 25, hld: 25, bhv: 10 },
                   rounds: 'Scale-heavy design questions — the catalogue and order volume are the story.' },
  zeta:          { ctc: [30, 55], loop: { dsa: 40, lld: 25, hld: 25, bhv: 10 },
                   rounds: 'Banking infrastructure. Correctness and idempotency questions run deep.' },
  sprinklr:      { ctc: [25, 45], loop: { dsa: 50, lld: 20, hld: 20, bhv: 10 },
                   rounds: 'Algorithm-heavy with a large hiring volume. A realistic first target.' },
  arcesium:      { ctc: [30, 50], loop: { dsa: 55, lld: 15, hld: 20, bhv: 10 },
                   rounds: 'D. E. Shaw spinout. Hard algorithms, real depth on data and correctness.' },
  servicenow:    { ctc: [28, 50], loop: { dsa: 45, lld: 20, hld: 25, bhv: 10 },
                   rounds: 'Steady loop, good comp, less competition than the consumer names.' },
  juspay:        { ctc: [25, 45], loop: { dsa: 45, lld: 25, hld: 20, bhv: 10 },
                   rounds: 'Unusual, thoughtful process. They probe how you think more than what you memorised.' },

  /* -------------------------------------------------------------- service -- */
  tcs:           { ctc: [3.5, 7],  loop: { dsa: 60, lld: 10, hld: 5,  bhv: 25 },
                   rounds: 'Aptitude and fundamentals at volume. Below your target band.' },
  infosys:       { ctc: [3.5, 8],  loop: { dsa: 60, lld: 10, hld: 5,  bhv: 25 },
                   rounds: 'Same shape as TCS. Useful only as a floor, not a goal.' },
  wipro:         { ctc: [3.5, 7],  loop: { dsa: 60, lld: 10, hld: 5,  bhv: 25 },
                   rounds: 'Mass hiring loop. Below your target band.' },
  accenture:     { ctc: [4.5, 11], loop: { dsa: 60, lld: 10, hld: 5,  bhv: 25 },
                   rounds: 'Mass hiring loop, slightly higher ceiling than the rest of this bucket.' }
};

/* The four axes, in the order they should be shown everywhere. */
export const AXES = [
  { id: 'dsa', label: 'Algorithms', short: 'DSA' },
  { id: 'lld', label: 'Machine coding', short: 'LLD' },
  { id: 'hld', label: 'System design', short: 'HLD' },
  { id: 'bhv', label: 'Behavioural', short: 'BHV' }
];
