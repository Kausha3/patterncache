import type { CodingCombatMission } from "./codingCombatMissions";
import type { CodingCombatRunResult } from "./codingCombatEngine";

export const COURSE_SCHEDULE_WORLD_ROUTE = "/arena/algorithm-world/course-schedule-ii";
export const COURSE_SAMPLE_COUNT = 6;
export const COURSE_SAMPLE_PREREQUISITES = [
  [0, 1],
  [0, 2],
  [1, 3],
  [2, 3],
  [2, 4],
  [3, 5],
  [4, 5],
] as const;

export const COURSE_LABELS = [
  "Launch app",
  "Integrate API",
  "Build UI",
  "Domain core",
  "Authentication",
  "Requirements",
] as const;

export type CourseTraceKind = "round" | "scan" | "release" | "enqueue" | "take" | "decrement" | "cycle";

export interface CourseTraceEvent {
  kind: CourseTraceKind;
  course?: number;
  prerequisite?: number;
  remaining?: number;
  round?: number;
  processed?: number;
  order: number[];
}

export interface CourseScheduleRunAnalysis {
  result: CodingCombatRunResult;
  trace: CourseTraceEvent[];
  correct: boolean;
  efficient: boolean;
  prerequisiteScans: number;
  graphOperations: number;
  released: number[];
  summary: string;
}

export interface CourseExplanationGrade {
  score: number;
  passed: boolean;
  strengths: string[];
  missing: string[];
}

const TRACE_PREFIX = "PC_TOPO|";

export const COURSE_SCHEDULE_STARTER_CODE = `import java.util.*;

public class Solution {
    public int[] findOrder(int numCourses, int[][] prerequisites) {
        int[] order = new int[numCourses];
        boolean[] completed = new boolean[numCourses];
        int processed = 0;
        int round = 0;
        WorldTopoTrace.reset();

        // This scheduler is correct, but it repeatedly asks every locked course
        // whether all of its prerequisites are complete.
        while (processed < numCourses) {
            boolean madeProgress = false;
            WorldTopoTrace.round(round, processed);
            for (int course = 0; course < numCourses; course += 1) {
                if (completed[course]) continue;
                int remaining = 0;
                for (int[] edge : prerequisites) {
                    if (edge[0] != course) continue;
                    WorldTopoTrace.scan(course, edge[1], completed[edge[1]]);
                    if (!completed[edge[1]]) remaining += 1;
                }
                if (remaining == 0) {
                    completed[course] = true;
                    order[processed] = course;
                    processed += 1;
                    madeProgress = true;
                    WorldTopoTrace.release(course, order, processed);
                }
            }
            if (!madeProgress) {
                WorldTopoTrace.cycle(processed);
                return new int[0];
            }
            round += 1;
        }
        return order;
    }
}
`;

export const COURSE_SCHEDULE_REFERENCE_SOLUTION = `import java.util.*;

public class Solution {
    public int[] findOrder(int numCourses, int[][] prerequisites) {
        WorldTopoTrace.reset();
        WorldDependencyGraph graph = new WorldDependencyGraph(numCourses, prerequisites);
        Deque<Integer> ready = new ArrayDeque<Integer>();
        for (int course : graph.initialReady()) {
            ready.addLast(course);
            WorldTopoTrace.enqueue(course);
        }

        int[] order = new int[numCourses];
        int processed = 0;
        while (!ready.isEmpty()) {
            int course = ready.removeFirst();
            WorldTopoTrace.take(course, processed);
            order[processed] = course;
            processed += 1;
            for (int dependent : graph.dependents(course)) {
                int remaining = graph.completePrerequisite(dependent);
                if (remaining == 0) {
                    ready.addLast(dependent);
                    WorldTopoTrace.enqueue(dependent);
                }
            }
        }

        if (processed != numCourses) {
            WorldTopoTrace.cycle(processed);
            return new int[0];
        }
        return order;
    }
}
`;

