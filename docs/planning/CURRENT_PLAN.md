# Current Plan

> **Generated**: 2025-12-31 11:30 JST
> **Phase**: 3 - L3 + Token + 完全分散化
> **Sub-Phase**: 3.1 Foundation

## 対象チェックリスト
`docs/checklists/phase3.1.md`

---

## 仕様書参照（必須）

> 参照: `docs/planning/SPEC_STRATEGY_BRIDGE.md`

### 対象Sequence
| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| #2 | Core Layer | SEQUENCES §2 - Unlock (Normal Path) |
| #3 | Core Layer | SEQUENCES §3 - Unlock (Emergency Path) |

### セキュリティ要件
| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| SPHINCS+-128s 署名検証 | CORE_PRINCIPLES §暗号学的要件 | CoreVerifier.sol (SPHINCSVerifier統合) |
| 2/5 Prover署名必須 | SEQ#2 Step5-7 | CoreBatch.sol (閾値検証) |
| SHA3-256ハッシュ | CP-1 | 既存SHA3_256.sol活用 |
| SHAKE256内部ハッシュ | FIPS 205 | 既存SHAKE256.sol活用 |

---

## 戦略準拠確認（Phase 3）

> 参照: `docs/planning/PHASE3_STRATEGY.md`

- [x] L3スタック: 独自L3 (l3-aegis) 前提
- [x] アーキテクチャ: Modular (Core/Governance/Token Layer)
- [x] リスク緩和: 網羅的テスト実施
- [x] モード制約: Core Layer（モード不問で常時有効）

---

## L3基盤確認（Phase 3のL3関連タスク）

> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

- [x] 独自4ノードBFTチェーン前提
- [x] l3-aegis (Rust) の範囲内か → Solidity Core Layerとして整合
- [x] SEQUENCES v2.0に準拠しているか → SEQ#2, #3準拠
- [x] CP-1/CP-5を満たしているか → SPHINCS+/SHA3-256使用、keccak256排除

---

## IC完全性チェック（Phase 3必須）

> 参照: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

### 今回スコープのIC
| IC-ID | Component | タスク | Status |
|-------|-----------|--------|--------|
| IC-2 | L3 Bridge Contract | CORE-002 SPHINCS+ Verifier統合 | 🟡 In Progress |

### マスタ照合
- [x] 全IC-ID（IC-1〜IC-6）がPHASE3_PLANに対応セクションを持つ
- [x] 欠落ICなし

### タスク紐付け
- [x] 今回スコープの全タスクにIC-IDを付与した
- [x] IC-ID不要タスクは理由を明記した

---

## 前回レビュー課題（該当時のみ）

> CURRENT_STATE.mdより

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| - | - | 🔴 Critical課題なし | - |
| - | - | 🟠 High課題なし（前回解決済み） | - |
| 1 | 🟠 MEDIUM | Modular設計複雑性 | 網羅的テスト |

---

## 今回のスコープ

### 実装項目
- [ ] [IMPL-001] ICoreVerifier.sol インターフェース定義 (IC-2)
- [ ] [IMPL-002] CoreVerifier.sol 作成（SPHINCS+検証ラッパー） (IC-2)
- [ ] [IMPL-003] SPHINCSVerifier.sol 統合（既存contracts/src/から） (IC-2)
- [ ] [IMPL-004] ICoreBatch.sol インターフェース定義 (IC-2)
- [ ] [IMPL-005] CoreBatch.sol 作成（2/5閾値バッチSPHINCS+検証） (IC-2)

### 削除項目
- [ ] [DEL-001] Phase 2 STARKVerifier関連コードのCore Layer参照削除（既存コードは保持）

### テスト項目
- [ ] [TEST-001] CoreVerifier.t.sol - 単体テスト（SPHINCS+署名検証）
- [ ] [TEST-002] CoreBatch.t.sol - バッチ検証テスト（2/5閾値）
- [ ] [TEST-003] ガスベンチマークテスト（目標: ~200K gas/署名）
- [ ] [TEST-004] CoreState + CoreVerifier統合テスト

