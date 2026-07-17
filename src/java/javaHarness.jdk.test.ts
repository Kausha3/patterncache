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
});
