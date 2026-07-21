import type { CodingCombatTestCase } from "@/arena/codingCombatMissions";
import type { JavaExerciseTest } from "@/types";

/**
 * Turns a mission's JSON test cases into a real Java test program.
 *
 * The learner's Solution.java and the generated PcTestMain.java are compiled
 * together by a Java 8 compiler running inside CheerpJ. PcTestMain calls the solution
 * method with typed arguments, checks each result with type-appropriate
 * equality, and writes one JSON report file that the page reads back. Every
 * value that crosses the JS-to-Java boundary goes through the literal
 * generators below, which validate the JSON value against the declared Java
 * type before emitting source code.
 */

export type JavaType =
  | "int"
  | "long"
  | "double"
  | "boolean"
  | "String"
  | "int[]"
  | "int[][]"
  | "String[]"
  | "double[]"
  | "TreeNode"
  | "ListNode"
  | "Map<String,List<String>>";

export type JavaComparison = "ordered" | "unordered-rows" | "unordered-elements" | "unordered-strings" | "topological-order";

export interface JavaCombatSpec {
  /** The method PcTestMain calls on the learner's Solution class. */
  methodName: string;
  /** Java signature shown in the mission brief. */
  signature: string;
  argTypes: JavaType[];
  /** Actual Java return type. Defaults to `returnType`. Use void for in-place problems. */
  methodReturnType?: JavaType | "void";
  /** Argument to inspect after a void method mutates it. */
  resultFromArg?: number;
  /** Property observed from a returned node while preserving the interview signature. */
  resultProperty?: "val";
  /** Type of the observable value the harness compares with `expected`. */
  returnType: JavaType;
  /** Optional semantic comparison for results whose row order is irrelevant. */
  comparison?: JavaComparison;
  /** The full Solution.java the learner starts from and edits. */
  starterCode: string;
  /** Instrumentation compiled beside Solution.java but kept out of the learner's editor. */
  supportSources?: { fileName: string; content: string }[];
}

export interface JavaTestReportEntry {
  id: string;
  passed: boolean;
  expected: string;
  actual: string | null;
  error: string | null;
  stdout: string;
  durationMs: number;
}

const JAVA_INT_MIN = -2147483648;
const JAVA_INT_MAX = 2147483647;

/** Escape a JS string into the body of a Java string literal, ASCII-only. */
export function escapeJavaString(value: string): string {
  let out = "";
  for (let index = 0; index < value.length; index += 1) {
    const char = value[index];
    const code = value.charCodeAt(index);
    if (char === "\\") out += "\\\\";
    else if (char === '"') out += '\\"';
    else if (char === "\n") out += "\\n";
    else if (char === "\r") out += "\\r";
    else if (char === "\t") out += "\\t";
    else if (code < 0x20 || code > 0x7e) out += `\\u${code.toString(16).padStart(4, "0")}`;
    else out += char;
  }
  return out;
}

function fail(type: JavaType, value: unknown): never {
  throw new Error(`Value ${JSON.stringify(value)} does not fit the Java type ${type}.`);
}

function intLiteral(value: unknown, type: JavaType): string {
  if (typeof value !== "number" || !Number.isSafeInteger(value)) fail(type, value);
  if (type === "int" && (value < JAVA_INT_MIN || value > JAVA_INT_MAX)) fail(type, value);
  return type === "long" ? `${value}L` : `${value}`;
}

function doubleLiteral(value: unknown): string {
  if (typeof value !== "number" || !Number.isFinite(value)) fail("double", value);
  const text = String(value);
  return /[.eE]/.test(text) ? text : `${text}.0`;
}

function stringLiteral(value: unknown): string {
  if (typeof value !== "string") fail("String", value);
  return `"${escapeJavaString(value)}"`;
}

function arrayLiteral(type: JavaType, value: unknown, element: (item: unknown) => string): string {
  if (!Array.isArray(value)) fail(type, value);
  const elementType = type.slice(0, -2);
  return `new ${elementType}[] { ${value.map(element).join(", ")} }`;
}

