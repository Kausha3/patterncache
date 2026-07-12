import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import type { ProgressMap, LessonProgress, Confidence, LessonStatus } from "@/types";
import { loadProgress, saveProgress, markStatus, setConfidence } from "@/state/progress";

interface ProgressCtx {
  progress: ProgressMap;
  get: (id: string) => LessonProgress;
  setStatus: (id: string, status: LessonStatus) => void;
  setConfidence: (id: string, c: Confidence) => void;
}

const Ctx = createContext<ProgressCtx | null>(null);

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState<ProgressMap>(() => loadProgress());

  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  const get = useCallback(
    (id: string): LessonProgress => progress[id] ?? { status: "not-started" },
    [progress],
  );

  const setStatus = useCallback((id: string, status: LessonStatus) => {
    setProgress((m) => markStatus(m, id, status));
  }, []);

  const setConf = useCallback((id: string, c: Confidence) => {
    setProgress((m) => setConfidence(m, id, c));
  }, []);

  const value = useMemo<ProgressCtx>(
    () => ({ progress, get, setStatus, setConfidence: setConf }),
    [progress, get, setStatus, setConf],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useProgress(): ProgressCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProgress must be used within <ProgressProvider>");
  return ctx;
}
