# PatternCache

PatternCache is an interactive interview-preparation app for learning the reasoning behind DSA patterns, high-level system design, and low-level object design.

The current experience includes:

- An Amazon-focused 15- or 30-day campaign with daily tasks, progress gating, confidence tracking, and mock-interview days.
- Nine timed Arena simulations across coding-pattern recognition, production system incidents, and LLD responsibility/state decisions.
- Twenty executable Coding Combat missions with real in-browser Java, including tree and linked-list structures, visible and hidden tests, progressive hints, and invariant/complexity/counterexample defense rounds.
- Three LLD Design Studio missions with responsibility assignment, live Java skeleton generation, requirement mutations, deterministic design metrics, and boundary-by-boundary debriefs.
- Daily boss battles, XP, ranks, streaks, and evidence-based achievements.
- Interactive Java exercises and visual design lessons that reveal the reasoning before asking the learner to defend it.
- A deterministic resume-based mock interviewer with General, Amazon, and research-backed Google packs, plus optional question playback and push-to-speak transcription. Resume parsing and coaching stay local; the UI discloses that Chrome may send microphone audio to Google's speech service before requesting access.
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

Coding Combat compiles `Solution.java` with `javac` inside CheerpJ, runs it on the in-browser JVM, and reads a machine-written test report. The generated harness validates typed inputs, isolates each test failure, captures compiler diagnostics, and reveals hidden-test verdicts without exposing private inputs. Native-JDK golden tests compile every reference solution and prove every starter fails honestly.

Company research is intentionally separated from the engine. Interview rubrics live in `src/interview/companyProfiles.ts`; question lenses live in `src/content/companies.ts`; evidence and caveats live in `docs/AMAZON.md` and `docs/GOOGLE.md`. Adding a company does not create another practice surface or progress store.

## Add an Arena encounter

Add a typed `ArenaChallenge` to the appropriate mode in `src/arena/arenaChallenges.ts`. Each encounter must include one correct choice, targeted feedback for every rejected choice, a transferable takeaway, and a visual node model. The validation tests enforce unique IDs and exactly one correct response.

Executable missions are registered in `src/arena/codingCombatMissions.ts`, with the interval/matrix wave in `src/arena/codingCombatWaveOneMissions.ts` and the tree/list wave in `src/arena/codingCombatWaveTwoMissions.ts`. Each mission includes a Java contract, at least three visible tests, at least four hidden tests, three progressive hints, and exactly one defensible answer for each reasoning follow-up.

LLD Studio missions live in `src/arena/lldStudioMissions.ts`. Each model defines six candidate types, six responsibility decisions, three change-pressure mutations, and one design defense. Scoring and Java generation remain pure in `src/arena/lldStudioEngine.ts`, so content and model behavior can be validated without rendering React.

## Persistence

Progress is stored in browser `localStorage`. Arena XP is based on each mode's best score, so replaying a completed simulation improves mastery without farming unlimited XP.
