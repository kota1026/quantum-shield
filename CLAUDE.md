# Quantum Shield

Post-quantum asset custody protocol: Dilithium + SPHINCS+ dual NIST signatures, Prover Pool, VRF, Time Lock.

## Project Structure

```
src/api/api/          Rust/Axum backend (port 8080)
src/frontend/web/     Next.js frontend (port 3000)
src/contracts/        Solidity (L1 Sepolia + L3 Anvil)
```

## Universal Rules

1. **NO mock/fallback data** in non-test files. MOCK_, FALLBACK_, DEMO_ patterns are blocked by hooks.
2. **All text via `t('key')`** - no hardcoded Japanese/English strings.
3. **Types flow one direction**: Backend `types.rs` -> Frontend `types.ts`. Frontend never defines its own API types.
4. **snake_case from API, camelCase in frontend** - use serde `rename_all` on backend, transform in API client layer.
5. **L1 = Sepolia** (chain 11155111). Never create a new L1. Use existing contracts in `.claude/rules/blockchain.md`.
6. **L3 = local Anvil** (chain 31337) for dev. **L3 testnet = Arbitrum Sepolia** (chain 421614) deployed 2026-03-03.
7. **Loading/Error/Empty** - every data-fetching component must handle all 3 states.
8. **WCAG 2.1 AA** - aria-labels, 44px tap targets, 4.5:1 contrast ratio.

## Domain Rules

Detailed rules are in `.claude/rules/`:
- `frontend.md` - React/Tailwind/i18n/a11y
- `backend.md` - Rust/sqlx/API structure/DB
- `blockchain.md` - L1/L3 addresses, chain config
- `integration.md` - Type flow, API contract, FALLBACK removal
- `testing.md` - E2E patterns, cargo test, stub detection

## Quick Start

```bash
docker compose up -d postgres redis rabbitmq l3-node minio minio-init
cd src/api/api && DATABASE_URL="postgresql://quantum:quantum_dev@localhost:5432/quantum_shield" sqlx migrate run
cargo run --bin api-server                  # Backend on :8080
cd src/frontend/web && pnpm install && pnpm dev  # Frontend on :3000
```

## Key File References

| Category | Path |
|----------|------|
| Backend config | `src/api/api/config/default.yaml` |
| Backend types | `src/api/api/src/types.rs` |
| Backend routes | `src/api/api/src/routes/` |
| Frontend types | `src/frontend/web/src/lib/api/*/types.ts` |
| Frontend hooks | `src/frontend/web/src/hooks/` |
| DB migrations | `src/api/api/migrations/` |
| L1 contracts | `src/contracts/l1/` |
| L3 contracts | `src/contracts/l3/` |
| Core sequences | `docs/core/SEQUENCES.md` |
| Actual state | `docs/ACTUAL_STATE.md` |
| Integration plan | `docs/INTEGRATION_METHODOLOGY_v2.md` |

## Current Phase: Integration (Phase 0-5)

See `docs/INTEGRATION_METHODOLOGY_v2.md` for full plan.

**Phase 0**: Infrastructure (CLAUDE.md, hooks, Docker, API health)
**Phase 1**: Consumer Lock full flow (FE->BE->DB->L1)
**Phase 2**: Unlock + Emergency flow
**Phase 3**: Prover/Observer/Challenge flow
**Phase 4**: FALLBACK bulk removal + remaining E2E
**Phase 5**: Full verification + doc updates

## Session Rules

- 1 session = 1 flow's 1 layer. Don't mix multiple apps in one session.
- After `/compact`, re-read `.claude/rules/` relevant to current task.
- Verify Docker services are running before any integration work.
- After implementation, run: `grep -rn "MOCK_\|FALLBACK_" src/ --include="*.ts" --include="*.tsx" | grep -v mock.ts | grep -v .test. | grep -v .spec.`

## Autonomous Research & Strategy (EVERY SESSION)

**At the start of every session**, Claude MUST automatically:

### 1. Industry Intelligence (Web Search)
Search and report on (spend max 2 minutes):
- **NIST PQC updates**: New standards, algorithm changes, migration guidance
- **Ethereum PQC**: New EIPs, Vitalik statements, EF research, precompile proposals
- **Competitors**: QRL, PQShield, StarkNet PQC, any new PQC-on-Ethereum projects
- **Quantum computing milestones**: IBM, Google, Microsoft hardware advances
- **Academic papers**: arxiv.org PQC + blockchain papers from last 30 days

