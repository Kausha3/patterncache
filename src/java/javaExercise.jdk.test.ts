import { describe, expect, it } from "vitest";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { generateExerciseMain, parseJavaTestReport } from "./javaHarness";
import type { JavaExerciseSpec } from "@/types";
import { LESSONS } from "@/content";
import { listColdDrills } from "@/content/coldDrills";

/**
 * Golden proof for every runnable lesson exercise: assemble exactly the
 * files the browser assembles (learner class + support + generated main),
 * compile them with a real javac, run them on a real JVM, and hold the
 * content to the standard the product promises. The reference must pass
 * everything; the starter must compile but fail, so the learner's first
 * run shows an honest red board. Skipped on machines without a JDK.
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

interface DiscoveredExercise {
  lessonId: string;
  methodId: string;
  signature: string;
  spec: JavaExerciseSpec;
}

function discoverJavaExercises(): DiscoveredExercise[] {
  const found: DiscoveredExercise[] = [];
  for (const lesson of Object.values(LESSONS)) {
    if (lesson.track !== "lld") continue;
    for (const method of lesson.design.methods) {
      if (method.codeExercise?.java) {
        found.push({
          lessonId: lesson.id,
          methodId: method.id,
          signature: method.signature,
          spec: method.codeExercise.java,
        });
      }
    }
  }
  for (const drill of listColdDrills()) {
    for (const method of drill.reference.methods) {
      if (method.codeExercise?.java) {
        found.push({
          lessonId: `drill:${drill.id}`,
          methodId: method.id,
          signature: method.signature,
          spec: method.codeExercise.java,
        });
      }
    }
  }
  return found;
}

function assembleAndRun(spec: JavaExerciseSpec, learnerFile: string) {
  const workDir = mkdtempSync(join(tmpdir(), "pc-exercise-"));
  try {
    const reportPath = join(workDir, "report.json");
    const files = [
      { name: `${spec.editClassName}.java`, content: learnerFile },
      ...spec.support.map((support) => ({ name: `${support.className}.java`, content: support.source })),
      { name: "PcExerciseMain.java", content: generateExerciseMain(spec.tests) },
    ];
    for (const file of files) writeFileSync(join(workDir, file.name), file.content);
    execFileSync("javac", ["-d", workDir, ...files.map((file) => join(workDir, file.name))], { stdio: "pipe" });
    execFileSync("java", ["-cp", workDir, "PcExerciseMain", reportPath], { stdio: "pipe" });
    return parseJavaTestReport(readFileSync(reportPath, "utf-8"));
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

const exercises = discoverJavaExercises();

describe("runnable lesson exercises", () => {
  it("finds the Parking Lot exercises (discovery is not silently empty)", () => {
    const keys = exercises.map((exercise) => `${exercise.lessonId}:${exercise.methodId}`);
    expect(keys).toContain("parking-lot:m1");
    expect(keys).toContain("parking-lot:m5");
  });

  it("keeps every spec structurally sound without needing a JVM", () => {
    for (const { lessonId, methodId, spec } of exercises) {
      const where = `${lessonId}:${methodId}`;
      expect(spec.tests.length, `${where} needs at least 3 tests`).toBeGreaterThanOrEqual(3);
      expect(spec.starterFile, `${where} starter must declare its class`).toContain(`class ${spec.editClassName}`);
      expect(spec.referenceFile, `${where} reference must declare its class`).toContain(`class ${spec.editClassName}`);
      expect(spec.starterFile).not.toBe(spec.referenceFile);
      // The generator throws on duplicate ids or bodies that never assign `passed`.
      expect(() => generateExerciseMain(spec.tests), where).not.toThrow();
      const everything = JSON.stringify(spec);
      expect(everything.includes("—"), `${where} must not contain em-dashes`).toBe(false);
    }
  });
});

describe.skipIf(!jdkAvailable)("runnable lesson exercises on a real JVM", () => {
  for (const { lessonId, signature, spec } of exercises) {
    const name = `${lessonId} ${signature}`;

    it(`${name}: the reference implementation passes every test`, () => {
      const report = assembleAndRun(spec, spec.referenceFile);
      expect(report.map((entry) => entry.id)).toEqual(spec.tests.map((test) => test.id));
      const failures = report.filter((entry) => !entry.passed);
      expect(failures, JSON.stringify(failures, null, 2)).toEqual([]);
      for (const entry of report) {
        expect(entry.expected.length, `${entry.id} needs readable expected text`).toBeGreaterThan(0);
      }
    });

    it(`${name}: the starter compiles but fails, so the first run is an honest red board`, () => {
      const report = assembleAndRun(spec, spec.starterFile);
      expect(report.filter((entry) => !entry.passed).length).toBeGreaterThan(0);
      for (const failure of report.filter((entry) => !entry.passed)) {
        expect(failure.error, `${failure.id} starter should fail by result, not by crashing`).toBeNull();
      }
    });
  }
});
