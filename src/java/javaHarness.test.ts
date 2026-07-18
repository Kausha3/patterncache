import { describe, expect, it } from "vitest";
import {
  escapeJavaString,
  generateTestMain,
  javaLiteral,
  javaTypeName,
  parseJavaTestReport,
  validateJavaSpec,
} from "./javaHarness";
import type { JavaCombatSpec } from "./javaHarness";
import { CODING_COMBAT_MISSIONS } from "@/arena/codingCombatMissions";

const SAMPLE_SPEC: JavaCombatSpec = {
  methodName: "solve",
  signature: "public int solve(int[] values, String label)",
  argTypes: ["int[]", "String"],
  returnType: "int",
  starterCode: "public class Solution {}",
};

describe("escapeJavaString", () => {
  it("escapes quotes, backslashes, and whitespace controls", () => {
    expect(escapeJavaString('say "hi"\\path\n\tend\r')).toBe('say \\"hi\\"\\\\path\\n\\tend\\r');
  });

  it("emits non-ASCII as unicode escapes so generated source stays pure ASCII", () => {
    expect(escapeJavaString("café")).toBe("caf\\u00e9");
    expect(escapeJavaString("🙂")).toBe("\\ud83d\\ude42");
  });

  it("cannot be tricked into a live Java unicode escape by user data", () => {
    // The raw text A must survive as text, not decode to "A". Escaping
    // the backslash leaves \u preceded by an odd number of backslashes,
    // which the Java lexer does not treat as a unicode escape.
    expect(escapeJavaString("\\u0041")).toBe("\\\\u0041");
  });
});

describe("javaLiteral", () => {
  it("emits every supported type", () => {
    expect(javaLiteral("int", -7)).toBe("-7");
    expect(javaLiteral("long", 9007199254740991)).toBe("9007199254740991L");
    expect(javaLiteral("double", 2)).toBe("2.0");
    expect(javaLiteral("double", 0.5)).toBe("0.5");
    expect(javaLiteral("boolean", true)).toBe("true");
    expect(javaLiteral("String", 'a"b')).toBe('"a\\"b"');
    expect(javaLiteral("int[]", [1, 2, 3])).toBe("new int[] { 1, 2, 3 }");
    expect(javaLiteral("int[]", [])).toBe("new int[] {  }");
    expect(javaLiteral("int[][]", [[1, 2], [], [-3]])).toBe(
      "new int[][] { new int[] { 1, 2 }, new int[] {  }, new int[] { -3 } }",
    );
    expect(javaLiteral("int[][]", [])).toBe("new int[][] {  }");
    expect(javaLiteral("String[]", ["x"])).toBe('new String[] { "x" }');
    expect(javaLiteral("double[]", [1, 2.5])).toBe("new double[] { 1.0, 2.5 }");
    expect(javaLiteral("TreeNode", [3, 9, 20, null, null, 15, 7])).toBe(
      "tree(new Integer[] { 3, 9, 20, null, null, 15, 7 })",
    );
    expect(javaLiteral("ListNode", [1, 2, 3])).toBe("list(new int[] { 1, 2, 3 }, -1)");
    expect(javaLiteral("ListNode", { values: [3, 2, 0, -4], cycleAt: 1 })).toBe(
      "list(new int[] { 3, 2, 0, -4 }, 1)",
    );
  });

  it("emits adjacency maps as key-then-values rows", () => {
    expect(javaLiteral("Map<String,List<String>>", { A: ["B", "C"], B: [] })).toBe(
      'map(new String[][] { { "A", "B", "C" }, { "B" } })',
    );
  });

  it("rejects values that do not fit the declared type", () => {
    expect(() => javaLiteral("int", 2147483648)).toThrow(/does not fit/);
    expect(() => javaLiteral("int", 1.5)).toThrow(/does not fit/);
    expect(() => javaLiteral("int", "3")).toThrow(/does not fit/);
    expect(() => javaLiteral("double", Number.NaN)).toThrow(/does not fit/);
    expect(() => javaLiteral("String", 3)).toThrow(/does not fit/);
    expect(() => javaLiteral("int[]", [1, "2"])).toThrow(/does not fit/);
    expect(() => javaLiteral("int[][]", [[1], ["2"]])).toThrow(/does not fit/);
    expect(() => javaLiteral("int[][]", [1, 2])).toThrow(/does not fit/);
    expect(() => javaLiteral("Map<String,List<String>>", { A: [1] })).toThrow(/does not fit/);
    expect(() => javaLiteral("Map<String,List<String>>", ["A"])).toThrow(/does not fit/);
    expect(() => javaLiteral("TreeNode", [null, 1])).toThrow(/does not fit/);
    expect(() => javaLiteral("TreeNode", [1, "2"])).toThrow(/does not fit/);
    expect(() => javaLiteral("ListNode", { values: [1, 2], cycleAt: 2 })).toThrow(/does not fit/);
    expect(() => javaLiteral("ListNode", { values: [1, "2"], cycleAt: -1 })).toThrow(/does not fit/);
  });
});

