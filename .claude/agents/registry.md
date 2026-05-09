# QS Agent Registry

Living roster of all Quantum Shield agents (per `.claude/charter.md`
Layer organization). Every agent must appear here with its layer, KPI,
budget, and review cadence.

| Agent | Layer | Role | KPI | Token budget | Last review |
|---|---|---|---|---|---|
| `planner` | L2 | Multi-file feature planning | TODO | shared L2 pool | — |
| `architect` | L2 | System-level design | TODO | shared L2 pool | — |
| `tdd-guide` | L2 | Test-first enforcement | TODO | shared L2 pool | — |
| `code-reviewer` | L2 | Generic code review | TODO | shared L2 pool | — |
| `rust-reviewer` | L2 | Rust-specific review | TODO | shared L2 pool | — |
| `typescript-reviewer` | L2 | TS / React review | TODO | shared L2 pool | — |
| `security-reviewer` | L2 | Auth / input / secrets | TODO | shared L2 pool | — |
| `silent-failure-hunter` | L2 | Hidden errors / hardcoded values | TODO | shared L2 pool | — |
| `claude-updates-curator` | L2 | Claude Code release adoption | weekly digest issue | low | 2026-W18 |
| `qs-pm` | L1 | Demand / market | ≥ 1 founder-decision/mo | ~$0.10/meeting | W19 (initial) |
| `qs-cto` | L1 | Technical leverage | ≥ 1 spike-rec/cycle | ~$0.10/meeting | W19 |
| `qs-cfo` | L1 | Funding & grants | ≥ 2 apps/quarter | ~$0.10/meeting | W19 |
| `qs-threat` | L1 | Quantum + standards | ≥ 1 compliance artifact/quarter | ~$0.10/meeting | W19 |
| `qs-compete` | L1 | Positioning | ≥ 1 competitive doc/mo | ~$0.10/meeting | W19 |
| `qs-devils-ad` | L1 | Critique | ≥ 1 attack vector/mo | ~$0.10/meeting | W19 |
| `qs-strategy-synthesizer` | L1 | Synthesis | weekly memo with ≥ 3 founder-decisions | ~$0.10/synthesis | W19 |
| `qs-grants-writer` | L4 | Grant drafting | ≥ 2 apps/quarter | ~$0.20/draft | new W19 |
| `qs-pr-writer` | L4 | Public technical writing | ≥ 1 published/fortnight | ~$0.15/article | new W19 |
| `qs-community` | L4 | Reply drafting | ≥ 5 substantive replies/wk | ~$0.05/reply | new W19 |
| `qs-investor-relations` | L4 | VC pipeline artifacts | ≥ 1 update/quarter, 5 VCs progressed | ~$0.10/artifact | new W19 |

## Layer summary

- **L0 Constitution**: `.claude/charter.md`
- **L1 Strategy**: 7 agents (6 perspectives + 1 synthesizer). Weekly cadence.
- **L2 Functional execution**: 9 agents. Daily cadence, used inline by Claude Code.
- **L3 Operations**: workflows (`daily-plan.yml`, `bug-hunter.yml`, `ci-autofix.yml`, `claude-updates-weekly.yml`, `prod-error-sync.yml` gated). Continuous cadence.
- **L4 Front-of-house**: 4 agents. Used as needed by founder.

## Total token budget (target)

- **Strategy meeting** (weekly): ~$0.40 (6 parallel + 1 synthesis)
- **L4 burst** (varies): ~$0.50/week if active
- **L3 workflows**: ~$3.60/month (daily-plan Sonnet 4.6 ≈ 12k tokens/day)
- **L2 inline**: founder-driven, variable
- **Aggregate target**: $30/month (subscription quota assumed primary)

## Review cadence

- **Quarterly**: KPI review per agent. Update this table's `Last review` column. Retire or revise underperforming agents.
- **Monthly**: spot-check token budget vs actual.
- **Weekly**: strategy meeting reviews L1 agents' output quality implicitly.

## Pause / disable an agent

Rename the agent file with `.disabled` suffix (e.g., `qs-pm.md.disabled`).
The Claude Code subagent loader skips disabled files. Re-enable by
renaming back. This is a founder-only action.

## Adding a new agent

1. Draft `.claude/agents/<name>.md` with frontmatter (`name`, `description`, `tools`, `model`)
2. Body must include: Mandate, Inputs, Outputs, KPI, Hard rules
3. Add to this registry table
4. Bump charter Section 4 if introducing a new layer

New agent additions are founder-only per charter Section 3.
