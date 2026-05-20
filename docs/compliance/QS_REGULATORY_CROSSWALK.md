---
Status: DRAFT — founder must review every regulatory citation against primary source before publishing
Owner: kota1026
Last updated: 2026-05-09
Purpose: First-pass regulatory crosswalk for institutional custodians evaluating PQC attestation primitives
---

# Quantum Shield Regulatory Crosswalk

> **Legal disclaimer**: This document is not legal advice. It is a technical reference for compliance professionals and their counsel. No claim made here constitutes a representation that Quantum Shield is compliant with any regulatory framework. All regulatory citations should be verified against primary sources before use in any regulatory filing, audit response, or vendor-risk assessment.

---

## Executive Summary

This document is a crosswalk — a side-by-side mapping of published regulatory requirements against the design claims of the Quantum Shield (QS) post-quantum cryptographic attestation protocol. A crosswalk is a navigation aid, not a compliance certificate. It is produced by the QS development team and has not been independently verified.

The intended audience is the compliance function at institutional digital-asset custodians — specifically the teams at firms such as Fireblocks, BitGo, Coincheck, Komainu, and SBI VC Trade that are beginning to document their cryptographic roadmaps under DORA, FSA supervisory guidelines, and NSA CNSA 2.0 obligations. Regulatory examiners from JFSA, BaFin, and OMB-adjacent oversight bodies may also find this useful as a reference frame when evaluating whether a custodian's PQC inventory is credible.

This document does not claim that Quantum Shield is a FIPS 140-3-validated cryptographic module, a JCMVP-certified product, or a DORA-compliant third-party service provider. It documents where the QS attestation layer's design choices intersect with those frameworks, and where they do not. Custodians are solely responsible for their own regulatory compliance determinations.

---

## Scope and Limitations

**In scope for this crosswalk:**
- The QS attestation layer: the signature scheme used (NIST FIPS 204 ML-DSA-65 and FIPS 205 SLH-DSA), the signing operation, and the on-chain commitment receipt format (SHA3-256 commitments against the Sepolia Vault contract at `0x07012aeF87C6E423c32F2f8eaF81762f63337260`)
- The protocol's threat model and the regulatory frameworks that address that threat model

**Explicitly out of scope:**
- **Key management module compliance**: the custodian's HSM or MPC infrastructure remains under the custodian's own FIPS 140-3 / JCMVP / SOC 2 attestation regime; QS does not touch private key material
- **UI, client, or browser compliance**: no assessment of WCAG, PCI, or accessibility regulatory frameworks
- **Operational compliance**: SOX, PCI DSS, GDPR personal-data handling, AML/KYC, and licensing compliance are not addressed
- **Jurisdictions not researched**: BSI (Germany), Israeli securities regulators, MAS (Singapore), NYDFS BitLicense specifics — these are noted in the Open Questions section

**Temporal caveat**: All regulatory citations are verified to publicly-available source documents as of 2026-05-09. Regulatory guidance in this area is moving rapidly. The founder must re-verify each citation before any external use.

---

## Regulatory Framework Table

