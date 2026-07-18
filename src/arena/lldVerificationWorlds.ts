export type LldVerificationWorldId =
  | "circular-buffer"
  | "lru-cache"
  | "amazon-locker"
  | "vending-machine"
  | "elevator";

export type LldArtifactKind = "state" | "behavior" | "policy";

export interface LldWorldNode {
  id: string;
  label: string;
  beginnerName: string;
  description: string;
}

export interface LldWorldArtifact {
  id: string;
  label: string;
  beginnerName: string;
  description: string;
  kind: LldArtifactKind;
  referenceOwnerId: string;
  reason: string;
}

export interface LldWorldIncident {
  id: string;
  title: string;
  dispatchLabel: string;
  story: string;
  goal: string;
  requiredArtifactIds: string[];
  trace: string[];
  failure: string;
  success: string;
  lesson: string;
  principle: string;
}

export interface LldVerificationWorld {
  id: LldVerificationWorldId;
  questionId: string;
  title: string;
  systemName: string;
  tagline: string;
  intro: string;
  accent: string;
  initialOwnerId: string;
  nodes: LldWorldNode[];
  artifacts: LldWorldArtifact[];
  incidents: LldWorldIncident[];
  defense: {
    prompt: string;
    ownerTerms: string[];
    evidenceTerms: string[];
    changeTerms: string[];
    verifiedSummary: string;
  };
}

