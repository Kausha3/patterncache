import { useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import {
  buildCoursePlan,
  formatLocalDate,
  getCurrentCourseDay,
  getDayMinutes,
  getDaysUntil,
} from "@/course/coursePlan";
import type {
  CourseLength,
  CoursePreferences,
  CourseTask,
  CourseTaskKind,
} from "@/course/coursePlan";
import { useCoursePlan } from "@/hooks/useCoursePlan";
import { useGameProgress } from "@/hooks/useGameProgress";
import { useProgress } from "@/hooks/useProgress";
import { useAmazonPrepProgress } from "@/hooks/useAmazonPrepProgress";
import { Button, Divider, Eyebrow, Panel } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { loadHldVerificationProgress } from "@/game/hldVerificationProgress";
import { loadLldVerificationProgress } from "@/game/lldVerificationProgress";
import { loadParkingLotGauntletProgress } from "@/game/parkingLotGauntletProgress";
import { LLD_VERIFICATION_WORLDS } from "@/arena/lldVerificationWorlds";
import {
  buildCourseAmazonEvidence,
  getCourseRetryQueue,
  getCourseTaskCompletion,
  getDueCourseReviews,
  getNextCourseTask,
  getScheduledCourseTasks,
  type CourseEvidenceSnapshot,
  type CourseTaskCompletion,
  type ScheduledCourseTask,
} from "@/course/courseEvidence";
import { color, font, radius, motion } from "@/theme/tokens";

const KIND_META: Record<CourseTaskKind, { label: string; tone: string }> = {
  lesson: { label: "Lesson", tone: color.violet },
  coding: { label: "Coding", tone: color.teal },
  design: { label: "Design", tone: color.blue },
  behavioral: { label: "LP story", tone: color.amber },
  review: { label: "Review", tone: color.textDim },
  mock: { label: "Timed mock", tone: color.red },
};

function defaultPreferences(): CoursePreferences {
  return {
    company: "amazon",
    level: "L4",
    length: 15,
    dailyMinutes: 120,
    startDate: formatLocalDate(new Date()),
  };
}

export function CoursePage() {
  const { preferences, completedTaskIds, savePreferences, toggleTask } = useCoursePlan();
  const { progress } = useProgress();
  const game = useGameProgress();
  const { records: amazonRecords, syncProof } = useAmazonPrepProgress();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(!preferences);
  const [draft, setDraft] = useState<CoursePreferences>(() => preferences ?? defaultPreferences());

  const plan = useMemo(() => buildCoursePlan(preferences?.length ?? draft.length), [preferences?.length, draft.length]);
  const currentDay = preferences ? getCurrentCourseDay(preferences.startDate, preferences.length) : 1;
  const [selectedDay, setSelectedDay] = useState(currentDay);

  // These stores are written inside their mission routes. CoursePage remounts
  // when the learner returns, so one read per mount keeps the evidence snapshot
  // stable without polling or mirroring storage into more React state.
  const hldProgress = useMemo(() => loadHldVerificationProgress(), []);
  const lldWorldRecords = useMemo(() => Object.fromEntries(
    LLD_VERIFICATION_WORLDS.map((world) => [world.id, loadLldVerificationProgress(world).record]),
  ), []);
  const parkingLotRecord = useMemo(() => loadParkingLotGauntletProgress().record, []);
  const evidenceSnapshot: CourseEvidenceSnapshot = useMemo(() => ({
    codingCombatScores: game.codingCombatScores,
    hldWorldRecords: hldProgress.records,
    lldWorldRecords,
    parkingLotRecord,
    lessonProgress: progress,
    manuallyCompletedTaskIds: completedTaskIds,
  }), [completedTaskIds, game.codingCombatScores, hldProgress.records, lldWorldRecords, parkingLotRecord, progress]);
  const scheduledTasks = useMemo(() => getScheduledCourseTasks(plan, evidenceSnapshot), [evidenceSnapshot, plan]);
  const completionById = useMemo(
    () => new Map(scheduledTasks.map((item) => [item.task.id, item.completion])),
    [scheduledTasks],
  );

  useEffect(() => {
    setSelectedDay(currentDay);
  }, [currentDay, preferences?.length]);

  const completionFor = (item: CourseTask): CourseTaskCompletion =>
    completionById.get(item.id) ?? getCourseTaskCompletion(item, evidenceSnapshot);
  const isTaskComplete = (item: CourseTask): boolean => completionFor(item).complete;

  useEffect(() => {
    for (const item of scheduledTasks) {
      const evidence = buildCourseAmazonEvidence(item.task, item.completion);
      if (evidence && item.task.questionId) syncProof(item.task.questionId, evidence);
    }
  }, [scheduledTasks, syncProof]);

  const totalTasks = plan.reduce((total, day) => total + day.tasks.length, 0);
  const completedTasks = plan.reduce(
    (total, day) => total + day.tasks.filter(isTaskComplete).length,
    0,
  );

  if (editing || !preferences) {
    return (
      <CourseSetup
        draft={draft}
        isEditing={!!preferences}
        onChange={setDraft}
        onCancel={preferences ? () => setEditing(false) : undefined}
        onSave={() => {
          savePreferences({
            ...draft,
            startDate: preferences?.startDate ?? formatLocalDate(new Date()),
            interviewDate: draft.interviewDate || undefined,
          });
          setEditing(false);
        }}
      />
    );
  }

  const day = plan[selectedDay - 1];
  const countdown = getDaysUntil(preferences.interviewDate);
  const progressPct = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);
  const selectedComplete = day.tasks.filter(isTaskComplete).length;
  const dueReviews = getDueCourseReviews(plan, evidenceSnapshot, amazonRecords);
  const retryQueue = getCourseRetryQueue(plan, currentDay, evidenceSnapshot, amazonRecords);
  const scheduledNextTask = getNextCourseTask(plan, currentDay, evidenceSnapshot);
  const nextTask = dueReviews[0] ?? retryQueue[0] ?? scheduledNextTask;
  const nextTaskMode = dueReviews[0] ? "review" : retryQueue[0] ? "retry" : "schedule";

  const openCourseTask = (item: ScheduledCourseTask) => {
    if (item.task.route) {
      navigate(item.task.route);
      return;
    }
    setSelectedDay(item.day);
    requestAnimationFrame(() => document.getElementById("course-day")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  return (
    <div style={{ display: "grid", gap: 26 }}>
      <header className="course-hero">
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
            <Eyebrow tone={color.amber}>Amazon · SDE I / L4 · {preferences.length}-day sprint</Eyebrow>
            <span style={{ fontFamily: font.mono, fontSize: 11.5, color: color.textFaint }}>
              {preferences.dailyMinutes} min/day
            </span>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.65px" }}>Your interview campaign</h1>
          <p style={{ color: color.textDim, maxWidth: 660 }}>
            Every technical task completes from real mission evidence. Today gives you one next action, then brings weak work back on a 1/3/7-day review loop.
          </p>
        </div>
        <Button variant="ghost" onClick={() => {
          setDraft(preferences);
          setEditing(true);
        }}>
          Adjust plan
        </Button>
      </header>

      <NextMissionPanel item={nextTask} mode={nextTaskMode} currentDay={currentDay} onOpen={openCourseTask} />

      <div className="course-stat-grid">
        <StatCard label="Today" value={`Day ${currentDay}`} note={`of ${preferences.length}`} tone={color.blue} />
        <StatCard label="Course progress" value={`${progressPct}%`} note={`${completedTasks} / ${totalTasks} tasks`} tone={color.teal} />
        <StatCard
          label="Interview"
          value={countdown === undefined ? "Not set" : countdown < 0 ? "Passed" : countdown === 0 ? "Today" : `${countdown} days`}
          note={preferences.interviewDate ?? "Add a date to see the countdown"}
          tone={countdown !== undefined && countdown <= 3 ? color.red : color.amber}
        />
      </div>

      {(dueReviews.length > 0 || retryQueue.length > 0) && (
        <section className="course-recovery-grid" aria-label="Review and retry queue">
          <CourseQueue
            title="Review due"
            description="The 1/3/7-day schedule brought these back. Clear the exact mission again; opening it alone changes nothing."
            tone={color.amber}
            items={dueReviews.slice(0, 3)}
            emptyCopy="No spaced reviews are due."
            onOpen={(route) => navigate(route)}
          />
          <CourseQueue
            title="Needs another pass"
            description="These were marked Learning and still have no machine-verified clear."
            tone={color.red}
            items={retryQueue.slice(0, 3)}
            emptyCopy="No started mission is waiting for proof."
            onOpen={(route) => navigate(route)}
          />
        </section>
      )}

      <div id="course-day">
        <Panel style={{ display: "grid", gap: 18, padding: 0, overflow: "hidden" }} raised>
          <div className="course-day-header">
            <div style={{ display: "grid", gap: 5 }}>
              <Eyebrow tone={selectedDay === currentDay ? color.blue : color.textDim}>
                Day {day.day} · {selectedComplete} / {day.tasks.length} complete
              </Eyebrow>
              <h2 style={{ fontSize: 23, letterSpacing: "-0.4px" }}>{day.title}</h2>
              <p style={{ color: color.textDim }}>{day.focus}</p>
            </div>
            <div style={{ textAlign: "right", flexShrink: 0 }}>
              <div style={{ fontFamily: font.mono, fontSize: 20, fontWeight: 700 }}>{getDayMinutes(day)} min</div>
              <div style={{ fontSize: 12, color: color.textFaint }}>estimated work</div>
            </div>
          </div>

          <div style={{ display: "grid" }}>
            {day.tasks.map((item, index) => (
              <CourseTaskRow
                key={item.id}
                item={item}
                completion={completionFor(item)}
                divided={index > 0}
                onOpen={item.route ? () => navigate(item.route!) : undefined}
                onToggle={item.evidence || item.lessonId ? undefined : () => toggleTask(item.id)}
              />
            ))}
          </div>
        </Panel>
      </div>

      <section style={{ display: "grid", gap: 12 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 12 }}>
          <Eyebrow>Course map</Eyebrow>
          <span style={{ fontSize: 12.5, color: color.textFaint }}>Select any day to inspect or catch up</span>
        </div>
        <div className="course-day-grid">
          {plan.map((courseDay) => {
            const done = courseDay.tasks.every(isTaskComplete);
            const active = courseDay.day === selectedDay;
            const today = courseDay.day === currentDay;
            return (
              <button
                key={courseDay.day}
                onClick={() => setSelectedDay(courseDay.day)}
                aria-current={today ? "date" : undefined}
                aria-pressed={active}
                style={{
                  display: "grid",
                  gap: 4,
                  textAlign: "left",
                  minHeight: 82,
                  padding: "11px 12px",
                  borderRadius: radius.md,
                  border: `1px solid ${active ? color.blue : done ? `${color.teal}77` : color.panelBorder}`,
                  background: active ? "rgba(106,166,219,0.11)" : done ? "rgba(91,176,173,0.06)" : color.panel,
                  transition: `all ${motion.fast}`,
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 6 }}>
                  <span style={{ fontFamily: font.mono, fontSize: 11, color: today ? color.blue : color.textFaint }}>DAY {courseDay.day}</span>
                  {done && <Icon name="check" size={13} color={color.teal} strokeWidth={2.3} />}
                </div>
                <span style={{ fontSize: 12.5, fontWeight: 600, lineHeight: 1.35 }}>{courseDay.title}</span>
              </button>
            );
          })}
        </div>
      </section>

    </div>
  );
}

function NextMissionPanel({ item, mode, currentDay, onOpen }: {
  item?: ScheduledCourseTask;
  mode: "review" | "retry" | "schedule";
  currentDay: number;
  onOpen: (item: ScheduledCourseTask) => void;
}) {
  if (!item) {
    return (
      <Panel className="course-next-mission complete" raised>
        <div>
          <Eyebrow tone={color.green}>Campaign evidence complete</Eyebrow>
          <strong>Every scheduled task has a recorded outcome.</strong>
          <span>Use the review queue when a 1/3/7-day transfer becomes due.</span>
        </div>
        <Icon name="check" size={24} color={color.green} />
      </Panel>
    );
  }
  const today = item.day === currentDay;
  const eyebrow = mode === "review"
    ? "Spaced review due"
    : mode === "retry"
      ? "Repair before moving on"
      : item.day < currentDay
        ? `Catch up from Day ${item.day}`
        : today
          ? "Continue today"
          : `Day ${currentDay} complete · next is Day ${item.day}`;
  const action = mode === "review"
    ? "Run the due review"
    : mode === "retry"
      ? "Retry the mission"
      : item.task.route
        ? today ? "Continue today's mission" : item.day < currentDay ? "Resume missed mission" : `Preview Day ${item.day}`
        : "Open today's checklist";
  return (
    <Panel className="course-next-mission" raised>
      <div className="course-next-copy">
        <Eyebrow tone={mode === "retry" ? color.red : color.amber}>{eyebrow}</Eyebrow>
        <strong>{item.task.title}</strong>
        <span>{item.task.description}</span>
        <small><Icon name={item.task.evidence ? "shield" : "insight"} size={13} /> {item.completion.label}</small>
      </div>
      <Button accent={mode === "retry" ? color.red : color.amber} iconRight="arrowRight" onClick={() => onOpen(item)}>
        {action}
      </Button>
    </Panel>
  );
}

function CourseQueue({ title, description, tone, items, emptyCopy, onOpen }: {
  title: string;
  description: string;
  tone: string;
  items: ScheduledCourseTask[];
  emptyCopy: string;
  onOpen: (route: string) => void;
}) {
  return (
    <Panel style={{ display: "grid", gap: 11 }}>
      <div style={{ display: "grid", gap: 4 }}>
        <Eyebrow tone={tone}>{title}</Eyebrow>
        <span style={{ color: color.textDim, fontSize: 12.5, lineHeight: 1.5 }}>{description}</span>
      </div>
      {items.length > 0 ? items.map((item) => (
        <div className="course-queue-item" key={`${title}-${item.task.id}`}>
          <div><strong>{item.task.title}</strong><small>Scheduled Day {item.day}</small></div>
          {item.task.route ? <Button variant="ghost" iconRight="arrowRight" onClick={() => onOpen(item.task.route!)}>Run proof</Button> : null}
        </div>
      )) : <span style={{ color: color.textFaint, fontSize: 12 }}>{emptyCopy}</span>}
    </Panel>
  );
}

function CourseSetup({
  draft,
  isEditing,
  onChange,
  onSave,
  onCancel,
}: {
  draft: CoursePreferences;
  isEditing: boolean;
  onChange: (next: CoursePreferences) => void;
  onSave: () => void;
  onCancel?: () => void;
}) {
  const plan = buildCoursePlan(draft.length);
  const averageMinutes = Math.round(plan.reduce((total, day) => total + getDayMinutes(day), 0) / plan.length);

  return (
    <div style={{ display: "grid", gap: 24, maxWidth: 820 }}>
      <header style={{ display: "grid", gap: 9 }}>
        <Eyebrow tone={color.amber}>Interview campaign setup</Eyebrow>
        <h1 style={{ fontSize: 31, fontWeight: 700, letterSpacing: "-0.7px" }}>
          Build the plan you can actually follow.
        </h1>
        <p style={{ color: color.textDim, maxWidth: 650, lineHeight: 1.65 }}>
          Start with Amazon, choose the level and runway, and PatternCache will schedule every must-do DSA and LLD mission once before the final mocks. Technical work completes only when its verifier passes.
        </p>
      </header>

      <Panel style={{ display: "grid", gap: 22 }} raised>
        <SetupSection label="Target company">
          <div className="setup-choice selected" aria-label="Amazon selected">
            <span style={{ fontFamily: font.mono, fontWeight: 700 }}>Amazon</span>
            <span style={{ fontSize: 12, color: color.textDim }}>Company overlays for more employers can use this same course engine.</span>
          </div>
        </SetupSection>

        <Divider />

        <SetupSection label="Target level">
          <div className="setup-choice selected" aria-label="Amazon SDE I selected">
            <span style={{ fontFamily: font.mono, fontWeight: 700 }}>SDE I / L4</span>
            <span style={{ fontSize: 12, color: color.textDim }}>This release verifies the Amazon SDE I must-do set. Higher-level courses need their own researched content and proof bar.</span>
          </div>
        </SetupSection>

        <Divider />

        <SetupSection label="Runway">
          <div className="plan-choice-grid">
            {([15, 30] as CourseLength[]).map((length) => {
              const selected = draft.length === length;
              return (
                <button
                  key={length}
                  onClick={() => onChange({ ...draft, length })}
                  aria-pressed={selected}
                  className="plan-choice"
                  style={{
                    borderColor: selected ? color.blue : color.panelBorder,
                    background: selected ? "rgba(106,166,219,0.1)" : "rgba(255,255,255,0.02)",
                  }}
                >
                  <span style={{ fontFamily: font.mono, fontSize: 19, fontWeight: 700 }}>{length} days</span>
                  <span style={{ color: color.textDim, fontSize: 13, lineHeight: 1.5 }}>
                    {length === 15 ? "Interview sprint · faster, denser days" : "Full course · more repetition and recovery"}
                  </span>
                </button>
              );
            })}
          </div>
          <span style={{ color: color.textFaint, fontSize: 12.5 }}>
            This plan averages {averageMinutes} minutes of assigned work per day. Adjust the daily target below for your calendar.
          </span>
        </SetupSection>

        <Divider />

        <div className="setup-input-grid">
          <label style={{ display: "grid", gap: 7 }}>
            <Eyebrow>Daily target</Eyebrow>
            <select
              value={draft.dailyMinutes}
              onChange={(event) => onChange({ ...draft, dailyMinutes: Number(event.target.value) })}
              className="setup-input"
            >
              <option value={60}>60 minutes</option>
              <option value={90}>90 minutes</option>
              <option value={120}>2 hours</option>
              <option value={150}>2.5 hours</option>
            </select>
          </label>
          <label style={{ display: "grid", gap: 7 }}>
            <Eyebrow>Interview date · optional</Eyebrow>
            <input
              type="date"
              min={formatLocalDate(new Date())}
              value={draft.interviewDate ?? ""}
              onChange={(event) => onChange({ ...draft, interviewDate: event.target.value || undefined })}
              className="setup-input"
            />
          </label>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
          <Button icon="play" onClick={onSave}>{isEditing ? "Save changes" : "Build my Amazon plan"}</Button>
          {onCancel && <Button variant="subtle" onClick={onCancel}>Cancel</Button>}
          <span style={{ marginLeft: "auto", fontSize: 12, color: color.textFaint }}>saved on this device</span>
        </div>
      </Panel>
    </div>
  );
}

function SetupSection({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div style={{ display: "grid", gap: 11 }}>
      <Eyebrow>{label}</Eyebrow>
      {children}
    </div>
  );
}

function StatCard({ label, value, note, tone }: { label: string; value: string; note: string; tone: string }) {
  return (
    <Panel style={{ display: "grid", gap: 5, padding: "16px 18px" }}>
      <Eyebrow tone={tone}>{label}</Eyebrow>
      <span style={{ fontFamily: font.mono, fontSize: 20, fontWeight: 700 }}>{value}</span>
      <span style={{ fontSize: 12, color: color.textFaint }}>{note}</span>
    </Panel>
  );
}

function CourseTaskRow({
  item,
  completion,
  divided,
  onOpen,
  onToggle,
}: {
  item: CourseTask;
  completion: CourseTaskCompletion;
  divided: boolean;
  onOpen?: () => void;
  onToggle?: () => void;
}) {
  const meta = KIND_META[item.kind];
  const complete = completion.complete;
  const completionTone = completion.kind === "verified" ? color.green : completion.kind === "self-attested" ? color.amber : color.textFaint;
  return (
    <div
      className="course-task-row"
      style={{ borderTop: divided ? `1px solid ${color.hairline}` : "none" }}
    >
      <span
        aria-hidden
        style={{
          width: 24,
          height: 24,
          display: "grid",
          placeItems: "center",
          borderRadius: 999,
          border: `1.5px solid ${complete ? completionTone : color.panelBorder}`,
          background: complete ? completionTone : "transparent",
          color: "#12211F",
          flexShrink: 0,
        }}
      >
        {complete && <Icon name="check" size={14} strokeWidth={2.4} />}
      </span>
      <div style={{ display: "grid", gap: 5, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
          <span style={{ fontWeight: 650, color: complete ? color.textDim : color.text }}>{item.title}</span>
          <span style={{ fontFamily: font.mono, fontSize: 9.5, letterSpacing: "0.7px", textTransform: "uppercase", color: meta.tone }}>
            {meta.label}
          </span>
          <span style={{ fontFamily: font.mono, fontSize: 10.5, color: color.textFaint }}>{item.minutes} min</span>
          <span className={`course-proof-badge ${completion.kind}`}>
            {completion.kind === "verified" ? "Machine verified" : completion.kind === "self-attested" ? "Self-attested" : item.evidence ? "Proof required" : "Reflection"}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: color.textDim, lineHeight: 1.5 }}>{item.description}</p>
        <small style={{ color: completionTone, fontSize: 11 }}>{completion.label}</small>
      </div>
      <div className="course-task-actions">
        {onOpen && (
          <Button variant="ghost" iconRight="arrowRight" onClick={onOpen}>
            {complete ? "Run review" : item.evidence ? "Start proof" : item.lessonId ? "Start" : "Open"}
          </Button>
        )}
        {onToggle && (
          <Button variant={complete ? "subtle" : "primary"} icon={complete ? "reset" : "check"} onClick={onToggle}>
            {complete ? "Undo" : "Mark done"}
          </Button>
        )}
      </div>
    </div>
  );
}
