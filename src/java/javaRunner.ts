import { JAVA_RUNTIME_PRELOAD_RESOURCES } from "./javaRuntimePreload";

/**
 * CheerpJ lifecycle and virtual-file plumbing.
 *
 * CheerpJ is a JVM compiled to WebAssembly, loaded from Leaning Technologies'
 * hosted runtime (their Community License covers this free, open-source
 * project and requires using the hosted domain plus visible credit; the
 * credit line lives in the Coding Combat workbench footer).
 *
 * The runtime is a page-wide singleton: the loader script is injected once,
 * cheerpjInit runs once, and every compile or run call shares that instance.
 * Java code executes on the page's own thread, so a learner's infinite loop
 * can freeze the tab; timeouts below catch the cases where CheerpJ yields,
 * and user-facing copy tells learners to reload when it does not.
 */

declare global {
  interface Window {
    cheerpjInit?: (options?: Record<string, unknown>) => Promise<void>;
    cheerpjRunMain?: (className: string, classPath: string, ...args: string[]) => Promise<number>;
    cheerpOSAddStringFile?: (path: string, data: string | Uint8Array) => void;
    cheerpjAddStringFile?: (path: string, data: string | Uint8Array) => void;
    cjFileBlob?: (path: string) => Promise<Blob>;
    __patternCacheJavaReady?: boolean;
  }
}

const CHEERPJ_LOADER_URL = "https://cjrtnc.leaningtech.com/4.3/loader.js";
// Eclipse ECJ is a self-contained Java 8 compiler. It replaces the 17 MB
// JDK tools.jar path that made a cold successful compilation exceed the
// timeout on ordinary laptops. Both entries must be jars because CheerpJ's
// /app/ filesystem is HTTP-backed.
const ECJ_COMPILER_CLASSPATH = "/app/java/pc-ecj-v1.jar:/app/java/ecj-3.26.0.jar";
const JAVAC_FALLBACK_CLASSPATH = "/app/java/pc.jar:/app/java/tools.jar";
const COMPILER_ASSET_URLS = ["/java/pc-ecj-v1.jar", "/java/ecj-3.26.0.jar"] as const;

export class JavaTimeoutError extends Error {}

let bootPromise: Promise<void> | undefined;
let runInProgress = false;

function traceJavaStage(stage: string, startedAt: number, detail?: Record<string, unknown>): void {
  console.info("[java-runtime]", {
    stage,
    durationMs: Math.round(performance.now() - startedAt),
    ...detail,
  });
}

async function prefetchCompilerAssets(): Promise<void> {
  const startedAt = performance.now();
  await Promise.all(COMPILER_ASSET_URLS.map(async (url) => {
    const response = await fetch(url, { cache: "force-cache" });
    if (!response.ok) throw new Error(`The Java compiler asset ${url} returned HTTP ${response.status}.`);
    // Consume the response so the complete jar is in the HTTP cache before
    // CheerpJ mounts the same URL through /app/.
    await response.arrayBuffer();
  }));
  traceJavaStage("compiler-assets-ready", startedAt, { assets: COMPILER_ASSET_URLS.length });
}

function injectLoaderScript(): Promise<void> {
  if (typeof window.cheerpjInit === "function") return Promise.resolve();
  if (typeof navigator !== "undefined" && navigator.onLine === false) {
    return Promise.reject(
      new Error("You look offline. The Java runtime needs one download (about 20 MB); reconnect and press Run again."),
    );
  }
  return new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = CHEERPJ_LOADER_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      // Remove the dead tag so the retry injects a fresh one.
      script.remove();
      reject(
        new Error(
          navigator.onLine === false
            ? "The connection dropped while downloading the Java runtime. Reconnect and press Run again."
            : "The Java runtime could not be downloaded. Check your connection and press Run again; nothing is lost.",
        ),
      );
    };
    document.head.appendChild(script);
  });
}

/**
 * Load and initialize the CheerpJ runtime once. Safe to call repeatedly;
 * a failed boot clears the cached promise so the next call retries.
 */