export const LLD_VERIFICATION_WORLDS: LldVerificationWorld[] = [
  {
    id: "circular-buffer",
    questionId: "lld-circular-buffer",
    title: "Ring Under Pressure",
    systemName: "Circular Buffer",
    tagline: "Make wraparound, full, empty, overwrite, and concurrency agree on one invariant.",
    intro: "Operate a broken event recorder. Every incident exposes one piece of ring state that lives too far from the action protecting it.",
    accent: "#6ed6c4",
    initialOwnerId: "app",
    nodes: [
      { id: "app", label: "BufferApp", beginnerName: "The surrounding application", description: "Uses the buffer but should not manipulate its internal cursor math." },
      { id: "buffer", label: "CircularBuffer", beginnerName: "The ring itself", description: "Owns storage, cursors, size, and the atomic operations that preserve the ring invariant." },
      { id: "policy", label: "OverflowPolicy", beginnerName: "The full-buffer rule", description: "Decides whether a full write is rejected or overwrites the oldest value." },
      { id: "gate", label: "BufferGate", beginnerName: "The producer/consumer gate", description: "Coordinates waiting producers and consumers without leaking locks into callers." },
    ],
    artifacts: [
      { id: "storage", label: "elements", beginnerName: "Ring storage", description: "The fixed array whose slots are reused.", kind: "state", referenceOwnerId: "buffer", reason: "The buffer owns the memory whose indexes it interprets." },
      { id: "capacity", label: "capacity", beginnerName: "Maximum slots", description: "The fixed number of values that fit.", kind: "state", referenceOwnerId: "buffer", reason: "Capacity participates in every cursor wrap calculation." },
      { id: "head", label: "head", beginnerName: "Next value to read", description: "Cursor pointing at the oldest live value.", kind: "state", referenceOwnerId: "buffer", reason: "Only the ring can keep its read cursor consistent with storage." },
      { id: "tail", label: "tail", beginnerName: "Next slot to write", description: "Cursor pointing at the next reusable slot.", kind: "state", referenceOwnerId: "buffer", reason: "Only the ring can keep its write cursor consistent with storage." },
      { id: "size", label: "size", beginnerName: "Number of live values", description: "Distinguishes empty from full even when the cursors meet.", kind: "state", referenceOwnerId: "buffer", reason: "The ring updates size with every successful read or write." },
      { id: "offer", label: "offer(value)", beginnerName: "Write one value", description: "Stores a value and advances ring state atomically.", kind: "behavior", referenceOwnerId: "buffer", reason: "Writing must update storage, tail, and size as one invariant-preserving action." },
      { id: "poll", label: "poll()", beginnerName: "Read one value", description: "Returns the oldest value and advances ring state atomically.", kind: "behavior", referenceOwnerId: "buffer", reason: "Reading must update head and size beside the state it changes." },
      { id: "is-empty", label: "isEmpty()", beginnerName: "Check whether nothing is stored", description: "Derives empty state from the ring's own count.", kind: "behavior", referenceOwnerId: "buffer", reason: "The object holding size can answer empty without exposing fields." },
      { id: "is-full", label: "isFull()", beginnerName: "Check whether every slot is live", description: "Derives full state from size and capacity.", kind: "behavior", referenceOwnerId: "buffer", reason: "The object holding both values owns the derived rule." },
      { id: "overflow", label: "onFullWrite()", beginnerName: "Choose reject or overwrite", description: "Encapsulates the requirement that changes when the buffer is full.", kind: "policy", referenceOwnerId: "policy", reason: "Overflow behavior varies independently from ring mechanics." },
      { id: "await-data", label: "awaitData()", beginnerName: "Wait for a readable value", description: "Parks a consumer without busy-spinning.", kind: "behavior", referenceOwnerId: "gate", reason: "Concurrency coordination belongs behind one gate, not in every caller." },
      { id: "signal-space", label: "signalSpace()", beginnerName: "Wake a waiting writer", description: "Signals that a read freed one slot.", kind: "behavior", referenceOwnerId: "gate", reason: "The same gate owns the conditions used by producers and consumers." },
    ],
    incidents: [
      { id: "wrap", title: "The cursor crosses zero", dispatchLabel: "Write A, B, C; read twice; write D, E", story: "The recorder reaches the end of its array and must reuse slot zero without changing logical order.", goal: "Keep physical indexes wrapped while reads still return oldest-first.", requiredArtifactIds: ["storage", "capacity", "head", "tail"], trace: ["Values fill the last physical slots", "The write cursor wraps to slot zero", "The read cursor preserves logical order", "D and E are returned after C"], failure: "The application is doing cursor arithmetic outside the ring, so physical wraparound corrupted logical order.", success: "The CircularBuffer kept storage and both cursors together, so modulo wraparound preserved FIFO order.", lesson: "State that changes together belongs together: storage, capacity, head, and tail form one ring invariant.", principle: "Encapsulation · protect the representation invariant" },
      { id: "ambiguity", title: "Head meets tail", dispatchLabel: "Fill the ring completely", story: "Head and tail have the same index when the ring is empty—and again when it is full.", goal: "Make empty and full unambiguous without asking the application to remember history.", requiredArtifactIds: ["size", "is-empty", "is-full"], trace: ["Head and tail point at the same slot", "The ring reads its live-value count", "Empty and full resolve differently", "A valid read or rejection follows"], failure: "The caller only compared two cursors, so it could not distinguish a full ring from an empty one.", success: "CircularBuffer used its own size and capacity to distinguish both states without exposing cursor details.", lesson: "A representation needs enough state to make impossible ambiguities unrepresentable.", principle: "Invariant design · explicit size" },
      { id: "overwrite", title: "Telemetry cannot stop", dispatchLabel: "Write into a full recorder", story: "Product changes the rule: new telemetry must overwrite the oldest sample instead of being rejected.", goal: "Change the full-buffer rule without rewriting cursor mechanics.", requiredArtifactIds: ["offer", "poll", "overflow"], trace: ["A write reaches a full ring", "The overflow rule chooses overwrite", "The oldest value is released", "The normal write advances the ring"], failure: "Full-buffer policy is mixed into application and cursor code, so one requirement change spreads across unrelated logic.", success: "OverflowPolicy selected overwrite while CircularBuffer kept offer and poll responsible for safe state transitions.", lesson: "Introduce a policy only where a real requirement varies; keep ring mechanics stable.", principle: "Open/Closed · Strategy for overflow" },
      { id: "concurrency", title: "Producer meets consumer", dispatchLabel: "Run one empty read and one delayed write", story: "A consumer arrives before data and a producer arrives later. Neither may spin or corrupt size.", goal: "Coordinate waiting without giving locks and condition variables to application code.", requiredArtifactIds: ["await-data", "signal-space"], trace: ["Consumer finds the ring empty", "The gate suspends the consumer", "Producer writes and signals", "Consumer resumes and reads once"], failure: "Callers coordinate locks independently, so a signal can be missed and the consumer waits forever.", success: "BufferGate owned both waiting and signaling, containing concurrency without exposing ring internals.", lesson: "Synchronization is a boundary responsibility; callers should see offer and poll, not locks.", principle: "Single Responsibility · concurrency boundary" },
    ],
    defense: { prompt: "Explain the ring invariant, how full differs from empty, and which class changes when overwrite or blocking behavior changes.", ownerTerms: ["circularbuffer", "overflowpolicy", "buffergate"], evidenceTerms: ["wrap", "head", "tail", "producer", "consumer", "full", "empty"], changeTerms: ["overwrite", "blocking", "policy", "concurrency"], verifiedSummary: "Repaired and reran wraparound, full/empty ambiguity, overwrite policy, and producer/consumer incidents, then defended the Circular Buffer invariant." },
  },
  {
    id: "lru-cache",
    questionId: "lld-lru-cache",
    title: "Recency Under Fire",
    systemName: "LRU Cache",
    tagline: "Make lookup and recency change together in O(1), then survive eviction and TTL.",
    intro: "Operate a cache whose values are correct until pressure changes access order. Repair the object model, not one example trace.",
    accent: "#83b8f4",
    initialOwnerId: "manager",
    nodes: [
      { id: "manager", label: "CacheManager", beginnerName: "The god-object manager", description: "The deliberately broken starting point; it reaches into every detail." },
      { id: "cache", label: "LruCache", beginnerName: "The cache boundary", description: "Owns capacity, direct lookup, and the public get/put contract." },
      { id: "list", label: "RecencyList", beginnerName: "The recency lane", description: "Moves known nodes and removes the least-recent node in constant time." },
      { id: "node", label: "CacheNode", beginnerName: "One cached entry", description: "Carries one key/value and links to neighboring entries." },
      { id: "ttl", label: "ExpirationPolicy", beginnerName: "The expiry rule", description: "Uses time to decide whether an otherwise cached entry is stale." },
    ],
    artifacts: [
      { id: "capacity", label: "capacity", beginnerName: "Maximum entries", description: "The hard upper bound for live cache entries.", kind: "state", referenceOwnerId: "cache", reason: "The cache enforces its own capacity after every put." },
      { id: "index", label: "Map<K, CacheNode>", beginnerName: "Key-to-entry index", description: "Finds an entry directly without walking recency order.", kind: "state", referenceOwnerId: "cache", reason: "The public cache boundary owns direct lookup and keeps it synchronized with eviction." },
      { id: "get", label: "get(key)", beginnerName: "Read and refresh", description: "Returns a value and makes its entry most recent.", kind: "behavior", referenceOwnerId: "cache", reason: "A successful read must coordinate lookup and recency as one public operation." },
      { id: "put", label: "put(key, value)", beginnerName: "Insert or update", description: "Writes a value, refreshes recency, and enforces capacity.", kind: "behavior", referenceOwnerId: "cache", reason: "The cache boundary coordinates the map and list without exposing either." },
      { id: "head", label: "leastRecent", beginnerName: "Oldest end", description: "Points to the entry evicted next.", kind: "state", referenceOwnerId: "list", reason: "The recency structure owns its boundary pointers." },
      { id: "tail", label: "mostRecent", beginnerName: "Newest end", description: "Points to the most recently used entry.", kind: "state", referenceOwnerId: "list", reason: "The recency structure owns its boundary pointers." },
      { id: "move", label: "moveToMostRecent(node)", beginnerName: "Refresh one entry", description: "Unlinks a known node and appends it to the newest end.", kind: "behavior", referenceOwnerId: "list", reason: "The list owns link mutation and can do it in O(1)." },
      { id: "evict", label: "removeLeastRecent()", beginnerName: "Remove the eviction victim", description: "Unlinks and returns the oldest live node.", kind: "behavior", referenceOwnerId: "list", reason: "The recency list can identify and remove the oldest node directly." },
      { id: "key", label: "key", beginnerName: "Entry key", description: "The key represented by one linked node.", kind: "state", referenceOwnerId: "node", reason: "The index removes an evicted entry using the node's own key." },
      { id: "value", label: "value", beginnerName: "Entry value", description: "The cached payload for one key.", kind: "state", referenceOwnerId: "node", reason: "The value belongs to the entry whose recency is tracked." },
      { id: "links", label: "previous / next", beginnerName: "Neighbor links", description: "Pointers that allow constant-time removal.", kind: "state", referenceOwnerId: "node", reason: "Each node carries the links used to move that exact entry." },
      { id: "expires", label: "isExpired(node, now)", beginnerName: "Check whether an entry is stale", description: "Applies the current TTL and clock rule.", kind: "policy", referenceOwnerId: "ttl", reason: "Expiration changes independently from recency and lookup." },
    ],
    incidents: [
      { id: "lookup", title: "The tenth-thousandth key", dispatchLabel: "Read one key from 10,000 entries", story: "A linked list alone preserves order but makes key lookup linear.", goal: "Find a cached entry directly without giving up exact recency order.", requiredArtifactIds: ["capacity", "index", "key", "value"], trace: ["A get request names one key", "The index finds its exact node", "The node returns its value", "No recency scan occurs"], failure: "The manager walks every cached entry because direct lookup and node identity are not modeled together.", success: "LruCache found the CacheNode through its map, preserving O(1) lookup.", lesson: "The map answers where; the linked node carries what and where-in-order.", principle: "Composition · map plus linked structure" },
      { id: "refresh", title: "A read changes the future", dispatchLabel: "Get A, then overflow the cache", story: "Reading A must save it from the next eviction; a pure value lookup is not enough.", goal: "Make a successful read and recency refresh one atomic cache operation.", requiredArtifactIds: ["get", "head", "tail", "move", "links"], trace: ["get(A) finds A's node", "The recency lane unlinks A", "A becomes most recent", "A survives the next overflow"], failure: "The value was returned without refreshing recency, so the cache later evicted the key that was just used.", success: "LruCache coordinated lookup with RecencyList.moveToMostRecent in one get operation.", lesson: "An API operation owns every state change required by its contract, not only the returned value.", principle: "Encapsulation · atomic get invariant" },
      { id: "eviction", title: "Capacity breaks", dispatchLabel: "Put one entry beyond capacity", story: "The cache must evict exactly one least-recent node and remove the same key from the map.", goal: "Keep the map and recency lane consistent during insert, update, and eviction.", requiredArtifactIds: ["put", "evict"], trace: ["put inserts or updates one node", "The node becomes most recent", "Capacity is exceeded", "The least-recent node and map key disappear together"], failure: "Eviction changed the list but left a ghost map entry, so a later get returned a value that should be gone.", success: "LruCache enforced capacity while RecencyList removed the exact victim in O(1).",
        lesson: "Two data structures can form one invariant when a single boundary coordinates their mutations.", principle: "Consistency boundary · O(1) eviction" },
      { id: "ttl", title: "Fresh in order, stale in time", dispatchLabel: "Read an expired most-recent entry", story: "A follow-up adds TTL. The newest entry can still be expired.", goal: "Add time-based validity without rewriting recency mechanics.", requiredArtifactIds: ["expires"], trace: ["get finds the node", "Expiration policy evaluates the clock", "The stale node is removed from map and list", "The cache reports a miss"], failure: "TTL logic is scattered through nodes and list links, coupling a time rule to recency mechanics.", success: "ExpirationPolicy decided staleness while LruCache reused its normal removal path.", lesson: "TTL is a separate policy; expiration still exits through the cache's consistency boundary.", principle: "Open/Closed · expiration policy" },
    ],
    defense: { prompt: "Explain the map/list invariant, why get mutates recency, how eviction stays O(1), and where TTL belongs.", ownerTerms: ["lrucache", "recencylist", "cachenode", "expirationpolicy"], evidenceTerms: ["refresh", "evict", "ghost", "capacity", "ttl", "expired"], changeTerms: ["ttl", "expiration", "lfu", "policy", "capacity"], verifiedSummary: "Repaired and reran direct lookup, read refresh, O(1) eviction, and TTL incidents, then defended the LRU map/list invariant." },
  },
  {
    id: "amazon-locker",
    questionId: "lld-amazon-locker",
    title: "Locker Bank Live Ops",
    systemName: "Amazon Locker",
    tagline: "Allocate the smallest fitting locker, protect pickup, and survive expiration and outages.",
    intro: "Run courier and customer traffic through a broken locker bank. Repair lifecycle ownership before the next package gets stranded.",
    accent: "#f0b85f",
    initialOwnerId: "controller",
    nodes: [
      { id: "controller", label: "LockerController", beginnerName: "The god-object controller", description: "The broken starting point that knows packages, doors, codes, and policy." },
      { id: "bank", label: "LockerBank", beginnerName: "One locker location", description: "Coordinates available lockers and package lifecycle at one location." },
      { id: "locker", label: "Locker", beginnerName: "One physical locker", description: "Owns size, availability, health, and the package currently inside." },
      { id: "package", label: "Package", beginnerName: "One package", description: "Owns identity, required size, and lifecycle timestamps." },
      { id: "policy", label: "AllocationPolicy", beginnerName: "The locker chooser", description: "Selects the smallest healthy locker that fits a package." },
      { id: "codes", label: "PickupCodeService", beginnerName: "The pickup-code guard", description: "Issues and verifies expiring codes without exposing secrets to lockers." },
    ],
    artifacts: [
      { id: "lockers", label: "lockers", beginnerName: "All lockers at this location", description: "The resources coordinated by one bank.", kind: "state", referenceOwnerId: "bank", reason: "LockerBank owns the collection it allocates and releases." },
      { id: "put", label: "putPackage(package)", beginnerName: "Accept a courier drop-off", description: "Coordinates allocation, placement, and code creation.", kind: "behavior", referenceOwnerId: "bank", reason: "The bank coordinates the multi-object drop-off transaction." },
      { id: "pickup", label: "getPackage(code)", beginnerName: "Complete customer pickup", description: "Verifies a code, opens one locker, and releases it.", kind: "behavior", referenceOwnerId: "bank", reason: "The bank coordinates authentication with resource release." },
      { id: "locker-size", label: "size", beginnerName: "Locker size", description: "The maximum package size this door accepts.", kind: "state", referenceOwnerId: "locker", reason: "The physical locker owns its fit constraint." },
      { id: "occupant", label: "currentPackage", beginnerName: "Package currently inside", description: "The package occupying this locker, or none.", kind: "state", referenceOwnerId: "locker", reason: "A locker protects its own occupancy." },
      { id: "status", label: "status", beginnerName: "Door health and availability", description: "Available, occupied, reserved, or out of service.", kind: "state", referenceOwnerId: "locker", reason: "The physical resource owns whether it can safely be allocated." },
      { id: "store", label: "store(package)", beginnerName: "Place package and close door", description: "Validates fit and changes occupancy atomically.", kind: "behavior", referenceOwnerId: "locker", reason: "The locker owns both fit and occupancy state." },
      { id: "remove", label: "removePackage()", beginnerName: "Release package and door", description: "Returns the package and makes the locker available.", kind: "behavior", referenceOwnerId: "locker", reason: "The locker owns the transition back to available." },
      { id: "package-size", label: "requiredSize", beginnerName: "Space this package needs", description: "The minimum locker size for this package.", kind: "state", referenceOwnerId: "package", reason: "Package size describes the package itself." },
      { id: "expires-at", label: "expiresAt", beginnerName: "Pickup deadline", description: "The timestamp after which this package is reclaimed.", kind: "state", referenceOwnerId: "package", reason: "Expiration belongs to one package lifecycle." },
      { id: "allocate", label: "chooseLocker(package, lockers)", beginnerName: "Choose the smallest fitting door", description: "Applies fit and utilization policy.", kind: "policy", referenceOwnerId: "policy", reason: "Allocation strategy can vary independently from doors and package data." },
      { id: "issue", label: "issueCode(packageId)", beginnerName: "Create an expiring pickup code", description: "Creates a code tied to one package without storing plaintext broadly.", kind: "behavior", referenceOwnerId: "codes", reason: "Code issuance and security belong behind one service." },
      { id: "verify", label: "verify(code)", beginnerName: "Verify a pickup code", description: "Resolves a valid, unexpired code to one package.", kind: "behavior", referenceOwnerId: "codes", reason: "Authentication policy stays out of physical locker state." },
    ],
    incidents: [
      { id: "fit", title: "Holiday drop-off", dispatchLabel: "Drop a medium package into a busy bank", story: "Only one medium and one large locker remain. The package should use the smallest locker that fits.", goal: "Protect fit and occupancy while keeping allocation policy replaceable.", requiredArtifactIds: ["lockers", "locker-size", "occupant", "package-size", "allocate", "store"], trace: ["Courier scans the package", "Policy finds healthy fitting lockers", "The smallest fitting locker is selected", "Locker validates and stores the package"], failure: "The controller guessed a door without asking package, policy, and locker owners, wasting the large locker or overfilling a small one.", success: "AllocationPolicy chose the smallest fit and Locker.store protected physical occupancy.", lesson: "The chooser sees candidates; each resource still enforces its own invariant.", principle: "Strategy · allocation policy" },
      { id: "pickup", title: "Forwarded pickup screenshot", dispatchLabel: "Attempt pickup with an invalid code", story: "A customer presents a screenshot of an old code. No door may open.", goal: "Keep secret verification separate from locker state and release only after authentication.", requiredArtifactIds: ["put", "pickup", "issue", "verify"], trace: ["Drop-off issues a package-bound code", "Pickup presents the code", "The code service rejects the stale secret", "No locker changes state"], failure: "Plaintext codes live on lockers, so a stale screenshot opens a door without lifecycle verification.", success: "PickupCodeService rejected the code before LockerBank attempted package release.", lesson: "Authentication is a boundary; physical resources should never implement secret policy.", principle: "Single Responsibility · security boundary" },
      { id: "expiration", title: "Package never collected", dispatchLabel: "Expire an abandoned package", story: "The pickup deadline passes. Operations must reclaim the package and make the locker allocatable again.", goal: "Model expiration as a package lifecycle event and release the same locker safely.", requiredArtifactIds: ["expires-at", "remove"], trace: ["A lifecycle job finds an expired package", "The bank locates its locker", "Locker removes the exact package", "The door returns to available"], failure: "Expiration exists only in a global job, so it deletes a record but leaves the physical locker occupied.", success: "Package owned its deadline and Locker.removePackage performed the release transition.", lesson: "Lifecycle timestamps belong to the entity; resource state changes through the resource's own methods.", principle: "Lifecycle modeling · explicit release" },
      { id: "outage", title: "Door reports a fault", dispatchLabel: "Allocate while one locker is out of service", story: "The best-size locker stops responding between selection and storage. The package must retry another locker exactly once.", goal: "Contain resource health and make allocation retry without duplicating the package.", requiredArtifactIds: ["status"], trace: ["Policy selects a candidate", "Locker reports out-of-service", "The bank releases the reservation", "Policy retries a different healthy locker"], failure: "Door health is tracked only by the controller, so the failed locker is selected repeatedly and the package becomes stranded.", success: "Locker owned its status and LockerBank retried allocation without changing package identity.", lesson: "A resource owns health; the coordinator owns retry across resources.", principle: "Failure containment · coordinator retry" },
    ],
    defense: { prompt: "Explain allocation, locker occupancy, package lifecycle, code security, and how an out-of-service door is retried.", ownerTerms: ["lockerbank", "locker", "package", "allocationpolicy", "pickupcodeservice"], evidenceTerms: ["drop-off", "pickup", "expired", "out of service", "retry", "code"], changeTerms: ["allocation", "code", "expiration", "size", "outage"], verifiedSummary: "Repaired and reran package fit, secure pickup, expiration release, and door-outage incidents, then defended the Amazon Locker lifecycle." },
  },
  {
    id: "vending-machine",
    questionId: "lld-vending-machine",
    title: "Vend Cycle Recovery",
    systemName: "Vending Machine",
    tagline: "Make payment, inventory, dispensing, and compensation survive every failed transition.",
    intro: "Operate a vending machine whose happy path works but failures steal money or inventory. Rebuild the transaction state machine from evidence.",
    accent: "#d98bf0",
    initialOwnerId: "controller",
    nodes: [
      { id: "controller", label: "VendingController", beginnerName: "The god-object controller", description: "The broken starting point mixing UI, money, stock, and hardware." },
      { id: "machine", label: "VendingMachine", beginnerName: "The machine boundary", description: "Coordinates one customer session across inventory, payment, and dispensing." },
      { id: "session", label: "VendSession", beginnerName: "One purchase attempt", description: "Owns selection, authorized amount, and explicit transaction state." },
      { id: "inventory", label: "Inventory", beginnerName: "Product stock", description: "Owns slot counts and reservation/release transitions." },
      { id: "payment", label: "PaymentService", beginnerName: "The payment boundary", description: "Authorizes, captures, and refunds money through an outside provider." },
      { id: "motor", label: "Dispenser", beginnerName: "The physical dispenser", description: "Attempts one hardware dispense and reports success or jam." },
    ],
    artifacts: [
      { id: "orchestrate", label: "vend(selection, payment)", beginnerName: "Coordinate one purchase", description: "Runs the transaction without owning every subsystem's internals.", kind: "behavior", referenceOwnerId: "machine", reason: "The machine boundary coordinates the use case and compensation order." },
      { id: "state", label: "state", beginnerName: "Purchase state", description: "Idle, selected, authorized, dispensing, completed, or compensating.", kind: "state", referenceOwnerId: "session", reason: "One purchase attempt owns its own lifecycle state." },
      { id: "selection", label: "selectedSku", beginnerName: "Chosen product", description: "The product associated with this purchase attempt.", kind: "state", referenceOwnerId: "session", reason: "Selection belongs to the transaction it drives." },
      { id: "amount", label: "authorizedAmount", beginnerName: "Money authorized for this attempt", description: "The amount that may later be captured or refunded.", kind: "state", referenceOwnerId: "session", reason: "Authorization is transaction state, not global machine state." },
      { id: "transition", label: "transitionTo(next)", beginnerName: "Move to the next legal state", description: "Rejects impossible jumps such as completed to dispensing.", kind: "behavior", referenceOwnerId: "session", reason: "The session owning state enforces legal transitions." },
      { id: "stock", label: "stockBySku", beginnerName: "Counts for every product", description: "The source of truth for available stock.", kind: "state", referenceOwnerId: "inventory", reason: "Inventory owns quantities across purchase attempts." },
      { id: "reserve", label: "reserve(sku)", beginnerName: "Reserve one product", description: "Atomically claims one unit before charging.", kind: "behavior", referenceOwnerId: "inventory", reason: "The object owning stock protects decrement and availability together." },
      { id: "release", label: "release(sku)", beginnerName: "Return a failed vend to stock", description: "Compensates inventory after a payment or motor failure.", kind: "behavior", referenceOwnerId: "inventory", reason: "Inventory reverses its own reservation." },
      { id: "authorize", label: "authorize(amount, method)", beginnerName: "Authorize payment", description: "Asks an external provider to reserve funds.", kind: "behavior", referenceOwnerId: "payment", reason: "External payment details stay behind one service." },
      { id: "refund", label: "refund(authorization)", beginnerName: "Return authorized money", description: "Compensates a purchase that cannot dispense.", kind: "behavior", referenceOwnerId: "payment", reason: "The service that owns payment references owns reversal." },
      { id: "payment-failure", label: "translateFailure(error)", beginnerName: "Contain a provider failure", description: "Turns gateway timeouts into a stable payment result for the machine.", kind: "behavior", referenceOwnerId: "payment", reason: "The payment boundary translates outside failures instead of leaking provider exceptions." },
      { id: "dispense", label: "dispense(sku)", beginnerName: "Turn the product motor", description: "Runs hardware and reports success or jam.", kind: "behavior", referenceOwnerId: "motor", reason: "Hardware failures belong behind the dispenser boundary." },
    ],
    incidents: [
      { id: "stock", title: "Sold out after selection", dispatchLabel: "Select the final soda twice", story: "Two customers choose the final unit nearly together. Only one may proceed to payment.", goal: "Reserve stock atomically before money moves.", requiredArtifactIds: ["stock", "reserve", "selection"], trace: ["Two sessions select one SKU", "Inventory reserves one unit", "The second reservation fails", "Only one session reaches payment"], failure: "The controller checks a copied stock count, so both sessions pay for the same final soda.", success: "Inventory.reserve atomically protected the stock it owns.", lesson: "Availability checks and decrements are one invariant and one operation.", principle: "Encapsulation · atomic reservation" },
      { id: "state", title: "Double-tap payment", dispatchLabel: "Send duplicate authorization callbacks", story: "The card provider repeats a success callback. The machine must dispense exactly once.", goal: "Make transaction state reject duplicate or out-of-order events.", requiredArtifactIds: ["state", "amount", "transition", "authorize"], trace: ["Session enters authorized state", "A duplicate callback arrives", "The state machine rejects the repeated transition", "Exactly one dispense begins"], failure: "Payment callbacks mutate global flags, so the repeated success starts the motor twice.", success: "VendSession enforced a legal transition and PaymentService kept provider behavior outside the machine.", lesson: "Explicit states turn repeated asynchronous events into safe no-ops instead of duplicate side effects.", principle: "State pattern · idempotent transitions" },
      { id: "jam", title: "Spiral motor jams", dispatchLabel: "Jam after payment authorization", story: "Stock is reserved and money is authorized, but the product never drops.", goal: "Compensate money and inventory in the reverse order of completed steps.", requiredArtifactIds: ["orchestrate", "release", "refund", "dispense"], trace: ["Inventory reservation succeeds", "Payment authorization succeeds", "Dispenser reports a jam", "Refund and stock release complete"], failure: "The god object catches the motor error but forgets one side effect, leaving either lost money or phantom stock.", success: "VendingMachine coordinated compensation through PaymentService.refund and Inventory.release.", lesson: "The coordinator owns the saga; each subsystem owns how its own action is reversed.", principle: "Compensating transaction · failure recovery" },
      { id: "offline", title: "Provider is offline", dispatchLabel: "Start a purchase during a gateway outage", story: "Payment cannot be authorized. The motor must never turn and reserved stock must return immediately.", goal: "Contain the external failure while restoring the purchase attempt to a safe terminal state.", requiredArtifactIds: ["payment-failure"], trace: ["Inventory reserves one unit", "Payment provider times out", "The machine releases inventory", "Session becomes failed without dispensing"], failure: "Payment is not isolated, so an exception escapes after stock changes and leaves the session stuck.", success: "PaymentService contained the provider failure and VendingMachine compensated the prior reservation.", lesson: "External I/O is a failure boundary; orchestration must know what completed before it failed.", principle: "Dependency Inversion · external boundary" },
    ],
    defense: { prompt: "Explain session state, inventory reservation, payment isolation, and the compensation order after a motor jam.", ownerTerms: ["vendingmachine", "vendsession", "inventory", "paymentservice", "dispenser"], evidenceTerms: ["sold out", "double", "callback", "jam", "refund", "outage"], changeTerms: ["payment", "motor", "inventory", "state", "provider"], verifiedSummary: "Repaired and reran stock reservation, duplicate callback, motor-jam compensation, and provider-outage incidents, then defended the Vending Machine state machine." },
  },
  {
    id: "elevator",
    questionId: "lld-elevator",
    title: "Vertical Dispatch Control",
    systemName: "Elevator System",
    tagline: "Separate who chooses a car from how one car moves, then survive concurrency and fire mode.",
    intro: "Operate a high-rise fleet under rush-hour pressure. Repair request, scheduling, movement, and emergency boundaries from live failures.",
    accent: "#f18c7d",
    initialOwnerId: "controller",
    nodes: [
      { id: "controller", label: "ElevatorController", beginnerName: "The god-object controller", description: "The broken starting point that schedules, moves, and handles emergencies itself." },
      { id: "system", label: "ElevatorSystem", beginnerName: "The building fleet", description: "Coordinates cars, pending requests, and assignment lifecycle." },
      { id: "dispatcher", label: "Dispatcher", beginnerName: "The car chooser", description: "Scores available cars with a replaceable scheduling policy." },
      { id: "car", label: "ElevatorCar", beginnerName: "One elevator car", description: "Owns floor, direction, doors, stop queue, and movement transitions." },
      { id: "request", label: "ElevatorRequest", beginnerName: "One ride request", description: "Owns origin, destination or direction, and assignment state." },
      { id: "emergency", label: "EmergencyController", beginnerName: "The fire-mode authority", description: "Overrides normal scheduling and recalls cars safely." },
    ],
    artifacts: [
      { id: "cars", label: "elevators", beginnerName: "All elevator cars", description: "The fleet coordinated by one building system.", kind: "state", referenceOwnerId: "system", reason: "The system owns the resources it assigns." },
      { id: "pending", label: "pendingRequests", beginnerName: "Unassigned ride requests", description: "Requests waiting for one car assignment.", kind: "state", referenceOwnerId: "system", reason: "The fleet coordinator owns request lifecycle before assignment." },
      { id: "submit", label: "submit(request)", beginnerName: "Accept a hall or car request", description: "Creates one assignment attempt and records its result.", kind: "behavior", referenceOwnerId: "system", reason: "ElevatorSystem coordinates requests with the dispatcher and fleet." },
      { id: "choose", label: "chooseCar(request, cars)", beginnerName: "Choose the best available car", description: "Applies the current dispatch scoring rule.", kind: "policy", referenceOwnerId: "dispatcher", reason: "Scheduling policy changes independently from car movement." },
      { id: "score", label: "score(car, request)", beginnerName: "Score distance and direction", description: "Ranks one candidate for a request.", kind: "policy", referenceOwnerId: "dispatcher", reason: "The dispatcher owns the comparative rule across cars." },
      { id: "floor", label: "currentFloor", beginnerName: "Current floor", description: "The physical position of one car.", kind: "state", referenceOwnerId: "car", reason: "One elevator owns its own position." },
      { id: "direction", label: "direction", beginnerName: "Current travel direction", description: "Up, down, or idle for one car.", kind: "state", referenceOwnerId: "car", reason: "Direction changes with the car's own stop processing." },
      { id: "stops", label: "stops", beginnerName: "This car's ordered stops", description: "The route this car will execute.", kind: "state", referenceOwnerId: "car", reason: "A car owns and protects its itinerary." },
      { id: "add-stop", label: "addStop(request)", beginnerName: "Add one stop safely", description: "Deduplicates and orders a new stop.", kind: "behavior", referenceOwnerId: "car", reason: "The car owning stops owns how a request enters its route." },
      { id: "move", label: "moveToNextStop()", beginnerName: "Advance the car", description: "Updates position, direction, and door state.", kind: "behavior", referenceOwnerId: "car", reason: "Movement is a transition over one car's own state." },
      { id: "origin", label: "originFloor", beginnerName: "Where the rider waits", description: "The floor that created this request.", kind: "state", referenceOwnerId: "request", reason: "Origin describes the request, not any car." },
      { id: "requested-direction", label: "requestedDirection", beginnerName: "Requested travel direction", description: "Up or down from a hall panel.", kind: "state", referenceOwnerId: "request", reason: "Requested direction remains stable while cars change." },
      { id: "assignment", label: "assignedCarId", beginnerName: "Car assigned to this request", description: "Prevents a concurrent request from being assigned twice.", kind: "state", referenceOwnerId: "request", reason: "Assignment is lifecycle state of one request." },
      { id: "fire-mode", label: "fireMode", beginnerName: "Emergency override state", description: "Disables normal dispatch during a fire event.", kind: "state", referenceOwnerId: "emergency", reason: "One authority owns whether emergency policy overrides normal operation." },
      { id: "recall", label: "recall(cars)", beginnerName: "Recall every car safely", description: "Cancels normal stops and directs cars to safe floors.", kind: "behavior", referenceOwnerId: "emergency", reason: "Emergency orchestration spans the fleet and supersedes normal dispatch." },
    ],
    incidents: [
      { id: "dispatch", title: "Lunch rush hall call", dispatchLabel: "Request UP from floor 18", story: "Three cars are at different floors and directions. The request needs one best available car.", goal: "Separate fleet-wide selection policy from each car's movement state.", requiredArtifactIds: ["cars", "pending", "submit", "choose", "score", "origin", "requested-direction"], trace: ["The system accepts one hall request", "Dispatcher scores every available car", "Exactly one car is selected", "The request enters that car's route"], failure: "Each car decides independently whether it should respond, so multiple cars accept the same hall call.", success: "ElevatorSystem coordinated one Dispatcher decision across the complete fleet.", lesson: "The object that sees every candidate chooses; individual resources do not compete without an arbiter.", principle: "Strategy · fleet dispatch policy" },
      { id: "movement", title: "Stops fight direction", dispatchLabel: "Add floors 20, 7, and 15 to an upward car", story: "A car moving up should serve compatible upward stops before reversing.", goal: "Keep stop ordering beside the position and direction it changes.", requiredArtifactIds: ["floor", "direction", "stops", "add-stop", "move"], trace: ["The car receives three stops", "Stops ahead are ordered upward", "The car serves 15 then 20", "Direction reverses before floor 7"], failure: "The central controller edits another car's stop list, so movement and direction disagree about the next floor.", success: "ElevatorCar protected its own route and movement transition.", lesson: "Dispatcher chooses a car; ElevatorCar owns how that car executes its itinerary.", principle: "Single Responsibility · policy versus state" },
      { id: "duplicate", title: "Two dispatch threads", dispatchLabel: "Submit the same request concurrently", story: "Two scheduling workers see one pending hall call. Exactly one assignment may survive.", goal: "Make request assignment an explicit lifecycle transition instead of a duplicated side effect.", requiredArtifactIds: ["assignment"], trace: ["Two workers read the pending request", "One assignment transition succeeds", "The second observes assigned state", "Only one car contains the stop"], failure: "Assignment exists only as a stop side effect, so two cars receive the same request.", success: "ElevatorRequest owned assignedCarId and rejected the second assignment.", lesson: "Identity and lifecycle state make concurrency outcomes explicit and idempotent.", principle: "Invariant · exactly-once assignment" },
      { id: "fire", title: "Fire alarm at floor 12", dispatchLabel: "Enter fire-service mode", story: "Normal requests must stop, doors must follow safety rules, and every car must recall to a safe floor.", goal: "Override normal dispatch without sprinkling fire checks through every class.", requiredArtifactIds: ["fire-mode", "recall"], trace: ["Emergency authority enters fire mode", "Normal dispatch is suspended", "Every car receives a safe recall command", "New hall calls remain pending"], failure: "Fire checks are scattered through panels, requests, dispatcher, and cars, producing contradictory behavior.", success: "EmergencyController owned the override and coordinated recall through stable car operations.", lesson: "A cross-system emergency mode needs one authority and explicit precedence over normal policy.", principle: "Command boundary · emergency override" },
    ],
    defense: { prompt: "Explain who owns dispatch policy, one car's route and movement, request assignment, and the fire-mode override.", ownerTerms: ["elevatorsystem", "dispatcher", "elevatorcar", "elevatorrequest", "emergencycontroller"], evidenceTerms: ["rush", "direction", "duplicate", "assignment", "fire", "recall"], changeTerms: ["dispatch", "scheduling", "emergency", "high-rise", "policy"], verifiedSummary: "Repaired and reran fleet dispatch, direction-aware movement, duplicate assignment, and fire-mode incidents, then defended the Elevator boundaries." },
  },
];

export function getLldVerificationWorld(id: string | undefined): LldVerificationWorld | undefined {
  return LLD_VERIFICATION_WORLDS.find((world) => world.id === id);
}

export function getLldVerificationWorldByQuestion(questionId: string): LldVerificationWorld | undefined {
  return LLD_VERIFICATION_WORLDS.find((world) => world.questionId === questionId);
}

export function getLldVerificationWorldRoute(worldId: LldVerificationWorldId): string {
  return `/arena/lld-world/${worldId}`;
}
