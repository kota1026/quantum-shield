# Deferred Tasks — Next Session

_Compiled 2026-04-27 after Strategic Meeting v4 and v3 documentation push._

The following tasks were planned in Meeting v4 (Group C — Frontend pages) and other meeting outputs, but require live dev-server testing or external action and are deferred to subsequent sessions.

---

## Group C: Frontend Roadmap Pages (deferred from Meeting v4)

### C1. `/for-bridges-roadmap` page

**Path**: `src/frontend/web/src/app/[locale]/for-bridges-roadmap/page.tsx`
**Purpose**: B2B-targeted landing for bridge protocol operators
**Content sections**:
- Hero: "PQ-Secure Cross-Chain Messaging by 2027"
- Problem: $3B/year bridge hack data, ECDSA universality, ML-DSA × N guardian cost issue
- Solution: SR₀/SR₁ + Prover Pool pattern applied to bridge guardians
- Status badge: "Coming Q3 2026 — Pilot Pre-Launch"
- CTA: research-forum link / GitHub issue

**i18n keys** (new): `forBridgesRoadmap.hero`, `forBridgesRoadmap.problem`, `forBridgesRoadmap.solution`, `forBridgesRoadmap.cta`

### C2. `/for-custodians` page

**Path**: `src/frontend/web/src/app/[locale]/for-custodians/page.tsx`
**Purpose**: B2B-targeted landing for institutional custodians (Anchorage / BitGo / Fireblocks audience)
**Content sections**:
- Hero: "PQ Migration without Replatforming"
- Problem: 2027 federal mandate, no production PQ custody available
- Solution: drop-in dual-NIST custody runtime + EIP-8141 readiness
- Status: "Pilot conversations welcome"
- CTA: contact form / scheduling link

**i18n keys** (new): `forCustodians.hero`, `forCustodians.problem`, `forCustodians.solution`, `forCustodians.cta`

### Why deferred

- Adding new routes requires Next.js App Router locale-segment validation
- New components need design-system review (44px tap targets, contrast, etc.)
- i18n key additions need both `ja` and `en` populated
- Risk of breaking production build without dev-server validation
- Not in scope for documentation-only autonomous run

### Estimated work

- 4 hours implementation + 2 hours testing in dev server
- Best done in a dedicated frontend session

---

## Track 0: User-action items (not Claude-doable)

### 0.1 Force GitHub to re-detect `weekly-research.yml`

User must edit `.github/workflows/weekly-research.yml` on `main` (web editor or PR) — even a no-op whitespace change — and commit. This forces GitHub Actions to re-parse the workflow, which restores the "Run workflow" button.

### 0.2 Verify GitHub Secret

Confirm `ANTHROPIC_API_KEY` exists at:
https://github.com/kota1026/quantum-shield/settings/secrets/actions

### 0.3 Run weekly-research workflow manually

After 0.1 and 0.2, trigger the workflow via GitHub UI. Confirm it produces `docs/intelligence/2026-04-28-weekly.md` (or the run-day date) and a PR.

---

## Track 4.−1: SP1 NTT gadget repo access

The `kota1026/pq-wallet-sp1-ntt-gadget` repository is not in the MCP allowed-repositories list for this project's sessions. Either:

- Move the repository under the same org as `quantum-shield`
- Add it to MCP configuration
- Or grant Claude session-time access via another channel

Until then, Track 4 (SP1 ML-DSA verification PoC) cannot be evaluated for completeness.

---

## Track 1: EF Grant submission

The application draft at `docs/grants/EF_ESP_APPLICATION.md` is now v3-aligned. The remaining steps require user action:

1. Final review pass by user
2. Submission via https://esp.ethereum.foundation
3. Optional: pre-submission outreach to Thomas Coratger (EF Post-Quantum Security lead)

---

## Critical Parallel Tasks (per Strategy v3)

| Task | Owner | Trigger | Status |
|---|---|---|---|
| Co-founder / first-hire requirements doc | Founder | Week 1 | **Not yet drafted** |
| Legal entity decision (LLC vs C-corp) | Legal advisor | Week 4 | **Not yet engaged** |
| Constitution v2 ratification | Founder + Purpose Guardian | Q2 end | Draft complete (`docs/CONSTITUTION_v2_DRAFT.md`) |
| IP / contributor cleanup | Legal | Concurrent with entity formation | **Not yet started** |

---

## Tracks Ready to Resume Next Session

1. **Track 6 (Bridge demo)** — once Track 4 evaluation is unblocked
2. **Track 2 (arxiv draft)** — once Track 4.0 produces benchmark numbers
3. **Track 3a/3b (EIP spikes)** — can begin immediately, no external dependency

---

_Maintain this list and prune as items are completed._
