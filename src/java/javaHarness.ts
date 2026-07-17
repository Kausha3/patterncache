import type { CodingCombatTestCase } from "@/arena/codingCombatMissions";

/**
 * Turns a mission's JSON test cases into a real Java test program.
 *
 * The learner's Solution.java and the generated PcTestMain.java are compiled
 * together by javac running inside CheerpJ. PcTestMain calls the solution
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
  | "String[]"
  | "double[]"
  | "Map<String,List<String>>";

export interface JavaCombatSpec {
  /** The method PcTestMain calls on the learner's Solution class. */
  methodName: string;
  /** Java signature shown in the mission brief. */
  signature: string;
  argTypes: JavaType[];
  returnType: JavaType;
  /** The full Solution.java the learner starts from and edits. */
  starterCode: string;
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
    case "String[]":
      return arrayLiteral(type, value, (item) => stringLiteral(item));
    case "double[]":
      return arrayLiteral(type, value, (item) => doubleLiteral(item));
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

function javaEquality(type: JavaType, expected: string, actual: string): string {
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
    case "String[]":
    case "double[]":
      return `java.util.Arrays.equals(${expected}, ${actual})`;
    default: {
      const exhausted: never = type;
      throw new Error(`Unsupported Java type ${String(exhausted)}.`);
    }
  }
}

function javaDisplay(type: JavaType, expression: string): string {
  if (type === "int[]" || type === "String[]" || type === "double[]") {
    return `java.util.Arrays.toString(${expression})`;
  }
  if (type === "String") return `quote(${expression})`;
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

function testMethod(spec: JavaCombatSpec, test: CodingCombatTestCase, index: number): string {
  const argDecls = test.args
    .map((arg, argIndex) => `      ${javaTypeName(spec.argTypes[argIndex])} arg${argIndex} = ${javaLiteral(spec.argTypes[argIndex], arg)};`)
    .join("\n");
  const argList = test.args.map((_, argIndex) => `arg${argIndex}`).join(", ");
  const returnDecl = javaTypeName(spec.returnType);
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
${argDecls}
      ${returnDecl} expected = ${javaLiteral(spec.returnType, test.expected)};
      expectedText = ${javaDisplay(spec.returnType, "expected")};
      Solution solution = new Solution();
      ${returnDecl} returned = solution.${spec.methodName}(${argList});
      passed = ${javaEquality(spec.returnType, "expected", "returned")};
      actualText = ${javaDisplay(spec.returnType, "returned")};
    } catch (Throwable failure) {
      error = failure.toString();
    } finally {
      System.setOut(original);
    }
    record(${stringLiteral(test.id)}, passed, expectedText, actualText, error, stdoutTail(captured), startedAt);
  }`;
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
  const methods = tests.map((test, index) => testMethod(spec, test, index)).join("\n\n");
  const calls = tests.map((_, index) => `    test${index}();`).join("\n");
  return `import java.io.FileWriter;
import java.io.PrintWriter;

public final class PcTestMain {
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
    return text.length() > 500 ? text.substring(text.length() - 500) : text;
  }

  private static String quote(String value) {
    return value == null ? "null" : "\\"" + value + "\\"";
  }

  private static String str(String value) {
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