function intMatrixLiteral(value: unknown): string {
  if (!Array.isArray(value)) fail("int[][]", value);
  const rows = value.map((row) => arrayLiteral("int[]", row, (item) => intLiteral(item, "int")));
  return `new int[][] { ${rows.join(", ")} }`;
}

function integerArrayValues(type: JavaType, value: unknown): number[] {
  if (!Array.isArray(value)) fail(type, value);
  value.forEach((item) => intLiteral(item, "int"));
  return value as number[];
}

function treeLiteral(value: unknown): string {
  if (!Array.isArray(value)) fail("TreeNode", value);
  const cells = value.map((item) => {
    if (item === null) return "null";
    return intLiteral(item, "int");
  });
  if (cells.length > 1 && cells[0] === "null" && cells.slice(1).some((cell) => cell !== "null")) {
    fail("TreeNode", value);
  }
  return `tree(new Integer[] { ${cells.join(", ")} })`;
}

function listLiteral(value: unknown): string {
  let values: number[];
  let cycleAt = -1;
  if (Array.isArray(value)) {
    values = integerArrayValues("ListNode", value);
  } else {
    if (!value || typeof value !== "object") fail("ListNode", value);
    const candidate = value as Record<string, unknown>;
    if (!Object.prototype.hasOwnProperty.call(candidate, "values") || !Object.prototype.hasOwnProperty.call(candidate, "cycleAt")) fail("ListNode", value);
    values = integerArrayValues("ListNode", candidate.values);
    if (typeof candidate.cycleAt !== "number" || !Number.isInteger(candidate.cycleAt)) fail("ListNode", value);
    cycleAt = candidate.cycleAt;
    if (cycleAt < -1 || cycleAt >= values.length) fail("ListNode", value);
  }
  const cells = values.map((item) => intLiteral(item, "int"));
  return `list(new int[] { ${cells.join(", ")} }, ${cycleAt})`;
}

function mapLiteral(value: unknown): string {
  if (!value || typeof value !== "object" || Array.isArray(value)) fail("Map<String,List<String>>", value);
  const rows = Object.entries(value as Record<string, unknown>).map(([key, list]) => {
    if (!Array.isArray(list) || list.some((item) => typeof item !== "string")) {
      fail("Map<String,List<String>>", value);
    }
    const cells = [key, ...(list as string[])].map((cell) => stringLiteral(cell));
    return `{ ${cells.join(", ")} }`;
  });
  return `map(new String[][] { ${rows.join(", ")} })`;
}

/** Emit a Java expression producing `value` as the given type. Throws on mismatch. */
export function javaLiteral(type: JavaType, value: unknown): string {
  switch (type) {
    case "int":
    case "long":
      return intLiteral(value, type);
    case "double":
      return doubleLiteral(value);
    case "boolean":
      if (typeof value !== "boolean") fail(type, value);
      return String(value);
    case "String":
      return stringLiteral(value);
    case "int[]":
      return arrayLiteral(type, value, (item) => intLiteral(item, "int"));
    case "int[][]":
      return intMatrixLiteral(value);
    case "String[]":
      return arrayLiteral(type, value, (item) => stringLiteral(item));
    case "double[]":
      return arrayLiteral(type, value, (item) => doubleLiteral(item));
    case "TreeNode":
      return treeLiteral(value);
    case "ListNode":
      return listLiteral(value);
    case "Map<String,List<String>>":
      return mapLiteral(value);
    default: {
      const exhausted: never = type;
      throw new Error(`Unsupported Java type ${String(exhausted)}.`);
    }
  }
}

/** The Java type name as written in a variable declaration. */
export function javaTypeName(type: JavaType): string {
  return type === "Map<String,List<String>>"
    ? "java.util.Map<String, java.util.List<String>>"
    : type;
}

