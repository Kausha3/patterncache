# Google SWE interview research dossier

Last checked: 2026-07-17

This document is the source of truth for the Google company pack. It separates official material from candidate reports and preparation coverage. It does not turn an interview anecdote into a probability.

## 0. Evidence rules

The app uses four qualitative labels:

1. **High**: the prompt or behavior appears in at least two independent, recent first-person reports.
2. **Medium**: one sufficiently detailed, recent first-person report names it.
3. **Emerging**: useful coverage, but the evidence is either a single weak report or an established transfer drill rather than a recent Google report.
4. **Official expectation**: Google itself publishes the material. Official material can establish the interview medium or broad hiring expectation, but it does not establish question frequency.

We do not publish percentages for question frequency. Public sources cannot support them.

## 1. What Google officially confirms

- Google publishes an official [hiring-process area](https://www.google.com/about/careers/applications/how-we-hire/) and tells candidates to use recruiter-provided preparation material. The public page does not provide a stable, role-by-role round count. Therefore the app tells users to confirm their own packet instead of presenting one universal loop.
- Google's official [Technical Virtual Interviews candidate guide](https://services.google.com/fh/files/misc/technical_virtual_interviews_candidate_resource.pdf) says Google Drawings may be used for design questions. It explicitly tells candidates not to worry about the perfect diagram shape and to focus on answering the question and indicating which objects they are describing.
- An official 2021 [Google Students Virtual Series PDF](https://services.google.com/fh/files/emails/virtualseriespdf.pdf) advertised a coding-interview session with experienced interviewers, tips, common pitfalls, and a sample question. The same PDF describes General Cognitive Ability as part of Google's **non-technical** hiring process. This older event is useful context, not proof that every current SWE loop contains a separately named GCA round.
- Current Google job listings distinguish experience bands. An early-career listing describes completing work with teammates and developing core knowledge, while current mid and advanced listings increasingly name system design, architecture, ambiguous problem solving, project leadership, and stakeholder influence. Examples: [early-career SWE](https://www.google.com/about/careers/applications/jobs/results/80313547497579206-software-engineer-early-career-for-women-in-tech-candidates), [Software Engineer III](https://www.google.com/about/careers/applications/jobs/results/123488574405255878-software-engineer-iii/), and the [Google Careers job search](https://www.google.com/about/careers/applications/jobs/results?hl=en_US).

Product implication: the pack is level-gated. It does not place a fake senior system-design burden on every L3 learner.

## 2. Recent SWE reports and what they support

### L3 / early career

- A verified 2026 US new-grad report describes two initial 45-minute rounds, one technical and one Googleyness/behavioral, followed by two more technical interviews. The candidate reports custom or underspecified questions, manual dry-runs, complexity discussion, and the need to clarify before coding. Source: [Exponent L3 report](https://www.tryexponent.com/experiences/google-software-engineer-interview-54740a?returnPath=%2Fguides%2Fgoogle-software-engineer-intern-interview%2Fexperiences).
- A June 2025 Bengaluru offer report describes three DSA-focused rounds with a 15-minute Googleyness segment. Its behavioral questions include handling conflicting team decisions and standing up for a teammate. Source: [Taro candidate report](https://www.jointaro.com/interviews/companies/google/experiences/software-engineer-bengaluru-june-17-2025-accepted-offer-positive-34d7b474/).
- A 2025 L3 offer report adds another first-person data point, but public report details and regions vary. Source: [LeetCode L3 offer report](https://leetcode.com/discuss/post/6982323/).

Supported conclusion: Google L3 preparation should primarily train problem solving aloud, data structures and algorithms, self-generated tests, complexity, follow-ups, and Googleyness. A dedicated LLD or HLD round is not promoted as the default.

### L4

- A 2025 Google India L4 offer report describes four technical interviews spanning graph serialization, state-space search, shortest paths, and interval merging, followed by a Googleyness round about teamwork and decision-making. Source: [LeetCode L4 report](https://leetcode.com/discuss/post/6775581/google-l4-interview-experience-by-anonym-w9dg/).
- A June 2026 Warsaw L4 candidate describes a hard coding screen in a shared editing environment and a standard behavioral conversation. A commenter self-identifying as a Google interviewer says the conversation and logic matter more than a fully featured execution environment. This is useful but still crowd-sourced. Source: [Reddit L4 report](https://www.reddit.com/r/cscareerquestionsEU/comments/1u8mo7u/netflix_and_google_interview_experience_offer/).

Supported conclusion: coding, abstraction, communication, and clean reasoning remain central at L4. Design format varies enough that the app tells candidates to follow their recruiter packet.

### L5+

- A detailed April 2025 Google India L5 offer report describes three DSA rounds, one system-design round, and one Googleyness/leadership round. The design prompt was an image/GIF/video hosting service. The candidate gathered requirements, estimated scale, compared storage choices, found bottlenecks, and incorporated new requirements incrementally. Source: [Reddit L5 offer report](https://www.reddit.com/r/leetcode/comments/1k3iqyr/google_india_sr_software_eng_l5_hired_interview/).
- Another L5 report describes three coding rounds, an image-hosting system-design round with an AI-processing follow-up, and Googleyness. Source: [LeetCode L5 image-hosting report](https://leetcode.com/discuss/post/5601424/Google-L5-Interview-Experience/).
- A separate 2025 report describes inventory management, system integration, concurrency, scalability, and a Googleyness/behavioral round. Source: [LeetCode L5 report](https://leetcode.com/discuss/post/6552739/google-l5-interview-experienceselected-b-8ff5/).

Supported conclusion: system design becomes a material preparation track at L5. Image/media hosting is the only prompt in this dossier with repeat recent evidence, so it receives the strongest question signal.

## 3. The Google mock profile

The deterministic mock engine scores observable answer evidence, not personality and not hiring probability. The Google profile uses six dimensions:

1. **Structured reasoning**: clarify ambiguity, compare options, state criteria, and use evidence.
2. **Collaborative problem solving**: understand the other side, share context, and resolve conflict without declaring victory.
3. **Leadership without authority**: create direction, unblock others, and follow through without relying on title.
4. **Learning and intellectual humility**: identify when a belief was wrong and show the mechanism changed afterward.
5. **Inclusive impact**: notice excluded perspectives, ask before intervening, and improve the group outcome.
6. **Role-related technical depth**: explain mechanisms, trade-offs, edge cases, testing, and failure modes from real resume work.

The mock asks questions based on the candidate's resume and job description, plus Google-specific archetypes grounded in the recent reports: ambiguity, disagreement, changing one's mind, standing up for a teammate, leadership without authority, debugging a wrong first theory, and adapting a design under a new constraint.

Important limitation: phrase matching is a practice mirror. It cannot know whether a story is true, whether judgment was good, or whether Google would hire the candidate.

## 4. System-design question bank

| Prompt | App signal | Evidence |
| --- | --- | --- |
| Image and short-video hosting | High | Repeated in two independent L5 reports from 2024-2025 |
| Inventory management | Medium | One detailed 2025 L5 report |
| Cloud file storage and sync | Emerging | Established Google-scale transfer drill, not recent-frequency evidence |
| Search autocomplete | Emerging | Established Google-flavored transfer drill, not recent-frequency evidence |
| Distributed cache | Emerging | Architecture transfer drill |
| Real-time messaging | Emerging | Architecture transfer drill |

The last four are intentionally labeled as transfer coverage. Their presence must never be rewritten as “frequently asked by Google” without stronger evidence.

## 5. What this pack deliberately does not claim

- There is no universal current round count for every Google SWE candidate, region, level, and team.
- Google L3 does not automatically receive a system-design or LLD round.
- “Googleyness” is not a list of magic words. The app looks for evidence and always discloses that its judge is heuristic.
- Shared Docs, scratchpads, Google Drawings, and execution support can vary by interview and recruiter instructions.
- A famous Google-themed system-design prompt is not automatically a frequent Google interview prompt.
- Candidate reports are not policy. They are time-stamped observations used only at the evidence strength they deserve.

## 6. Maintenance checklist

When updating the pack:

1. Prefer official Google material for process and tooling.
2. Use first-person, time-stamped reports for observed loop shape and prompts.
3. Record level, region, role, date, and outcome when the source provides them.
4. Require two independent recent reports before promoting a prompt to `high`.
5. Never infer a frequency percentage.
6. Recheck all claims at least every six months, or sooner if Google changes its public hiring guidance.
