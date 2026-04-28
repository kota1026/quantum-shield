# EF ESP Grant — Submission Checklist

_Companion to `docs/grants/EF_ESP_APPLICATION.md`._
_Owner: Kota Kato. Target submission date: this week._

This checklist closes the gap between "draft is ready" and "form is submitted."
The application body in `EF_ESP_APPLICATION.md` is complete; this file is the
operational sequence Kota runs **on the day of submission**.

## Two parallel tracks

| Track | Portal | Timing | Purpose |
|---|---|---|---|
| **(A) ESP Wishlist — Cryptography** | https://esp.ethereum.foundation/ | Rolling, no deadline | $50k–$200k general grant |
| **(B) EF Post-Quantum Security Research Prize** | Direct contact via pq.ethereum.org / Coratger team | Announced Jan 2026, $2M pool, 10+ teams | Prize-based recognition + ecosystem alignment |

Submit **(A) first**, then **(B)** referencing the (A) submission ID.

## T-minus checklist

### T-2 days — Repo / live demo audit

- [ ] Live demo loads in <3s on a cold incognito browser:
      `https://quantum-shield.xyz`
- [ ] `/health` returns 200:
      `curl https://quantum-shield-production-8f2b.up.railway.app/v1/health`
- [ ] L1 contract addresses in the application match `.claude/rules/blockchain.md`:
      `grep -A1 "L1Vault\|ProverRegistry\|SPHINCSVerifier" docs/grants/EF_ESP_APPLICATION.md`
- [ ] L3 contract addresses match (12 contracts on Arbitrum Sepolia)
- [ ] README badges current; demo GIF or screenshot added
- [ ] `docs/ROADMAP_PQ_VERIFIER.md` linked from the application body

### T-1 day — Demo media

- [ ] **60-second demo video** recorded (Loom or YouTube unlisted):
      Lock → Wallet sign → Status: Locked → Unlock request → 24h timer
- [ ] **Architecture diagram PNG** exported from `docs/architecture/` (or pitch deck)
- [ ] **Screenshot of 9/9 sequence integration tests passing** (Playwright reporter)
- [ ] All three artifacts uploaded to a public-readable location (gist / S3 / repo)

### T-0 — Submission day

#### Track (A) — ESP form

1. Visit https://esp.ethereum.foundation/applicants
2. Select **Project Grant** (not Academic, not Event)
3. Field-by-field source material:

   | ESP Form Field | Source in `EF_ESP_APPLICATION.md` |
   |---|---|
   | Project Name | "Project Name" section |
   | Category | "Category" section — select **Cryptography** |
   | Project Description (3-paragraph summary) | "Project Description" + "Key Innovation" |
   | Problem Statement | "Problem Statement" section |
   | Technical Approach | "Technical Architecture" |
   | Deliverables | "Deliverables & Milestones" — paste Phase 1–5 |
   | Budget Request | "$150,000 USD" with the 4-line breakdown |
   | Team | "Team" section + LinkedIn URL |
   | Repository | `https://github.com/kota1026/quantum-shield` |
   | Live demo | `https://quantum-shield.xyz` + Loom URL |
   | References / Prior work | "References" section (NIST, EIP-8141, ETH2030, arxiv) |

4. **Before submit**, screenshot every field for our records (`docs/grants/submitted/esp-2026-04-XX.png`)
5. Submit. Record the application ID in `docs/grants/SUBMISSION_LOG.md` (create if missing)

#### Track (B) — Post-Quantum Security Prize

The Prize is not a public web form. Outreach is direct:

1. Compose an email (template below) to the EF Post-Quantum Security team via
   the contact address listed on `https://pq.ethereum.org/`
2. CC `tcoratger@ethereum.org` (verify the address on pq.ethereum.org first)
3. Reference the Track (A) application ID in the email body
4. Attach: live demo URL, GitHub URL, the same Loom video, and a 1-page PDF
   exported from `docs/grants/EF_ESP_APPLICATION.md` "EF Post-Quantum Security
   Team" section

**Email template** (do not modify the technical claims; modify only the salutation/signature):

> Subject: Quantum Shield — Production custody artifact for the EF Post-Quantum Security research prize
>
> Dear EF Post-Quantum Security team,
>
> I am reaching out regarding the $2M post-quantum research prize announced
> in January 2026. Quantum Shield is a live post-quantum asset custody
> protocol on Ethereum that maps directly to the four EF PQ priorities:
> EIP-8141 alignment, NTT precompile (`0x15`) integration, formal verification
> of dual-signature invariants, and real-world performance data from a
> Sepolia deployment.
>
> Live demo: https://quantum-shield.xyz
> Repository: https://github.com/kota1026/quantum-shield
> ESP application ID: [paste from Track A]
>
> The protocol implements ML-DSA-65 (FIPS 204) plus SPHINCS+ (FIPS 205)
> as a dual-NIST custody primitive. It is — to the best of my knowledge —
> the only deployed production custody artifact whose lock/unlock flow is
> drop-in compatible with EIP-8141 account-abstraction signature switching.
>
> I would value 30 minutes to discuss whether Quantum Shield can serve as a
> reference integration site for the NTT precompile when ETH2030 reaches
> Holesky / mainnet-shadow. I am also able to publish telemetry (gas, latency,
> proof sizes) under MIT license to feed the team's empirical dataset.
>
> Thank you for your consideration.
>
> Kota Kato
> Founder, Quantum Shield
> [GitHub] [LinkedIn] [Email]

### T+1 — Follow-up

- [ ] Tweet the submission (no funding amount disclosure; just "submitted" + live demo link)
- [ ] Add submission row to `docs/grants/SUBMISSION_LOG.md`
- [ ] Set calendar reminder for T+30 days to follow up if no response

## What Claude can prepare in advance

Anything except the actual click-submit. Available now in this branch:

- ✅ Application body (`EF_ESP_APPLICATION.md`) — Q1 2026 refreshed
- ✅ This checklist
- ✅ `docs/ROADMAP_PQ_VERIFIER.md` — links from the application

What Kota must do personally:

- Account login on `esp.ethereum.foundation`
- Demo video recording (60s; script in `docs/pitch/demo-video-script.md`)
- Email send to EF PQ team
- Post-submission Twitter

## Reference materials in repo

| File | Use |
|---|---|
| `docs/grants/EF_ESP_APPLICATION.md` | Source-of-truth body text |
| `docs/ROADMAP_PQ_VERIFIER.md` | Linked from "Phase 3" budget item |
| `docs/governance/AI_ADVISORY_ROLE.md` | Pre-empts the LLM-in-signing-loop concern |
| `docs/ACTUAL_STATE.md` | Phase 1 honesty disclosure — reviewers look for this |
| `.claude/rules/blockchain.md` | Address verification reference |