function javaEquality(
  type: JavaType,
  expected: string,
  actual: string,
  comparison: JavaComparison = "ordered",
): string {
  switch (type) {
    case "int":
    case "long":
    case "boolean":
      return `${expected} == ${actual}`;
    case "double":
      return `Math.abs(${expected} - ${actual}) < 1.0e-9`;
    case "String":
    case "Map<String,List<String>>":
      return `java.util.Objects.equals(${expected}, ${actual})`;
    case "int[]":
      return comparison === "unordered-elements"
        ? `unorderedIntArrayEquals(${expected}, ${actual})`
        : `java.util.Arrays.equals(${expected}, ${actual})`;
    case "String[]":
      return comparison === "unordered-strings"
        ? `unorderedStringArrayEquals(${expected}, ${actual})`
        : `java.util.Arrays.equals(${expected}, ${actual})`;
    case "double[]":
      return `java.util.Arrays.equals(${expected}, ${actual})`;
    case "int[][]":
      return comparison === "unordered-rows"
        ? `unorderedIntMatrixEquals(${expected}, ${actual})`
        : `java.util.Arrays.deepEquals(${expected}, ${actual})`;
    case "TreeNode":
      return `treeView(${expected}).equals(treeView(${actual}))`;
    case "ListNode":
      return `listView(${expected}).equals(listView(${actual}))`;
    default: {
      const exhausted: never = type;
      throw new Error(`Unsupported Java type ${String(exhausted)}.`);
    }
  }
}

function javaDisplay(type: JavaType, expression: string): string {
  if (type === "int[][]") return `java.util.Arrays.deepToString(${expression})`;
  if (type === "String[]") return `stringArrayView(${expression})`;
  if (type === "int[]" || type === "double[]") {
    return `java.util.Arrays.toString(${expression})`;
  }
  if (type === "String") return `quote(${expression})`;
  if (type === "TreeNode") return `treeView(${expression})`;
  if (type === "ListNode") return `listView(${expression})`;
  return `String.valueOf(${expression})`;
}

/**
 * Validate every test case of a mission against its Java spec. Returns a
 * list of problems; an empty list means every value is representable.
 */
export function validateJavaSpec(
  spec: JavaCombatSpec,
  tests: CodingCombatTestCase[],
): string[] {
  const problems: string[] = [];
  if (spec.comparison === "unordered-rows" && spec.returnType !== "int[][]") {
    problems.push("The unordered-rows comparison is only supported for int[][] results.");
  }
  if (spec.comparison === "unordered-elements" && spec.returnType !== "int[]") {
    problems.push("The unordered-elements comparison is only supported for int[] results.");
  }
  if (spec.comparison === "unordered-strings" && spec.returnType !== "String[]") {
    problems.push("The unordered-strings comparison is only supported for String[] results.");
  }
  if (
    spec.comparison === "topological-order"
    && (spec.returnType !== "int[]" || spec.argTypes.length !== 2 || spec.argTypes[0] !== "int" || spec.argTypes[1] !== "int[][]")
  ) {
    problems.push("The topological-order comparison requires int[] findOrder(int, int[][]) semantics.");
  }
  const methodReturnType = spec.methodReturnType ?? spec.returnType;
  if (methodReturnType === "void") {
    if (spec.resultProperty !== undefined) {
      problems.push("resultProperty is only supported for non-void node returns.");
    }
    if (!Number.isInteger(spec.resultFromArg) || spec.resultFromArg! < 0 || spec.resultFromArg! >= spec.argTypes.length) {
      problems.push("A void method must declare a valid resultFromArg index for its observable post-state.");
    } else if (spec.argTypes[spec.resultFromArg!] !== spec.returnType) {
      problems.push("The resultFromArg type must match the observable returnType.");
    }
  } else {
    if (spec.resultFromArg !== undefined) {
      problems.push("resultFromArg is only supported for void methods.");
    }
    if (spec.resultProperty === "val") {
      if ((methodReturnType !== "TreeNode" && methodReturnType !== "ListNode") || spec.returnType !== "int") {
        problems.push("The val resultProperty requires a TreeNode or ListNode method return and an int observable returnType.");
      }
    } else if (methodReturnType !== spec.returnType) {
      problems.push("A non-void methodReturnType must match returnType.");
    }
  }
  for (const test of tests) {
    if (test.args.length !== spec.argTypes.length) {
      problems.push(`Test ${test.id} passes ${test.args.length} arguments but the spec declares ${spec.argTypes.length}.`);
      continue;
    }
    test.args.forEach((arg, index) => {
      try {
        javaLiteral(spec.argTypes[index], arg);
      } catch (error) {
        problems.push(`Test ${test.id} argument ${index}: ${(error as Error).message}`);
      }
    });
    try {
      javaLiteral(spec.returnType, test.expected);
    } catch (error) {
      problems.push(`Test ${test.id} expected value: ${(error as Error).message}`);
    }
  }
  return problems;
}

