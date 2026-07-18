import type { CodingCombatMission } from "./codingCombatMissions";
import type { CodingCombatRunResult } from "./codingCombatEngine";

export const SLIDING_WINDOW_WORLD_ROUTE = "/arena/algorithm-world/sliding-window-maximum";
export const SLIDING_WINDOW_SAMPLE = [1, 3, -1, -3, 5, 3, 6, 7] as const;
export const SLIDING_WINDOW_SIZE = 3;

export type SlidingWindowTraceKind =
  | "step"
  | "scan"
  | "push"
  | "pop-front"
  | "pop-back"
  | "output";

export interface SlidingWindowQueueItem {
  index: number;
  value: number;
}

export interface SlidingWindowTraceEvent {
  kind: SlidingWindowTraceKind;
  index: number;
  left: number;
  right: number;
  value?: number;
  best?: number;
  queue: SlidingWindowQueueItem[];
}

export interface SlidingWindowRunAnalysis {
  result: CodingCombatRunResult;
  trace: SlidingWindowTraceEvent[];
  correct: boolean;
  efficient: boolean;
  inspections: number;
  queueMutations: number;
  outputs: number[];
  summary: string;
}

export interface SlidingWindowExplanationGrade {
  score: number;
  passed: boolean;
  strengths: string[];
  missing: string[];
}

const TRACE_PREFIX = "PC_TRACE|";

export const SLIDING_WINDOW_STARTER_CODE = `import java.util.*;

public class Solution {
    public int[] maxSlidingWindow(int[] nums, int k) {
        if (nums == null || nums.length == 0 || k <= 0 || k > nums.length) {
            return new int[0];
        }

        int[] answer = new int[nums.length - k + 1];
        WorldTrace.reset();

        // This returns the right answers, but rush hour will expose its cost.
        for (int left = 0; left + k <= nums.length; left += 1) {
            int best = nums[left];
            for (int index = left; index < left + k; index += 1) {
                best = Math.max(best, nums[index]);
                WorldTrace.scan(index, left, left + k - 1, nums[index], best);
            }
            answer[left] = best;
            WorldTrace.output(left + k - 1, best, "");
        }
        return answer;
    }
}
`;

export const SLIDING_WINDOW_REFERENCE_SOLUTION = `import java.util.*;

public class Solution {
    public int[] maxSlidingWindow(int[] nums, int k) {
        if (nums == null || nums.length == 0 || k <= 0 || k > nums.length) {
            return new int[0];
        }

        int[] answer = new int[nums.length - k + 1];
        WorldTrace.reset();
        WorldDeque candidates = new WorldDeque(nums);

        for (int right = 0; right < nums.length; right += 1) {
            int left = Math.max(0, right - k + 1);
            WorldTrace.step(right, left, right);

            while (!candidates.isEmpty() && candidates.firstIndex() < left) {
                candidates.removeFirst();
            }
            while (!candidates.isEmpty() && candidates.lastValue() <= nums[right]) {
                candidates.removeLast();
            }
            candidates.addLast(right);

            if (right >= k - 1) {
                answer[left] = candidates.firstValue();
                WorldTrace.output(right, answer[left], candidates.snapshot());
            }
        }
        return answer;
    }
}
`;

export const SLIDING_WINDOW_WORLD_SUPPORT_SOURCE = `import java.util.*;

${worldInstrumentationSource()}
`;

export const SLIDING_WINDOW_WORLD_MISSION: CodingCombatMission = {
  id: "sliding-window-max",
  title: "Rush Hour: Maximum Signal",
  signal: "fixed window · repeated maximum · monotonic candidates",
  difficulty: "Bar raiser",
  minutes: 45,
  functionName: "maxSlidingWindow",
  signature: "maxSlidingWindow(nums, k) -> int[]",
  prompt: "Return the maximum value in every contiguous window of size k. The world must remain responsive when the input grows.",
  constraints: [
    "Return an empty array when nums is empty or k is outside 1..nums.length.",
    "The final repair must run in O(n) time.",
    "Use the supplied WorldDeque so the world can replay operations performed by your Java.",
  ],
  examples: [
    {
      input: "nums = [1, 3, -1, -3, 5, 3, 6, 7], k = 3",
      output: "[3, 3, 5, 5, 6, 7]",
      why: "Each output is the strongest value still inside that window",
    },
  ],
  starterCode: "function maxSlidingWindow() { return []; }",
  java: {
    methodName: "maxSlidingWindow",
    signature: "public int[] maxSlidingWindow(int[] nums, int k)",
    argTypes: ["int[]", "int"],
    returnType: "int[]",
    starterCode: SLIDING_WINDOW_STARTER_CODE,
    supportSources: [{ fileName: "WorldRuntime.java", content: SLIDING_WINDOW_WORLD_SUPPORT_SOURCE }],
  },
  visibleTests: [
    { id: "rush-hour", label: "classic rush-hour stream", args: [[1, 3, -1, -3, 5, 3, 6, 7], 3], expected: [3, 3, 5, 5, 6, 7] },
    { id: "duplicates", label: "equal candidates", args: [[4, 4, 4], 2], expected: [4, 4] },
    { id: "unit-window", label: "window size one", args: [[-2, 0, 5], 1], expected: [-2, 0, 5] },
  ],
  hiddenTests: [
    { id: "whole-array", label: "one window covers the array", args: [[-7, -2, -9], 3], expected: [-2] },
    { id: "decreasing", label: "decreasing values preserve old candidates", args: [[9, 8, 7, 6, 5], 2], expected: [9, 8, 7, 6] },
    { id: "negative", label: "all negative values", args: [[-4, -2, -5, -1, -7], 2], expected: [-2, -2, -1, -1] },
    { id: "wide-mixed", label: "longer mixed stream", args: [[7, 2, 4, 6, 5, 1, 9, 3, 8, 0, 2, 11], 4], expected: [7, 6, 6, 9, 9, 9, 9, 8, 11] },
    { id: "invalid-window", label: "invalid window size", args: [[1, 2, 3], 4], expected: [] },
  ],
  hints: [],
  defense: [],
  worldRoute: SLIDING_WINDOW_WORLD_ROUTE,
};

