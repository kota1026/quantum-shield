# Delaware C-corp Incorporation — Action Checklist

_Companion to `docs/business/INCORPORATION_DECISION.md` (the **why**)._
_This file is the **what to do**, with check-boxes._
_Owner: Kota Kato. Target close: 2026-05-31._

## Decision summary (locked from the decision doc)

- **Entity**: Delaware C-corp via Stripe Atlas
- **Foundation**: Cayman, **deferred** to M9 (token launch checkpoint)
- **Bank**: Mercury (primary)
- **Vest**: 4-year, 1-year cliff, single founder — file 83(b) within 30 days

## Week 0 — Tax counsel consultation (THIS WEEK)

The decision doc explicitly warns: book this **before** incorporating.
Cost ~$500-800; the ROI is avoiding Form 5471 / PE / CFC mistakes.

- [ ] Send 3 outreach emails today. Recommended candidates:
   - **Andersen Tax** (Tokyo + SF) — `https://www.andersen.com/locations/tokyo`
   - **Gunderson Dettmer** — Tokyo office, crypto-aware
   - **Cooley** — Tokyo office, standard YC defaults
- [ ] Email template:

   > Subject: 1-hour cross-border tax consult — Japan-resident founder, Delaware C-corp + future Cayman foundation
   >
   > I'm a Japan-resident solo founder of an early-stage crypto protocol
   > (Quantum Shield, post-quantum custody on Ethereum). I plan to incorporate
   > a Delaware C-corp this quarter via Stripe Atlas, with a possible Cayman
   > foundation deferred to a token-launch checkpoint at M9. I'd like a 1-hour
   > paid consultation covering: (a) PE risk from Japan-resident sole director,
   > (b) Form 5471 / CFC implications, (c) US-Japan treaty optimization for
   > founder dividends/cap gains, (d) timing of foundation spin-up. Available
   > times: [add 3 slots].
   >
   > Kota Kato, founder@quantum-shield.xyz

- [ ] Confirm consultation date by EOW
- [ ] Prepare for the call: read the "Founder-Specific Considerations" section
   of `INCORPORATION_DECISION.md` so the consult time isn't spent on basics

## Week 1 — Incorporate

### Day 1: Stripe Atlas
- [ ] Sign up at https://stripe.com/atlas
- [ ] Choose **Delaware C-corp** (not LLC)
- [ ] Company name: **Quantum Shield, Inc.** (verify availability via DE Division of Corporations search)
- [ ] Authorize **10,000,000 shares** at par value $0.0001 (standard YC default)
- [ ] Sole founder receives **8,000,000 shares** (80% — 20% reserved for option pool to be issued at first hire / first raise)
- [ ] Pay $500 incorporation + ~$50/yr DE franchise tax

### Day 1-2: Founder paperwork (DO NOT MISS — irreversible)
- [ ] **83(b) election** — fill, sign, mail certified-with-return-receipt to IRS within **30 days** of grant
   - Template: Stripe Atlas provides one; verify with tax counsel before mailing
   - Keep tracking number; scan receipt to `docs/business/legal/83b-receipt.pdf` (gitignored if it contains PII)
- [ ] **Stock Purchase Agreement** signed
- [ ] **Restricted Stock vesting schedule**: 4-year vest, 1-year cliff, single trigger acceleration
- [ ] **EIN** (auto-issued via Stripe Atlas)

