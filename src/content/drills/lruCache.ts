import type { ColdDrillPrompt } from "@/types";

// The runnable Java exercises share one LRUCache file: a hand-rolled map +
// doubly linked list with sentinel head/tail, matching the reference strings
// below. Each exercise stubs exactly one method and keeps the other real.

const LRU_FILE_TOP = `import java.util.HashMap;
import java.util.Map;

public class LRUCache<Key, Value> {
    private class Node {
        Key key;
        Value value;
        Node prev;
        Node next;

        Node(Key key, Value value) {
            this.key = key;
            this.value = value;
        }
    }

    private final int capacity;
    private final Map<Key, Node> map = new HashMap<Key, Node>();
    private final Node head = new Node(null, null);
    private final Node tail = new Node(null, null);

    public LRUCache(int capacity) {
        this.capacity = capacity;
        head.next = tail;
        tail.prev = head;
    }

    // Test-visibility helpers: read state without touching recency order.
    public int size() { return map.size(); }
    public boolean contains(Key key) { return map.containsKey(key); }

    private void removeFromList(Node node) {
        node.prev.next = node.next;
        node.next.prev = node.prev;
    }

    private void insertAtHead(Node node) {
        node.next = head.next;
        node.prev = head;
        head.next.prev = node;
        head.next = node;
    }
`;

const LRU_GET_REFERENCE = `    public Value get(Key key) {
        Node node = map.get(key);
        if (node == null) {
            return null;
        }
        removeFromList(node);
        insertAtHead(node);
        return node.value;
    }
`;

const LRU_GET_STUB = `    public Value get(Key key) {
        // Look the key up in the map, move the hit to the most-recently-used
        // end of the list, and return its value. A miss returns null.
        return null;
    }
`;

const LRU_PUT_REFERENCE = `    public void put(Key key, Value value) {
        if (map.containsKey(key)) {
            Node existing = map.get(key);
            existing.value = value;
            removeFromList(existing);
            insertAtHead(existing);
            return;
        }
        if (map.size() >= capacity) {
            Node lru = tail.prev;
            removeFromList(lru);
            map.remove(lru.key);
        }
        Node fresh = new Node(key, value);
        map.put(key, fresh);
        insertAtHead(fresh);
    }
`;

const LRU_PUT_STUB = `    public void put(Key key, Value value) {
        // Update-and-refresh if the key already exists. Otherwise evict the
        // least-recently-used node (from BOTH list and map) when at capacity,
        // then insert the new node at the most-recently-used end.
    }
`;

const LRU_GET_STARTER_FILE = LRU_FILE_TOP + "\n" + LRU_GET_STUB + "\n" + LRU_PUT_REFERENCE + "}\n";
const LRU_GET_REFERENCE_FILE = LRU_FILE_TOP + "\n" + LRU_GET_REFERENCE + "\n" + LRU_PUT_REFERENCE + "}\n";
const LRU_PUT_STARTER_FILE = LRU_FILE_TOP + "\n" + LRU_GET_REFERENCE + "\n" + LRU_PUT_STUB + "}\n";
const LRU_PUT_REFERENCE_FILE = LRU_GET_REFERENCE_FILE;

