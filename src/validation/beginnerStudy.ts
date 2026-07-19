export const BEGINNER_STUDY_VERSION = 1;
export const BEGINNER_STUDY_KEY = "patterncache.beginner-study.v1";

export interface BeginnerAnswerGrade {
  score: number;
  signals: string[];
  missing: string[];
}

export interface BeginnerStudySession {
  id: string;
  version: number;
  startedAt: number;
  eligibleFirstTimer: boolean;
  consented: boolean;
  preConfidence: number;
  preAnswer: string;
  preGrade: BeginnerAnswerGrade;
  missionOpenedAt?: number;
  missionCompletedAt?: number;
  missionEvidence: "verified-after-start" | "prior-evidence" | "self-attested" | "not-completed";
  postConfidence?: number;
  postAnswer?: string;
  postGrade?: BeginnerAnswerGrade;
  completedAt?: number;
  notes?: string;
}

export interface BeginnerStudyStore {
  active?: BeginnerStudySession;
  sessions: BeginnerStudySession[];
}

export function gradeBeginnerOwnershipAnswer(answer: string): BeginnerAnswerGrade {
  const text = answer.toLowerCase();
  const checks = [
    { label: "names the Shelf as owner", hit: /shelf/.test(text) },
    { label: "connects the action to the books it searches", hit: /book|copy|item|data|information/.test(text) && /find|search|available|look/.test(text) },
    { label: "keeps the Catalog coordinating shelves", hit: /catalog/.test(text) && /coordinat|ask|each shelf|across|delegate/.test(text) },
    { label: "contains future storage changes", hit: /change|storage|representation|format|future|contain/.test(text) },
    { label: "gives a causal reason", hit: /because|so that|therefore|owns|responsib/.test(text) },
  ];
  const signals = checks.filter((check) => check.hit).map((check) => check.label);
  return { score: signals.length * 20, signals, missing: checks.filter((check) => !check.hit).map((check) => check.label) };
}

export function startBeginnerStudy(input: { eligibleFirstTimer: boolean; consented: boolean; preConfidence: number; preAnswer: string; now?: number }): BeginnerStudySession {
  const now = input.now ?? Date.now();
  return {
    id: `beginner-${now}`,
    version: BEGINNER_STUDY_VERSION,
    startedAt: now,
    eligibleFirstTimer: input.eligibleFirstTimer,
    consented: input.consented,
    preConfidence: clampConfidence(input.preConfidence),
    preAnswer: input.preAnswer.trim(),
    preGrade: gradeBeginnerOwnershipAnswer(input.preAnswer),
    missionEvidence: input.eligibleFirstTimer ? "not-completed" : "prior-evidence",
  };
}

export function markMissionOpened(session: BeginnerStudySession, now = Date.now()): BeginnerStudySession {
  return session.missionOpenedAt ? session : { ...session, missionOpenedAt: now };
}

export function reconcileMissionEvidence(session: BeginnerStudySession, completedAt?: number): BeginnerStudySession {
  if (!completedAt) return session;
  if (completedAt >= session.startedAt) return { ...session, missionCompletedAt: completedAt, missionEvidence: "verified-after-start" };
  return session.missionEvidence === "not-completed" ? { ...session, missionEvidence: "prior-evidence" } : session;
}

export function selfAttestMissionReview(session: BeginnerStudySession, now = Date.now()): BeginnerStudySession {
  return { ...session, missionCompletedAt: now, missionEvidence: "self-attested" };
}

export function finishBeginnerStudy(session: BeginnerStudySession, input: { postConfidence: number; postAnswer: string; notes?: string; now?: number }): BeginnerStudySession {
  const now = input.now ?? Date.now();
  return {
    ...session,
    postConfidence: clampConfidence(input.postConfidence),
    postAnswer: input.postAnswer.trim(),
    postGrade: gradeBeginnerOwnershipAnswer(input.postAnswer),
    notes: input.notes?.trim() || undefined,
    completedAt: now,
  };
}

export function studyMetrics(session: BeginnerStudySession) {
  return {
    eligibleFirstTimer: session.eligibleFirstTimer,
    verifiedLearningLoop: session.missionEvidence === "verified-after-start",
    timeToStartSeconds: session.missionOpenedAt ? Math.max(0, Math.round((session.missionOpenedAt - session.startedAt) / 1000)) : undefined,
    completionMinutes: session.completedAt ? Math.max(0, Math.round((session.completedAt - session.startedAt) / 6000) / 10) : undefined,
    confidenceChange: session.postConfidence === undefined ? undefined : session.postConfidence - session.preConfidence,
    transferScoreChange: session.postGrade ? session.postGrade.score - session.preGrade.score : undefined,
  };
}

