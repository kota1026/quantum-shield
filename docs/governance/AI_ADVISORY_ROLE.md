# AI Advisory Role Policy

_Adopted: 2026-04-27 — applies to all Prover signing pipelines._

## Statement

The AI Prover Agent (`src/agents/ai-prover/`) is an **advisory** subsystem.
It analyzes unlock requests and produces a non-binding recommendation. It has
**no signing authority** and **no access to private keys**. Every signature
that leaves the Prover is gated by:

1. Deterministic cryptographic verification (ML-DSA / SPHINCS+) of the request,
2. Human or HSM operator approval via the escalation queue.

LLM confidence scores influence operator prioritization. They never short-circuit
the signing gate.

## What changed (Phase 1 → 2026-04-27)

| Layer | Before | After |
|---|---|---|
| `verifier.ts` `VerificationDecision` enum | `AUTO_SIGN \| ESCALATE \| REJECT` | `ESCALATE \| REJECT` (AUTO_SIGN removed at type level) |
| `makeDecision()` | High confidence → `AUTO_SIGN` | High confidence → `ESCALATE` with `aiRecommendation='sign'` |
| `agent.ts` `handleAutoSign()` | HSM-signed and submitted | **deleted** |
| `agent.ts` switch | Three branches | Two branches (`ESCALATE`, `REJECT`) |
| Stats | `auto_signed` count | `ai_recommended_sign` (audit-only) |

The TypeScript compiler now refuses any code path that would attempt
`VerificationDecision.AUTO_SIGN` — backsliding requires a deliberate enum
re-addition that would be visible in PR review.

## Why

Phase 1 had `confidence >= 0.99 → auto_sign_threshold → HSM.signUnlock()`.
That meant **the LLM judgement directly authorized SLH-DSA signing**. This is
incompatible with:

- **Cryptographic guarantee custody**: signing decisions must reduce to
  deterministic checks of inputs against known invariants, not LLM probability.
- **Audit / EF grant requirements**: external review (Sherlock, EF Post-Quantum
  Security team, prospective VC DD) treats LLM-in-the-signing-loop as a critical
  finding.
- **Director duty of care** (post-incorporation, see
  `docs/business/INCORPORATION_DECISION.md`): a Delaware C-corp board cannot
  defend an LLM auto-sign policy after a loss event.

## Operator playbook

When an `ESCALATE` arrives in the queue:

1. Inspect the AI recommendation (`sign` / `escalate` / `reject`) for context.
2. Run the deterministic checks (ML-DSA verify, SR₀/SR₁ recompute, deadline,
   stake, time-lock window).
3. If all pass → operator approves; HSM produces the SPHINCS+ co-signature.
4. If any fail → reject and emit security alert.

The AI recommendation is **never** sufficient on its own.

## Future work

- A future governance proposal may reintroduce a tightly-scoped automation
  path (e.g., < 0.001 ETH, single-prover pilot) under explicit DAO vote and
  with full open audit trail. Until that vote passes, all signing is operator-gated.
- The recorded `ai_recommended_sign` counter feeds the dataset that justifies
  any future automation thresholds.

## References

- `docs/ACTUAL_STATE.md` — Phase 1 Honesty Disclosure (the reason this policy exists)
- `docs/grants/EF_ESP_APPLICATION.md` — external commitment to advisory-only AI
- `src/agents/ai-prover/src/verifier.ts` — implementation
- `src/agents/ai-prover/src/agent.ts` — switch enforcement
