# ethresear.ch 投稿用（コピペ用）
#
# 投稿先: https://ethresear.ch/
# カテゴリ: "Cryptography" または "Economics"
# 手順:
#   1. https://ethresear.ch/ にアクセス
#   2. アカウント作成/ログイン
#   3. "+ New Topic" クリック
#   4. カテゴリ選択: Cryptography
#   5. 下記のタイトルと本文をコピペ
#   6. 投稿
#
# ===== ここからタイトル =====
# Quadratic Slashing: N²-Penalty Economics for Post-Quantum Prover Pools
# ===== ここから本文 =====

## Abstract

We present **Quadratic Slashing**, a penalty mechanism for decentralized Prover pools where the slashing penalty scales with **N²** (the square of the number of colluding participants). Combined with VRF-based random selection and Observer bounties, this creates a multi-layered economic security model.

We've implemented this in [Quantum Shield](https://github.com/kota1026/quantum-shield), a post-quantum custody protocol using NIST FIPS 204 (ML-DSA) + FIPS 205 (SLH-DSA) dual signatures on Ethereum.

## The Collusion Problem

Traditional PoS slashing applies a **linear** penalty — each malicious actor loses a fixed percentage. The per-actor cost remains constant regardless of conspiracy size:

```
Linear:    penalty(N) = N × 10% × stake
Per-actor: 10% × stake  (constant — collusion is "free")
```

## Quadratic Slashing

We introduce a penalty where per-actor cost **increases** with each additional conspirator:

```
Quadratic: penalty(N) = N² × 10% × stake
Per-actor: N × 10% × stake  (increases with coalition size)
```

### Concrete Numbers

With `base_rate = 10%` and `stake = 100 ETH`:

| Colluders (N) | Per-Actor Loss | Total Loss |
|:---:|:---:|:---:|
| 1 | 10 ETH (10%) | 10 ETH |
| 2 | 40 ETH (40%) | 80 ETH |
| 3 | 90 ETH (90%) | 270 ETH |
| 4+ | 100 ETH (capped) | 400+ ETH |

At N=3, conspirators lose 90% of their stake. At N=4, everything.

## Why This Matters for Ethereum

### Comparison with Ethereum's Correlated Slashing

Ethereum already has a form of super-linear penalty:

```
penalty = validator_balance × 3 × fraction_of_validators_slashed
```

Quadratic Slashing formalizes this intuition for smaller prover pools (N=5-20) where the quadratic effect is more pronounced. It's applicable to:

1. **Multi-prover rollups** — disincentivize prover cartels
2. **Oracle networks** — make coordinated price manipulation exponentially costly
3. **Restaking protocols** — strengthen economic security guarantees

### Game-Theoretic Properties

For an attack to be rational:
```
target_value > N² × base_rate × stake
```

This means the **minimum viable target** for a 3-actor collusion attack is 270 ETH — and this assumes zero detection probability. Our 24h timelock + Observer bounty system makes detection near-certain.

### Fund Distribution

- **60%** → Observer who detected the misbehavior (bounty hunting incentive)
- **25%** → Insurance Fund (covers affected users)
- **15%** → Treasury (protocol sustainability)

The 60% observer reward makes it more profitable to *detect* collusion than to *participate* in it.

## Implementation

Deployed on Ethereum Sepolia:
- **ProverRegistry**: `0x08e1fc1A0d614bc132B48950760c7A291cCB8946`
- 13 integration tests for the Challenge → Slashing pipeline
- Full source: [GitHub](https://github.com/kota1026/quantum-shield)

The protocol uses VRF (Chainlink VRF v2.5) for random prover selection, ensuring attackers cannot predict or target specific provers.

## Open Questions

1. **Optimal base_rate**: Is 10% the right starting point? We'd welcome game-theoretic analysis of the optimal base rate given various stake sizes.
2. **Cross-protocol application**: Could Quadratic Slashing improve Ethereum's own validator economics for small validator sets (e.g., distributed validator clusters)?
3. **Formal verification**: We're working on Lean4 proofs of the game-theoretic properties. Collaboration welcome.

## References

- NIST FIPS 204 — ML-DSA (Dilithium), August 2024
- NIST FIPS 205 — SLH-DSA (SPHINCS+), August 2024
- EIP-7251 — Ethereum Correlated Slashing Penalties
- Quantum Shield Protocol Specification (SEQUENCES v3.0)

---

*Built with both NIST PQ standards. Open-source under MIT License.*
*Feedback and collaboration inquiries welcome.*
