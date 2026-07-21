import type { CodingCombatMission } from "./codingCombatMissions";

/**
 * Original transfer prompts. They intentionally avoid canonical problem names
 * and pattern labels until the implementation has passed hidden JVM tests.
 */
export const CODING_COMBAT_BLIND_TRANSFER_MISSIONS: CodingCombatMission[] = [
  {
    id: "blind-budget-window",
    title: "Blind Transfer 01 · Error Budget",
    signal: "Pattern concealed until your implementation passes",
    difficulty: "Interview",
    minutes: 35,
    functionName: "longestStableRun",
    signature: "longestStableRun(costs, budget) → number",
    prompt: "A monitoring system records a nonnegative error cost for each consecutive minute. Return the maximum number of consecutive minutes whose total error cost does not exceed budget.",
    constraints: ["costs contains only nonnegative integers.", "The run must be contiguous.", "Return 0 when no minute can fit or the input is empty.", "Target O(n) time."],
    examples: [
      { input: "costs = [2, 1, 3, 1, 1], budget = 5", output: "3", why: "The runs [1, 3, 1] and [3, 1, 1] both fit" },
      { input: "costs = [6], budget = 5", output: "0", why: "The only minute exceeds the budget" },
    ],
    starterCode: "function longestStableRun(costs, budget) { return 0; }",
    java: {
      methodName: "longestStableRun",
      signature: "public int longestStableRun(int[] costs, int budget)",
      argTypes: ["int[]", "int"],
      returnType: "int",
      starterCode: `public class Solution {
    public int longestStableRun(int[] costs, int budget) {
        // Write the invariant before choosing a data structure.
        return 0;
    }
}
`,
    },
    visibleTests: [
      { id: "middle-run", label: "best run appears in the middle", args: [[2, 1, 3, 1, 1], 5], expected: 3 },
      { id: "zero-cost", label: "zero-cost minutes remain valid", args: [[0, 0, 4, 0], 4], expected: 4 },
      { id: "empty", label: "empty timeline", args: [[], 8], expected: 0 },
    ],
    hiddenTests: [
      { id: "none-fit", label: "no minute fits", args: [[6], 5], expected: 0 },
      { id: "prefix-best", label: "best run is a prefix", args: [[1, 2, 3], 3], expected: 2 },
      { id: "suffix-best", label: "best run is a suffix", args: [[5, 1, 1, 1], 3], expected: 3 },
      { id: "zero-budget", label: "zero budget with zero-cost suffix", args: [[0, 1, 0, 0], 0], expected: 2 },
    ],
    hints: ["The nonnegative-cost rule gives the running total one-directional behavior.", "Expand one boundary. When the total is illegal, move the other boundary only forward until legality returns.", "After restoring total <= budget, compare the current boundary distance with the best."],
    defense: [],
    blindTransfer: {
      pattern: "Variable sliding window",
      recognition: "Nonnegative values make the window sum monotonic: expanding cannot lower it, and shrinking cannot raise it.",
      transfer: "If costs could be negative, this invariant would break and a prefix-sum structure would be needed instead.",
    },
  },
  {
    id: "blind-ring-pairs",
    title: "Blind Transfer 02 · Channel Handshakes",
    signal: "Pattern concealed until your implementation passes",
    difficulty: "Interview",
    minutes: 35,
    functionName: "countHandshakes",
    signature: "countHandshakes(codes, channelCount) → long",
    prompt: "Two devices can handshake when the sum of their integer channel codes is divisible by channelCount. Count unordered index pairs that can handshake. Codes may be negative.",
    constraints: ["Use two distinct indices.", "Count each unordered pair once.", "channelCount is positive.", "The answer may exceed int range."],
    examples: [
      { input: "codes = [1, 4, 2, 3], channelCount = 5", output: "2", why: "1 pairs with 4, and 2 pairs with 3" },
      { input: "codes = [0, 0, 0], channelCount = 4", output: "3", why: "Every pair has divisible sum" },
    ],
    starterCode: "function countHandshakes(codes, channelCount) { return 0; }",
    java: {
      methodName: "countHandshakes",
      signature: "public long countHandshakes(int[] codes, int channelCount)",
      argTypes: ["int[]", "int"],
      returnType: "long",
      starterCode: `import java.util.*;

public class Solution {
    public long countHandshakes(int[] codes, int channelCount) {
        // Decide what summary of prior codes is sufficient for the next code.
        return 0L;
    }
}
`,
    },
    visibleTests: [
      { id: "two-pairs", label: "two complementary remainder pairs", args: [[1, 4, 2, 3], 5], expected: 2 },
      { id: "all-zero", label: "all codes share remainder zero", args: [[0, 0, 0], 4], expected: 3 },
      { id: "empty", label: "no devices", args: [[], 7], expected: 0 },
    ],
    hiddenTests: [
      { id: "negative", label: "negative remainders are normalized", args: [[-1, 1, 6, 4], 5], expected: 4 },
      { id: "same-half", label: "self-complementing remainder", args: [[2, 2, 2, 2], 4], expected: 6 },
      { id: "singleton", label: "one device cannot pair", args: [[5], 5], expected: 0 },
      { id: "multiples", label: "all codes divisible by channel count", args: [[5, 10, 15], 5], expected: 3 },
    ],
    hints: ["You do not need to remember complete prior values, only which equivalence class each belongs to.", "For remainder r, the required prior remainder is (channelCount - r) % channelCount.", "Normalize negative remainders before lookup, count prior complements, then record the current remainder."],
    defense: [],
    blindTransfer: {
      pattern: "One-pass remainder-frequency map",
      recognition: "Each new code needs only the count of earlier codes in its complementary modulo class.",
      transfer: "The same reduction works for pairing timestamps by cycle boundary or grouping totals by a fixed period.",
    },
  },
  {
    id: "blind-cooldown-value",
    title: "Blind Transfer 03 · Launch Calendar",
    signal: "Pattern concealed until your implementation passes",
    difficulty: "Interview",
    minutes: 40,
    functionName: "maxLaunchValue",
    signature: "maxLaunchValue(values, cooldown) → number",
    prompt: "Each day offers a nonnegative launch value. After choosing day i, the next cooldown days cannot be chosen. Return the maximum total value.",
    constraints: ["values contains nonnegative integers.", "cooldown is zero or greater.", "An empty schedule has value 0.", "Do not enumerate every subset."],
    examples: [
      { input: "values = [5, 1, 2, 10], cooldown = 1", output: "15", why: "Choose the first and fourth days" },
      { input: "values = [4, 5, 4], cooldown = 1", output: "8", why: "Choose both boundary days" },
    ],
    starterCode: "function maxLaunchValue(values, cooldown) { return 0; }",
    java: {
      methodName: "maxLaunchValue",
      signature: "public int maxLaunchValue(int[] values, int cooldown)",
      argTypes: ["int[]", "int"],
      returnType: "int",
      starterCode: `public class Solution {
    public int maxLaunchValue(int[] values, int cooldown) {
        // Define the best value for a prefix before writing the transition.
        return 0;
    }
}
`,
    },
    visibleTests: [
      { id: "far-boundaries", label: "far boundary launches", args: [[5, 1, 2, 10], 1], expected: 15 },
      { id: "skip-middle", label: "two boundaries beat the middle", args: [[4, 5, 4], 1], expected: 8 },
      { id: "empty", label: "empty calendar", args: [[], 2], expected: 0 },
    ],
    hiddenTests: [
      { id: "no-cooldown", label: "zero cooldown permits every day", args: [[1, 2, 3], 0], expected: 6 },
      { id: "wide-cooldown", label: "wide cooldown still permits distant boundaries", args: [[9, 1, 1, 9], 2], expected: 18 },
      { id: "single", label: "single launch", args: [[10], 7], expected: 10 },
      { id: "classic-shape", label: "several competing prefixes", args: [[2, 7, 9, 3, 1], 1], expected: 12 },
    ],
    hints: ["For a prefix ending at i, the final decision is either skip i or take i.", "If you take i, combine values[i] with the best prefix ending before the cooldown zone.", "Store prefix best values so each take/skip comparison is constant time."],
    defense: [],
    blindTransfer: {
      pattern: "One-dimensional dynamic programming",
      recognition: "The future needs only the best result for earlier prefixes, not the exact subset that produced it.",
      transfer: "Changing cooldown from one day to k days changes the lookup index, not the take-or-skip state definition.",
    },
  },
  {
    id: "blind-release-order",
    title: "Blind Transfer 04 · Release Train",
    signal: "Pattern concealed until your implementation passes",
    difficulty: "Interview",
    minutes: 45,
    functionName: "buildReleaseOrder",
    signature: "buildReleaseOrder(taskCount, dependencies) → number[]",
    prompt: "Tasks are numbered 0 through taskCount - 1. Each dependency [before, after] requires before to finish first. Return the lexicographically smallest valid order, or an empty array when no valid order exists.",
    constraints: ["Every task must appear exactly once in a valid result.", "Dependencies may contain a cycle.", "When several tasks are ready, choose the smallest task number.", "Target O((V + E) log V) time or better."],
    examples: [
      { input: "taskCount = 4, dependencies = [[0,2],[1,2],[1,3]]", output: "[0,1,2,3]", why: "0 and 1 start ready; the smaller ready task is released first" },
      { input: "taskCount = 2, dependencies = [[0,1],[1,0]]", output: "[]", why: "The cycle leaves no complete order" },
    ],
    starterCode: "function buildReleaseOrder(taskCount, dependencies) { return []; }",
    java: {
      methodName: "buildReleaseOrder",
      signature: "public int[] buildReleaseOrder(int taskCount, int[][] dependencies)",
      argTypes: ["int", "int[][]"],
      returnType: "int[]",
      starterCode: `import java.util.*;

public class Solution {
    public int[] buildReleaseOrder(int taskCount, int[][] dependencies) {
        // Track what becoming ready means and how ties are resolved.
        return new int[0];
    }
}
`,
    },
    visibleTests: [
      { id: "two-roots", label: "two initial ready tasks", args: [4, [[0, 2], [1, 2], [1, 3]]], expected: [0, 1, 2, 3] },
      { id: "no-deps", label: "all tasks initially ready", args: [3, []], expected: [0, 1, 2] },
      { id: "cycle", label: "two-task cycle", args: [2, [[0, 1], [1, 0]]], expected: [] },
    ],
    hiddenTests: [
      { id: "merge", label: "two branches merge", args: [5, [[0, 2], [0, 3], [1, 3], [2, 4], [3, 4]]], expected: [0, 1, 2, 3, 4] },
      { id: "isolated", label: "isolated tasks compete with a dependency", args: [4, [[2, 3]]], expected: [0, 1, 2, 3] },
      { id: "self-cycle", label: "self dependency", args: [1, [[0, 0]]], expected: [] },
      { id: "diamond", label: "diamond dependency", args: [4, [[0, 1], [0, 2], [1, 3], [2, 3]]], expected: [0, 1, 2, 3] },
    ],
    hints: ["A task becomes ready exactly when every incoming dependency has been removed.", "Count incoming dependencies and update dependent tasks when one task is released.", "Use a structure that always removes the smallest currently ready task. If fewer than taskCount tasks leave it, a cycle remains."],
    defense: [],
    blindTransfer: {
      pattern: "Topological sort with a min-heap",
      recognition: "Dependencies define a directed graph; indegree represents unfinished prerequisites and the heap enforces the tie-break rule.",
      transfer: "Without the smallest-ID requirement, a normal queue gives O(V + E) time with the same cycle proof.",
    },
  },
  {
    id: "blind-failure-groups",
    title: "Blind Transfer 05 · Failure Isolation",
    signal: "Pattern concealed until your implementation passes",
    difficulty: "Interview",
    minutes: 40,
    functionName: "countSurvivingGroups",
    signature: "countSurvivingGroups(serviceCount, links, failedService) → number",
    prompt: "Services are joined by undirected links. One failed service and every link touching it are removed. Count the connected service groups that remain.",
    constraints: ["Services are numbered 0 through serviceCount - 1.", "The failed service is not counted as a group.", "Links may be disconnected before the failure.", "Visit the surviving graph in O(V + E) time."],
    examples: [
      { input: "serviceCount = 5, links = [[0,1],[1,2],[3,4]], failedService = 1", output: "3", why: "0 and 2 become isolated while 3 and 4 remain connected" },
    ],
    starterCode: "function countSurvivingGroups(serviceCount, links, failedService) { return 0; }",
    java: {
      methodName: "countSurvivingGroups",
      signature: "public int countSurvivingGroups(int serviceCount, int[][] links, int failedService)",
      argTypes: ["int", "int[][]", "int"],
      returnType: "int",
      starterCode: `import java.util.*;

public class Solution {
    public int countSurvivingGroups(int serviceCount, int[][] links, int failedService) {
        // Model the surviving neighborhood before counting anything.
        return 0;
    }
}
`,
    },
    visibleTests: [
      { id: "bridge-fails", label: "failed bridge splits a component", args: [5, [[0, 1], [1, 2], [3, 4]], 1], expected: 3 },
      { id: "only-service", label: "only service fails", args: [1, [], 0], expected: 0 },
      { id: "triangle", label: "redundant links preserve connectivity", args: [3, [[0, 1], [1, 2], [2, 0]], 1], expected: 1 },
    ],
    hiddenTests: [
      { id: "chain-middle", label: "middle of chain fails", args: [5, [[0, 1], [1, 2], [2, 3], [3, 4]], 2], expected: 2 },
      { id: "isolated", label: "no links", args: [4, [], 3], expected: 3 },
      { id: "star-center", label: "star center fails", args: [4, [[0, 1], [0, 2], [0, 3]], 0], expected: 3 },
      { id: "star-leaf", label: "star leaf fails", args: [4, [[0, 1], [0, 2], [0, 3]], 3], expected: 1 },
    ],
    hints: ["Remove the failed service while building or traversing the adjacency structure.", "Every traversal started from an unvisited surviving service consumes exactly one connected group.", "Mark on entry, explore every surviving neighbor, and increment only when starting a new traversal."],
    defense: [],
    blindTransfer: {
      pattern: "Connected-component traversal",
      recognition: "The requested count is the number of traversal starts needed to consume every surviving vertex.",
      transfer: "If links arrived online, union-find could maintain groups, but deletions would require a different strategy.",
    },
  },
  {
    id: "blind-capacity-split",
    title: "Blind Transfer 06 · Capacity Contract",
    signal: "Pattern concealed until your implementation passes",
    difficulty: "Bar raiser",
    minutes: 45,
    functionName: "minimumPeakLoad",
    signature: "minimumPeakLoad(jobs, workers) → number",
    prompt: "Jobs must remain in their original order and each worker receives one contiguous block. Split all jobs among at most workers people so the largest assigned total is as small as possible. Return that minimum largest total.",
    constraints: ["Job costs are nonnegative integers.", "Order cannot change and a job cannot be split.", "Empty input returns 0.", "Avoid enumerating every partition."],
    examples: [
      { input: "jobs = [7,2,5,10,8], workers = 2", output: "18", why: "[7,2,5] and [10,8] minimizes the peak" },
      { input: "jobs = [1,2,3,4,5], workers = 2", output: "9", why: "[1,2,3] and [4,5]" },
    ],
    starterCode: "function minimumPeakLoad(jobs, workers) { return 0; }",
    java: {
      methodName: "minimumPeakLoad",
      signature: "public int minimumPeakLoad(int[] jobs, int workers)",
      argTypes: ["int[]", "int"],
      returnType: "int",
      starterCode: `public class Solution {
    public int minimumPeakLoad(int[] jobs, int workers) {
        // Find a yes/no question whose answer changes only once.
        return 0;
    }
}
`,
    },
    visibleTests: [
      { id: "canonical", label: "two workers with uneven jobs", args: [[7, 2, 5, 10, 8], 2], expected: 18 },
      { id: "ordered", label: "ordered jobs", args: [[1, 2, 3, 4, 5], 2], expected: 9 },
      { id: "empty", label: "no jobs", args: [[], 3], expected: 0 },
    ],
    hiddenTests: [
      { id: "extra-workers", label: "more workers than jobs", args: [[5, 1, 2], 5], expected: 5 },
      { id: "one-worker", label: "one worker takes everything", args: [[3, 4, 5], 1], expected: 12 },
      { id: "equal-jobs", label: "equal jobs across three workers", args: [[10, 10, 10, 10], 3], expected: 20 },
      { id: "zero-cost", label: "all jobs cost zero", args: [[0, 0, 0], 2], expected: 0 },
    ],
    hints: ["A candidate peak below the largest job is impossible; the sum of all jobs is always sufficient.", "For one candidate peak, greedily start a new worker exactly when the next job would exceed it.", "Feasibility changes monotonically as the candidate peak grows, so search the answer range."],
    defense: [],
    blindTransfer: {
      pattern: "Binary search on a monotonic answer",
      recognition: "Checking whether a candidate peak needs at most workers is greedy and monotonic across candidate values.",
      transfer: "The same structure appears when minimizing shipping capacity, machine load, or maximum contiguous work per day.",
    },
  },
];

