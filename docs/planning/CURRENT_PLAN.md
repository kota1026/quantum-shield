# Current Plan

> **Generated**: 2025-12-28 15:00 JST
> **Phase**: 2 - Security Council + Token
> **Week**: 12
> **Focus**: Phase 2.3完了 & Phase 2.4準備

---

## 対象チェックリスト

`docs/planning/PHASE2_CHECKLIST.md` - Phase 2.3 Week 12 (Final)

---

## 前回レビュー課題

> CURRENT_STATE.mdより自動取得

| # | 重要度 | 課題 | 状態 |
|---|--------|------|------|
| - | - | なし（PIR-P2-011 PASS） | ✅ |

**注**: Week 11完了により、CriticalおよびHigh課題は全て解決済み。

---

## Week 11 成果サマリー（継承）

| 項目 | 達成 |
|------|------|
| STARKVerifier v1.0 統合 | ✅ 完了 |
| CP-1準拠 (keccak256完全排除) | ✅ 完了 |
| テストスイート | ✅ 834/834 PASS |
| Sepolia E2E | ✅ Lock→Unlock成功 |
| Gas削減 | ✅ 71%達成 |
| PIR-P2-011 | ✅ PASS |

---

## 今回のスコープ

### P0: Phase 2.3完了作業（Critical）

> **理由**: Phase 2.3のクロージング必須

- [ ] [INFRA-004] Etherscanコントラクト検証
  - 対象: L1Vault, SPHINCSVerifier, STARKVerifier, AIRConstraints, ConstraintEvaluator, SharedMerkle, BatchVerifier
  - L1VaultTestnet (新規追加)
  - 計11コントラクト
- [ ] [DOC-006] Phase 2.3完了レポート作成
  - 成果サマリー
  - Gas最適化結果（71%達成）
  - 残課題と次Phaseへの引継ぎ

### P1: 外部監査準備（High）

> **理由**: Phase 2.4開始準備

- [ ] [DOC-007] 外部監査RFP最終化
  - スコープ定義（対象コントラクト一覧）
  - タイムライン提案
  - 予算見積もり
- [ ] [DOC-008] 監査パッケージ準備
  - コードベースクリーンアップ
  - NatSpecドキュメント最終確認
  - 脆弱性評価マトリクス

### P2: ドキュメント整備（Medium）

> **理由**: 技術的負債解消と知識移転

- [ ] [DOC-009] API Documentationアップデート
  - 全public関数のNatSpec確認
  - ユースケース例の追加
- [ ] [DOC-010] アーキテクチャドキュメント更新
  - STARKVerifier v1.0統合後の構成図
  - コンポーネント間依存関係

### P3: Phase 2.4計画（Medium）

> **理由**: 次フェーズへのスムーズな移行

- [ ] [PLAN-001] Phase 2.4チェックリスト準備
  - 外部監査タスク一覧
  - マイルストーン設定
- [ ] [PLAN-002] 監査業者候補リスト作成
  - Trail of Bits
  - OpenZeppelin
  - Consensys Diligence
  - その他候補

---

## 成果物

| ファイル | 説明 |
|---------|------|
| `docs/planning/PHASE2_3_COMPLETION_REPORT.md` | Phase 2.3完了レポート |
| `docs/planning/AUDIT_RFP_v1.0.md` | 外部監査RFP最終版 |
| `docs/planning/AUDIT_PACKAGE.md` | 監査パッケージ概要 |
| `docs/planning/PHASE2_4_CHECKLIST.md` | Phase 2.4チェックリスト |
| `docs/architecture/STARKVERIFIER_V1_ARCHITECTURE.md` | アーキテクチャドキュメント |

---

## 実行順序

### Step 1: Etherscan検証（Day 1-2）

