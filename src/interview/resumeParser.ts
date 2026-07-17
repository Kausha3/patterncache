/**
 * On-device resume and job-description parsing. Deliberately heuristic:
 * plain text in, structured facts out, and the UI shows every extracted
 * fact for the learner to correct before any question is generated. A
 * wrong parse should never silently produce a wrong interview.
 *
 * Nothing here leaves the browser.
 */

export interface ResumeClaim {
  text: string;
  /** The quantified fragment, when the claim carries one ("40%", "3x", "200ms"). */
  metric?: string;
}

export interface ResumeProject {
  title: string;
  techs: string[];
  claims: ResumeClaim[];
}

export interface ResumeFacts {
  projects: ResumeProject[];
  skills: string[];
}

export interface JobFacts {
  requirements: string[];
  techs: string[];
}

export interface FitReport {
  /** Techs the JD asks for that the resume shows evidence of. */
  matched: string[];
  /** JD requirements with no visible resume evidence: gap-probe material. */
  gaps: string[];
}

/** Common technology tokens worth recognizing in resumes and JDs. */
const TECH_DICTIONARY = [
  "java", "python", "javascript", "typescript", "go", "golang", "rust", "c++", "c#", "kotlin", "swift", "ruby", "scala", "php",
  "react", "angular", "vue", "next.js", "node", "node.js", "spring", "django", "flask", "rails", "express",
  "aws", "gcp", "azure", "lambda", "ec2", "s3", "dynamodb", "kubernetes", "docker", "terraform",
  "postgres", "postgresql", "mysql", "mongodb", "redis", "kafka", "rabbitmq", "sqs", "elasticsearch", "sql",
  "graphql", "grpc", "rest", "microservices", "ci/cd", "git", "linux", "android", "ios",
  "ml", "machine learning", "pytorch", "tensorflow", "llm", "spark", "airflow", "hadoop",
];

const METRIC_PATTERN = /(\d+(?:[.,]\d+)?\s*(?:%|percent|x\b|ms\b|s\b|sec|seconds|minutes|hours|days|users|customers|requests|qps|rps|records|rows|gb|tb|mb|k\b|m\b|million|thousand|billion)|\$\s?\d[\d,.]*)/i;

const ACTION_VERBS = [
  "built", "designed", "led", "created", "developed", "implemented", "launched", "shipped", "reduced", "increased",
  "improved", "migrated", "automated", "optimized", "optimised", "refactored", "owned", "wrote", "delivered",
  "architected", "scaled", "maintained", "deployed", "integrated", "debugged", "fixed", "mentored", "drove",
];

/** Section headers that mark the start of non-experience resume content. */
const NON_PROJECT_SECTIONS = /^(education|certifications?|awards?|languages?|interests?|hobbies|references)\b/i;
const SKILL_SECTION = /^(skills?|technical skills|technologies|tech stack|tools)\b/i;

function findTechs(text: string): string[] {
  const lower = ` ${text.toLowerCase()} `;
  const found: string[] = [];
  for (const tech of TECH_DICTIONARY) {
    const escaped = tech.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(`[^a-z0-9]${escaped}[^a-z0-9]`, "i");
    if (pattern.test(lower)) found.push(tech);
  }
  return [...new Set(found)];
}

function isBullet(line: string): boolean {
  return /^\s*[-*•·▪‣>]\s+/.test(line);
}

function stripBullet(line: string): string {
  return line.replace(/^\s*[-*•·▪‣>]\s+/, "").trim();
}

function looksLikeClaim(line: string): boolean {
  const lower = line.toLowerCase();
  return ACTION_VERBS.some((verb) => lower.includes(verb)) || METRIC_PATTERN.test(line);
}

/**
 * A heading line: short, not a bullet, not a sentence. Treated as a
 * project/role title that owns the bullets under it.
 */
function looksLikeHeading(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length === 0 || trimmed.length > 90) return false;
  if (/^\s*[-*•·▪‣>]/.test(line)) return false;
  if (/[.]\s*$/.test(trimmed)) return false;
  const words = trimmed.split(/\s+/);
  return words.length <= 12;
}

export function parseResume(raw: string): ResumeFacts {
  const lines = raw.split("\n").map((line) => line.replace(/\t/g, " ")).filter((line) => line.trim().length > 0);
  const projects: ResumeProject[] = [];
  const skills = new Set<string>();
  let current: ResumeProject | undefined;
  let inSkillSection = false;
  let inIgnoredSection = false;

  for (const line of lines) {
    const trimmed = line.trim();

    if (SKILL_SECTION.test(trimmed)) {
      inSkillSection = true;
      inIgnoredSection = false;
      for (const tech of findTechs(trimmed)) skills.add(tech);
      continue;
    }
    if (NON_PROJECT_SECTIONS.test(trimmed)) {
      inIgnoredSection = true;
      inSkillSection = false;
      continue;
    }

    if (inSkillSection) {
      for (const tech of findTechs(trimmed)) skills.add(tech);
      // A heading ends the skill section.
      if (looksLikeHeading(trimmed) && findTechs(trimmed).length === 0) inSkillSection = false;
      continue;
    }
    if (inIgnoredSection) continue;

    if (isBullet(line) || looksLikeClaim(trimmed)) {
      const text = stripBullet(line);
      if (text.length < 12) continue;
      if (!current) {
        current = { title: "Experience", techs: [], claims: [] };
        projects.push(current);
      }
      const metric = text.match(METRIC_PATTERN)?.[1];
      current.claims.push(metric ? { text, metric } : { text });
      for (const tech of findTechs(text)) {
        current.techs.push(tech);
        skills.add(tech);
      }
      current.techs = [...new Set(current.techs)];
      continue;
    }

    if (looksLikeHeading(trimmed)) {
      current = { title: trimmed, techs: findTechs(trimmed), claims: [] };
      for (const tech of current.techs) skills.add(tech);
      projects.push(current);
    }
  }

  return {
    // Headings with no claims under them are noise (name, city, contact line).
    projects: projects.filter((project) => project.claims.length > 0),
    skills: [...skills],
  };
}

export function parseJobDescription(raw: string): JobFacts {
  const lines = raw.split("\n").map((line) => line.trim()).filter((line) => line.length > 0);
  const requirements: string[] = [];
  for (const line of lines) {
    const text = stripBullet(line);
    if (text.length < 15 || text.length > 220) continue;
    const lower = text.toLowerCase();
    const requirementish =
      /^\s*[-*•·▪‣>]/.test(line) ||
      /\b(experience|years|proficien|familiar|knowledge of|ability to|degree|strong|expertise|responsib|you will|must have|required|preferred)\b/i.test(lower);
    if (requirementish) requirements.push(text);
  }
  return { requirements: [...new Set(requirements)], techs: findTechs(raw) };
}

export function computeFit(resume: ResumeFacts, job: JobFacts): FitReport {
  const resumeTechs = new Set(resume.skills.map((skill) => skill.toLowerCase()));
  const matched = job.techs.filter((tech) => resumeTechs.has(tech.toLowerCase()));
  const matchedSet = new Set(matched.map((tech) => tech.toLowerCase()));
  const gaps: string[] = [];
  for (const requirement of job.requirements) {
    const requirementTechs = findTechs(requirement);
    if (requirementTechs.length === 0) continue;
    if (requirementTechs.every((tech) => !matchedSet.has(tech.toLowerCase()) && !resumeTechs.has(tech.toLowerCase()))) {
      gaps.push(requirement);
    }
  }
  return { matched, gaps: gaps.slice(0, 6) };
}
