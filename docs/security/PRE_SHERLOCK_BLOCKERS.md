# Pre-Sherlock Blockers (2026-04-28)

_Surfaced by the 11-seat strategy council, Seats 3 (Security) and 4
(Operational Risk). All three must land before Sherlock contest
submission. See `docs/strategy/COUNCIL_2026-04-28.md` for context._

## Severity legend

- **CRITICAL**: blocks Sherlock submission. Auditor will file as
  Critical on day 1; submitting without a fix is wasting $10K.
- **HIGH**: blocks merge to main. Should be fixed before submission to
  avoid Sherlock filing it.
- **MEDIUM**: post-Sherlock acceptable but document explicitly in the
  contest README "known limitation" section.

## Blockers

### CRITICAL-1: VRF coordinator bypass in `VRFConsumer.sol`

**Source**: Seat 3 (Security & Audit Lead) review of deployed contracts
on Sepolia.

**Location**: `src/contracts/l1/VRFConsumer.sol:151` (modifier
`onlyVRFCoordinator`).

**Issue**: When `vrfCoordinator == address(0)` — the deployed state on
Sepolia today, since `setVRFConfig` has not been called with a live
Chainlink coordinator — `rawFulfillRandomWords` is callable by **any
address**. An attacker calls `rawFulfillRandomWords(requestId,
manipulatedRandomValue)` to deterministically select a compromised
prover address they control, then routes the unlock to themselves.

**Cross-reference**: `docs/ACTUAL_STATE.md` Phase 1 disclosure
acknowledges this in the VRF row: "contract 未設定時は
`block.prevrandao` fallback (UI に非表示)" — but the contract-level
exposure (anyone can call `rawFulfillRandomWords`) is more dangerous
than the prevrandao fallback path.

**Fix options** (pick one):

1. **Preferred**: configure the live Chainlink VRF v2.5 coordinator
   address via `setVRFConfig` and require it to be non-zero at
   deployment.
2. **Acceptable as bridge**: add `require(vrfCoordinator != address(0),
   "VRF not configured")` at the top of `rawFulfillRandomWords`. This
   makes the contract gracefully fail rather than silently allow
   anyone-can-fulfill.

**Verification**: write a foundry test that calls
`rawFulfillRandomWords` from a random EOA when `vrfCoordinator ==
address(0)` and asserts a revert.

### CRITICAL-2: `colluding_count` hardcoded to 1

**Source**: Seat 3 review of slashing pipeline.

**Location**: `src/api/api/src/routes/challenge.rs:236`.

```rust
let colluding_count = 1u64; // Single prover by default
```

**Issue**: The quadratic slashing formula is `N² × 10%`. With `N=1`
always, the maximum slash is 10% regardless of actual collusion. An
attacker with 3 colluding provers (`N=3`, should be 90% slash) is
slashed only 10%. The economic security argument of the protocol —
that quadratic slashing makes collusion uneconomical — collapses.

**Fix**: derive `colluding_count` from the challenge evidence. This
means the challenge submission API must include the set of provers
implicated, the verifier must reject duplicate or unrelated provers,
and the slashing call passes `evidence.implicated_provers.len()` as
the count. Cross-reference SEQUENCES.md §4 (Challenge + Slashing) and
§4.7 (Quadratic Slashing).

**Verification**: extend
`src/api/api/tests/sequence_e2e_test.rs::sequence_slashing` to cover a
3-prover collusion scenario and assert `slash_amount == lock_amount *
0.9`.

### HIGH-1: Anthropic API timeout missing in orchestrator

**Source**: Seat 4 (Operational Risk Hunter), Finding 6.

**Location**: `src/agents/e2e-orchestrator/src/agent-runner.ts:113-123`.

**Issue**: `client.messages.create` has no `timeout` parameter and no
`AbortSignal`. With 11 agents running across 4 stages, a single hung
Anthropic call blocks the `Promise.all` in `runAgentsInParallel`
indefinitely. There is no wall-clock timeout for the full orchestrator
run either. In a CI pipeline this means a hung job consumes the
runner slot until the CI system kills it (typically 1–6 hours), with
no diagnostic output.

**Fix**:

1. Instantiate the `Anthropic` client once at module load and reuse it.
2. Pass `timeout: 90_000` to every `messages.create` call (the SDK
   supports this).
3. Wrap `runAgentsInParallel` with a `Promise.race` against a
   configurable `MAX_STAGE_TIMEOUT_MS` (default `300_000`).
4. On timeout, treat the agent's result as a parse failure and inject
   a synthetic critical finding `"Agent timed out"`.

