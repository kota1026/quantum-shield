# Quantum Shield - Core Principles (Constitution)

> **Version**: 1.0  
> **Status**: IMMUTABLE  
> **Last Updated**: 2025-12-23

---

## 1. Mission Statement

**Quantum Shieldは、量子コンピュータ時代においてブロックチェーン資産を保護する。**

NIST認定の耐量子暗号（Dilithium, SPHINCS+）とゼロ知識証明（ZK-STARK）を組み合わせ、完全な量子耐性を実現する。

---

## 2. Non-Negotiable Constraints

以下は**絶対に違反してはならない**制約である。

| # | 制約 | 根拠 |
|---|------|------|
| C1 | NIST認定暗号のみ使用 | FIPS 204準拠必須 |
| C2 | SHA3-256をハッシュ関数として使用 | keccak256は禁止 |
| C3 | 仕様書の変更は会議承認必須 | 勝手な改変禁止 |
| C4 | Prover署名は2/5 SPHINCS+必須 | 通常Unlock時 |
| C5 | Time Lock: 通常24h / Emergency 7日 | 短縮禁止 |
| C6 | Quadratic Slashing: N² × 10% | 計算式変更禁止 |

---

## 3. Authoritative Documents

以下の仕様書が**唯一の正**である。実装はこれらに100%準拠すること。

| Document | Location | Purpose |
|----------|----------|----------|
| QUANTUM_SHIELD_SEQUENCES_v2.0.md | `docs/constitution/` | 全8シーケンスの定義 |
| QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md | `docs/constitution/` | 統合仕様（データ構造、API） |

**警告**: 上記以外のドキュメントから仕様を推測してはならない。

---

## 4. Implementation Rules

### 4.1 コード実装時の原則

1. **仕様書を先に読む** - コードを書く前に該当セクションを確認
2. **成果物リンク必須** - チェックリストにファイルパスを記録
3. **逸脱は会議承認必須** - 仕様と異なる実装は禁止

### 4.2 検証の原則

1. **実装者と検証者は別人（別チャット）** - 同一コンテキストでの自己検証禁止
2. **コードレビュー → テスト結果** の順序厳守
3. **PIR Code Review Routine**に従う

---

## 5. Agent Governance

### 5.1 11-Agent System

| Layer | Agents | Role |
|-------|--------|------|
| Strategic | Purpose Guardian, CTO, CSO, CFO, CBO | 方針決定 |
| Business | Cost Guardian | コスト管理 |
| Execution | Engineer, Chief Cryptographer, Researcher, Legal, Red Team | 実装・検証 |

### 5.2 Decision Making

- **戦略的決定**: 会議で11エージェント投票（過半数）
- **実装決定**: CTO + Engineer + Red Team承認
- **セキュリティ決定**: CSO + Chief Cryptographer + Red Team承認

---

## 6. Amendment Process

このドキュメントの変更は以下のプロセスを経る：

1. 提案者がPRを作成
2. 11エージェント全員による会議開催
3. 2/3以上の賛成で承認
4. CEOによる最終承認
5. 変更履歴をCHANGELOGに記録

---

**END OF CONSTITUTION**
