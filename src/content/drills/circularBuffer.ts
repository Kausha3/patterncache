import type { ColdDrillPrompt } from "@/types";

export const circularBuffer: ColdDrillPrompt = {
  id: "circular-buffer",
  title: "Design a Circular Buffer",
  prompt: "Design a fixed-capacity circular buffer (ring buffer) with O(1) writes and reads that reuses its storage as head and tail wrap around.",
  reference: {
    clarifyingQuestions: [
      {
        question: "When the buffer is full, should a write fail, or overwrite the oldest item?",
        why: "This is the single biggest fork in the design. Reject-on-full means offer() returns false and the caller deals with it. Overwrite-on-full means offer() also advances head (dropping the oldest item) and always succeeds. The two contracts produce different code in the same method.",
      },
      {
        question: "Is capacity fixed at construction?",
        why: "A ring buffer's whole reason to exist is a fixed array reused in place, with no allocation per operation. If the buffer needs to grow, you're really designing a deque or ArrayList and the wraparound index math stops paying for itself.",
      },
      {
        question: "Single-threaded, or do producers and consumers run concurrently?",
        why: "Single-threaded means plain fields and no synchronization. A concurrent ring buffer (the classic producer/consumer handoff) needs locks or atomics on head/tail and is a genuinely different, harder design. Worth naming out loud, then scoping out at this level.",
      },
      {
        question: "What should a read on an empty buffer return: null, or throw?",
        why: "Emptiness is a normal, expected state for a buffer, not a programming error. Returning null (or an Optional) makes the caller handle it; throwing turns ordinary control flow into exception handling. Either is defensible once agreed, but it changes poll()'s signature.",
      },
    ],
    entities: [
      {
        id: "circularbuffer",
        name: "CircularBuffer",
        isEntity: true,
        why: "The one real class. It owns the fixed backing array and the two indexes that chase each other around it, and it's the only thing that exposes offer/poll/peek to callers.",
        properties: [
          { name: "items", type: "T[]" },
          { name: "capacity", type: "int" },
          { name: "head", type: "int" },
          { name: "tail", type: "int" },
          { name: "size", type: "int" },
        ],
      },
      {
        id: "node",
        name: "Node",
        isEntity: false,
        why: "The reflex from LRU Cache doesn't apply here. A linked list allocates a node per element and scatters them across the heap. The entire point of a ring buffer is one fixed array reused in place, so there is nothing for a Node to hold.",
      },
      {
        id: "growthpolicy",
        name: "GrowthPolicy",
        isEntity: false,
        why: "Fixed capacity is the premise, not a limitation to engineer around. A buffer that grows is a different data structure, and nobody asked for one.",
      },
      {
        id: "bufferiterator",
        name: "BufferIterator",
        isEntity: false,
        why: "Nobody asked to traverse the buffer. Its contract is write at the tail, read at the head. Adding iteration invites callers to depend on internal ordering the index math should be free to change.",
      },
    ],
    methods: [
      {
        id: "m1",
        signature: "offer(item): boolean",
        ownerId: "circularbuffer",
        justification: "CircularBuffer owns the array, the tail index, and the size count, and a write has to move all three together. Nothing else has the state to do it, and letting anything else touch that state would break the invariant that head, tail, and size always agree.",
        codeExercise: {
          language: "java",
          starter: "boolean offer(T item) {\n    // your code here\n}",
          reference:
            "boolean offer(T item) {\n    if (size == capacity) {\n        return false;\n    }\n    items[tail] = item;\n    tail = (tail + 1) % capacity;\n    size++;\n    return true;\n}",
          checklist: [
            "Checks fullness with the size counter, not with head == tail. Those two indexes being equal means BOTH completely empty and completely full, so on its own it can't tell you which",
            "Writes at the current tail first, then advances tail. Advancing first writes into the wrong slot",
            "Wraps tail with modulo, (tail + 1) % capacity, or an equivalent explicit reset to 0. Without the wrap, the next write past the array end throws",
            "Returns false on a full buffer per the agreed reject contract, instead of silently dropping the item or corrupting a slot. In overwrite mode this branch would advance head instead",
          ],
        },
      },
      {
        id: "m2",
        signature: "poll(): T",
        ownerId: "circularbuffer",
        justification: "Reads mirror writes: the head index and the size count have to move together with the slot being read, and CircularBuffer is the only class holding all of them.",
        codeExercise: {
          language: "java",
          starter: "T poll() {\n    // your code here\n}",
          reference:
            "T poll() {\n    if (size == 0) {\n        return null;\n    }\n    T item = items[head];\n    items[head] = null;\n    head = (head + 1) % capacity;\n    size--;\n    return item;\n}",
          checklist: [
            "Checks emptiness with size == 0 before touching the array, and returns null (or the agreed sentinel) without moving head",
            "Reads the current head slot before advancing head, symmetric with offer()",
            "Nulls out the vacated slot so the buffer doesn't pin a stale object reference for a full lap of the ring (a real leak in Java for large objects)",
            "Wraps head with the same modulo the write side uses, and decrements size so both indexes and the count stay in agreement",
          ],
          java: {
            editClassName: "CircularBuffer",
            starterFile: `public class CircularBuffer<T> {
    private final T[] items;
    private final int capacity;
    private int head;
    private int tail;
    private int size;

    @SuppressWarnings("unchecked")
    public CircularBuffer(int capacity) {
        this.items = (T[]) new Object[capacity];
        this.capacity = capacity;
    }

    public boolean offer(T item) {
        if (size == capacity) {
            return false;
        }
        items[tail] = item;
        tail = (tail + 1) % capacity;
        size++;
        return true;
    }

    public boolean isEmpty() { return size == 0; }
    public boolean isFull() { return size == capacity; }
    public int size() { return size; }

    public T poll() {
        // Read the oldest item at head, clear the vacated slot, advance head
        // with the same wraparound offer() uses, and shrink size.
        // An empty buffer returns null without moving head.
        return null;
    }
}
`,
            referenceFile: `public class CircularBuffer<T> {
    private final T[] items;
    private final int capacity;
    private int head;
    private int tail;
    private int size;

    @SuppressWarnings("unchecked")
    public CircularBuffer(int capacity) {
        this.items = (T[]) new Object[capacity];
        this.capacity = capacity;
    }

    public boolean offer(T item) {
        if (size == capacity) {
            return false;
        }
        items[tail] = item;
        tail = (tail + 1) % capacity;
        size++;
        return true;
    }

    public boolean isEmpty() { return size == 0; }
    public boolean isFull() { return size == capacity; }
    public int size() { return size; }

    public T poll() {
        if (size == 0) {
            return null;
        }
        T item = items[head];
        items[head] = null;
        head = (head + 1) % capacity;
        size--;
        return item;
    }
}
`,
            support: [],
            tests: [
              {
                id: "polls-oldest-first",
                label: "poll returns the oldest item, not the newest",
                body: `CircularBuffer<String> buffer = new CircularBuffer<String>(3);
buffer.offer("A");
buffer.offer("B");
expectedText = "A, the oldest item";
String polled = buffer.poll();
actualText = polled == null ? "null" : polled;
passed = "A".equals(polled);`,
              },
              {
                id: "empty-buffer-returns-null",
                label: "polling an empty buffer returns null and leaves it empty",
                body: `CircularBuffer<String> buffer = new CircularBuffer<String>(3);
expectedText = "null, still empty";
String polled = buffer.poll();
actualText = (polled == null ? "null" : polled) + ", " + (buffer.isEmpty() ? "still empty" : "size is now " + buffer.size());
passed = polled == null && buffer.isEmpty();`,
              },
              {
                id: "fifo-survives-wraparound",
                label: "head wraps past the array end and FIFO order still holds",
                body: `CircularBuffer<String> buffer = new CircularBuffer<String>(3);
buffer.offer("A");
buffer.offer("B");
buffer.offer("C");
String first = buffer.poll();
buffer.offer("D");
String order = first + "," + buffer.poll() + "," + buffer.poll() + "," + buffer.poll();
expectedText = "A,B,C,D in insertion order across the wrap";
actualText = order;
passed = "A,B,C,D".equals(order);`,
              },
              {
                id: "size-bookkeeping-after-poll",
                label: "poll decrements size, so the freed slot accepts a new offer",
                body: `CircularBuffer<String> buffer = new CircularBuffer<String>(2);
buffer.offer("A");
buffer.offer("B");
buffer.poll();
int afterPoll = buffer.size();
boolean accepted = buffer.offer("C");
expectedText = "size 1 after the poll, then the offer is accepted";
actualText = "size " + afterPoll + " after the poll, then the offer is " + (accepted ? "accepted" : "rejected");
passed = afterPoll == 1 && accepted;`,
              },
              {
                id: "drains-to-empty",
                label: "polling everything empties the buffer and the next poll is null",
                body: `CircularBuffer<String> buffer = new CircularBuffer<String>(2);
buffer.offer("A");
buffer.offer("B");
buffer.poll();
buffer.poll();
expectedText = "empty again, next poll is null";
String extra = buffer.poll();
actualText = (buffer.isEmpty() ? "empty again" : "size is still " + buffer.size()) + ", next poll is " + (extra == null ? "null" : extra);
passed = buffer.isEmpty() && extra == null;`,
              },
            ],
          },
        },
      },
      {
        id: "m3",
        signature: "isEmpty(): boolean",
        ownerId: "circularbuffer",
        justification: "A one-line read of the size counter. It lives here because size is private state, and exposing the raw counter would let callers cache a stale answer.",
      },
      {
        id: "m4",
        signature: "isFull(): boolean",
        ownerId: "circularbuffer",
        justification: "Same as isEmpty(), the other end of the size counter. Together they make the empty/full distinction an explicit part of the public contract instead of something callers infer from index positions they can't see.",
      },
      {
        id: "m5",
        signature: "peek(): T",
        ownerId: "circularbuffer",
        justification: "Reads the head slot without consuming it. It has to live where head lives, and it must not move head or size, which is exactly why it's a separate method from poll() instead of a flag on it.",
      },
    ],
    relationships: [
      "CircularBuffer owns one fixed-size array of T, allocated once and reused in place forever",
      "head and tail are indexes into that same array, chasing each other around the ring; size is the one field that can tell them apart when they collide",
    ],
    edgeCases: [
      {
        scenario: "head == tail. Is the buffer empty or full?",
        handling: "Both states put the indexes in the same position, which is the classic trap of this design. The size counter resolves it: size == 0 means empty, size == capacity means full. The alternatives (leaving one slot permanently unused, or a boolean full flag) work too, but you must pick one deliberately and say why.",
      },
      {
        scenario: "tail is at the last slot (capacity - 1) and another write arrives.",
        handling: "The write lands at capacity - 1 and tail wraps to 0 via the modulo. This is the moment 'circular' actually happens, and the first thing to dry-run out loud. A missing wrap throws ArrayIndexOutOfBoundsException on the next write.",
      },
      {
        scenario: "Capacity is 1.",
        handling: "head and tail are always the same slot, so every state question falls entirely on the size counter. One write fills the buffer, one read empties it. If the index math and count survive capacity 1, the general case almost always works.",
      },
      {
        scenario: "Overwrite mode: the buffer is full and a new write arrives.",
        handling: "offer() advances head as well as tail, dropping the oldest item, and size stays pinned at capacity. Getting this wrong (advancing only tail) silently makes tail lap head, and reads start returning items out of order.",
      },
    ],
    tradeoffs: [
      {
        decision: "A size counter resolves the head == tail ambiguity, rather than sacrificing one slot or keeping a boolean full flag.",
        reasoning: "All three work. The sacrificed slot wastes one element of capacity and makes 'full' mean size == capacity - 1, which surprises readers. The boolean flag has to be updated in perfect sync with both indexes in every method. The counter costs one int, answers size() for free, and makes empty/full checks read literally.",
      },
      {
        decision: "A fixed array with wrapped indexes, not a linked list.",
        reasoning: "Both give O(1) reads and writes. The array does it with zero allocation per operation, one contiguous block that stays hot in cache, and memory bounded at construction time. That's the entire reason ring buffers show up in logging, audio, and producer/consumer handoffs. A linked list allocates per element and buys nothing here.",
      },
      {
        decision: "Wraparound via modulo, (i + 1) % capacity, instead of an if-reset or a power-of-two bitmask.",
        reasoning: "The modulo is one expression and impossible to get half-right. The if-reset (if (i == capacity) i = 0) avoids a division and reads plainly, which is a fine answer too. The bitmask (i & (capacity - 1)) is the fastest but forces capacity to a power of two, a real constraint worth naming before paying it.",
      },
    ],
    principles: [
      {
        name: "Encapsulation",
        explanation: "Callers see offer, poll, peek, isEmpty, isFull. The array, both indexes, and the wraparound math are invisible, so no caller can ever observe or corrupt a half-updated ring.",
      },
      {
        name: "Invariant ownership",
        explanation: "The invariant is that head, tail, and size always agree about which slots hold live items. Every method that moves one of them moves the others in the same call. That's why all three fields live in one class and no setter exposes any of them.",
      },
      {
        name: "Explicit contracts over exceptions",
        explanation: "Full and empty are normal states of a buffer, not errors. offer() returning false and poll() returning null make those states part of the method signatures, so callers are forced to think about them at the call site.",
      },
    ],
  },
};
