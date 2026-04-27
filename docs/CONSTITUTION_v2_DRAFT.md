# Quantum Shield Constitution v2 — DRAFT

_Status: Draft for ratification, originated 2026-04-27 (Strategic Meeting v3 conclusion)_
_Predecessor: CP-1 through CP-5 (currently distributed across `docs/WHITEPAPER.md`, `docs/grants/EF_ESP_APPLICATION.md`, `CLAUDE.md`)_

---

## Why v2?

CP-1 through CP-5 codify cryptographic and operational principles. They do not address the post-EIP-8051, post-Claude-Code reality where:

1. The cryptographic implementation itself becomes commoditized (EIP-8051/7885/8141)
2. Code production becomes commoditized (AI dev tools)
3. The defensible moat shifts to **patterns + operations + relationships**

Constitution v2 introduces **CP-6 (Network Principle)** to formalize this shift, while preserving CP-1 through CP-5.

---

## Core Principles

### CP-1: Cryptographic Compliance _(unchanged)_

- User signatures: NIST FIPS 204 ML-DSA-65
- Prover co-signatures: NIST FIPS 205 SLH-DSA / SPHINCS+
- Hashing: SHA3-256 in application layer
- Forbidden in application layer: keccak256, ECDSA, pre-FIPS algorithms
- L1 Solidity may use EVM-native primitives (Solidity-language limitation, not policy choice)

**v3 clarification**: When EIP-8051 ships, prefer `VERIFY_MLDSA` (FIPS-strict) over `VERIFY_MLDSA_ETH` (Ethereum-optimized). FIPS-strictness must not be traded for gas savings without explicit Constitutional Amendment.

### CP-2: Honest Operational Reporting _(unchanged)_

- No silent fallbacks
- No mock / FALLBACK / DEMO data in non-test code
- Logs reflect actual operations (not aspirations)

### CP-3: Type Flow Direction _(unchanged)_

```
DB schema → Backend Rust types → Frontend TypeScript types → Components
```

Lower layers must not invent types. Mismatches are bugs.

### CP-4: User Sovereignty _(unchanged)_

- Users hold their own ML-DSA keys
- No custodial takeover by Quantum Shield operator
- Time-locks and emergency paths are user-controlled

### CP-5: Decentralized Verification _(unchanged)_

- Prover Pool selection is VRF-randomized
- Slashing is quadratic and transparent
- Observer challenges are independent

### CP-6: Network Principle _(NEW)_

> _"Cryptographic implementation is not the moat. Pattern + operation + relationship is the moat."_

#### CP-6.1: Pattern Reusability

Every architectural decision must be evaluated for **portability beyond Quantum Shield**:
- Can the SR₀/SR₁ commitment scheme apply to bridges?
- Can the Prover Pool serve as a guardian replacement?
- Can the slashing curve generalize?

If a decision locks the design to custody-only, document the rationale and reconsider.

#### CP-6.2: Operational Receipts

The protocol must accumulate **verifiable operational history** as a moat:
- On-chain transaction history is permanent and citable
- Sepolia 1+ year operational record is a defensible asset
- This history cannot be retroactively manufactured by AI

**Implication**: Resist the temptation to redeploy / reset contract addresses for "clean state." Address continuity is a Constitutional value.

#### CP-6.3: Relationship Investment

The team must **invest time** in relationships that AI cannot generate:
- EF / NIST informal channels
- Bridge / Custodian RFP processes
- Regulatory consultation loops
- Academic citation networks

Engineering hours not spent on relationships are lost moat.

#### CP-6.4: Adopt-Don't-Defend Standards

When a public standard ships that subsumes our internal implementation:
- **Adopt within one minor release**
- Move our implementation to "reference" or "compatibility shim" status
- Do not maintain proprietary parallels for vanity

Examples (anticipated):
- EIP-8051 ships → migrate ML-DSA verification to precompile, deprecate SR₀/SR₁ if cheaper
- EIP-8141 ships → wire `siwe` auth through Frame Transactions
- EIP-7885 ships → use NTT precompile, remove SP1 NTT gadget if redundant

---

## Conflict Resolution

If two principles conflict, this hierarchy applies:

1. **CP-1** (Cryptographic Compliance) — never compromise
2. **CP-2** (Honest Reporting) — never compromise
3. **CP-4** (User Sovereignty) — non-negotiable
4. **CP-6.4** (Adopt-Don't-Defend) over **CP-3** (Type Flow) when standards override our types
5. **CP-6.3** (Relationships) is invested-time policy, not blocking

---

## Constitutional Amendments

Amendments require:
1. Documented strategic-meeting deliberation (v4.0 protocol)
2. Purpose Guardian's ratification
3. Founder approval
4. Public diff in `docs/CONSTITUTION_v2_DRAFT.md` history

Until ratification, this document is **DRAFT**. Production code follows CP-1 through CP-5 as currently practiced.

---

## Operational Checklist for CP-6

When evaluating a proposed feature / refactor:

- [ ] Does this strengthen Tier 1 (crypto) — knowing it will commoditize?
- [ ] Does this strengthen Tier 2 (pattern) — making it more reusable?
- [ ] Does this strengthen Tier 3 (network) — building defensible relationships?

If only Tier 1 benefits, the work is **decaying value**. Reconsider unless it is a prerequisite for Tier 2/3 work.

---

## References

- `docs/intelligence/STRATEGY_2026-04-27_v3.md` — origin context
- `docs/WHITEPAPER.md` — CP-1 to CP-5 codification (current)
- `CLAUDE.md` — daily operational rules
