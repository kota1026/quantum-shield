---
Owner: kota1026
Submit deadline: 2026-05-11 09:00 JST
DO NOT MERGE TO MAIN UNTIL FOUNDER REVIEWS
---

# EF ESP Track A — T-1 / T-0 Submission Checklist

Reference application: `docs/grants/EF_ESP_APPLICATION.md`
Reference architecture: `docs/grants/EF_ESP_ARCHITECTURE_DIAGRAM.md`
Portal: https://esp.ethereum.foundation/applicants/small-grants

---

## Section 1 — Sun 2026-05-10 Morning: Copy Review

- [ ] Read `docs/grants/EF_ESP_APPLICATION.md` top to bottom. Confirm every contract address matches `.claude/rules/blockchain.md` exactly (L1Vault `0x07012aeF87C6E423c32F2f8eaF81762f63337260`, ProverRegistry `0x08e1fc1A0d614bc132B48950760c7A291cCB8946`, SPHINCSVerifier `0xD090b5A627d9bd6D96a8b5f6F504ebCa79980103`).
- [ ] Verify the problem-statement section does NOT use HNDL framing as primary threat argument. Per W19 strategy memo, lead with regulatory deadlines (NIST 2027 mandate, NSA CNSA 2.0, JFSA) and online forgery of long-lived control keys — not "quantum computers will break ECDSA tomorrow."
- [ ] Confirm the marketing lead is ML-DSA-65 crypto-agility, not dual-sig as headline. Dual-sig is engineering depth, not the pitch opening.
- [ ] Remove or qualify any metric that cannot be sourced: qubit counts, TVL figures, and market-cap numbers must cite a named source in the References section.
- [ ] Spell-check pass. EF reviewers are native English speakers; typos in technical sections damage credibility.

## Section 2 — Sun 2026-05-10 Afternoon: Reproducibility Check

- [ ] Send the draft (PDF or Google Doc) to one person who is NOT a QS contributor. Ask them: "Does the SR0/SR1 architecture make sense without prior context?" If they cannot explain the gas-optimization rationale back to you in one sentence, revise the Technical Architecture section.
- [ ] Confirm `docs/grants/EF_ESP_ARCHITECTURE_DIAGRAM.md` exists and renders correctly as ASCII or embedded image. If the file is missing, create a minimal text-based diagram before Mon morning — a blank reference is worse than a simple one.
- [ ] Verify all GitHub URLs in the application resolve to public repositories (not 404 or private). Open each link in an incognito window.
- [ ] Verify the live frontend URL (`https://quantum-shield.xyz`) is reachable and shows a working UI, not a maintenance page. Reviewers click links.
- [ ] Verify at least one Sepolia transaction exists on Etherscan for L1Vault (`0x07012aeF87C6E423c32F2f8eaF81762f63337260`) that a reviewer can independently confirm. If the explorer shows zero txns, note this honestly in the application or add a testnet transaction before submission.

## Section 3 — Sun 2026-05-10 Evening: Portal Dry-Run

- [ ] Log into the ESP portal. Navigate to the application form. Confirm the form fields match the draft sections: project name, category (Cryptography), budget ($150,000), team size (solo), links, and long-form description.
- [ ] Paste the project description into the portal's text field and verify no markdown formatting is stripped in a way that makes the table or code blocks unreadable. Adjust to plain prose if the portal does not render markdown.
- [ ] Do NOT click submit tonight. Close the browser after confirming all fields are populated correctly.

## Section 4 — Mon 2026-05-11 Morning: Submit

- [ ] 08:30 JST — final read of the description as it appears in the portal (not in your editor). One last factual check: dates, addresses, URLs.
- [ ] 09:00 JST — click submit. Screenshot the confirmation page and save to `docs/grants/EF_ESP_confirmation_2026-05-11.png`.
- [ ] Record the ESP application reference number (or confirmation email ID) in `docs/grants/EF_ESP_APPLICATION.md` under a new "Submission" header at the top of the file.

## Section 5 — Mon 2026-05-11 Afternoon: Post-Submit

- [ ] Send a brief note to `tcoratger@ethereum.org` (EF PQ Security team lead) referencing the submitted application number and expressing interest in the Track B prize conversation. One paragraph. No attachment. Keep it researcher-to-researcher in tone.
- [ ] Open a GitHub issue or label in the `quantum-shield` repo to track ESP follow-up cadence (expected response: 4-8 weeks). Set a calendar reminder for 2026-07-06 to follow up if no response.
- [ ] Update `docs/grants/` index (or the W19 strategy memo) to mark ESP Track A as "submitted 2026-05-11."

---

Word count: ~470 words (body, excluding front-matter and section headers).