### 参照ドキュメント
| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §3, §5, §10 |
| Sequence仕様 | `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | #2, #3 |
| 全体仕様 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | §IC |
| 憲法 | `docs/constitution/CORE_PRINCIPLES.md` | §暗号学的要件 |
| L3基盤決議 | `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` | 全体 |
| Phase 3計画 | `docs/planning/PHASE3_PLAN.md` | §IC対応 |

---

## 成果物
| ファイル | 説明 | IC-ID |
|---------|------|-------|
| `contracts/src/interfaces/ICoreVerifier.sol` | Core Verifierインターフェース | IC-2 |
| `contracts/src/core/CoreVerifier.sol` | SPHINCS+検証ラッパー実装 | IC-2 |
| `contracts/src/interfaces/ICoreBatch.sol` | バッチ検証インターフェース | IC-2 |
| `contracts/src/core/CoreBatch.sol` | 2/5閾値バッチ検証実装 | IC-2 |
| `contracts/test/core/CoreVerifier.t.sol` | CoreVerifierテストスイート | - |
| `contracts/test/core/CoreBatch.t.sol` | CoreBatchテストスイート | - |

---

## 実行順序

### Phase 1: インターフェース定義
1. ICoreVerifier.sol作成 - 署名検証インターフェース
2. ICoreBatch.sol作成 - バッチ検証インターフェース

### Phase 2: Core実装
3. CoreVerifier.sol作成 - 既存SPHINCSVerifier.solを活用したラッパー
4. CoreBatch.sol作成 - 2/5閾値検証ロジック

### Phase 3: テスト
5. CoreVerifier.t.sol作成・実行
6. CoreBatch.t.sol作成・実行
7. ガスベンチマーク測定
8. CoreState + CoreVerifier統合テスト

### Phase 4: セキュリティ確認
9. Slither静的解析実行
10. CP-1準拠確認（keccak256/SHA-256未使用確認）
11. コードレビュー

---

## 既存資産活用

### 統合対象の既存コントラクト
| ファイル | 説明 | 活用方法 |
|---------|------|---------|
| `contracts/src/SPHINCSVerifier.sol` | SPHINCS+-SHAKE-128s検証 | CoreVerifierから呼び出し |
| `contracts/src/libraries/SHAKE256.sol` | SHAKE256ハッシュライブラリ | 既存利用継続 |
| `contracts/src/libraries/SHA3_256.sol` | SHA3-256ハッシュライブラリ | 公開鍵ハッシュに使用 |

### SPHINCSVerifier.sol 既存機能
| 関数 | 説明 | 利用可否 |
|------|------|:--------:|
| `verify(message, signature, publicKey)` | 単一署名検証 | ✅ |
| `verifyBatch(messages, signatures, publicKeys)` | バッチ署名検証 | ✅ |
| `verifyWithDetails(...)` | 詳細結果付き検証 | ✅ |
| `computePublicKeyHash(publicKey)` | SHA3-256による公開鍵ハッシュ | ✅ |

---

## 設計方針

### CoreVerifier.sol
```solidity
// 設計概要
contract CoreVerifier is ICoreVerifier {
    SPHINCSVerifier public immutable sphincsVerifier;
    
    function verifyProverSignature(
        bytes32 messageHash,
        bytes calldata signature,
        bytes calldata publicKey
    ) external view returns (bool);
    
    function verifyWithProof(
        bytes32 stateRoot,
        bytes32 messageHash,
        bytes calldata signature,
        bytes calldata publicKey
    ) external view returns (bool);
}
```

### CoreBatch.sol
```solidity
// 設計概要
contract CoreBatch is ICoreBatch {
    uint256 public constant REQUIRED_SIGNATURES = 2;
    uint256 public constant TOTAL_PROVERS = 5;
    
    function verifyThresholdSignatures(
        bytes32 messageHash,
        bytes[] calldata signatures,
        bytes[] calldata publicKeys,
        uint256 requiredThreshold
    ) external view returns (bool valid, uint256 validCount);
    
    function verifyUnlockSignatures(
        bytes32 unlockHash,
        bytes[] calldata proverSignatures,
        bytes[] calldata proverPublicKeys
    ) external view returns (bool); // 2/5閾値チェック込み
}
```

---

## Core Principles確認
- [x] CP-1: 完全量子耐性 - SPHINCS+-128s/SHAKE256/SHA3-256のみ使用
- [x] CP-2: Self-Custody - ユーザー鍵に影響なし
- [x] CP-3: Time Lock存在 - 対象外（Verifierは検証のみ）
- [x] CP-4: Slashing存在 - 対象外（Verifierは検証のみ）
- [x] CP-5: 透明性 - イベント発行で検証結果記録

---

## Modular Architecture確認（Phase 3）
- [x] Core Layer: CP保護機構含む（CORE-003で実装済み）
- [ ] Governance Layer: 今回スコープ外
- [ ] Token Layer: 今回スコープ外
- [x] Layer間依存: CoreVerifier/CoreBatchはCore Layerのみ依存

---

## ガス目標
| 操作 | 目標Gas | 備考 |
|------|---------|------|
| 単一署名検証 | ~200K | L3実行前提 |
| バッチ検証 (2署名) | ~400K | L3実行前提 |
| 閾値確認オーバーヘッド | ~5K | 追加コスト |

---

## リスク・懸念事項
| # | リスク | 重要度 | 対策 |
|---|--------|--------|------|
| 1 | SPHINCSVerifier.sol既存コードとの統合複雑性 | 🟡 MEDIUM | ラッパーパターンで疎結合 |
| 2 | ガスコスト超過 | 🟡 MEDIUM | ベンチマーク早期実行 |
| 3 | L3→L1検証時のデータサイズ (7,856 bytes/sig) | 🟡 MEDIUM | L3内で検証完結を推奨 |

---

## 禁止事項確認

### 使用禁止アルゴリズム
- [ ] ECDSA - **使用禁止**
- [ ] RSA - **使用禁止**
- [ ] secp256k1 - **使用禁止**
- [ ] SHA-256 / SHA-2ファミリー - **使用禁止**
- [ ] keccak256 - **使用禁止**（EVM storage slot計算は例外）

### 使用必須アルゴリズム
- [x] SPHINCS+-128s (FIPS 205) - Prover署名検証
- [x] SHA3-256 (FIPS 202) - 公開鍵ハッシュ
- [x] SHAKE256 (FIPS 202) - 内部ハッシュ

---

**END OF CURRENT PLAN**
