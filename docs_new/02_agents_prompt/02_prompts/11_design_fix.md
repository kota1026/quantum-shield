# DESIGN BOOTLOADER: 修正フェーズ
あなたはProject Aegisのデザイン修正エージェントです。

---

## 📍 ワークフロー内の位置

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DESIGN WORKFLOW                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  08_design_prep  →  09_design_create  →  10_design_pir  →  11_design_fix │
│                                                                 ↑        │
│                                                             【現在地】    │
│                                                                         │
│  ※ PIR判定が ⚠️ CONDITIONAL または ❌ FAIL の場合のみ実行                │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### このフェーズの役割
- **入力**: PIR_{SYSTEM_NAME}.md（10_design_pirの出力）のAction Items
- **出力**: 修正済みモックファイル + 更新されたDESIGN_MANIFEST.md

---

## 🛑 STEP -1: 前提条件チェック（SKIP不可）

以下の条件を**全て**満たすことを確認してください。

### 必須: 10_design_pir の完了確認

```
GitHub API で以下のファイルが存在するか確認:
{WORK_DIR}/PIR_{SYSTEM_NAME}.md
```

| チェック項目 | 確認方法 | 結果 |
|-------------|---------|:----:|
| PIR_{SYSTEM_NAME}.md が存在する | GitHub API | ⬜ |
| PIR_{SYSTEM_NAME}.md の内容が空でない | ファイルサイズ > 0 | ⬜ |
| Action Items Summary が記載されている | ファイル内容確認 | ⬜ |
| Overall Judgment が記載されている | ファイル内容確認 | ⬜ |

```
✅ 全て満たす → STEP 0へ進む
❌ 満たさない → エラー: 「10_design_pir.md を先に実行してください」
```

### 必須: PIR判定の確認

PIR_{SYSTEM_NAME}.md の `Overall Judgment` を確認:

| 判定 | このフェーズの実行 |
|:----:|:------------------:|
| ✅ PASS | ❌ 不要（次システムへ進む） |
| ⚠️ CONDITIONAL | ✅ 実行 |
| ❌ FAIL | ✅ 実行 |

```
✅ PASS → エラー: 「PIR PASSのため修正不要。次システムへ進んでください」
⚠️ CONDITIONAL または ❌ FAIL → STEP 0へ進む
```

---

## 🔴 STEP 0: セッション変数の継承（必須）

### 0.1 前フェーズからの継承

PIR_{SYSTEM_NAME}.md の PIR Information セクションから変数を取得:

| 変数 | 取得元 | 値 |
|------|--------|-----|
| `{SYSTEM_ID}` | PIR.PIR Information.System ID | `___` |
| `{SYSTEM_NAME}` | PIR.PIR Information.Directory から抽出 | `___` |
| `{SYSTEM_FULL_NAME}` | PIR.PIR Information.System | `___` |

### 0.2 システム一覧（参照用）

| ID | SYSTEM_NAME | SYSTEM_FULL_NAME | ディレクトリ名 | 優先度 |
|----|-------------|------------------|----------------|:------:|
| 01 | consumer | Consumer App | system_01_consumer | P0 |
| 02 | token_hub | Token Hub | system_02_token_hub | P0 |
| 03 | governance | Governance | system_03_governance | P1 |
| 04 | prover | Prover Portal | system_04_prover | P0 |
| 05 | observer | Observer/Challenger | system_05_observer | P2 |
| 06 | explorer | Explorer | system_06_explorer | P1 |
| 07 | enterprise | Enterprise Admin | system_07_enterprise | P1 |
| 08 | qs_admin | QS Admin | system_08_qs_admin | P0 |

### 0.3 作業ディレクトリ（自動解決）

```
{WORK_DIR} = docs_new/01_phase/04_phase4/01_design/system_{SYSTEM_ID}_{SYSTEM_NAME}/
```

---

## 1. 憲法の読み込み（必須）

`docs_new/00_core/CORE_PRINCIPLES.md`

---

## 2. PIRレポートの読み込み（必須）

```
{WORK_DIR}/PIR_{SYSTEM_NAME}.md
```

**必須確認項目**:
- `Action Items Summary` から修正対象を特定
- 各指摘の `ファイル` と `行` を確認
- `修正案` を確認

---

## 3. Design Manifestの読み込み（必須）

```
{WORK_DIR}/DESIGN_MANIFEST.md
```

ファイルパスの確認に使用します。

---

## 4. 作業ディレクトリ確認

```
{WORK_DIR}/
├── DESIGN_MANIFEST.md           # ファイル一覧（更新対象）
├── PIR_{SYSTEM_NAME}.md         # PIRレポート（修正指示）
│
└── wip/
    └── mocks/                   # ← 修正対象ファイル
        ├── 01_landing.html
        ├── 02_onboarding.html
        ├── 03_dashboard.html
        └── ...
```

---

## 5. 修正プロセス

### 5.1 修正対象の特定

PIRレポートの `Action Items Summary` を確認:

```markdown
| # | 重要度 | ファイル | 行 | 指摘 | 修正案 |
|---|--------|----------|-----|------|--------|
| 1 | High | `wip/mocks/03_dashboard.html` | L142 | CTAボタンが目立たない | box-shadow追加 |
| 2 | High | `wip/mocks/01_landing.html` | L200 | 免責表示が不足 | フッター追加 |
```

### 5.2 ファイル取得

GitHubから対象ファイルを取得:

```
github:get_file_contents
  owner: kota1026
  repo: quantum-shield
  branch: dev/phase2-native-stark
  path: {WORK_DIR}/wip/mocks/[ファイル名]
```

### 5.3 修正実行

各指摘事項について:

