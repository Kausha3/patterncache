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
  TargetLevel,
} from "@/course/coursePlan";
import { useCoursePlan } from "@/hooks/useCoursePlan";
import { useProgress } from "@/hooks/useProgress";
import { Button, Divider, Eyebrow, Panel } from "@/components/ui";
import { Icon } from "@/components/Icon";
import { GameHud } from "@/components/GameHud";
import { DailyBossBattle } from "@/components/DailyBossBattle";
import { AchievementShelf } from "@/components/AchievementShelf";
import { getCourseTaskXp } from "@/game/gameEngine";
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
  const { get } = useProgress();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(!preferences);
  const [draft, setDraft] = useState<CoursePreferences>(() => preferences ?? defaultPreferences());

  const plan = useMemo(() => buildCoursePlan(preferences?.length ?? draft.length), [preferences?.length, draft.length]);
  const currentDay = preferences ? getCurrentCourseDay(preferences.startDate, preferences.length) : 1;
  const [selectedDay, setSelectedDay] = useState(currentDay);

  useEffect(() => {
    setSelectedDay(currentDay);
  }, [currentDay, preferences?.length]);

  const isTaskComplete = (item: CourseTask): boolean =>
    item.lessonId ? get(item.lessonId).status === "completed" : completedTaskIds.includes(item.id);

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

  return (
    <div style={{ display: "grid", gap: 26 }}>
      <header className="course-hero">
        <div style={{ display: "grid", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 9, flexWrap: "wrap" }}>
            <Eyebrow tone={color.amber}>Amazon · {preferences.level} · {preferences.length}-day sprint</Eyebrow>
            <span style={{ fontFamily: font.mono, fontSize: 11.5, color: color.textFaint }}>
              {preferences.dailyMinutes} min/day
            </span>
          </div>
          <h1 style={{ fontSize: 30, fontWeight: 700, letterSpacing: "-0.65px" }}>Your interview campaign</h1>
          <p style={{ color: color.textDim, maxWidth: 660 }}>
            Follow the day, finish the cold work, and use the score, not time spent, to decide what comes back.
          </p>
        </div>
        <Button variant="ghost" onClick={() => {
          setDraft(preferences);
          setEditing(true);
        }}>
          Adjust plan
        </Button>
      </header>

      {preferences.level === "L4" && (
        <Panel
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
            alignItems: "center",
            gap: 18,
            borderColor: `${color.amber}55`,
            background: `linear-gradient(120deg, rgba(217,169,78,0.09), ${color.panel} 44%)`,
          }}
        >
          <div style={{ display: "grid", gap: 5 }}>
            <Eyebrow tone={color.amber}>SDE I technical priority</Eyebrow>
            <strong style={{ fontSize: 16 }}>Finish the DSA + LLD must-dos before broadening the course.</strong>
            <span style={{ color: color.textDim, fontSize: 12.5 }}>The mission board tracks exact questions, follow-up variations, and 1/3/7-day reviews.</span>
          </div>
          <Button accent={color.amber} iconRight="arrowRight" style={{ width: "fit-content", justifySelf: "start" }} onClick={() => navigate("/companies/amazon/sde1")}>
            Open SDE I mission
          </Button>
        </Panel>
      )}

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
              complete={isTaskComplete(item)}
              divided={index > 0}
              onOpen={item.route ? () => navigate(item.route!) : undefined}
              onToggle={item.lessonId ? undefined : () => toggleTask(item.id)}
            />
          ))}
        </div>
      </Panel>

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

      <DailyBossBattle />

      <GameHud />

      <AchievementShelf />
    </div>
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
          Start with Amazon, choose the level and runway, and PatternCache will turn the library into a daily sequence of learning, cold practice, mocks, and Leadership Principle stories.
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
          <SegmentedOptions<TargetLevel>
            value={draft.level}
            options={[
              { value: "L4", label: "L4 / SDE I" },
              { value: "L5", label: "L5 / SDE II" },
              { value: "L6", label: "L6 / SDE III+" },
            ]}
            onChange={(level) => onChange({ ...draft, level })}
          />
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

function SegmentedOptions<T extends string>({
  value,
  options,
  onChange,
}: {
  value: T;
  options: { value: T; label: string }[];
  onChange: (value: T) => void;
}) {
  return (
    <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
      {options.map((option) => {
        const selected = value === option.value;
        return (
          <button
            key={option.value}
            onClick={() => onChange(option.value)}
            aria-pressed={selected}
            style={{
              fontFamily: font.mono,
              fontSize: 12.5,
              fontWeight: 600,
              padding: "9px 13px",
              borderRadius: radius.md,
              border: `1px solid ${selected ? color.blue : color.panelBorder}`,
              background: selected ? "rgba(106,166,219,0.12)" : "transparent",
              color: selected ? color.text : color.textDim,
            }}
          >
            {option.label}
          </button>
        );
      })}
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
  complete,
  divided,
  onOpen,
  onToggle,
}: {
  item: CourseTask;
  complete: boolean;
  divided: boolean;
  onOpen?: () => void;
  onToggle?: () => void;
}) {
  const meta = KIND_META[item.kind];
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
          border: `1.5px solid ${complete ? color.teal : color.panelBorder}`,
          background: complete ? color.teal : "transparent",
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
          <span style={{ fontFamily: font.mono, fontSize: 9, fontWeight: 600, color: color.textFaint }}>+{getCourseTaskXp(item)} xp</span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: color.textDim, lineHeight: 1.5 }}>{item.description}</p>
      </div>
      <div className="course-task-actions">
        {onOpen && (
          <Button variant="ghost" iconRight="arrowRight" onClick={onOpen}>
            {complete ? "Review" : item.lessonId ? "Start" : "Open"}
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
