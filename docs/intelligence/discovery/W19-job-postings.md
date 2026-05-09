# W19 Customer Discovery — Institutional Custodian Job Postings (PQC signal scan)

**Date:** 2026-05-09
**Method:** Public job board / WebSearch indexed snippets. Direct careers pages (`bitgo.com/careers`, `fireblocks.com/careers`, `anchorage.com/careers`, `coinbase.com/careers/positions`, `sbivc.co.jp/recruit`, `bitflyer.com/ja-jp/careers`, `komainu.com/careers`, `ledger.com/careers`) all returned **HTTP 403 / FETCH_BLOCKED** to WebFetch. Findings below rely on indexed third-party snippets (Greenhouse, LinkedIn, ZipRecruiter, Lever, withB, Wantedly) and on official corporate blog/announcement pages where job copy was quoted.
**Time budget:** ~20 minutes. Breadth prioritized over depth.

---

## 1. Summary Table

| Company | PQC mention in jobs? | Notable role titles surfaced | Evidence quote (≤1 sentence) | Source |
|---|---|---|---|---|
| BitGo | **No (PQC)** / **Yes (MPC/TSS)** | Cryptographer (TSS/MPC); Senior Software Engineer — HSM | "experienced Cryptographer with strong knowledge of Threshold Signature Schemes (TSS) and Multi-Party Computation (MPC) … Familiarity with security best practices and standards, such as ISO 27001, NIST, and FIPS." | [Greenhouse / LinkedIn](https://www.linkedin.com/jobs/view/cryptographer-tss-mpc-at-bitgo-3576823021) |
| Fireblocks | **Partial** (corporate roadmap, not job copy) | Full Stack Engineer Blockchain; SecOps Expert; Cloud Infra & AI Security | "PQC is a strategic priority, and we are actively building our roadmap and conducting research work." (corporate blog, not job spec) | [Fireblocks blog](https://www.fireblocks.com/blog/google-quantum-research-institutional-crypto-security) |
| Anchorage Digital | **No (PQC)** / **Yes (cryptography)** | Member of Technical Staff, Security Engineering | "Deep understanding of modern cryptography including … symmetric and asymmetric encryption, hashing algorithms, key management, and cryptographic protocols." | [Lever](https://jobs.lever.co/anchorage/e5d0f1ac-3126-481e-857f-db6ae8eb67e9) |
| Coinbase | **No (in jobs)** / **Yes (corporate)** | Staff Blockchain Security Engineer, Cryptography Research; Staff Application Security Engineer — Coinbase Custody | "analysis of advanced cryptographic techniques like multi-party computation (MPC), zero-knowledge proofs (ZK), etc." (no PQC string in the job copy surfaced) | [LinkedIn](https://www.linkedin.com/jobs/view/staff-blockchain-security-engineer-cryptography-research-at-coinbase-3364456774) |
| SBI VC Trade | **No** | Security Engineer; blockchain / backend / SRE engineers | "セキュリティエンジニア" listed in 2026 hiring; no PQC / 耐量子 / ポスト量子 string surfaced. | [withB](https://withb.co.jp/companies/sbivctrade/), [SBI VC](https://www.sbivc.co.jp/adoption) |
| bitFlyer | **No** | セキュリティエンジニア（脆弱性診断士） | Cybersecurity dept "handles security measures for production environments, corporate environments, and anti-financial crime technical security"; no PQC keyword surfaced. | [bitFlyer recruit](https://bitflyer.com/ja-jp/recruit/offers/40) |
| Komainu | **FETCH_BLOCKED on careers page** | (LinkedIn hiring posts; specific titles not surfaced) | Corporate framing only: "state-of-the-art MPC and HSM wallet technology"; no PQC string surfaced in jobs. | [Komainu LinkedIn](https://uk.linkedin.com/company/komainu-the-trusted-custodian) |
| Ledger Enterprise | **No (in jobs)** / **Yes (Donjon research blog)** | (no PQC-titled role surfaced) | Donjon team "actively researching post-quantum cryptography (PQC) to understand engineering challenges … Ledger implemented the tested algorithms fully in software" (research blog, not job posting). | [Ledger Donjon blog](https://www.ledger.com/blog-quantum-computing-threat-to-blockchain) |

**Legend:** `Yes` = explicit PQC/ML-DSA/FIPS-204/Dilithium/SPHINCS string in job description. `Partial` = company has public PQC roadmap commitments but no PQC string in the indexed job copy. `No` = no PQC keyword surfaced in indexed job text.

---

## 2. Detailed Findings (one paragraph per company)

### BitGo
The clearest cryptography role surfaced is the **Cryptographer (TSS/MPC)** in Palo Alto (Greenhouse `boards.greenhouse.io/bitgo/jobs/6726139002`). The job demands "at least 5 years of experience working in cryptography, with a focus on TSS and MPC" and lists "RSA, ECC, AES, and SHA" plus standards "ISO 27001, NIST, and FIPS." There is **no mention of post-quantum, ML-DSA, FIPS 204, Dilithium, or SPHINCS+** in the indexed text. A second relevant role, **Senior Software Engineer — HSM**, is open (Greenhouse `8459876002`) — HSM-centric work is adjacent to FIPS 140-3 / crypto-agility but the PQC string was not surfaced. BitGo's hiring posture is **firmly MPC/TSS, classical-crypto, FIPS-140 framed**, not PQC framed.

### Fireblocks
No indexed Fireblocks job posting surfaced with a PQC keyword. However, the Fireblocks corporate blog ([What Google's New Quantum Research Means …](https://www.fireblocks.com/blog/google-quantum-research-institutional-crypto-security)) explicitly states: "PQC is a strategic priority, and we are actively building our roadmap and conducting research work," and that the research team is "mapping candidate PQC signature schemes, including … ML-DSA, SLH-DSA, FN-DSA … with code-based and multivariate constructions … particularly suited to multi-party computation architecture." Fireblocks committed to publishing a full PQC strategy doc later in 2026. **Implication:** PQC headcount likely exists but is rolled into generic "cryptography researcher" / "research" roles — the public job copy doesn't yet flag it. Their framing is explicitly **PQC-on-top-of-MPC**, not PQC-replacing-MPC.

### Anchorage Digital
The **Member of Technical Staff, Security Engineering** posting (Lever) requires "deep understanding of modern cryptography" with proficiency in "symmetric and asymmetric encryption, hashing algorithms, key management, and cryptographic protocols," languages "Go, C++, C, and Rust," and lists "Hardware Security Modules" as a plus. **No PQC, ML-DSA, FIPS 204, or quantum-safe string surfaced** in the indexed text. Given Anchorage is the only US federally-chartered crypto bank (OCC supervised, so subject to NIST/FIPS direction), this absence is itself a notable signal.

### Coinbase
Coinbase hires for a **Staff Blockchain Security Engineer, Cryptography Research** role and a **Staff Application Security Engineer — Coinbase Custody** role. The Cryptography Research role explicitly references "multi-party computation (MPC), zero-knowledge proofs (ZK)" but **the indexed copy does not contain post-quantum/PQC/ML-DSA/Dilithium strings**. Counter-signal at the corporate level: Coinbase's Independent Advisory Board on Quantum Computing and Blockchain published a 51-page position paper in April 2026, and CEO Brian Armstrong publicly committed to "introduce 'quantum-proof' custody services for institutional clients by late 2026." There is a clear gap between Coinbase's executive positioning and what its job copy currently asks for.

### SBI VC Trade
Hiring for `セキュリティエンジニア` (security engineer), AI engineer, blockchain engineer, backend, SRE, and infrastructure roles per [withB](https://withb.co.jp/companies/sbivctrade/) and [sbivc.co.jp/adoption](https://www.sbivc.co.jp/adoption). **No 耐量子 / ポスト量子 / PQC / FIPS 204 / Dilithium string surfaced** in any indexed posting. Security framing is conventional ("cold wallet storage, customer asset segregation, JVCEA self-regulation"). No PQC differentiation visible.

### bitFlyer
The dedicated **セキュリティエンジニア (脆弱性診断士)** role ([bitflyer.com/ja-jp/recruit/offers/40](https://bitflyer.com/ja-jp/recruit/offers/40)) is vulnerability-assessment-oriented (penetration testing / red team). Cybersecurity department scope is described as "production environments, corporate environments, and anti-financial crime technical security." **No PQC keyword surfaced.** Roles read as a defensive/SOC posture rather than crypto R&D.

### Komainu
Careers page returned `FETCH_BLOCKED`. LinkedIn company page describes Komainu as "regulated digital asset custodian, founded by Nomura, CoinShares, and Ledger" using "state-of-the-art MPC and HSM wallet technology." A LinkedIn `#hiring` post exists ([linkedin.com/posts/komainu-the-trusted-custodian_hiring-…](https://www.linkedin.com/posts/komainu-the-trusted-custodian_hiring-activity-7114979170329190400-iByA)) but specific job titles did not surface in indexed content. **No PQC string surfaced.** Note: Ledger is a Komainu shareholder, so Ledger Donjon's PQC research could plausibly flow into Komainu — but no public job evidence of it.

### Ledger Enterprise
No indexed Ledger job posting surfaced with a PQC keyword. The **Ledger Donjon** research team's public blog confirms active PQC R&D ("actively researching post-quantum cryptography (PQC) to understand engineering challenges … Ledger implemented the tested algorithms fully in software"). PQC work appears to live inside an existing cryptography research team rather than being broken out as a dedicated hiring line.

---

## 3. Cross-Company Signals

### Publicly committed via job listings (PQC string in job copy)
**None** of the eight surveyed custodians had an indexed job posting containing an explicit PQC keyword (post-quantum / ML-DSA / FIPS 204 / Dilithium / SPHINCS+ / quantum-safe). This is the **headline finding**.

### Publicly committed via corporate / blog posture (but not yet in job copy)
- **Coinbase** — CEO public commitment to "quantum-proof" custody by late 2026; Quantum Advisory Council 51-page paper (April 2026).
- **Fireblocks** — Blog: "PQC is a strategic priority"; full PQC strategy doc promised later in 2026; explicitly evaluating ML-DSA, SLH-DSA, FN-DSA + multivariate/code-based for MPC compatibility.
- **Ledger** (Donjon research blog only — feeds Ledger Enterprise & Komainu).

### Companies framing security around MPC / TSS instead of PQC
- **BitGo** — Cryptographer (TSS/MPC) is the marquee crypto role; no PQC mention.
- **Coinbase** — Cryptography Research role centers on "MPC, ZK"; no PQC string.
- **Anchorage Digital** — generic "modern cryptography" framing; HSM as a plus.
- **Komainu** — corporate framing "MPC and HSM wallet technology."
- **Fireblocks** — MPC is the brand; PQC is framed as *additive on top of* MPC ("particularly suited to multi-party computation architecture").

### Japan-only signal
- **SBI VC Trade**: hiring security engineers / blockchain engineers — **zero** 耐量子 / ポスト量子 / PQC string surfaced.
- **bitFlyer**: hiring vulnerability-assessment-focused security engineers — **zero** PQC string surfaced.
- Japanese custodians appear to have **no public PQC hiring signal whatsoever** as of W19 2026, despite NISC and FSA discourse on PQC migration.

---

## 4. Implications for QS Positioning (≤30 words each)

- **Wedge support:** Yes — every surveyed custodian frames cryptography around MPC/TSS, not PQC. A "PQC attestation layer that sits on top of MPC custody" wedge is **consistent** with how incumbents describe themselves.

- **Timeline read:** **Slightly early but defensible.** Coinbase publicly targets late-2026 for "quantum-proof" custody and Fireblocks promises a 2026 PQC strategy doc — so 2026-2027 is the buying-decision window, not too late.

- **Disconfirming signal (flag explicitly):** **Zero PQC keywords in any of eight custodians' job postings as of W19 2026.** Incumbents are signalling PQC via *blog posts and advisory boards*, not by hiring — they may build in-house instead of buying, or move slower than blog posture suggests. Japanese custodians show **no PQC hiring signal at all**, which weakens the "Japan-first regulated PQC custody" GTM hypothesis.
