# EF ESP Application — Supplement (2026-04-28)

_To be appended to or merged with `docs/grants/EF_ESP_APPLICATION.md`._
_Reason: April 2026 industry signals materially refresh the case for
Quantum Shield as the production custody artifact aligned with the EF
Post-Quantum Security Team's research program._

## What changed since the original draft

Three signals between 2026-04-10 and 2026-04-28 reinforce the case:

1. **EF Checkpoint #9 demoted EIP-8141 to CFI** (2026-04-10). The
   account-abstraction-layer PQ migration is delayed at least 6 months.
   This *strengthens* Quantum Shield's "custody-first, AA later" thesis
   — not weakens it. Custody primitives can ship today; AA-layer PQ
   primitives cannot. We are not in competition with the AA roadmap;
   we are the layer that doesn't have to wait for it.

2. **Coinbase Independent Advisory Board paper** (2026-04-21–25). Six
   cryptographers (Boneh, Drake, Aaronson, Lindell, Malkhi, Kannan)
   converged on three points that map directly to our architecture:

   | Advisory point | Quantum Shield design |
   |---|---|
   | Migration is urgent, not a 2030+ research problem | Sepolia-live since 2026-04-03 |
   | Custody layer should migrate first | L1 vault, no consensus changes required |
   | Dual-family signatures (lattice + hash) for defense in depth | ML-DSA-65 + SPHINCS+-128s mandatory both |

   We can credibly cite the Advisory in our public-facing materials
   *without* claiming endorsement, because our design predates the
   paper and converges on the same architectural conclusions
   independently.

3. **Quantinuum 94 protected logical qubits with 10⁻⁴ error**
   (2026-03-10). Materially compresses the credible Q-Day window from
   "2030+" to "2028–2030 lower bound, 5-year tail." Our threat model
   has been updated accordingly (`docs/threat-model.md`).

## Pre-Sherlock blocker work, completed publicly

Between the original draft and this supplement, two Sherlock-blocking
issues were independently identified by an internal 11-agent strategy
council and have been fixed on the
`claude/consolidate-multi-track-pr-OtRap` branch:

- **CRITICAL-1 (VRF coordinator bypass)**: `VRFConsumer.sol` previously
  permitted any EOA to call `rawFulfillRandomWords` when the
  coordinator was unset. Fixed via fail-fast modifier
  (`VRFConsumer.sol:148-156`).
- **CRITICAL-2 (`colluding_count` hardcode)**: `routes/challenge.rs`
  previously fixed `N=1` in the `N² × 10%` slashing formula,
  collapsing the quadratic to flat 10%. Fixed by deriving the count
  from `signing_queue` evidence (`db/repositories/challenge.rs::count_signed_provers_for_lock`).

Both fixes are accompanied by a public threat-model document
(`docs/threat-model.md`) that scopes them as TM-5 and TM-6.

This is the kind of pre-audit hygiene the Advisory paper (Section 4
of their report) explicitly calls out as table-stakes: protocols that
can't show their internal review process before paying for an
external audit have low maturity. We are demonstrating that maturity.

## Funding ask, refined

The original ask remains $150,000 (12 months). Inside that envelope,
the line-item priority changes after the April refresh:

| Category | Original | Updated | Rationale |
|---|---|---|---|
| Development | $80,000 | $80,000 | Unchanged |
| Security audit | $40,000 | $40,000 | **Sherlock contest $10K + Halmos coverage + post-Sherlock ToB engagement letter on contingent funding.** Sherlock is gate-1; ToB is gate-2 conditional on first institutional LOI. |
| Infrastructure | $15,000 | $15,000 | Unchanged |
| Research | $15,000 | $15,000 | **Now explicitly: SP1-based ZK SPHINCS+ verifier prototype** (Phase 2 plan in `docs/ROADMAP_PQ_VERIFIER.md`), in coordination with Thomas Coratger's team if accepted into the EF Post-Quantum Security Prize program. |

## Direct ask of the EF Post-Quantum Security Team

Beyond the ESP grant itself, this supplement establishes the case for
acceptance into the **$2M Post-Quantum Security Research Prize** pool
announced January 2026. Quantum Shield is the only production custody
artifact that:

- Maps to all four EF PQ priorities (EIP-8141 alignment, NTT
  precompile reference integration, formal verification commitment,
  real-world Sepolia performance data).
- Has working code on Sepolia and Arbitrum Sepolia, not specs.
- Has a publicly committed Phase 2 plan for ZK SPHINCS+ verification
  that complements (rather than competes with) the precompile work
  the EF team is sponsoring.

We would value a 30-minute call with Thomas Coratger or another team
member to discuss whether Quantum Shield can serve as the empirical
benchmark site for the NTT precompile when it lands on Holesky /
mainnet-shadow.

## Submission package update

To accompany the supplement, the original application package is
augmented with these new artifacts:

- `docs/threat-model.md` (NEW) — Q-Day window, TM-1 through TM-6,
  Sherlock-scope assumptions
- `docs/security/PRE_SHERLOCK_BLOCKERS.md` (NEW) — full disclosure of
  blockers identified and the fix path
- `docs/strategy/COUNCIL_2026-04-28.md` (NEW) — internal review
  process documentation (the 11-seat agent council that surfaced the
  pre-Sherlock blockers)
- `docs/blog/2026-05-04-coinbase-advisory-response.md` (NEW) — public
  positioning vs the Advisory paper, scheduled for publication
  2026-05-04
- `src/agents/e2e-orchestrator/` (NEW) — autonomous 11-agent E2E
  verification framework, in scope for Sherlock submission as a
  pre-audit gate
- All commits are on the `claude/consolidate-multi-track-pr-OtRap`
  branch, public on GitHub

## Closing

The original application made the case that Quantum Shield is the
production-ready custody primitive Ethereum will need. The April
2026 industry signals — the Coinbase Advisory paper most of all —
turn that claim from a forecast into a present-tense fact pattern.
The protocol exists, the threat model is current, the pre-audit
hygiene is documented, and the next 12 weeks are committed to a
Sherlock contest + first institutional integration.

We respectfully request consideration for both the ESP general grant
($150,000) and the EF Post-Quantum Security Research Prize.

— Kota Kato, founder, Quantum Shield, 2026-04-28
