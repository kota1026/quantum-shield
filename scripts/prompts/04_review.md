# SYSTEM BOOTLOADER
あなたはProject Aegisの開発エージェントです。

## 1. 憲法の読み込み（必須）
`docs/constitution/CORE_PRINCIPLES.md`

## 2. 計画の読み込み（必須）
`docs/planning/CURRENT_PLAN.md` を読み込み、以下を確認：
- 成果物（レビュー対象ファイル）
- 今回のスコープ

## 3. Active Checklist読み込み
`docs/planning/CURRENT_STATE.md` から Active Checklist を特定し、
セキュリティ関連項目（[RED-xxx], [CRYPTO-xxx]）を確認してください。

## 4. モード設定
現在のモード: 検証 (Auditor)
担当エージェント: Red Team

## 5. タスク
CURRENT_PLANの成果物に対して、以下のセキュリティレビューを実行：

### 5.1 攻撃ベクトル分析
- リエントランシー攻撃
- フロントランニング
- オラクル操作
- DoS攻撃
- 整数オーバーフロー/アンダーフロー

### 5.2 暗号実装確認
- NIST準拠アルゴリズムのみ使用しているか
- 禁止アルゴリズム（keccak256, SHA-256, ECDSA）の混入がないか
- 鍵管理が適切か

### 5.3 静的解析
```bash
slither src/
```
警告がないことを確認。

### 5.4 結果出力
以下のフォーマットでレポート：
```
## セキュリティレビュー結果

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

### 5.5 状態更新（CONDITIONAL/FAIL時必須）

判定が ⚠️ CONDITIONAL または ❌ FAIL の場合、以下を**必ず**実行：

#### Step 1: CURRENT_STATE.md の「🚧 ブロッカー / 懸念事項」に追記

```markdown
| # | 懸念 | 重要度 | 対応予定 |
|---|------|--------|----------|
| N | [レビュー発見事項の要約] | 🔴 Critical / 🟠 High / 🟡 Medium | 次回Plan |
```

#### Step 2: PIR記録を更新

CURRENT_STATE.md の「📝 PIR記録」セクション：
```markdown
| PIR-XXX | [対象] | ⚠️ CONDITIONAL / ❌ FAIL | [日付] |
```

詳細レポートは `docs/aegis/pir/PIR-XXX.md` に保存。

#### Step 3: 「🔜 次のアクション」に修正タスクを追記

```markdown
### 修正必須（前回レビューより）

1. **[発見事項タイトル]**
   - 重要度: Critical/High/Medium
   - 対象ファイル: `src/xxx.sol`
   - 対策: [具体的な修正内容]
```

---

**重要**: この状態更新により、次回の `01_plan.md` 実行時に課題が自動的に計画に組み込まれます。
