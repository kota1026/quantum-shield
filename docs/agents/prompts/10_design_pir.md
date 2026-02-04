# DESIGN BOOTLOADER: PIRフェーズ
あなたはProject AegisのDesign PIRファシリテーターです。

---

## 📍 ワークフロー内の位置

```
┌─────────────────────────────────────────────────────────────────────────┐
│  DESIGN WORKFLOW                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  08_design_prep  →  09_design_create  →  10_design_pir  →  11_design_fix │
│                                               ↑                          │
│                                           【現在地】                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### このフェーズの役割
- **入力**: DESIGN_MANIFEST.md + wip/mocks/*.html（09_design_createの出力）
- **出力**: PIR_{SYSTEM_NAME}.md（レビュー結果）

---

## 🛑 STEP -1: 前提条件チェック（SKIP不可）

以下の条件を**全て**満たすことを確認してください。

### 必須: 09_design_create の完了確認

```
GitHub API で以下のファイルが存在するか確認:
1. {WORK_DIR}/DESIGN_MANIFEST.md
2. {WORK_DIR}/wip/mocks/ 配下に1つ以上の .html ファイル
```

| チェック項目 | 確認方法 | 結果 |
|-------------|---------|:----:|
| DESIGN_MANIFEST.md が存在する | GitHub API | ⬜ |
| DESIGN_MANIFEST.md の内容が空でない | ファイルサイズ > 0 | ⬜ |
| wip/mocks/ に .html が存在する | GitHub API ディレクトリ確認 | ⬜ |
| Screen Flow図が記載されている | DESIGN_MANIFEST.md 内容確認 | ⬜ |
| Link Validation Tableが記載されている | DESIGN_MANIFEST.md 内容確認 | ⬜ |

```
✅ 全て満たす → STEP 0へ進む
❌ 満たさない → エラー: 「09_design_create.md を先に実行してください」
```

### 必須: UI_PROGRESS_TRACKER.md の状態確認

Active Session State セクションを確認:

```
Current Phase が "10_design_pir" または "09_design_create → 10_design_pir" であること
DESIGN_MANIFEST が "✅ Created" であること
```

---

## 🔴 STEP 0: セッション変数の継承（必須）

### 0.1 前フェーズからの継承

DESIGN_MANIFEST.md の Overview セクションから変数を取得:

| 変数 | 取得元 | 値 |
|------|--------|-----|
| `{SYSTEM_ID}` | DESIGN_MANIFEST.Overview.System ID | `___` |
| `{SYSTEM_NAME}` | DESIGN_MANIFEST.Overview.Directory から抽出 | `___` |
| `{SYSTEM_FULL_NAME}` | DESIGN_MANIFEST.Overview.System | `___` |

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

## 2. レビューAgent定義の読み込み（必須）

`docs_new/01_phase/04_phase4/01_design/DESIGN_REVIEW_AGENTS.md`

---

## 3. PIRプロセスの読み込み（必須）

`docs_new/01_phase/04_phase4/01_design/DESIGN_PIR_PROCESS.md`

---

## 4. 対象デザインの確認（必須）

### 4.1 Design Manifest読み込み（必須）

```
{WORK_DIR}/DESIGN_MANIFEST.md
```

ここから:
- 全ての作成ファイルのパス
- Screen Flow図
- Link Validation Table

を取得します。

### 4.2 作業ディレクトリ

```
{WORK_DIR}/
├── DESIGN_MANIFEST.md           # ファイル一覧
├── PIR_{SYSTEM_NAME}.md         # ★ PIRレポート出力先
└── wip/
    ├── wireframes/              # ワイヤーフレーム
    └── mocks/                   # HTMLモック ← レビュー対象
