# Quantum Shield — Feed Reliability Log

## Escalation Policy

| Condition | Action |
|-----------|--------|
| Same feed FETCH_FAILED >= 3 consecutive days | P1 fix |
| NIST PQC feed FETCH_FAILED > 7 days | P0 — check csrc.nist.gov RSS path |
| Ethereum EIPs feed FETCH_FAILED > 7 days | P0 — check eips.ethereum.org |
| >= 10 feeds FETCH_FAILED on same day | Investigate runner network egress |

## 2026-05-09

| Feed | Axis | Status | Consecutive Fails | Notes |
|------|------|--------|-------------------|-------|
| NIST PQC RSS | A | FETCH_FAILED | 2 | P0 escalation triggered |
| IBM Research | A | FETCH_FAILED | 2 | — |
| Apple Security | B | FETCH_FAILED | 2 | — |
| SandboxAQ | C | FETCH_FAILED | 2 | — |
| PQShield blog | C | FETCH_FAILED | 2 | — |
| PQShield GitHub | C | FETCH_FAILED | 2 | — |
| Ledger blog | C | FETCH_FAILED | 2 | — |
| IETF datatracker | D | FETCH_FAILED | 2 | — |
| ENISA news | D | FETCH_FAILED | 2 | — |
| Ethereum EIPs | D | FETCH_FAILED | 2 | P0 escalation triggered |
| Ethereum Magicians | D | FETCH_FAILED | 2 | — |
| Optimism blog | E | FETCH_FAILED | 2 | — |
| Gitcoin blog | E | FETCH_FAILED | 2 | — |
| RISC Zero | F | FETCH_FAILED | 2 | — |
| 0xPARC | F | FETCH_FAILED | 2 | — |
| NEC R&D | G | FETCH_FAILED | 2 | — |
| Google Research | A | OK | — | No PQC signal |
| Cloudflare blog | B | OK | — | Org announcement (truncated) |
| Signal blog | B | OK | — | Group labels (not PQC) |
| Chainlink blog | B | OK | — | Q1 2026 quarterly review |
| AWS Security | B | OK | — | April 2026 ICYMI |
| Fireblocks | C | OK | — | Content truncated |
| QRL GitHub | C | OK | — | v4.0.6 (2026-03-06) |
| EF blog | E | OK | — | Glamsterdam recap (2026-05-02) |
| StarkWare blog | F | OK | — | Feed empty (no items) |
| liboqs GitHub | F | OK | — | v0.15.0 (2025-11-14) |
| arxiv cs.CR | F | OK | — | Empty (weekend skip days) |
| Cairo GitHub | F | OK | — | v2.18.0 |
| Vitalik blog | G | OK | — | April 2026 LLM post |
