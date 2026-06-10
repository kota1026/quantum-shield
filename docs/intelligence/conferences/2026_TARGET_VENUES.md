---
Status: DRAFT — founder must verify all dates against primary source before submitting
Last researched: 2026-05-09
Researcher: qs-research-agent (this file)
---

# QS 2026-2027 Conference Submission Targets

Window in scope: deadlines between **2026-05-09** and **2027-04-30**. Some 2027 CFPs not yet posted (marked TODO[founder]). QS surface area: dual FIPS 204 ML-DSA-65 + SPHINCS+ signatures on L1 custody (Sepolia) with Prover Pool / VRF / Time Lock. Relevant tracks: PQC migration, applied crypto, real-world crypto, blockchain security, JP fintech. Pure theory venues (Crypto/Eurocrypt main track) de-prioritized — we have engineering artifacts, not new primitives.

## Tier 1 — Highest fit, immediate action (deadline within 60 days, by 2026-07-08)

| Venue | Submission deadline | Conference dates | Format | Fit score | Action |
| --- | --- | --- | --- | --- | --- |
| IEEE S&P 2027 (Oakland), Round 1 | 2026-06-11 | May 2027, Oakland CA | Full paper, ~13pp | MED — top-tier security venue; QS Prover-Pool slashing analysis or PQC-on-EVM cost study could fit "Systemization of Knowledge" or applied track | Decide go/no-go by 2026-05-20; abstract due ~1 week prior |
| Asiacrypt 2026, Hong Kong | 2026-05-22 (11:59 UTC) | 2026-12-07 to 2026-12-11, Hong Kong | Full paper (LNCS) | LOW–MED — IACR theory venue; only fits if we have new cryptanalytic or protocol-design content. QS engineering work likely out of scope unless reframed as "ML-DSA-65 in EVM signature aggregation" | **Likely SKIP** unless founder has a theory co-author |
| CSS 2026 (IPSJ Computer Security Symposium) | TODO[founder]: verify at https://www.iwsec.org/css/ — historical pattern is late-Jun/early-Jul deadline | Oct/Nov 2026, Japan (TBD) | Japanese-language paper, ~6-8pp | HIGH — Japan-domestic venue, low travel cost, founder can present in Japanese, IPSJ CSEC audience overlaps with FSA / NICT contacts | Watch site weekly; deadline window 2026-06 to 2026-07 |
| ETHTokyo 2026 / ETHGlobal Tokyo 2026 | TODO[founder]: verify speaker form at https://www.ethtokyo.org/ — typically opens ~3 months prior, i.e. June–July 2026 | ETHTokyo: 2026-09-19 to 2026-09-27; ETHGlobal hackathon 2026-09-25 to 2026-09-27 | Talk / workshop / side-event / demo | HIGH — JP-local, founder can run side event with no travel, recruiting + investor pipeline value | Submit speaker form within 24 h of opening; also reserve a side-event slot |

## Tier 2 — Strong fit, deadline 60-180 days out (by 2026-11-05)

