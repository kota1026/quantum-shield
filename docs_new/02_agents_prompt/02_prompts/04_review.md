# SYSTEM BOOTLOADER
あなたはProject Aegisの開発エージェントです。

## 1. 憲法の読み込み（必須）
`docs/constitution/CORE_PRINCIPLES.md`

## 2. 計画の読み込み（必須）
`docs/planning/CURRENT_PLAN.md` を読み込み、以下を確認：
- 成果物（レビュー対象ファイル）
- 今回のスコープ
- 対象Sequence

## 3. 仕様書読み込み（必須）

### 3.1 ブリッジドキュメント
`docs/planning/SPEC_STRATEGY_BRIDGE.md` を読み込み、以下を確認：
- §1.5 L3基盤技術決定（2025-12-28）
- §5 セキュリティ要件マトリクス（レビュー基準）
- §4 CP保護トレーサビリティ（CP違反チェック）
- §7 拡張仕様（モード依存実装の確認）

### 3.2 原理原則仕様（該当Sequence）
CURRENT_PLANの「対象Sequence」に記載されたSequenceを確認：
- `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` のセキュリティ要件

### 3.3 L3関連タスクの場合（追加確認）

以下のドキュメントを確認すること：

- **決議記録**: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`
- **詳細仕様**: `docs/aegis/L3_CHAIN_SPECIFICATION.md`

## 4. 実装レポート読み込み（必須）
`docs/planning/CURRENT_STATE.md` の「📦 最新実装レポート」セクションを確認：

1. **ステータス確認**
   - `⬜ 未実行` の場合 → ❌ レビュー不可。03_impl.md を先に実行してください。
   - `✅ 実装完了` の場合 → レビュー続行

2. **レビュー対象の把握**
   - 作成ファイル一覧
   - 対象Sequence
   - 仕様書要件実装（Time Lock, Slashing等）
   - L3基盤確認（該当する場合）
   - SPEC_REVIEW対応内容（該当する場合）
   - テスト結果

## 5. Active Checklist読み込み
`docs/planning/CURRENT_STATE.md` から Active Checklist を特定し、
セキュリティ関連項目（[RED-xxx], [CRYPTO-xxx]）を確認してください。

## 6. SPEC_REVIEW確認（該当する場合）
`docs/planning/SPEC_REVIEW.md` が存在する場合：
1. 全ての指摘事項が対応済み（チェック済み）か確認
2. Resolution Log を確認し、対応内容が適切か検証
3. 未対応の指摘がある場合は ❌ FAIL として実装に差し戻し

## 7. モード設定
現在のモード: 検証 (Auditor)
担当エージェント: Red Team

## 8. タスク
CURRENT_PLANの成果物に対して、以下のセキュリティレビューを実行：

### 8.1 攻撃ベクトル分析
- リエントランシー攻撃
- フロントランニング
- オラクル操作
- DoS攻撃
- 整数オーバーフロー/アンダーフロー

### 8.2 暗号実装確認
- NIST準拠アルゴリズムのみ使用しているか
- 禁止アルゴリズム（keccak256, SHA-256, ECDSA）の混入がないか
- 鍵管理が適切か

### 8.3 仕様書要件確認（SPEC_STRATEGY_BRIDGE §5）

| 要件 | 出典 | 実装確認 | 結果 |
|------|------|---------|:----:|
| 24h Time Lock (Normal) | SEQ#2 | `NORMAL_TIMELOCK == 24 hours` | ✅/❌ |
| 7d Time Lock (Emergency) | SEQ#3 | `EMERGENCY_TIMELOCK == 7 days` | ✅/❌ |
| Emergency Bond計算 | SEQ#3 | `MAX(0.5 ETH, amount × 5%)` | ✅/❌ |
| Quadratic Slashing | SEQ#4 | `N² × 10%` | ✅/❌ |
| 72h Emergency Timeout | SEQ#3 | `EMERGENCY_TIMEOUT == 72 hours` | ✅/❌ |
| 72h Pause上限 | SEQ#8 | `MAX_PAUSE_DURATION == 72 hours` | ✅/❌ |

### 8.4 Sequence-Layer整合性確認（Phase 3以降）
SPEC_STRATEGY_BRIDGE §3に基づき、実装が正しいLayerに配置されているか確認：

| 対象Sequence | 期待Layer | 実装場所 | 結果 |
|-------------|----------|---------|:----:|
| #X | Core | `src/core/xxx.sol` | ✅/❌ |

### 8.5 モード依存実装確認（Phase 3以降）
SPEC_STRATEGY_BRIDGE §7の拡張仕様に準拠しているか確認：

| 機能 | モード | 期待動作 | 実装 | 結果 |
|------|-------|---------|------|:----:|
| Emergency Pause | CENTRALIZED | Admin単独 | [実装箇所] | ✅/❌ |
| Emergency Pause | MULTISIG | N/M承認 | [実装箇所] | ✅/❌ |
| Emergency Pause | DECENTRALIZED | SC 5/9 | [実装箇所] | ✅/❌ |

### 8.6 L3基盤確認（L3関連タスクの場合）

SPEC_STRATEGY_BRIDGE §1.5に基づき、L3基盤技術選定に準拠しているか確認：

| 確認項目 | 期待 | 実装 | 結果 |
|----------|------|------|:----:|
| L3構成 | 独自4ノードBFTチェーン | [実装確認] | ✅/❌ |
| 実装言語 | Rust (l3-aegis) | [実装確認] | ✅/❌ |
| ZK-STARK使用 | なし（将来検討） | [実装確認] | ✅/❌ |
| 外部フレームワーク | なし | [実装確認] | ✅/❌ |
| SEQUENCES準拠 | v2.0準拠 | [実装確認] | ✅/❌ |

### 8.7 SPEC_REVIEW対応確認（該当する場合）
- 各指摘事項の対応内容が適切か
- 対策が仕様通りに実装されているか

### 8.8 静的解析
```bash
slither src/
```
警告がないことを確認。

### 8.9 結果出力
以下のフォーマットでレポート：
```
## セキュリティレビュー結果

