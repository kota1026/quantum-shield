---
agent: qs-threat
meeting: 2026-W24 (2026-06-10)
model: sonnet (via Fable 5 orchestrator)
---

# qs-threat W24 Position Paper — 2026-06-10

**Intelligence basis:** W22 deep research (2026-06-01, 74 sources); SP1 v6.2.0–v6.2.4 release notes (confirmed live); BIP-360 v0.11.0 status (confirmed live); primary-source web access blocked across NIST/NSA/EU/JP domains. The 9-day gap June 1–10 has no confirmed new regulatory events per live fetch. All findings carry the W22 DRAFT caveat on primary sources.

### 1. Position

**CRQC window: unchanged at 2032–2038, median 2035. The W24 update is on the forcing function, not the physics.**

No new logical-qubit milestone emerged in the May 9 – June 10 window. What W22 confirmed: a **White House draft quantum executive order** (Nextgov/FCW, single-source, unsigned as of June 1) would mandate PQC signature migration for federal high-impact systems by **2031-12-31** and for federal contractors by **2030** — the first concrete date attached to OMB M-23-02's successor.

The **DOE Oak Ridge RFI (892431-26-RFI-0001, deadline 2026-06-09)** codified the US government's official "useful FTQC" benchmark: 150–250 logical qubits, 10^5 hard gates, 10^-8 logical error rate by 2028. Quantinuum sits at 12 logical qubits (2026-05-19); gap is 12–20x in two years — steep but funded ($2.013B DoC LOI 2026-05-21: IBM $1B, Quantinuum $100M, seven others). No vendor is near Shor's-relevant fault-tolerant scale. The 2035 median holds.

**Single most actionable regulatory deadline:** the draft EO contractor deadline of 2030 — if signed — triggers a procurement motion in **2026-2027** because contractors must begin capability assessments now. Caveat: unsigned, single-source. Backup framing: CNSA 2.0's 2030 signed-software mandate (binding NSA guidance, verifiable).

### 2. Three Concrete Actions Tied to Specific Deadlines

**P0 — "White House Quantum EO readiness brief" + CNSA 2.0 crosswalk, by 2026-07-15.** Map QS's ML-DSA-65 verifier against the draft EO contractor requirements and CNSA 2.0's 2030 mandate. Durable asset for every enterprise RFP asking "what PQC capability do you support." Produces `docs/compliance/CNSA2_CROSSWALK.md` — **overdue from W19 (2026-05-16 deadline, unshipped per repo scan)**; shipping by 2026-07-15 satisfies the qs-threat quarterly KPI floor.

**P1 — JCMVP inquiry on ML-DSA-65 dual-signature profile eligibility, by 2026-08-31.** JP NISC PQC guidance refresh expected Q3–Q4 2026. Filing before the revision freeze puts QS on record with Japan's validation body precisely when FSA inspectors start asking JVCEA member exchanges for documented PQC plans. A JCMVP inquiry number is a citable Japan-government touchpoint no foreign competitor can produce.

**P2 — Monitor DOE Oak Ridge FTQC follow-on solicitation (expected H2 2026).** Position Approach A benchmarks (Q4 2026 per KPI floor) as FTQC cryptographic workload capability evidence. Long-lead US government procurement positioning for the 2030 contractor deadline.

### 3. One Threat-Side Risk

**The White House quantum EO is the single most overhype-prone event in the current window.** Single-outlet draft, unsigned. EOs routinely slip 6–18 months between leak and signature; contractor deadlines are frequently non-binding in practice (see OMB M-23-02 enforcement). If QS leads external communication with "EO mandates PQC by 2030," sophisticated buyers will find it unsigned. Correct framing: "CNSA 2.0 is current binding NSA guidance; a forthcoming executive action is expected to codify the 2030 deadline." Anchor on CNSA 2.0; cite the EO as directional only.

### 4. Non-Obvious Japan Angle

**The JP FSA supervisory examination cycle for FY2026 (April 2026 – March 2027) is the actual forcing function for JVCEA member exchanges — not NISC, not JCMVP.** FSA examiners under the revised 資金決済法 framework will ask for documented "cryptographic risk management" plans this fiscal year; the 2025 supervisory guidelines explicitly reference quantum cryptographic risk. Any exchange without a PQC migration roadmap is a documentation finding. QS — Japan-domiciled, working ML-DSA-65 implementation, CNSA 2.0 crosswalk in hand — can offer exactly the artifact FSA examiners are implicitly asking for: a vendor-signed attestation of FIPS 204 support. A compliance-sale at zero marginal engineering cost that no US/EU competitor can replicate with a Japan-domiciled entity name.

### 5. Position Summary — 3 Ranked Actions with Deadlines

| Rank | Action | Deadline | Binding / Aspirational |
|------|--------|----------|------------------------|
| P0 | CNSA 2.0 crosswalk + EO readiness brief (doubles as FSA examination artifact) | 2026-07-15 | CNSA 2.0 binding; EO aspirational |
| P1 | JCMVP inquiry before NISC Q3-Q4 guidance freeze | 2026-08-31 | Cadence aspirational; FSA forcing function real |
| P2 | DOE FTQC solicitation follow-on monitoring | 2026-Q4 | Non-binding, long-lead |

**Gap note:** The 32-day outage produced no confirmed CRQC milestone altering the 2032–2038 window. The DOE 150–250 logical-qubit / 2028 benchmark should replace the informal Google 2029 line as primary citation in QS threat-model docs. FIPS 204/205 remain unbroken; no algorithmic regression observed in the gap period.
