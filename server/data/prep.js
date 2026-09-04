/* System design, machine coding, and behavioural.
 *
 * Three tracks, one shape. Each item is a thing you can sit down and attempt in
 * a fixed block of time, and each carries a `checklist` — the points a strong
 * answer actually reaches. That list is the whole reason this file exists:
 * "I read about consistent hashing" is not preparation, and without a checklist
 * there is no honest way to tell the difference between having watched a video
 * and being able to hold the room for forty minutes.
 *
 * Tuple format: [slug, title, prompt, weight, minutes, tags, checklist]
 *   weight  3 = asked constantly · 2 = common · 1 = shows up
 *   minutes how long the real round gives you, so practice is timed like it
 *
 * Tiers are teaching order, not difficulty alone — tier 0 is what everything
 * else is built out of, and skipping it is why people's designs collapse under
 * the first follow-up.
 */

/* ========================================================================== */
/*  HLD — system design                                                       */
/* ========================================================================== */

const HLD = {
  0: {
    label: 'Primitives',
    note: 'Not design questions. The vocabulary every design question is built out of — own these and the rest is assembly.',
    items: [
      ['scaling-basics', 'Vertical vs horizontal scaling',
        'Walk through what actually breaks first when a single-server web app goes from 100 to 100,000 users, and what you add at each step.',
        3, 20, ['fundamentals'],
        ['Names the first bottleneck (usually DB connections, not CPU)',
         'Separates app tier from data tier before scaling either',
         'Adds a load balancer and explains how sessions survive it',
         'Introduces read replicas before reaching for sharding',
         'States what each step costs in complexity, not just what it buys']],

      ['caching', 'Caching: where, what, and what goes wrong',
        'Where would you put a cache in a read-heavy service, and how do you keep it from serving stale or wrong data?',
        3, 20, ['fundamentals', 'caching'],
        ['Distinguishes client / CDN / application / database caching',
         'Explains cache-aside vs write-through vs write-behind and picks one with a reason',
         'Handles invalidation explicitly — TTL, versioned keys, or explicit bust',
         'Names the thundering-herd / cache-stampede problem and a fix',
         'Says what happens the moment the cache goes down entirely']],

      ['load-balancing', 'Load balancing and health checks',
        'How does traffic get distributed across your servers, and what happens when one of them is sick but not dead?',
        3, 15, ['fundamentals'],
        ['L4 vs L7 and why you would choose each',
         'Round-robin vs least-connections vs consistent hashing by key',
         'Health checks, and the difference between failing and degraded',
         'Sticky sessions — and why you would rather not need them',
         'The load balancer itself as a single point of failure']],

      ['db-indexing', 'Indexes and query plans',
        'A query that ran in 20ms now takes 8 seconds. Walk me through diagnosing and fixing it.',
        3, 20, ['fundamentals', 'databases'],
        ['Reads the query plan before changing anything',
         'Explains B-tree indexes and why they help range scans',
         'Composite index column order and the leftmost-prefix rule',
         'Names the write cost of every index added',
         'Covering indexes, and when a full scan is genuinely the right plan']],

      ['sql-vs-nosql', 'Choosing a datastore',
        'You need to store 50 TB of user activity events. Pick a datastore and defend it against the obvious alternative.',
        3, 20, ['fundamentals', 'databases'],
        ['Drives from access pattern, not from a preference for a product',
         'Names what you give up: joins, transactions, ad-hoc queries',
         'Explains when a relational DB is still correct at this size',
         'Considers a time-series or columnar store for event data',
         'Does not claim NoSQL "scales better" without saying at what']],

      ['sharding', 'Sharding and partitioning',
        'Your single database has stopped keeping up with writes. How do you split it, and what breaks after you do?',
        3, 25, ['fundamentals', 'databases'],
        ['Range vs hash vs directory-based partitioning, with trade-offs',
         'Picks a shard key and justifies it against skew and hotspots',
         'Explains what cross-shard joins and transactions now cost',
         'Handles resharding — consistent hashing or virtual nodes',
         'Names the celebrity/hot-key problem and a mitigation']],

      ['replication-consistency', 'Replication, consistency, and CAP',
        'Explain what a user actually experiences under eventual consistency, using a concrete example.',
        3, 20, ['fundamentals', 'distributed'],
        ['Leader-follower vs multi-leader vs leaderless',
         'Replication lag as an observable user-facing bug, with an example',
         'Read-your-own-writes and why it usually needs special handling',
         'CAP stated correctly — the choice only applies during a partition',
         'Quorum reads and writes, and what R + W > N buys']],

      ['message-queues', 'Queues and asynchronous work',
        'Why put a queue between two services, and what new problems have you just bought?',
        3, 20, ['fundamentals', 'distributed'],
        ['Decoupling, buffering, and smoothing load spikes',
         'At-most-once vs at-least-once vs exactly-once, honestly',
         'Idempotent consumers as the practical answer to duplicates',
         'Dead-letter queues and poison messages',
         'Ordering guarantees, and that per-partition is not global']],

      ['idempotency', 'Idempotency and retries',
        'A payment API call times out. The client does not know if it succeeded. Design the fix.',
        3, 20, ['fundamentals', 'payments'],
        ['Client-generated idempotency key, stored server-side',
         'The stored result is returned on replay, not recomputed',
         'Handles the concurrent-duplicate case, not just the sequential one',
         'Names a TTL for the key and what happens after it expires',
         'Distinguishes retriable from non-retriable failures']],

      ['rate-limiting-concept', 'Rate limiting algorithms',
        'Compare token bucket, leaky bucket, and sliding window. When does each one behave badly?',
        2, 15, ['fundamentals'],
        ['Fixed window and its boundary burst problem',
         'Sliding window log vs sliding window counter, and their memory cost',
         'Token bucket allowing controlled bursts, and why that is often wanted',
         'Where the counter lives once you have more than one server',
         'What you return: 429, Retry-After, and whether you queue or drop']],

      ['consistent-hashing', 'Consistent hashing',
        'You have 10 cache servers and add an 11th. Why does naive modulo hashing ruin your day, and what do you use instead?',
        2, 15, ['fundamentals', 'distributed'],
        ['Shows that mod-N remaps nearly every key on resize',
         'Describes the hash ring and clockwise assignment',
         'Virtual nodes to fix uneven distribution',
         'Quantifies how many keys actually move (roughly 1/N)',
         'Notes where this is used: caches, shard routing, DHTs']],

      ['cdn-storage', 'CDNs, blob storage, and the media path',
        'How does a 200 MB video get from a creator to a viewer in another country?',
        2, 15, ['fundamentals', 'media'],
        ['Object storage as the source of truth, not the database',
         'Pre-signed URLs so uploads bypass your application servers',
         'CDN edge caching and cache-control headers',
         'Why you store a URL in the DB and never the bytes',
         'Transcoding as an async pipeline off the upload path']],

      ['observability', 'Monitoring, logging, and alerting',
        'The service is up but users say it is broken. What did you instrument in advance so you can tell?',
        2, 15, ['fundamentals', 'ops'],
        ['Metrics, logs, and traces as three different tools',
         'Percentiles over averages, and why p99 is the honest number',
         'RED or USE method as a structuring frame',
         'Alerting on symptoms users feel, not on CPU',
         'Correlation/request IDs threaded through every hop']]
    ]
  },

  1: {
    label: 'Warm-up designs',
    note: 'Full design questions with a small surface. Use these to build the habit of the opening five minutes — requirements, scale, API — before touching a box diagram.',
    items: [
      ['url-shortener', 'Design a URL shortener',
        'Design TinyURL. 100M new URLs per month, 10:1 read-to-write ratio.',
        3, 40, ['classic'],
        ['Pins functional scope and explicitly defers analytics/custom aliases',
         'Does the number work: QPS, storage over 5 years, bytes per row',
         'Key generation — counter+base62, or hash with collision handling — and defends it',
         'Chooses a datastore for a pure key-value access pattern',
         'Caches hot short-codes and explains the hit-rate assumption',
         'Handles redirect semantics: 301 vs 302 and what that does to analytics']],

      ['pastebin', 'Design Pastebin',
        'Design a text-sharing service with expiring documents and public/private links.',
        2, 35, ['classic'],
        ['Separates metadata (DB) from the blob (object storage)',
         'Expiry as a lazy-delete plus a sweeper, not a cron over everything',
         'Access control on private pastes without a full auth system',
         'Size limits stated and enforced at the edge',
         'Read path fully cacheable, write path not']],

      ['rate-limiter-service', 'Design a distributed rate limiter',
        'Design a rate limiter that works across 50 API servers, limiting each user to 100 requests per minute.',
        3, 35, ['classic', 'distributed'],
        ['Picks an algorithm and justifies it against burst behaviour',
         'Centralised counter store (Redis) and the latency it adds to every request',
         'Atomicity — Lua script or INCR with expiry, not read-then-write',
         'Fail-open vs fail-closed when the limiter itself is down',
         'Response contract: 429 plus Retry-After',
         'Local token pre-allocation as the optimisation, with its accuracy cost']],

      ['id-generator', 'Design a unique ID generator',
        'Generate 64-bit unique IDs across many machines, roughly time-sortable, no coordination on the hot path.',
        2, 30, ['classic', 'distributed'],
        ['Rules out auto-increment and explains why',
         'UUID v4 rejected for index locality, not for uniqueness',
         'Snowflake layout: timestamp, machine ID, sequence — with bit budget',
         'Clock skew and what happens on a backwards NTP jump',
         'How machine IDs get assigned without a human doing it']],

      ['key-value-store', 'Design a key-value store',
        'Design a distributed key-value store with configurable durability.',
        2, 45, ['classic', 'distributed'],
        ['Consistent hashing for placement',
         'Replication factor N with quorum R and W',
         'Versioning to detect conflicts — vector clocks or last-write-wins, with the cost of each',
         'Gossip or a coordinator for membership and failure detection',
         'Hinted handoff and read repair for temporary failures',
         'Storage engine choice: LSM tree for writes vs B-tree for reads']]
    ]
  },

  2: {
    label: 'Core designs',
    note: 'The ones that actually get asked. If you can hold forty minutes on six of these, the design round stops being the thing that ends your loop.',
    items: [
      ['news-feed', 'Design a news feed',
        'Design the Instagram/Twitter home feed. 300M daily users, average 200 follows.',
        3, 45, ['core', 'social'],
        ['Fan-out on write vs on read, and picks a hybrid with a stated threshold',
         'Handles the celebrity problem explicitly — it is the whole question',
         'Feed stored as IDs, hydrated from cache at read time',
         'Ranking as a separate concern from retrieval',
         'Pagination that does not break when new posts arrive mid-scroll',
         'Numbers: feed cache size, fan-out write amplification']],

      ['chat-system', 'Design a chat application',
        'Design WhatsApp. 1:1 and group messaging, delivery receipts, offline delivery.',
        3, 45, ['core', 'realtime'],
        ['WebSocket connection model and where the connection state lives',
         'Service discovery: which server holds this user connection',
         'Message store keyed for the (conversation, time) access pattern',
         'Offline queue and delivery on reconnect',
         'Sent / delivered / read as three distinct acknowledgements',
         'Group fan-out and the small-group vs large-group split',
         'Ordering within a conversation, and why global ordering is not needed']],

      ['notification-system', 'Design a notification system',
        'Design a service that sends push, SMS and email to 100M users, at up to 1M notifications per minute.',
        3, 40, ['core'],
        ['Per-channel providers behind one internal interface',
         'Queue per channel so a slow provider cannot block the others',
         'Retries with exponential backoff and a dead-letter queue',
         'Deduplication so a retry does not double-send',
         'User preferences and opt-out enforced before send, not after',
         'Rate limiting per user so nobody gets 400 pushes']],

      ['web-crawler', 'Design a web crawler',
        'Crawl a billion pages a month, politely, without crawling the same thing twice.',
        2, 40, ['core'],
        ['URL frontier with priority and per-domain politeness queues',
         'robots.txt fetched, cached, and obeyed',
         'Duplicate detection on URL and on content (checksum or simhash)',
         'Trap avoidance: infinite calendars, session IDs in URLs, depth limits',
         'DNS resolution as an actual bottleneck worth caching',
         'Distributed across workers without two workers hitting one host']],

      ['search-autocomplete', 'Design search autocomplete',
        'Return the top 5 completions for a prefix in under 100ms, from billions of queries.',
        2, 40, ['core'],
        ['Trie with top-k precomputed and stored at each node',
         'Why you do not compute top-k at query time',
         'Offline aggregation pipeline updating the trie on a cadence',
         'Sharding the trie by prefix and the imbalance that creates',
         'Client-side debounce and caching as a real part of the design',
         'Filtering: profanity, and personalisation as an optional layer']],

      ['video-streaming', 'Design YouTube / Netflix',
        'Design video upload, transcode and playback for a global audience.',
        2, 45, ['core', 'media'],
        ['Upload direct to object storage with pre-signed URLs',
         'Transcoding as a DAG of async jobs into multiple bitrates',
         'Adaptive bitrate streaming and why chunks, not files',
         'CDN as the entire read path — origin should be nearly idle',
         'Metadata service separate from the media path',
         'Thumbnail and preview generation as part of the same pipeline']],

      ['file-storage', 'Design Google Drive / Dropbox',
        'Design file sync across a user\'s devices, with sharing and version history.',
        2, 45, ['core', 'storage'],
        ['File chunking, and why it makes delta sync possible',
         'Content-addressed chunks giving deduplication for free',
         'Metadata DB versus block storage as separate services',
         'Sync protocol: long poll or push, and conflict resolution',
         'Version history built from chunk references, not full copies',
         'Sharing permissions and how they are checked on every read']],

      ['ticket-booking', 'Design BookMyShow',
        'Design seat selection and booking for a show, where 50,000 people want the same 200 seats at 12:00:00.',
        3, 45, ['core', 'india', 'concurrency'],
        ['Names the double-booking race and solves it, not hand-waves it',
         'Temporary seat hold with a TTL, separate from confirmed booking',
         'Pessimistic lock or conditional update — and the transaction boundary',
         'Payment as an async step that can fail after the hold',
         'Queue or waiting room for the thundering herd at sale open',
         'Idempotency on the booking endpoint',
         'What the user sees when their held seat expires mid-payment']],

      ['payment-system', 'Design a payment system',
        'Design the flow behind a UPI or card payment, including what happens when it half-fails.',
        3, 45, ['core', 'india', 'payments'],
        ['Ledger as append-only, double-entry, never updated in place',
         'Idempotency key on every external call',
         'The timeout case: unknown state, resolved by reconciliation not by guessing',
         'Async reconciliation job against the provider as a first-class component',
         'State machine for a payment, with every transition enumerated',
         'Exactly-once framed honestly as at-least-once plus idempotency',
         'PCI/PII handling — tokenisation, and what you never store']],

      ['ecommerce-checkout', 'Design an e-commerce order flow',
        'Design cart, inventory reservation, checkout and order placement for a Flipkart-scale sale event.',
        3, 45, ['core', 'india'],
        ['Inventory reservation with a hold, distinct from decrement on payment',
         'Oversell prevention under concurrency, stated as a specific mechanism',
         'Order state machine and where it becomes irreversible',
         'Cart in a fast store, order in a durable one',
         'Flash-sale load shedding: queue, waiting room, or fail fast',
         'Saga or outbox pattern for the multi-service commit']],

      ['ride-hailing', 'Design Uber / Ola',
        'Match riders to nearby drivers in real time, in a dense city.',
        3, 45, ['core', 'geo'],
        ['Geospatial index — geohash, S2 or quadtree — chosen with a reason',
         'Driver location updates at high write rate, and where they land',
         'Matching as its own service, not a query in the request path',
         'Handles the two-riders-one-driver race',
         'Trip state machine and what survives an app crash mid-trip',
         'Surge pricing computed on aggregates, not per request']],

      ['food-delivery', 'Design Swiggy / Zomato',
        'Design the order lifecycle from placement to delivery, including live tracking.',
        3, 45, ['core', 'india', 'geo'],
        ['Three-sided problem stated: customer, restaurant, delivery partner',
         'Order state machine across all three parties',
         'Partner assignment as a batched optimisation, not first-come',
         'Live location streaming and its write volume',
         'ETA as a prediction service with a fallback',
         'Restaurant availability and menu freshness as a cache problem']]
    ]
  },

  3: {
    label: 'Stretch',
    note: 'Above the bar you need. Worth one pass each late in prep — they mostly teach you that the core designs are variations on the same six ideas.',
    items: [
      ['distributed-scheduler', 'Design a distributed job scheduler',
        'Run millions of scheduled jobs at their appointed second, exactly once, across a fleet.',
        2, 45, ['stretch', 'distributed'],
        ['Time-bucketed store so you never scan all jobs',
         'Leader election or leasing so two workers do not run one job',
         'At-least-once execution plus idempotent jobs, stated as the real contract',
         'Failure and retry policy, including jobs that never succeed',
         'Backpressure when a burst of jobs is all due at once']],

      ['metrics-system', 'Design a metrics and alerting system',
        'Ingest 10M metric points per second and serve dashboards and alerts on them.',
        2, 45, ['stretch', 'ops'],
        ['Time-series storage with downsampling and retention tiers',
         'Push vs pull collection, with a real trade-off',
         'Pre-aggregation at write time for common queries',
         'Alert evaluation as a scheduled query, with flap suppression',
         'Cardinality explosion named as the thing that actually kills these systems']],

      ['ad-click-aggregator', 'Design an ad click aggregator',
        'Count ad clicks in near-real-time, accurately enough to bill on.',
        1, 45, ['stretch', 'streaming'],
        ['Stream processing with windowing, and late-arriving events',
         'Exactly-once billing achieved via dedup keys, not wishful thinking',
         'Lambda or kappa architecture — fast path plus a correcting batch path',
         'Fraud/bot filtering as a distinct stage',
         'Reconciliation between the fast and accurate counts']],

      ['object-storage', 'Design S3',
        'Design a durable object store with 11 nines of durability.',
        1, 45, ['stretch', 'storage'],
        ['Erasure coding versus replication, with the storage-cost maths',
         'Metadata service scaling separately from the data plane',
         'Multipart upload and resumability',
         'Background scrubbing and repair for bit rot',
         'Strong read-after-write consistency and what it costs']],

      ['maps-routing', 'Design Google Maps routing',
        'Compute a driving route across a country in under 100ms.',
        1, 45, ['stretch', 'geo'],
        ['Why plain Dijkstra is far too slow, with a rough number',
         'Graph partitioning and precomputed contraction hierarchies',
         'Live traffic as edge-weight updates and their propagation lag',
         'Tile-based map serving as a separate concern from routing',
         'Rerouting when the driver deviates']]
    ]
  }
};