/**
 * The fixed scaffold every generated test method runs inside: verdict locals,
 * per-test stdout capture, and a Throwable catch so one exploding test cannot
 * hide the results of later ones.
 */
function testMethodShell(id: string, index: number, innerStatements: string): string {
  return `  private static void test${index}() {
    long startedAt = System.nanoTime();
    boolean passed = false;
    String expectedText = null;
    String actualText = null;
    String error = null;
    java.io.ByteArrayOutputStream captured = new java.io.ByteArrayOutputStream();
    java.io.PrintStream original = System.out;
    try {
      System.setOut(new java.io.PrintStream(captured, true, "UTF-8"));
${innerStatements}
    } catch (Throwable failure) {
      error = failure.toString();
    } finally {
      System.setOut(original);
    }
    record(${stringLiteral(id)}, passed, expectedText, actualText, error, stdoutTail(captured), startedAt);
  }`;
}

function combatTestInner(spec: JavaCombatSpec, test: CodingCombatTestCase): string {
  const argDecls = test.args
    .map((arg, argIndex) => `      ${javaTypeName(spec.argTypes[argIndex])} arg${argIndex} = ${javaLiteral(spec.argTypes[argIndex], arg)};`)
    .join("\n");
  const argList = test.args.map((_, argIndex) => `arg${argIndex}`).join(", ");
  const returnDecl = javaTypeName(spec.returnType);
  const methodReturnType = spec.methodReturnType ?? spec.returnType;
  const invocation = methodReturnType === "void"
    ? `solution.${spec.methodName}(${argList});\n      ${returnDecl} returned = arg${spec.resultFromArg};`
    : spec.resultProperty === "val"
      ? `${javaTypeName(methodReturnType)} rawReturned = solution.${spec.methodName}(${argList});\n      ${returnDecl} returned = rawReturned.val;`
      : `${returnDecl} returned = solution.${spec.methodName}(${argList});`;
  const expectedDisplay = spec.comparison === "topological-order"
    ? '"any valid prerequisite order"'
    : javaDisplay(spec.returnType, "expected");
  const equality = spec.comparison === "topological-order"
    ? "topologicalOrderEquals(returned, arg0, arg1, expected)"
    : javaEquality(spec.returnType, "expected", "returned", spec.comparison);
  return `${argDecls}
      ${returnDecl} expected = ${javaLiteral(spec.returnType, test.expected)};
      expectedText = ${expectedDisplay};
      Solution solution = new Solution();
      ${invocation}
      passed = ${equality};
      actualText = ${javaDisplay(spec.returnType, "returned")};`;
}

/**
 * Generate the complete PcTestMain.java source for a mission run.
 * The report path is passed as args[0] so tests can point it anywhere.
 */
