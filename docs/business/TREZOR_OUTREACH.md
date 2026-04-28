# Trezor Outreach — Cold Email Draft

_Draft 2026-04-28. Owner: Kota Kato. Send by 2026-05-04._

## Recipient

**Pavol Rusnak** — CTO, SatoshiLabs (Trezor parent company)
- Email candidates (verify before sending — do NOT copy a wrong address):
  - `pavol@satoshilabs.com` (publicly listed historically)
  - GitHub: [@prusnak](https://github.com/prusnak)
- Backup: `matej@satoshilabs.com` (Matej Zak, CEO, less technical)

## Subject line

> Trezor Safe 7 SLH-DSA → Quantum Shield reference integration?

## Body

> Hi Pavol,
>
> Congratulations on Safe 7 — first hardware wallet to ship NIST
> FIPS 205 SLH-DSA-128 in production firmware is a meaningful first.
>
> I'm building Quantum Shield, an open-source post-quantum custody
> protocol on Ethereum that uses the same SLH-DSA-128 parameter set
> Safe 7 ships, paired with ML-DSA-65 (FIPS 204) for user signatures.
> The L1 vault is live on Sepolia at
> `0x07012aeF87C6E423c32F2f8eaF81762f63337260` — a real lock from
> last month is at tx
> `0xd295f0f7eb1d3ee1a55361c96fa70e1c87eb051e40ece61f927ce9d659542297`
> (block 10367571).
>
> A user with a Safe 7 today has the SLH-DSA signing capability but
> no destination protocol that consumes those signatures on Ethereum
> L1. I'd like to propose a reference integration: Safe 7 produces
> the SLH-DSA-128 prover co-signature, Quantum Shield's vault
> verifies it on-chain. No key material leaves the device, no
> protocol changes on Trezor's side, ~300 LOC in our WASM SDK to
> bridge the WebUSB / SLIP plumbing.
>
> The Coinbase Advisory Board paper this week (Boneh, Drake,
> Aaronson) framed dual-signature custody as the current best
> practice for ETH. Trezor + Quantum Shield is the working example.
>
> Could we find 30 minutes for a technical call? I can come to your
> calendar — JST is fine, evenings or weekends if needed.
>
> Best,
> Kota Kato
> Founder, Quantum Shield
> https://quantum-shield.xyz
> https://github.com/kota1026/quantum-shield
> kota@quantum-shield.xyz

## Send checklist

- [ ] Verify Pavol's actual current email via Trezor's public
  contacts page or his GitHub profile (do not assume the address
  above is correct in 2026; SatoshiLabs may have rotated)
- [ ] Ensure the `0xd295f0f7…542297` tx hash is still resolvable on
  Sepolia (run `cast tx 0xd295f0f7… --rpc-url https://rpc.sepolia.org`
  to confirm)
- [ ] Read the email aloud once — no marketing language, no
  superlatives beyond what's true
- [ ] Send between Tuesday 09:00 and Thursday 11:00 CET (Bratislava
  time) — outreach norms suggest mid-week morning gets a reply
- [ ] BCC `kota@quantum-shield.xyz` for record

## If no reply in 5 business days

- **Day 6**: one-line follow-up: "Bumping in case the first email
  got buried — happy to take this to GitHub issues if email isn't
  the right channel."
- **Day 12**: do NOT send a third email. Move to GitHub: open an
  issue on `trezor/trezor-firmware` titled "Reference integration
  with post-quantum custody protocol on Ethereum?" with the same
  technical content.

## Anti-patterns to avoid

- Do **not** mention the Coinbase Advisory Board members by name in a
  way that implies endorsement.
- Do **not** ask for "a partnership" — that signals enterprise
  sales-cycle thinking. Ask for a 30-minute technical call.
- Do **not** include attachments or PDFs. Plain text email, two
  links, that's it.
- Do **not** mention investor / fundraising context. This is engineer
  to engineer.

## After the call (if it happens)

Decision tree based on Pavol's response:

- **"Interested, send a more detailed proposal"** → send the existing
  `docs/ROADMAP_PQ_VERIFIER.md` plus a 1-page integration sketch
  (don't write the sketch in advance — write it after the call so it
  matches what was actually discussed).
- **"Not now / busy / try again later"** → send a thank-you email
  with no follow-up; revisit in 90 days only if there's a
  newsworthy update.
- **"Not the right person, talk to X"** → introduce yourself to X by
  email referencing Pavol's name; do not ask Pavol to make the
  intro.
- **"Why would I help you instead of building it myself"** → answer
  truthfully. We are the *vault settlement layer*; they are the
  *signing device*. The same way their Bitcoin support uses the
  Bitcoin protocol they didn't write.

---

_See `docs/strategy/COUNCIL_2026-04-28.md` §1 for why this is the
single highest-leverage partnership conversation this month._