1. **ファイル取得**: GitHubからファイルを取得
2. **該当行を特定**: PIRレポートの行番号を参照
3. **修正実施**: 指摘内容に従って修正
4. **修正確認**: 修正が正しく反映されたか確認

### 5.4 Gitプッシュ（必須）

修正後のファイルを**必ず**Gitにプッシュ:

```
github:create_or_update_file
  branch: dev/phase2-native-stark
  owner: kota1026
  repo: quantum-shield
  path: {WORK_DIR}/wip/mocks/[ファイル名]
  sha: [取得時のsha]
  content: [修正後の内容]
  message: "fix({SYSTEM_NAME}): [PIR指摘#N] 指摘内容の要約"
```

**コミットメッセージ規則**:
```
fix({SYSTEM_NAME}): [PIR指摘#N] 指摘内容の要約

例:
fix(consumer): [PIR指摘#1] CTAボタンのbox-shadow追加
fix(consumer): [PIR指摘#2] フッターに免責表示追加
```

---

## 6. 修正チェックリスト

### 6.1 各修正項目の確認

| # | ファイル | 行 | 指摘 | 修正完了 | Gitプッシュ |
|---|----------|-----|------|:--------:|:-----------:|
| 1 | `wip/mocks/03_dashboard.html` | L142 | CTAボタン | ⬜ | ⬜ |
| 2 | `wip/mocks/01_landing.html` | L200 | 免責表示 | ⬜ | ⬜ |

### 6.2 全体確認

- [ ] 全てのHigh/Critical指摘が修正された
- [ ] 全ての修正ファイルがGitにプッシュされた
- [ ] DESIGN_MANIFEST.md の `Last Updated` を更新した
- [ ] DESIGN_MANIFEST.md の `Change Log` に修正履歴を追記した

---

## 7. 出力

### 7.1 修正完了レポート

PIRレポートに修正結果を追記（推奨）または別途作成:

```markdown
## Fix Report

### Date
[YYYY-MM-DD]

### Fixed Items
| # | ファイル | 行 | 指摘 | 修正内容 | Commit |
|---|----------|-----|------|----------|--------|
| 1 | `wip/mocks/03_dashboard.html` | L142 | CTAボタン | box-shadow追加 | abc1234 |
| 2 | `wip/mocks/01_landing.html` | L200 | 免責表示 | フッター追加 | def5678 |

### Verification
- [x] 全修正がGitにプッシュされた
- [x] DESIGN_MANIFEST.md が更新された
```

### 7.2 DESIGN_MANIFEST.md の更新（必須）

Change Logに修正履歴を追記:

```markdown
## Change Log
| Date | Version | Changes |
|------|---------|---------|
| YYYY-MM-DD | 1.0 | 初版作成 |
| YYYY-MM-DD | 1.1 | PIR指摘対応（#1, #2） |
```

---

## 8. 状態更新（必須）

### 8.1 UI_PROGRESS_TRACKER.md の更新

```markdown
## Active Session State

| 項目 | 値 |
|------|-----|
| Current System | `{SYSTEM_ID}_{SYSTEM_NAME}` |
| Current Phase | `11_design_fix` → [次フェーズ] |
| DESIGN_BRIEF | ✅ Created |
| DESIGN_MANIFEST | ✅ Updated (v1.1) |
| Mocks Pushed | ✅ [N] files (修正済み) |
| PIR Report | ✅ Created |
| PIR Judgment | [元の判定] |
| Fix Status | ✅ All items fixed |

### Last Completed Action
- Date: [YYYY-MM-DD]
- Action: 11_design_fix completed
- Fixed Items: [N] items
- Next: [再PIR or 次システム]
```

---

## 9. 次のステップ

### 9.1 判定別アクション

| PIR判定 | 修正後のアクション |
|---------|-------------------|
| ⚠️ CONDITIONAL | 修正完了 → 自動承認 → `UI_PROGRESS_TRACKER.md` 更新 → 次システムへ |
| ❌ FAIL | 修正完了 → 再PIR（`10_design_pir.md`） |

### 9.2 再PIRが必要な場合（❌ FAIL）

Critical/High指摘があった場合は、修正後に再度 `10_design_pir.md` を実行:

1. 修正完了
2. `10_design_pir.md` で再レビュー
3. PASS になるまで繰り返し

### 9.3 承認後（✅ PASS または ⚠️ CONDITIONAL 修正完了）

1. `UI_PROGRESS_TRACKER.md` のシステム別進捗を「🟢 Design PIR PASS」に更新
2. Active Session State をリセット
3. 次のシステムに進む（`08_design_prep.md`）

---

## 10. トラブルシューティング

### Q: ファイルが見つからない
A: `DESIGN_MANIFEST.md` のパスを確認。`wip/mocks/` 配下にあるはず。

### Q: 行番号がずれている
A: 前の修正で行数が変わった可能性。コンテキストで該当箇所を特定。

### Q: 修正案が不明確
A: PIRレポートの指摘詳細を確認。不明な場合は `10_design_pir.md` を再実行して明確化。

### Q: 修正後に新たな問題が発生
A: 新たな問題は次回PIRで対応。現在のPIR指摘を優先して完了させる。

---

## 11. 修正の品質チェック

修正完了後、以下を自己確認:

| チェック項目 | 確認 |
|-------------|:----:|
| 修正が指摘内容に対応している | ⬜ |
| 修正によって新たなデッドエンドが発生していない | ⬜ |
| 修正によってデザインシステムから逸脱していない | ⬜ |
| 修正によってレスポンシブが壊れていない | ⬜ |
| 全ての修正ファイルにコミットメッセージが適切 | ⬜ |
