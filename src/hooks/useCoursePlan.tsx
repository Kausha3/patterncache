import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { formatLocalDate } from "@/course/coursePlan";
import type { CoursePreferences } from "@/course/coursePlan";

interface CourseState {
  preferences?: CoursePreferences;
  completedTaskIds: string[];
  completedTaskDates: Record<string, string>;
}

interface CoursePlanContextValue extends CourseState {
  savePreferences: (preferences: CoursePreferences) => void;
  toggleTask: (taskId: string) => void;
}

const STORAGE_KEY = "patterncache.course.v1";
const CoursePlanContext = createContext<CoursePlanContextValue | null>(null);
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function sanitizePreferences(value: unknown): CoursePreferences | undefined {
  if (!value || typeof value !== "object") return undefined;
  const candidate = value as Partial<CoursePreferences>;
  const dailyMinutes = candidate.dailyMinutes;
  if (candidate.length !== 15 && candidate.length !== 30) return undefined;
  if (typeof dailyMinutes !== "number" || !Number.isFinite(dailyMinutes) || dailyMinutes <= 0) return undefined;
  if (typeof candidate.startDate !== "string" || !DATE_PATTERN.test(candidate.startDate)) return undefined;
  return {
    company: "amazon",
    level: "L4",
    length: candidate.length,
    dailyMinutes: Math.floor(dailyMinutes),
    startDate: candidate.startDate,
    ...(typeof candidate.interviewDate === "string" && DATE_PATTERN.test(candidate.interviewDate)
      ? { interviewDate: candidate.interviewDate }
      : {}),
  };
}

export function parseCourseState(raw: string | null): CourseState {
  if (!raw) return { completedTaskIds: [], completedTaskDates: {} };
  try {
    const parsed = JSON.parse(raw) as Partial<CourseState>;
    const completedTaskDates = parsed.completedTaskDates && typeof parsed.completedTaskDates === "object"
      ? Object.fromEntries(
          Object.entries(parsed.completedTaskDates).filter((entry): entry is [string, string] => typeof entry[1] === "string"),
        )
      : {};
    return {
      preferences: sanitizePreferences(parsed.preferences),
      completedTaskIds: Array.isArray(parsed.completedTaskIds)
        ? [...new Set(parsed.completedTaskIds.filter((id): id is string => typeof id === "string"))]
        : [],
      completedTaskDates,
    };
  } catch {
    return { completedTaskIds: [], completedTaskDates: {} };
  }
}

function loadCourseState(): CourseState {
  try {
    return parseCourseState(localStorage.getItem(STORAGE_KEY));
  } catch {
    return { completedTaskIds: [], completedTaskDates: {} };
  }
}

function saveCourseState(state: CourseState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // Private mode or storage pressure: keep the active in-memory experience.
  }
}

export function CoursePlanProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<CourseState>(() => loadCourseState());

  useEffect(() => {
    saveCourseState(state);
  }, [state]);

  const savePreferences = useCallback((preferences: CoursePreferences) => {
    setState((current) => ({ ...current, preferences: { ...preferences, company: "amazon", level: "L4" } }));
  }, []);

  const toggleTask = useCallback((taskId: string) => {
    setState((current) => {
      const exists = current.completedTaskIds.includes(taskId);
      return {
        ...current,
        completedTaskIds: exists
          ? current.completedTaskIds.filter((id) => id !== taskId)
          : [...current.completedTaskIds, taskId],
        completedTaskDates: exists
          ? Object.fromEntries(Object.entries(current.completedTaskDates).filter(([id]) => id !== taskId))
          : { ...current.completedTaskDates, [taskId]: formatLocalDate(new Date()) },
      };
    });
  }, []);

  const value = useMemo<CoursePlanContextValue>(
    () => ({ ...state, savePreferences, toggleTask }),
    [state, savePreferences, toggleTask],
  );

  return <CoursePlanContext.Provider value={value}>{children}</CoursePlanContext.Provider>;
}

export function useCoursePlan(): CoursePlanContextValue {
  const context = useContext(CoursePlanContext);
  if (!context) throw new Error("useCoursePlan must be used within <CoursePlanProvider>");
  return context;
}