```bash
# 1. Etherscan APIキー設定
export ETHERSCAN_API_KEY="your_api_key"

# 2. コントラクト検証（各コントラクトごと）
forge verify-contract \
  --chain-id 11155111 \
  --watch \
  0xD4748Fb7a382265E903cCd2b0d15Da64e5d6a2E7 \
  src/L1Vault.sol:L1Vault

# 対象コントラクト:
# - L1Vault: 0xD4748Fb7a382265E903cCd2b0d15Da64e5d6a2E7
# - L1VaultTestnet: 0x8f8661038C85634619B668d2C747B96e32F104CB
# - SPHINCSVerifier: 0xcaEF192eddA106810Caf1A3Ad5dC37229bA79be1
# - STARKVerifier: 0x262A22Ace69336B27f567340DE4f1735FE9ABfE8
# - AIRConstraints: 0x49a1f515A10447197078b7282e8d8C1AD658b149
# - ConstraintEvaluator: 0x5fbffa05d45E85F052Ac9bD0DA30a7C2fb070c81
# - SharedMerkle: 0x956139A615687fA9e0F85e9ff520129f4C3C8574
# - BatchVerifier: 0xD264ac2CB8548B76d95E9267ACADDb42CE608730
# - Week 9デプロイ分 (3 contracts)
```

### Step 2: Phase 2.3完了レポート作成（Day 2-3）

```markdown
# PHASE2_3_COMPLETION_REPORT.md の構成
1. Executive Summary
2. 成果一覧（Week 9-12）
3. Gas最適化結果（71%達成の詳細）
4. テスト結果サマリー（834 tests）
5. Sepolia E2E結果
6. PIRレビュー履歴
7. 残課題と推奨事項
8. Phase 2.4への引継ぎ事項
```

### Step 3: 外部監査RFP最終化（Day 3-4）

```markdown
# AUDIT_RFP_v1.0.md の構成
1. プロジェクト概要
2. 監査スコープ
   - コントラクト一覧（21 contracts）
   - 優先度分類（Critical/High/Medium）
3. 技術要件
   - NIST準拠量子耐性暗号
   - ZK-STARK証明システム
4. タイムライン
   - 希望開始: Month 10 (Phase 2.4)
   - 期間: 4-6週間
5. 成果物要件
6. 予算範囲
7. 選定基準
```

### Step 4: 監査パッケージ準備（Day 4-5）

```bash
# 1. コードベースクリーンアップ
forge fmt

# 2. NatSpec確認
forge doc

# 3. テストカバレッジ確認
forge coverage --report lcov

# 4. Slither最終確認
slither . --sarif results.sarif
```

### Step 5: Phase 2.4計画策定（Day 5-6）

```markdown
# PHASE2_4_CHECKLIST.md 概要
- 監査業者選定プロセス
- 監査キックオフ準備
- 監査対応体制
- 修正プロセス
- 最終レポートレビュー
```

### Step 6: 状態更新 & PIR準備（Day 7）

```bash
# 1. CURRENT_STATE.md更新
# 2. PHASE2_CHECKLIST.md更新（Week 12 COMPLETE）
# 3. PIR-P2-012準備（Phase 2.3 Final Review）
```

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - 違反なし（SHA3-256使用、keccak256完全排除）
- [x] CP-2: Self-Custody - 違反なし
- [x] CP-3: Time Lock存在 - 違反なし
- [x] CP-4: Slashing存在 - 違反なし
- [x] CP-5: 透明性 - 違反なし（Etherscan検証で更に強化）

---

## リスク・懸念事項

| # | リスク | 影響度 | 対策 |
|---|--------|--------|------|
| 1 | Etherscan検証失敗（コンパイラバージョン不一致） | 🟡 MEDIUM | foundry.toml設定確認、複数回試行 |
| 2 | 監査業者スケジュール確保 | 🟡 MEDIUM | 複数候補に同時アプローチ |
| 3 | 87.5% Gas目標未達（現在71%） | 🟡 MEDIUM | Phase 2.4で継続最適化、監査フィードバック反映 |
| 4 | ドキュメント整備の時間不足 | 🟢 LOW | 優先度付けで対応、P2は次週繰越可 |

---

## KPI確認（Phase 2.3終了時点）