export function generateTestMain(spec: JavaCombatSpec, tests: CodingCombatTestCase[]): string {
  const problems = validateJavaSpec(spec, tests);
  if (problems.length > 0) {
    throw new Error(`Mission tests do not fit the Java spec:\n${problems.join("\n")}`);
  }
  const methods = tests
    .map((test, index) => testMethodShell(test.id, index, combatTestInner(spec, test)))
    .join("\n\n");
  const calls = tests.map((_, index) => `    test${index}();`).join("\n");
  return mainShell("PcTestMain", methods, calls, nodeSupport(spec));
}

/**
 * Generate the PcExerciseMain.java source for a lesson exercise. Each test
 * body is authored Java (setup on real domain objects, then assign `passed`,
 * `expectedText`, `actualText`), because lesson methods operate on domain
 * classes that JSON-typed arguments cannot express.
 */
export function generateExerciseMain(tests: JavaExerciseTest[]): string {
  const seen = new Set<string>();
  for (const test of tests) {
    if (seen.has(test.id)) throw new Error(`Duplicate exercise test id: ${test.id}`);
    seen.add(test.id);
    if (!test.body.includes("passed")) {
      throw new Error(`Exercise test ${test.id} never assigns \`passed\`; it could not report a verdict.`);
    }
  }
  const methods = tests
    .map((test, index) => {
      const inner = test.body
        .trim()
        .split("\n")
        .map((line) => (line.trim().length === 0 ? "" : `      ${line}`))
        .join("\n");
      return testMethodShell(test.id, index, inner);
    })
    .join("\n\n");
  const calls = tests.map((_, index) => `    test${index}();`).join("\n");
  return mainShell("PcExerciseMain", methods, calls);
}

interface NodeSupport {
  declarations: string;
  helpers: string;
}

function nodeSupport(spec: JavaCombatSpec): NodeSupport {
  const types = [...spec.argTypes, spec.returnType, spec.methodReturnType].filter(Boolean);
  const needsTree = types.includes("TreeNode");
  const needsList = types.includes("ListNode");
  const declarations = [
    needsTree ? `class TreeNode {
  int val;
  TreeNode left;
  TreeNode right;

  TreeNode(int val) { this.val = val; }
}` : "",
    needsList ? `class ListNode {
  int val;
  ListNode next;

  ListNode(int val) { this.val = val; }
}` : "",
  ].filter(Boolean).join("\n\n");
  const helpers = [
    needsTree ? `  private static TreeNode tree(Integer[] values) {
    if (values.length == 0 || values[0] == null) return null;
    TreeNode root = new TreeNode(values[0]);
    java.util.Deque<TreeNode> parents = new java.util.ArrayDeque<TreeNode>();
    parents.add(root);
    int index = 1;
    while (index < values.length && !parents.isEmpty()) {
      TreeNode parent = parents.remove();
      if (values[index] != null) {
        parent.left = new TreeNode(values[index]);
        parents.add(parent.left);
      }
      index += 1;
      if (index < values.length && values[index] != null) {
        parent.right = new TreeNode(values[index]);
        parents.add(parent.right);
      }
      index += 1;
    }
    return root;
  }

  private static String treeView(TreeNode root) {
    StringBuilder out = new StringBuilder();
    treeView(root, out, new java.util.IdentityHashMap<TreeNode, Integer>());
    return out.toString();
  }

  private static void treeView(TreeNode node, StringBuilder out, java.util.IdentityHashMap<TreeNode, Integer> seen) {
    if (node == null) {
      out.append("#");
      return;
    }
    Integer prior = seen.get(node);
    if (prior != null) {
      out.append("cycle@").append(prior);
      return;
    }
    seen.put(node, seen.size());
    out.append(node.val).append("(");
    treeView(node.left, out, seen);
    out.append(",");
    treeView(node.right, out, seen);
    out.append(")");
  }` : "",
    needsList ? `  private static ListNode list(int[] values, int cycleAt) {
    if (values.length == 0) return null;
    ListNode[] nodes = new ListNode[values.length];
    for (int index = 0; index < values.length; index += 1) nodes[index] = new ListNode(values[index]);
    for (int index = 1; index < values.length; index += 1) nodes[index - 1].next = nodes[index];
    if (cycleAt >= 0) nodes[nodes.length - 1].next = nodes[cycleAt];
    return nodes[0];
  }

  private static String listView(ListNode head) {
    StringBuilder out = new StringBuilder("[");
    java.util.IdentityHashMap<ListNode, Integer> seen = new java.util.IdentityHashMap<ListNode, Integer>();
    ListNode cursor = head;
    int index = 0;
    while (cursor != null) {
      Integer cycleAt = seen.get(cursor);
      if (cycleAt != null) {
        out.append("] -> cycle@").append(cycleAt);
        return out.toString();
      }
      seen.put(cursor, index);
      if (index > 0) out.append(", ");
      out.append(cursor.val);
      cursor = cursor.next;
      index += 1;
    }
    return out.append("]").toString();
  }` : "",
  ].filter(Boolean).join("\n\n");
  return { declarations, helpers };
}