export const COURSE_SCHEDULE_SUPPORT_SOURCE = `import java.util.*;

final class WorldDependencyGraph {
    private final List<List<Integer>> outgoing;
    private final int[] remaining;

    WorldDependencyGraph(int count, int[][] prerequisites) {
        outgoing = new ArrayList<List<Integer>>(count);
        for (int course = 0; course < count; course += 1) outgoing.add(new ArrayList<Integer>());
        remaining = new int[count];
        for (int[] edge : prerequisites) {
            outgoing.get(edge[1]).add(edge[0]);
            remaining[edge[0]] += 1;
        }
    }

    int[] initialReady() {
        int count = 0;
        for (int value : remaining) if (value == 0) count += 1;
        int[] ready = new int[count];
        int index = 0;
        for (int course = 0; course < remaining.length; course += 1) {
            if (remaining[course] == 0) ready[index++] = course;
        }
        return ready;
    }

    int[] dependents(int course) {
        List<Integer> values = outgoing.get(course);
        int[] result = new int[values.size()];
        for (int index = 0; index < values.size(); index += 1) result[index] = values.get(index);
        return result;
    }

    int completePrerequisite(int course) {
        remaining[course] -= 1;
        WorldTopoTrace.decrement(course, remaining[course]);
        return remaining[course];
    }
}

final class WorldTopoTrace {
    private static final String PREFIX = "PC_TOPO|";
    private static final List<Integer> ORDER = new ArrayList<Integer>();

    static void reset() { ORDER.clear(); }
    static void round(int round, int processed) { emit("round|" + round + "|" + processed); }
    static void scan(int course, int prerequisite, boolean complete) {
        emit("scan|" + course + "|" + prerequisite + "|" + (complete ? 1 : 0));
    }
    static void release(int course, int[] order, int length) {
        ORDER.clear();
        for (int index = 0; index < length; index += 1) ORDER.add(order[index]);
        emit("release|" + course + "|" + orderText());
    }
    static void enqueue(int course) { emit("enqueue|" + course); }
    static void take(int course, int position) {
        ORDER.add(course);
        emit("take|" + course + "|" + position + "|" + orderText());
    }
    static void decrement(int course, int remaining) { emit("decrement|" + course + "|" + remaining); }
    static void cycle(int processed) { emit("cycle|" + processed); }
    private static String orderText() {
        StringBuilder out = new StringBuilder();
        for (int index = 0; index < ORDER.size(); index += 1) {
            if (index > 0) out.append(",");
            out.append(ORDER.get(index));
        }
        return out.toString();
    }
    private static void emit(String event) { System.out.println(PREFIX + event); }
}
`;