export const CODING_COMBAT_BLIND_JS_REFERENCES: Record<string, string> = {
  "blind-budget-window": `function longestStableRun(costs, budget) {
    let left = 0, total = 0, best = 0;
    for (let right = 0; right < costs.length; right += 1) {
      total += costs[right];
      while (left <= right && total > budget) total -= costs[left++];
      best = Math.max(best, right - left + 1);
    }
    return best;
  }`,
  "blind-ring-pairs": `function countHandshakes(codes, channelCount) {
    const counts = new Map();
    let answer = 0;
    for (const code of codes) {
      const remainder = ((code % channelCount) + channelCount) % channelCount;
      const needed = (channelCount - remainder) % channelCount;
      answer += counts.get(needed) || 0;
      counts.set(remainder, (counts.get(remainder) || 0) + 1);
    }
    return answer;
  }`,
  "blind-cooldown-value": `function maxLaunchValue(values, cooldown) {
    const dp = Array(values.length + 1).fill(0);
    for (let i = 1; i <= values.length; i += 1) {
      const earlier = Math.max(0, i - cooldown - 1);
      dp[i] = Math.max(dp[i - 1], values[i - 1] + dp[earlier]);
    }
    return dp[values.length];
  }`,
  "blind-release-order": `function buildReleaseOrder(taskCount, dependencies) {
    const outgoing = Array.from({ length: taskCount }, () => []);
    const indegree = Array(taskCount).fill(0);
    for (const [before, after] of dependencies) { outgoing[before].push(after); indegree[after] += 1; }
    const ready = [];
    for (let task = 0; task < taskCount; task += 1) if (indegree[task] === 0) ready.push(task);
    const order = [];
    while (ready.length) {
      ready.sort((a, b) => a - b);
      const task = ready.shift();
      order.push(task);
      for (const next of outgoing[task]) if (--indegree[next] === 0) ready.push(next);
    }
    return order.length === taskCount ? order : [];
  }`,
  "blind-failure-groups": `function countSurvivingGroups(serviceCount, links, failedService) {
    const graph = Array.from({ length: serviceCount }, () => []);
    for (const [a, b] of links) if (a !== failedService && b !== failedService) { graph[a].push(b); graph[b].push(a); }
    const seen = new Set([failedService]);
    let groups = 0;
    for (let start = 0; start < serviceCount; start += 1) {
      if (seen.has(start)) continue;
      groups += 1;
      const stack = [start]; seen.add(start);
      while (stack.length) for (const next of graph[stack.pop()]) if (!seen.has(next)) { seen.add(next); stack.push(next); }
    }
    return groups;
  }`,
  "blind-capacity-split": `function minimumPeakLoad(jobs, workers) {
    if (jobs.length === 0) return 0;
    let low = Math.max(...jobs), high = jobs.reduce((sum, value) => sum + value, 0);
    while (low < high) {
      const mid = Math.floor((low + high) / 2);
      let used = 1, load = 0;
      for (const job of jobs) { if (load + job > mid) { used += 1; load = 0; } load += job; }
      if (used <= workers) high = mid; else low = mid + 1;
    }
    return low;
  }`,
};

