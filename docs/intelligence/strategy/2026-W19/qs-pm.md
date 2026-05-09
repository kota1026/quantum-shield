# qs-pm — Demand Position Paper (W19, 2026-05-09)

## 1. Position

The demand landscape for QS in May 2026 is **regulator-driven, not user-driven**. Nobody is waking up wanting "post-quantum custody," but compliance officers at Japanese financial institutions, EU DORA-bound entities, and US federal contractors under OMB M-23-02 are being asked "what is your PQC migration plan?" and have no good answer. The buyer today is **a CISO/compliance lead who needs an attestable answer to a regulator's checklist**, not a crypto-native user. QS's dual-signature L1 deployment is unique enough to be a credible "we already shipped" answer — but only if we package it as a compliance artifact, not a custody product.

## 2. Three concrete actions (next 1 week)

**Action 1 — Publish a "PQC Custody Compliance Brief" targeting JFSA + DORA.**
Deliverable: a 6-page PDF mapping QS's ML-DSA-65 + SLH-DSA architecture to JFSA crypto-asset custody guidelines and DORA Article 9 (ICT risk). Distribution: post to LinkedIn, email to 10 named JFSA-registered exchange compliance heads (bitFlyer, bitbank, Coincheck, SBI VC Trade, GMO Coin). **Success metric: 3 reply emails, 1 intro call booked.**

**Action 2 — Launch a public "PQC Readiness Self-Assessment" web tool at /assess.**
A 10-question form ("Do you sign with ECDSA only? Do you have a hybrid signature path? …") that outputs a score and a PDF report. Captures email + org. **Success metric: 50 completions in 7 days, ≥5 from .jp domains, ≥2 from regulated-finance domains.** This is a demand-discovery instrument, not a product.

**Action 3 — Cold-outreach 5 named integrators, not end-users.**
Target: Fireblocks (PQ roadmap public), Anchorage (federal-charter, M-23-02 exposed), Komainu (Japan-licensed), SBI VC Trade (domestic), and one IETF PQUIP working-group member. Pitch: "30-min call — we have the only deployed dual-NIST custody stack on Sepolia, want feedback on integration shape." **Success metric: 2 calls held, 1 written follow-up.**

## 3. One demand-side risk

**Custody buyers don't believe the quantum threat is real before 2030, and the ones who do believe it would rather wait for AWS KMS / GCP Cloud HSM to ship PQ key support than trust a solo-founder protocol.** If hyperscalers ship PQ-KMS in 2026-2027 (very likely — NIST deadlines force it), QS's "we shipped first" advantage evaporates into "you are a smaller, riskier version of the AWS feature." We have maybe 12-18 months of structural advantage. If we don't convert it into either (a) a regulatory moat (Japan certification) or (b) a developer-mindshare moat (the PQC reference implementation), we lose.

## 4. One non-obvious opportunity

**Japanese regional banks and trust banks doing tokenized-securities pilots under FSA's Progmat / ST framework.** They are mandated to consider crypto-agility, are terrified of US cloud dependency for cryptographic root-of-trust, and have budget. Nobody is selling to them — Fireblocks/Anchorage are US-coded, QRL/PQShield are too researchy, MPC vendors don't address PQC. A **Japan-domiciled, FIPS-204/205-compliant, JCMVP-targetable custody substrate** is a category of one. This is the wedge: not "global crypto custody," but "Progmat-adjacent PQC settlement layer for JPY-denominated tokenized assets."

## Position summary

1. **Ship the PQC Compliance Brief PDF + send to 10 named JFSA compliance leads** — fastest path to a real buyer conversation.
2. **Launch /assess self-assessment tool** — converts anonymous demand curiosity into a named-lead funnel.
3. **Cold-pitch 5 integrators (Fireblocks/Anchorage/Komainu/SBI/IETF)** — integration is more realistic than direct-sell for a solo founder.
