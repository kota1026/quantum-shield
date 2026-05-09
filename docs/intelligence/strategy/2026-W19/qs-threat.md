# qs-threat — Quantum Threat + Standards Brief (W19, 2026-05-09)

## 1. Position

**CRQC realistic window: 2032–2038**, with 2035 as the median industry estimate. Willow's sub-threshold logical qubit (Dec 2024) was a real inflection — error correction is no longer hypothetical — but scaling from ~100 logical qubits today to the **~2,000–4,000 logical qubits / ~10⁶ physical qubits** required to run Shor's against secp256k1 is a 7–13 year hardware problem, not a 2–3 year one. **However, QS does not need to wait for Q-day.** The actionable forcing function is **NSA CNSA 2.0's 2030 ML-DSA mandate** and, more tactically for a Japan-based custody protocol, **FSA crypto-asset segregation rules + NISC's 2025–2026 PQC migration guidance refresh** (expected Q3–Q4 2026 per NISC's published cadence). Custody operators serving Japanese institutional clients will need a documented PQC migration plan in their next FSA inspection cycle.

## 2. Three concrete actions (next 1 week)

1. **Produce a CNSA 2.0 / FIPS 204 compliance crosswalk doc** (`docs/compliance/CNSA2_CROSSWALK.md`) mapping QS's ML-DSA-65 implementation, key sizes, RNG sourcing, and signed-software supply chain against the NSA CNSA 2.0 algorithm suite published in CNSSP-15. Deadline: 2026-05-16. This becomes the single artifact every grant/customer/auditor asks for.

2. **File a JCMVP / IPA inquiry** asking whether QS's ML-DSA-65 + SLH-DSA dual-signature scheme can be submitted under the upcoming JCMVP PQC profile (CMVP-equivalent). The profile is in public-comment cadence; **submit a written question by 2026-05-15** to be on record before the next revision freeze. Even a "not yet eligible" response creates a citable Japan-government touchpoint.

3. **Build a one-page "harvest-now-decrypt-later applicability matrix"** for QS's specific threat model (active custody, short-lived signatures, no encrypted-at-rest secrets crossing the wire). Publish on the QS site by 2026-05-16. This pre-empts the #1 skeptical question from sophisticated buyers and reframes QS away from HNDL FUD toward **signature-forgery resistance** (the actually-applicable threat).

## 3. One threat-side risk

**HNDL is the wrong threat story for asset custody.** Custody signatures are short-lived authorizations — once a withdrawal settles, a future quantum adversary recovering the signing key buys nothing. The real threat is **online forgery of a still-valid signing key** before funds are moved. If QS's marketing leans on HNDL, sophisticated CISOs will discount the pitch. Reposition around: (a) protecting **long-lived control keys** (multisig roots, governance keys, recovery seeds) where HNDL *does* apply, and (b) **regulatory compliance as the buying trigger**, not threat probability.

## 4. Non-obvious Japan angle

**FSA's crypto-asset segregation rules (改正資金決済法, 2023 amendment) require licensed exchanges to demonstrate "appropriate cryptographic controls" on cold-wallet infrastructure** — and the FSA's 2025 supervisory guideline updates explicitly invite operators to address "future cryptographic risks including quantum." No US/EU competitor (Fireblocks, Copper, BitGo) has filed a Japan-specific PQC narrative with the FSA. QS, as a Japan-domiciled protocol, can capture the **JVCEA member exchange channel** — ~30 licensed entities, all needing a PQC story for their next FSA Article 63 review cycle. This is a moat foreign competitors structurally cannot close in <18 months.

## Position summary

1. **Ship CNSA 2.0 crosswalk doc** — by 2026-05-16
2. **File JCMVP inquiry on ML-DSA-65 + SLH-DSA dual-sig profile** — by 2026-05-15
3. **Publish HNDL-applicability matrix repositioning QS toward control-key forgery + FSA compliance** — by 2026-05-16
