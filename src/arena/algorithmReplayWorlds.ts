import type { CodingCombatMissionId } from "@/arena/types";
import { color } from "@/theme/tokens";

export interface AlgorithmReplayFrame {
  title: string;
  explanation: string;
  activeIndexes: number[];
  memory: string[];
  output: string[];
  work: number;
}

export interface AlgorithmReplayScenario {
  label: string;
  input: string[];
  frames: AlgorithmReplayFrame[];
}

export interface AlgorithmReplayWorld {
  id: string;
  missionId: CodingCombatMissionId;
  family: string;
  title: string;
  problemName: string;
  accent: string;
  recognitionSignal: string;
  naiveFailure: string;
  naiveWork: string;
  efficientWork: string;
  invariant: string;
  canonical: AlgorithmReplayScenario;
  variant: AlgorithmReplayScenario;
  transferPrompt: string;
  defenseSignals: string[];
}

const frame = (title: string, explanation: string, activeIndexes: number[], memory: string[], output: string[], work: number): AlgorithmReplayFrame => ({ title, explanation, activeIndexes, memory, output, work });

export const ALGORITHM_REPLAY_WORLDS: AlgorithmReplayWorld[] = [
  {
    id: "prefix-suffix",
    missionId: "product-except-self",
    family: "Prefix and suffix state",
    title: "Assembly Line Memory",
    problemName: "Product of Array Except Self",
    accent: color.teal,
    recognitionSignal: "Each answer needs everything on its left and everything on its right, while one index must be excluded.",
    naiveFailure: "Rebuilding the product for every index repeats almost the entire scan and grows quadratically.",
    naiveWork: "n separate scans",
    efficientWork: "2 linear passes",
    invariant: "Before index i in the first pass, output[i] equals the product strictly to its left. The reverse pass multiplies only the product strictly to its right.",
    canonical: { label: "No zeros", input: ["1", "2", "3", "4"], frames: [
      frame("Seed the left product", "Nothing exists to the left of index 0, so its left product is 1.", [0], ["left = 1"], ["1", "·", "·", "·"], 1),
      frame("Carry left state", "Write the product before consuming the current value.", [1], ["left = 1"], ["1", "1", "·", "·"], 2),
      frame("Finish the forward pass", "Every cell now remembers only what was strictly left of it.", [2, 3], ["left = 24"], ["1", "1", "2", "6"], 4),
      frame("Sweep from the right", "Multiply each cell by the running product strictly to its right.", [2, 3], ["right = 12"], ["1", "1", "8", "6"], 6),
      frame("Two directions meet", "The final output combines left context and right context without division.", [0, 1], ["right = 24"], ["24", "12", "8", "6"], 8),
    ] },
    variant: { label: "A zero changes the products", input: ["2", "0", "4"], frames: [
      frame("Forward state reaches zero", "The left product remains usable before zero, then becomes zero after consuming it.", [0, 1], ["left = 0"], ["1", "2", "0"], 3),
      frame("Right state stays independent", "The reverse product has not crossed zero yet.", [2], ["right = 4"], ["1", "2", "0"], 4),
      frame("Only the zero position survives", "The zero index receives every nonzero factor. Other positions include zero.", [0, 1], ["right = 0"], ["0", "8", "0"], 6),
    ] },
    transferPrompt: "Suppose results must be returned modulo M and values may be negative. Explain what stays identical and what changes.",
    defenseSignals: ["left", "right", "strictly", "two pass", "division", "zero", "o(n)"],
  },
  {
    id: "top-k",
    missionId: "top-k-frequent",
    family: "Count then select",
    title: "Frequency Dispatch",
    problemName: "Top K Frequent Elements",
    accent: color.amber,
    recognitionSignal: "The output is a small ranked subset, and input order does not matter after frequencies are counted.",
    naiveFailure: "Sorting every distinct value pays for a complete ranking even though only k winners are needed.",
    naiveWork: "sort every distinct value",
    efficientWork: "count + bounded selection",
    invariant: "The frequency map is complete before selection begins. The selection structure then keeps exactly the best candidates seen under its chosen ordering.",
    canonical: { label: "Bucket replay", input: ["1", "1", "1", "2", "2", "3"], frames: [
      frame("Count identities", "Frequency is the only information the ranking phase needs.", [0, 1, 2], ["1 → 3"], [], 3),
      frame("Finish the map", "Each value is counted once per occurrence.", [3, 4, 5], ["1 → 3", "2 → 2", "3 → 1"], [], 6),
      frame("Build frequency buckets", "A value with frequency f enters bucket f.", [], ["bucket 3: 1", "bucket 2: 2", "bucket 1: 3"], [], 9),
      frame("Read only until k", "Scan from the highest frequency and stop after two winners.", [], ["need 2"], ["1", "2"], 11),
    ] },
    variant: { label: "Many ties", input: ["4", "4", "5", "5", "6", "6"], frames: [
      frame("All counts tie", "Any two values are valid when the contract does not define tie order.", [0, 1, 2, 3, 4, 5], ["4 → 2", "5 → 2", "6 → 2"], [], 6),
      frame("Stop at k", "The algorithm does not invent a stronger ordering than the problem asks for.", [], ["bucket 2: 4, 5, 6"], ["4", "5"], 8),
    ] },
    transferPrompt: "Values now arrive as an unbounded stream and queries ask for the current top k. Compare rebuilding, a heap, and approximate heavy-hitter tracking.",
    defenseSignals: ["frequency", "map", "heap", "bucket", "k", "distinct", "tradeoff"],
  },
  {
    id: "intervals",
    missionId: "merge-intervals",
    family: "Sort then normalize",
    title: "Timeline Repair Yard",
    problemName: "Merge Intervals",
    accent: color.blue,
    recognitionSignal: "Ranges overlap and the output must be a disjoint normalized timeline.",
    naiveFailure: "Comparing every pair repeatedly makes already-merged ranges get reconsidered and can grow quadratically.",
    naiveWork: "repeated pair comparisons",
    efficientWork: "sort + one sweep",
    invariant: "The output is sorted and disjoint. Its last interval is the only one that can overlap the next sorted interval.",
    canonical: { label: "Overlapping schedule", input: ["[1,3]", "[2,6]", "[8,10]", "[15,18]"], frames: [
      frame("Sort by start", "Once starts are ordered, an interval cannot overlap an earlier finished output except the last one.", [0, 1, 2, 3], ["sorted"], [], 4),
      frame("Open the first range", "The output starts with one known disjoint range.", [0], ["last = [1,3]"], ["[1,3]"], 5),
      frame("Absorb an overlap", "The next start is inside the last end, so extend that end.", [0, 1], ["last = [1,6]"], ["[1,6]"], 6),
      frame("Append disjoint work", "Starts beyond the last end create new output ranges.", [2, 3], ["last = [15,18]"], ["[1,6]", "[8,10]", "[15,18]"], 8),
    ] },
    variant: { label: "Nested and touching ranges", input: ["[1,10]", "[2,3]", "[10,12]"], frames: [
      frame("Nested interval adds nothing", "Its end is already protected by the current output range.", [0, 1], ["last = [1,10]"], ["[1,10]"], 2),
      frame("Touching counts as overlap", "With closed intervals, start 10 is covered and extends the end to 12.", [0, 2], ["last = [1,12]"], ["[1,12]"], 3),
    ] },
    transferPrompt: "Intervals arrive already sorted, one at a time. Explain how the invariant changes and what must be stored between arrivals.",
    defenseSignals: ["sort", "start", "last", "overlap", "end", "disjoint", "o(n log n)"],
  },
  {
    id: "tree-bounds",
    missionId: "validate-bst",
    family: "Recursive bounds",
    title: "Boundary Tree Observatory",
    problemName: "Validate Binary Search Tree",
    accent: color.violet,
    recognitionSignal: "A local parent check is not enough because every ancestor constrains the subtree.",
    naiveFailure: "Checking only each parent and child accepts a deep value that violates an older ancestor boundary.",
    naiveWork: "local comparisons with a correctness hole",
    efficientWork: "one DFS carrying open bounds",
    invariant: "Every recursive call owns an open interval (lower, upper). The node must fit it, and each child receives one tightened boundary.",
    canonical: { label: "Valid tree", input: ["5", "1", "7", "6", "8"], frames: [
      frame("Root owns all values", "Five begins with no finite ancestor limits.", [0], ["(-∞, +∞)"], [], 1),
      frame("Left tightens the upper bound", "One must remain below five.", [1], ["(-∞, 5)"], ["1 valid"], 2),
      frame("Right tightens the lower bound", "Seven and everything below it must remain above five.", [2], ["(5, +∞)"], ["1 valid", "7 valid"], 3),
      frame("Descendants inherit all ancestors", "Six receives (5,7), while eight receives (7,+∞).", [3, 4], ["6 ∈ (5,7)", "8 ∈ (7,+∞)"], ["tree valid"], 5),
    ] },
    variant: { label: "Deep ancestor violation", input: ["5", "1", "7", "4", "8"], frames: [
      frame("Local parent check looks safe", "Four is less than its parent seven, which fools the naive check.", [2, 3], ["parent: 7"], [], 3),
      frame("The inherited lower bound catches it", "The right subtree still requires every value to be greater than five.", [0, 3], ["required: (5,7)"], ["4 invalid"], 4),
    ] },
    transferPrompt: "Duplicate keys are now allowed only on the right. Explain exactly which bounds become closed and which remain open.",
    defenseSignals: ["lower", "upper", "bound", "ancestor", "open", "recursive", "integer"],
  },
  {
    id: "backtracking",
    missionId: "word-search",
    family: "Choose, explore, restore",
    title: "Pathfinder Garden",
    problemName: "Word Search",
    accent: color.green,
    recognitionSignal: "A path branches, a cell cannot be reused, and failed branches must leave the board unchanged for siblings.",
    naiveFailure: "A global visited set that is never restored blocks valid sibling paths; no pruning explores impossible prefixes.",
    naiveWork: "branching without restoration",
    efficientWork: "pruned DFS with reversible state",
    invariant: "The marked cells are exactly the current path prefix. Before returning from a branch, restore the cell so sibling branches see the original board.",
    canonical: { label: "Find ABCCED", input: ["A", "B", "C", "E", "S", "F", "C", "S", "A", "D", "E", "E"], frames: [
      frame("Choose a matching start", "Only cells matching the first character can begin the path.", [0], ["path: A"], [], 1),
      frame("Extend one adjacent match", "The path owns A and B temporarily.", [0, 1], ["path: A → B"], [], 2),
      frame("Turn through the grid", "Each next cell is adjacent, matches, and is not already on the path.", [0, 1, 2, 6], ["path: A → B → C → C"], [], 4),
      frame("Finish, then restore", "The word is found. Returning restores every temporary mark.", [0, 1, 2, 6, 10, 9], ["path length = 6"], ["ABCCED found"], 6),
    ] },
    variant: { label: "Reject cell reuse", input: ["A", "B", "C", "D"], frames: [
      frame("Prefix AB is valid", "The first two cells form a legal current path.", [0, 1], ["path: A → B"], [], 2),
      frame("The next A would reuse index 0", "Marked state rejects a cycle even though the character matches.", [0, 1], ["need A", "index 0 already used"], ["ABA not found"], 3),
      frame("Restore for another start", "Unmark B and A before trying a different starting cell.", [], ["path cleared"], ["false"], 4),
    ] },
    transferPrompt: "The task changes to finding every dictionary word on the same board. Explain why repeating this search is wasteful and what prefix structure you would add.",
    defenseSignals: ["mark", "unmark", "restore", "path", "prefix", "prune", "visited"],
  },
  {
    id: "dynamic-programming",
    missionId: "coin-change",
    family: "Unbounded dynamic programming",
    title: "Change Foundry",
    problemName: "Coin Change",
    accent: color.red,
    recognitionSignal: "Many amounts ask the same smaller questions, and each coin may be reused.",
    naiveFailure: "Greedy fails for valid coin systems, while plain recursion recomputes the same remaining amounts exponentially.",
    naiveWork: "repeated recursive subproblems",
    efficientWork: "amount-sized state table",
    invariant: "dp[a] is the minimum coins needed to form exactly amount a using completed smaller states. Unreachable states stay at infinity.",
    canonical: { label: "Coins 1, 3, 4; target 6", input: ["0", "1", "2", "3", "4", "5", "6"], frames: [
      frame("Define the base", "Zero amount needs zero coins. Every other amount begins unreachable.", [0], ["dp[0] = 0", "others = ∞"], ["0"], 1),
      frame("Build reachable amounts", "Each state asks which coin can safely come last.", [1, 2, 3], ["dp[1]=1", "dp[2]=2", "dp[3]=1"], ["0", "1", "2", "1"], 4),
      frame("Reject greedy instinct", "At amount 6, choosing 4 first gives three coins, but 3 + 3 gives two.", [4, 5, 6], ["min(dp[5], dp[3], dp[2]) + 1"], ["0", "1", "2", "1", "1", "2", "2"], 7),
    ] },
    variant: { label: "Unreachable target", input: ["0", "1", "2", "3"], frames: [
      frame("Coin 2 reaches only even states", "Odd amounts remain infinity instead of pretending zero is a valid count.", [0, 2], ["coins: [2]"], ["0", "∞", "1", "∞"], 4),
      frame("Translate the sentinel", "Infinity at the target becomes -1 at the API boundary.", [3], ["dp[3] = ∞"], ["-1"], 5),
    ] },
    transferPrompt: "Each coin now has limited inventory. Explain why the unbounded transition is no longer safe and what additional state or iteration rule is required.",
    defenseSignals: ["dp", "state", "transition", "base", "infinity", "smaller", "greedy"],
  },
];

export function getAlgorithmReplayWorld(id?: string): AlgorithmReplayWorld | undefined {
  return ALGORITHM_REPLAY_WORLDS.find((world) => world.id === id);
}

export function getAlgorithmReplayRoute(id: string): string {
  return `/arena/algorithm-replay/${id}`;
}
