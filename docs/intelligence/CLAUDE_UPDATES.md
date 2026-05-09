# Claude Code Updates Digest

This file is appended to automatically by `scripts/check-claude-updates.sh`
on every session start. The `claude-updates-curator` agent reads it and
proposes integrations into Quantum Shield (settings.json, agents, skills,
hooks).

Workflow:
1. SessionStart hook detects a version change.
2. New entry appended below.
3. Run `/claude-updates` to fetch release notes and propose changes.
4. Curator agent opens a draft PR labelled `claude-updates`.


## 2026-05-08T10:30:35Z — version change detected

- Previous: `none`
- Current:  `2.1.133`
- Action:   run `/claude-updates` to fetch release notes and propose integrations.
- Branch:   claude/quantum-shield-updates-aXLIl

## Proposals for 2.1.133 (2026-05-08) — initial seed

### Adopted (高)

- **`xhigh` effort level** (v2.1.105–v2.1.113, 2026-04-13/17) — set
  `effortLevel: "xhigh"` in `.claude/settings.json`. Justified by the
  Rust + Next.js + Solidity multi-stack and dense PQC reasoning.
  *Applied in this PR.*

### Considered (中) — track in follow-up issues

- **`/ultrareview`** (v2.1.114–v2.1.119, 2026-04-20/24) — multi-agent
  parallel PR review. Worth wiring into the PR template once the team
  confirms billing impact. Track separately.
- **Monitor tool** (v2.1.92–v2.1.101, 2026-04-06/10) — stream `cargo test`
  / Playwright logs for live triage. Plan: add a Stop hook agent verifier
  that uses Monitor against `/tmp/qs-test.log`.
- **Auto Mode** (v2.1.83–v2.1.85, 2026-03-23/27) — reduces permission
  prompts in CI. Needs a deny list before enabling — defer.
- **`/loop` self-pacing** (v2.1.92–v2.1.101) — useful for health-checking
  Anvil/Sepolia bridges; not urgent.
- **MCP result size 500K override** — only relevant if a specific MCP
  server starts truncating; track lazily.

### Skipped (低)

- **Computer Use CLI** — Docker/headless-first stack; no GUI to drive.
- **PowerShell native tool** — Linux/WSL is the primary dev environment.
- **`/team-onboarding`** — current setup is documented in `CLAUDE.md`;
  re-evaluate if onboarding friction surfaces.

---

_Above seed produced by hand from the 2026-03-08 → 2026-05-08 research pass.
Future entries are produced by the `claude-updates` skill +
`claude-updates-curator` agent and appended below._

## 2026-05-09T07:22:22Z — version change detected

- Previous: `none`
- Current:  `2.1.138`
- Action:   run `/claude-updates` to fetch release notes and propose integrations.
- Branch:   main
