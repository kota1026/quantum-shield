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

## Commit Convention

```
feat: Add consumer lock API integration
fix: Remove FALLBACK_TICKETS from dashboard
refactor: Unify snake_case enum serialization
test: Add lock flow E2E with Anvil fork
```