/* ========================================================================== */
/*  LLD — machine coding / object design                                      */
/* ========================================================================== */

const LLD = {
  0: {
    label: 'Principles',
    note: 'The vocabulary a machine-coding round is graded against. You will not be asked these directly — you will be marked down silently for not knowing them.',
    items: [
      ['solid', 'SOLID, with real examples',
        'Explain each SOLID principle with a concrete violation from code you have written, and the fix.',
        3, 25, ['principles'],
        ['Single responsibility framed as one reason to change, not "one job"',
         'Open-closed shown via an extension point, not an abstract claim',
         'Liskov with a violation that actually breaks a caller',
         'Interface segregation and the fat-interface smell',
         'Dependency inversion distinguished from dependency injection']],

      ['patterns-creational', 'Creational patterns',
        'When do you reach for a factory, a builder, or a singleton — and when are they wrong?',
        3, 25, ['principles', 'patterns'],
        ['Factory method vs abstract factory, with a case for each',
         'Builder for many optional parameters, and why not a telescoping constructor',
         'Singleton and its testing and concurrency problems stated honestly',
         'Prototype/clone and deep vs shallow copy',
         'Names a case where a plain constructor is the right answer']],

      ['patterns-behavioural', 'Behavioural patterns',
        'Design a system where the pricing rule changes per customer type. Which pattern, and why not the others?',
        3, 25, ['principles', 'patterns'],
        ['Strategy as the answer, with the interface written out',
         'Observer for one-to-many notification, and its memory-leak trap',
         'State machine versus a pile of boolean flags',
         'Chain of responsibility for pipelines like middleware',
         'Command for undo, queueing, and audit']],

      ['concurrency-lld', 'Thread safety in an interview program',
        'Your in-memory store is accessed by 50 threads. Make it correct without making it slow.',
        2, 25, ['principles', 'concurrency'],
        ['Identifies the actual shared mutable state first',
         'Picks the narrowest lock scope that is still correct',
         'Uses concurrent collections rather than wrapping everything in synchronized',
         'Names a deadlock scenario and a lock-ordering rule to prevent it',
         'Distinguishes atomicity from visibility (volatile is not a lock)']]
    ]
  },

  1: {
    label: 'Classic machine coding',
    note: 'The standard set. Do each one in a timed sitting, on paper or in an editor with no internet, and make it actually run.',
    items: [
      ['parking-lot', 'Design a parking lot',
        'Multi-floor parking lot, several vehicle sizes, ticketing and pricing. Working code in 60 minutes.',
        3, 60, ['classic'],
        ['Enumerates requirements out loud and freezes scope before coding',
         'Vehicle and slot types modelled so a new type needs no edits to existing classes',
         'Slot allocation strategy behind an interface (nearest, cheapest, random)',
         'Pricing as a strategy, hourly and daily, not hard-coded',
         'Concurrency on slot assignment addressed at least in comments',
         'Runs, with a main() that demonstrates park, unpark and pay']],

      ['elevator', 'Design an elevator system',
        'N elevators, M floors, internal and external requests. Scheduling included.',
        3, 60, ['classic'],
        ['Separates the request queue from the elevator state machine',
         'Direction-aware scheduling (SCAN/LOOK), not naive nearest-elevator',
         'Elevator state as an explicit enum with legal transitions',
         'Dispatcher picks the elevator; the elevator does not pick itself',
         'Handles the empty-idle case and the all-busy case']],

      ['vending-machine', 'Design a vending machine',
        'Coins in, product out, change returned, inventory tracked.',
        2, 45, ['classic'],
        ['State pattern for idle / collecting / dispensing / refunding',
         'Change-making handled including the cannot-make-change case',
         'Inventory decrement is atomic with the dispense',
         'Refund path is a first-class flow, not an afterthought',
         'Invalid transitions rejected rather than ignored']],

      ['tic-tac-toe', 'Design tic-tac-toe / Snake and Ladder',
        'Generalised N×N board game with pluggable win conditions.',
        2, 40, ['classic'],
        ['Board generalised to N, not hard-coded to 3',
         'Win check in O(1) per move via running counters, not a full board scan',
         'Player abstraction that would allow a bot',
         'Game loop separated from board and rules',
         'Draw and invalid-move handling']],

      ['deck-of-cards', 'Design a card game',
        'Deck, shuffle, deal, and one concrete game on top of it.',
        1, 35, ['classic'],
        ['Card as an immutable value type',
         'Deck operations separated from game rules',
         'Shuffle correctness — Fisher-Yates, not sort-by-random',
         'Rules pluggable so a second game reuses the deck',
         'Hand comparison as a strategy']],

      ['atm', 'Design an ATM',
        'Authenticate, check balance, withdraw with denomination handling, dispense.',
        2, 45, ['classic'],
        ['State pattern across the session',
         'Denomination selection as a strategy, with the insufficient-notes case',
         'Transaction atomicity: debit and dispense cannot half-happen',
         'Card and PIN handling separated from the transaction logic',
         'Audit trail as an explicit concern']]
    ]
  },

  2: {
    label: 'Product machine coding',
    note: 'What the Indian product companies actually put in front of you. Closer to a small real system than a puzzle — and 90 minutes goes very fast.',
    items: [
      ['splitwise', 'Design Splitwise',
        'Users, groups, expenses split equally / by exact amount / by percentage, and a simplified settle-up.',
        3, 90, ['product', 'india'],
        ['Split strategy behind one interface with three implementations',
         'Balance stored per pair or derived — the choice made explicitly',
         'Expense is immutable; corrections are new entries',
         'Settle-up simplification (minimise transactions) at least described',
         'Validates that splits sum to the total, with a real error',
         'Runs end to end with a demo scenario']],

      ['bookmyshow-lld', 'Design BookMyShow (code)',
        'Cinemas, shows, seat layout, booking with hold-and-confirm. Working code.',
        3, 90, ['product', 'india', 'concurrency'],
        ['Seat hold with expiry modelled as real state, not a boolean',
         'Double-booking prevented by an actual mechanism you can point at',
         'Show / screen / seat modelled so a new layout needs no code change',
         'Pricing per seat class as a strategy',
         'Booking state machine including expiry and payment failure']],

      ['cab-booking', 'Design a cab booking service',
        'Riders, drivers, matching by location, trip lifecycle, fare calculation.',
        3, 90, ['product', 'india'],
        ['Matching strategy pluggable (nearest, highest-rated, surge-aware)',
         'Trip state machine with every transition enumerated',
         'Driver availability updates without a full scan',
         'Fare calculation as a composable set of rules',
         'The two-riders-one-driver race handled']],

      ['food-ordering-lld', 'Design a food ordering system',
        'Restaurants, menus, cart, order placement, and delivery assignment.',
        3, 90, ['product', 'india'],
        ['Cart and order as separate types with a clear conversion',
         'Menu versioning so an in-flight cart is not silently corrupted',
         'Order state machine across restaurant and delivery partner',
         'Delivery assignment strategy pluggable',
         'Offers/discounts as composable rules, not if-else in checkout']],

      ['inventory-cart', 'Design an e-commerce cart and inventory',
        'Add to cart, apply offers, reserve inventory, place order.',
        2, 75, ['product'],
        ['Reservation distinct from decrement, with a TTL',
         'Oversell prevented under concurrent checkout',
         'Offer engine composable and order-of-application defined',
         'Price captured at order time, not read live at confirmation',
         'Idempotent place-order']],

      ['lru-cache-lld', 'Implement an LRU cache',
        'O(1) get and put, with eviction — and then make it thread-safe and add a TTL.',
        3, 40, ['product', 'coding'],
        ['HashMap plus doubly-linked list, both directions maintained',
         'get() is a mutation — it moves the node',
         'All edge cases: capacity 1, update-existing, evict-then-insert',
         'Thread safety added without a lock around the whole map',
         'TTL layered on without breaking O(1)']],

      ['rate-limiter-lld', 'Implement a rate limiter',
        'Token bucket per user, thread-safe, then swap in sliding window without changing callers.',
        3, 45, ['product', 'coding'],
        ['Interface first, so the algorithm is swappable',
         'Lazy token refill by elapsed time — no background thread',
         'Per-key state with bounded memory and eviction',
         'Thread safety per key, not one global lock',
         'Tests that actually advance a clock rather than sleeping']],

      ['logging-framework', 'Design a logging framework',
        'Levels, multiple sinks, formatting, async writes.',
        2, 45, ['product'],
        ['Level filtering evaluated before message construction',
         'Appenders/sinks pluggable — console, file, network',
         'Formatter separate from appender',
         'Async buffering with a bounded queue and a drop policy',
         'Chain of responsibility or observer, chosen deliberately']],

      ['notification-lld', 'Design a notification service (code)',
        'Multiple channels, user preferences, templates, retries.',
        2, 60, ['product'],
        ['Channel interface with per-channel implementations',
         'Preference check before dispatch, per channel',
         'Template rendering separated from sending',
         'Retry policy as a strategy with backoff',
         'Observer for delivery status callbacks']],

      ['chess-lld', 'Design chess',
        'Board, pieces, legal move generation, check and checkmate.',
        1, 90, ['product'],
        ['Piece movement polymorphic, not a switch on type',
         'Board validates; pieces propose',
         'Special moves handled: castling, en passant, promotion',
         'Check detection separate from move legality',
         'Move history enabling undo']]
    ]
  },

  3: {
    label: 'Stretch',
    note: 'Harder than most rounds go. One pass each, late.',
    items: [
      ['inmemory-db', 'Design an in-memory DB with transactions',
        'Key-value store supporting BEGIN, COMMIT, ROLLBACK, including nested transactions.',
        1, 60, ['stretch'],
        ['Transaction stack for nesting',
         'Undo log or copy-on-write, with the memory trade-off stated',
         'Rollback restores exactly, including deletes',
         'Reads see uncommitted state within the transaction',
         'Commit at the outermost level only']],

      ['task-scheduler-lld', 'Design a task scheduler',
        'Schedule one-off and recurring tasks with priorities and a worker pool.',
        1, 60, ['stretch', 'concurrency'],
        ['Priority queue keyed by next-run time',
         'Worker pool with graceful shutdown',
         'Recurring tasks rescheduled after completion, not before',
         'A slow task cannot block unrelated tasks',
         'Cancellation that actually interrupts']],

      ['text-editor', 'Design a text editor with undo',
        'Insert, delete, cursor movement, unlimited undo/redo.',
        1, 60, ['stretch'],
        ['Command pattern with inverse operations',
         'Undo and redo stacks, and redo invalidated by a new edit',
         'Buffer representation chosen with a reason (gap buffer, rope, piece table)',
         'Coalescing consecutive typing into one undo unit',
         'Cursor as part of the command state']]
    ]
  }
};

