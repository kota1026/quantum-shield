# 11-Agent Manifest

| # | Agent | Tier | Stage | Role |
|---|---|---|---|---|
| 1 | `spec-runner` | sonnet | 1 | Read SEQUENCES.md → produce JSON test plan |
| 2 | `backend-runner` | haiku | 2 | Analyze `cargo test` output |
| 3 | `frontend-runner` | haiku | 2 | Analyze Playwright JSON output |
| 4 | `db-verifier` | haiku | 2 | Verify Postgres post-conditions |
| 5 | `l1-verifier` | haiku | 2 | Verify Sepolia state via `cast` |
| 6 | `l3-verifier` | haiku | 2 | Verify Anvil / Arbitrum Sepolia state |
| 7 | `bug-hunter` | sonnet | 3 | Cross-layer silent-failure detection |
| 8 | `regression-sentinel` | sonnet | 3 | Diff vs last green run |
| 9 | `performance-monitor` | haiku | 3 | Wall-clock / gas / cost regressions |
| 10 | `fixer` | sonnet | 4 | Propose unified-diff patches |
| 11 | `cross-reviewer` | sonnet | 4 | Final verdict, may overrule |

## Why these 11

The selection follows the **generator-verifier rings** pattern (Anthropic
Coordination Framework, April 2026): five layer executors generate raw
verdicts (Stage 2) and three cross-checkers (Stage 3) audit them on
distinct axes — silent-failure history, regression delta, and
performance. A fixer (Stage 4) proposes deltas; the cross-reviewer
synthesizes everything into a single verdict the orchestrator acts on.

This is **flat by design**: the Claude Agent SDK does not allow
sub-agents to spawn sub-agents, so the orchestrator is a TypeScript
process (not a Claude agent) and all 11 agents run as direct API calls.

## Costs

Steady-state run with prompt caching enabled:
- Per sequence: ~$0.45 wall-clock ~55s
- 9 sequences (`--sequence all`): ~$4 wall-clock ~9 min

## Modifying

- **Change a prompt**: edit `prompts/<name>.md`. The `cache_control:
  ephemeral` breakpoint means the new prompt is uploaded once, then
  cached.
- **Add a sequence**: append to `KNOWN_SEQUENCES` in `src/spec-loader.ts`.
- **Add an agent**: would require breaking the 11-agent architecture
  invariant. If you do this, update `AGENT_TIERS` in `src/agent-runner.ts`,
  add a `prompts/<new>.md`, and wire it into the right Stage in
  `src/orchestrator.ts`.

## Anti-patterns to avoid

1. **Letting an agent run shell commands directly.** All execution lives
   in `src/exec.ts`. Agents reason about output; they don't produce it.
2. **Asking Claude to write JSON by example without `cache_control`.**
   Each prompt must be cacheable; `cache_control: { type: 'ephemeral' }`
   is set on the system prompt in `agent-runner.ts`.
3. **Failing open.** If an agent's JSON output is unparseable, the
   orchestrator records `_parse_error` and continues — but the
   cross-reviewer downgrades confidence. Never silently retry as if
   nothing happened.
4. **Deleting the `.last-green/` and `.baseline/` corpora.** These are
   the regression and performance memory of the framework. They live
   under `reports/.last-green/` and `reports/.baseline/`.
