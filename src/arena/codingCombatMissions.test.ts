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
  "merge-intervals": `function mergeIntervals(intervals) {
    if (intervals.length === 0) return [];
    intervals.sort((a, b) => a[0] - b[0]);
    const merged = [intervals[0].slice()];
    for (let index = 1; index < intervals.length; index += 1) {
      const next = intervals[index];
      const active = merged[merged.length - 1];
      if (next[0] <= active[1]) active[1] = Math.max(active[1], next[1]);
      else merged.push(next.slice());
    }
    return merged;
  }`,
  "insert-interval": `function insertInterval(intervals, newInterval) {
    const result = [];
    let index = 0;
    let active = newInterval.slice();
    while (index < intervals.length && intervals[index][1] < active[0]) result.push(intervals[index++].slice());
    while (index < intervals.length && intervals[index][0] <= active[1]) {
      active[0] = Math.min(active[0], intervals[index][0]);
      active[1] = Math.max(active[1], intervals[index][1]);
      index += 1;
    }
    result.push(active);
    while (index < intervals.length) result.push(intervals[index++].slice());
    return result;
  }`,
  "k-closest-points": `function kClosestPoints(points, k) {
    return points
      .slice()
      .sort((a, b) => (a[0] * a[0] + a[1] * a[1]) - (b[0] * b[0] + b[1] * b[1]))
      .slice(0, k)
      .map((point) => point.slice());
  }`,
  "number-of-islands": `function countIslands(grid) {
    if (grid.length === 0 || grid[0].length === 0) return 0;
    const flood = (row, col) => {
      if (row < 0 || row >= grid.length || col < 0 || col >= grid[0].length || grid[row][col] !== 1) return;
      grid[row][col] = 0;
      flood(row + 1, col); flood(row - 1, col); flood(row, col + 1); flood(row, col - 1);
    };
    let count = 0;
    for (let row = 0; row < grid.length; row += 1) {
      for (let col = 0; col < grid[0].length; col += 1) {
        if (grid[row][col] !== 1) continue;
        count += 1;
        flood(row, col);
      }
    }
    return count;
  }`,
  "rotting-oranges": `function minutesUntilRotten(grid) {
    if (grid.length === 0 || grid[0].length === 0) return 0;
    const queue = [];
    let fresh = 0;
    for (let row = 0; row < grid.length; row += 1) {
      for (let col = 0; col < grid[0].length; col += 1) {
        if (grid[row][col] === 2) queue.push([row, col]);
        else if (grid[row][col] === 1) fresh += 1;
      }
    }
    let head = 0;
    let minutes = 0;
    const directions = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    while (head < queue.length && fresh > 0) {
      const levelEnd = queue.length;
      let spread = false;
      while (head < levelEnd) {
        const [row, col] = queue[head++];
        for (const [dr, dc] of directions) {
          const nextRow = row + dr;
          const nextCol = col + dc;
          if (nextRow < 0 || nextRow >= grid.length || nextCol < 0 || nextCol >= grid[0].length || grid[nextRow][nextCol] !== 1) continue;
          grid[nextRow][nextCol] = 2;
          fresh -= 1;
          spread = true;
          queue.push([nextRow, nextCol]);
        }
      }
      if (spread) minutes += 1;
    }
    return fresh === 0 ? minutes : -1;
  }`,
  "unique-paths-obstacles": `function countPathsWithObstacles(grid) {
    if (grid.length === 0 || grid[0].length === 0 || grid[0][0] === 1) return 0;
    const dp = new Array(grid[0].length).fill(0);
    dp[0] = 1;
    for (let row = 0; row < grid.length; row += 1) {
      for (let col = 0; col < grid[0].length; col += 1) {
        if (grid[row][col] === 1) dp[col] = 0;
        else if (col > 0) dp[col] += dp[col - 1];
      }
    }
    return dp[dp.length - 1];
  }`,
  "validate-bst": `function isValidBst(values) {
    const build = (cells) => {
      if (!cells.length || cells[0] === null) return null;
      const root = { val: cells[0], left: null, right: null };
      const queue = [root]; let head = 0; let index = 1;
      while (head < queue.length && index < cells.length) {
        const node = queue[head++];
        if (cells[index] !== null) { node.left = { val: cells[index], left: null, right: null }; queue.push(node.left); }
        index += 1;
        if (index < cells.length && cells[index] !== null) { node.right = { val: cells[index], left: null, right: null }; queue.push(node.right); }
        index += 1;
      }
      return root;
    };
    const visit = (node, low, high) => !node || (node.val > low && node.val < high && visit(node.left, low, node.val) && visit(node.right, node.val, high));
    return visit(build(values), -Infinity, Infinity);
  }`,
  "tree-level-order": `function levelOrder(values) {
    const build = (cells) => {
      if (!cells.length || cells[0] === null) return null;
      const root = { val: cells[0], left: null, right: null };
      const queue = [root]; let head = 0; let index = 1;
      while (head < queue.length && index < cells.length) {
        const node = queue[head++];
        if (cells[index] !== null) { node.left = { val: cells[index], left: null, right: null }; queue.push(node.left); }
        index += 1;
        if (index < cells.length && cells[index] !== null) { node.right = { val: cells[index], left: null, right: null }; queue.push(node.right); }
        index += 1;
      }
      return root;
    };
    const root = build(values); if (!root) return [];
    const queue = [root]; let head = 0; const rows = [];
    while (head < queue.length) {
      const end = queue.length; const row = [];
      while (head < end) { const node = queue[head++]; row.push(node.val); if (node.left) queue.push(node.left); if (node.right) queue.push(node.right); }
      rows.push(row);
    }
    return rows;
  }`,
  "lowest-common-ancestor": `function lowestCommonAncestor(values, p, q) {
    const build = (cells) => {
      if (!cells.length) return null;
      const root = { val: cells[0], left: null, right: null }; const queue = [root]; let head = 0; let index = 1;
      while (head < queue.length && index < cells.length) { const node = queue[head++]; if (cells[index] !== null) { node.left = { val: cells[index], left: null, right: null }; queue.push(node.left); } index += 1; if (index < cells.length && cells[index] !== null) { node.right = { val: cells[index], left: null, right: null }; queue.push(node.right); } index += 1; }
      return root;
    };
    const visit = (node) => { if (!node || node.val === p || node.val === q) return node; const left = visit(node.left); const right = visit(node.right); return left && right ? node : left || right; };
    return visit(build(values)).val;
  }`,
  "path-sum-tree": `function hasPathSum(values, target) {
    const build = (cells) => {
      if (!cells.length) return null;
      const root = { val: cells[0], left: null, right: null }; const queue = [root]; let head = 0; let index = 1;
      while (head < queue.length && index < cells.length) { const node = queue[head++]; if (cells[index] !== null) { node.left = { val: cells[index], left: null, right: null }; queue.push(node.left); } index += 1; if (index < cells.length && cells[index] !== null) { node.right = { val: cells[index], left: null, right: null }; queue.push(node.right); } index += 1; }
      return root;
    };
    const visit = (node, remaining) => !!node && (!node.left && !node.right ? node.val === remaining : visit(node.left, remaining - node.val) || visit(node.right, remaining - node.val));
    return visit(build(values), target);
  }`,
  "distance-k-tree": `function nodesAtDistanceK(values, targetValue, k) {
    if (!values.length) return [];
    const root = { val: values[0], left: null, right: null, parent: null }; const buildQueue = [root]; let buildHead = 0; let index = 1; let target = root.val === targetValue ? root : null;
    while (buildHead < buildQueue.length && index < values.length) { const node = buildQueue[buildHead++]; if (values[index] !== null) { node.left = { val: values[index], left: null, right: null, parent: node }; buildQueue.push(node.left); if (node.left.val === targetValue) target = node.left; } index += 1; if (index < values.length && values[index] !== null) { node.right = { val: values[index], left: null, right: null, parent: node }; buildQueue.push(node.right); if (node.right.val === targetValue) target = node.right; } index += 1; }
    let queue = [target]; const seen = new Set([target]);
    for (let distance = 0; distance < k && queue.length; distance += 1) { const next = []; for (const node of queue) for (const neighbor of [node.left, node.right, node.parent]) if (neighbor && !seen.has(neighbor)) { seen.add(neighbor); next.push(neighbor); } queue = next; }
    return queue.map((node) => node.val);
  }`,
  "reorder-list": `function reorderList(values) {
    const result = []; let left = 0; let right = values.length - 1;
    while (left <= right) { result.push(values[left++]); if (left <= right) result.push(values[right--]); }
    return result;
  }`,
  "reverse-linked-list": `function reverseList(values) {
    return values.slice().reverse();
  }`,
  "linked-list-cycle": `function hasCycle(serialized) {
    return !Array.isArray(serialized) && serialized.cycleAt >= 0;
  }`,
};

describe("Coding Combat mission pack", () => {
  it("has stable IDs, executable contracts, hidden coverage, and exactly one defensible answer", () => {
    expect(CODING_COMBAT_MISSIONS).toHaveLength(20);
    expect(CODING_COMBAT_MISSIONS.map((mission) => mission.id)).toEqual([
      "target-pair",
      "unique-window",
      "shortest-hop",
      "pair-sum-map",
      "rotated-search",
      "balanced-brackets",
      "merge-intervals",
      "insert-interval",
      "k-closest-points",
      "number-of-islands",
      "rotting-oranges",
      "unique-paths-obstacles",
      "validate-bst",
      "tree-level-order",
      "lowest-common-ancestor",
      "path-sum-tree",
      "distance-k-tree",
      "reorder-list",
      "reverse-linked-list",
      "linked-list-cycle",
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