describe("javaTypeName", () => {
  it("fully qualifies the map type for generated code", () => {
    expect(javaTypeName("Map<String,List<String>>")).toBe("java.util.Map<String, java.util.List<String>>");
    expect(javaTypeName("int[]")).toBe("int[]");
    expect(javaTypeName("int[][]")).toBe("int[][]");
    expect(javaTypeName("TreeNode")).toBe("TreeNode");
    expect(javaTypeName("ListNode")).toBe("ListNode");
  });
});

describe("generateTestMain", () => {
  const tests = [
    { id: "one", label: "first", args: [[1, 2], "a"], expected: 3 },
    { id: "two", label: "second", args: [[], ""], expected: 0 },
  ];

  it("generates one method per test plus the shared plumbing", () => {
    const source = generateTestMain(SAMPLE_SPEC, tests);
    expect(source).toContain("test0();");
    expect(source).toContain("test1();");
    expect(source).toContain('record("one"');
    expect(source).toContain("solution.solve(arg0, arg1)");
    expect(source).toContain("int[] arg0 = new int[] { 1, 2 };");
    expect(source).toContain("String reportPath = args[0];");
  });

  it("is deterministic for the same inputs", () => {
    expect(generateTestMain(SAMPLE_SPEC, tests)).toBe(generateTestMain(SAMPLE_SPEC, tests));
  });

  it("stays pure ASCII even when test data carries unicode", () => {
    const source = generateTestMain(
      { ...SAMPLE_SPEC, argTypes: ["String"], returnType: "String" },
      [{ id: "u", label: "unicode", args: ["héllo 🙂"], expected: "wörld" }],
    );
    for (let index = 0; index < source.length; index += 1) {
      expect(source.charCodeAt(index), `non-ASCII at index ${index}`).toBeLessThan(128);
    }
  });

  it("refuses tests whose values do not fit the spec", () => {
    expect(() =>
      generateTestMain(SAMPLE_SPEC, [{ id: "bad", label: "bad", args: [[1], "a", "extra"], expected: 1 }]),
    ).toThrow(/do not fit/);
    expect(() =>
      generateTestMain(SAMPLE_SPEC, [{ id: "bad", label: "bad", args: [["x"], "a"], expected: 1 }]),
    ).toThrow(/do not fit/);
  });

  it("uses deep equality and readable output for ordered int matrices", () => {
    const source = generateTestMain(
      {
        methodName: "matrix",
        signature: "public int[][] matrix(int[][] value)",
        argTypes: ["int[][]"],
        returnType: "int[][]",
        starterCode: "",
      },
      [{ id: "matrix", label: "matrix", args: [[[1, 2], [3, 4]]], expected: [[1, 2], [3, 4]] }],
    );
    expect(source).toContain("java.util.Arrays.deepEquals(expected, returned)");
    expect(source).toContain("java.util.Arrays.deepToString(returned)");
  });

  it("supports row-order-insensitive int matrix results only when explicitly declared", () => {
    const source = generateTestMain(
      {
        methodName: "choose",
        signature: "public int[][] choose(int[][] value)",
        argTypes: ["int[][]"],
        returnType: "int[][]",
        comparison: "unordered-rows",
        starterCode: "",
      },
      [{ id: "matrix", label: "matrix", args: [[[1, 2], [3, 4]]], expected: [[3, 4], [1, 2]] }],
    );
    expect(source).toContain("unorderedIntMatrixEquals(expected, returned)");
    expect(source).toContain("java.util.Map<String, Integer> remaining");
    expect(validateJavaSpec(
      {
        methodName: "bad",
        signature: "public int bad(int value)",
        argTypes: ["int"],
        returnType: "int",
        comparison: "unordered-rows",
        starterCode: "",
      },
      [{ id: "bad", label: "bad", args: [1], expected: 1 }],
    )).toContain("The unordered-rows comparison is only supported for int[][] results.");
  });

  it("builds tree and cyclic-list fixtures only when a combat spec needs them", () => {
    const treeSource = generateTestMain(
      {
        methodName: "identity",
        signature: "public TreeNode identity(TreeNode root)",
        argTypes: ["TreeNode"],
        returnType: "TreeNode",
        starterCode: "",
      },
      [{ id: "tree", label: "tree", args: [[2, 1, 3]], expected: [2, 1, 3] }],
    );
    expect(treeSource).toContain("class TreeNode");
    expect(treeSource).toContain("private static TreeNode tree(Integer[] values)");
    expect(treeSource).toContain("treeView(expected).equals(treeView(returned))");

    const listSource = generateTestMain(
      {
        methodName: "hasCycle",
        signature: "public boolean hasCycle(ListNode head)",
        argTypes: ["ListNode"],
        returnType: "boolean",
        starterCode: "",
      },
      [{ id: "cycle", label: "cycle", args: [{ values: [1, 2], cycleAt: 0 }], expected: true }],
    );
    expect(listSource).toContain("class ListNode");
    expect(listSource).toContain("nodes[nodes.length - 1].next = nodes[cycleAt]");
    expect(generateTestMain(SAMPLE_SPEC, tests)).not.toContain("class TreeNode");
    expect(generateTestMain(SAMPLE_SPEC, tests)).not.toContain("class ListNode");
  });

  it("observes an in-place void method and a returned node property without changing their Java signatures", () => {
    const mutationSource = generateTestMain(
      {
        methodName: "reorderList",
        signature: "public void reorderList(ListNode head)",
        argTypes: ["ListNode"],
        methodReturnType: "void",
        resultFromArg: 0,
        returnType: "ListNode",
        starterCode: "",
      },
      [{ id: "reorder", label: "reorder", args: [[1, 2, 3]], expected: [1, 3, 2] }],
    );
    expect(mutationSource).toContain("solution.reorderList(arg0);");
    expect(mutationSource).toContain("ListNode returned = arg0;");

    const nodePropertySource = generateTestMain(
      {
        methodName: "find",
        signature: "public TreeNode find(TreeNode root)",
        argTypes: ["TreeNode"],
        methodReturnType: "TreeNode",
        resultProperty: "val",
        returnType: "int",
        starterCode: "",
      },
      [{ id: "node", label: "node", args: [[7]], expected: 7 }],
    );
    expect(nodePropertySource).toContain("TreeNode rawReturned = solution.find(arg0);");
    expect(nodePropertySource).toContain("int returned = rawReturned.val;");
  });

  it("validates unordered element comparisons and observable mutation contracts", () => {
    const unordered = generateTestMain(
      {
        methodName: "values",
        signature: "public int[] values(int[] input)",
        argTypes: ["int[]"],
        returnType: "int[]",
        comparison: "unordered-elements",
        starterCode: "",
      },
      [{ id: "unordered", label: "unordered", args: [[1, 2]], expected: [2, 1] }],
    );
    expect(unordered).toContain("unorderedIntArrayEquals(expected, returned)");
    expect(validateJavaSpec(
      {
        methodName: "bad",
        signature: "public void bad(ListNode head)",
        argTypes: ["ListNode"],
        methodReturnType: "void",
        returnType: "ListNode",
        starterCode: "",
      },
      [{ id: "bad", label: "bad", args: [[]], expected: [] }],
    )).toContain("A void method must declare a valid resultFromArg index for its observable post-state.");
  });

  it("only enables semantic topological comparison for the Course Schedule signature", () => {
    const valid = validateJavaSpec({
      methodName: "findOrder",
      signature: "public int[] findOrder(int count, int[][] prerequisites)",
      argTypes: ["int", "int[][]"],
      returnType: "int[]",
      comparison: "topological-order",
      starterCode: "",
    }, [{ id: "dag", label: "dag", args: [2, [[1, 0]]], expected: [0, 1] }]);
    expect(valid).toEqual([]);

    const invalid = validateJavaSpec({
      methodName: "wrong",
      signature: "public int[] wrong(int[] values)",
      argTypes: ["int[]"],
      returnType: "int[]",
      comparison: "topological-order",
      starterCode: "",
    }, [{ id: "wrong", label: "wrong", args: [[1]], expected: [1] }]);
    expect(invalid).toContain("The topological-order comparison requires int[] findOrder(int, int[][]) semantics.");
  });
});

