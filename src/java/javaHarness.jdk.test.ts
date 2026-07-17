import { describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateTestMain, parseJavaTestReport } from "./javaHarness";
import { CODING_COMBAT_MISSIONS, getCodingCombatMission } from "@/arena/codingCombatMissions";

/**
 * Golden proof for the codegen: compile each mission's generated harness
 * with a real javac and run it on a real JVM. In the browser the same two
 * sources go through CheerpJ instead; the generated code is identical, so
 * this is the strongest offline check that the harness is honest Java.
 *
 * Skipped automatically on machines without a JDK.
 */

const jdkAvailable = (() => {
  try {
    return (
      spawnSync("javac", ["-version"], { stdio: "ignore" }).status === 0 &&
      spawnSync("java", ["-version"], { stdio: "ignore" }).status === 0
    );
  } catch {
    return false;
  }
})();

const REFERENCE_SOLUTIONS: Record<string, string> = {
  "target-pair": `import java.util.*;

public class Solution {
    public int[] findTargetPair(int[] nums, int target) {
        int left = 0;
        int right = nums.length - 1;
        while (left < right) {
            int sum = nums[left] + nums[right];
            if (sum == target) return new int[] { left, right };
            if (sum < target) left += 1;
            else right -= 1;
        }
        return new int[] { -1, -1 };
    }
}
`,
  "unique-window": `import java.util.*;

public class Solution {
    public int longestUniqueRun(String text) {
        Map<Character, Integer> lastSeen = new HashMap<>();
        int best = 0;
        int left = 0;
        for (int right = 0; right < text.length(); right += 1) {
            char current = text.charAt(right);
            Integer seen = lastSeen.get(current);
            if (seen != null && seen + 1 > left) left = seen + 1;
            lastSeen.put(current, right);
            best = Math.max(best, right - left + 1);
        }
        return best;
    }
}
`,
  "shortest-hop": `import java.util.*;

public class Solution {
    public int shortestHopCount(Map<String, List<String>> graph, String start, String end) {
        if (start.equals(end)) return 0;
        Deque<String> queue = new ArrayDeque<>();
        Map<String, Integer> distance = new HashMap<>();
        queue.add(start);
        distance.put(start, 0);
        while (!queue.isEmpty()) {
            String node = queue.poll();
            List<String> neighbors = graph.containsKey(node) ? graph.get(node) : Collections.<String>emptyList();
            for (String next : neighbors) {
                if (distance.containsKey(next)) continue;
                int hops = distance.get(node) + 1;
                if (next.equals(end)) return hops;
                distance.put(next, hops);
                queue.add(next);
            }
        }
        return -1;
    }
}
`,
  "pair-sum-map": `import java.util.*;

public class Solution {
    public int[] findPairIndices(int[] nums, int target) {
        Map<Integer, Integer> seen = new HashMap<>();
        for (int index = 0; index < nums.length; index += 1) {
            Integer partner = seen.get(target - nums[index]);
            if (partner != null) return new int[] { partner, index };
            seen.put(nums[index], index);
        }
        return new int[] { -1, -1 };
    }
}
`,
  "rotated-search": `import java.util.*;

public class Solution {
    public int findInRotated(int[] nums, int target) {
        int low = 0;
        int high = nums.length - 1;
        while (low <= high) {
            int mid = low + (high - low) / 2;
            if (nums[mid] == target) return mid;
            if (nums[low] <= nums[mid]) {
                if (nums[low] <= target && target < nums[mid]) high = mid - 1;
                else low = mid + 1;
            } else {
                if (nums[mid] < target && target <= nums[high]) low = mid + 1;
                else high = mid - 1;
            }
        }
        return -1;
    }
}
`,
  "balanced-brackets": `import java.util.*;

public class Solution {
    public boolean isBalanced(String text) {
        Deque<Character> stack = new ArrayDeque<>();
        for (int index = 0; index < text.length(); index += 1) {
            char current = text.charAt(index);
            if (current == '(' || current == '[' || current == '{') {
                stack.push(current);
                continue;
            }
            if (stack.isEmpty()) return false;
            char opened = stack.pop();
            boolean matches = (current == ')' && opened == '(')
                || (current == ']' && opened == '[')
                || (current == '}' && opened == '{');
            if (!matches) return false;
        }
        return stack.isEmpty();
    }
}
`,
  "merge-intervals": `import java.util.*;

public class Solution {
    public int[][] mergeIntervals(int[][] intervals) {
        if (intervals.length == 0) return new int[0][0];
        Arrays.sort(intervals, (left, right) -> Integer.compare(left[0], right[0]));
        List<int[]> merged = new ArrayList<>();
        int[] active = intervals[0].clone();
        for (int index = 1; index < intervals.length; index += 1) {
            int[] next = intervals[index];
            if (next[0] <= active[1]) active[1] = Math.max(active[1], next[1]);
            else {
                merged.add(active);
                active = next.clone();
            }
        }
        merged.add(active);
        return merged.toArray(new int[merged.size()][]);
    }
}
`,
  "insert-interval": `import java.util.*;

public class Solution {
    public int[][] insertInterval(int[][] intervals, int[] newInterval) {
        List<int[]> result = new ArrayList<>();
        int index = 0;
        int start = newInterval[0];
        int end = newInterval[1];
        while (index < intervals.length && intervals[index][1] < start) {
            result.add(intervals[index].clone());
            index += 1;
        }
        while (index < intervals.length && intervals[index][0] <= end) {
            start = Math.min(start, intervals[index][0]);
            end = Math.max(end, intervals[index][1]);
            index += 1;
        }
        result.add(new int[] { start, end });
        while (index < intervals.length) {
            result.add(intervals[index].clone());
            index += 1;
        }
        return result.toArray(new int[result.size()][]);
    }
}
`,
  "k-closest-points": `import java.util.*;

public class Solution {
    public int[][] kClosestPoints(int[][] points, int k) {
        PriorityQueue<int[]> closest = new PriorityQueue<>((left, right) -> Long.compare(distance(right), distance(left)));
        for (int[] point : points) {
            closest.offer(point);
            if (closest.size() > k) closest.poll();
        }
        int[][] result = new int[closest.size()][];
        int index = 0;
        while (!closest.isEmpty()) result[index++] = closest.poll().clone();
        return result;
    }

    private long distance(int[] point) {
        return (long) point[0] * point[0] + (long) point[1] * point[1];
    }
}
`,
  "number-of-islands": `import java.util.*;

public class Solution {
    public int countIslands(int[][] grid) {
        if (grid.length == 0 || grid[0].length == 0) return 0;
        int islands = 0;
        int[][] directions = new int[][] { {1, 0}, {-1, 0}, {0, 1}, {0, -1} };
        for (int row = 0; row < grid.length; row += 1) {
            for (int col = 0; col < grid[0].length; col += 1) {
                if (grid[row][col] != 1) continue;
                islands += 1;
                Deque<int[]> queue = new ArrayDeque<>();
                queue.offer(new int[] { row, col });
                grid[row][col] = 0;
                while (!queue.isEmpty()) {
                    int[] cell = queue.poll();
                    for (int[] direction : directions) {
                        int nextRow = cell[0] + direction[0];
                        int nextCol = cell[1] + direction[1];
                        if (nextRow < 0 || nextRow >= grid.length || nextCol < 0 || nextCol >= grid[0].length || grid[nextRow][nextCol] != 1) continue;
                        grid[nextRow][nextCol] = 0;
                        queue.offer(new int[] { nextRow, nextCol });
                    }
                }
            }
        }
        return islands;
    }
}
`,
  "rotting-oranges": `import java.util.*;

public class Solution {
    public int minutesUntilRotten(int[][] grid) {
        if (grid.length == 0 || grid[0].length == 0) return 0;
        Deque<int[]> queue = new ArrayDeque<>();
        int fresh = 0;
        for (int row = 0; row < grid.length; row += 1) {
            for (int col = 0; col < grid[0].length; col += 1) {
                if (grid[row][col] == 2) queue.offer(new int[] { row, col });
                else if (grid[row][col] == 1) fresh += 1;
            }
        }
        int minutes = 0;
        int[][] directions = new int[][] { {1, 0}, {-1, 0}, {0, 1}, {0, -1} };
        while (!queue.isEmpty() && fresh > 0) {
            int levelSize = queue.size();
            boolean spread = false;
            for (int count = 0; count < levelSize; count += 1) {
                int[] cell = queue.poll();
                for (int[] direction : directions) {
                    int nextRow = cell[0] + direction[0];
                    int nextCol = cell[1] + direction[1];
                    if (nextRow < 0 || nextRow >= grid.length || nextCol < 0 || nextCol >= grid[0].length || grid[nextRow][nextCol] != 1) continue;
                    grid[nextRow][nextCol] = 2;
                    fresh -= 1;
                    spread = true;
                    queue.offer(new int[] { nextRow, nextCol });
                }
            }
            if (spread) minutes += 1;
        }
        return fresh == 0 ? minutes : -1;
    }
}
`,
  "unique-paths-obstacles": `import java.util.*;

public class Solution {
    public int countPathsWithObstacles(int[][] obstacleGrid) {
        if (obstacleGrid.length == 0 || obstacleGrid[0].length == 0 || obstacleGrid[0][0] == 1) return 0;
        int[] paths = new int[obstacleGrid[0].length];
        paths[0] = 1;
        for (int row = 0; row < obstacleGrid.length; row += 1) {
            for (int col = 0; col < obstacleGrid[0].length; col += 1) {
                if (obstacleGrid[row][col] == 1) paths[col] = 0;
                else if (col > 0) paths[col] += paths[col - 1];
            }
        }
        return paths[paths.length - 1];
    }
}
`,
  "validate-bst": `public class Solution {
    public boolean isValidBst(TreeNode root) {
        return valid(root, Long.MIN_VALUE, Long.MAX_VALUE);
    }

    private boolean valid(TreeNode node, long low, long high) {
        if (node == null) return true;
        if (node.val <= low || node.val >= high) return false;
        return valid(node.left, low, node.val) && valid(node.right, node.val, high);
    }
}
`,
  "tree-level-order": `import java.util.*;

public class Solution {
    public int[][] levelOrder(TreeNode root) {
        if (root == null) return new int[0][0];
        List<int[]> rows = new ArrayList<>();
        Deque<TreeNode> queue = new ArrayDeque<>();
        queue.offer(root);
        while (!queue.isEmpty()) {
            int size = queue.size();
            int[] row = new int[size];
            for (int index = 0; index < size; index += 1) {
                TreeNode node = queue.poll();
                row[index] = node.val;
                if (node.left != null) queue.offer(node.left);
                if (node.right != null) queue.offer(node.right);
            }
            rows.add(row);
        }
        return rows.toArray(new int[rows.size()][]);
    }
}
`,
  "lowest-common-ancestor": `public class Solution {
    public TreeNode lowestCommonAncestor(TreeNode root, int p, int q) {
        if (root == null || root.val == p || root.val == q) return root;
        TreeNode left = lowestCommonAncestor(root.left, p, q);
        TreeNode right = lowestCommonAncestor(root.right, p, q);
        if (left != null && right != null) return root;
        return left != null ? left : right;
    }
}
`,
  "path-sum-tree": `public class Solution {
    public boolean hasPathSum(TreeNode root, int target) {
        if (root == null) return false;
        if (root.left == null && root.right == null) return root.val == target;
        int remaining = target - root.val;
        return hasPathSum(root.left, remaining) || hasPathSum(root.right, remaining);
    }
}
`,
  "distance-k-tree": `import java.util.*;

public class Solution {
    public int[] nodesAtDistanceK(TreeNode root, int targetValue, int k) {
        Map<TreeNode, TreeNode> parent = new HashMap<>();
        TreeNode target = mapParents(root, null, targetValue, parent);
        Deque<TreeNode> queue = new ArrayDeque<>();
        Set<TreeNode> seen = new HashSet<>();
        queue.offer(target);
        seen.add(target);
        for (int distance = 0; distance < k && !queue.isEmpty(); distance += 1) {
            int size = queue.size();
            for (int count = 0; count < size; count += 1) {
                TreeNode node = queue.poll();
                TreeNode[] neighbors = new TreeNode[] { node.left, node.right, parent.get(node) };
                for (TreeNode next : neighbors) {
                    if (next != null && seen.add(next)) queue.offer(next);
                }
            }
        }
        int[] answer = new int[queue.size()];
        int index = 0;
        for (TreeNode node : queue) answer[index++] = node.val;
        return answer;
    }

    private TreeNode mapParents(TreeNode node, TreeNode parentNode, int targetValue, Map<TreeNode, TreeNode> parent) {
        if (node == null) return null;
        if (parentNode != null) parent.put(node, parentNode);
        TreeNode answer = node.val == targetValue ? node : null;
        TreeNode left = mapParents(node.left, node, targetValue, parent);
        TreeNode right = mapParents(node.right, node, targetValue, parent);
        if (answer != null) return answer;
        return left != null ? left : right;
    }
}
`,
  "reorder-list": `public class Solution {
    public void reorderList(ListNode head) {
        if (head == null || head.next == null) return;
        ListNode slow = head;
        ListNode fast = head;
        while (fast.next != null && fast.next.next != null) {
            slow = slow.next;
            fast = fast.next.next;
        }
        ListNode second = slow.next;
        slow.next = null;
        ListNode reversed = null;
        while (second != null) {
            ListNode next = second.next;
            second.next = reversed;
            reversed = second;
            second = next;
        }
        ListNode first = head;
        while (reversed != null) {
            ListNode firstNext = first.next;
            ListNode secondNext = reversed.next;
            first.next = reversed;
            reversed.next = firstNext;
            first = firstNext;
            reversed = secondNext;
        }
    }
}
`,
  "reverse-linked-list": `public class Solution {
    public ListNode reverseList(ListNode head) {
        ListNode previous = null;
        ListNode current = head;
        while (current != null) {
            ListNode next = current.next;
            current.next = previous;
            previous = current;
            current = next;
        }
        return previous;
    }
}
`,
  "linked-list-cycle": `public class Solution {
    public boolean hasCycle(ListNode head) {
        ListNode slow = head;
        ListNode fast = head;
        while (fast != null && fast.next != null) {
            slow = slow.next;
            fast = fast.next.next;
            if (slow == fast) return true;
        }
        return false;
    }
}
`,
};