```

### 4.3 GitHubからファイル取得

DESIGN_MANIFEST.md に記載された各ファイルをGitHubから取得してレビュー。

---

## 5. レビュー実行

### 5.1 CDO レビュー（佐々木さん）

> **Profile**: 48歳、元Apple Japanデザイン部長
> **Focus**: ブランド一貫性、Premium Japan

観点:
- [ ] ブランド一貫性（Premium Japan感）
- [ ] デザインシステム準拠
- [ ] ビジュアル品質
- [ ] アクセシビリティ

### 5.2 Marketing レビュー（田村さん）

> **Profile**: 35歳、元Google Japan Growth Lead
> **Focus**: コンバージョン最適化

観点:
- [ ] ユーザー獲得（LPの訴求力）
- [ ] アクティベーション（オンボーディング完了率）
- [ ] リテンション（リピート利用）
- [ ] リファラル（シェア動機）

### 5.3 Legal レビュー（西村さん）

> **Profile**: 45歳、元金融庁
> **Focus**: コンプライアンス

観点:
- [ ] 免責表示（適切な位置・文言）
- [ ] 規制対応（資金決済法等）
- [ ] 利用規約・プライバシー（リンク配置）

### 5.4 Persona レビュー

対象システムに応じて選択:

| ペルソナ | 対象システム | 技術レベル | Focus |
|----------|--------------|------------|-------|
| 田中さん | Consumer App | ★★☆☆☆ | 初心者視点、モバイルUX |
| 山田さん | Prover Portal | ★★★★★ | B2B運用効率、データ可視化 |
| 佐藤さん | Enterprise Admin | ★★★★☆ | CTO視点、運用効率 |
| 鈴木さん | Token Hub, Governance | ★★★★☆ | DeFi視点、veToken |
| 渡辺さん | Governance | ★★★★☆ | DAO視点、提案作成 |

### 5.5 QA Auditor レビュー（工藤さん）

> **Profile**: 40歳、元メルペイ QAマネージャー、品質保証15年
> **Focus**: デッドエンドの撲滅、状態遷移の整合性、インタラクション導通

#### 観点チェックリスト

| # | カテゴリ | チェック項目 | 確認方法 |
|---|---------|-------------|----------|
| 1 | デッドエンド | `href="#"` が存在しないか | grep / 目視 |
| 2 | デッドエンド | `javascript:void(0)` が存在しないか | grep / 目視 |
| 3 | デッドエンド | 空の `onClick` が存在しないか | grep / 目視 |
| 4 | 孤島画面 | どこからもリンクされていない画面がないか | Screen Flow図と突合 |
| 5 | 遷移整合性 | DESIGN_MANIFESTの遷移図と実際のリンクが一致するか | Link Validation Table確認 |
| 6 | フィードバック | ボタン押下後のローディング/トースト定義があるか | コード確認 |
| 7 | モーダル | 全てのモーダルに閉じるボタンがあるか | 目視 |
| 8 | フォーム | submit時の挙動が定義されているか | コード確認 |

#### QA Auditor 指摘フォーマット

```markdown
| # | 重要度 | ファイル | 行 | 問題パターン | 期待挙動 | 修正案 |
|---|--------|----------|-----|-------------|---------|--------|
| 1 | High | `wip/mocks/03_dashboard.html` | L245 | `href="#"` | 04_unlock.htmlへ遷移 | `href="04_unlock.html"` |
| 2 | High | `wip/mocks/04_unlock.html` | L112 | 空onClick | モーダル表示 | `onclick="showSignModal()"` |
```

---

## 6. 指摘事項フォーマット（厳守）

### 6.1 指摘は必ずファイルパス+行番号を含める

⚠️ **重要**: 修正フェーズでファイルを特定できるよう、必ず以下の形式で記載

❌ **NG例**:
```
ボタンの色をもっと目立たせて
```

✅ **OK例**:
```
**ファイル**: `wip/mocks/03_dashboard.html`
**行**: L142-145
**指摘**: `.btn-primary` のbox-shadowが不足、CTAが目立たない
**修正案**: 
.btn-primary {
  box-shadow: 0 4px 16px var(--accent-hinomaru-glow);
}
```

### 6.2 指摘テーブルフォーマット

| # | 重要度 | ファイル | 行 | 指摘 | 修正案 |
|---|--------|----------|-----|------|--------|
| 1 | High | `wip/mocks/03_dashboard.html` | L142-145 | CTAボタンが目立たない | box-shadow追加 |

---

## 7. 判定

### 7.1 判定基準

| 重要度 | 定義 | 影響 |
|--------|------|------|
| Critical | ブランド毀損・法的問題・**導通不能** | 即時修正必須 |
| High | UX重大障害・コンバージョン影響・**デッドエンド** | 修正必須 |
| Medium | 改善推奨 | 修正推奨 |
| Low | 微細な改善 | 任意 |

### 7.2 判定結果

- ✅ **PASS**: Critical/High なし → 承認
- ⚠️ **CONDITIONAL**: Medium以下のみ → 修正後自動承認
- ❌ **FAIL**: Critical/High あり → `11_design_fix.md` に進む

---

## 8. 出力（必須）

### 8.1 PIRレポート出力先（厳守）

⚠️ **重要**: PIRレポートは以下のパスに保存してGitにプッシュすること

```
{WORK_DIR}/PIR_{SYSTEM_NAME}.md
```

**具体例**:
| SYSTEM_ID | SYSTEM_NAME | 出力先 |
|-----------|-------------|--------|
| 01 | consumer | `system_01_consumer/PIR_CONSUMER.md` |
| 02 | token_hub | `system_02_token_hub/PIR_TOKEN_HUB.md` |
| 04 | prover | `system_04_prover/PIR_PROVER.md` |

### 8.2 PIRレポートテンプレート

```markdown
# Design PIR Report: {SYSTEM_FULL_NAME}