/* ========================================================================== */
/*  BHV — behavioural / hiring manager                                        */
/* ========================================================================== */

const BHV = {
  0: {
    label: 'The ones you will definitely be asked',
    note: 'Every loop opens and closes with some version of these. Rehearsed does not mean scripted — it means you have chosen which story you are telling before you are asked.',
    items: [
      ['tell-me-about-yourself', 'Tell me about yourself',
        'Two minutes. Who you are professionally, what you have built, why you are in this room.',
        3, 3, ['opener'],
        ['Under two minutes — timed, not estimated',
         'Present, past, future structure rather than a CV recital',
         'Names one concrete thing you built, with a number',
         'Ends by connecting to why this role',
         'No apologising for the current company or salary']],

      ['why-leaving', 'Why are you leaving your current job?',
        'Answer honestly without criticising your employer, and without sounding like you are only chasing money.',
        3, 3, ['opener'],
        ['Frames it as moving toward something, not fleeing',
         'Names a specific capability the new role offers',
         'Zero criticism of current manager or teammates',
         'Consistent with whatever your resume dates imply',
         'Does not volunteer the compensation reason first']],

      ['why-this-company', 'Why this company?',
        'Give a reason that could not be copy-pasted to their competitor.',
        3, 3, ['opener'],
        ['Names something specific: a product, a scale problem, an engineering post',
         'Connects it to something you have actually done',
         'Not "great culture" or "I want to learn"',
         'Shows you know what the team you are interviewing for owns']],

      ['biggest-project', 'Walk me through your most complex project',
        'Pick the thing you can go deepest on. Expect three levels of follow-up on any decision you mention.',
        3, 10, ['depth'],
        ['Problem stated before solution, with why it mattered',
         'Your contribution separated clearly from the team\'s',
         'One design decision explained with the alternative you rejected',
         'A number: latency, scale, cost, time saved',
         'Survives "why not X instead" without collapsing',
         'Names what you would do differently now']],

      ['questions-for-us', 'Do you have questions for us?',
        'Have four ready. This is a scored part of the round, not the exit.',
        3, 5, ['closer'],
        ['Questions specific to the team, not the company website',
         'At least one about how the team actually works day to day',
         'One that shows you thought about their technical problems',
         'Nothing answerable by ten seconds of searching',
         'Does not ask about leave policy in a technical round']],

      ['salary-expectations', 'What are your compensation expectations?',
        'You are at 4.5 LPA and targeting 30+. Answer without anchoring yourself to your current number.',
        3, 3, ['closer', 'negotiation'],
        ['Deflects to the role\'s band first, at least once',
         'If pressed, gives a researched range for the role and city — not a multiple of current salary',
         'Never states current CTC as the basis for the ask',
         'Range is defensible against "why that number"',
         'Stays calm — this is the highest-leverage ninety seconds of the process']]
    ]
  },

  1: {
    label: 'Amazon Leadership Principles',
    note: 'Amazon is the extreme case, but these are simply good behavioural questions — prepared stories here cover the manager round everywhere else. Two stories per principle, and expect to be asked for a second when the first is too shallow.',
    items: [
      ['lp-customer-obsession', 'Customer obsession',
        'Tell me about a time you used customer feedback to drive a change.',
        3, 6, ['amazon', 'lp'],
        ['A real customer or user, not an internal stakeholder standing in for one',
         'Shows you sought the feedback rather than received it passively',
         'The change is attributable to you',
         'Outcome measured from the customer\'s side']],

      ['lp-ownership', 'Ownership',
        'Tell me about a time you took on something outside your job description.',
        3, 6, ['amazon', 'lp'],
        ['Nobody assigned it to you',
         'You saw the consequence of it not being done',
         'You finished it, including the unglamorous part',
         'Long-term framing — not a one-off heroic weekend']],

      ['lp-invent-simplify', 'Invent and simplify',
        'Tell me about a time you found a significantly simpler way to do something.',
        2, 6, ['amazon', 'lp'],
        ['The old way is described well enough that its cost is obvious',
         'Simplification is structural, not cosmetic',
         'Quantified: lines removed, steps removed, time saved',
         'You considered and rejected the more complex option']],

      ['lp-dive-deep', 'Dive deep',
        'Tell me about a time you had to dig into data to find the root cause of a problem.',
        3, 6, ['amazon', 'lp'],
        ['Starts from a symptom, not from already knowing the answer',
         'Names the specific tool or query used',
         'Shows a hypothesis being disproved along the way',
         'Root cause is a mechanism, not a person']],

      ['lp-bias-for-action', 'Bias for action',
        'Tell me about a time you made a decision without complete information.',
        3, 6, ['amazon', 'lp'],
        ['States what information was missing and why waiting cost more',
         'Reversible vs irreversible decision distinguished',
         'You owned the outcome, including if it went badly',
         'Not recklessness — you bounded the downside']],

      ['lp-highest-standards', 'Insist on the highest standards',
        'Tell me about a time you refused to accept something that was "good enough".',
        2, 6, ['amazon', 'lp'],
        ['The standard is specific and was written down or measurable',
         'You pushed back at some cost to yourself',
         'Shows judgement — you did not block a launch over a lint rule',
         'Outcome justified the friction']],

      ['lp-earn-trust', 'Earn trust',
        'Tell me about a time you received difficult feedback.',
        3, 6, ['amazon', 'lp'],
        ['The feedback is genuinely unflattering — not a humblebrag',
         'You did not argue in the moment',
         'A specific behaviour changed afterwards',
         'You can say what the person would say about you now']],

      ['lp-deliver-results', 'Deliver results',
        'Tell me about a time you hit a hard deadline under pressure.',
        3, 6, ['amazon', 'lp'],
        ['The constraint was real and external',
         'You made explicit trade-offs, and can name what you cut',
         'Delivered, with a number attached',
         'No implication that you simply worked 90-hour weeks']],

      ['lp-disagree-commit', 'Have backbone; disagree and commit',
        'Tell me about a time you disagreed with your manager or team, and what happened after.',
        3, 6, ['amazon', 'lp'],
        ['You disagreed clearly and with evidence, in the room',
         'You lost, or partially lost, and then committed genuinely',
         'No sulking in the retelling',
         'Names what you learned about how you argue']],

      ['lp-learn-be-curious', 'Learn and be curious',
        'Tell me about something significant you taught yourself recently.',
        2, 6, ['amazon', 'lp'],
        ['Specific, with what you built as a result',
         'Motivated by a problem rather than by a course',
         'You can go deep if they probe',
         'Shows a habit, not a single instance']],

      ['lp-think-big', 'Think big',
        'Tell me about a time you proposed something larger than what was asked for.',
        1, 6, ['amazon', 'lp'],
        ['The bigger idea is concrete, not a slogan',
         'You made a case to people who could say no',
         'You had a path from the small version to the big one',
         'Outcome stated even if it was rejected']],

      ['lp-frugality', 'Frugality',
        'Tell me about a time you achieved something with fewer resources than were needed.',
        1, 6, ['amazon', 'lp'],
        ['Constraint named specifically: money, people, or time',
         'The solution is inventive rather than merely cheap',
         'Quantified saving',
         'Quality did not quietly drop']]
    ]
  },

  2: {
    label: 'Depth and conflict',
    note: 'Where prepared answers usually fall apart. Interviewers push on these because the second and third follow-up is where the truth is.',
    items: [
      ['biggest-failure', 'Tell me about your biggest failure',
        'A real one, with real consequences, and what changed afterwards.',
        3, 6, ['depth'],
        ['An actual failure — not "I care too much"',
         'You own your part without dragging in others',
         'Consequence is concrete',
         'The lesson produced a specific behaviour change you can name',
         'You did not need to be rescued by luck']],

      ['conflict-teammate', 'A conflict with a teammate',
        'Describe a real disagreement and how it resolved.',
        3, 6, ['depth'],
        ['The other person\'s position is stated fairly',
         'You went to them directly before escalating',
         'Resolution is a decision, not "we agreed to disagree"',
         'The working relationship survived',
         'You can say what you got wrong']],

      ['prod-incident', 'A mistake that reached production',
        'What broke, what you did in the first ten minutes, and what stopped it recurring.',
        3, 6, ['depth'],
        ['Mitigate first, root-cause second — in that order',
         'Communicated early rather than quietly fixing',
         'Blameless framing of the cause',
         'A concrete guardrail added afterwards: test, alert, or process',
         'Impact quantified honestly']],

      ['ambiguous-requirements', 'Working with unclear requirements',
        'You were given a task nobody could fully specify. What did you do?',
        2, 6, ['depth'],
        ['You wrote down your interpretation and got it confirmed',
         'Built something small to make the ambiguity concrete',
         'Named the assumptions explicitly',
         'Did not stall waiting for perfect clarity']],

      ['led-without-authority', 'Leading without authority',
        'A time you drove something across people who did not report to you.',
        2, 6, ['depth'],
        ['You did not have the power to direct anyone',
         'Persuasion is described specifically — what you showed them',
         'You handled at least one holdout',
         'The thing actually shipped']],

      ['tight-deadline-tradeoff', 'Cutting scope under pressure',
        'A time you had to ship less than was asked for.',
        2, 6, ['depth'],
        ['You proposed the cut rather than silently under-delivering',
         'The cut is justified by user impact',
         'Stakeholders agreed before the fact',
         'You have a view on whether it was the right call']],

      ['mentoring', 'Helping someone else level up',
        'A time you made another engineer better.',
        1, 5, ['depth'],
        ['Specific person, specific gap',
         'What you actually did, repeatedly',
         'Their outcome, not your effort',
         'Shows you can review code without being unpleasant']],

      ['pushback-on-product', 'Pushing back on a request',
        'A time you told a PM or manager that something should not be built.',
        2, 6, ['depth'],
        ['You brought data or a prototype, not an opinion',
         'You offered an alternative rather than only refusing',
         'Respectful of the fact that they might know something you do not',
         'Outcome stated either way']]
    ]
  },

  3: {
    label: 'Hiring manager round',
    note: 'The round that decides your level and often your number. It is a conversation about judgement, not a quiz.',
    items: [
      ['how-you-prioritise', 'How do you decide what to work on?',
        'You have four things and time for two. Walk me through it.',
        2, 5, ['manager'],
        ['A stated frame — impact vs effort, or blast radius',
         'Consults stakeholders rather than deciding alone',
         'Says what happens to the two you dropped',
         'A real example, not a hypothetical']],

      ['when-blocked', 'What do you do when you are stuck?',
        'Your honest process, including how long you wait before asking.',
        2, 4, ['manager'],
        ['A concrete time box before escalating',
         'What you try first, in order',
         'How you ask — with context and what you already tried',
         'No pretence that you are never stuck']],

      ['code-review-disagreement', 'A code review disagreement',
        'A reviewer blocked your PR over something you thought was wrong.',
        2, 5, ['manager'],
        ['Distinguishes preference from correctness',
         'Moved off the PR thread to a conversation',
         'Willing to lose a style argument',
         'Would block someone else\'s PR for the right reason']],

      ['first-90-days', 'What would your first 90 days here look like?',
        'Give a plan that shows you know what onboarding actually costs.',
        1, 5, ['manager'],
        ['Learn before changing — a stated ramp',
         'Names shipping something small early',
         'Identifies who they would need to build a relationship with',
         'Realistic about not being productive in week one']],

      ['level-justification', 'Why do you think you are at this level?',
        'You are asking for a large jump from your current band. Justify the level, not the salary.',
        2, 6, ['manager', 'negotiation'],
        ['Argues from scope and impact, not years of experience',
         'Cites a specific piece of work at the target level',
         'Acknowledges a gap and how you are closing it',
         'Does not reference current compensation at all',
         'Confident without being defensive about the jump']],

      ['career-goals', 'Where do you want to be in three years?',
        'An answer consistent with actually taking this job.',
        1, 4, ['manager'],
        ['Specific enough to be falsifiable',
         'Compatible with the role on offer',
         'Shows a direction — depth, breadth, or leadership — chosen deliberately',
         'Not "your job"']]
    ]
  }
};