**Verification**: integration test with a stub agent that sleeps 200s,
assert orchestrator returns `BLOCKED` verdict in <5 minutes.

### HIGH-2: spec-runner failure silently uses fallback plan

**Source**: Seat 4, Finding 1.

**Location**: `src/agents/e2e-orchestrator/src/orchestrator.ts:69-71`.

**Issue**: When the spec-runner agent fails (network, rate limit,
malformed JSON), the catch block logs a `warn()` and continues with
the binding fallback plan — silently. The final `RunReport` does not
indicate that the plan used was the fallback rather than the
AI-refined plan.

**Fix**: add `plan_source: 'ai' | 'fallback'` to `RunReport` and
surface it prominently in `report.md`. Escalate to a finding if
fallback is used twice consecutively for the same sequence.

### HIGH-3: Agent JSON parse failure stored as fake successful object

**Source**: Seat 4, Finding 2.

**Location**: `src/agents/e2e-orchestrator/src/agent-runner.ts:128-133`.

**Issue**: `extractJson` failure stores `{ _parse_error, _raw }` in
`parsed_json` and returns "successfully." Downstream code reads
`obj.layer`, `obj.status`, etc. with nullish coalescing, silently
producing a `LayerAnalysis` with `status: 'fail'` and zero issues —
which then doesn't trigger the cross-reviewer's BLOCKED path.

**Fix**: change `runAgent` return type to a discriminated union `{ ok:
true; parsed_json: unknown } | { ok: false; error: string; raw: string
}`. Treat `ok: false` in the orchestrator as a synthetic critical
finding `"Agent returned unparseable output"`.

### MEDIUM-1: `SAMPLE_PROPOSALS` hardcoded on the frontend

**Source**: `silent-failure-hunter` Batch scan in `docs/ACTUAL_STATE.md`,
re-flagged by Seat 3.

**Location**: `src/frontend/web/src/components/governance/PublicGovernanceManagement.tsx:59`
(or whichever line still has the constant — see
`docs/ACTUAL_STATE.md` Batch 1 unfinished).

**Issue**: Frontend renders sample proposals from a hardcoded constant
instead of reading from L3 Governor contract. Less critical than the
above (governance reads are read-only and don't move funds) but it
**signals project immaturity** to Sherlock wardens, depressing
warden participation in the contest.

**Fix**: replace with `useGovernanceProposalsQuery` reading from the
Arbitrum Sepolia Governor contract `0xe93b8129DC3dBD48E5d78C5A4C156DD1BFa8D65B`.

### MEDIUM-2: `emergency.rs` TODO stubs

**Source**: Seat 3.

**Location**: `src/api/api/src/routes/emergency.rs` lines 411, 591, 667.

**Issue**: Emergency bond collection / forfeiture not implemented.
`docs/ACTUAL_STATE.md` Phase 1 row "Emergency bond" already discloses
"計算だけ実施、徴収・没収コード未実装."

**Fix options**: implement the L1 bond collection in the same PR as
CRITICAL-2 (since both touch slashing), OR mark the emergency bond
route as **out of scope** in the Sherlock contest README and disable
the endpoint in production until implemented.

## Sequencing for the fix branch

Recommended branch: `claude/pre-sherlock-blockers`.

Order of commits:

1. CRITICAL-1: VRF coordinator non-zero require + foundry test
2. CRITICAL-2: `colluding_count` from evidence + 3-prover test
3. HIGH-1: orchestrator Anthropic timeout + tests
4. HIGH-2 + HIGH-3: orchestrator parse-failure surfacing + tests
5. MEDIUM-1: governance read-from-Governor migration
6. MEDIUM-2: scope-out OR implement (decide before commit)

Target completion: 2026-05-05. After completion, the same orchestrator
that produced this report should be re-run on `seq-1` (Lock), `seq-2`
(Unlock), and `seq-6` (Slashing), with the slashing run specifically
expected to fail before CRITICAL-2 is fixed and pass after — that's
the regression test for the fix.

## How this list was produced

This is **not** a code-review pass over the entire repo. It is the
intersection of two specialized agents in the 11-seat council:

- Seat 3 (security-reviewer subagent) read the deployed Solidity and
  Rust files
- Seat 4 (silent-failure-hunter subagent) read the orchestrator code
  we just shipped

Their independent findings were concentrated on **Sherlock-blocking
issues** rather than general code-quality concerns. A full audit pass
(Halmos, Slither, cargo-audit) is the next step before Sherlock
submission, after these blockers are fixed.

## Owner

kota1026. Target branch: `claude/pre-sherlock-blockers`. Target
completion: **2026-05-05** (per
`docs/strategy/COUNCIL_2026-04-28.md` decision #2).