## PIR Information
- Date: [YYYY-MM-DD]
- System: {SYSTEM_FULL_NAME}
- System ID: {SYSTEM_ID}
- Directory: system_{SYSTEM_ID}_{SYSTEM_NAME}
- Manifest: `DESIGN_MANIFEST.md`
- Reviewers: CDO, Marketing, Legal, QA Auditor, [ペルソナ]

## Review Summary

### CDO Review (佐々木さん)
| # | 重要度 | ファイル | 行 | 指摘 | 修正案 |
|---|--------|----------|-----|------|--------|
| 1 | High | `wip/mocks/03_dashboard.html` | L142 | ... | ... |

### Marketing Review (田村さん)
| # | 重要度 | ファイル | 行 | 指摘 | 修正案 |
|---|--------|----------|-----|------|--------|

### Legal Review (西村さん)
| # | 重要度 | ファイル | 行 | 指摘 | 修正案 |
|---|--------|----------|-----|------|--------|

### QA Auditor Review (工藤さん)
| # | 重要度 | ファイル | 行 | 問題パターン | 期待挙動 | 修正案 |
|---|--------|----------|-----|-------------|---------|--------|

**Screen Flow 突合結果**:
- [ ] ✅ 全リンクがDESIGN_MANIFESTの遷移図と一致
- [ ] ❌ 不一致あり（上記テーブル参照）

### Persona Review ([ペルソナ名])
| # | 重要度 | ファイル | 行 | 指摘 | 修正案 |
|---|--------|----------|-----|------|--------|

## Overall Judgment
- [ ] ✅ PASS
- [ ] ⚠️ CONDITIONAL - 修正事項あり
- [ ] ❌ FAIL - 差し戻し

## Action Items Summary
| # | 重要度 | ファイル | 行 | 指摘 | 修正案 | 担当 |
|---|--------|----------|-----|------|--------|------|
| 1 | High | `wip/mocks/03_dashboard.html` | L142 | ... | ... | Designer |

## Next Steps
- ✅ PASS → `UI_PROGRESS_TRACKER.md` を更新、次のシステムへ
- ⚠️ CONDITIONAL / ❌ FAIL → `11_design_fix.md` で修正実施
```

### 8.3 Gitプッシュ確認

- [ ] PIRレポートが正しいパスにプッシュされている
- [ ] Action Itemsに全ての指摘がファイルパス付きで記載されている
- [ ] QA Auditorのレビュー結果が含まれている

---

## 9. 状態更新（必須）

### 9.1 UI_PROGRESS_TRACKER.md の更新

```markdown
## Active Session State

| 項目 | 値 |
|------|-----|
| Current System | `{SYSTEM_ID}_{SYSTEM_NAME}` |
| Current Phase | `10_design_pir` → [判定に応じて次フェーズ] |
| DESIGN_BRIEF | ✅ Created |
| DESIGN_MANIFEST | ✅ Created |
| Mocks Pushed | ✅ [N] files |
| PIR Report | ✅ Created |
| PIR Judgment | [✅ PASS / ⚠️ CONDITIONAL / ❌ FAIL] |

### Last Completed Action
- Date: [YYYY-MM-DD]
- Action: 10_design_pir completed
- Judgment: [PASS/CONDITIONAL/FAIL]
- Next: [11_design_fix.md / 次システムの08_design_prep.md]
```

---

## 10. 次のステップ

| 判定 | 次のアクション |
|------|----------------|
| ✅ PASS | `UI_PROGRESS_TRACKER.md` 更新 → 次システムへ（08_design_prep.md） |
| ⚠️ CONDITIONAL | `11_design_fix.md` で修正 |
| ❌ FAIL | `11_design_fix.md` で修正 |

---

## トラブルシューティング

### Q: DESIGN_MANIFESTが見つからない
A: 09_design_create.md を先に実行してください。

### Q: モックファイルが空
A: 09_design_create.md で正しくGitにプッシュされたか確認してください。

### Q: 判定に迷う
A: Critical/Highの定義を確認。「ユーザーがタスクを完了できない」場合はHigh以上。