### 2. Strategic Recommendations
Based on findings, propose (in 3-5 bullet points):
- Feature priorities that strengthen competitive position
- Technical improvements based on new research
- Grant/partnership opportunities
- Risk alerts (new competitors, algorithm concerns)

### 3. Output
- Brief summary to user (5-10 lines)
- If significant findings: update `docs/intelligence/LATEST.md`
- Reference `docs/grants/EF_ESP_APPLICATION.md` for grant alignment

### 4. Monitoring Data Sources
- https://csrc.nist.gov/projects/post-quantum-cryptography
- https://ethresear.ch (PQC topics)
- https://eips.ethereum.org (new proposals)
- https://arxiv.org/list/cs.CR/recent (cryptography papers)
- https://github.com/topics/post-quantum (new repos)

## Development Workflow (MANDATORY)

Adopted from [everything-claude-code](https://github.com/affaan-m/everything-claude-code).
**Past failures (hardcoded vault address, silent fallback data, untested refactors) happened because we skipped these steps.** Follow them strictly.

### 1. Plan FIRST — `/plan`
Before ANY code change touching more than one file, invoke the `planner` agent:
- Restate requirements in plain words
- List affected files with line numbers
- Identify risks and dependencies
- **WAIT for user confirmation** before writing code

Triggers: new feature, refactor across 2+ files, schema migration, L1/L3 contract change, new service.

### 2. TDD — `/tdd` (skill: `tdd-workflow`)
Write failing test BEFORE implementation. Red → Green → Refactor.
- Rust: `cargo test` (unit + integration in `tests/`)
- Frontend: Playwright E2E must verify DB record + UI state, NOT just HTTP 200
- Minimum: 1 success + 1 error test per endpoint

### 3. Silent-failure hunt — agent: `silent-failure-hunter`
**ZERO tolerance for these anti-patterns** (they caused the vault split-brain):
- Hardcoded constants that should be config-driven
- `.catch(() => [])` / `unwrap_or_default()` that hides errors
- Empty catch blocks
- Fallback values masking real failures
- Log-and-forget error handling

Run this agent before committing any change to `services/`, `routes/`, or `lib/`.

### 4. Verify — `/verify` (skill: `verification-loop`)
Before marking a task complete, run the full loop:
```bash
# Rust
cd src/api/api && SQLX_OFFLINE=true cargo check --bin api-server
cd src/api/api && cargo test

# Frontend
cd src/frontend/web && npx tsc --noEmit
cd src/frontend/web && npx playwright test --reporter=list

# Stub detection
grep -rn "MOCK_\|FALLBACK_\|DEMO_" src/ --include="*.ts" --include="*.tsx" | grep -v mock.ts | grep -v .test. | grep -v .spec.

# L1 contract verification (if touched)
cd src/l1/contracts && forge test
```

All MUST pass. No "I think it works" — only "build+types+tests+lints green".

### 5. Code Review — `/code-review` (agent: `code-reviewer`)
Before pushing to main:
- Diff against `origin/main`
- Check for silent failures (step 3 re-run)
- Verify security (`security-reviewer` for auth/input/secrets)
- Rust-specific (`rust-reviewer`) or TS-specific (`typescript-reviewer`)

### Agents Available (`.claude/agents/`)
| Agent | Use for |
|-------|---------|
| `planner` | Multi-file feature planning |
| `tdd-guide` | Test-first enforcement |
| `silent-failure-hunter` | Catch hidden errors, hardcoded values |
| `code-reviewer` | Generic code review |
| `rust-reviewer` | Rust ownership/lifetimes/error handling |
| `typescript-reviewer` | TS types, React patterns |
| `security-reviewer` | Auth, input validation, secrets |
| `architect` | System-level design decisions |

### Skills Available (`.claude/skills/`)
| Skill | Use for |
|-------|---------|
| `tdd-workflow` | Red-Green-Refactor cycle |
| `verification-loop` | Full build/type/test/lint/security check |
| `security-review` | Vulnerability checklist |
| `rust-patterns` | Idiomatic Rust |
| `backend-patterns` | API design, DB, caching |
| `frontend-patterns` | React/Next.js patterns |
| `e2e-testing` | Playwright POM, flaky-test mitigation |
| `plankton-code-quality` | Format/lint on every edit |

## Commit Convention

```
feat: Add consumer lock API integration
fix: Remove FALLBACK_TICKETS from dashboard
refactor: Unify snake_case enum serialization
test: Add lock flow E2E with Anvil fork
```