/* -------------------------------------------------------------------------- */

function flatten(track, tiers) {
  const out = [];
  for (const [tier, group] of Object.entries(tiers)) {
    group.items.forEach(([slug, title, prompt, weight, minutes, tags, checklist], seq) => {
      out.push({
        key: `${track}:${slug}`,
        track,
        title,
        prompt,
        blurb: null,
        tier: Number(tier),
        seq,
        weight,
        minutes,
        tags,
        checklist
      });
    });
  }
  return out;
}

export const PREP_ITEMS = [
  ...flatten('hld', HLD),
  ...flatten('lld', LLD),
  ...flatten('bhv', BHV)
];

export const PREP_KEYS = new Set(PREP_ITEMS.map((i) => i.key));

/* Tier labels, exposed so the UI does not have to restate them. */
export const TIERS = {
  hld: Object.entries(HLD).map(([id, g]) => ({ id: Number(id), label: g.label, note: g.note })),
  lld: Object.entries(LLD).map(([id, g]) => ({ id: Number(id), label: g.label, note: g.note })),
  bhv: Object.entries(BHV).map(([id, g]) => ({ id: Number(id), label: g.label, note: g.note }))
};

export const TRACKS = [
  { id: 'hld', label: 'System design', short: 'HLD',
    blurb: 'The round that decides whether you get an SDE-2 offer or an SDE-1 one. Practice out loud and timed — thinking it through silently is a different skill from holding a room.' },
  { id: 'lld', label: 'Machine coding', short: 'LLD',
    blurb: 'The most under-prepared round in Indian product interviews, and often the one that actually decides the offer. Working, extensible code under a clock.' },
  { id: 'bhv', label: 'Behavioural', short: 'BHV',
    blurb: 'Six well-shaped stories cover almost every question here. Build the bank once, then aim it — that is what the story list below is for.' }
];