| Venue | Submission deadline | Conference dates | Format | Fit score | Action |
| --- | --- | --- | --- | --- | --- |
| PKC 2027, Taipei | 2026-08-03 | 2027-03-01 to 2027-03-04, Taipei | Full paper (LNCS) | LOW–MED — public-key theory venue; same caveat as Asiacrypt. Could fit if we publish a SPHINCS+/Dilithium aggregation result | Pre-screen: do we have a theory result by mid-July? If no, skip |
| USENIX Security 2027, Round 1 | 2026-08-25 (abstract ~1 week prior) | 2027-08-11 to 2027-08-13, Denver CO | Full paper, ~13pp+appendix | MED — strong applied-security venue. QS slashing-game analysis or "fault-tolerant Prover Pool with VRF" measurement paper could land here | Plan Round 2 fallback (2027-01-26) if Round 1 rejected |
| RWC 2027, Seattle | 2026-11-16 (per MPC Deadlines Hub; verify at rwc.iacr.org/2027) | 2027-04-05 to 2027-04-07, Seattle WA | Contributed talk (no proceedings); 2-page abstract | HIGH — *the* venue for deployed cryptography. QS dual-signature production deployment story is exactly RWC's bread-and-butter (real-world post-quantum custody on a live testnet). 2-page format is achievable. | Highest priority Tier-2 candidate. Draft abstract by Oct 2026 |
| PQC Conference Amsterdam 2026 (PKI Consortium) | Rolling — early submissions favored. Contact contact@pkic.org | 2026-12-01 to 2026-12-03, Amsterdam | Talk (~25–30 min); strict zero-product-promotion rule | HIGH — practitioner audience: enterprise / government PQC migration leads. Direct fit for QS positioning (asset custody, regulator-friendly framing). No academic bar. | Email pkic.org now; submit before 2026-08 to maximize selection odds |
| CCS 2026 Cycle 2 | Abstract 2026-04-22 (passed); paper 2026-04-29 (passed) | 2026-11-15 to 2026-11-19, The Hague | Full paper | — | **CLOSED for 2026.** First open cycle is CCS 2027 Cycle 1 (TODO[founder]: typical Jan abstract deadline) |

## Tier 3 — Strategic positioning (deadline > 180 days, post 2026-11-05)

| Venue | Submission deadline | Conference dates | Format | Fit score | Action |
| --- | --- | --- | --- | --- | --- |
| SCIS 2027 (IEICE) | TODO[founder]: verify at https://www.iwsec.org/scis/ — historical pattern: abstract Nov 2026, full ~Dec 2026 for late-Jan 2027 conf. SCIS 2026 deadline was 2025-11-12 to 2025-12-01 | Late Jan 2027, Japan (TBD) | Japanese-language paper, 6-8pp | HIGH — JP-domestic, builds local academic credibility, SCIS is the de-facto Japanese cryptography venue, light overhead | Auto-target if CSS 2026 acceptance comes through; otherwise still submit |
| RSAC 2027, San Francisco | TODO[founder]: verify call-for-speakers at rsaconference.com — RSAC 2026 deadline was 2025-08-18, so RSAC 2027 deadline likely Aug 2026 (overlaps Tier-2 USENIX deadline) | 2027-04-05 to 2027-04-08, San Francisco | 25/45-min talk; strong product-pitch filter | MED — institutional / CISO audience; useful for enterprise sales narrative but expensive (US travel, W14 = peak buyer-call window). Submit only if QS has a paying enterprise pilot to anchor the talk | Decide by July 2026 |
| EthCC[10] 2027, Cannes | TODO[founder]: verify speaker form opens; EthCC[9] 2026 form was https://ethcc.io/forms/speakers — typically opens ~Q4 prior year | 2027-04-05 to 2027-04-08, Cannes (Palais des Festivals) | Talk / panel / workshop | MED–HIGH — premier EU Ethereum venue, but conflicts week-for-week with RSAC 2027 and RWC 2027. Pick one. | Prefer over RSAC if QS audience is dev/protocol; defer to RSAC if institutional |
| IETF 126 Vienna (CFRG / pquip side meetings) | No formal CFP; side-meeting requests via IETF wiki | 2026-07-18 to 2026-07-24, Vienna | Side-meeting talk / Internet-Draft | MED — useful for standards-track positioning; QS could draft an Informational I-D on dual-signature custody patterns | Watch wiki; cheap option if founder is in EU window |

## Per-venue detail (Tier 1)

