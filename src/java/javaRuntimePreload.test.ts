import { describe, expect, it } from "vitest";
import { JAVA_RUNTIME_PRELOAD_RESOURCES } from "./javaRuntimePreload";

describe("CheerpJ Java compiler preload profile", () => {
  it("contains the profiled Java 8 runtime modules", () => {
    expect(Object.keys(JAVA_RUNTIME_PRELOAD_RESOURCES).length).toBeGreaterThanOrEqual(20);
    expect(JAVA_RUNTIME_PRELOAD_RESOURCES["/lt/8/jre/lib/rt.jar"].length).toBeGreaterThan(30);
    expect(JAVA_RUNTIME_PRELOAD_RESOURCES["/lt/8/jre/lib/javaws.jar"]).toEqual([
      0, 131072, 1441792, 1703936,
    ]);
  });

  it("keeps every recorded block aligned, ordered, and unique", () => {
    for (const blocks of Object.values(JAVA_RUNTIME_PRELOAD_RESOURCES)) {
      expect(blocks).toEqual([...blocks].sort((left, right) => left - right));
      expect(new Set(blocks).size).toBe(blocks.length);
      expect(blocks.every((offset) => offset % 131072 === 0)).toBe(true);
    }
  });
});
