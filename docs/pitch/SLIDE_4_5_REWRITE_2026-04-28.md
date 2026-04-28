# Pitch Deck Slides 4–5 — Rewrite Draft (2026-04-28)

_For `docs/pitch/PITCH_DECK_v1.md` and the corresponding `quantum-shield-pitch.pptx`._
_Owner: Kota Kato. Target close: 2026-05-03 (per `docs/strategy/COUNCIL_2026-04-28.md` decision)._
_Reframes the deck from "EIP-8141-ready" to "EIP-8141-when-it-ships, custody-now"._

## Why this rewrite is needed

EF Checkpoint #9 (2026-04-10) demoted **EIP-8141** from a Hegotá CL
headliner to **CFI (Considered for Inclusion)** non-headliner status,
citing "lack of consensus" on the Account Abstraction implementation.
The previous deck framing leaned on EIP-8141 alignment as the central
forward-looking story. That bet now anchors on a CFI-status proposal
that may slip 6+ months.

**The strategic flip**: EIP-8141's delay is a *gift* to Quantum
Shield, not a setback. AA-layer PQ migration is delayed, which means
the **custody-layer PQ migration** Quantum Shield has shipped is
**the only available answer for the next 6+ months**. The deck must
say this directly and lead with it.

## Slide 4 (was: "EIP-8141-Ready")

### Old title (strike)
~~"EIP-8141-Ready: Account Abstraction-Native PQ Custody"~~

### New title
**"PQ Custody That Ships Before the Protocol Catches Up"**

### Body (3 bullets, max 12 words each)

- **EIP-8141 demoted to CFI** in EF Checkpoint #9 (2026-04-10) — AA-layer PQ delayed 6+ months
- **Quantum Shield ships at the L1 vault layer**, no consensus changes required
- **The protocol roadmap doesn't have to be done for users to be safe today**

### Visual

A horizontal timeline labeled "PQ Migration Path on Ethereum":

```
2026 ← TODAY ───────────────► 2027 ─────────────► 2028+
        |                       |                    |
        |    QS Custody Vault   |  EIP-8141 (CFI)    |  EF Post-Quantum
        |    [ live on Sepolia ]|  [ delayed ]       |  Security Team Phase 2
        |                       |                    |
        ▼                       ▼                    ▼
   Custody-layer PQ        AA-layer PQ           Consensus-layer PQ
```

Quantum Shield occupies the leftmost column. EF Checkpoint #9
citation underneath: "[blog.ethereum.org/2026/04/10/checkpoint-9](https://blog.ethereum.org/2026/04/10/checkpoint-9)"

### Speaker note

> "EF moved EIP-8141 to CFI in April. That's the AA-layer PQ migration
> path — and it's now at least six months out. The protocol roadmap
> is going to keep slipping the way protocol roadmaps do. Quantum
> Shield isn't waiting on it. We ship at the vault layer, today, on
> the existing EVM. When EIP-8141 lands, our locks become drop-in
> compatible — but customers don't need it to be safe. That's the
> entire pitch."

## Slide 5 (was: "Why Now: Quantum Threat Timeline")

### Old title (strike)
~~"Why Now: Quantum Threat Timeline (2030+ Q-Day estimate)"~~

### New title
**"Why Now: The Coinbase Advisory Just Made the Case for Us"**

### Body

Three pieces of evidence stacked vertically, each with a date and
source:

**(1) Coinbase Independent Advisory Board, Apr 21–25, 2026**
- Boneh, Drake, Aaronson, Lindell, Malkhi, Kannan
- 50-page report flagging **6.9M BTC pubkey-exposed** — "urgent"
- Recommended construction: **dual-family signatures** (lattice + hash) — exactly what Quantum Shield ships

**(2) Quantinuum 94 protected logical qubits, Mar 10, 2026**
- 10⁻⁴ logical-gate error
- Q-Day estimate moves from "2030+" to **"2028–2030 with 5-year tail risk"**
- Migration windows take 5+ years on a chain with 11M+ addresses

**(3) Trezor Safe 7, Apr 2026**
- First retail hardware wallet shipping **NIST FIPS 205 SLH-DSA-128**
- Same parameter set Quantum Shield uses
- SPHINCS+ is no longer "exotic crypto" — it's in customers' hands

### Visual

Three logos / icons in a horizontal row:

```
[ Coinbase Advisory ]    [ Quantinuum ]    [ Trezor Safe 7 ]
   "urgent"               94 LQ / 10⁻⁴      SLH-DSA-128 retail
   Apr 21-25, 2026        Mar 10, 2026      Apr 2026
```

Underneath, in a single sentence:
> *"Three weeks of news made the threat present-tense. Quantum Shield
> is the production answer."*

### Speaker note

> "If you read one document this quarter on the post-quantum threat,
> read the Coinbase Advisory. Boneh and Drake co-signed it. They put
> a number on the BTC exposure: 6.9 million. They recommended dual-
> family signatures — lattice-plus-hash. We've shipped exactly that
> on Sepolia for 25 days. Quantinuum hit 94 logical qubits in March.
> Trezor shipped SLH-DSA-128 in retail in April. The threat is no
> longer 2030+. The migration window is now."

## What the rewrite removes

The original Slide 4–5 leaned on:

- **EIP-8141 alignment as the headline** → demoted; not the lead
- **"5-10 year horizon" framing** → too soft post-Quantinuum
- **Single-product positioning ("PQ wallet")** → repositioned as
  custody primitive underneath wallets

These are still in the appendix slides, but the front-of-deck story
is now anchored in the three April events.

## Open questions for kota

- [ ] Confirm 6.9M BTC figure is in the actual Coinbase paper (cite
  page number when found, don't trust secondary sources)
- [ ] Confirm Quantinuum 94 LQ vs 56 LQ confusion in some media —
  the protected-logical figure is 94 per Quantum Insider; verify the
  primary source before slide ships
- [ ] Decide whether to include Trezor Safe 7 logo in the deck
  (compatibility statement) — could trigger trademark concern; safer
  language is "same NIST FIPS 205 parameter set"
- [ ] Get a 1-line review from someone with PR / pitch experience
  before the 5/3 deadline

## Where this lands in the deck

These slides go between:
- Slide 3 (problem statement / "why ECDSA is broken")
- Slide 6 (architecture diagram — unchanged)

Update `docs/pitch/PITCH_DECK_v1.md`, regenerate
`docs/pitch/quantum-shield-pitch.pptx` via `docs/pitch/generate_slides.py`.

## References

- [EF Checkpoint #9 (2026-04-10)](https://blog.ethereum.org/2026/04/10/checkpoint-9)
- [Coinbase Advisory Board (CoinDesk 2026-04-21)](https://www.coindesk.com/tech/2026/04/21/coinbase-advisory-board-says-quantum-computing-threat-is-on-the-horizon-crypto-needs-a-plan)
- [Quantinuum 94 LQ (2026-03-10)](https://thequantuminsider.com/2026/03/10/quantinuum-researchers-demonstrates-quantum-computations-with-dozens-of-protected-logical-qubits/)
- [docs/strategy/COUNCIL_2026-04-28.md](../strategy/COUNCIL_2026-04-28.md)
- [docs/threat-model.md](../threat-model.md)