function compileAndRun(solutionSource: string, harnessSource: string) {
  const workDir = mkdtempSync(join(tmpdir(), "pc-java-"));
  try {
    const reportPath = join(workDir, "report.json");
    writeFileSync(join(workDir, "Solution.java"), solutionSource);
    writeFileSync(join(workDir, "PcTestMain.java"), harnessSource);
    execFileSync("javac", ["-d", workDir, join(workDir, "Solution.java"), join(workDir, "PcTestMain.java")], {
      stdio: "pipe",
    });
    execFileSync("java", ["-cp", workDir, "PcTestMain", reportPath], { stdio: "pipe" });
    return parseJavaTestReport(readFileSync(reportPath, "utf-8"));
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

function allTests(missionId: string) {
  const mission = getCodingCombatMission(missionId)!;
  return [
    ...mission.visibleTests.map((test) => ({ ...test, hidden: false })),
    ...mission.hiddenTests.map((test) => ({ ...test, hidden: true })),
  ];
}

describe.skipIf(!jdkAvailable)("generated harness on a real JVM", () => {
  for (const mission of CODING_COMBAT_MISSIONS) {
    it(`${mission.id}: the reference solution passes every visible and hidden test`, () => {
      const tests = allTests(mission.id);
      const harness = generateTestMain(mission.java, tests);
      const report = compileAndRun(REFERENCE_SOLUTIONS[mission.id], harness);
      expect(report).toHaveLength(tests.length);
      expect(report.map((entry) => entry.id)).toEqual(tests.map((test) => test.id));
      const failures = report.filter((entry) => !entry.passed);
      expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
      for (const entry of report) {
        expect(entry.error).toBeNull();
        expect(entry.expected.length).toBeGreaterThan(0);
      }
    });

    it(`${mission.id}: the starter code fails at least one test with readable expected and actual text`, () => {
      const tests = allTests(mission.id);
      const harness = generateTestMain(mission.java, tests);
      const report = compileAndRun(mission.java.starterCode, harness);
      const failures = report.filter((entry) => !entry.passed);
      expect(failures.length).toBeGreaterThan(0);
      for (const failure of failures) {
        expect(failure.error).toBeNull();
        expect(failure.actual).not.toBeNull();
        expect(failure.expected).not.toBe(failure.actual);
      }
    });
  }

  it("reports a thrown exception as that test's error without killing later tests", () => {
    const mission = getCodingCombatMission("unique-window")!;
    const tests = allTests(mission.id);
    const harness = generateTestMain(mission.java, tests);
    const report = compileAndRun(
      `public class Solution {
    public int longestUniqueRun(String text) {
        if (text.isEmpty()) throw new IllegalStateException("boom");
        return text.length();
    }
}
`,
      harness,
    );
    const exploded = report.find((entry) => entry.id === "empty-text")!;
    expect(exploded.passed).toBe(false);
    expect(exploded.error).toContain("IllegalStateException");
    expect(exploded.error).toContain("boom");
    const after = report.filter((entry) => entry.id !== "empty-text");
    expect(after.length).toBe(tests.length - 1);
    expect(after.every((entry) => entry.error === null)).toBe(true);
  });

  it("captures what the solution prints and survives hostile string data", () => {
    const spec = {
      methodName: "echo",
      signature: "public String echo(String value)",
      argTypes: ["String"] as const,
      returnType: "String" as const,
      starterCode: "",
    };
    const hostile = 'quote " backslash \\ newline \n tab \t unicode é 🙂 fake escape \\u0041';
    const harness = generateTestMain(
      { ...spec, argTypes: ["String"], returnType: "String" },
      [{ id: "hostile", label: "hostile input", args: [hostile], expected: hostile }],
    );
    const report = compileAndRun(
      `public class Solution {
    public String echo(String value) {
        System.out.println("saw: " + value);
        return value;
    }
}
`,
      harness,
    );
    expect(report[0].passed).toBe(true);
    expect(report[0].stdout).toContain("saw: quote");
    expect(report[0].expected).toBe('"' + hostile + '"');
  });

  it("accepts a correct int-matrix result when row order is explicitly irrelevant", () => {
    const spec = {
      methodName: "reverseRows",
      signature: "public int[][] reverseRows(int[][] rows)",
      argTypes: ["int[][]"] as const,
      returnType: "int[][]" as const,
      comparison: "unordered-rows" as const,
      starterCode: "",
    };
    const harness = generateTestMain(
      { ...spec, argTypes: ["int[][]"], returnType: "int[][]" },
      [{ id: "reordered", label: "same rows in another order", args: [[[1, 2], [3, 4]]], expected: [[1, 2], [3, 4]] }],
    );
    const report = compileAndRun(
      `public class Solution {
    public int[][] reverseRows(int[][] rows) {
        return new int[][] { rows[1], rows[0] };
    }
}
`,
      harness,
    );
    expect(report[0]).toMatchObject({ id: "reordered", passed: true, error: null });
    expect(report[0].expected).not.toBe(report[0].actual);
  });

  it("catches int overflow in the K Closest squared-distance calculation", () => {
    const mission = getCodingCombatMission("k-closest-points")!;
    const overflowCase = mission.hiddenTests.find((test) => test.id === "distance-overflow")!;
    const harness = generateTestMain(mission.java, [overflowCase]);
    const report = compileAndRun(
      `import java.util.*;

public class Solution {
    public int[][] kClosestPoints(int[][] points, int k) {
        Arrays.sort(points, (left, right) -> Integer.compare(distance(left), distance(right)));
        return Arrays.copyOf(points, k);
    }

    private int distance(int[] point) {
        return point[0] * point[0] + point[1] * point[1];
    }
}
`,
      harness,
    );
    expect(report[0]).toMatchObject({ id: "distance-overflow", passed: false, error: null });
    expect(report[0].actual).not.toBe(report[0].expected);
  });

  it("catches BST validation that forgets ancestor bounds", () => {
    const mission = getCodingCombatMission("validate-bst")!;
    const deepViolation = mission.hiddenTests.find((test) => test.id === "deep-bound")!;
    const report = compileAndRun(
      `public class Solution {
    public boolean isValidBst(TreeNode root) {
        if (root == null) return true;
        if (root.left != null && root.left.val >= root.val) return false;
        if (root.right != null && root.right.val <= root.val) return false;
        return isValidBst(root.left) && isValidBst(root.right);
    }
}
`,
      generateTestMain(mission.java, [deepViolation]),
    );
    expect(report[0]).toMatchObject({ id: "deep-bound", passed: false, actual: "true", error: null });
  });

  it("catches a Distance K traversal that never walks through parents", () => {
    const mission = getCodingCombatMission("distance-k-tree")!;
    const classic = mission.visibleTests.find((test) => test.id === "classic")!;
    const report = compileAndRun(
      `import java.util.*;

public class Solution {
    public int[] nodesAtDistanceK(TreeNode root, int targetValue, int k) {
        TreeNode target = find(root, targetValue);
        List<Integer> values = new ArrayList<>();
        collect(target, k, values);
        int[] result = new int[values.size()];
        for (int index = 0; index < values.size(); index += 1) result[index] = values.get(index);
        return result;
    }
    private TreeNode find(TreeNode node, int value) {
        if (node == null || node.val == value) return node;
        TreeNode left = find(node.left, value);
        return left != null ? left : find(node.right, value);
    }
    private void collect(TreeNode node, int distance, List<Integer> values) {
        if (node == null) return;
        if (distance == 0) { values.add(node.val); return; }
        collect(node.left, distance - 1, values);
        collect(node.right, distance - 1, values);
    }
}
`,
      generateTestMain(mission.java, [classic]),
    );
    expect(report[0]).toMatchObject({ id: "classic", passed: false, error: null });
    expect(report[0].actual).toBe("[7, 4]");
  });

  it("serializes and compares cyclic ListNode results without hanging", () => {
    const spec = {
      methodName: "identity",
      signature: "public ListNode identity(ListNode head)",
      argTypes: ["ListNode"] as const,
      returnType: "ListNode" as const,
      starterCode: "",
    };
    const cycle = { values: [3, 2, 0, -4], cycleAt: 1 };
    const report = compileAndRun(
      `public class Solution {
    public ListNode identity(ListNode head) { return head; }
}
`,
      generateTestMain(
        { ...spec, argTypes: ["ListNode"], returnType: "ListNode" },
        [{ id: "cycle", label: "cycle", args: [cycle], expected: cycle }],
      ),
    );
    expect(report[0]).toMatchObject({ id: "cycle", passed: true, error: null });
    expect(report[0].actual).toBe("[3, 2, 0, -4] -> cycle@1");
  });

  it("reports an accidental cycle created by an in-place reorder instead of timing out", () => {
    const mission = getCodingCombatMission("reorder-list")!;
    const even = mission.visibleTests.find((test) => test.id === "even")!;
    const report = compileAndRun(
      `public class Solution {
    public void reorderList(ListNode head) {
        ListNode tail = head;
        while (tail.next != null) tail = tail.next;
        tail.next = head;
    }
}
`,
      generateTestMain(mission.java, [even]),
    );
    expect(report[0]).toMatchObject({ id: "even", passed: false, error: null });
    expect(report[0].actual).toContain("cycle@0");
  });
});