### IEEE S&P 2027 (Oakland) — Round 1
- Date verified: YES — https://sp2027.ieee-security.org/cfpapers.html and https://sec-deadlines.github.io/
- Submission link: https://sp2027.ieee-security.org/cfpapers.html
- Format requirement: Full research paper, double-column IEEE format (~13 pages excl. references)
- Page limit: ~13pp main + unlimited references / appendix
- Open / closed source requirement: artifact evaluation track strongly preferred; QS already has open repo so this is a plus
- Audience: top-tier security academics, advanced practitioners, government security researchers
- Why QS fits: an SoK on "Post-Quantum Custody in Production Smart-Contract Systems" or a measurement paper on "Cost of FIPS 204 ML-DSA-65 verification on EVM-compatible L2/L3" would slot into either applied or SoK tracks. The dual-signature Prover-Pool game-theoretic analysis is also a candidate.
- Risk: acceptance rate ~14-17% historically; demands strong evaluation methodology and related-work coverage. Solo submission is high-risk; ideally co-authored with an academic.
- Suggested submission angle: reframe `docs/INTEGRATION_METHODOLOGY_v2.md` plus measurement data from L1-Sepolia / L3-Anvil into a measurement / experience paper. The "Moonwell Lesson" anti-pattern catalog from `.claude/rules/testing.md` could anchor a Lessons-Learned section.
- Estimated founder hours to submit: 24+ (and only if a co-author is found by 2026-05-20)

### CSS 2026 (IPSJ Computer Security Symposium)
- Date verified: NO — `https://www.iwsec.org/css/` page exists but CSS2026 details not yet posted as of 2026-05-09. TODO[founder]: poll weekly.
- Submission link: TODO[founder]: locate (historically EasyChair under iwsec.org/css/2026/)
- Format requirement: Japanese-language paper, IPSJ template, typically 6-8 pages
- Page limit: ~6-8pp
- Open / closed source requirement: none mandated; open repo is a plus
- Audience: IPSJ CSEC researchers, NICT, AIST, JP industry security teams (NTT, Hitachi, NEC, Fujitsu, IIJ)
- Why QS fits: CSS is the largest annual JP security symposium; a Japanese-language case study on "実運用ブロックチェーンへの NIST FIPS 204 ML-DSA-65 / SPHINCS+ 二重署名適用" would be unusually timely given CRYPTREC's PQC migration roadmap. Founder can present in JP, low travel cost.
- Risk: lower prestige than IEEE/USENIX, but excellent for domestic credibility and FSA/NICT relationship building. Acceptance rate generous (>50%).
- Suggested submission angle: translate / adapt the Zenn-style technical posts (if any exist) plus the L1-Sepolia deployment write-up into a CSS short paper. Tie to METI / 金融庁 PQC migration agenda.
- Estimated founder hours to submit: 16

