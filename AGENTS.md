# AGENTS.md - Quantum Shield Project

> **Standard**: OpenAI Agentic AI Foundation
> **Version**: 1.0
> **Last Updated**: 2026-01-11

---

## Project Overview

**Quantum Shield** is a quantum-resistant L3 blockchain protocol with multi-signature verification.

### Core Components
| Component | Path | Language | Description |
|-----------|------|----------|-------------|
| L1 Contracts | `contracts/` | Solidity | Ethereum mainnet contracts |
| L3 Aegis | `l3-aegis/` | Rust | Custom L3 chain (4-node BFT) |
| Backend API | `services/api/` | Rust | REST API server |
| Event Bridge | `services/event-bridge/` | Rust | L1↔L3 message relay |
| React SDK | `packages/sdk/react/` | TypeScript | React hooks for DApp |
| WASM Crypto | `packages/sdk/wasm/` | Rust→WASM | Client-side cryptography |
| Web Apps | `apps/` | TypeScript/React | Frontend applications |

---

## Allowed Actions

### File Operations
```yaml
read:
  - "**/*"  # All files readable

write:
  - "contracts/src/**/*.sol"
  - "contracts/test/**/*.sol"
  - "contracts/script/**/*.sol"
  - "l3-aegis/**/*.rs"
  - "services/**/*.rs"
  - "packages/**/*.ts"
  - "packages/**/*.tsx"
  - "apps/**/*.ts"
  - "apps/**/*.tsx"
  - "docs_new/**/*.md"
  - "*.md"
  - "*.json"
  - "*.toml"
  - "*.yaml"

delete:
  - "contracts/test/**/*"  # Test files only
  - "docs_new/01_phase/**/*.md"  # Phase docs

no_write:
  - "_archive/**/*"  # Archive is read-only reference
  - "docs_new/00_core/CORE_PRINCIPLES.md"  # Constitution is immutable
  - ".git/**/*"
  - "node_modules/**/*"
  - "target/**/*"
```

### Command Execution
```yaml
allowed_commands:
  # Build
  - "forge build"
  - "forge clean"
  - "cargo build"
  - "cargo build --release"
  - "npm run build"
  - "npm install"

  # Test
  - "forge test"
  - "forge test --match-*"
  - "forge test --fuzz-runs *"
  - "cargo test"
  - "npm test"
  - "npm run test:*"

  # Analysis
  - "slither *"
  - "mythril analyze *"
  - "cargo clippy"
  - "npm run lint"

  # Development
  - "anvil"
  - "forge script *"
  - "cargo run *"

  # Git (read-only + safe operations)
  - "git status"
  - "git diff"
  - "git log"
  - "git branch"
  - "git add"
  - "git commit"
  - "git push origin claude/*"  # Only claude/ branches

prohibited_commands:
  - "git push origin main"
  - "git push origin master"
  - "git push --force"
  - "rm -rf"
  - "sudo *"
  - "curl * | sh"
  - "wget * | sh"
```

---

## Constraints

### Core Principles (Immutable)
These principles MUST NOT be violated by any implementation:

| # | Principle | Constraint |
|---|-----------|------------|
| **CP-1** | Complete Quantum Resistance | Use ONLY: Dilithium-III, SPHINCS+-128s, SHA3-256 |
| **CP-2** | Self-Custody | Private keys MUST remain client-side |
| **CP-3** | Time Lock Existence | Time Lock MUST NOT be set to 0 |
| **CP-4** | Slashing Existence | Slashing mechanism MUST NOT be removed |
| **CP-5** | Transparency | All state MUST be verifiable on-chain |

### Prohibited Algorithms
**NEVER use these algorithms**:
- ECDSA (Shor attack vulnerable)
- RSA (Shor attack vulnerable)
- secp256k1 (elliptic curve)
- SHA-256 / SHA-2 family (Grover attack risk)
- keccak256 (use SHA3-256 instead)

### Security Parameters (Fixed)
| Parameter | Value | Modifiable |
|-----------|-------|:----------:|
| Normal Time Lock | 24 hours | ❌ Cannot shorten |
| Emergency Time Lock | 7 days | ❌ Cannot shorten |
| Defense Period | 48 hours | ❌ Cannot shorten |
| Slashing Rate | N² × 10% | ❌ Cannot remove |

---

## Development Workflow

### Required Process
```
1. 20_task_define.md    → Define task with traceability
2. 21_impl_verify_loop.md → Implement with verification loop
3. 22_three_agent.md    → 3-agent collaborative review
4. 23_multi_candidate.md → (Optional) Multi-candidate for critical features
5. 24_sandbox_execute.md → Sandbox testing
6. 25_event_log.md      → Log verification
7. 05_pir.md            → 11-agent PIR meeting
```

### Verification Requirements
Before marking any task complete:
- [ ] `forge test` or `cargo test` PASS
- [ ] `slither` High/Critical = 0
- [ ] Event log recorded
- [ ] Spec traceability documented

---

## Documentation Structure

### Required References
| Document | Path | Purpose |
|----------|------|---------|
| Core Principles | `docs_new/00_core/CORE_PRINCIPLES.md` | Constitution (immutable) |
| Sequences | `docs_new/00_core/sequences/SEQUENCES_v2.0.md` | Flow specifications |
| Unified Spec | `docs_new/00_core/specs/UNIFIED_SPEC_v2.0.md` | Detailed specifications |
| Current State | `docs_new/01_phase/CURRENT_STATE.md` | Project status |
| Current Task | `docs_new/01_phase/CURRENT_TASK.md` | Active task definition |
| Event Log | `docs_new/01_phase/EVENT_LOG.md` | Session logs |

### Archive Reference
The `_archive/` directory contains working implementations that can be used as reference:
- `_archive/v1-stark-native/prover.rs` - Winterfell STARK prover (working)
- `_archive/v1-stark-native/air.rs` - AIR constraints
- `_archive/v1-stark-native/trace.rs` - Trace generation

**Important**: Do NOT modify `_archive/`. Use it as read-only reference.

---

## Error Handling

### When Stuck
1. Check Event Log for similar past issues
2. Consult `_archive/` for reference implementations
3. After 5 verification loops, request human intervention
4. Document blocker in `CURRENT_STATE.md`

### When Unsure
1. Refer to `CORE_PRINCIPLES.md` for guidance
2. Check `SEQUENCES.md` for expected behavior
3. Ask for clarification before proceeding

---

## Contact

For questions about this configuration:
- Review `docs_new/02_agents_prompt/` for prompt definitions
- Check `docs_new/00_core/` for specifications

---

**END OF AGENTS.md**
