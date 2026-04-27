# Co-founder Outreach Playbook

_Draft: 2026-04-27_
_Owner: Kota Kato_
_Goal: identify + close 1 technical co-founder (cryptography lead) within 90 days._

## What we are looking for

| Role | Profile | Must-have | Nice-to-have |
|------|---------|-----------|---------------|
| **Cryptography Co-founder (priority 1)** | PhD or industry crypto eng, 5+ yr | PQC implementation experience (lattice or hash-based); has shipped production crypto code | NIST FIPS 204/205 familiarity; Solidity; Rust |
| **BD/GTM Co-founder (priority 2)** | Crypto BD, ex-exchange / ex-custodian | Network in institutional custody (Anchorage, BitGo, Fireblocks, Copper); deal-closing track record | Japan/APAC presence |
| **Defer**: ops, marketing, finance | Hire post-seed, not co-founder. | | |

We are explicitly **not** looking for a generalist "code anything" co-founder. The protocol is built; the gap is depth in PQC primitives and in institutional sales.

## Sourcing channels (ranked by yield)

| Channel | Yield | Effort | How to use |
|---------|-------|--------|------------|
| **Recent PQC paper authors (arXiv 2024–26)** | High | Med | Cold-email with paper-specific commentary. Warm intro > cold. |
| **NIST PQC team / submitters** | Med | High | Conferences (Real World Crypto, Crypto, PKC). Long fuse, high quality. |
| **EF Post-Quantum Security team alumni** | High | Med | Public list at pq.ethereum.org; request intros via mutual EF contacts. |
| **Crypto custody alumni (Anchorage, Fireblocks, BitGo, Coinbase Custody)** | Med | Low | LinkedIn search by title + "former". |
| **Twitter/X (technical)** | Med | Low | Reply to PQC-tagged threads; build presence over 4–8 weeks. |
| **YC Co-Founder Match** | Low | Low | High noise, low signal for crypto-PQC. Use as backup. |
| **Recurse Center, ETHGlobal hackathons** | Med | Med | Sponsor a PQC bounty; meet builders in motion. |
| **University crypto labs (Tsukuba, Waseda, NICT in Japan; UCSD, BU, Sandia in US)** | Med | High | Long-cycle but very high quality; recruit visiting researchers. |

## Pipeline targets

- 60 outreach contacts → 20 first calls → 6 deep dives → 2 finalists → 1 close.
- Run weekly: 8 cold messages out, 2 warm intros requested, 1 deep-dive call.

---

## Templates

### A. LinkedIn cold message (PQC researcher)

> Subject: Your work on {{paper_or_topic}} + a PQC custody protocol live on Sepolia
>
> Hi {{first_name}},
>
> I read your {{2024/2025/2026}} paper on **{{specific_paper_title_or_topic}}** — your point about {{specific_observation_from_paper}} matches an issue I am wrestling with in production.
>
> I am the founder of Quantum Shield: a post-quantum custody protocol on Ethereum, live on Sepolia today. We use ML-DSA-65 + SPHINCS+ in a dual-signature lock/unlock flow with an SR₀/SR₁ state-root commitment that reduces L1 gas from ~15.5M to ~200k per lock.
>
> I am looking for a cryptography co-founder. The hardest open problems on the roadmap are exactly your area: SPHINCS+ verification gas optimization, NTT precompile (EIP for `0x15`) integration once ETH2030 lands, and the formal-verification angle for the dual-signature security argument.
>
> Would you be open to a 30-minute call this week? Happy to share the architecture deck and a Sepolia walkthrough. If "co-founder" is too big a step, I would also love your read as a paid technical advisor.
>
> Either way — your paper sharpened my thinking on {{specific_thing}}, so thank you.
>
> {{kota_signature_line}}
> Quantum Shield • https://quantum-shield.xyz • https://github.com/kota1026/quantum-shield

**Sending rules**
- One per researcher. No follow-up template — if no reply in 10 days, send a single short bump.
- Always reference a specific paper finding. Generic outreach gets archived.
- Do not pitch the token. PQC researchers are turned off by token-first framing; lead with the problem.

---

### B. Email, warm intro requested

> Subject: Intro to {{first_name}} {{last_name}} re: PQC custody?
>
> Hi {{mutual}},
>
> Hope you are well. Quick ask — would you be open to introducing me to **{{first_name}} {{last_name}}** ({{their_role_or_org}})?
>
> Context: I am the founder of Quantum Shield, a post-quantum custody protocol on Ethereum (live on Sepolia, dual ML-DSA-65 + SPHINCS+ signatures). I am sourcing a cryptography co-founder, and {{first_name}}'s background in {{specific_area}} is the closest match I have seen.
>
> Forwardable blurb below.
>
> Thanks,
> {{kota_signature_line}}
>
> ---
>
> _Forwardable:_
>
> {{first_name}} — meet Kota Kato, founder of **Quantum Shield**, a post-quantum custody protocol live on Ethereum Sepolia. He has shipped a working dual-NIST-signature (ML-DSA-65 + SPHINCS+) lock/unlock flow with on-chain SR₀/SR₁ state roots, and is now sourcing a cryptography co-founder to lead the gas-optimization and EIP-8141 integration tracks. He thought your work on {{specific_area}} would be highly relevant and would value a 30-min call. Repo: github.com/kota1026/quantum-shield · Site: quantum-shield.xyz.

---

### C. Twitter/X DM (cold)

