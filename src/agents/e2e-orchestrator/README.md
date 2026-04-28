# Quantum Shield E2E Orchestrator

Spec-driven, 11-agent autonomous verification framework. Reads
`docs/core/SEQUENCES.md`, drives backend + frontend + chain
operations, surfaces bugs, proposes fixes, and produces a consensus
verdict from peer-reviewing agents.

## Why

Existing tests pass in isolation but the system has shipped multiple
silent-failure regressions (vault split-brain, hardcoded `0x...0002`
fallback, AI-prover signing without cryptographic gates). This
orchestrator replaces "did the test go green?" with "did 11 specialized
reviewers agree the system actually does what the spec says?"

## Topology

```
Stage 1 (1 agent)      spec-runner          → JSON test plan from SEQUENCES.md
Stage 2 (5 agents)     backend-runner        ┐
                       frontend-runner        │ parallel layer execution
                       db-verifier            │ structured output to Stage 3
                       l1-verifier            │
                       l3-verifier           ┘
Stage 3 (3 agents)     bug-hunter            ┐
                       regression-sentinel    │ parallel quality checks
                       performance-monitor   ┘
Stage 4 (2 agents)     fixer                  → proposed patches
                       cross-reviewer         → final verdict
Stage 5                reporter               → reports/<seq>-<ts>/
```

11 agents total. Subagents cannot nest in the Claude SDK, so the
orchestrator itself is a Node TypeScript driver — not a Claude
sub-agent — that calls the Anthropic API directly per agent.

## Cost / latency profile

Per sequence run (rough):

| Stage | Model | Tokens | $ | Wall-clock |
|---|---|---|---|---|
| 1 spec-runner | Sonnet 4.6 | ~10K | $0.05 | 8s |
| 2 layer execs (×5 parallel) | Haiku 4.5 | ~15K each | $0.05 | 12s |
| 3 quality (×3 parallel) | Sonnet/Haiku mix | ~30K total | $0.15 | 15s |
| 4 synthesis (×2 parallel) | Sonnet 4.6 | ~25K total | $0.20 | 20s |
| Total | — | ~120K | **~$0.45** | **~55s** |

Prompt caching cuts steady-state cost by ~70% after warm-up.

## Usage

```bash
# Install
cd src/agents/e2e-orchestrator
pnpm install

# Set credentials
export ANTHROPIC_API_KEY=sk-ant-...
export DATABASE_URL=postgresql://quantum:quantum_dev@localhost:5432/quantum_shield
export L1_RPC_URL=$QS__L1_RPC_URL          # defaults to https://rpc.sepolia.org
export L3_RPC_URL=http://localhost:8545

# Verify the Lock sequence
pnpm verify --sequence lock

# Verify with auto-fix attempt
pnpm verify --sequence lock --auto-fix

# Verify everything
pnpm verify --sequence all
```

## Output

```
reports/lock-2026-04-28T03-12-45Z/
├── plan.json              # Stage 1 test plan
├── stage2/                # raw shell output per layer
│   ├── backend.txt
│   ├── frontend.json
│   ├── db.txt
│   ├── l1.txt
│   └── l3.txt
├── stage2-analysis.json   # agent verdicts on raw output
├── stage3.json            # bug-hunter / regression / perf
├── patches/               # fixer's proposed unified diffs
├── verdict.json           # cross-reviewer final verdict
└── report.md              # human-readable summary
```

## Agent definitions

See `prompts/*.md`. Each prompt is loaded via prompt-caching breakpoints
so the system prompts stay in cache across runs (~90% input-token discount).

## Adding a sequence

1. Add the spec to `docs/core/SEQUENCES.md`
2. Add the layer commands to `src/spec-loader.ts` `KNOWN_SEQUENCES`
3. Run `pnpm verify --sequence <new-name>`

## CI integration

`.github/workflows/e2e-orchestrator.yml` runs the orchestrator on PRs
that touch `src/api/api/`, `src/frontend/web/`, or `src/contracts/`.
Verdicts other than `PASS` block the merge.