export const lruCache: ColdDrillPrompt = {
  id: "lru-cache",
  title: "Design an LRU Cache",
  prompt: "Design a Least Recently Used (LRU) cache where get and put must both run in O(1) time.",
  reference: {
    clarifyingQuestions: [
      {
        question: "Is capacity fixed at construction, or can it change later?",
        why: "A fixed capacity means LRUCache just needs a constant int field; a resizable cache means put() (or a resize() method) has to be able to evict multiple entries in one call, not just one.",
      },
      {
        question: "What happens to the evicted key/value: is it silently dropped, or does something need to observe it (e.g. a write-back to a slower store)?",
        why: "Silently dropping means eviction is just an internal removal; needing to observe it means the eviction site has to invoke a callback or return the evicted pair, which changes evict()'s signature.",
      },
      {
        question: "Does this need to be thread-safe for concurrent get/put calls?",
        why: "Single-threaded means the map + doubly linked list mutations can be plain, unsynchronized operations; thread-safe means every mutation needs a lock (or a concurrent structure), which is an L5+ branch, not assumed here.",
      },
      {
        question: "Is there a TTL/expiry on top of capacity-based eviction, or is capacity the only eviction trigger?",
        why: "Pure capacity-based eviction needs only the recency-ordered list; adding TTL means each Node also needs an expiry timestamp and get()/put() both need an extra expiry check before touching recency order.",
      },
    ],
    entities: [
      {
        id: "lrucache",
        name: "LRUCache",
        isEntity: true,
        why: "The public class. It owns the capacity, the lookup map, and the recency-ordered list, and is the only thing that exposes get()/put() to callers.",
        properties: [
          { name: "capacity", type: "int" },
          { name: "map", type: "Map<Key, Node>" },
          { name: "head", type: "Node" },
          { name: "tail", type: "Node" },
        ],
      },
      {
        id: "node",
        name: "Node",
        isEntity: true,
        why: "One entry in the doubly linked list. It holds the key (needed so eviction can remove the matching map entry, not just unlink a node), the value, and prev/next pointers for O(1) reordering.",
        properties: [
          { name: "key", type: "Key" },
          { name: "value", type: "Value" },
          { name: "prev", type: "Node" },
          { name: "next", type: "Node" },
        ],
      },
      {
        id: "evictionpolicy",
        name: "EvictionPolicy",
        isEntity: false,
        why: "Don't build it upfront: a strategy interface for a single fixed policy (LRU) adds indirection with no caller that needs it. But expect it as the follow-up. A Dec 2024 Amazon SDE-1 loop asked for exactly this, pluggable eviction policies on a cache, as the extensibility probe. The winning move is to name where the interface would go when asked, not to pre-build it.",
      },
      {
        id: "cacheentry",
        name: "CacheEntry",
        isEntity: false,
        why: "Node already is the cache entry. Wrapping it in a second class that just holds a Node adds a layer with no new field or behavior.",
      },
    ],
    methods: [
      {
        id: "m1",
        signature: "get(key): Value",
        ownerId: "lrucache",
        justification: "LRUCache is the only class that holds both the map (for O(1) lookup) and the list (for O(1) move-to-front), so it's the one that can do both the read and the recency update in one call.",
        codeExercise: {
          language: "java",
          starter: "Value get(Key key) {\n    // your code here\n}",
          reference:
            "Value get(Key key) {\n    Node node = map.get(key);\n    if (node == null) {\n        return null;\n    }\n    removeFromList(node);\n    insertAtHead(node);\n    return node.value;\n}",
          checklist: [
            "Looks the key up in the map, not by scanning the list. This is where the O(1) actually comes from",
            "Returns null (or an Optional/sentinel) on a missing key instead of throwing",
            "Moves the found node to the most-recently-used end of the list, not just reads its value and leaves the order untouched",
            "Uses O(1) pointer surgery to move the node (unlink via prev/next, relink at head), with no scanning the list to find its position",
          ],
          java: {
            editClassName: "LRUCache",
            starterFile: LRU_GET_STARTER_FILE,
            referenceFile: LRU_GET_REFERENCE_FILE,
            support: [],
            tests: [
              {
                id: "hit-returns-value",
                label: "a stored key returns its value",
                body: `LRUCache<String, Integer> cache = new LRUCache<String, Integer>(2);
cache.put("user:1", 100);
expectedText = "100";
Integer found = cache.get("user:1");
actualText = found == null ? "null" : found.toString();
passed = found != null && found.intValue() == 100;`,
              },
              {
                id: "miss-returns-null",
                label: "a key that was never inserted returns null, not an exception",
                body: `LRUCache<String, Integer> cache = new LRUCache<String, Integer>(2);
cache.put("user:1", 100);
expectedText = "null for a key that was never inserted";
Integer found = cache.get("user:404");
actualText = found == null ? "null for a key that was never inserted" : found.toString();
passed = found == null;`,
              },
              {
                id: "hit-refreshes-recency",
                label: "the classic: a get must refresh recency, so the untouched key is evicted",
                body: `LRUCache<String, Integer> cache = new LRUCache<String, Integer>(2);
cache.put("a", 1);
cache.put("b", 2);
cache.get("a");
cache.put("c", 3);
expectedText = "a survives, b was evicted";
boolean aAlive = cache.contains("a");
boolean bAlive = cache.contains("b");
actualText = "a " + (aAlive ? "survives" : "was evicted") + ", b " + (bAlive ? "survives" : "was evicted");
passed = aAlive && !bAlive;`,
              },
              {
                id: "hit-leaves-entry-in-cache",
                label: "a get reads the entry, it must not remove it",
                body: `LRUCache<String, Integer> cache = new LRUCache<String, Integer>(2);
cache.put("a", 1);
cache.get("a");
expectedText = "a present with size 1 after the get";
actualText = "a " + (cache.contains("a") ? "present" : "missing") + " with size " + cache.size() + " after the get";
passed = cache.contains("a") && cache.size() == 1;`,
              },
              {
                id: "interleaved-gets-track-recency",
                label: "several gets in a row keep moving nodes, eviction follows the last order",
                body: `LRUCache<String, Integer> cache = new LRUCache<String, Integer>(2);
cache.put("a", 1);
cache.put("b", 2);
cache.get("a");
cache.get("b");
cache.get("a");
cache.put("c", 3);
expectedText = "a alive, b evicted, c alive";
boolean aAlive = cache.contains("a");
boolean bAlive = cache.contains("b");
boolean cAlive = cache.contains("c");
actualText = "a " + (aAlive ? "alive" : "evicted") + ", b " + (bAlive ? "alive" : "evicted") + ", c " + (cAlive ? "alive" : "evicted");
passed = aAlive && !bAlive && cAlive;`,
              },
            ],
          },
        },
      },
      {
        id: "m2",
        signature: "put(key, value): void",
        ownerId: "lrucache",
        justification: "Same reasoning as get(). Inserting or updating needs both the map (to know if the key already exists) and the list (to place the node at the most-recently-used end, and to evict from the least-recently-used end if now over capacity).",
        codeExercise: {
          language: "java",
          starter: "void put(Key key, Value value) {\n    // your code here\n}",
          reference:
            "void put(Key key, Value value) {\n    if (map.containsKey(key)) {\n        Node existing = map.get(key);\n        existing.value = value;\n        removeFromList(existing);\n        insertAtHead(existing);\n        return;\n    }\n    if (map.size() >= capacity) {\n        Node lru = tail.prev;\n        removeFromList(lru);\n        map.remove(lru.key);\n    }\n    Node fresh = new Node(key, value);\n    map.put(key, fresh);\n    insertAtHead(fresh);\n}",
          checklist: [
            "If the key already exists, updates its value AND moves it to most-recently-used. Doesn't just overwrite in place and leave it wherever it was",
            "If at capacity on a new key, evicts the node at the least-recently-used end (next to the tail sentinel) before inserting, not an arbitrary node",
            "Evicts from BOTH the list and the map. Removing only from the list would leave a stale map entry pointing at an unlinked node",
            "Inserts the new or updated node at the most-recently-used end (next to the head sentinel), consistently with get()'s move-to-front",
          ],
          java: {
            editClassName: "LRUCache",
            starterFile: LRU_PUT_STARTER_FILE,
            referenceFile: LRU_PUT_REFERENCE_FILE,
            support: [],
            tests: [
              {
                id: "stores-new-entry",
                label: "a fresh key/value lands in the cache and can be read back",
                body: `LRUCache<String, Integer> cache = new LRUCache<String, Integer>(2);
cache.put("user:1", 100);
expectedText = "100 stored under user:1";
Integer found = cache.get("user:1");
actualText = found == null ? "user:1 is not in the cache" : found + " stored under user:1";
passed = found != null && found.intValue() == 100;`,
              },
              {
                id: "evicts-least-recently-used",
                label: "at capacity, the third put evicts the least recently used key",
                body: `LRUCache<String, Integer> cache = new LRUCache<String, Integer>(2);
cache.put("a", 1);
cache.put("b", 2);
cache.put("c", 3);
expectedText = "a evicted, b alive, c alive, size 2";
actualText = "a " + (cache.contains("a") ? "alive" : "evicted") + ", b " + (cache.contains("b") ? "alive" : "evicted") + ", c " + (cache.contains("c") ? "alive" : "evicted") + ", size " + cache.size();
passed = !cache.contains("a") && cache.contains("b") && cache.contains("c") && cache.size() == 2;`,
              },
              {
                id: "update-existing-key-no-eviction",
                label: "re-putting an existing key updates its value without evicting anyone",
                body: `LRUCache<String, Integer> cache = new LRUCache<String, Integer>(2);
cache.put("a", 1);
cache.put("b", 2);
cache.put("a", 9);
expectedText = "a is 9, b present, size 2";
Integer updated = cache.get("a");
boolean bAlive = cache.contains("b");
actualText = "a is " + (updated == null ? "missing" : updated.toString()) + ", b " + (bAlive ? "present" : "evicted") + ", size " + cache.size();
passed = updated != null && updated.intValue() == 9 && bAlive && cache.size() == 2;`,
              },
              {
                id: "update-refreshes-recency",
                label: "updating a key must also move it, or 'recently used' becomes 'recently inserted'",
                body: `LRUCache<String, Integer> cache = new LRUCache<String, Integer>(2);
cache.put("a", 1);
cache.put("b", 2);
cache.put("a", 9);
cache.put("c", 3);
expectedText = "a survives (its update refreshed it), b was evicted";
boolean aAlive = cache.contains("a");
boolean bAlive = cache.contains("b");
actualText = "a " + (aAlive ? "survives" : "was evicted") + ", b " + (bAlive ? "survives" : "was evicted");
passed = aAlive && !bAlive;`,
              },
              {
                id: "eviction-respects-get-refresh",
                label: "evicts the least recently USED, not the oldest inserted after a get refresh",
                body: `LRUCache<String, Integer> cache = new LRUCache<String, Integer>(2);
cache.put("a", 1);
cache.put("b", 2);
cache.get("a");
cache.put("c", 3);
expectedText = "a survives (the get refreshed it), b was evicted";
boolean aAlive = cache.contains("a");
boolean bAlive = cache.contains("b");
actualText = "a " + (aAlive ? "survives" : "was evicted") + ", b " + (bAlive ? "survives" : "was evicted");
passed = aAlive && !bAlive;`,
              },
              {
                id: "eviction-keeps-map-and-list-in-sync",
                label: "back-to-back evictions stay correct, so both map and list were cleaned",
                body: `LRUCache<String, Integer> cache = new LRUCache<String, Integer>(2);
cache.put("a", 1);
cache.put("b", 2);
cache.put("c", 3);
cache.put("d", 4);
expectedText = "only c and d remain, size 2";
boolean cAlive = cache.contains("c");
boolean dAlive = cache.contains("d");
actualText = (cache.contains("a") ? "a still here, " : "") + (cache.contains("b") ? "b still here, " : "") + "c " + (cAlive ? "here" : "gone") + ", d " + (dAlive ? "here" : "gone") + ", size " + cache.size();
passed = !cache.contains("a") && !cache.contains("b") && cAlive && dAlive && cache.size() == 2;`,
              },
            ],
          },
        },
      },
    ],
    relationships: ["LRUCache has many Nodes, indexed by key in its map and ordered by recency in its list", "Node.prev and Node.next link Nodes into a doubly linked list"],
    edgeCases: [
      {
        scenario: "put() is called on a key that already exists in the cache.",
        handling: "The value must be updated AND the node moved to the most-recently-used end. Updating the value in place without touching recency order is the single most common bug in this problem, since it silently makes 'recently used' mean 'recently inserted' instead.",
      },
      {
        scenario: "The cache is at capacity and put() is called with a brand-new key.",
        handling: "The node at the least-recently-used end (adjacent to the tail sentinel) must be evicted from both the list and the map before the new node is inserted. Evicting from only one of the two leaves the structures inconsistent.",
      },
      {
        scenario: "get() is called on a key that was never inserted, or was already evicted.",
        handling: "Returns null (or an agreed sentinel/Optional) without mutating the list. A miss shouldn't touch recency order for a node that was never in the cache to begin with.",
      },
      {
        scenario: "Capacity is 0, or get()/put() is called before any entry has ever been inserted.",
        handling: "put() with capacity 0 should evict-then-insert down to zero net entries (or reject the insert outright, if that's the agreed contract) rather than crash on an empty list with only sentinel head/tail nodes.",
      },
    ],
    tradeoffs: [
      {
        decision: "A doubly linked list, not a singly linked list or a plain array, backs the recency order.",
        reasoning: "Moving a node to the most-recently-used end requires unlinking it from its current position first. With a singly linked list you can't reach a node's predecessor in O(1) to relink around it, forcing an O(n) scan, while a doubly linked list's prev pointer makes that unlink O(1). An array would need to shift elements on every move, which is O(n).",
      },
      {
        decision: "Head and tail are sentinel (dummy) nodes rather than nullable pointers checked on every operation.",
        reasoning: "Costs two permanently-allocated nodes that never hold real data, but removes every null-check branch for 'is this the first/last real node' from insertAtHead()/removeFromList(), since every real node always has a real prev and next to relink against.",
      },
      {
        decision: "The map stores key → Node (not key → Value directly).",
        reasoning: "Storing key → Value would give O(1) lookup but no way to reach that entry's position in the recency list to move it. The map has to point at the actual Node object so get()/put() can splice it within the list, not just read its value.",
      },
    ],
    principles: [
      {
        name: "Single Responsibility Principle",
        explanation: "LRUCache owns the get/put contract and orchestrates the map+list together. Node only holds its own key/value/prev/next and has no logic of its own, it's a plain data holder the list operations manipulate.",
      },
      {
        name: "Encapsulation",
        explanation: "Callers only ever see get(key) and put(key, value). The map, the sentinel nodes, and the pointer-relinking helpers are all internal to LRUCache, so nothing outside can corrupt the list/map consistency directly.",
      },
      {
        name: "Composition over duplication",
        explanation: "insertAtHead()/removeFromList() are small internal helpers reused by both get() and put(). Without them, the pointer-relinking logic would be duplicated (and could drift out of sync) in both methods.",
      },
    ],
  },
};
