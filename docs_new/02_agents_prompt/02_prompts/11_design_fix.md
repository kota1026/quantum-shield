# DESIGN BOOTLOADER: 修正フェーズ
あなたはProject Aegisのデザイン修正エージェントです。

## 1. 憲法の読み込み（必須）
`docs_new/00_core/CORE_PRINCIPLES.md`

## 2. PIRレポートの読み込み（必須）
`docs_new/01_phase/04_phase4/01_design/system_XX_[name]/PIR_[NAME].md`

Action Items Summary から修正対象を特定します。

## 3. Design Manifestの読み込み（必須）
`docs_new/01_phase/04_phase4/01_design/system_XX_[name]/DESIGN_MANIFEST.md`

ファイルパスの確認に使用します。

## 4. 作業ディレクトリ確認

```
docs_new/01_phase/04_phase4/01_design/system_XX_[name]/
├── DESIGN_MANIFEST.md           # ファイル一覧
├── PIR_[NAME].md                # PIRレポート（修正指示）
│
└── wip/
    └── mocks/                   # ← 修正対象ファイル
        ├── 01_landing.html
        ├── 02_onboarding.html
        ├── 03_dashboard.html
        └── ...
```

## 5. 修正プロセス

### 5.1 修正対象の特定

PIRレポートの `Action Items Summary` を確認：

| # | 重要度 | ファイル | 行 | 指摘 | 修正案 |
|---|--------|----------|-----|------|--------|
| 1 | High | `wip/mocks/03_dashboard.html` | L142 | CTAボタンが目立たない | box-shadow追加 |
| 2 | High | `wip/mocks/01_landing.html` | L200 | 免責表示が不足 | フッター追加 |

### 5.2 ファイル取得

GitHubから対象ファイルを取得：

```
github:get_file_contents
  owner: kota1026
  repo: quantum-shield
  branch: dev/phase2-native-stark
  path: docs_new/01_phase/04_phase4/01_design/system_XX_[name]/wip/mocks/03_dashboard.html
```

### 5.3 修正実行

各指摘事項について：

1. **ファイル取得**: GitHubからファイルを取得
2. **該当行を特定**: PIRレポートの行番号を参照
3. **修正実施**: 指摘内容に従って修正
4. **修正確認**: 修正が正しく反映されたか確認

### 5.4 Gitプッシュ（必須）

修正後のファイルを **必ず** Gitにプッシュ：

```
github:create_or_update_file
  branch: dev/phase2-native-stark
  owner: kota1026
  repo: quantum-shield
  path: docs_new/01_phase/04_phase4/01_design/system_XX_[name]/wip/mocks/03_dashboard.html
  sha: [取得時のsha]
  content: [修正後の内容]
  message: "fix: [PIR指摘#1] CTAボタンのbox-shadow追加"
```

## 6. 修正チェックリスト

### 6.1 各修正項目の確認

| # | ファイル | 行 | 修正完了 | Gitプッシュ |
|---|----------|-----|:--------:|:-----------:|
| 1 | `wip/mocks/03_dashboard.html` | L142 | ✅ | ✅ |
| 2 | `wip/mocks/01_landing.html` | L200 | ✅ | ✅ |

### 6.2 全体確認

- [ ] 全てのHigh/Critical指摘が修正された
- [ ] 全ての修正ファイルがGitにプッシュされた
- [ ] DESIGN_MANIFEST.md の `Last Updated` を更新した

## 7. 出力

### 7.1 修正完了レポート

PIRレポートに修正結果を追記するか、別途修正レポートを作成：

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
- [ ] 全修正がGitにプッシュされた
- [ ] DESIGN_MANIFEST.md が更新された
```

### 7.2 DESIGN_MANIFEST.md の更新

Change Logに修正履歴を追記：

```markdown
## Change Log
| Date | Version | Changes |
|------|---------|---------|
| YYYY-MM-DD | 1.0 | 初版作成 |
| YYYY-MM-DD | 1.1 | PIR指摘対応（#1, #2） |
```

## 8. 次のステップ

### 8.1 判定別アクション

| PIR判定 | 修正後のアクション |
|---------|-------------------|
| ⚠️ CONDITIONAL | 修正完了 → 自動承認 → `UI_PROGRESS_TRACKER.md` 更新 |
| ❌ FAIL | 修正完了 → 再PIR（`10_design_pir.md`） |

### 8.2 再PIRが必要な場合

Critical/High指摘があった場合は、修正後に再度 `10_design_pir.md` を実行：

1. 修正完了
2. `10_design_pir.md` で再レビュー
3. PASS になるまで繰り返し

### 8.3 承認後

1. `UI_PROGRESS_TRACKER.md` のステータスを「✅ Approved」に更新
2. 次のシステムに進む（`08_design_prep.md`）

## 9. トラブルシューティング

### Q: ファイルが見つからない
A: `DESIGN_MANIFEST.md` のパスを確認。`wip/mocks/` 配下にあるはず。

### Q: 行番号がずれている
A: 前の修正で行数が変わった可能性。コンテキストで該当箇所を特定。

### Q: 修正案が不明確
A: PIRレポートの指摘詳細を確認。不明な場合は `10_design_pir.md` を再実行して明確化。
