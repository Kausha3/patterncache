# Design QA — Mission 1: Your First Shift

## Visual truth

- Source visual target: `/Users/kaushatrivedi/.codex/generated_images/019f649f-f634-77d3-bdb8-4134aba6e9b7/exec-aa947eaa-29af-48fd-916c-2212a6af1121.png`
- Source dimensions: 1488 × 1058
- Route: `http://127.0.0.1:5174/#/arena/pattern-genome`
- Browser-rendered implementation: `/Users/kaushatrivedi/patterncache/artifacts/first-shift-qa/01-intro.png`
- Revised debrief implementation: `/Users/kaushatrivedi/patterncache/artifacts/first-shift-qa/10-revised-shift-debrief.png`
- User-reported pre-fix debrief: `/var/folders/b0/t8kp8r1s0yxdsrv2m48zl14m0000gn/T/TemporaryItems/NSIRD_screencaptureui_JYGOCY/Screenshot 2026-07-16 at 6.16.27 PM.png`
- Implementation viewport: 770 × 758 at 2× DPR
- Primary comparison state: learner-facing mission opening before any LLD terminology appears
- Comparison method: source and implementation were opened together in the same visual-inspection input; the user-reported debrief and revised debrief were also compared together in a second focused input

The source establishes the target mood and interaction language: an isometric garage, a single visible objective, a physical upgrade, an obvious primary action, dark green glass, mint success, and amber guidance. The implementation preserves that visual system while using a calmer onboarding state before revealing the interactive world.

## Findings

No actionable P0, P1, or P2 findings remain.

- [P3] The in-app browser did not apply its temporary 390 × 844 viewport override to the already claimed local tab.
  - Location: responsive verification.
  - Evidence: browser-reported dimensions stayed 770 × 758 after the override request.
  - Impact: the mobile rules compile and use stacked layouts, larger minimum heights, full-width actions, and protected bottom coaching, but a fresh mobile screenshot was not available in this session.
  - Follow-up: visually recapture the intro, manual-search, transfer, reveal, and interview states when the active in-app tab accepts a mobile viewport.

## Required quality surfaces

- First-time clarity: the opening names the learner's role and three concrete goals. It explicitly delays class diagrams and software terminology until the learner has operated the garage.
- Gameplay hierarchy: each world state exposes one objective, one consequence, and at most one coach action. The learner clicks actual parking spaces and physically installs scanner assets on a floor.
- Visual feedback: occupied, free, waiting, failed, running, and successful states use both text and color. The queue, bottleneck, before/after comparison, and installed scanners make design consequences visible.
- Transfer instead of guessing: Floor 1 is demonstrated once. The learner then receives two physical targets on Floor 2, can make a recoverable wrong installation, and must apply the idea without a teaching glow.
- Concept timing: `Level`, `spots`, `findSpot(vehicle)`, and Single Responsibility appear only after the transfer succeeds. The transition stays in character as a shift debrief and garage blueprint rather than announcing a teaching technique.
- Interview readiness: the final prompt is open-ended. Scoring uses four independent pieces of reasoning evidence and accepts equivalent wording rather than an exact template.
- Asset fidelity: the garage, player car, and scanner are real generated raster assets. Interface symbols use Phosphor icons. No emoji, fake diagrams, placeholder boxes, custom SVGs, or CSS illustrations are used as content assets.
- Accessibility: all physical targets are native buttons with specific accessible names; the coach is live; the textarea has a label; disabled states are semantic; reduced-motion styles are included.

## Comparison history

### Earlier blocked experience

- [P1] The earlier blueprint asked a beginner to place properties and methods before they had a mental model for either term.
- [P1] The interaction looked like a dashboard and rewarded classification, so it still felt like MCQs with different controls.
- [P1] The game explained the answer before the learner experienced the problem.
- [P2] Dense class cards and technical labels competed with the world and made the next action unclear.
- [P1] The first debrief headline—“You learned it before seeing the code”—announced the teaching technique and broke the game's fiction at the exact moment the design vocabulary appeared.

### Fixes applied

- Replaced the multi-panel blueprint with one continuous shift in a single garage world.
- Added two manual parking arrivals so the learner first experiences the cost of checking spaces one at a time.
- Added a rush-hour bottleneck that visibly stalls the queue after repeated manual checks.
- Added one guided scanner installation on Floor 1 and a separate unguided transfer challenge on Floor 2.
- Added a recoverable wrong-floor path that explains the visible consequence without taking progress away.
- Delayed all LLD vocabulary and Java until after the learner has succeeded through behavior.
- Added evidence-based interview practice and a replay-from-memory loop.
- Reframed the reveal as an in-world incident debrief: “Rush hour is under control,” with operational before/upgrade/stress-test language, a garage blueprint, a design defense, and an “Enter the interview room” action.

## Primary interactions tested

- Started and replayed the complete mission.
- Opened the gate, inspected an occupied space, discovered a free space, and parked the first car.
- Repeated the task for the second driver and verified cumulative manual-check feedback.
- Started rush hour, performed two checks, and reproduced the queue bottleneck.
- Requested guidance, picked up the scanner, installed it on Floor 1, ran it, and verified that three queued cars were parked.
- Started the transfer round, picked up a second scanner, intentionally installed it on the already-cleared Floor 1, received causal feedback, then recovered on Floor 2.
- Ran the unguided scanner and verified the concept reveal only appeared after success.
- Submitted a vague answer and received 0% with four missing evidence items.
- Submitted a strong answer in different wording and reached 100% completion.
- Verified the replay action returns to a clean mission opening.
- Browser console warnings and errors: none after the final reset.

## Automated verification

- `npm test`: 19 files and 98 tests passed.
- `npm run typecheck`: passed.
- `npm run build`: passed.
- `git diff --check`: passed.
- Local route HTTP check: 200.

## Final result

passed
