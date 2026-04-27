# Incorporation Decision: LLC vs C-corp (vs Hybrid)

_Draft: 2026-04-27_
_Owner: Kota Kato_
_Status: Decision pending — target close date 2026-05-31_

## TL;DR

**Recommendation: Delaware C-corp now, plus a Cayman or Swiss foundation later (only if/when a token launches).** This is the standard structure for crypto-native venture-backed startups in 2026 and the only path that preserves all four key options:

1. Raise priced equity rounds from US/global VCs.
2. Issue a token through a non-US foundation without piercing the operating company.
3. Capture **QSBS** (Section 1202) — up to **$15M tax-free** on founder stock if held 5+ years (post-OBBBA, signed July 4, 2025).
4. Recruit US engineers with standard ISO/RSU equity.

LLC is **only** the right choice if Quantum Shield is run as a lifestyle/services business with no equity raise, no token, and no US employee equity grants. None of those constraints fit the project.

---

## Decision Criteria

| Criterion | Weight | Why it matters for Quantum Shield |
|-----------|--------|------------------------------------|
| VC fundability | High | EF grants ≠ runway. We will need a seed round (~$2M) within 12 months for audit + mainnet. |
| Token-ready | High | veQS / QS token already deployed on Arbitrum Sepolia. Mainnet token launch is on the roadmap. |
| Tax efficiency at exit | High | QSBS is enormous for a single-founder C-corp ($15M cap, 100% exclusion at 5y holding). |
| US employee equity | Med | Hiring crypto+Rust engineers globally, mostly via ISOs/RSUs. |
| Setup + ongoing cost | Low | $5–15k incorporation + ~$5k/yr is negligible vs the upside. |
| Liability shield | Low | Both LLC and C-corp provide it. Not a differentiator. |
| Founder simplicity | Med | LLC has simpler taxes, but the cost of switching later (re-cap, re-vest) is real. |

---

## Option 1 — Delaware LLC

**Fit: poor for Quantum Shield.**

### Pros
- Pass-through taxation — losses flow to founder personal return (useful in pre-revenue years).
- Lower setup cost (~$500 + Registered Agent ~$150/yr).
- Operating Agreement is flexible — no board, no shareholder formalities.
- Profit/loss splits can be non-pro-rata if multiple members.

### Cons
- **Most US VCs cannot invest in LLCs.** Their LP agreements (especially university endowments, pension LPs) prohibit pass-through entities because they trigger UBTI (Unrelated Business Taxable Income).
- **No QSBS.** Section 1202 only applies to C-corps. Walking away from $15M tax-free is a non-starter.
- **No clean ISO/RSU.** LLC profit interests work for partners, but US engineers expect plain-vanilla stock options. Recruiting friction.
- **Token issuance via an LLC is an SEC red flag.** Pierces the corporate veil more easily under "investment contract" analysis. A foundation structure is much safer, and it is unnatural to bolt a foundation onto an LLC.
- Conversion to C-corp later is **expensive and tax-inefficient** — typically a taxable event, founder stock vesting clock resets, QSBS clock starts late.

### Verdict
Reject. LLC is right for service businesses, real-estate vehicles, and bootstrapped SaaS. Quantum Shield is none of those.

---

## Option 2 — Delaware C-corp

**Fit: strong.**

### Pros
- **Default structure for VC-backed startups** — every Y Combinator, a16z, Paradigm, Variant company is a Delaware C-corp.
- **QSBS (Section 1202)**: founder stock held >5 years can exclude **up to $15M of capital gains** from federal tax (post-OBBBA, July 4 2025; previously $10M). This alone justifies the structure.
- Clean cap table — common stock, preferred stock, ISOs, RSUs all standard and lawyer-cheap.
- Easy to layer a foundation on top later (see Option 3) without restructuring the operating company.
- Foreign founders are well-tolerated. Japan tax treaty applies; Form 5471 reporting is manageable.
- Protections: D&O insurance, business judgement rule, well-trodden Delaware case law.