export const COURSE_SCHEDULE_WORLD_MISSION: CodingCombatMission = {
  id: "course-schedule-ii",
  title: "Launch Control: Dependency Grid",
  signal: "prerequisites · valid build order · cycle detection",
  difficulty: "Bar raiser",
  minutes: 45,
  functionName: "findOrder",
  signature: "findOrder(numCourses, prerequisites) -> int[]",
  prompt: "Return any order that completes every course after its prerequisites. Return an empty array when a cycle makes completion impossible.",
  constraints: [
    "Any valid topological order is accepted; you are not forced to match one reference sequence.",
    "The final repair must run in O(V + E) time.",
    "Use the supplied WorldDependencyGraph so the control room can replay operations performed by your Java.",
  ],
  examples: [
    {
      input: "6 courses · 7 prerequisite links",
      output: "[5, 3, 4, 1, 2, 0] (one valid answer)",
      why: "Every prerequisite appears before the course that needs it",
    },
  ],
  starterCode: "function findOrder() { return []; }",
  java: {
    methodName: "findOrder",
    signature: "public int[] findOrder(int numCourses, int[][] prerequisites)",
    argTypes: ["int", "int[][]"],
    returnType: "int[]",
    comparison: "topological-order",
    starterCode: COURSE_SCHEDULE_STARTER_CODE,
    supportSources: [{ fileName: "WorldDependencyGraph.java", content: COURSE_SCHEDULE_SUPPORT_SOURCE }],
  },
  visibleTests: [
    { id: "launch-plan", label: "six-stage launch plan", args: [6, COURSE_SAMPLE_PREREQUISITES], expected: [5, 3, 4, 1, 2, 0] },
    { id: "simple-chain", label: "one straight prerequisite chain", args: [3, [[1, 0], [2, 1]]], expected: [0, 1, 2] },
    { id: "independent", label: "independent courses", args: [4, []], expected: [0, 1, 2, 3] },
  ],
  hiddenTests: [
    { id: "two-course-cycle", label: "two courses block each other", args: [2, [[1, 0], [0, 1]]], expected: [] },
    { id: "disconnected", label: "two independent dependency chains", args: [6, [[1, 0], [3, 2], [4, 3]]], expected: [0, 2, 5, 1, 3, 4] },
    { id: "diamond", label: "two prerequisites converge", args: [4, [[1, 0], [2, 0], [3, 1], [3, 2]]], expected: [0, 1, 2, 3] },
    { id: "self-cycle", label: "a course requires itself", args: [1, [[0, 0]]], expected: [] },
    { id: "reverse-numbering", label: "dependencies oppose numeric order", args: [5, [[0, 1], [1, 2], [2, 3], [3, 4]]], expected: [4, 3, 2, 1, 0] },
    { id: "empty-catalog", label: "zero courses", args: [0, []], expected: [] },
  ],
  hints: [],
  defense: [],
  worldRoute: COURSE_SCHEDULE_WORLD_ROUTE,
};

export function parseCourseTrace(stdout: string | undefined): CourseTraceEvent[] {
  if (!stdout) return [];
  const events: CourseTraceEvent[] = [];
  for (const line of stdout.split(/\r?\n/)) {
    if (!line.startsWith(TRACE_PREFIX)) continue;
    const [, kind, ...parts] = line.split("|");
    const parsed = parseEvent(kind, parts);
    if (parsed) events.push(parsed);
  }
  return events;
}

export function analyzeCourseScheduleRun(result: CodingCombatRunResult): CourseScheduleRunAnalysis {
  const sample = result.results.find((entry) => entry.id === "launch-plan") ?? result.results[0];
  const trace = parseCourseTrace(sample?.stdout);
  const scans = trace.filter((event) => event.kind === "scan");
  const enqueue = trace.filter((event) => event.kind === "enqueue").map((event) => event.course!);
  const takes = trace.filter((event) => event.kind === "take").map((event) => event.course!);
  const decrements = trace.filter((event) => event.kind === "decrement");
  const released = trace.filter((event) => event.kind === "release" || event.kind === "take").map((event) => event.course!);
  const uniqueTakes = new Set(takes);
  const uniqueEnqueues = new Set(enqueue);
  const orderRespectsEdges = COURSE_SAMPLE_PREREQUISITES.every(([course, prerequisite]) =>
    takes.indexOf(prerequisite) >= 0 && takes.indexOf(prerequisite) < takes.indexOf(course),
  );
  const remainingNeverNegative = decrements.every((event) => (event.remaining ?? -1) >= 0);
  const correct = result.passed;
  const efficient = correct
    && scans.length === 0
    && takes.length === COURSE_SAMPLE_COUNT
    && uniqueTakes.size === COURSE_SAMPLE_COUNT
    && enqueue.length === COURSE_SAMPLE_COUNT
    && uniqueEnqueues.size === COURSE_SAMPLE_COUNT
    && decrements.length === COURSE_SAMPLE_PREREQUISITES.length
    && remainingNeverNegative
    && orderRespectsEdges;
  let summary = "The Java run did not produce a replayable dependency trace.";
  if (!correct) summary = "At least one dependency incident produced an invalid order. Repair correctness before tuning the scheduler.";
  else if (efficient) summary = "The launch cleared in one graph pass: each course entered readiness once and each prerequisite link was consumed once.";
  else if (scans.length) summary = `The order is valid, but Java rechecked ${scans.length} prerequisite links. As the catalog grows, repeated polling turns into O(V × E) work.`;
  else if (trace.length) summary = "The order is valid, but the trace does not yet prove a one-pass readiness queue.";
  return {
    result,
    trace,
    correct,
    efficient,
    prerequisiteScans: scans.length,
    graphOperations: enqueue.length + takes.length + decrements.length,
    released,
    summary,
  };
}