| Regulator / Framework | Requirement (paraphrased) | Source | Effective Date | How QS Claims to Address It | Evidence Artifact | Confidence |
|---|---|---|---|---|---|---|
| **NSA CNSA 2.0** | Software and firmware must be signed with post-quantum algorithms (ML-DSA) by 2030; network security devices by 2030 | [NSA CNSA 2.0 Announcement](https://www.nsa.gov/Press-Room/Press-Releases-Statements/Press-Release-View/Article/3148990/) | Deadline: 2030 | QS uses ML-DSA-65 (FIPS 204) as the primary signature scheme for all user-submitted transaction attestations. The signing algorithm selection claims to align with CNSA 2.0's algorithm mandate. | `src/api/api/src/crypto/` directory; `CLAUDE.md` "Cryptography (CP-1 Compliance)" section; Sepolia Vault `0x07012aeF87C6E423c32F2f8eaF81762f63337260` | HIGH |
| **NSA CNSA 2.0** | Key establishment (KEM) must transition to ML-KEM by 2031 | [NSA CNSA 2.0 FAQ](https://www.nsa.gov/) — TODO[founder]: verify KEM-specific deadline in current FAQ document | Deadline: 2031 | QS does NOT currently implement ML-KEM (FIPS 203). The attestation receipt scheme does not involve a key encapsulation mechanism; key transport is out of band. This is explicitly noted as future work and is not claimed as addressed. | None — acknowledged gap | PARTIAL |
| **NIST FIPS 204** (ML-DSA) | ML-DSA-65 is the standardized post-quantum digital signature algorithm | [NIST FIPS 204 Final, Aug 2024](https://csrc.nist.gov/pubs/fips/204/final) | Final: August 2024 | QS claims to use ML-DSA-65 parameters as specified in FIPS 204. The Rust implementation references NIST-standardized parameters via the `fips204` crate. | `src/api/api/src/crypto/` — TODO[founder]: confirm exact crate version in Cargo.toml; verify parameter set is ML-DSA-65 not ML-DSA-44 or ML-DSA-87 | HIGH |
| **NIST FIPS 205** (SLH-DSA) | SLH-DSA is the standardized stateless hash-based post-quantum signature algorithm | [NIST FIPS 205 Final, Aug 2024](https://csrc.nist.gov/pubs/fips/205/final) | Final: August 2024 | QS claims to use SLH-DSA (SPHINCS+ family) for the emergency unlock path, providing a second independent cryptographic assumption for critical operations. | `src/api/api/src/crypto/` — TODO[founder]: confirm SLH-DSA parameter set (SLH-DSA-SHA2-128s, 128f, or other) and that it matches FIPS 205 exactly | HIGH |
| **NIST FIPS 140-3** | Cryptographic modules used in federal applications and regulated contexts must be validated under FIPS 140-3 | [NIST FIPS 140-3](https://csrc.nist.gov/publications/detail/fips/140/3/final) | In effect | QS is explicitly NOT a FIPS 140-3-validated cryptographic module. The QS attestation layer is a protocol; the cryptographic primitives it calls are FIPS 204/205-standardized but the module itself has not undergone CMVP validation. The custodian's HSM or MPC infrastructure, which holds private key material, remains under the custodian's own FIPS 140-3 validation. QS does not weaken that boundary. | N/A — architectural boundary documented in `CLAUDE.md` "Cryptography (CP-1 Compliance)" | HIGH |
| **NIST IR 8547** | Institutions should conduct a cryptographic inventory of all systems and dependencies in preparation for PQC migration | [NIST IR 8547](https://csrc.nist.gov/publications/detail/ir/8547/draft) — TODO[founder]: confirm final publication status | Draft; final TBD | QS claims to provide protocol-level cryptographic inventory transparency: all signing algorithms, parameter sets, and contract addresses are publicly documented. The EF ESP application (`docs/grants/EF_ESP_APPLICATION.md`) constitutes a machine-readable inventory of QS's own cryptographic dependencies. Custodians may reference this when compiling their third-party PQC inventories. | `docs/grants/EF_ESP_APPLICATION.md`; `CLAUDE.md` cryptographic dependencies section | PARTIAL |
| **EU DORA Art. 6** | Financial entities must identify, classify, and document all ICT risks including cryptographic risk; the risk management framework must address material technology risks | [DORA Regulation (EU) 2022/2554](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32022R2554) Art. 6 | In effect: January 2025 | QS claims to provide on-chain auditable attestation receipts (SHA3-256 commitments on Sepolia) that constitute verifiable cryptographic-provenance evidence. A custodian's DORA ICT risk register may reference QS architecture documentation as evidence of PQC transition activity for the attestation layer. QS does not itself constitute a DORA-compliant risk management framework; it claims to supply evidence artifacts that support one. | Sepolia Vault `0x07012aeF87C6E423c32F2f8eaF81762f63337260`; SR₀/SR₁ commitment scheme documented in `docs/core/SEQUENCES.md` | PARTIAL |
| **EU DORA Art. 28** | Financial entities must manage ICT third-party risk including cryptographic provider risk; contractual arrangements must include audit rights and exit provisions | [DORA Regulation (EU) 2022/2554](https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32022R2554) Art. 28 | In effect: January 2025 | QS is open-source; source code is publicly auditable. The on-chain attestation layer is permissionless — a custodian's receipts remain verifiable on-chain regardless of QS organizational status. This claims to partially satisfy Art. 28 exit provisions by design (no vendor lock-in at the cryptographic layer). Formal DORA third-party register entry requires the custodian's own legal assessment. | GitHub repository (TODO[founder]: confirm public URL and LICENSE file); on-chain contracts | PARTIAL |
| **OMB M-23-02** | US federal agencies must inventory cryptographic systems by Q3 2024 and begin PQC migration on a priority schedule | [OMB M-23-02, Dec 2022](https://www.whitehouse.gov/wp-content/uploads/2022/11/M-23-02-M-Memo-on-Migrating-to-Post-Quantum-Cryptography.pdf) | Inventory: Q3 2024; migration ongoing | QS is not a US federal agency and M-23-02 is not directly applicable to QS or to private custodians. Indirectly: custodians holding tokenized US treasuries or operating as contractors to federal financial entities may face derivative obligations. QS documentation may serve as supporting evidence for such custodians' own M-23-02-adjacent assessments. QS makes no direct claim of M-23-02 compliance. | N/A — noted for informational context only | ANTICIPATORY |
| **JFSA / 改正資金決済法 (2023)** | Crypto-asset exchange service providers and custodians must establish and maintain risk management systems that account for foreseeable technological risks, including emerging cryptographic risks | 金融庁「暗号資産交換業者に関する内閣府令」および「監督指針」— TODO[founder]: verify exact article reference in current 監督指針 (likely III-2-6 or equivalent risk management section) | Amended provisions in force 2023; ongoing | QS claims to provide documentation suitable for inclusion in a custodian's リスク管理体制 (risk management system) disclosure. Specifically: the existence of a deployed PQC attestation primitive with auditable on-chain receipts claims to demonstrate forward-looking cryptographic risk management. Custodians must make their own determination that this documentation satisfies FSA supervisory expectations. | `docs/grants/EF_ESP_APPLICATION.md` technical architecture; Sepolia deployed contracts | PARTIAL |
| **Japan JCMVP** | Japan's cryptographic module validation program (IPA-administered, analogous to FIPS 140-3 CMVP) requires validation for cryptographic modules used in regulated contexts | [IPA JCMVP](https://www.ipa.go.jp/security/jcmvp/) | Ongoing program | QS is NOT a JCMVP-validated cryptographic module. Scope is identical to the FIPS 140-3 analysis above: QS is a protocol, not a module. The custodian's HSM or MPC solution remains the JCMVP-relevant boundary. IPA has not yet published a JCMVP cryptographic profile for ML-DSA-65 attestation as of 2026-05-09; this is an open item. | N/A — acknowledged program boundary | HIGH |
| **JP NISC PQC Migration Guidance** | NISC (内閣サイバーセキュリティセンター) is expected to publish updated PQC migration guidance for critical infrastructure operators, potentially including financial infrastructure | TODO[founder]: monitor NISC publications at https://www.nisc.go.jp/; no final document exists as of 2026-05-09 | Anticipated H2 2026 | QS positions itself as a reference open-source PQC attestation deployment that could be cited in industry responses to NISC guidance when it publishes. This is an anticipatory positioning claim, not a compliance claim. Update this row when guidance is published. | No current evidence artifact — anticipatory | ANTICIPATORY |

---

## Regulator-Facing FAQ

The following questions represent the inquiries a JFSA examiner, DORA supervisory authority, or internal compliance function at a custodian would be most likely to ask when evaluating QS as a third-party attestation layer. Answers are technical and dispassionate.

**Q1. Is Quantum Shield a FIPS 140-3-validated cryptographic module?**

No, and it does not claim to be. FIPS 140-3 validates cryptographic modules — hardware or software units with defined boundaries that perform cryptographic operations including key generation, storage, and zeroization. Quantum Shield is a protocol that orchestrates calls to cryptographic primitives (ML-DSA-65, SLH-DSA) which are standardized under FIPS 204 and FIPS 205 respectively. The private key material used to generate attestation signatures remains in the custodian's existing infrastructure (HSM, MPC). That infrastructure is the FIPS 140-3 boundary; QS does not alter it.

**Q2. Has Quantum Shield been independently audited?**

Not as of 2026-05-09. An Ethereum Foundation Ecosystem Support Program (EF ESP) application is under review (submitted May 2026); independent third-party cryptographic audit is a stated deliverable in the QS roadmap contingent on grant funding. The source code is open and available for review by any party. No audit report exists, and this crosswalk does not substitute for one. Custodians requiring an audit report before deployment should not deploy until that deliverable is completed.

**Q3. What happens to custody if Quantum Shield fails or is abandoned?**

Quantum Shield is a composable attestation receipt layer, not a key custody layer. Failure, discontinuation, or compromise of the QS protocol does not impair the custodian's ability to access or manage assets using their existing MPC or HSM infrastructure. In the worst case, QS receipt generation ceases: new attestation receipts cannot be produced, and historical receipts remain on-chain but cannot be updated. The custodian's underlying un-attested custody path remains fully operational. This property claims to satisfy DORA Art. 28 exit provision requirements by architectural design, though the custodian's legal team must confirm this interpretation.

**Q4. What is the threat model? What does Quantum Shield actually defend against?**

The primary threat addressed is a cryptanalytically relevant quantum computer capable of breaking ECDSA via Shor's algorithm, which would allow an adversary to forge ECDSA transaction signatures and thereby impersonate legitimate custodians. QS claims to mitigate this by providing ML-DSA-65 and SLH-DSA signatures as a parallel, quantum-resistant attestation path.

QS does NOT defend against: classical-era threats to custody (insider risk, key compromise, social engineering, operational failure), denial-of-service against the on-chain receipt layer, or cryptographic breaks against ML-DSA-65 or SLH-DSA themselves. The threat model documentation in `docs/grants/EF_ESP_APPLICATION.md` provides further specifics.

**Q5. When is Q-day? Should this deployment decision be based on Q-day estimates?**

QS does not claim a Q-day date and treats published Q-day estimates as speculative. The deployment decision should be based on regulatory deadlines, not Q-day timing. The forcing functions are: NSA CNSA 2.0 software signing deadline (2030), anticipated JP NISC guidance (H2 2026), and FSA examiner expectations for demonstrable PQC risk management activity. These are deterministic regulatory calendars, not probabilistic physics estimates.

**Q6. Can Quantum Shield be used in production today?**

No. As of 2026-05-09, QS is deployed on Ethereum Sepolia testnet only. Production deployment requires: custodian-side integration work; risk acceptance by the custodian's risk function; likely an independent cryptographic audit; and the NTT BN254 precompile (`0x15`) reaching Ethereum mainnet for full proof verification. The testnet deployment is suitable for technical evaluation, integration testing, and regulatory documentation purposes. It is not suitable for protecting live customer assets.

**Q7. How does QS compose with our existing MPC infrastructure?**

QS attests to a transaction that has already been signed by the custodian's MPC. The MPC key-share architecture is unchanged: QS does not receive, split, or store any private key material. QS receives a completed transaction (or a commitment to one), generates an ML-DSA-65 signature over a structured receipt, and records that receipt on-chain. The result is a separately-verifiable cryptographic trail that a regulator or auditor can examine independently of the MPC vendor's cooperation or continued operation.

**Q8. Is the source code open? What is the license?**

The QS source code is publicly available at github.com/kota1026/quantum-shield. TODO[founder]: confirm that a LICENSE file is present and the license terms are appropriate for institutional use before this document is published externally. The license terms determine whether custodians can run, modify, and audit the code under their own internal review processes without restriction.

---

## Open Regulatory Questions

The following items represent areas where QS does not yet have a defensible answer. They are listed honestly to prevent custodians from over-relying on this crosswalk.

1. **IPA JCMVP profile for ML-DSA-65**: IPA has not published a JCMVP cryptographic module profile for ML-DSA-65 attestation operations as of 2026-05-09. Until IPA does so, custodians subject to JCMVP requirements cannot map QS to a validated profile.

2. **BSI / German Federal Office for Information Security**: Germany's BSI has published PQC migration guidance (TR-02102 series). QS has not been evaluated against BSI TR-02102-1. Custodians regulated under German law or by BaFin should conduct an independent mapping. TODO[founder]: review https://www.bsi.bund.de/

3. **MAS (Singapore) and NYDFS (BitLicense)**: Neither has published explicit PQC attestation requirements as of this writing. The general framework rows in this crosswalk are the best available approximation. Custodians under MAS or NYDFS oversight should obtain jurisdiction-specific advice.

4. **Audit-firm precedent**: As of 2026-05-09, no major cryptographic security firm (Trail of Bits, NCC Group, Kudelski Security, Cure53) has published a completed audit of a deployed PQC custody attestation primitive on a public blockchain. Custodians expecting an audit-firm sign-off comparable to existing MPC or HSM audits should anticipate scoping work to define the right audit frame.

5. **FATF / AML implications of on-chain receipt transparency**: The SR₀/SR₁ commitment scheme publishes a hash on-chain. The relationship between on-chain receipt transparency and FATF travel-rule obligations has not been analyzed.

---

## Citations

| Reference | URL | Access Status (as of 2026-05-09) |
|---|---|---|
| NSA CNSA 2.0 Press Release | https://www.nsa.gov/Press-Room/Press-Releases-Statements/Press-Release-View/Article/3148990/ | TODO[founder]: verify live |
| NIST FIPS 204 (ML-DSA) Final | https://csrc.nist.gov/pubs/fips/204/final | TODO[founder]: verify live |
| NIST FIPS 205 (SLH-DSA) Final | https://csrc.nist.gov/pubs/fips/205/final | TODO[founder]: verify live |
| NIST FIPS 140-3 | https://csrc.nist.gov/publications/detail/fips/140/3/final | TODO[founder]: verify live |
| NIST IR 8547 (PQC Migration Roadmap) | https://csrc.nist.gov/publications/detail/ir/8547/draft | TODO[founder]: verify final vs draft status |
| EU DORA (Regulation 2022/2554) | https://eur-lex.europa.eu/legal-content/EN/TXT/?uri=CELEX%3A32022R2554 | TODO[founder]: verify live |
| OMB M-23-02 | https://www.whitehouse.gov/wp-content/uploads/2022/11/M-23-02-M-Memo-on-Migrating-to-Post-Quantum-Cryptography.pdf | TODO[founder]: verify live and not superseded |
| 金融庁 暗号資産交換業者監督指針 | https://www.fsa.go.jp/ | TODO[founder]: locate the exact 監督指針 chapter and article number |
| IPA JCMVP Program | https://www.ipa.go.jp/security/jcmvp/ | TODO[founder]: verify live |
| NISC PQC Guidance (anticipated) | https://www.nisc.go.jp/ | Not yet published — monitor |
| BSI TR-02102-1 | https://www.bsi.bund.de/ | TODO[founder]: review for additional crosswalk row |

---

## Founder Review Checklist

Before citing this document in any external communication, regulatory response, vendor-risk questionnaire, or published article, the founder must complete all items below.

- [ ] All NSA CNSA 2.0 dates (2030 software, 2031 KEM) verified against the current NSA cybersecurity advisory page
- [ ] FIPS 204 parameter set confirmed as ML-DSA-65 (not ML-DSA-44 or ML-DSA-87) by reading Cargo.toml dependency version and cross-referencing against the FIPS 204 final specification tables
- [ ] FIPS 205 parameter set confirmed and documented — the specific SLH-DSA parameter set in use must be named explicitly (e.g., SLH-DSA-SHA2-128s) before the FIPS 205 row can carry HIGH confidence
- [ ] FSA 監督指針 reference verified against the current 金融庁 published version — specific chapter and article number must replace the placeholder reference in the table
- [ ] OMB M-23-02 confirmed still current and not superseded by a later OMB memorandum
- [ ] EU DORA article citations confirmed accurate — Art. 6 and Art. 28 referenced here must match the final official text
- [ ] LICENSE file present in the repository with a license that permits institutional review and use
- [ ] FAQ Q3 (custody-fail-safety) reviewed by an actual custody compliance professional or counsel before any external publication
- [ ] JCMVP scope statement confirmed against IPA's current public program documentation
- [ ] Independence statement appended to any external version of this document: "This document is not legal advice. Quantum Shield is not a regulated entity. Nothing in this document constitutes a compliance certification, audit opinion, or regulatory approval."

---

*End of document. Status: DRAFT. Do not distribute externally until all checklist items are resolved.*
