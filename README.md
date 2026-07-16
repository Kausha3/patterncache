# PatternCache

PatternCache is an interactive interview-preparation app for learning the reasoning behind DSA patterns, high-level system design, and low-level object design.

The current experience includes:

- An Amazon-focused 15- or 30-day campaign with daily tasks, progress gating, confidence tracking, and mock-interview days.
- Nine timed Arena simulations across coding-pattern recognition, production system incidents, and LLD responsibility/state decisions.
- Three executable Coding Combat missions with a JavaScript editor, visible and hidden tests, progressive hints, and invariant/complexity/counterexample defense rounds.
- Three LLD Design Studio missions with responsibility assignment, live Java skeleton generation, requirement mutations, deterministic design metrics, and boundary-by-boundary debriefs.
- Daily boss battles, XP, ranks, streaks, and evidence-based achievements.
- Interactive Java exercises and visual design lessons that reveal the reasoning before asking the learner to defend it.
- Device-local persistence with no account required.

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite. The app uses hash routing, so it works on static hosting without route rewrites.

## Verify

```bash
npm test
npm run typecheck
npm run build
```

## Project map

```text
src/
  arena/       Typed Arena challenges and scoring logic
  course/      15/30-day curriculum generation and scheduling
  game/        XP, rank, streak, boss, and achievement rules
  content/     Lesson and company-specific interview content
  components/  Reusable learning and simulation interfaces
  hooks/       Local persistence and application state providers
  pages/       Routed product surfaces
  theme/       Design tokens and responsive styles
```

Course, game, and Arena rules are kept outside React components so their behavior can be unit tested without a browser. The heavier course editor and Arena experience are route-split to keep the initial page lean.

Coding Combat executes learner code inside a short-lived Web Worker. The runner clones test inputs, blocks direct result messaging and common fetch/import APIs, terminates unresponsive executions after 1.8 seconds, and disposes the worker after every run. Hidden tests reveal pass/fail status without exposing private inputs.

## Add an Arena encounter

Add a typed `ArenaChallenge` to the appropriate mode in `src/arena/arenaChallenges.ts`. Each encounter must include one correct choice, targeted feedback for every rejected choice, a transferable takeaway, and a visual node model. The validation tests enforce unique IDs and exactly one correct response.

Executable missions live in `src/arena/codingCombatMissions.ts`. Each mission includes a browser-safe function contract, at least three visible tests, at least four hidden tests, three progressive hints, and exactly one defensible answer for each reasoning follow-up.

LLD Studio missions live in `src/arena/lldStudioMissions.ts`. Each model defines six candidate types, six responsibility decisions, three change-pressure mutations, and one design defense. Scoring and Java generation remain pure in `src/arena/lldStudioEngine.ts`, so content and model behavior can be validated without rendering React.

## Persistence

Progress is stored in browser `localStorage`. Arena XP is based on each mode's best score, so replaying a completed simulation improves mastery without farming unlimited XP.
