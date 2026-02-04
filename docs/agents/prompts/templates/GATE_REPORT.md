# Gate Check Report Template

> このテンプレートはPhase完了時のゲートチェック結果に使用します。

---

## Gate Check Report: Phase 8-{X}

### 実行情報

| 項目 | 値 |
|------|-----|
| 検証日時 | {YYYY-MM-DD HH:mm} |
| Phase | 8-{X} |
| 実行者 | {executor} |
| 実行コマンド | `./scripts/gate-check.sh 8-{X}` |

---

### 検証結果サマリー

| Category | Count |
|----------|:-----:|
| Total Checks | {n} |
| ✅ Passed | {n} |
| ❌ Failed (Critical) | {n} |
| ⚠️ Failed (Non-Critical) | {n} |

### 総合判定

```
┌─────────────────────────────────────────┐
│                                         │
│     ✅ GATE PASSED / ❌ GATE FAILED     │
│                                         │
└─────────────────────────────────────────┘
```

---

### 検証詳細

| Status | ID | Check | Result | Detail |
|:------:|:---|-------|:------:|--------|
| ✅ | 8X-01 | {check_name} | PASS | - |
| ✅ | 8X-02 | {check_name} | PASS | - |
| ❌ | 8X-03 | {check_name} | FAIL | {error_detail} |
| ⚠️ | 8X-04 | {check_name} | WARN | {warning_detail} |

---

### 失敗項目詳細（ある場合）

#### ❌ 8X-03: {check_name}

**期待値:**
```
{expected}
```

**実際の結果:**
```
{actual}
```

**エラーログ:**
```
{error_log}
```

**対応方法:**
1. {step1}
2. {step2}
3. {step3}

---

### 次のアクション

#### ✅ PASSの場合

```markdown
## 次のステップ

1. PHASE8_PROGRESS.md を更新:
   - Phase 8-{X} の Status を "🟢 Complete" に変更
   - Gate 列を "✅" に変更

2. 次のPhaseへ進行:
   ```
   Phase 8-{X+1} 開始
   ```

3. コミット:
   ```bash
   git add -A
   git commit -m "feat: Phase 8-{X} completed"
   ```
```

#### ❌ FAILの場合

```markdown
## 修正が必要な項目

| # | 問題 | 対応 | 担当 |
|---|------|------|------|
| 1 | {issue1} | {action1} | {assignee} |
| 2 | {issue2} | {action2} | {assignee} |

## 修正後の再検証

修正完了後、再度ゲートチェックを実行:

```bash
./scripts/gate-check.sh 8-{X}
```
```

---

### 進捗ファイル更新（PASSの場合のみ）

```diff
## PHASE8_PROGRESS.md

- | 8-{X} | 🟡 In Progress | {n}/{total} | - |
+ | 8-{X} | 🟢 Complete | {total}/{total} | ✅ |
```

---

### 添付資料

- テスト実行ログ: `/tmp/gate-check-8{X}-{timestamp}.log`
- スクリーンショット: `/tmp/screenshots/`

---

**Report End**
