import type { CodingCombatDefenseQuestion, CodingCombatMission } from "./codingCombatMissions";

interface DefensePrompt {
  prompt: string;
  correct: string;
  correctFeedback: string;
  wrong: [string, string];
}

function buildDefense(
  id: string,
  invariant: DefensePrompt,
  complexity: DefensePrompt,
  counterexample: DefensePrompt,
): CodingCombatDefenseQuestion[] {
  return [
    { id: `${id}-invariant`, category: "invariant", ...questionOptions(invariant) },
    { id: `${id}-complexity`, category: "complexity", ...questionOptions(complexity) },
    { id: `${id}-counterexample`, category: "counterexample", ...questionOptions(counterexample) },
  ];
}

function questionOptions(copy: DefensePrompt): Pick<CodingCombatDefenseQuestion, "prompt" | "options"> {
  return {
    prompt: copy.prompt,
    options: [
      { id: "correct", label: copy.correct, correct: true, feedback: copy.correctFeedback },
      { id: "wrong-a", label: copy.wrong[0], correct: false, feedback: "That rule does not preserve the condition the algorithm depends on." },
      { id: "wrong-b", label: copy.wrong[1], correct: false, feedback: "That may sound plausible, but it does not prove this algorithm correct." },
    ],
  };
}

export const CODING_COMBAT_WAVE_TWO_MISSIONS: CodingCombatMission[] = [
  {
    id: "validate-bst",
    title: "BST Boundary Patrol",
    signal: "binary search tree · ancestor bounds · strict ordering",
    difficulty: "Interview",
    minutes: 25,
    functionName: "isValidBst",
    signature: "isValidBst(root) → boolean",
    prompt: "Return true only when every node is strictly greater than every value in its left subtree and strictly smaller than every value in its right subtree.",
    constraints: [
      "The empty tree is valid.",
      "Duplicate values make the tree invalid.",
      "A node must obey every ancestor boundary, not only its parent.",
    ],
    examples: [
      { input: "root = [2, 1, 3]", output: "true", why: "Both children obey the root boundary" },
      { input: "root = [5, 1, 4, null, null, 3, 6]", output: "false", why: "3 appears inside 5's right subtree" },
    ],
    starterCode: `function isValidBst(root) {
  return true;
}`,
    java: {
      methodName: "isValidBst",
      signature: "public boolean isValidBst(TreeNode root)",
      argTypes: ["TreeNode"],
      returnType: "boolean",
      starterCode: `public class Solution {
    public boolean isValidBst(TreeNode root) {
        // Carry every ancestor's legal range down the tree.
        return true;
    }
}
`,
    },
    visibleTests: [
      { id: "small-valid", label: "small valid BST", args: [[2, 1, 3]], expected: true },
      { id: "ancestor-violation", label: "violation against an ancestor", args: [[5, 1, 4, null, null, 3, 6]], expected: false },
      { id: "empty-tree", label: "empty tree", args: [[]], expected: true },
    ],
    hiddenTests: [
      { id: "duplicate", label: "duplicate child", args: [[2, 2, 3]], expected: false },
      { id: "deep-bound", label: "deep value crosses the root bound", args: [[5, 4, 6, null, null, 3, 7]], expected: false },
      { id: "maximum-int", label: "maximum integer as a valid leaf", args: [[2147483647]], expected: true },
      { id: "full-int-range", label: "both integer extremes", args: [[0, -2147483648, 2147483647]], expected: true },
    ],
    hints: [
      "Checking only node.left.val and node.right.val misses violations deeper in a subtree.",
      "Pass a lower and upper boundary into each recursive call; the current node must sit strictly between them.",
      "Use long boundaries or nullable bounds so Integer.MIN_VALUE and Integer.MAX_VALUE remain legal node values.",
    ],
    defense: buildDefense("bst", {
      prompt: "What must be true when validation enters a node?",
      correct: "Its value must be strictly inside the complete range inherited from all ancestors",
      correctFeedback: "Correct. The inherited range captures facts that a parent-only comparison forgets.",
      wrong: ["It only needs to be ordered against its direct parent", "Every leaf must be smaller than the root"],
    }, {
      prompt: "What is the tight complexity for visiting each node once?",
      correct: "O(n) time and O(h) call-stack space",
      correctFeedback: "Correct. Every node is checked once and recursion holds at most one root-to-leaf path.",
      wrong: ["O(log n) time for every binary tree", "O(n squared) time because two bounds are carried"],
    }, {
      prompt: "Which tree defeats a checker that compares only parent and child?",
      correct: "[5, 4, 6, null, null, 3, 7]",
      correctFeedback: "Correct. Node 3 is smaller than its parent 6 but illegally lives in root 5's right subtree.",
      wrong: ["[2, 1, 3]", "[1]"],
    }),
  },
  {
    id: "tree-level-order",
    title: "Tree Level Scanner",
    signal: "binary tree · breadth first · level boundaries",
    difficulty: "Warm-up",
    minutes: 25,
    functionName: "levelOrder",
    signature: "levelOrder(root) → number[][]",
    prompt: "Return the tree values grouped by depth from top to bottom, preserving left-to-right order inside each level.",
    constraints: [
      "Return an empty matrix for an empty tree.",
      "Create exactly one output row for each depth.",
      "Do not mix nodes added for the next level into the current row.",
    ],
    examples: [
      { input: "root = [3, 9, 20, null, null, 15, 7]", output: "[[3], [9, 20], [15, 7]]", why: "Each row contains one queue layer" },
    ],
    starterCode: `function levelOrder(root) {
  return [];
}`,
    java: {
      methodName: "levelOrder",
      signature: "public int[][] levelOrder(TreeNode root)",
      argTypes: ["TreeNode"],
      returnType: "int[][]",
      starterCode: `public class Solution {
    public int[][] levelOrder(TreeNode root) {
        // Freeze the queue size before consuming each level.
        return new int[0][0];
    }
}
`,
    },
    visibleTests: [
      { id: "three-levels", label: "balanced three-level tree", args: [[3, 9, 20, null, null, 15, 7]], expected: [[3], [9, 20], [15, 7]] },
      { id: "single-node", label: "single node", args: [[1]], expected: [[1]] },
      { id: "empty-tree", label: "empty tree", args: [[]], expected: [] },
    ],
    hiddenTests: [
      { id: "right-chain", label: "right-skewed tree", args: [[1, null, 2, null, 3]], expected: [[1], [2], [3]] },
      { id: "ragged", label: "missing children on opposite sides", args: [[1, 2, 3, 4, null, null, 5]], expected: [[1], [2, 3], [4, 5]] },
      { id: "negative-values", label: "negative values", args: [[0, -2, -1]], expected: [[0], [-2, -1]] },
      { id: "wide-level", label: "complete bottom level", args: [[1, 2, 3, 4, 5, 6, 7]], expected: [[1], [2, 3], [4, 5, 6, 7]] },
    ],
    hints: [
      "A queue naturally visits nodes in increasing depth.",
      "At the start of a level, save queue.size(). Consume exactly that many nodes into one row.",
      "Enqueue non-null left and right children while consuming, but leave them for the next outer iteration.",
    ],
    defense: buildDefense("level", {
      prompt: "What does the saved queue size represent?",
      correct: "Exactly the number of nodes at the level currently being emitted",
      correctFeedback: "Correct. New children can enter the queue without leaking into the current row.",
      wrong: ["The total number of nodes remaining in the tree", "The maximum width of the whole tree"],
    }, {
      prompt: "What complexity does queue-based level order achieve?",
      correct: "O(n) time and O(w) queue space, where w is maximum width",
      correctFeedback: "Correct. Every node enters and leaves the queue once.",
      wrong: ["O(h) time because there are h levels", "O(n squared) time because rows are nested"],
    }, {
      prompt: "What breaks if the loop uses the changing queue size directly?",
      correct: "Children added during the loop can be consumed into their parent's row",
      correctFeedback: "Correct. Freezing the size creates a hard boundary between depths.",
      wrong: ["The root is always skipped", "Right children are always processed before left children"],
    }),
  },
  {
    id: "lowest-common-ancestor",
    title: "Ancestor Signal Relay",
    signal: "binary tree · recursive signals · split point",
    difficulty: "Interview",
    minutes: 30,
    functionName: "lowestCommonAncestor",
    signature: "lowestCommonAncestor(root, p, q) → TreeNode",
    prompt: "Return the lowest node whose subtree contains both target nodes. Node values are unique and both targets exist.",
    constraints: [
      "A target node may be its own ancestor.",
      "Do not rely on binary-search-tree ordering.",
      "The Java method returns the actual TreeNode; the test report shows its value.",
    ],
    examples: [
      { input: "root = [3,5,1,6,2,0,8,null,null,7,4], p = 5, q = 1", output: "node 3", why: "The targets split across the root" },
    ],
    starterCode: `function lowestCommonAncestor(root, p, q) {
  return null;
}`,
    java: {
      methodName: "lowestCommonAncestor",
      signature: "public TreeNode lowestCommonAncestor(TreeNode root, int p, int q)",
      argTypes: ["TreeNode", "int", "int"],
      methodReturnType: "TreeNode",
      resultProperty: "val",
      returnType: "int",
      starterCode: `public class Solution {
    public TreeNode lowestCommonAncestor(TreeNode root, int p, int q) {
        // Return a signal from each subtree; the first split is the answer.
        return root;
    }
}
`,
    },
    visibleTests: [
      { id: "split-at-root", label: "targets split at root", args: [[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 5, 1], expected: 3 },
      { id: "ancestor-is-target", label: "one target contains the other", args: [[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 5, 4], expected: 5 },
      { id: "small-tree", label: "two children under root", args: [[1, 2, 3], 2, 3], expected: 1 },
    ],
    hiddenTests: [
      { id: "deep-siblings", label: "deep siblings", args: [[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 7, 4], expected: 2 },
      { id: "same-target", label: "same target twice", args: [[1, 2, 3], 2, 2], expected: 2 },
      { id: "one-sided", label: "targets in a skewed branch", args: [[1, 2, null, 3, null, 4], 3, 4], expected: 3 },
      { id: "negative-values", label: "negative node values", args: [[0, -3, 9, -4, -2], -4, -2], expected: -3 },
    ],
    hints: [
      "Let null mean neither target found, and let a target node return itself.",
      "Ask the left and right subtrees for their signals. If both are non-null, the current node is the split point.",
      "If only one side reports a node, pass that node upward unchanged.",
    ],
    defense: buildDefense("lca", {
      prompt: "What does a non-null recursive return mean?",
      correct: "This subtree contains a target or already contains the lowest split point",
      correctFeedback: "Correct. That single signal is enough for the parent to detect a split.",
      wrong: ["Both targets were always found below that return", "The returned node has the smaller target value"],
    }, {
      prompt: "What is the worst-case complexity?",
      correct: "O(n) time and O(h) call-stack space",
      correctFeedback: "Correct. A non-BST tree may require visiting every node.",
      wrong: ["O(log n) time because the input is a tree", "O(1) space because recursion is implicit"],
    }, {
      prompt: "Why must a target node be returned immediately?",
      correct: "It allows that target to be the answer when the other target lies inside its subtree",
      correctFeedback: "Correct. A node is an ancestor of itself in this problem.",
      wrong: ["Target nodes never have children", "It keeps the traversal in sorted order"],
    }),
  },
  {
    id: "path-sum-tree",
    title: "Root-to-Leaf Fuel Check",
    signal: "binary tree · root-to-leaf · remaining target",
    difficulty: "Warm-up",
    minutes: 20,
    functionName: "hasPathSum",
    signature: "hasPathSum(root, target) → boolean",
    prompt: "Return true when some root-to-leaf path has values summing exactly to target.",
    constraints: [
      "A valid path must end at a leaf, not at an internal node.",
      "Node values and target may be negative.",
      "An empty tree has no root-to-leaf path.",
    ],
    examples: [
      { input: "root = [5,4,8,11,null,13,4,7,2,null,null,null,1], target = 22", output: "true", why: "5 + 4 + 11 + 2 = 22" },
    ],
    starterCode: `function hasPathSum(root, target) {
  return false;
}`,
    java: {
      methodName: "hasPathSum",
      signature: "public boolean hasPathSum(TreeNode root, int target)",
      argTypes: ["TreeNode", "int"],
      returnType: "boolean",
      starterCode: `public class Solution {
    public boolean hasPathSum(TreeNode root, int target) {
        // Reduce the remaining target and accept only at a leaf.
        return false;
    }
}
`,
    },
    visibleTests: [
      { id: "classic-path", label: "classic path exists", args: [[5, 4, 8, 11, null, 13, 4, 7, 2, null, null, null, 1], 22], expected: true },
      { id: "no-path", label: "sum is unavailable", args: [[1, 2, 3], 5], expected: false },
      { id: "empty-tree", label: "empty tree", args: [[], 0], expected: false },
    ],
    hiddenTests: [
      { id: "internal-match", label: "target matches before a leaf", args: [[1, 2], 1], expected: false },
      { id: "negative-path", label: "negative values", args: [[-2, null, -3], -5], expected: true },
      { id: "single-match", label: "single-node path matches", args: [[7], 7], expected: true },
      { id: "zero-miss", label: "zero target without zero-sum leaf", args: [[1, -1, null, 2], 0], expected: false },
    ],
    hints: [
      "Subtract the current node value from the remaining target.",
      "At a leaf, compare the remaining target directly with the leaf value.",
      "For an internal node, recurse left or right and combine with OR.",
    ],
    defense: buildDefense("path", {
      prompt: "When is target equality sufficient to return true?",
      correct: "Only when the current node is a leaf and its value equals the remaining target",
      correctFeedback: "Correct. Root-to-leaf is part of the contract, not an implementation detail.",
      wrong: ["At any node where the running sum matches", "Only when both children also match"],
    }, {
      prompt: "What is the worst-case complexity?",
      correct: "O(n) time and O(h) call-stack space",
      correctFeedback: "Correct. A missing path can force inspection of every node.",
      wrong: ["O(target) time", "O(1) space for every tree"],
    }, {
      prompt: "Which case catches an early internal-node success bug?",
      correct: "root = [1, 2], target = 1",
      correctFeedback: "Correct. The root matches 1 but is not a leaf.",
      wrong: ["root = [7], target = 7", "root = [], target = 0"],
    }),
  },
  {
    id: "distance-k-tree",
    title: "K-Hop Tree Beacon",
    signal: "tree as graph · parent links · exact BFS layer",
    difficulty: "Bar raiser",
    minutes: 35,
    functionName: "nodesAtDistanceK",
    signature: "nodesAtDistanceK(root, targetValue, k) → number[]",
    prompt: "Return the values of all nodes exactly k edges from the unique target node. Result order does not matter.",
    constraints: [
      "Node values are unique and the target exists in a non-empty tree.",
      "Movement may go left, right, or upward to a parent.",
      "Never revisit a node after converting the tree into an undirected search space.",
    ],
    examples: [
      { input: "root = [3,5,1,6,2,0,8,null,null,7,4], target = 5, k = 2", output: "[7, 4, 1]", why: "Those nodes are two edges from node 5" },
    ],
    starterCode: `function nodesAtDistanceK(root, targetValue, k) {
  return [];
}`,
    java: {
      methodName: "nodesAtDistanceK",
      signature: "public int[] nodesAtDistanceK(TreeNode root, int targetValue, int k)",
      argTypes: ["TreeNode", "int", "int"],
      returnType: "int[]",
      comparison: "unordered-elements",
      starterCode: `public class Solution {
    public int[] nodesAtDistanceK(TreeNode root, int targetValue, int k) {
        // Record parents, find the target, then expand exactly k BFS layers.
        return new int[0];
    }
}
`,
    },
    visibleTests: [
      { id: "classic", label: "nodes in three directions", args: [[3, 5, 1, 6, 2, 0, 8, null, null, 7, 4], 5, 2], expected: [7, 4, 1] },
      { id: "zero-distance", label: "distance zero", args: [[1, 2, 3], 2, 0], expected: [2] },
      { id: "beyond-height", label: "distance beyond every node", args: [[1, 2, 3], 2, 5], expected: [] },
    ],
    hiddenTests: [
      { id: "from-root", label: "one layer from root", args: [[1, 2, 3, 4, 5], 1, 1], expected: [2, 3] },
      { id: "up-and-down", label: "cross through parent", args: [[1, 2, 3, 4, 5, 6, 7], 4, 3], expected: [3] },
      { id: "single-node", label: "single node at zero", args: [[9], 9, 0], expected: [9] },
      { id: "one-sided", label: "skewed tree exact layer", args: [[1, null, 2, null, 3, null, 4], 3, 2], expected: [1] },
    ],
    hints: [
      "A TreeNode has no parent pointer, so first traverse once to map each child to its parent and locate the target.",
      "From the target, BFS over left, right, and parent while marking nodes visited when enqueued.",
      "After exactly k layer expansions, every node left in the queue is an answer.",
    ],
    defense: buildDefense("distance", {
      prompt: "Why is a visited set required after parent links are added?",
      correct: "Each parent-child edge can now be crossed both ways, which creates immediate cycles",
      correctFeedback: "Correct. Without visited, child to parent to child repeats forever.",
      wrong: ["Tree values may be duplicated", "BFS cannot process binary trees without sorting"],
    }, {
      prompt: "What is the total complexity including parent-map construction?",
      correct: "O(n) time and O(n) extra space",
      correctFeedback: "Correct. Parent and visited maps can each contain every node.",
      wrong: ["O(k) time because only k layers matter", "O(log n) space because the input is binary"],
    }, {
      prompt: "What does a downward-only traversal miss for target 5 at distance 2 in the example?",
      correct: "Node 1, reached by moving from 5 up to 3 and down to 1",
      correctFeedback: "Correct. Distance is measured in the undirected tree, not only inside the target subtree.",
      wrong: ["Node 7", "Node 4"],
    }),
  },
  {
    id: "reorder-list",
    title: "Linked List Interleave",
    signal: "linked list · midpoint · reverse · in-place merge",
    difficulty: "Interview",
    minutes: 35,
    functionName: "reorderList",
    signature: "reorderList(head) → mutates head in place",
    prompt: "Reorder L0 → L1 → ... → Ln into L0 → Ln → L1 → Ln-1 → ... without changing node values or allocating replacement nodes.",
    constraints: [
      "The Java method returns void; the harness inspects the mutated head.",
      "Reuse the original nodes and keep the final list acyclic.",
      "Handle both even and odd lengths.",
    ],
    examples: [
      { input: "[1, 2, 3, 4]", output: "[1, 4, 2, 3]", why: "Take alternately from the front and reversed back half" },
      { input: "[1, 2, 3, 4, 5]", output: "[1, 5, 2, 4, 3]", why: "The middle node remains last" },
    ],
    starterCode: `function reorderList(values) {
  return values;
}`,
    java: {
      methodName: "reorderList",
      signature: "public void reorderList(ListNode head)",
      argTypes: ["ListNode"],
      methodReturnType: "void",
      resultFromArg: 0,
      returnType: "ListNode",
      starterCode: `public class Solution {
    public void reorderList(ListNode head) {
        // Find the middle, reverse the second half, then weave both halves.
    }
}
`,
    },
    visibleTests: [
      { id: "even", label: "even number of nodes", args: [[1, 2, 3, 4]], expected: [1, 4, 2, 3] },
      { id: "odd", label: "odd number of nodes", args: [[1, 2, 3, 4, 5]], expected: [1, 5, 2, 4, 3] },
      { id: "empty", label: "empty list", args: [[]], expected: [] },
    ],
    hiddenTests: [
      { id: "single", label: "single node", args: [[1]], expected: [1] },
      { id: "two", label: "two nodes", args: [[1, 2]], expected: [1, 2] },
      { id: "six", label: "long even list", args: [[1, 2, 3, 4, 5, 6]], expected: [1, 6, 2, 5, 3, 4] },
      { id: "duplicates", label: "duplicate values prove identity is not value-based", args: [[7, 7, 8, 8, 9]], expected: [7, 9, 7, 8, 8] },
    ],
    hints: [
      "Use slow and fast pointers to split around the middle, then detach the first half from the second.",
      "Reverse the second half with the standard prev, current, next pointer loop.",
      "Weave by saving both next pointers before rewiring; stop when the reversed half is exhausted.",
    ],
    defense: buildDefense("reorder", {
      prompt: "Why should the list be split before merging?",
      correct: "Detaching prevents old next links from forming a cycle while the two halves are woven",
      correctFeedback: "Correct. In-place pointer work must deliberately retire obsolete edges.",
      wrong: ["It sorts the two halves by value", "It makes every node immutable"],
    }, {
      prompt: "What is the target complexity?",
      correct: "O(n) time and O(1) extra space",
      correctFeedback: "Correct. A constant number of pointers performs three linear passes.",
      wrong: ["O(n) time and O(n) space for a replacement list", "O(n squared) time because nodes alternate"],
    }, {
      prompt: "Which input most directly exposes an incorrect middle or merge stop condition?",
      correct: "[1, 2, 3, 4, 5]",
      correctFeedback: "Correct. Odd length forces the middle node to appear exactly once at the end.",
      wrong: ["[]", "[1, 2]"],
    }),
  },
  {
    id: "reverse-linked-list",
    title: "Pointer Reversal Drill",
    signal: "linked list · pointer ownership · constant space",
    difficulty: "Warm-up",
    minutes: 20,
    functionName: "reverseList",
    signature: "reverseList(head) → ListNode",
    prompt: "Reverse a singly linked list in place and return its new head.",
    constraints: [
      "Do not allocate replacement list nodes.",
      "The old head must become the tail with next set to null.",
      "Use O(1) extra space.",
    ],
    examples: [
      { input: "[1, 2, 3, 4, 5]", output: "[5, 4, 3, 2, 1]", why: "Every next edge points in the opposite direction" },
    ],
    starterCode: `function reverseList(values) {
  return values;
}`,
    java: {
      methodName: "reverseList",
      signature: "public ListNode reverseList(ListNode head)",
      argTypes: ["ListNode"],
      returnType: "ListNode",
      starterCode: `public class Solution {
    public ListNode reverseList(ListNode head) {
        // Save the next node before redirecting the current edge.
        return head;
    }
}
`,
    },
    visibleTests: [
      { id: "five", label: "five nodes", args: [[1, 2, 3, 4, 5]], expected: [5, 4, 3, 2, 1] },
      { id: "empty", label: "empty list", args: [[]], expected: [] },
      { id: "single", label: "single node", args: [[9]], expected: [9] },
    ],
    hiddenTests: [
      { id: "two", label: "two nodes", args: [[1, 2]], expected: [2, 1] },
      { id: "negative", label: "negative values", args: [[-1, -2, 3]], expected: [3, -2, -1] },
      { id: "duplicates", label: "duplicate values", args: [[4, 4, 4]], expected: [4, 4, 4] },
      { id: "longer", label: "longer pointer chain", args: [[1, 2, 3, 4, 5, 6, 7]], expected: [7, 6, 5, 4, 3, 2, 1] },
    ],
    hints: [
      "Maintain prev for the already-reversed prefix and current for the unprocessed suffix.",
      "Before changing current.next, save it in next; otherwise the rest of the list becomes unreachable.",
      "Move prev and current forward. When current is null, prev is the new head.",
    ],
    defense: buildDefense("reverse", {
      prompt: "What does prev represent during the loop?",
      correct: "The head of a completely reversed prefix",
      correctFeedback: "Correct. current still heads the untouched suffix.",
      wrong: ["The final tail only after the loop", "A copy of every processed node"],
    }, {
      prompt: "What is the iterative complexity?",
      correct: "O(n) time and O(1) extra space",
      correctFeedback: "Correct. Every edge is redirected once using three pointers.",
      wrong: ["O(n) extra space because prev grows", "O(log n) time because links skip indexes"],
    }, {
      prompt: "What happens if current.next is overwritten before its old value is saved?",
      correct: "The unprocessed suffix becomes unreachable",
      correctFeedback: "Correct. The only pointer to the next node is destroyed.",
      wrong: ["The values become sorted", "Only the final two nodes are exchanged"],
    }),
  },
  {
    id: "linked-list-cycle",
    title: "Cycle Radar",
    signal: "linked list · fast and slow pointers · relative speed",
    difficulty: "Warm-up",
    minutes: 20,
    functionName: "hasCycle",
    signature: "hasCycle(head) → boolean",
    prompt: "Return true if following next pointers eventually revisits a node. The harness can build lists whose tail points back to an earlier node.",
    constraints: [
      "Use O(1) extra space.",
      "Compare node identity, not node values.",
      "Handle empty, single-node, and self-cycling lists.",
    ],
    examples: [
      { input: "values = [3, 2, 0, -4], tail connects to index 1", output: "true", why: "The traversal repeats node 2" },
      { input: "values = [1, 2, 3], no connection", output: "false", why: "Traversal reaches null" },
    ],
    starterCode: `function hasCycle(list) {
  return false;
}`,
    java: {
      methodName: "hasCycle",
      signature: "public boolean hasCycle(ListNode head)",
      argTypes: ["ListNode"],
      returnType: "boolean",
      starterCode: `public class Solution {
    public boolean hasCycle(ListNode head) {
        // Move one pointer once and the other twice until they meet or escape.
        return false;
    }
}
`,
    },
    visibleTests: [
      { id: "cycle-in-middle", label: "tail connects into middle", args: [{ values: [3, 2, 0, -4], cycleAt: 1 }], expected: true },
      { id: "two-node-cycle", label: "tail connects to head", args: [{ values: [1, 2], cycleAt: 0 }], expected: true },
      { id: "empty", label: "empty list", args: [[]], expected: false },
    ],
    hiddenTests: [
      { id: "self-cycle", label: "single node points to itself", args: [{ values: [1], cycleAt: 0 }], expected: true },
      { id: "acyclic", label: "ordinary three-node list", args: [[1, 2, 3]], expected: false },
      { id: "tail-self-cycle", label: "tail points to itself", args: [{ values: [1, 2, 3, 4], cycleAt: 3 }], expected: true },
      { id: "single-no-cycle", label: "single node ends at null", args: [[7]], expected: false },
    ],
    hints: [
      "Start slow and fast at head. On each round, move slow once and fast twice.",
      "If fast or fast.next becomes null, the list ends and cannot contain a cycle.",
      "Inside a cycle the faster pointer gains one node per round, so it must eventually meet slow.",
    ],
    defense: buildDefense("cycle", {
      prompt: "Why does pointer equality prove a cycle?",
      correct: "Two forward-only pointers moving at different speeds can meet again only after nodes repeat",
      correctFeedback: "Correct. In an acyclic list, fast reaches null before any reunion.",
      wrong: ["Equal node values always mean the same node", "Fast eventually becomes slower than slow"],
    }, {
      prompt: "What is Floyd's cycle-detection complexity?",
      correct: "O(n) time and O(1) extra space",
      correctFeedback: "Correct. No visited set is required.",
      wrong: ["O(n) time and O(n) space for remembered nodes", "O(n squared) time because fast wraps around"],
    }, {
      prompt: "Which case fails if the loop requires fast.next.next before checking fast.next?",
      correct: "A one-node or other short acyclic list can throw a null-pointer exception",
      correctFeedback: "Correct. Guard fast and fast.next before advancing two edges.",
      wrong: ["Only lists with duplicate values", "Only cycles that begin at the head"],
    }),
  },
];
