import { createHash } from "node:crypto";
import { readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const ECJ_ASSET = "/java/ecj-3.26.0.jar";
const WRAPPER_ASSET = "/java/pc-ecj-v1.jar";
const EXPECTED_ECJ_SHA1 = "4837be609a3368a0f7e7cf0dc1bdbc7fe94993de";

function publicPath(url: string): string {
  return resolve(`public${url}`);
}

function cacheHeaderFor(config: unknown, source: string): string | undefined {
  if (!config || typeof config !== "object" || !("headers" in config) || !Array.isArray(config.headers)) {
    return undefined;
  }
  const route = config.headers.find((entry: unknown) => (
    entry && typeof entry === "object" && "source" in entry && entry.source === source
  ));
  if (!route || typeof route !== "object" || !("headers" in route) || !Array.isArray(route.headers)) {
    return undefined;
  }
  const header = route.headers.find((entry: unknown) => (
    entry && typeof entry === "object" && "key" in entry && entry.key === "Cache-Control"
  ));
  return header && typeof header === "object" && "value" in header && typeof header.value === "string"
    ? header.value
    : undefined;
}

describe("browser Java compiler assets", () => {
  it("ships the exact reviewed ECJ 3.26.0 artifact", () => {
    const bytes = readFileSync(publicPath(ECJ_ASSET));
    expect(createHash("sha1").update(bytes).digest("hex")).toBe(EXPECTED_ECJ_SHA1);
    expect(bytes.byteLength).toBeGreaterThan(2_000_000);
    expect(bytes.byteLength).toBeLessThan(4_000_000);
  });

  it("ships the versioned Java 8 compiler wrapper", () => {
    const wrapper = statSync(publicPath(WRAPPER_ASSET));
    expect(wrapper.isFile()).toBe(true);
    expect(wrapper.size).toBeGreaterThan(500);
  });

  it("keeps both versioned assets immutable at the deployment edge", () => {
    const config = JSON.parse(readFileSync(resolve("vercel.json"), "utf8")) as unknown;
    const expected = "public, max-age=31536000, immutable";
    expect(cacheHeaderFor(config, ECJ_ASSET)).toBe(expected);
    expect(cacheHeaderFor(config, WRAPPER_ASSET)).toBe(expected);
  });

  it("ships the compiler license and checksum notice", () => {
    const notice = readFileSync(resolve("public/java/NOTICE.txt"), "utf8");
    const license = readFileSync(resolve("public/java/EPL-2.0.txt"), "utf8");
    expect(notice).toContain("Eclipse Compiler for Java (ECJ) 3.26.0");
    expect(notice).toContain(EXPECTED_ECJ_SHA1);
    expect(license).toContain("Eclipse Public License - v 2.0");
  });
});
