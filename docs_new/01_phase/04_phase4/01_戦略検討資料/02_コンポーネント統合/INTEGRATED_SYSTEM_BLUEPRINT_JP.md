# Quantum Shield - 統合システムブループリント v1.0
> 作成日: 2026-01-04
> 目的: 分断されたコンポーネントの再接続 + UI/UX機能定義 + ガバナンス統合 + 構造的課題分析

---

## 目次

1. [エグゼクティブサマリー](#1-エグゼクティブサマリー)
2. [エディション切替アーキテクチャ](#2-エディション切替アーキテクチャ)
3. [コンポーネント・インベントリ](#3-コンポーネント・インベントリ)
4. [シーケンス × モード × コンポーネント対応表](#4-シーケンス--モード--コンポーネント対応表)
5. [ペルソナ別 UI/UX 機能要件](#5-ペルソナ別-uiux-機能要件)
6. [ガバナンス・コンポーネント (Decentralized)](#6-ガバナンス・コンポーネント-decentralized)
7. [統合ギャップ分析](#7-統合ギャップ分析)
8. [PIR実装済みコンポーネント一覧](#8-pir実装済みコンポーネント一覧)
9. [構造的課題分析](#9-構造的課題分析)
10. [推奨アクション](#10-推奨アクション)

---

## 1. エグゼクティブサマリー

### 根本原因
**部分最適化により、過去に開発したコンポーネントが認識されていない**

これは**実装問題ではなく統合問題**である。

### 発見された資産

| カテゴリ | 数量 | 状態 |
|---------|------|------|
| L1 Solidity コントラクト | 82+ ファイル | ✅ 実装済み（孤立） |
| L3 Rust クレート | 11 クレート | ✅ 実装済み（孤立） |
| シーケンス定義 | 8 + 1 補助 | ✅ 定義済み |
| PIR レビュー | 40+ 件 | ✅ 完了 |
| テスト | 1,424+ | ✅ Pass |

### 主要な課題

1. **コンポーネント統合**: L1↔L3 イベントブリッジが未実装
2. **モード切替**: Enterprise/Decentralized の切替機構が未設計
3. **UI/UX 不在**: 4ペルソナ向けインターフェースが未実装
4. **ドキュメント分散**: PIR記録が2箇所に分散

---

## 2. エディション切替アーキテクチャ

### 2.1 エディション概要

```
┌─────────────────────────────────────────────────────────────────┐
│                    Quantum Shield Platform                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│    ┌─────────────────┐           ┌─────────────────┐            │
│    │  Enterprise     │◄─────────►│  Decentralized  │            │
│    │  Edition        │  切替     │  Edition        │            │
│    └────────┬────────┘           └────────┬────────┘            │
│             │                             │                      │
│    ┌────────┴────────────────────────────┴────────┐             │
│    │              共通コアシステム                  │             │
│    │  L1 Vault │ L3 Aegis │ STARK │ SPHINCS+      │             │
│    └───────────────────────────────────────────────┘             │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 エディション比較

| 項目 | Enterprise Edition | Decentralized Edition |
|------|-------------------|----------------------|
| **ターゲット** | 金融機関、銀行、保険 | DEX、ブリッジ、カストディ |
| **L3 ノード** | 4ノード固定（全Phase） | 4→N ノード（Phase 4+） |
| **Prover** | 許可制（契約ベース） | 段階的 Permissionless |
| **ガバナンス** | オプション / 限定的 | Token Vote + Council |
| **重視点** | 安定性・規制対応・SLA | 分散性・検閲耐性・透明性 |

### 2.3 切替機構（設計案）

```solidity
// contracts/src/core/EditionManager.sol (NEW)
contract EditionManager {
    enum Edition { ENTERPRISE, DECENTRALIZED }
    Edition public currentEdition;
    
    // Enterprise: 固定4ノード、許可制Prover
    // Decentralized: 動的ノード、Permissionless Prover
    
    function switchEdition(Edition newEdition) external onlyAdmin {
        require(newEdition != currentEdition, "Same edition");
        currentEdition = newEdition;
        emit EditionSwitched(currentEdition, newEdition);
    }
    
    function isEnterprise() public view returns (bool) {
        return currentEdition == Edition.ENTERPRISE;
    }
}
```

### 2.4 コマンドライン切替

```bash
# Enterprise Edition（全Phase）
aegis-node --edition=enterprise --nodes=4 --membership=static

# Decentralized Edition (Phase 1-2)
aegis-node --edition=decentralized --nodes=4 --membership=static

# Decentralized Edition (Phase 3)
aegis-node --edition=decentralized --nodes=4 --membership=council

# Decentralized Edition (Phase 4)
aegis-node --edition=decentralized --nodes=N --membership=stake
```

---

## 3. コンポーネント・インベントリ

### 3.1 L1 レイヤー (Solidity)

| コンポーネント | 場所 | サイズ | シーケンス | 状態 |
|---------------|------|--------|-----------|------|
| **L1Vault.sol** | contracts/src/ | 48KB | #1,#2,#3,#4 | ✅ 実装済 |
| **VRFConsumer.sol** | contracts/src/ | 18KB | #2 | ✅ 実装済 |
| **SPHINCSVerifier.sol** | contracts/src/ | 21KB | #2 | ✅ 実装済 |
| **STARKVerifier.sol** | contracts/src/ | 22KB | 将来 | ✅ 実装済 |
| **FRIVerifier.sol** | contracts/src/ | 13KB | 将来 | ✅ 実装済 |
| **BatchVerifier.sol** | contracts/src/ | 10KB | 最適化 | ✅ 実装済 |
| **QuantumShield.sol** | contracts/src/ | 30KB | コア | ✅ 実装済 |

#### ライブラリ (contracts/src/libraries/)

| ライブラリ | 用途 | CP-1 準拠 |
|-----------|------|-----------|
| SHA3_256.sol | FIPS 202 ハッシュ | ✅ |
| SHAKE256.sol | XOF 関数 | ✅ |
| SparseMerkleTree.sol | SMT 操作 | ✅ |
| ProofCodec.sol | 証明エンコーディング | ✅ |

#### ガバナンス関連 (Phase 3.3で実装済み)

| コンポーネント | 用途 | PIR |
|---------------|------|-----|
| QSInflation.sol | 5%→1% 4年逓減 | PIR-P3.3-003 |
| Treasury.sol | 7日TimeLock、$100K上限 | PIR-P3.3-003 |
| RewardDistributor.sol | 40/30/20/10 配分 | PIR-P3.3-003 |
| EconomicParameters.sol | CP-3/CP-4 保護 | PIR-P3.3-003 |
| GovernanceSwitch.sol | Enterprise/Decentralized切替 | PIR-P3.3-001 |
| SecurityCouncil.sol | 5/9緊急停止 | PIR-P3.3-001 |
| ProverRegistry.sol | Prover登録/退出 | PIR-P3.3-002 |
| SequencerRegistry.sol | Sequencer管理 | PIR-P3.3-002 |

### 3.2 L3 レイヤー (Rust)

| クレート | 場所 | 用途 | シーケンス |
|---------|------|------|-----------|
| **aegis-consensus** | l3-aegis/crates/ | BFT 4ノード | #1,#2 |
| **aegis-crypto** | l3-aegis/crates/ | Dilithium-III | #1,#2 |
| **aegis-smt** | l3-aegis/crates/ | SR_0/SR_1 | #1,#2 |
| **aegis-types** | l3-aegis/crates/ | 共通型 | 全て |
| **aegis-core** | l3-aegis/crates/ | コアロジック | 全て |
| **aegis-sequencer** | l3-aegis/crates/ | TX順序付け | #1,#2 |
| **aegis-network** | l3-aegis/crates/ | P2P | インフラ |
| **aegis-storage** | l3-aegis/crates/ | RocksDB | インフラ |
| **aegis-node** | l3-aegis/crates/ | ノード | インフラ |
| **aegis-cli** | l3-aegis/crates/ | CLI | 運用 |
| **aegis-keygen** | l3-aegis/crates/ | 鍵生成 | Prover |

### 3.3 STARK プルーバー

| ファイル | サイズ | 用途 |
|---------|--------|------|
| stark-prover/src/main.rs | 17KB | STARK証明生成 |

---

## 4. シーケンス × モード × コンポーネント対応表

### 4.1 シーケンス一覧

| # | シーケンス | カテゴリ | Enterprise | Decentralized |
|---|-----------|----------|:----------:|:-------------:|
| 1 | Lock | User Flow | ✅ | ✅ |
| 2 | Unlock (Normal) | User Flow | ✅ | ✅ |
| 3 | Unlock (Emergency) | User Flow | ✅ | ✅ |
| 3' | Resync | 補助 | ✅ | ✅ |
| 4 | Challenge + Slashing | Security | ✅ | ✅ |
| 5 | Prover Registration | Prover | ✅ (契約) | ✅ (Council/自動) |
| 6 | Prover Exit | Prover | ✅ | ✅ |
| 7 | Governance Proposal | Governance | ❌/限定 | ✅ (Phase 3+) |
| 8 | Emergency Pause | Governance | ✅ (運営) | ✅ (SC 5/9) |

### 4.2 シーケンス別 モード分岐

#### シーケンス #5: Prover Registration

| ステップ | Enterprise | Decentralized |
|---------|-----------|---------------|
| 承認方式 | 契約ベース（財団承認） | Phase 1-2: 財団招待 |
| | | Phase 3: Council 3/9 + 自動条件 |
| | | Phase 4: 自動承認（Stake条件） |
| Stake通貨 | ETH | Phase 1: ETH → Phase 2+: $QS |
| HSM要件 | 必須 | 必須 |

#### シーケンス #7: Governance Proposal

| ステップ | Enterprise | Decentralized |
|---------|-----------|---------------|
| 対象 | ❌ または限定的 | ✅ フル機能 |
| 投票権 | なし | veQS 加重 |
| Purpose Committee | なし | ✅ (Phase 3+) |
| Security Council | オプション | ✅ 必須 |
| Quorum | N/A | 4%/8%/15% |

### 4.3 シーケンス × コンポーネント詳細

#### #1 Lock
```
User → L3 Aegis (BFT + Dilithium) → L1 Vault

必要コンポーネント:
├── L3: aegis-consensus (BFT 4ノード)
├── L3: aegis-crypto (Dilithium検証)
├── L3: aegis-smt (SR_0計算)
├── L1: L1Vault.sol (deposit + lock_id)
└── L1: SHA3_256.sol (ステートハッシュ)

統合ギャップ:
└── [P0] L3→L1 イベントブリッジ (Lock確認)
```

#### #2 Unlock (Normal)
```
User → L3 Aegis → Chainlink VRF → Prover (5社) → L1 Vault

必要コンポーネント:
├── L3: aegis-consensus, aegis-crypto, aegis-smt (SR_1)
├── L1: VRFConsumer.sol (Prover選出)
├── L1: SPHINCSVerifier.sol (2/5署名)
└── L1: L1Vault.sol (unlock + 24h)

統合ギャップ:
├── [P0] L3→VRF リクエストフロー
└── [P0] L3→Prover 署名リクエスト
```

#### #7 Governance Proposal (Decentralized のみ)
```
Proposer → Governance Contract → Purpose Committee → Security Council → Token Holders

必要コンポーネント:
├── L1: GovernanceSwitch.sol ✅ 実装済
├── L1: SecurityCouncil.sol ✅ 実装済
├── L1: Treasury.sol ✅ 実装済
├── L1: EconomicParameters.sol ✅ 実装済
├── [NEW] Governance.sol (提案ライフサイクル)
├── [NEW] PurposeCommittee.sol (理念チェック)
└── [NEW] veQSVoting.sol (投票メカニズム)

ガバナンスフロー:
1. 提案作成 (1 ETH Bond)
2. Purpose Committee 理念チェック (7日)
3. 議論期間 (7日)
4. 投票期間 (7日) - veQS加重
5. Time Lock (7日)
6. Security Council Veto 機会 (6/9)
7. 実行
```

---

## 5. ペルソナ別 UI/UX 機能要件

### 5.1 4つのペルソナ

| # | ペルソナ | 説明 | 主な画面数 |
|---|---------|------|-----------|
| 1 | **Admin** | Kota / QS運営チーム | 9 セクション |
| 2 | **Service Provider** | Enterprise購入企業 | 9 セクション |
| 3 | **Prover** | 署名サービス提供者 | 9 セクション |
| 4 | **End User** | Lock/Unlock利用者 | 8 セクション |

### 5.2 Admin Dashboard

```
Admin Dashboard
├── 1. システム概要
│   ├── 全体ステータス（正常/警告/異常）
│   ├── TVL サマリー / アクティブ Lock/Unlock
│   └── L3 ノード状態
├── 2. エディション管理 ★重要
│   ├── モード切替（Enterprise ⇔ Decentralized）
│   ├── 現在のモード表示
│   └── モード別設定パラメータ
├── 3. L3 ノード管理
├── 4. Prover 管理
├── 5. トランザクション監視
├── 6. 緊急対応（Emergency Pause）
├── 7. 設定（パラメータ、アラート）
├── 8. レポート
└── 9. 監査ログ
```

### 5.3 End User App

```
User Application
├── 1. ダッシュボード（総資産、Lock中、Unlock進行中）
├── 2. Lock（資産をロック）
│   ├── 資産選択 → 金額入力 → 手数料確認
│   ├── ウォレット接続（MetaMask等）
│   └── トランザクション署名
├── 3. Unlock（資産を引き出し）
│   ├── 通常 Unlock（24時間）
│   └── 緊急 Unlock（7日 + Bond）
├── 4. 資産管理（Lock中の資産一覧）
├── 5. トランザクション履歴
├── 6. 鍵管理
│   ├── Dilithium 鍵ペア生成 ★WASM必要
│   ├── 公開鍵登録
│   └── 鍵バックアップ/復元
├── 7. 設定
└── 8. ヘルプ
```

### 5.4 必要な新規コンポーネント（バックエンド）

| 優先度 | コンポーネント | 対象ペルソナ | 説明 |
|:------:|---------------|-------------|------|
| **P0** | Edition Manager | Admin | Enterprise/Decentralized切替 |
| **P0** | Event Bridge Service | All | L3↔L1 イベント同期 |
| **P0** | Lock API | User | Lock作成/確認 |
| **P0** | Unlock API | User | Unlock申請/状態追跡 |
| **P0** | Signature Queue Service | Prover | 署名要求キュー |
| **P0** | HSM Integration | Prover | HSM連携 |
| **P0** | Dilithium WASM | User | クライアント側鍵生成 |
| **P1** | Balance API | User | Lock中資産取得 |
| **P1** | Status Tracker API | User | 進捗追跡 |
| **P1** | Prover Registration API | Prover | 登録/退出 |
| **P1** | Admin Dashboard | Admin | React App |
| **P1** | User App | User | React App |
| **P2** | Report Service | Admin, SP | レポート生成 |
| **P2** | Tenant Manager | SP | マルチテナント |
| **P2** | Webhook Service | SP, Prover | イベント通知 |

---

## 6. ガバナンス・コンポーネント (Decentralized)

### 6.1 実装済みコンポーネント (PIR-P3.3)

| コンポーネント | 機能 | 状態 |
|---------------|------|------|
| GovernanceSwitch.sol | Enterprise/Decentralized モード管理 | ✅ PIR-P3.3-001 |
| SecurityCouncil.sol | 5/9緊急停止、Veto権限 | ✅ PIR-P3.3-001 |
| ProverRegistry.sol | Prover登録/退出/状態管理 | ✅ PIR-P3.3-002 |
| SequencerRegistry.sol | Sequencer管理 | ✅ PIR-P3.3-002 |
| QSInflation.sol | 5%→1% 4年逓減インフレ | ✅ PIR-P3.3-003 |
| Treasury.sol | 7日TimeLock、$100K上限 | ✅ PIR-P3.3-003 |
| RewardDistributor.sol | 40/30/20/10 配分 | ✅ PIR-P3.3-003 |
| EconomicParameters.sol | CP-3/CP-4 保護 | ✅ PIR-P3.3-003 |

### 6.2 未実装コンポーネント

| コンポーネント | 機能 | シーケンス | 優先度 |
|---------------|------|-----------|:------:|
| **Governance.sol** | 提案ライフサイクル（作成→投票→実行） | #7 | P1 |
| **PurposeCommittee.sol** | Core Principles 理念チェック | #7 | P1 |
| **veQSVoting.sol** | veQS 加重投票メカニズム | #7 | P1 |
| **ProposalTimelock.sol** | 7日実行遅延 | #7 | P1 |

### 6.3 ガバナンスフロー詳細 (SEQUENCES #7より)

```
提案者 → Governance Contract → Purpose Committee → Security Council → Token Holders

タイムライン:
├── T+0:    提案作成 (1 ETH Bond)
├── T+0-7d: Purpose Committee 理念チェック
├── T+7d:   議論期間開始
├── T+14d:  投票期間開始 (Snapshot block)
│           └── Quorum: 4%/8%/15% (タイプ別)
├── T+21d:  投票終了、Time Lock開始
├── T+21-28d: Security Council Veto機会 (6/9)
├── T+28d:  実行可能
└── T+28d+: Bond返還
```

### 6.4 Quorum要件

| 提案タイプ | Quorum | 例 |
|-----------|--------|-----|
| パラメータ変更 | 4% | 手数料率、Time Lock期間 |
| アップグレード | 8% | コントラクト更新 |
| Council変更 | 15% | メンバー追加/削除 |
| Immutable変更 | 30% | 理論上のみ（+2年Time Lock） |

---

## 7. 統合ギャップ分析

### 7.1 クリティカルギャップ (P0)

| # | ギャップ | 影響 | 対応コンポーネント |
|---|---------|------|-------------------|
| 1 | **L3↔L1 イベントブリッジ** | Lock確認がL3に到達しない | Event Bridge Service |
| 2 | **L3→Prover 署名フロー** | UnlockでSPHINCS+署名を取得できない | Signature Queue Service |
| 3 | **VRF 統合** | Prover選出が接続されていない | VRF Integration |
| 4 | **Edition Manager** | モード切替機構なし | EditionManager.sol |
| 5 | **Dilithium WASM** | クライアント側鍵生成不可 | WebAssembly Module |

### 7.2 重要ギャップ (P1)

| # | ギャップ | 影響 | 対応コンポーネント |
|---|---------|------|-------------------|
| 6 | 監視ボット | Challenge/Slashingトリガー不可 | Monitoring Bot |
| 7 | Governance.sol | #7シーケンス未実装 | Governance Contract |
| 8 | Admin Dashboard | 運用管理UI不在 | React App |
| 9 | User App | ユーザー向けUI不在 | React App |

### 7.3 アーキテクチャギャップ

| ギャップ | 説明 | 工数 |
|---------|------|------|
| 統一RPCインターフェースなし | L3ノードに標準化されたAPIがない | 中 |
| イベントインデクサーなし | L1イベントがL3で追跡されていない | 中 |
| Prover署名サービスなし | HSM統合が未定義 | 高 |

---

## 8. PIR実装済みコンポーネント一覧

### 8.1 PIR記録の所在

> ⚠️ **構造的課題**: PIR記録が2箇所に分散している

| パス | 内容 | 件数 |
|------|------|------|
| `docs/aegis/pir/` | PIR-006〜PIR-P3.1-005 等 | 20+ |
| `docs/aegis/meetings/` | PIR-P3.1-005〜PIR-P3.3-003 等 | 18+ |
| `docs/aegis/` (直下) | PIR-002〜PIR-005 | 4 |

### 8.2 主要PIR実装済み項目

| PIR ID | 対象 | 状態 | 実装コンポーネント |
|--------|------|------|-------------------|
| PIR-006 | Day 8-9 Security Review | ✅ PASS | L1Vault.sol, VRFConsumer.sol |
| PIR-007 | Gas Optimization | ✅ PASS | SHA3_256最適化 |
| PIR-008 | Fuzz Tests | ✅ PASS | Fuzz Test Suite |
| PIR-009 | Formal Verification | ✅ PASS | Lean4 検証 |
| PIR-P3.3-001 | Governance Base | ✅ PASS | GovernanceSwitch, SecurityCouncil |
| PIR-P3.3-002 | Registry | ✅ PASS | ProverRegistry, SequencerRegistry |
| PIR-P3.3-003 | Economics | ✅ PASS | QSInflation, Treasury, RewardDistributor |

### 8.3 テスト結果サマリー

| スイート | テスト数 | 結果 |
|----------|:-------:|:----:|
| Phase 3.3 全体 | 474 | ✅ PASS |
| Track B (E2E) | 1,424 | ✅ PASS |
| Slither | 44検出 | ✅ 0 Critical/High |

---

## 9. 構造的課題分析

### 9.1 発生原因の特定

```
┌─────────────────────────────────────────────────────────────┐
│                   構造的課題の発生メカニズム                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  1. 部分最適化                                               │
│     └─► 各コンポーネントが独立して開発                       │
│         └─► L1/L3/Prover が孤立                            │
│                                                             │
│  2. ドキュメント分散                                         │
│     └─► PIR記録が3箇所に分散                                │
│         ├─► docs/aegis/pir/                                │
│         ├─► docs/aegis/meetings/                           │
│         └─► docs/aegis/ (直下)                             │
│                                                             │
│  3. 統合テストの欠如                                         │
│     └─► ユニットテストは充実 (1,424+)                       │
│         └─► E2E フローテストが不十分                        │
│                                                             │
│  4. UI/UX 視点の欠如                                        │
│     └─► 実装先行、ユーザー体験後回し                        │
│         └─► 必要機能の発見が遅延                            │
│                                                             │
│  5. モード（Edition）設計の後回し                            │
│     └─► Enterprise/Decentralized の切替が未設計             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 9.2 具体的な問題箇所

| 問題 | 詳細 | 影響 |
|------|------|------|
| **PIR分散** | 3箇所に分散、命名規則不統一 | 実装状況の把握困難 |
| **コンポーネント孤立** | L1/L3間の接続未実装 | E2Eテスト不可 |
| **仕様書と実装の乖離** | 8シーケンス定義済み、一部未実装 | 全体像不明確 |
| **Edition切替未設計** | UNIFIED_SPEC定義済み、実装なし | 製品化困難 |
| **UI/UX不在** | 4ペルソナ定義なし | ユーザー体験未設計 |

### 9.3 推奨改善策

#### ドキュメント管理

```
docs/
├── aegis/
│   ├── pir/                    # PIR記録を統一
│   │   ├── phase1/
│   │   ├── phase2/
│   │   ├── phase3/
│   │   │   ├── 3.1/
│   │   │   ├── 3.2/
│   │   │   └── 3.3/
│   │   └── README.md           # PIR インデックス
│   ├── specs/                  # 仕様書
│   │   ├── UNIFIED_SPEC_v2.0.md
│   │   ├── SEQUENCES_v2.0.md
│   │   └── L3_CHAIN_SPECIFICATION.md
│   └── architecture/           # アーキテクチャ
│       ├── INTEGRATION_BLUEPRINT.md
│       └── UI_UX_REQUIREMENTS.md
└── ...
```

#### プロンプト/プロセス改善

| 課題 | 改善策 |
|------|--------|
| コンポーネント孤立 | 各実装後に「統合チェックリスト」を確認 |
| PIR分散 | PIR作成時に統一パスを強制 |
| E2Eテスト不足 | コンポーネント実装後に必ずE2Eテスト追加 |
| UI/UX後回し | 機能定義時にペルソナ視点を必須化 |

---

## 10. 推奨アクション

### 10.1 即座のアクション（今週）

| # | アクション | 優先度 | 工数 |
|---|-----------|:------:|:----:|
| 1 | PIR記録の統一整理 | P0 | 1日 |
| 2 | EditionManager.sol 設計 | P0 | 1日 |
| 3 | Event Bridge Service 設計 | P0 | 2日 |
| 4 | このドキュメントをリポジトリにコミット | P0 | 0.5日 |

### 10.2 短期アクション（2週間）

| # | アクション | 優先度 | 工数 |
|---|-----------|:------:|:----:|
| 5 | L3↔L1 Event Bridge 実装 | P0 | 3日 |
| 6 | Lock API / Unlock API 実装 | P0 | 3日 |
| 7 | Signature Queue Service 実装 | P0 | 2日 |
| 8 | Dilithium WASM Module 実装 | P0 | 3日 |
| 9 | E2E Lock→Unlock テスト | P0 | 2日 |

### 10.3 中期アクション（1ヶ月）

| # | アクション | 優先度 | 工数 |
|---|-----------|:------:|:----:|
| 10 | Governance.sol 実装 | P1 | 5日 |
| 11 | Admin Dashboard (MVP) | P1 | 5日 |
| 12 | User App (MVP) | P1 | 5日 |
| 13 | Prover Dashboard | P1 | 3日 |
| 14 | 監視ボット実装 | P1 | 3日 |

### 10.4 優先順位付けフローチャート

```
START
  │
  ▼
[PIR整理] ──► [EditionManager設計] ──► [Event Bridge設計]
  │
  ▼
[Event Bridge実装] ──► [Lock/Unlock API] ──► [Signature Queue]
  │
  ▼
[E2E Test Lock→Unlock] ──► 成功？ ──► [Governance.sol]
  │                          │
  No                        Yes
  │                          │
  ▼                          ▼
[デバッグ]              [Admin Dashboard] ──► [User App]
```

---

## 付録A: コンポーネント依存関係図

```
                        ┌─────────────────────┐
                        │  ユーザーインターフェース │
                        │  (Admin/SP/Prover/User) │
                        └─────────┬───────────┘
                                  │
                        ┌─────────▼───────────┐
                        │   API Gateway        │
                        │   + Auth Service     │
                        └─────────┬───────────┘
                                  │
              ┌───────────────────┼───────────────────┐
              │                   │                   │
    ┌─────────▼─────────┐ ┌──────▼──────┐ ┌─────────▼─────────┐
    │  L3 Aegis         │ │   Prover    │ │  Event Bridge     │
    │  ┌─────────────┐  │ │  Service    │ │  Service          │
    │  │consensus    │  │ │  (HSM)      │ │  (L1↔L3 同期)     │
    │  │crypto       │  │ └──────┬──────┘ └─────────┬─────────┘
    │  │smt          │  │        │                   │
    │  │sequencer    │  │        │                   │
    │  └─────────────┘  │        │                   │
    └─────────┬─────────┘        │                   │
              │                   │                   │
              └───────────────────┼───────────────────┘
                                  │
                        ┌─────────▼───────────┐
                        │     L1 Contracts    │
                        │  ┌───────────────┐  │
                        │  │L1Vault        │  │
                        │  │VRFConsumer    │  │
                        │  │SPHINCSVerifier│  │
                        │  │Governance*    │  │
                        │  │EditionManager*│  │
                        │  └───────────────┘  │
                        └─────────────────────┘
                        
                        * = 新規/設計中
```

---

## 付録B: 関連ドキュメント

| ドキュメント | パス |
|-------------|------|
| UNIFIED_SPEC_v2.0 | docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md |
| SEQUENCES_v2.0 | docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md |
| L3_CHAIN_SPECIFICATION | docs/aegis/L3_CHAIN_SPECIFICATION.md |
| WBS_v2.1 | docs/aegis/WBS_v2.1.md |
| PIR_CODE_REVIEW_ROUTINE | docs/aegis/PIR_CODE_REVIEW_ROUTINE.md |
| PHASE3_DOCUMENT_MAP | docs/planning/PHASE3_DOCUMENT_MAP.md |

---

**END OF DOCUMENT**

---

## 変更履歴

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-04 | 初版作成 |
