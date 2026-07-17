# Amazon SDE I technical curriculum research

Last reviewed: July 15, 2026

## Scope and level calibration

This curriculum targets the entry-level full-time Software Development Engineer role. Amazon job postings normally label that role **SDE I / L4**. “L3” is commonly used for internships or can be location-specific, so a recruiter email and the exact job ID always override this general label.

The board intentionally covers **coding/DSA and low-level/object-oriented design**. It does not replace Leadership Principle preparation, which remains required for Amazon interviews.

## What is authoritative

Amazon's official preparation pages say that software-development interviews assess coding, programming languages, data structures, algorithms, and object-oriented design. They emphasize applying knowledge rather than memorizing it, writing syntactically correct code, and considering robustness, tests, edge cases, and scalability.

Primary sources:

- [Amazon software-development interview topics](https://www.amazon.jobs/content/en/how-we-hire/interview-prep/software-development-topics)
- [Amazon university SDE online assessment](https://amazon.jobs/content/en/how-we-hire/university/sde-oa)
- [Amazon software development for students and graduates](https://amazon.jobs/content/en/career-programs/university/sde)
- [Example Amazon SDE I / L4 job label](https://amazon.jobs/en-gb/jobs/10466128/software-dev-engineer-i-l4)

## How the question tiers were built

No public source provides a reliable global frequency table for Amazon questions. Candidate reports are anecdotal, and loops vary by location, organization, and interviewer. For that reason, PatternCache uses three honest evidence labels:

- **Repeated recent signal:** the exact problem or close variant appeared in more than one recent public candidate report.
- **Recent reported signal:** at least one recent candidate report named the problem or a close variant.
- **Core coverage:** an efficient representative of an officially required interview pattern, even when it was not named in the sampled reports.

Priority is based on both evidence and coverage value—not on a claimed probability of receiving the exact problem.

## Signals found in recent candidate reports

The strongest repeated clusters across the sampled 2025–2026 reports were:

- Multi-source/grid BFS: Rotten Oranges, Number of Islands, generated-state BFS.
- Dependency graphs: Course Schedule / Course Schedule II.
- Trees: Lowest Common Ancestor, path-sum variants, Distance K, subtree traversal.
- Binary search: Search in Rotated Sorted Array and boundary variations.
- Windows and intervals: Sliding Window Maximum, distinct-substring windows, merging overlaps.
- DP and greedy variations: House Robber, falling paths, unique paths with obstacles, circular maximum subarray.
- Heaps/maps: top-K, scheduling, minimum-cost aggregation, streaming variants.
- LLD: Parking Lot-like allocation, Circular Buffer, LRU-style data-structure design, coupon/discount systems.

Directional candidate sources sampled:

- [February 2025 SDE-I report](https://leetcode.com/discuss/post/6461439/amazon-sde-1-feb-2025-interview-/)
- [Selected September 2025 report](https://leetcode.com/discuss/post/7154883/)
- [2025 Circular Buffer / Min Stack report](https://www.reddit.com/r/leetcode/comments/1nl7oij/amazon_sde_1_interview_experience/)
- [Selected March 2026 report](https://leetcode.com/discuss/post/8029194/)
- [April 2026 report](https://leetcode.com/discuss/post/8014509/)
- [June 2026 graph/DP report](https://www.reddit.com/r/leetcode/comments/1u0yzoq/amazon_sde1_interview_experience_2026_4_rounds_2/)

## Must-do coverage gate

The 15-day plan schedules every must-do exactly once before the final mocks:

- 28 DSA problems spanning hashing, prefix sums, sliding window, stack/deque, heap, intervals, linked lists, trees, graphs, binary search, backtracking, greedy, and dynamic programming.
- 6 LLD prompts spanning responsibilities, resource allocation, state machines, policy separation, lifecycle modeling, and constrained data-structure design.

“Complete” should mean the learner can:

1. Recognize the pattern from constraints without seeing the title.
2. State the invariant or object responsibility before writing code.
3. Produce working code or a coherent class model inside the interview timebox.
4. Test edge cases and state time/space complexity.
5. Handle at least one follow-up variation.
6. Reproduce the reasoning after 1, 3, and 7 days.

## Product implementation

The interactive board lives at `#/companies/amazon/sde1`. Progress is stored locally under the versioned key `patterncache.amazon-sde1.v1`. The data model and its validation tests live in:

- `src/content/amazonSde1Prep.ts`
- `src/content/amazonSde1Prep.test.ts`
- `src/hooks/useAmazonPrepProgress.ts`
- `src/hooks/useAmazonPrepProgress.test.ts`


## July 2026 LLD research refresh

A second deep-research pass (103 agents, adversarial 3-vote verification, July 2026) re-checked the LLD side of this curriculum against candidate reports dated September 2025 through July 2026.

**The headline is an absence finding.** Not a single dated in-window candidate report naming an Amazon SDE-1 LLD prompt survived verification. The closest verified Amazon evidence is pre-window: Parking Lot "with many constraints" as a 30-minute LLD segment (LeetCode Discuss, Nov 2024), an LFU-cache-as-product prompt with pluggable eviction policies in an accepted loop (LeetCode Discuss, Dec 2024), and a Feb 2025 fresher loop that contained no LLD round at all. Amazon's official prep pages never describe a distinct LLD round. Consequences for this plan:

- Coverage-first tiering stays correct. Chasing "currently hot" prompt claims from undated listicles would launder weaker evidence than what we already have.
- An LLD round is not guaranteed at SDE-1. The plan keeps LLD preparation because when the round appears it is decisive, but DSA days stay the volume priority.
- The verified depth bar (from the one accepted-loop debrief): clarify the vague prompt, model the entities, name extensibility hooks, implement a barebones core. Not pattern name-dropping and not a fully polished program. Day 14/29 mock instructions now say exactly this.

**Changes made from this pass:**

- Circular Buffer (reported in a 2025 SDE-1 loop) is now an in-app drill instead of an external link, and is scheduled on Day 11 next to Parking Lot in the 15-day plan.
- The 15-day plan's Day 13 dropped Chess (every verified curriculum source tiers it hard/stretch and no dated report names it) in favor of LRU Cache drill work plus the LFU/pluggable-eviction follow-up that the Dec 2024 accepted loop was actually probed on. Chess stays in the 30-day plan and the Library.
- The 30-day plan gained a constrained-data-structure day (Day 26: LRU Cache + Circular Buffer drills).
- Lesson ordering was sanity-checked against Hello Interview's six-problem progression (Connect Four -> Amazon Locker -> Elevator -> Parking Lot -> Rate Limiter -> Inventory Management) and the cross-vendor consensus (fundamentals -> state machines -> resource allocation -> scheduling -> policy). Our arc (LLD basics -> Parking Lot -> Locker -> Elevator -> Vending -> Coupon -> constrained structures -> cold transfer) matches the consensus shape.

**Watchlist (verified at other companies, not Amazon; not scheduled in the Amazon plans):** Atlassian's code-design round (Nov 2025 aggregation plus in-window corroboration) centers on Rate Limiter, Middleware Router, Agent Rating Leaderboard, File Collections Tracker (top-N), Cost Explorer, Snake, in-memory File System, and Hit Counter. Flipkart's 2026 machine-coding pool is business-domain flows (wallet, BNPL, appointment booking, loyalty programs) with runnable in-memory code and "partial but well-designed beats complete but messy" as the explicit bar. If a non-Amazon track ships later, these are the evidence-backed prompts to build first. Microsoft, Google, Uber, and Salesforce produced no verified junior-level LLD claims at all this pass.
