/**
 * Amazon Leadership Principles, scoped to the ones that actually surface
 * inside a system-design interview (not the full company-wide list of 16).
 * Referenced by key from ClarifyQuestion.lp[] — same pattern as GLOSSARY.
 *
 * Per docs/AMAZON.md: Amazon does not run a separate "LP round" for the
 * design interview — principles are graded INSIDE the design conversation.
 * This dict powers the small LP chip shown next to the coaching note when a
 * clarifying question or design decision is a clear LP signal.
 */
export const LEADERSHIP_PRINCIPLES: Record<string, { name: string; plain: string }> = {
  "customer-obsession": {
    name: "Customer Obsession",
    plain: "Start from the user's problem, not the tech. Clarifying requirements before designing is graded as this principle, so skipping it reads as the opposite.",
  },
  ownership: {
    name: "Ownership",
    plain: "Think and act like you'll run this in production. Monitoring, alerting, and a plan for failure recovery are what this looks like in a design round.",
  },
  frugality: {
    name: "Frugality",
    plain: "Accomplish more with less. Shown in the design round as cost-aware tradeoffs, like tiering data hot-in-cache, warm-in-DB, cold-in-cheap-storage instead of over-provisioning everything.",
  },
  "dive-deep": {
    name: "Dive Deep",
    plain: "Stay connected to the details. In a design round this is going 2-3 levels deep on a component you chose, instead of staying at a shallow, buzzword level.",
  },
  "bias-for-action": {
    name: "Bias for Action",
    plain: "Favor calculated, reversible moves over long deliberation. In design terms: make a reasonable default choice, state the tradeoff, and move on rather than stalling on a decision.",
  },
  "invent-and-simplify": {
    name: "Invent and Simplify",
    plain: "Look for the simpler design, not the most impressive-sounding one. Justifying why you did NOT add a component is as valuable as justifying why you did.",
  },
};
