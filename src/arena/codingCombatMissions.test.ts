import { describe, expect, it } from "vitest";
import { CODING_COMBAT_MISSIONS } from "./codingCombatMissions";
import { evaluateCodingCombatLocally } from "./codingCombatEngine";

const REFERENCE_SOLUTIONS: Record<string, string> = {
  "target-pair": `function findTargetPair(nums, target) {
    let left = 0;
    let right = nums.length - 1;
    while (left < right) {
      const sum = nums[left] + nums[right];
      if (sum === target) return [left, right];
      if (sum < target) left += 1;
      else right -= 1;
    }
    return [-1, -1];
  }`,
  "unique-window": `function longestUniqueRun(text) {
    const lastSeen = new Map();
    let left = 0;
    let best = 0;
    for (let right = 0; right < text.length; right += 1) {
      const character = text[right];
      if (lastSeen.has(character)) left = Math.max(left, lastSeen.get(character) + 1);
      lastSeen.set(character, right);
      best = Math.max(best, right - left + 1);
    }
    return best;
  }`,
  "shortest-hop": `function shortestHopCount(graph, start, end) {
    if (start === end) return 0;
    const queue = [[start, 0]];
    const visited = new Set([start]);
    let head = 0;
    while (head < queue.length) {
      const [node, distance] = queue[head++];
      for (const neighbor of graph[node] || []) {
        if (visited.has(neighbor)) continue;
        if (neighbor === end) return distance + 1;
        visited.add(neighbor);
        queue.push([neighbor, distance + 1]);
      }
    }
    return -1;
  }`,
  "pair-sum-map": `function findPairIndices(nums, target) {
    const seen = new Map();
    for (let index = 0; index < nums.length; index += 1) {
      const need = target - nums[index];
      if (seen.has(need)) return [seen.get(need), index];
      seen.set(nums[index], index);
    }
    return [-1, -1];
  }`,
  "rotated-search": `function findInRotated(nums, target) {
    let low = 0;
    let high = nums.length - 1;
    while (low <= high) {
      const mid = low + Math.floor((high - low) / 2);
      if (nums[mid] === target) return mid;
      if (nums[low] <= nums[mid]) {
        if (nums[low] <= target && target < nums[mid]) high = mid - 1;
        else low = mid + 1;
      } else {
        if (nums[mid] < target && target <= nums[high]) low = mid + 1;
        else high = mid - 1;
      }
    }
    return -1;
  }`,
  "balanced-brackets": `function isBalanced(text) {
    const openerFor = { ")": "(", "]": "[", "}": "{" };
    const stack = [];
    for (const character of text) {
      if (character === "(" || character === "[" || character === "{") stack.push(character);
      else if (stack.pop() !== openerFor[character]) return false;
    }
    return stack.length === 0;
  }`,
};

describe("Coding Combat mission pack", () => {
  it("has stable IDs, executable contracts, hidden coverage, and exactly one defensible answer", () => {
    expect(CODING_COMBAT_MISSIONS).toHaveLength(6);
    expect(CODING_COMBAT_MISSIONS.map((mission) => mission.id)).toEqual([
      "target-pair",
      "unique-window",
      "shortest-hop",
      "pair-sum-map",
      "rotated-search",
      "balanced-brackets",
    ]);
    expect(new Set(CODING_COMBAT_MISSIONS.map((mission) => mission.id)).size).toBe(CODING_COMBAT_MISSIONS.length);

    for (const mission of CODING_COMBAT_MISSIONS) {
      expect(mission.functionName).toMatch(/^[A-Za-z_$][\w$]*$/);
      expect(mission.visibleTests.length).toBeGreaterThanOrEqual(3);
      expect(mission.hiddenTests.length).toBeGreaterThanOrEqual(4);
      expect(mission.hints).toHaveLength(3);
      expect(mission.defense).toHaveLength(3);
      const testIds = [...mission.visibleTests, ...mission.hiddenTests].map((test) => test.id);
      expect(new Set(testIds).size).toBe(testIds.length);
      for (const question of mission.defense) {
        expect(question.options.filter((option) => option.correct)).toHaveLength(1);
        expect(question.options.length).toBeGreaterThanOrEqual(3);
      }
    }
  });

  it("accepts a known-correct implementation for every visible and hidden case", async () => {
    for (const mission of CODING_COMBAT_MISSIONS) {
      const tests = [
        ...mission.visibleTests.map((test) => ({ ...test, hidden: false })),
        ...mission.hiddenTests.map((test) => ({ ...test, hidden: true })),
      ];
      const result = await evaluateCodingCombatLocally(REFERENCE_SOLUTIONS[mission.id], mission.functionName, tests);
      expect(result.fatalError, mission.id).toBeUndefined();
      expect(result.results, mission.id).toHaveLength(tests.length);
      expect(result.passed, mission.id).toBe(true);
    }
  });

  it("uses hidden cases that catch a plausible sliding-window boundary regression", async () => {
    const mission = CODING_COMBAT_MISSIONS.find((candidate) => candidate.id === "unique-window")!;
    const buggy = `function longestUniqueRun(text) {
      const lastSeen = new Map();
      let left = 0;
      let best = 0;
      for (let right = 0; right < text.length; right += 1) {
        const character = text[right];
        if (lastSeen.has(character)) left = lastSeen.get(character) + 1;
        lastSeen.set(character, right);
        best = Math.max(best, right - left + 1);
      }
      return best;
    }`;
    const visible = await evaluateCodingCombatLocally(
      buggy,
      mission.functionName,
      mission.visibleTests.map((test) => ({ ...test, hidden: false })),
    );
    const complete = await evaluateCodingCombatLocally(
      buggy,
      mission.functionName,
      [...mission.visibleTests.map((test) => ({ ...test, hidden: false })), ...mission.hiddenTests.map((test) => ({ ...test, hidden: true }))],
    );

    expect(visible.passed).toBe(true);
    expect(complete.passed).toBe(false);
    expect(complete.results.find((result) => result.id === "boundary-regression")?.passed).toBe(false);
  });
});