function mainShell(className: string, methods: string, calls: string, support: NodeSupport = { declarations: "", helpers: "" }): string {
  return `import java.io.FileWriter;
import java.io.PrintWriter;

${support.declarations}${support.declarations ? "\n\n" : ""}public final class ${className} {
  private static final StringBuilder OUT = new StringBuilder();
  private static boolean first = true;

  public static void main(String[] args) throws Exception {
    String reportPath = args[0];
    OUT.append("[");
${calls}
    OUT.append("]");
    PrintWriter writer = new PrintWriter(new FileWriter(reportPath));
    try {
      writer.print(OUT.toString());
    } finally {
      writer.close();
    }
  }

${methods}

  private static void record(String id, boolean passed, String expectedText, String actualText, String error, String stdout, long startedAt) {
    double durationMs = (System.nanoTime() - startedAt) / 1000000.0;
    if (!first) OUT.append(",");
    first = false;
    OUT.append("{\\"id\\":").append(str(id));
    OUT.append(",\\"passed\\":").append(passed);
    OUT.append(",\\"expected\\":").append(str(expectedText));
    OUT.append(",\\"actual\\":").append(str(actualText));
    OUT.append(",\\"error\\":").append(str(error));
    OUT.append(",\\"stdout\\":").append(str(stdout));
    OUT.append(",\\"durationMs\\":").append(durationMs);
    OUT.append("}");
  }

  private static String stdoutTail(java.io.ByteArrayOutputStream captured) {
    String text;
    try {
      text = captured.toString("UTF-8");
    } catch (java.io.UnsupportedEncodingException impossible) {
      return "";
    }
    return text.length() > 6000 ? text.substring(text.length() - 6000) : text;
  }

  private static String quote(String value) {
    return value == null ? "null" : "\\"" + value + "\\"";
  }

  private static String stringArrayView(String[] values) {
    if (values == null) return "null";
    StringBuilder out = new StringBuilder("[");
    for (int index = 0; index < values.length; index += 1) {
      if (index > 0) out.append(", ");
      out.append(quote(values[index]));
    }
    return out.append("]").toString();
  }

  private static boolean unorderedIntMatrixEquals(int[][] expected, int[][] actual) {
    if (expected == actual) return true;
    if (expected == null || actual == null || expected.length != actual.length) return false;
    java.util.Map<String, Integer> remaining = new java.util.HashMap<String, Integer>();
    for (int[] row : expected) {
      String key = java.util.Arrays.toString(row);
      Integer count = remaining.get(key);
      remaining.put(key, count == null ? 1 : count + 1);
    }
    for (int[] row : actual) {
      String key = java.util.Arrays.toString(row);
      Integer count = remaining.get(key);
      if (count == null) return false;
      if (count == 1) remaining.remove(key);
      else remaining.put(key, count - 1);
    }
    return remaining.isEmpty();
  }

  private static boolean unorderedIntArrayEquals(int[] expected, int[] actual) {
    if (expected == actual) return true;
    if (expected == null || actual == null || expected.length != actual.length) return false;
    int[] expectedCopy = expected.clone();
    int[] actualCopy = actual.clone();
    java.util.Arrays.sort(expectedCopy);
    java.util.Arrays.sort(actualCopy);
    return java.util.Arrays.equals(expectedCopy, actualCopy);
  }

  private static boolean unorderedStringArrayEquals(String[] expected, String[] actual) {
    if (expected == actual) return true;
    if (expected == null || actual == null || expected.length != actual.length) return false;
    String[] expectedCopy = expected.clone();
    String[] actualCopy = actual.clone();
    java.util.Arrays.sort(expectedCopy);
    java.util.Arrays.sort(actualCopy);
    return java.util.Arrays.equals(expectedCopy, actualCopy);
  }

  private static boolean topologicalOrderEquals(int[] actual, int numCourses, int[][] prerequisites, int[] expected) {
    if (actual == null || numCourses < 0) return false;
    // An empty reference means the graph contains a cycle, except for the
    // valid zero-course graph. In either case the only accepted result is [].
    if (expected.length == 0) return actual.length == 0;
    if (actual.length != numCourses) return false;
    int[] position = new int[numCourses];
    java.util.Arrays.fill(position, -1);
    for (int index = 0; index < actual.length; index += 1) {
      int course = actual[index];
      if (course < 0 || course >= numCourses || position[course] != -1) return false;
      position[course] = index;
    }
    for (int[] edge : prerequisites) {
      if (edge == null || edge.length != 2) return false;
      int course = edge[0];
      int prerequisite = edge[1];
      if (course < 0 || course >= numCourses || prerequisite < 0 || prerequisite >= numCourses) return false;
      if (position[prerequisite] >= position[course]) return false;
    }
    return true;
  }

${support.helpers}${support.helpers ? "\n\n" : ""}  private static String str(String value) {
    if (value == null) return "null";
    StringBuilder out = new StringBuilder("\\"");
    for (int index = 0; index < value.length(); index += 1) {
      char current = value.charAt(index);
      if (current == '\\\\') out.append("\\\\\\\\");
      else if (current == '"') out.append("\\\\\\"");
      else if (current == '\\n') out.append("\\\\n");
      else if (current == '\\r') out.append("\\\\r");
      else if (current == '\\t') out.append("\\\\t");
      else if (current < 0x20 || current > 0x7e) out.append(String.format("\\\\u%04x", (int) current));
      else out.append(current);
    }
    return out.append("\\"").toString();
  }

  private static java.util.Map<String, java.util.List<String>> map(String[][] rows) {
    java.util.Map<String, java.util.List<String>> built = new java.util.HashMap<String, java.util.List<String>>();
    for (String[] row : rows) {
      java.util.List<String> values = new java.util.ArrayList<String>();
      for (int index = 1; index < row.length; index += 1) values.add(row[index]);
      built.put(row[0], values);
    }
    return built;
  }
}
`;
}

/**
 * Parse the JSON report written by PcTestMain. Throws with a readable
 * message when the report is missing entries or malformed.
 */
export function parseJavaTestReport(raw: string): JavaTestReportEntry[] {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("The test report could not be parsed. Rerun the tests; reload the page if this repeats.");
  }
  if (!Array.isArray(parsed)) throw new Error("The test report has an unexpected shape.");
  return parsed.map((entry) => {
    const record = entry as Record<string, unknown>;
    if (typeof record.id !== "string" || typeof record.passed !== "boolean") {
      throw new Error("The test report has an unexpected shape.");
    }
    return {
      id: record.id,
      passed: record.passed,
      expected: typeof record.expected === "string" ? record.expected : "",
      actual: typeof record.actual === "string" ? record.actual : null,
      error: typeof record.error === "string" ? record.error : null,
      stdout: typeof record.stdout === "string" ? record.stdout : "",
      durationMs: typeof record.durationMs === "number" && Number.isFinite(record.durationMs) ? record.durationMs : 0,
    };
  });
}