export function ensureJavaRuntime(): Promise<void> {
  if (window.__patternCacheJavaReady) return Promise.resolve();
  if (!bootPromise) {
    bootPromise = (async () => {
      const startedAt = performance.now();
      const compilerAssets = prefetchCompilerAssets();
      await injectLoaderScript();
      if (typeof window.cheerpjInit !== "function") {
        throw new Error("The Java runtime script loaded but did not expose its entry point.");
      }
      try {
        await Promise.all([
          window.cheerpjInit({
            version: 8,
            status: "none",
            preloadResources: JAVA_RUNTIME_PRELOAD_RESOURCES,
          }),
          compilerAssets,
        ]);
      } catch (error) {
        // Vite can replace this module without replacing the page-wide JVM.
        // Treat CheerpJ's explicit response as proof that the existing
        // singleton is usable instead of breaking the next learner run.
        if (!(error instanceof Error) || !error.message.includes("Already initialized")) throw error;
        await compilerAssets;
      }
      window.__patternCacheJavaReady = true;
      traceJavaStage("runtime-ready", startedAt);
    })().catch((error: unknown) => {
      bootPromise = undefined;
      throw error instanceof Error ? error : new Error("The Java runtime failed to start.");
    });
  }
  return bootPromise;
}

export function withTimeout<T>(work: Promise<T>, timeoutMs: number, message: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const timer = globalThis.setTimeout(() => reject(new JavaTimeoutError(message)), timeoutMs);
    work.then(
      (value) => {
        globalThis.clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        globalThis.clearTimeout(timer);
        reject(error);
      },
    );
  });
}

function writeStringFile(path: string, content: string): void {
  const writer = window.cheerpOSAddStringFile ?? window.cheerpjAddStringFile;
  if (!writer) throw new Error("The Java runtime is not ready to receive files.");
  writer(path, new TextEncoder().encode(content));
}

async function readVirtualFile(path: string): Promise<string | undefined> {
  if (typeof window.cjFileBlob !== "function") return undefined;
  try {
    const blob = await window.cjFileBlob(path);
    return await blob.text();
  } catch {
    return undefined;
  }
}

export interface JavaCompileOutcome {
  ok: boolean;
  log: string;
}

/**
 * Compile the given sources with ECJ (with javac as a compatibility fallback)
 * and capture diagnostics to a file. Returns the compiler's own exit status
 * and full diagnostic text.
 */
export async function compileJava(
  sources: { path: string; content: string }[],
  logPath: string,
): Promise<JavaCompileOutcome> {
  if (typeof window.cheerpjRunMain !== "function") {
    throw new Error("The Java runtime is not ready. Run again once it finishes loading.");
  }
  for (const source of sources) writeStringFile(source.path, source.content);
  const compilerStartedAt = performance.now();
  let compiler = "ecj";
  try {
    await window.cheerpjRunMain(
      "PcEcjCompile",
      ECJ_COMPILER_CLASSPATH,
      logPath,
      "-8",
      "-proc:none",
      "-nowarn",
      "-d",
      "/files/",
      ...sources.map((source) => source.path),
    );
  } catch (ecjError) {
    compiler = "javac-fallback";
    console.warn("[java-runtime] ECJ failed to start; falling back to javac.", ecjError);
    await window.cheerpjRunMain(
      "PcCompile",
      JAVAC_FALLBACK_CLASSPATH,
      logPath,
      "-d",
      "/files/",
      ...sources.map((source) => source.path),
    );
  }
  const log = await readVirtualFile(logPath);
  if (log === undefined) {
    throw new Error("The compiler finished but its log could not be read. Run again; reload the page if this repeats.");
  }
  const newlineAt = log.indexOf("\n");
  const statusLine = newlineAt === -1 ? log : log.slice(0, newlineAt);
  const diagnostics = newlineAt === -1 ? "" : log.slice(newlineAt + 1);
  const status = Number.parseInt(statusLine.trim(), 10);
  if (Number.isNaN(status)) {
    throw new Error("The compiler log had an unexpected shape. Run again; reload the page if this repeats.");
  }
  traceJavaStage("compile-finished", compilerStartedAt, { compiler, ok: status === 0, sources: sources.length });
  return { ok: status === 0, log: diagnostics.trim() };
}

/** Run a compiled class from /files/ and return the JVM exit code. */
export async function runJavaClass(className: string, args: string[]): Promise<number> {
  if (typeof window.cheerpjRunMain !== "function") {
    throw new Error("The Java runtime is not ready. Run again once it finishes loading.");
  }
  return window.cheerpjRunMain(className, "/files/", ...args);
}

export { readVirtualFile };

/**
 * Serialize runs: the runtime is a shared singleton, and overlapping
 * compiles would race on /files/ class output.
 */
export function acquireRunLock(): () => void {
  if (runInProgress) throw new Error("A run is already in progress. Wait for it to finish.");
  runInProgress = true;
  return () => {
    runInProgress = false;
  };
}
