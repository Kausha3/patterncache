import type { ProgressMap, LessonProgress, Confidence, LessonStatus } from "@/types";

/**
 * Local-first progress (§6, §7). No account, no backend — the whole progress
 * object is this small map in localStorage. An optional sync layer can later
 * ship exactly this object; nothing here assumes a server.
 */

const KEY = "patterncache.progress.v1";

export function loadProgress(): ProgressMap {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? (parsed as ProgressMap) : {};
  } catch {
    return {};
  }
}

export function saveProgress(map: ProgressMap): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(map));
  } catch {
    /* private mode / quota — degrade to in-memory silently */
  }
}

function patch(map: ProgressMap, id: string, next: Partial<LessonProgress>): ProgressMap {
  const prev = map[id] ?? { status: "not-started" as LessonStatus };
  return { ...map, [id]: { ...prev, ...next, lastVisited: Date.now() } };
}

export function markStatus(map: ProgressMap, id: string, status: LessonStatus): ProgressMap {
  // Never downgrade a completed lesson back to in-progress on revisit.
  const prev = map[id];
  if (prev?.status === "completed" && status === "in-progress") {
    return patch(map, id, {});
  }
  return patch(map, id, { status });
}

export function setConfidence(map: ProgressMap, id: string, confidence: Confidence): ProgressMap {
  return patch(map, id, { status: "completed", confidence });
}