### ETHTokyo 2026 / ETHGlobal Tokyo 2026
- Date verified: PARTIAL — ETHTokyo dates 2026-09-19 to 2026-09-27 verified via ethtokyo.org listing; ETHGlobal hackathon 2026-09-25 to 2026-09-27 verified via @ETHGlobal post (https://x.com/ETHGlobal/status/1992919708589576215). Speaker form not yet open as of 2026-05-09.
- Submission link: TODO[founder]: locate ETHTokyo speaker form; ETHGlobal hackathon registration at ethglobal.com/events/tokyo
- Format requirement: 20-30 min talk, workshop slot, or side-event host
- Page limit: N/A (slide-based)
- Open / closed source requirement: ETHTokyo strongly favors open-source projects
- Audience: JP + APAC Ethereum builders, EF representatives, JP regulators occasionally drop in, JP VCs
- Why QS fits: home-turf event, direct recruiting / investor / ecosystem-grant pipeline, low cost, founder can run a co-located QS workshop or side event regardless of main-stage acceptance. ETHGlobal hackathon side-event slot is ~certain if QS sponsors a small bounty.
- Risk: lower academic value; pure ecosystem play. Watch out: ETHTokyo and ETHGlobal Tokyo overlap on 2026-09-25–27, so plan capacity carefully.
- Suggested submission angle: live-demo the Consumer Lock flow on Sepolia + Arbitrum Sepolia; pitch QS as "Japan's PQC custody primitive". Couple with EF ESP grant narrative from `docs/grants/EF_ESP_APPLICATION.md`.
- Estimated founder hours to submit: 8 (talk submission) + 16 (side-event prep if hosting)

## Venues researched but rejected
- **CCS 2026** — both cycles closed; re-target CCS 2027.
- **Asiacrypt 2026** — deadline 2026-05-22 in scope, but IACR theory venue; engineering-only QS work won't pass review without a co-author / new primitive. SKIP unless theory work matures by mid-May.
- **PQCrypto 2026 (Saint-Malo)** — already happened (April 2026); PQCrypto 2027 not yet announced.
- **CT-RSA 2026** — deadline (2025-10-24) passed; CT-RSA 2027 CFP not yet posted.
- **AsiaCCS 2026 (Bangalore)** — both cycles closed.
- **EthCC 2026 (Cannes, March 30–April 2)** — already happened; EthCC[10] 2027 in scope (Tier 3).
- **DappCon Berlin 2026** — June 16-17 verified, but no formal academic CFP; sponsor/side-event only. Low ROI vs ETHTokyo on home turf.
- **SBC 2026 (Stanford)** — talk deadline 2026-03-13 passed. Re-target SBC 2027.
- **MAgiCS 2026 (co-located Eurocrypt)** — deadline was 2026-02-01.
- **Sibos 2026 (Miami)** — institutional banking; no academic CFP, sponsorship-only $50k+, poor ROI.
- **Money 20/20 Asia 2027 (Apr 27-29 Bangkok)** — invitation-led / sponsorship-led, no open CFP.
- **FIN/SUM 2026** — concluded (March 2026); Impact Pitch deadline (2026-01-26) passed. Watch FIN/SUM 2027.
- **JNSA events 2026** — student-focused, not founder-level submission targets.
- **Bitcoin 2026 / ETHDenver 2026 / CES** — out of scope for PQC custody narrative.

## Cannot verify

Venues whose 2026/2027 dates / CFPs the agent could NOT confirm on 2026-05-09:

- **CSS 2026 (IPSJ)** — `TODO[founder]: verify https://www.iwsec.org/css/` (WebFetch 403; SERP shows landing page but no CSS2026 content posted yet)
- **SCIS 2027 (IEICE)** — `TODO[founder]: verify https://www.iwsec.org/scis/` (assumed late-Jan 2027 conf, deadline ~Nov-Dec 2026 by historical pattern)
- **CT-RSA 2027** — `TODO[founder]: verify; CFP not yet posted`
- **PQCrypto 2027** — `TODO[founder]: verify https://pqcrypto.org/conferences.html`
- **RSAC 2027 call-for-speakers** — `TODO[founder]: verify https://www.rsaconference.com/usa/call-for-submissions; expected Aug 2026`
- **EthCC[10] 2027 speaker form** — `TODO[founder]: verify https://ethcc.io/forms/speakers reopens for 2027`
- **DappCon 2026 talk submission** — `TODO[founder]: verify https://dappcon.io/ if open CFP vs invite-only`
- **Devcon 8 speaker application** — event dates verified (2026-11-03 to 2026-11-06 Mumbai); `TODO[founder]: watch https://devcon.org/en/` (typically opens ~6 months prior)
- **IETF 126 Vienna pquip / cfrg side-meeting deadline** — `TODO[founder]: verify https://datatracker.ietf.org/meeting/126/important-dates/` (event 2026-07-18 to 2026-07-24 confirmed)

## Geographic + cost notes

**JP-based venues (low cost, founder local presence, JP-language presentation possible):**
- CSS 2026 (Japan, October/November) — Tier 1
- ETHTokyo 2026 / ETHGlobal Tokyo 2026 (Tokyo, September) — Tier 1
- SCIS 2027 (Japan, January) — Tier 3
- (FIN/SUM 2027 — Tokyo, March 2027 — watch list)

**Asia regional (BKK / SIN / HK / Mumbai / Taipei):**
- Asiacrypt 2026 (Hong Kong, December) — low fit
- PKC 2027 (Taipei, March) — low-medium fit
- RWC 2026 (Taipei, March 2026) — already happened, RWC 2027 is in Seattle
- Devcon 8 (Mumbai, November 2026) — high audience value, ~6h flight from JP
- Money 20/20 Asia 2027 (Bangkok, April) — BD only, no open CFP

**US (high cost, jet lag from JP, hits buyer-pipeline window):**
- IEEE S&P 2027 (Oakland, May) — Tier 1, but only with co-author
- USENIX Security 2027 (Denver, August) — Tier 2
- RWC 2027 (Seattle, April 5-7) — Tier 2, **2-page abstract = best ROI of any Tier 2 venue**
- RSAC 2027 (San Francisco, April 5-8) — overlaps RWC + EthCC, must pick at most one
- SBC 2027 (Stanford, summer) — re-evaluate when CFP posts

**EU (Paris/Cannes/Berlin/Vienna/Amsterdam):**
- IETF 126 (Vienna, July 2026) — side-meeting cheap option
- EthCC[10] 2027 (Cannes, April 5-8) — conflicts with RWC + RSAC
- DappCon Berlin 2026 (June 16-17 2026) — sponsor / side-event only
- PQC Conference Amsterdam 2026 (December 1-3) — Tier 2, high practitioner fit
- (Eurocrypt 2027 location TBD — out of scope this cycle)

## Founder decision framework

This is a single-founder operation with a ~16-32 hour annual conference budget (per `CLAUDE.md` and integration phase context). Recommendations are stack-ranked by hours-to-impact ratio, **not** by venue prestige.

- **If founder time-budget for 2026/2027 conf submissions = 16 hours:**
  - Pick **1 Tier 1**: ETHTokyo 2026 speaker form (8 h) + side event (8 h). Home-turf, no travel, recruiting / investor / ecosystem dividend.
  - Skip everything else.

- **If 32 hours:**
  - **1 Tier 1**: ETHTokyo 2026 (16 h, talk + side event)
  - **1 Tier 2**: RWC 2027 contributed-talk 2-page abstract (12 h drafting + 4 h iteration). RWC's format is the cheapest serious-cryptography venue per founder-hour — a 2-page abstract on "QS dual-signature custody in production on Sepolia" is exactly what RWC publishes.

- **If 64+ hours:**
  - **2 Tier 1**: ETHTokyo 2026 (16 h) + CSS 2026 (16 h, Japanese-language)
  - **1 Tier 2**: RWC 2027 (16 h)
  - **1 Tier 3 strategic**: SCIS 2027 (16 h, recycles CSS 2026 paper into Japanese academic record)

**Solo founder constraint:** avoid US conferences requiring 1-week travel during 2027-W14–W17 (April 1 – April 30 2027) — that window contains RWC 2027 + EthCC[10] + RSAC 2027 simultaneously, AND it overlaps the JP fiscal-year buyer-call window. If forced to pick one US/EU April 2027 trip, **RWC 2027 (Seattle, 3 days)** dominates because (a) it's the most credible PQC venue, (b) it's a 2-page abstract not a full paper, (c) Seattle has the shortest JP flight time of the three options.

**Avoid double-booking:** RWC 2027 (Apr 5-7 Seattle), EthCC[10] (Apr 5-8 Cannes), and RSAC 2027 (Apr 5-8 SF) all collide. Submitting to all three is a planning failure waiting to happen.

**Verification protocol before submitting any of the above:** founder must (1) load the official CFP page, (2) confirm deadline timezone (AoE vs UTC vs JST — RWC and IACR use 11:59 UTC, USENIX uses AoE, IEEE uses 11:59 PM Pacific), (3) register an abstract 7+ days early to lock the slot, and (4) cross-check against `.claude/rules/blockchain.md` for any new contract addresses to cite in submitted artifacts.