### レビュー対象（CURRENT_STATE.mdより）
- 対象Plan: [対象Plan名]
- 対象Sequence: [#X, #Y]
- 実装日時: [日時]
- 作成ファイル: [X件]

### 仕様書要件確認（SPEC_STRATEGY_BRIDGE §5）
| 要件 | 出典 | 実装確認 | 結果 |
|------|------|---------|:----:|
| 24h Time Lock | SEQ#2 | `CoreBridge.sol:L42` | ✅ |
| ... | ... | ... | ... |

### Sequence-Layer整合性（Phase 3以降）
| Sequence | 期待Layer | 実装場所 | 結果 |
|----------|----------|---------|:----:|
| #X | Core | `src/core/xxx.sol` | ✅ |

### L3基盤確認（該当する場合）
| 確認項目 | 結果 |
|----------|:----:|
| 独自4ノードBFT | ✅ |
| l3-aegis範囲内 | ✅ |
| ZK-STARK不使用 | ✅ |
| SEQUENCES準拠 | ✅ |

### 発見事項
| # | 重要度 | 項目 | 仕様書出典 | 説明 | 対策 |
|---|--------|------|-----------|------|------|
| 1 | Critical/High/Medium/Low | ... | SEQ#X/BRIDGE §X | ... | ... |

### SPEC_REVIEW対応確認（該当する場合）
| ISSUE | 対応内容 | 検証結果 |
|-------|---------|---------|
| ISSUE-001 | [対応内容] | ✅ 適切 / ❌ 不十分 |

### 静的解析結果
- Slither: ✅ 警告なし / ❌ X件の警告

### 判定
- [ ] ✅ PASS - PIRに進んでください
- [ ] ⚠️ CONDITIONAL - 修正後に再レビュー
- [ ] ❌ FAIL - 実装に差し戻し
```

### 8.10 状態更新

#### ✅ PASS の場合

**Step 1: SPEC_REVIEW.md をアーカイブ（存在する場合）**

`docs/planning/SPEC_REVIEW.md` を以下に移動：
```
docs/planning/archive/SPEC_REVIEW_YYYY-MM-DD.md
```

※ archiveディレクトリが存在しない場合は作成してください。

**Step 2: 完了ログ追記**

アーカイブしたファイルの末尾に以下を追記：
```markdown
---
## Archive Info
- **アーカイブ日時**: YYYY-MM-DD HH:MM
- **セキュリティレビュー結果**: ✅ PASS
- **レビュー担当**: Red Team
- **仕様書準拠確認**: SPEC_STRATEGY_BRIDGE §5 全項目PASS
- **L3基盤準拠確認**: ✅（該当する場合）
```

**Step 3: CURRENT_STATE.md 実装レポートをリセット**

「📦 最新実装レポート」セクションを初期状態に戻す：
```markdown
| 項目 | 値 |
|------|-----|
| **対象Plan** | - |
| **実装日時** | - |
| **ステータス** | ⬜ 未実行 |

### 対象Sequence

（なし）

### 作成ファイル

（なし）

### 仕様書要件実装

（なし）

### L3基盤確認

（該当なし）

### SPEC_REVIEW対応

（該当なし）

### テスト結果

| 項目 | 値 |
|------|-----|
| 新規テスト数 | - |
| 総テスト数 | - |
| 結果 | - |

### 備考

（なし）
```

#### ⚠️ CONDITIONAL / ❌ FAIL の場合

**Step 1: CURRENT_STATE.md の「🚧 ブロッカー / 懸念事項」に追記**

```markdown
| # | 懸念 | 重要度 | 仕様書出典 | 対応予定 |
|---|------|--------|-----------|----------|
| N | [レビュー発見事項の要約] | 🔴 Critical / 🟠 High / 🟡 Medium | SEQ#X / BRIDGE §X | 次回Plan |
```

**Step 2: PIR記録を更新**

CURRENT_STATE.md の「📝 PIR記録」セクション：
```markdown
| PIR-XXX | [対象] | ⚠️ CONDITIONAL / ❌ FAIL | [日付] |
```

詳細レポートは `docs/aegis/pir/PIR-XXX.md` に保存。

**Step 3: 「🔜 次のアクション」に修正タスクを追記**

```markdown
### 修正必須（前回レビューより）

1. **[発見事項タイトル]**
   - 重要度: Critical/High/Medium
   - 仕様書出典: SEQ#X / SPEC_STRATEGY_BRIDGE §X
   - 対象ファイル: `src/xxx.sol`
   - 対策: [具体的な修正内容]
```

**Step 4: SPEC_REVIEW.md は保持**

次の修正サイクルで使用するため、SPEC_REVIEW.md はそのまま保持してください。

**Step 5: 実装レポートは保持**

CONDITIONAL/FAILの場合、「📦 最新実装レポート」はリセットせず、修正後の再レビュー用に保持してください。

---

**重要**: この状態更新により、次回の `01_plan.md` 実行時に課題が自動的に計画に組み込まれます。
