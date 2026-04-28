# P1 Cryptography Co-Founder Shortlist (2026-04-28)

_Output of the Co-Founder P1 PQC research run. Companion to `docs/business/COFOUNDER_OUTREACH.md`._
_Owner: Kota Kato. Target: 3 named candidates by 2026-05-04, first contact within 7 days._
_Source: Boneh / Lindell / NIST / 2024–2026 IACR ePrint authors._

## Recommendation

Contact **Binyi Chen first** (Stanford / ex-Espresso). Highest signal-to-noise:
he ships code, his current work (LatticeFold+) is the **exact primitive
Quantum Shield needs** for ML-DSA aggregation, and he is in the
post-doc → co-founder transition window. If he passes, **Benjamin
Benčina** is the second contact (lattice-signatures specialist, PhD
finishing). **Benedikt Wagner** is the third only after verifying he is
not full-time EF (would be a conflict).

## Tier 1 — Reach out by 2026-05-04

### A. Binyi Chen — Stanford Applied Crypto Group (Boneh)

| Field | Value |
|---|---|
| Affiliation | Postdoc, Stanford ([profiles.stanford.edu/binyi-chen](https://profiles.stanford.edu/binyi-chen)) |
| Homepage | [chancharles92.github.io](https://chancharles92.github.io/) |
| Scholar | `a89ft7EAAAAJ` |
| X / Twitter | `@charles_chen533` |
| Key 2025 work | **LatticeFold+** ([eprint 2025/247](https://eprint.iacr.org/2025/247), CRYPTO 2025) — first lattice-based folding scheme with plausible PQ security; explicitly motivated by aggregating Ethereum PQ signatures |
| Why QS specifically | LatticeFold is the missing primitive for our SP1-based ZK SPHINCS+ verifier roadmap (`docs/ROADMAP_PQ_VERIFIER.md` Phase 2.1). Industry experience (ex-Espresso Chief Cryptographer) means he ships, not just publishes |
| Co-founder window | **Open** — postdoc, not tenured |

**First message draft (≤120 words, send via Stanford profile contact form)**:

> Subject: 30-min research call — applying LatticeFold+ to ML-DSA custody aggregation
>
> Hi Binyi, I read LatticeFold+ — the implication for aggregating
> ML-DSA signatures in an Ethereum custody vault feels concrete. I run
> Quantum Shield, a non-custodial dual-NIST (ML-DSA + SLH-DSA) custody
> protocol live on Sepolia at `0x07012aeF…7260`. Phase 2 of our
> roadmap is a SP1-based ZK SPHINCS+ verifier; lattice folding is the
> piece I don't have a credible plan for. Would you have 30 minutes
> for a research call? Not pitching equity yet — just want to know if
> the engineering matches what your paper assumes.
>
> Kota Kato — `kota@quantum-shield.xyz` · github.com/kota1026/quantum-shield

### B. Benjamin Benčina — Royal Holloway ISG (Albrecht group)

| Field | Value |
|---|---|
| Affiliation | 4th-year PhD ([pure.royalholloway.ac.uk/en/persons/benjamin-bencina](https://pure.royalholloway.ac.uk/en/persons/benjamin-bencina)) |
| Group | Albrecht — see [martinralbrecht.wordpress.com](https://martinralbrecht.wordpress.com) for advisor's blog |
| Key 2025 work | "Hollow LWE" (UPKE from LWE/PCE) — Eurocrypt 2025; HAWK-family work on Lattice Isomorphism as a cryptographic group action |
| Why QS specifically | Lattice signatures specialist (HAWK = lattice signatures family adjacent to Falcon and Dilithium). PhD finishing window aligns with co-founder availability. No industry conflict |
| Co-founder window | **Likely open** — finishing 4th-year PhD |

**First contact**: cold email via RHUL Pure portal contact form.
Reference Hollow LWE paper specifically.

### C. Benedikt Wagner — independent, post-CISPA, PQ-Ethereum researcher

| Field | Value |
|---|---|
| Affiliation | Post-PhD (CISPA, May 2024) — verify current employer before contact |
| Homepage | [benedikt-wagner.dev](https://benedikt-wagner.dev/) |
| IACR | [author.php?authorkey=12012](https://iacr.org/cryptodb/data/author.php?authorkey=12012) |
| Key 2025 work | **"Hash-Based Multi-Signatures for Post-Quantum Ethereum"** ([eprint 2025/055](https://eprint.iacr.org/2025/055)) + "Top of the Hypercube" (CRYPTO 2025) |
| Why QS specifically | The single most relevant paper to QS's design — hash-based multi-sig for PQ Ethereum is literally what our SLH-DSA prover quorum is doing |
| **Conflict warning** | Publicly aligned with EF leanSig. **Verify employment before contact** — if full-time EF, do not approach |

**Action before contact**: search for his most recent affiliation
statement. If he is at EF, treat as a strategic advisor target instead
of co-founder.

## Tier 2 — Watch list (do NOT contact for co-founder yet)

### D. Mikhail Kudinov — Blockstream Research

- ex-TU Eindhoven PhD; co-author leanSig + "Hash-Based Signatures for Bitcoin" (eprint 2025/2203)
- **Active employer is PQC-adjacent** → conflict
- Re-evaluate only if he posts a job change in 2026 H2

### E. Giacomo Borin — IBM Research Zurich + UZH (De Feo)

- [giacomoborin.github.io](https://giacomoborin.github.io/), Scholar `nuCtgRYAAAAJ`
- PRISM (PKC 2025) + Erebor/Durian PQ ring signatures
- **IBM Quantum-Safe is a direct PQC competitor** → conflict
- Reach as Technical Advisor (with equity), not P1

### F. Markku-Juhani O. Saarinen — Tampere Univ. Professor of Practice

- [mjos.fi](https://mjos.fi/), GitHub `mjosaarinen`
- Author of SLotH (CRYPTO 2024) and `slh-dsa/slhdsa-c` reference impl
- Cleanly post-PQShield (no conflict) but **tenured-equivalent** → won't co-found
- Best fit: **Technical Advisor** with 0.25–0.5% equity, retained for SLH-DSA implementation review

## Anti-list (NOT recommended — judgment shown)

| Name | Why excluded |
|---|---|
| **Dan Boneh** | Tenured at Stanford + a16z partner; zero co-founder probability |
| **Yehuda Lindell** | Engineering Fellow at Coinbase; direct strategic conflict (we'll be selling under Coinbase) |
| **Russell W. F. Lai** | Aalto Assistant Professor (tenure-track); will not leave for pre-seed |

## Outreach playbook (academic candidates)

1. **Warm intro first**. Stanford Blockchain Club, RHUL ISG seminar
   archive, IACR mailing list signatures — find a person who knows
   the candidate before cold-emailing.
2. **Reference one specific paper** in the first message. "I read
   LatticeFold+" beats "I love your work."
3. **First touch is a 30-min research call**, not a co-founder pitch.
   Academics block on equity / NDA / cap-table on first contact.
4. **No attachments, no PDFs**. Plain text email or contact form.
5. **Expected response**: 7–14 days. Second nudge at day 10. Stop after
   day 14 if no response — move to next candidate.
6. **Convert to co-founder conversation only after the second call.**

## Kill criterion

A candidate is auto-cut if their 2024–2026 publication record contains
**no public repository that compiles**. A theorist with EUROCRYPT
papers and zero shipped code re-introduces the "vault split-brain"
failure pattern. Quantum Shield needs someone who has already made
`cargo build` succeed on a PQ implementation.

This eliminates: any pure-theory cryptographer, any PI whose grad
students do all coding, anyone whose latest GitHub commit predates 2024.

## Open questions for kota before sending

- [ ] Verify Benedikt Wagner's current employer (EF? independent?
  CISPA-affiliated post-PhD?)
- [ ] Identify a warm-intro source for at least one of the three
  Tier 1 candidates (Stanford Blockchain Club, RHUL seminar archive,
  IACR mailing list)
- [ ] Confirm pre-seed equity range willing to offer (Council §3
  suggested 35–45% earlier; lock the exact figure before any term-
  sheet conversation)
- [ ] Decide whether to include Markku Saarinen as "Technical Advisor
  with 0.25–0.5% equity" in the same outreach window or separately

## Source notes

- All affiliation claims cross-checked against ≥1 secondary source
  (IACR cryptodb, ResearchGate, lab page in search results)
- No personal email addresses, phone numbers, or non-public DMs
  included
- Could not WebFetch eprint PDFs directly (403); paper claims verified
  via author homepages and abstract listings
- Lindell-orbit pool was searched and came up empty for co-founder
  candidates (most went to Coinbase post-Unbound). Recommend
  reallocating that search budget to Albrecht (RHUL) and Lyubashevsky
  (IBM) advisees in a future round