### Cons
- **Double taxation** of dividends (federal corporate 21% + dividend tax). Not a real issue for a startup that will not pay dividends pre-acquisition.
- More formality: bylaws, board, annual meetings, 83(b) elections, Delaware franchise tax (~$400–4,000/yr).
- ~$1–3k to incorporate (Stripe Atlas / Clerky / Cooley GO). Annual compliance ~$3–8k (registered agent, franchise tax, federal & DE filings, 1099/W-2 if hiring).
- US-source income → corporate tax exposure even pre-revenue. Manage via expense planning.

### Cost (year 1)
| Item | Cost |
|------|------|
| Incorporation (Stripe Atlas / Clerky) | $500 – $1,500 |
| Registered Agent | $150 / yr |
| EIN + bank account | $0 (Mercury / Brex) |
| Founder 83(b) filing | $0 (must mail within 30 days of grant) |
| Bookkeeping (Pilot / Bench) | $200 – $500 / mo |
| Tax filing (federal + DE) | $1,500 – $3,000 |
| **Total Y1** | **~$5–10k** |

---

## Option 3 — Hybrid: Delaware C-corp + Cayman / Swiss Foundation

**Fit: best long-term, but defer the foundation until token launch is committed.**

### Structure
```
              ┌──────────────────────────┐
              │  Quantum Shield, Inc.    │
              │  (Delaware C-corp)       │
              │  — operating company     │
              │  — engineers, IP, app    │
              │  — fiat revenue, equity  │
              └────────────┬─────────────┘
                           │ services agreement
                           │
              ┌────────────┴─────────────┐
              │  Quantum Shield          │
              │  Foundation              │
              │  (Cayman or Zug, CH)     │
              │  — token issuer          │
              │  — protocol governance   │
              │  — grants treasury       │
              └──────────────────────────┘
```

The C-corp **does not** issue or hold the token. The foundation issues the token, holds the treasury, and contracts the C-corp for development services. This is the structure used by Uniswap, Optimism, Aztec, EigenLayer, Polygon, etc.

### Why two entities

1. **Securities law isolation.** A US-domiciled token issuer is, in 2026, a near-guaranteed SEC enforcement target. Foundations in Cayman / Zug exist to absorb that risk and to credibly decentralize governance.
2. **Tax efficiency on token issuance.** Tokens issued from a non-US foundation are not US-source income to the foundation, and the C-corp recognises only fee revenue under the services agreement.
3. **Equity vs token separation.** VCs want priced equity (in the C-corp) plus token warrants/SAFTs (referencing the foundation). Hybrid is the only structure that delivers both cleanly.
4. **Governance credibility.** Decentralization narrative ("the foundation does not control the protocol; the DAO does") requires a non-profit-like wrapper, not a Delaware C-corp.

### Cayman vs Swiss Zug

| Factor | Cayman Foundation Company | Swiss (Zug) Stiftung / Verein |
|--------|---------------------------|-------------------------------|
| Setup cost | $25–50k | $30–80k |
| Annual cost | $15–30k | $30–60k |
| Time to set up | 4–8 weeks | 8–16 weeks |
| Tax | Zero corporate tax | ~12–14% effective; tax ruling possible |
| Reputation | Crypto-native (Uniswap, Aztec, Polygon Labs) | Old-line credibility (Ethereum, Tezos, Polkadot, Cardano) |
| Substance requirement | Light (1 director, registered office) | Heavy (real office, board of councillors) |
| Banking | Hard (most banks reject); Sygnum / SEBA possible | Easier (PostFinance, ZKB if substance is real) |
| EU passporting / regulatory clarity | None | MiCA-aligned; FINMA guidance exists |

**Default choice: Cayman**, unless we plan a heavy EU presence — then Zug.

### When to set up
- **Now (with the C-corp)**: no.
- **Trigger**: when token launch is within 6 months AND ≥$1M of treasury exists OR a VC term sheet requires it. Setting up early burns $30k/yr on something we are not yet using.

---