> Hi {{first_name}}, your thread on {{specific_thread_or_post}} — the part about {{specific_point}} — is the cleanest framing I have seen. I am building **Quantum Shield**, a PQC custody protocol live on Sepolia (ML-DSA-65 + SPHINCS+ dual signatures, SR₀/SR₁ on L1). Sourcing a crypto co-founder. 30 min call this week? GitHub if you want to look first: kota1026/quantum-shield

Keep under 280 chars. No links beyond one. Pasting links shrinks deliverability on X.

---

### D. Custody / BD profile

> Subject: PQC custody on Ethereum — partnership and a co-founder seat
>
> Hi {{first_name}},
>
> Brief context: institutional custody is staring at a quantum migration deadline (NSA CNSA 2.0, NIST 2027, EF Post-Quantum Security team formed Jan 2026). The market for "PQC-ready custody" did not exist 12 months ago and is now being mapped.
>
> I am the founder of **Quantum Shield** — the only PQC custody protocol live on Ethereum Sepolia today. Dual NIST signatures (ML-DSA-65 + SPHINCS+), gas-optimized via state-root commitment, full-stack production app. We are 6 deployed contracts in, 9 protocol sequences live, mainnet-targeted within 12 months.
>
> Two reasons to talk:
> 1. Partnership: integrate Quantum Shield as the PQC layer behind {{their_product}}.
> 2. Co-founder seat: I am sourcing a BD co-founder with institutional custody network. Founder equity, full board seat, equal say on token allocation.
>
> 30 minutes this week?
>
> {{kota_signature_line}}

---

### E. The "informal coffee" follow-up (after first call)

> Hey {{first_name}},
>
> Thanks for the call yesterday. To summarise what we covered:
>
> 1. {{topic_1}} — your read: {{their_view}}.
> 2. {{topic_2}} — agreed action: {{action}}.
> 3. {{open_question}} — leaving open for now.
>
> Next steps as I see them:
> - I will share the architecture deck + Sepolia walkthrough by {{date}}.
> - You will look at {{specific_artifact}} and send a one-paragraph reaction.
> - We schedule a working session with {{topic}} on the agenda for {{date}}.
>
> If the chemistry feels right after that working session, we move into a structured 90-day trial: 1 day per week of paid advisory ($X/mo), with a clear "convert to co-founder" decision at day 60. That gives both of us real signal without anyone over-committing.
>
> Sound right?
>
> {{kota}}

---

## Trial-period framework (offer to finalists)

The single biggest mistake first-time founders make is granting full co-founder equity on day 1 without operating data. The structure below avoids that.

| Phase | Length | Commitment | Compensation | Exit ramp |
|-------|--------|------------|---------------|-----------|
| **Discovery** | 2 weeks | 1–2 calls + a paid micro-project (~10 hrs) | $2–5k flat fee | Either side walks; no obligation. |
| **Trial** | 60 days | 1 day/week | $5–8k/mo OR equivalent advisor equity (0.25%) | Pre-defined "convert / no convert" call on day 60. |
| **Co-founder** | Standard | Full-time | Founder salary band + 10–25% equity, 4yr vest, 1yr cliff (re-vested from day 0 of full-time) | Standard founder vesting, double-trigger acceleration. |

Equity ranges (Delaware C-corp post-incorporation, pre-seed):
- 1st co-founder, after-incorporation but pre-seed: **15–25%** of common.
- 2nd co-founder: **8–15%**.
- Senior advisor (no co-founder title): **0.25–1%**, 2-year vest, no cliff.

All grants subject to 83(b) election within 30 days.

---

## Red flags (auto-disqualify)

- Demands cash before any working session.
- Refuses to do the micro-project — wants co-founder title without trial.
- "I do crypto" but cannot describe lattice vs hash-based PQC families.
- Cannot articulate a single shipped production system.
- Wants to relocate the protocol away from Ethereum.
- Pitches a token-first plan in the first conversation.
- Stalking history on Twitter — public attacks on other founders, lawsuits, compliance issues.

---

## Tracking

Maintain a spreadsheet (`docs/business/cofounder_pipeline.tsv` — gitignored) with:

| Column | Notes |
|--------|-------|
| Name | |
| Source | (which channel) |
| First contact date | |
| Last touch date | |
| Stage | sourced / replied / called / micro-project / trial / converted / declined / dead |
| Profile fit (1–5) | |
| Cultural fit (1–5) | |
| Notes | |
| Next action | with due date |

Review pipeline weekly. Kill leads at 30 days no-touch.

---

## Public posture

While the pipeline is private, our **public** signal needs to attract inbound:

- Pin a tweet describing the cryptography co-founder search, with link to a 1-page founder-search brief.
- Add `HIRING.md` to the repo describing the cryptography lead role.
- Submit to "co-founder wanted" lists: a16z Talent x Opportunity, YC Co-Founder Match, RW3 Wireframe, Pallet jobs.
- Speak: Real World Crypto submission for Q1 2027; Devconnect Buenos Aires PQC track.

Inbound from public posture is typically **lower** quality than active sourcing but **occasionally** delivers a hidden gem. Allocate 20% of the search effort here, 80% to active sourcing.

---

## Close

Right call when sending the offer:
1. Cap-table memo (drafted, not just verbal).
2. 4-yr vest, 1-yr cliff, 83(b) deadline highlighted.
3. Founder agreement: ip assignment, non-compete (carve-outs for academic), confidentiality.
4. First 90 days plan: 5 measurable goals.
5. Decision deadline: 7 days from offer. No exploding offers — but no "I will think about it for a month" either.

If they say "no" — ask them to recommend the next person. Best leads come from declined finalists.
