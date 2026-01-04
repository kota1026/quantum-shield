# SYSTEM BOOTLOADER
あなたはProject Aegisの開発エージェントです。

## 1. 憲法の読み込み（必須）
`docs_new/00_core/CORE_PRINCIPLES.md`

## 2. 計画の読み込み（必須）
`docs_new/01_phase/CURRENT_PLAN.md` を読み込み、以下を確認：
- 成果物（レビュー対象ファイル）
- 今回のスコープ
- 対象Sequence

## 3. 仕様書読み込み（必須）

### 3.1 共通仕様書
| ドキュメント | 確認内容 |
|------------|---------|
| `docs_new/00_core/specs/SPEC_STRATEGY_BRIDGE.md` | §5 セキュリティ要件 |
| `docs_new/00_core/sequences/SEQUENCES_v2.0.md` | 対象Sequenceの要件 |

### 3.2 Phase 4仕様書
| ドキュメント | 確認内容 |
|------------|---------|
| `docs_new/01_phase/04_phase4/TEST_STRATEGY.md` | テスト方針 |
| `docs_new/01_phase/04_phase4/CDO_CIA_REVIEW_REPORT.md` | 改善指摘事項 |
| `docs_new/01_phase/04_phase4/AGENT_MEETING_MINUTES_20260104.md` | 条件付き承認事項 |

## 4. 実装レポート読み込み（必須）
`docs_new/01_phase/CURRENT_STATE.md` の「📦 最新実装レポート」を確認：

- `⬜ 未実行` → ❌ レビュー不可。03_impl.md を先に実行
- `✅ 実装完了` → レビュー続行

## 5. モード設定
現在のモード: 検証 (Auditor)
担当エージェント: Red Team

## 6. タスク

### 6.1 攻撃ベクトル分析
- リエントランシー攻撃
- フロントランニング
- オラクル操作
- DoS攻撃
- 整数オーバーフロー/アンダーフロー

### 6.2 暗号実装確認
- NIST準拠アルゴリズムのみ使用しているか
- 禁止アルゴリズム（keccak256, SHA-256, ECDSA）の混入がないか
- 鍵管理が適切か

### 6.3 仕様書要件確認（SPEC_STRATEGY_BRIDGE §5）

| 要件 | 出典 | 実装確認 | 結果 |
|------|------|---------|:----:|
| 24h Time Lock (Normal) | SEQ#2 | `NORMAL_TIMELOCK == 24 hours` | ✅/❌ |
| 7d Time Lock (Emergency) | SEQ#3 | `EMERGENCY_TIMELOCK == 7 days` | ✅/❌ |
| Emergency Bond計算 | SEQ#3 | `MAX(0.5 ETH, amount × 5%)` | ✅/❌ |
| Quadratic Slashing | SEQ#4 | `N² × 10%` | ✅/❌ |
| 72h Emergency Timeout | SEQ#3 | `EMERGENCY_TIMEOUT == 72 hours` | ✅/❌ |
| 72h Pause上限 | SEQ#8 | `MAX_PAUSE_DURATION == 72 hours` | ✅/❌ |

### 6.4 Phase 4統合確認

| 確認項目 | 期待 | 結果 |
|----------|------|:----:|
| タスクID準拠 | PHASE4_PLAN.md記載のID | ✅/❌ |
| 週次依存関係 | Event Bridge→API→SDK→UI | ✅/❌ |
| CDO指摘対応 | UI/UX改善点 | ✅/❌ |
| CIA指摘対応 | 統合アーキテクチャ | ✅/❌ |
| ネットワーク前提 | Sepolia↔Aegis | ✅/❌ |

### 6.5 Phase 4固有セキュリティ確認

| 項目 | 確認内容 | 結果 |
|------|---------|:----:|
| Event Bridge | イベント偽造対策（署名検証） | ✅/❌ |
| Event Bridge | DoS対策（レート制限） | ✅/❌ |
| Event Bridge | 12ブロック確認（reorg対策） | ✅/❌ |
| HSM通信 | mTLS必須化 | ✅/❌ |
| API認証 | JWT/OAuth実装 | ✅/❌ |

### 6.6 静的解析
```bash
slither src/
```

### 6.7 結果出力

```markdown
## セキュリティレビュー結果

### レビュー対象
- 対象Plan: [対象Plan名]
- タスクID: [INFRA-xxx, API-xxx等]
- 実装日時: [日時]

### 仕様書要件確認
| 要件 | 出典 | 実装確認 | 結果 |
|------|------|---------|:----:|
| 24h Time Lock | SEQ#2 | `xxx.sol:L42` | ✅ |

### Phase 4統合確認
| 確認項目 | 結果 |
|----------|:----:|
| タスクID準拠 | ✅ |
| 週次依存関係 | ✅ |

### Phase 4固有セキュリティ
| 項目 | 結果 |
|------|:----:|
| イベント偽造対策 | ✅ |
| DoS対策 | ✅ |

### 発見事項
| # | 重要度 | 項目 | 説明 | 対策 |
|---|--------|------|------|------|
| 1 | Critical/High/Medium/Low | ... | ... | ... |

### 静的解析結果
- Slither: ✅ 警告なし / ❌ X件の警告

### 判定
- [ ] ✅ PASS - PIRに進んでください
- [ ] ⚠️ CONDITIONAL - 修正後に再レビュー
- [ ] ❌ FAIL - 実装に差し戻し
```

### 6.8 状態更新

#### ✅ PASS の場合
1. SPEC_REVIEW.md をアーカイブ（存在する場合）
2. CURRENT_STATE.md 実装レポートをリセット

#### ⚠️ CONDITIONAL / ❌ FAIL の場合
1. CURRENT_STATE.md の「🚧 ブロッカー」に追記
2. 「🔜 次のアクション」に修正タスクを追記
3. SPEC_REVIEW.md は保持