export function parseSlidingWindowTrace(stdout: string | undefined): SlidingWindowTraceEvent[] {
  if (!stdout) return [];
  const events: SlidingWindowTraceEvent[] = [];
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.startsWith(TRACE_PREFIX)) continue;
    const [, kind, ...parts] = line.split("|");
    if (!isTraceKind(kind)) continue;
    const parsed = parseTraceEvent(kind, parts);
    if (parsed) events.push(parsed);
  }
  return events;
}

export function analyzeSlidingWindowRun(result: CodingCombatRunResult): SlidingWindowRunAnalysis {
  const sample = result.results.find((entry) => entry.id === "rush-hour") ?? result.results[0];
  const trace = parseSlidingWindowTrace(sample?.stdout);
  const scans = trace.filter((event) => event.kind === "scan");
  const queueEvents = trace.filter((event) => event.kind === "push" || event.kind === "pop-front" || event.kind === "pop-back");
  const steps = trace.filter((event) => event.kind === "step");
  const outputEvents = trace.filter((event) => event.kind === "output");
  const queueAlwaysMonotonic = queueEvents.every((event) =>
    event.queue.every((item, index) => index === 0 || event.queue[index - 1].value > item.value),
  );
  const queueStaysInsideWindow = queueEvents.every((event) =>
    event.queue.length <= SLIDING_WINDOW_SIZE
    && event.queue.every((item) => item.index >= event.left && item.index <= event.right)
    && event.queue.every((item, index) => index === 0 || event.queue[index - 1].index < item.index),
  );
  const stepsCoverInputOnce = steps.every((event, index) => event.index === index);
  const pushesCoverInputOnce = queueEvents
    .filter((event) => event.kind === "push")
    .every((event, index) => event.index === index);
  const outputsMatchQueueFront = outputEvents.every((event) => event.queue[0]?.value === event.value);
  const queueWorkIsLinear = queueEvents.length <= SLIDING_WINDOW_SAMPLE.length * 2;
  const correct = result.passed;
  const efficient = correct
    && scans.length === 0
    && steps.length === SLIDING_WINDOW_SAMPLE.length
    && stepsCoverInputOnce
    && outputEvents.length === SLIDING_WINDOW_SAMPLE.length - SLIDING_WINDOW_SIZE + 1
    && queueEvents.filter((event) => event.kind === "push").length === SLIDING_WINDOW_SAMPLE.length
    && pushesCoverInputOnce
    && queueAlwaysMonotonic
    && queueStaysInsideWindow
    && outputsMatchQueueFront
    && queueWorkIsLinear;

  let summary = "The Java run did not produce a replayable world trace.";
  if (!correct) summary = "The world stopped because at least one output was wrong. Repair correctness before optimizing traffic.";
  else if (efficient) summary = "The same rush hour cleared with one forward pass. Every value entered the candidate lane once and left at most once.";
  else if (scans.length > 0) summary = `The answers are correct, but Java inspected ${scans.length} values to produce ${outputEvents.length} window results. The rescans grow with both n and k.`;
  else if (trace.length > 0) summary = "The answers are correct, but the trace does not yet prove a bounded monotonic candidate lane.";

  return {
    result,
    trace,
    correct,
    efficient,
    inspections: scans.length,
    queueMutations: queueEvents.length,
    outputs: outputEvents.map((event) => event.value ?? 0),
    summary,
  };
}

