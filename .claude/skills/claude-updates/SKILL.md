---
name: claude-updates
description: Use when the user wants to review the latest Claude Code releases and integrate relevant features into Quantum Shield. Triggered manually via /claude-updates, automatically by the SessionStart hook when a version change is detected, and on a schedule via .github/workflows/claude-updates-weekly.yml.
---

# Claude Code Updates Skill

Fetch recent Claude Code release notes, score each item for fit with the
Quantum Shield project, and propose integrations as concrete diffs against
`.claude/settings.json`, `.claude/agents/`, `.claude/skills/`, hooks, and
GitHub workflows.

## When to Activate

- The user runs `/claude-updates`.
- `docs/intelligence/CLAUDE_UPDATES.md` shows a recent version-change entry
  that has not yet been processed (no matching `## Proposals for <version>`
  section below it).
- The weekly GitHub Actions job opens an issue labelled `claude-updates`.

## Process

### 1. Establish the time window

```bash
git log -1 --format=%ai -- docs/intelligence/CLAUDE_UPDATES.md 2>/dev/null
claude --version
```

Default window: last 30 days. Extend back to the last "## Proposals for ..."
section in `docs/intelligence/CLAUDE_UPDATES.md` if older.

### 2. Fetch release notes

Primary sources (use WebFetch):

- https://docs.claude.com/en/release-notes/claude-code
- https://github.com/anthropics/claude-code/releases
- https://docs.claude.com/en/docs/claude-code/overview (feature surface)

Skim `.claude/rules/` and `CLAUDE.md` so proposals respect the project's
existing guard rails (no MOCK/FALLBACK, types flow backend->frontend, snake_case
enums on the API, WCAG 2.1 AA).

### 3. Score each new feature

For every release-note item, fill out:

| Field | Example |
|---|---|
| Version | v2.1.105 |
| Date | 2026-04-13 |
| Feature | `xhigh` effort level |
| Category | model / agent / skill / hook / mcp / cli / ide / settings |
| Fit score | 高 / 中 / 低 |
| Why | "PQC + Rust + Solidity needs deeper reasoning per turn" |
| Action | concrete diff (see step 4) |

Skip features rated 低 — note them in the digest but do not propose changes.

### 4. Produce concrete proposals

For each 高/中 item, emit one of these artefact types into
`docs/intelligence/CLAUDE_UPDATES_PROPOSALS.md`:

- **settings.json patch** — unified diff against `.claude/settings.json`.
  Validate against the schema before writing. Field names must come from the
  release notes verbatim (Claude has rejected guessed field names before, e.g.
  `defaultEffortLevel` vs. the correct `effortLevel`).
- **New agent** — full `.claude/agents/<name>.md` matching the existing
  frontmatter shape (`name`, `description`, `tools`, `model`).
- **New skill** — `.claude/skills/<name>/SKILL.md` with `name`/`description`
  frontmatter, "When to Activate", "Process".
- **Hook addition** — block to insert under the right event in
  `.claude/settings.json` plus the script under `.claude/hooks/` or
  `scripts/`.
- **GitHub workflow** — file under `.github/workflows/` mirroring the style
  of `weekly-research.yml`.

Do NOT auto-apply. The output of this skill is a proposal document plus, if
the change is mechanical and low-risk, a draft PR via the
`claude-updates-curator` agent.

### 5. Quantum Shield fit checklist

When deciding 高/中/低, weight these project realities:

- **Rust + Next.js + Solidity multi-stack**: features that improve cross-stack
  reasoning (effort levels, sub-agent orchestration, larger context) score 高.
- **Heavy Playwright + Docker E2E**: streaming/log monitor tools score 高.
- **Multi-PR review burden**: parallel review tooling (`/ultrareview`,
  multi-agent review) scores 高.
- **Existing custom agents** (planner, *-reviewer, silent-failure-hunter):
  prefer extending them over installing new generic ones.
- **Strict CLAUDE.md rules**: features that automate rule-checking
  (auto mode, prompt hooks, agent-typed Stop hooks) score 中–高.
- **Avoid duplication**: if Quantum Shield already has a skill/agent that
  covers the same surface, downgrade fit by one level.

### 6. Output format

Append a section to `docs/intelligence/CLAUDE_UPDATES.md`:

```markdown
## Proposals for <version> (<YYYY-MM-DD>)

### Adopted (高)
- **<feature>** — <one-line rationale>. See `<file>` for diff.

### Considered (中)
- **<feature>** — <rationale>. Tracking in issue #<n>.

### Skipped (低)
- <feature>: <reason>.
```

Then hand off to the `claude-updates-curator` agent to produce a draft PR.

## Anti-patterns

- Do NOT enable preview features on the main branch without a feature flag.
- Do NOT add new dependencies just because a release note mentions an
  integration.
- Do NOT silently change `effortLevel`, `model`, or permissions — these are
  visible to every contributor.
- Do NOT remove existing hooks/agents/skills as part of an "upgrade" without
  explicit user approval.

## Quick example

User runs `/claude-updates` after upgrading to v2.1.133:

1. Skill reads `docs/intelligence/CLAUDE_UPDATES.md` -> last processed v2.1.92.
2. Fetches release notes 2.1.93..2.1.133.
3. Identifies `xhigh` effort, `/ultrareview`, Monitor tool as 高.
4. Writes proposals to `docs/intelligence/CLAUDE_UPDATES_PROPOSALS.md`:
   - `effortLevel: "xhigh"` patch (settings.json)
   - `.github/workflows/ultrareview.yml` scaffold
   - `scripts/monitor-cargo-test.sh` scaffold
5. Hands off to curator agent for draft PR.