export function gradeCourseExplanation(answer: string): CourseExplanationGrade {
  const normalized = answer.trim().toLowerCase();
  const checks = [
    {
      label: "Models prerequisites as directed edges",
      present: /\b(directed|edge|graph)\b/.test(normalized) && /\b(prerequisite|depend)/.test(normalized),
      missing: "Explain the edge direction from prerequisite to dependent course.",
    },
    {
      label: "Defines indegree as unresolved prerequisites",
      present: /\bindegree\b/.test(normalized) && /\b(remaining|unresolved|prerequisite|incoming)/.test(normalized),
      missing: "Define indegree as the number of prerequisites not yet completed.",
    },
    {
      label: "Explains why zero-indegree courses are ready",
      present: /\b(zero|0)\b/.test(normalized) && /\b(queue|ready|available)/.test(normalized),
      missing: "Connect zero indegree to the ready queue.",
    },
    {
      label: "Explains how completing a course unlocks dependents",
      present: /\b(decrement|reduce|subtract|remove)/.test(normalized) && /\b(dependent|neighbor|outgoing)/.test(normalized),
      missing: "Explain why completing a course decrements each dependent's indegree.",
    },
    {
      label: "Detects a cycle by incomplete processing",
      present: /\b(cycle|cyclic)\b/.test(normalized) && /\b(processed|count|all|fewer|remain)/.test(normalized),
      missing: "Explain why processing fewer than V courses proves a cycle.",
    },
    {
      label: "Defends O(V + E)",
      present: /o\s*\(\s*v\s*\+\s*e\s*\)|vertices.*edges|courses.*prerequisite links/.test(normalized),
      missing: "Defend O(V + E) by accounting for each course and edge once.",
    },
  ];
  const strengths = checks.filter((check) => check.present).map((check) => check.label);
  const missing = checks.filter((check) => !check.present).map((check) => check.missing);
  const score = Math.round((strengths.length / checks.length) * 100);
  return { score, passed: strengths.length >= 5 && answer.trim().length >= 120, strengths, missing };
}

function parseEvent(kind: string, parts: string[]): CourseTraceEvent | undefined {
  if (kind === "round" && validNumbers(parts, 2)) return { kind, round: Number(parts[0]), processed: Number(parts[1]), order: [] };
  if (kind === "scan" && validNumbers(parts, 3)) return { kind, course: Number(parts[0]), prerequisite: Number(parts[1]), remaining: Number(parts[2]), order: [] };
  if (kind === "release" && validNumbers(parts.slice(0, 1), 1)) return { kind, course: Number(parts[0]), order: parseOrder(parts[1]) };
  if (kind === "enqueue" && validNumbers(parts, 1)) return { kind, course: Number(parts[0]), order: [] };
  if (kind === "take" && validNumbers(parts.slice(0, 2), 2)) return { kind, course: Number(parts[0]), processed: Number(parts[1]), order: parseOrder(parts[2]) };
  if (kind === "decrement" && validNumbers(parts, 2)) return { kind, course: Number(parts[0]), remaining: Number(parts[1]), order: [] };
  if (kind === "cycle" && validNumbers(parts, 1)) return { kind, processed: Number(parts[0]), order: [] };
  return undefined;
}

function validNumbers(parts: string[], count: number): boolean {
  return parts.length >= count && parts.slice(0, count).every((part) => part !== "" && Number.isInteger(Number(part)));
}

function parseOrder(value = ""): number[] {
  if (!value) return [];
  const values = value.split(",").map(Number);
  return values.every(Number.isInteger) ? values : [];
}