export const CODING_COMBAT_BLIND_JAVA_REFERENCES: Record<string, string> = {
  "blind-budget-window": `public class Solution {
    public int longestStableRun(int[] costs, int budget) {
        int left = 0, total = 0, best = 0;
        for (int right = 0; right < costs.length; right += 1) {
            total += costs[right];
            while (left <= right && total > budget) total -= costs[left++];
            best = Math.max(best, right - left + 1);
        }
        return best;
    }
}
`,
  "blind-ring-pairs": `import java.util.*;

public class Solution {
    public long countHandshakes(int[] codes, int channelCount) {
        Map<Integer, Long> counts = new HashMap<>();
        long answer = 0L;
        for (int code : codes) {
            int remainder = ((code % channelCount) + channelCount) % channelCount;
            int needed = (channelCount - remainder) % channelCount;
            answer += counts.getOrDefault(needed, 0L);
            counts.put(remainder, counts.getOrDefault(remainder, 0L) + 1L);
        }
        return answer;
    }
}
`,
  "blind-cooldown-value": `public class Solution {
    public int maxLaunchValue(int[] values, int cooldown) {
        int[] dp = new int[values.length + 1];
        for (int i = 1; i <= values.length; i += 1) {
            int earlier = Math.max(0, i - cooldown - 1);
            dp[i] = Math.max(dp[i - 1], values[i - 1] + dp[earlier]);
        }
        return dp[values.length];
    }
}
`,
  "blind-release-order": `import java.util.*;

public class Solution {
    public int[] buildReleaseOrder(int taskCount, int[][] dependencies) {
        List<List<Integer>> outgoing = new ArrayList<>();
        for (int task = 0; task < taskCount; task += 1) outgoing.add(new ArrayList<>());
        int[] indegree = new int[taskCount];
        for (int[] dependency : dependencies) {
            outgoing.get(dependency[0]).add(dependency[1]);
            indegree[dependency[1]] += 1;
        }
        PriorityQueue<Integer> ready = new PriorityQueue<>();
        for (int task = 0; task < taskCount; task += 1) if (indegree[task] == 0) ready.add(task);
        int[] order = new int[taskCount];
        int size = 0;
        while (!ready.isEmpty()) {
            int task = ready.poll();
            order[size++] = task;
            for (int next : outgoing.get(task)) if (--indegree[next] == 0) ready.add(next);
        }
        return size == taskCount ? order : new int[0];
    }
}
`,
  "blind-failure-groups": `import java.util.*;

public class Solution {
    public int countSurvivingGroups(int serviceCount, int[][] links, int failedService) {
        List<List<Integer>> graph = new ArrayList<>();
        for (int service = 0; service < serviceCount; service += 1) graph.add(new ArrayList<>());
        for (int[] link : links) {
            if (link[0] == failedService || link[1] == failedService) continue;
            graph.get(link[0]).add(link[1]);
            graph.get(link[1]).add(link[0]);
        }
        boolean[] seen = new boolean[serviceCount];
        seen[failedService] = true;
        int groups = 0;
        for (int start = 0; start < serviceCount; start += 1) {
            if (seen[start]) continue;
            groups += 1;
            Deque<Integer> stack = new ArrayDeque<>();
            stack.push(start);
            seen[start] = true;
            while (!stack.isEmpty()) {
                int service = stack.pop();
                for (int next : graph.get(service)) if (!seen[next]) { seen[next] = true; stack.push(next); }
            }
        }
        return groups;
    }
}
`,
  "blind-capacity-split": `public class Solution {
    public int minimumPeakLoad(int[] jobs, int workers) {
        if (jobs.length == 0) return 0;
        int low = 0, high = 0;
        for (int job : jobs) { low = Math.max(low, job); high += job; }
        while (low < high) {
            int mid = low + (high - low) / 2;
            int used = 1, load = 0;
            for (int job : jobs) {
                if (load + job > mid) { used += 1; load = 0; }
                load += job;
            }
            if (used <= workers) high = mid;
            else low = mid + 1;
        }
        return low;
    }
}
`,
};