| KPI | 目標 | 現状 | 判定 |
|-----|------|------|------|
| Gas削減率 | ≥87.5% | **71%** | 🔄 継続（監査後最適化） |
| テストスイート | 全PASS | **834/834 PASS** | ✅ |
| Slither HIGH | 0件 | **0件（誤検知除く）** | ✅ |
| Slither MEDIUM | 0件 | **0件** | ✅ |
| CP-1準拠 | keccak256排除 | **完了** | ✅ |
| Sepolia E2E | 完全フロー | **Lock→Unlock成功** | ✅ |
| 外部監査準備 | RFP完了 | **草案完了→最終化** | 🔄 |

---

## Phase 2.3 → Phase 2.4 移行チェック

### Phase 2.3 Exit Criteria

| 条件 | 状態 |
|------|------|
| STARKVerifier v1.0 統合 | ✅ |
| BatchVerifier実装 | ✅ |
| ProofCompressor実装 | ✅ |
| 全テストPASS | ✅ 834/834 |
| Sepolia E2E成功 | ✅ |
| PIR-P2-011 PASS | ✅ |
| Etherscan検証 | ⏳ Week 12 |
| 監査RFP最終化 | ⏳ Week 12 |

### Phase 2.4 Entry Criteria

| 条件 | 状態 |
|------|------|
| Phase 2.3 Exit Criteria全て完了 | ⏳ |
| 監査業者選定 | ⬜ |
| 監査契約締結 | ⬜ |

---

## 参照ドキュメント

| ドキュメント | パス |
|-------------|------|
| 憲法 | `docs/constitution/CORE_PRINCIPLES.md` |
| Phase 2.3計画 | `docs/planning/PHASE2_3_PLAN.md` |
| Sepoliaデプロイレポート | `docs/deployments/SEPOLIA_DEPLOYMENT_2025-12-27.md` |
| Gas Baseline (Sepolia) | `docs/deployments/GAS_BASELINE_SEPOLIA.md` |
| PIRコードレビュールーティン | `docs/aegis/PIR_CODE_REVIEW_ROUTINE.md` |
| 外部監査RFP草案 | `docs/planning/AUDIT_RFP_DRAFT.md` |
| PIR-P2-011 | `docs/aegis/pir/PIR-P2-011.md` |

---

## 優先度サマリー

```
┌─────────────────────────────────────────────────────────────┐
│  P0 🔴 Phase 2.3完了作業（必須）                             │
│  ├─ [INFRA-004] Etherscan検証（11 contracts）               │
│  └─ [DOC-006] Phase 2.3完了レポート                         │
│                                                             │
│  P1 🟠 外部監査準備（High）                                  │
│  ├─ [DOC-007] 監査RFP最終化                                 │
│  └─ [DOC-008] 監査パッケージ準備                            │
│                                                             │
│  P2 🟡 ドキュメント整備（Medium）                            │
│  ├─ [DOC-009] API Documentation                             │
│  └─ [DOC-010] アーキテクチャドキュメント                    │
│                                                             │
│  P3 🟢 Phase 2.4計画（Medium）                               │
│  ├─ [PLAN-001] Phase 2.4チェックリスト                      │
│  └─ [PLAN-002] 監査業者候補リスト                           │
└─────────────────────────────────────────────────────────────┘
```

---

## 担当者アサイン

| タスク | 担当 | 期限 |
|--------|------|------|
| [INFRA-004] Etherscan検証 | DevOps | Day 2 |
| [DOC-006] Phase 2.3完了レポート | PM | Day 3 |
| [DOC-007] 監査RFP最終化 | CSO | Day 4 |
| [DOC-008] 監査パッケージ | Engineer | Day 5 |
| [DOC-009] API Documentation | Engineer | Day 6 |
| [DOC-010] アーキテクチャDoc | CTO | Day 6 |
| [PLAN-001] Phase 2.4チェックリスト | PM | Day 6 |
| [PLAN-002] 監査業者候補リスト | CEO + CSO | Day 7 |

---

**次のステップ**: Step 1 実行（Etherscan検証）→ 完了後 Step 2へ

---

**END OF CURRENT PLAN**