## Tax Quick-Sheet

| Scenario | LLC | C-corp |
|----------|-----|--------|
| Pre-revenue years | Founder loss flows through (~22–37% tax shield) | Loss locked in corp; no founder benefit until exit |
| $10M exit, 5+yr hold | ~24% federal LTCG → $7.6M after tax | QSBS: 0% federal up to $15M → ~$10M after tax (with state) |
| $50M exit | ~24% federal LTCG → $38M | QSBS: 0% on first $15M, 24% on $35M → ~$41.6M |
| Token launch | Pierces LLC easily | Foundation absorbs token, C-corp clean |
| VC seed round | Most VCs cannot invest | Standard SAFE / priced round |

QSBS alone is ~$2.4M of expected after-tax delta on a typical successful crypto exit. That dwarfs every other consideration on this page.

---

## Founder-Specific Considerations (Japan resident)

- **Japan CFC (Tax Haven) rules**: a Japan-resident founder owning >10% of a Cayman entity may have its income attributed back under CFC rules. Mitigated by (a) ensuring the foundation has no founder owner (it is "ownerless" by design) and (b) the operating C-corp being the active business, not the foundation.
- **PE risk**: founder living in Japan while sole director of a Delaware C-corp can create a permanent establishment in Japan, exposing C-corp profits to Japanese corporate tax. Mitigated by (a) hiring at least one US-resident officer for management decisions OR (b) routing material decisions through US-based board meetings, documented.
- **Banking**: Mercury, Brex accept Japan-resident founders if EIN + DE incorporation is in order. Some banks (SVB-successor First Citizens) require US founder/officer. Plan for Mercury as primary.
- **Tax treaty**: US-Japan treaty avoids double taxation on the founder personally for dividends and capital gains, but founder must file W-8BEN with the C-corp.

Get a 1-hour consult with a US-Japan cross-border tax attorney **before incorporating**. Cost: ~$500–800. ROI: avoiding a Form 5471 disaster.

---

## Recommended Path

```
Week 0  → 1-hour consult with US-Japan tax attorney (cross-border, crypto-aware)
Week 1  → Incorporate Delaware C-corp via Stripe Atlas ($500)
Week 1  → Founder stock issued at $0.0001/share, 4yr vest, 1yr cliff
Week 1  → File 83(b) election (within 30 days of grant — DO NOT MISS)
Week 2  → Open Mercury bank account; transfer EF grant funds here
Week 2  → Transfer GitHub / domains / contracts IP to the C-corp via assignment
Week 4  → Hire US-resident "President" or use board-of-one with US counsel for PE protection
M3      → First option grant pool established (10–15% reserve)
M6      → Seed raise prep: deck, data room, 409A valuation
M9–12   → Token launch decision point. If GO → spin up Cayman foundation. If NO → keep deferred.
```

---

## Open Questions / Next Actions

- [ ] Book consultation with cross-border tax counsel (target: this week).
  Candidates: Andersen Tax (Tokyo + SF), Gunderson Dettmer, Cooley.
- [ ] Confirm QSBS post-OBBBA eligibility timeline ($15M cap, 5yr hold).
- [ ] Decide whether to use Stripe Atlas (fast, cheap) or Clerky (lawyer-aligned, customizable).
- [ ] Prepare IP assignment agreement template — all current GitHub repos, contracts, branding need to be assigned to the new entity.
- [ ] Defer foundation decision until M9 token-launch checkpoint.
- [ ] Verify EF grant disbursement is compatible with disbursement to a newly-formed C-corp (vs. founder personal account).

---

## References
- IRC §1202 (QSBS) — post-OBBBA expansion, July 4 2025.
- Y Combinator Standard Documents (SAFE, post-money) — Delaware C-corp assumed.
- a16z Crypto: ["Issuing a Token: Decision Tree"](https://a16zcrypto.com/) — endorses C-corp + foundation.
- Cooley GO Docs — Delaware incorporation templates.
- US-Japan Tax Treaty (2003, amended 2013).