export function gradeSlidingWindowExplanation(answer: string): SlidingWindowExplanationGrade {
  const normalized = answer.trim().toLowerCase();
  const checks = [
    {
      label: "Names the deque as the candidate structure",
      present: /\b(deque|double[- ]ended queue|candidate queue)\b/.test(normalized),
      missing: "Name the deque and what it stores.",
    },
    {
      label: "Explains why weaker values are removed",
      present: /\b(monotonic|decreasing|smaller|weaker|dominat)/.test(normalized) && /\b(remove|drop|pop|discard|never)/.test(normalized),
      missing: "Explain why a smaller value behind a newer larger value can never become maximum.",
    },
    {
      label: "Explains how expired indices leave the window",
      present: /\b(expir|outside|out of|left bound|window start|index)/.test(normalized) && /\b(remove|drop|pop|evict)/.test(normalized),
      missing: "Explain how indices outside the current window are evicted.",
    },
    {
      label: "Identifies the front as the current maximum",
      present: /\b(front|first|head)\b/.test(normalized) && /\b(max|maximum|largest)\b/.test(normalized),
      missing: "Connect the front of the deque to the current maximum.",
    },
    {
      label: "Defends linear complexity",
      present: /\bo\s*\(\s*n\s*\)|linear|once|at most twice/.test(normalized),
      missing: "Defend O(n) by accounting for how often each index enters and leaves.",
    },
  ];
  const strengths = checks.filter((check) => check.present).map((check) => check.label);
  const missing = checks.filter((check) => !check.present).map((check) => check.missing);
  const score = strengths.length * 20;
  return { score, passed: normalized.length >= 90 && strengths.length >= 4, strengths, missing };
}

function parseTraceEvent(kind: SlidingWindowTraceKind, parts: string[]): SlidingWindowTraceEvent | undefined {
  if (kind === "step") {
    const [index, left, right] = parts.map(Number);
    if (![index, left, right].every(Number.isFinite)) return undefined;
    return { kind, index, left, right, queue: [] };
  }
  if (kind === "scan") {
    const [index, left, right, value, best] = parts.map(Number);
    if (![index, left, right, value, best].every(Number.isFinite)) return undefined;
    return { kind, index, left, right, value, best, queue: [] };
  }
  if (kind === "output") {
    const [indexText, valueText, queueText = ""] = parts;
    const index = Number(indexText);
    const value = Number(valueText);
    if (![index, value].every(Number.isFinite)) return undefined;
    return {
      kind,
      index,
      left: Math.max(0, index - SLIDING_WINDOW_SIZE + 1),
      right: index,
      value,
      queue: parseQueue(queueText),
    };
  }
  const [indexText, valueText, leftText, rightText, queueText = ""] = parts;
  const index = Number(indexText);
  const value = Number(valueText);
  const left = Number(leftText);
  const right = Number(rightText);
  if (![index, value, left, right].every(Number.isFinite)) return undefined;
  return { kind, index, left, right, value, queue: parseQueue(queueText) };
}

function parseQueue(value: string): SlidingWindowQueueItem[] {
  if (!value) return [];
  return value.split(",").flatMap((entry) => {
    const [indexText, valueText] = entry.split(":");
    const index = Number(indexText);
    const itemValue = Number(valueText);
    return Number.isFinite(index) && Number.isFinite(itemValue) ? [{ index, value: itemValue }] : [];
  });
}

function isTraceKind(value: string): value is SlidingWindowTraceKind {
  return ["step", "scan", "push", "pop-front", "pop-back", "output"].includes(value);
}

function worldInstrumentationSource(): string {
  return `final class WorldDeque {
    private final int[] nums;
    private final Deque<Integer> data = new ArrayDeque<>();

    WorldDeque(int[] nums) { this.nums = nums; }
    boolean isEmpty() { return data.isEmpty(); }
    int firstIndex() { return data.peekFirst(); }
    int firstValue() { return nums[data.peekFirst()]; }
    int lastValue() { return nums[data.peekLast()]; }

    void addLast(int index) {
        data.addLast(index);
        WorldTrace.queue("push", index, nums[index], snapshot());
    }

    void removeFirst() {
        int index = data.removeFirst();
        WorldTrace.queue("pop-front", index, nums[index], snapshot());
    }

    void removeLast() {
        int index = data.removeLast();
        WorldTrace.queue("pop-back", index, nums[index], snapshot());
    }

    String snapshot() {
        StringBuilder value = new StringBuilder();
        for (int index : data) {
            if (value.length() > 0) value.append(',');
            value.append(index).append(':').append(nums[index]);
        }
        return value.toString();
    }
}

final class WorldTrace {
    private static int emitted = 0;
    private static final int LIMIT = 180;
    private static int currentLeft = 0;
    private static int currentRight = 0;

    static void reset() { emitted = 0; currentLeft = 0; currentRight = 0; }
    static void step(int index, int left, int right) {
        currentLeft = left;
        currentRight = right;
        emit("step|" + index + "|" + left + "|" + right);
    }
    static void scan(int index, int left, int right, int value, int best) {
        emit("scan|" + index + "|" + left + "|" + right + "|" + value + "|" + best);
    }
    static void queue(String kind, int index, int value, String queue) {
        emit(kind + "|" + index + "|" + value + "|" + currentLeft + "|" + currentRight + "|" + queue);
    }
    static void output(int index, int value, String queue) { emit("output|" + index + "|" + value + "|" + queue); }
    private static void emit(String event) {
        if (emitted < LIMIT) System.out.println("PC_TRACE|" + event);
        emitted += 1;
    }
}`;
}