### Day 3-7: Bank
- [ ] Open **Mercury** (https://mercury.com) — Atlas integrates directly
- [ ] Deposit minimum to activate ($0 minimum)
- [ ] Configure: 2FA, transaction alerts, restricted user roles even though solo
- [ ] **Critical**: Verify Mercury accepts Japan-resident founder for the EIN type used by Atlas. If rejected, fall back to Brex (also Atlas-integrated)

## Week 2 — IP assignment & operational migration

The C-corp must legally own everything. Pre-incorporation work belongs to Kota
personally; assign it to the C-corp via written agreement.

- [ ] **IP Assignment Agreement** — assigns all GitHub repos, contracts,
  branding, copyrights, trade secrets to Quantum Shield, Inc. for nominal
  consideration ($1 + share grant)
   - Template: ask Stripe Atlas for "Founder IP Assignment" form, or use Cooley GO
- [ ] Sign and store: `docs/business/legal/ip-assignment-2026-XX-XX.pdf`
- [ ] **Domain transfer**: `quantum-shield.xyz` from personal to corp ownership (registrar account)
- [ ] **GitHub org transfer** (if applicable): change `kota1026/quantum-shield` ownership to a `quantum-shield-inc` org. Defer if it complicates Claude Code session config; document trade-off.
- [ ] **Vendor accounts** to migrate: Vercel, Railway, Anthropic, Infura, npm publish org, Sourcify
   - Plan: keep personal accounts for now; budget reimbursement from Mercury
   - Re-create as corp accounts when grant funds disburse to Mercury

## Week 3-4 — Governance & PE protection

- [ ] **Board of Directors**: solo founder = sole director initially
- [ ] **Bylaws**: Stripe Atlas default is fine for solo C-corp
- [ ] **Annual board meeting** scheduled (calendar invite, even if a one-person meeting — required formality)
- [ ] **PE risk mitigation** (per tax counsel guidance):
   - Option A: Hire a US-resident "President" (advisor-level, fractional, ~$1-2k/mo) so material decisions occur in the US
   - Option B: Document that all material decisions occur during US-based board meetings (Zoom from Tokyo to a US-based advisor counts if structured properly)
   - **Decide and execute by end of Week 4**

## Month 2-3 — Operational maturity

- [ ] **Bookkeeping**: Pilot ($200/mo) or Bench ($300/mo) — set up Mercury feed
- [ ] **Tax advisor**: retain on $1.5-3k/yr (federal + DE) — not the same as the cross-border consult
- [ ] **D&O insurance**: skip until first hire or first raise (not needed for solo)
- [ ] **Option pool**: formally reserve 10-15% (1-1.5M shares) — required before first hire / SAFE
- [ ] **409A valuation**: defer until first option grant or seed round (~$2k from Carta)

## Month 6 — Seed prep

- [ ] **Pitch deck v2** built on `docs/pitch/PITCH_DECK_v1.md` — refresh post-audit
- [ ] **Data room**: Carta or Notion — financials, cap table, contracts, IP assignment, audit reports, grants received
- [ ] **First SAFE / priced round**: target $2M for audit + mainnet runway
- [ ] **Foundation decision gate**: only spin up Cayman if token launch is within 6 months AND ≥$1M treasury OR a VC term sheet requires it

## Month 9 — Foundation gate

Per the decision doc, foundation is **deferred until** any of:

- Token launch within 6 months
- Treasury > $1M
- VC term sheet requires it

When triggered:

- [ ] Spin up **Cayman foundation** (~4-8 weeks setup, $25-50k)
- [ ] Negotiate services agreement: foundation pays C-corp fees for development
- [ ] Token issuance from foundation, not from C-corp

## What Claude can do here

- Maintain this checklist (cross off boxes as they complete)
- Draft outreach emails (above)
- Prepare IP-assignment template based on what Atlas / Cooley provide
- Update `INCORPORATION_DECISION.md` if tax-counsel advice changes assumptions

## What only Kota can do

- Talk to tax counsel (privilege + accuracy require the founder)
- Sign documents
- Mail the 83(b) (must be physical mail, certified, signed by Kota)
- Open Mercury account (KYC photo + ID)
- Decide PE-risk mitigation approach (Option A vs B in Week 3-4)

## Open questions (track here, resolve at consult)

- [ ] Does the EF grant disburse to a freshly-incorporated entity, or must it
  hit a personal account first? (Decision-doc Open Question #6 — verify with EF)
- [ ] Stripe Atlas vs Clerky — which produces a cleaner cap table for downstream
  YC / a16z investors? (Atlas is faster; Clerky is more lawyer-aligned)
- [ ] Cap table at incorporation: **8M to founder + 2M reserved**, or **10M to founder
  with later split**? Tax counsel input wanted.

## References

- `docs/business/INCORPORATION_DECISION.md` — full reasoning (LLC rejected, hybrid deferred)
- `docs/business/COFOUNDER_OUTREACH.md` — equity bands assume this cap structure
- IRC §1202 (QSBS) — post-OBBBA $15M cap, 5-year hold
- Stripe Atlas docs: https://stripe.com/atlas
- Mercury: https://mercury.com