describe("validateJavaSpec on real missions", () => {
  it("every mission's visible and hidden tests fit its declared Java types", () => {
    for (const mission of CODING_COMBAT_MISSIONS) {
      const problems = validateJavaSpec(mission.java, [...mission.visibleTests, ...mission.hiddenTests]);
      expect(problems, `${mission.id}: ${problems.join("; ")}`).toEqual([]);
    }
  });

  it("every mission ships an editable Solution class matching its method", () => {
    for (const mission of CODING_COMBAT_MISSIONS) {
      expect(mission.java.starterCode).toContain("public class Solution");
      expect(mission.java.starterCode).toContain(mission.java.methodName);
      expect(mission.java.signature).toContain(mission.java.methodName);
      expect(mission.java.argTypes.length).toBeGreaterThan(0);
    }
  });

  it("keeps mission java content free of em-dashes", () => {
    for (const mission of CODING_COMBAT_MISSIONS) {
      expect(JSON.stringify(mission.java).includes("—")).toBe(false);
    }
  });

  it("generates a compilable-shaped harness for every mission without throwing", () => {
    for (const mission of CODING_COMBAT_MISSIONS) {
      const source = generateTestMain(mission.java, [
        ...mission.visibleTests.map((test) => ({ ...test })),
        ...mission.hiddenTests.map((test) => ({ ...test })),
      ]);
      expect(source).toContain("public final class PcTestMain");
      expect(source).toContain(`solution.${mission.java.methodName}(`);
    }
  });
});

describe("parseJavaTestReport", () => {
  it("round-trips a report written in the harness format", () => {
    const raw = JSON.stringify([
      { id: "a", passed: true, expected: "[0, 4]", actual: "[0, 4]", error: null, stdout: "", durationMs: 0.4 },
      { id: "b", passed: false, expected: "3", actual: "2", error: null, stdout: "probe\n", durationMs: 1.2 },
    ]);
    const entries = parseJavaTestReport(raw);
    expect(entries).toHaveLength(2);
    expect(entries[0]).toMatchObject({ id: "a", passed: true, actual: "[0, 4]" });
    expect(entries[1]).toMatchObject({ id: "b", passed: false, stdout: "probe\n" });
  });

  it("rejects malformed reports with a readable message", () => {
    expect(() => parseJavaTestReport("not json")).toThrow(/could not be parsed/);
    expect(() => parseJavaTestReport('{"id":"a"}')).toThrow(/unexpected shape/);
    expect(() => parseJavaTestReport('[{"passed":true}]')).toThrow(/unexpected shape/);
  });
});
