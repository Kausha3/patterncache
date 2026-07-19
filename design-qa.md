# Design QA: Evidence-driven Amazon course

## Visual truth

- Source visual truth: `/Users/kaushatrivedi/patterncache/artifacts/course-evidence-qa/01-production-setup.png`
- Same-state local setup: `/Users/kaushatrivedi/patterncache/artifacts/course-evidence-qa/02-local-setup.png`
- Browser-rendered implementation: `/Users/kaushatrivedi/patterncache/artifacts/course-evidence-qa/03-evidence-driven-today.png`
- Route: `http://127.0.0.1:5174/#/`
- Viewport: 1280 x 720, full-page captures
- State: existing learner on Day 4 with earlier incomplete work and four machine-verified clears
- Full-view comparison evidence: the production and local setup captures were inspected together at the same viewport. The local setup preserves the source layout, type system, spacing, panels, controls, radii, and dark visual grammar while making the proof contract explicit.
- Focused-region comparison evidence: the configured Today capture was inspected around the single next-mission panel, proof badges, daily task rows, and course map. A separate crop was unnecessary because the full-page capture keeps all text and controls readable.

## Findings

No actionable P0, P1, or P2 findings remain.

- [P3] The in-app browser did not apply its temporary 390 x 844 viewport override.
  - Location: responsive verification.
  - Evidence: a fresh tab continued to report a 1280 x 720 viewport after the override.
  - Impact: the mobile stacking rules compile and cover the new next-mission, queue, stat, and task-action layouts, but this session did not produce a true 390 px browser capture.
  - Follow-up: recapture Today at 390 px when the browser viewport control accepts the override.

## Required quality surfaces

- Fonts and typography: the implementation keeps the product's existing sans and monospace roles, weight hierarchy, line height, letter spacing, and proof-label scale. The primary action and status labels remain readable without competing with the mission title.
- Spacing and layout rhythm: the new primary panel aligns to the existing content frame. Stat cards, the task panel, and the course map retain the product's established 12 to 26 px rhythm, radii, borders, and elevation. No desktop horizontal overflow was detected.
- Colors and visual tokens: all new states use existing amber, teal, red, green, panel, hairline, and text tokens. Review, retry, verified, self-attested, and incomplete states are semantic rather than decorative.
- Image quality and asset fidelity: this workflow requires no new imagery. Existing icon components provide the shield, check, and arrow marks; no emoji, handcrafted SVG, CSS illustration, or placeholder asset was introduced.
- Copy and content: setup now states that every Amazon SDE I must-do is scheduled and technical work requires verifier evidence. Today names one action, distinguishes machine verification from self-attestation, and explains the 1/3/7-day loop without XP or arcade copy.
- Accessibility: primary controls are native buttons, the selected course day exposes `aria-pressed`, the current day exposes `aria-current`, and review/retry queues have a section label. Proof state is expressed in text as well as color.

## Comparison history

### First pass finding

- [P1] The setup still allowed L5 and L6 while the generated plan was sourced entirely from the Amazon SDE I research pack. This made the course appear to verify levels it does not cover.

### Fix and post-fix evidence

- Locked the released course to Amazon SDE I / L4, migrated old higher-level selections to L4, and added explicit setup copy that higher-level courses need their own research and proof bar.
- The post-fix browser snapshot and final implementation capture show `Amazon · SDE I / L4 · 15-day sprint`; the fresh-tab console contains no warnings or errors.

## Primary interactions tested

- Opened and cancelled the course setup without losing the learner's saved campaign.
- Confirmed the primary panel chooses an overdue Day 1 mission before Day 4 work.
- Activated `Resume missed mission` and verified it opens the exact `pair-sum-map` Java mission, not a generic practice page.
- Returned to Today and confirmed campaign progress and selected day persist.
- Reloaded the page and confirmed an old L5 preference migrates to the honest SDE I / L4 scope.
- Checked a fresh browser tab for console warnings and errors: none.

## Automated verification

- Full automated suite: 51 files and 476 tests passed.
- TypeScript passed.
- ESLint passed with zero warnings.
- Production build passed.
- `git diff --check` passed.

## Final result

passed