export function loadBeginnerStudyStore(): BeginnerStudyStore {
  try {
    const raw = typeof localStorage === "undefined" ? null : localStorage.getItem(BEGINNER_STUDY_KEY);
    if (!raw) return { sessions: [] };
    const parsed = JSON.parse(raw) as Partial<BeginnerStudyStore>;
    const active = sanitizeSession(parsed.active);
    const sessions = Array.isArray(parsed.sessions)
      ? parsed.sessions.map(sanitizeSession).filter((session): session is BeginnerStudySession => !!session?.completedAt)
      : [];
    return { active: active && !active.completedAt ? active : undefined, sessions };
  } catch {
    return { sessions: [] };
  }
}

export function saveBeginnerStudySession(session: BeginnerStudySession): BeginnerStudyStore {
  const store = loadBeginnerStudyStore();
  const sessions = session.completedAt
    ? [...store.sessions.filter((candidate) => candidate.id !== session.id), session]
    : store.sessions;
  const next = { active: session.completedAt ? undefined : session, sessions };
  try {
    localStorage.setItem(BEGINNER_STUDY_KEY, JSON.stringify(next));
  } catch {
    // The active page remains usable if persistence is unavailable.
  }
  return next;
}

export function clearActiveBeginnerStudy(): BeginnerStudyStore {
  const store = loadBeginnerStudyStore();
  const next = { sessions: store.sessions };
  try { localStorage.setItem(BEGINNER_STUDY_KEY, JSON.stringify(next)); } catch { /* no-op */ }
  return next;
}

export function exportBeginnerStudyData(): string {
  return JSON.stringify({ format: "patterncache-beginner-study", version: BEGINNER_STUDY_VERSION, exportedAt: Date.now(), ...loadBeginnerStudyStore() }, null, 2);
}

function clampConfidence(value: number): number {
  return Math.min(5, Math.max(1, Math.round(Number.isFinite(value) ? value : 1)));
}

function optionalTimestamp(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : undefined;
}

function sanitizeSession(value: unknown): BeginnerStudySession | undefined {
  if (!value || typeof value !== "object") return undefined;
  const session = value as Partial<BeginnerStudySession>;
  if (typeof session.id !== "string" || session.id.length > 120 || session.version !== BEGINNER_STUDY_VERSION) return undefined;
  if (!Number.isFinite(session.startedAt) || typeof session.eligibleFirstTimer !== "boolean" || typeof session.consented !== "boolean" || typeof session.preAnswer !== "string") return undefined;
  const validEvidence: BeginnerStudySession["missionEvidence"][] = ["verified-after-start", "prior-evidence", "self-attested", "not-completed"];
  const startedAt = Math.max(0, Math.floor(session.startedAt!));
  const missionCompletedAt = optionalTimestamp(session.missionCompletedAt);
  let missionEvidence = validEvidence.includes(session.missionEvidence!) ? session.missionEvidence! : "not-completed";
  if (missionEvidence === "verified-after-start" && (!missionCompletedAt || missionCompletedAt < startedAt)) missionEvidence = "not-completed";
  const postAnswer = typeof session.postAnswer === "string" ? session.postAnswer.trim() : undefined;
  return {
    id: session.id,
    version: BEGINNER_STUDY_VERSION,
    startedAt,
    eligibleFirstTimer: session.eligibleFirstTimer,
    consented: session.consented,
    preConfidence: clampConfidence(typeof session.preConfidence === "number" ? session.preConfidence : 1),
    preAnswer: session.preAnswer.trim(),
    preGrade: gradeBeginnerOwnershipAnswer(session.preAnswer),
    missionOpenedAt: optionalTimestamp(session.missionOpenedAt),
    missionCompletedAt,
    missionEvidence,
    postConfidence: typeof session.postConfidence === "number" ? clampConfidence(session.postConfidence) : undefined,
    postAnswer,
    postGrade: postAnswer === undefined ? undefined : gradeBeginnerOwnershipAnswer(postAnswer),
    completedAt: optionalTimestamp(session.completedAt),
    notes: typeof session.notes === "string" ? session.notes.trim().slice(0, 2000) || undefined : undefined,
  };
}
