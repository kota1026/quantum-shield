# qs-cto — Technical Leverage Brief (W19, 2026-05-09)

## 1. Position

**The biggest leverage point right now is ZKVM-native PQ signature verification — specifically, proving ML-DSA-65 verification inside RISC Zero or SP1 and using that as the prover pool's attestation primitive.** Every competitor (QRL, PQShield, Ledger) is racing on signature schemes; nobody has shipped recursive PQ-sig aggregation with on-chain settlement. If QS becomes the first protocol where N prover attestations compress into one STARK, our economic security scales sub-linearly with prover count — that's the asymmetric bet. The dual-sig (Dilithium + SPHINCS+) is defensible as crypto hygiene but is **not** the moat; the moat is the verification topology.

## 2. Three concrete actions (next 1 week)

1. **Spike: ML-DSA-65 verifier in RISC Zero zkVM.** Use the existing `ml-dsa` Rust crate, compile to `risc0-zkvm` guest, generate one proof for one signature, measure: (a) proof generation time on M2/Linux, (b) proof size, (c) on-chain verification gas on Sepolia via Groth16 wrapper. **Success metric: < 60s prove time, < 500k gas verify.** This tells us if prover-pool aggregation is even viable in 2026.

2. **Prototype: ERC-4337 AA wallet with ML-DSA-65 `validateUserOp`.** Fork `eth-infinitism/account-abstraction`, swap ECDSA recovery for ML-DSA-65 verification (precompile-less, pure Solidity using existing PQShield reference). Deploy to Sepolia, run a `UserOp` end-to-end. **Success metric: gas cost vs ECDSA AA documented in a single table.** This is the wedge for institutional adoption — they want PQ but won't write Rust.

3. **Benchmark: SPHINCS+ on-chain verification cost on Arbitrum Sepolia L3.** We already have the verifier at `0xD090b5A627d9bd6D96a8b5f6F504ebCa79980103` on Sepolia. Replay 10 emergency-unlock paths on L3 and measure calldata + execution gas. **Success metric: decision document — keep SPHINCS+ on hot path, or move to emergency-only.** If it's > 5M gas per verify, we have a problem; the dual-sig story might need to become "Dilithium hot, SPHINCS+ cold-storage attestation only."

## 3. One technical risk

**If the EF/L2 ecosystem standardizes on BLS12-381 + recursive SNARKs as the canonical PQ-transition path (via `EIP-7212`-style precompiles for lattice verification, or via aggregation layers like Nebra/Aligned), our pure dual-sig + EVM-verify architecture becomes a museum piece.** The prover pool's economic model assumes signature verification is the bottleneck; if Ethereum makes batch PQ-verify a precompile by 2027, our prover pool's reason to exist shrinks dramatically. **Hedge: action #1 above — get into the ZK side before this happens, so we're the aggregation layer, not its victim.**

## 4. Non-obvious opportunity

**Lean4-verified ML-DSA-65 implementation as a B2B product.** We are already partially using Lean4 for Dilithium formal verification — nobody else in the PQ-custody space has this. Japan's JCMVP, US FIPS 140-3, and DOD CMMC all increasingly want **machine-checked proofs**, not just test vectors. Spinning the Lean4 work into a separately-licensable "formally verified ML-DSA-65 reference" gives QS (a) a non-dilutive revenue line, (b) a credentialing moat against Fireblocks/Ledger who cannot retrofit formal methods onto C codebases, (c) a natural EF ESP grant story and JST CREST angle. Competitors structurally cannot catch up here in < 18 months.

## Position summary

1. **Spike ML-DSA-65 inside RISC Zero zkVM this week** — single highest-leverage experiment; determines whether the prover pool has a recursive future.
2. **Ship an ERC-4337 + ML-DSA-65 AA wallet prototype** — institutional wedge, demo-able to EF/Fireblocks, low downside.
3. **Productize the Lean4-verified Dilithium work** — defensible moat, grant-aligned, asymmetric upside vs. effort.
