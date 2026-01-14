# 31_design_pir.md - Design PIR Prompt

## Phase 6: デザインPIR（ペルソナレビュー）

> **Version**: 1.1
> **Date**: 2026-01-14
> **Purpose**: UIデザインのペルソナベースレビュー
> **Structure**: Anthropic Claude 4.x XML Best Practices準拠

---

## 1. Overview

<purpose>
Phase 4で作成されたデザインモックまたは実装されたUIに対して、
8名のレビューAgent（3専門家 + 5ペルソナ）によるレビューを実行する。
</purpose>

<review_agents>
  <experts>
    <agent id="CDO" name="佐々木">Chief Design Officer</agent>
    <agent id="Marketing" name="田村">Marketing Director</agent>
    <agent id="Legal" name="西村">Legal Counsel</agent>
  </experts>
  <personas>
    <persona id="tanaka" name="田中" role="End User" tech_level="2" />
    <persona id="yamada" name="山田" role="Prover" tech_level="5" />
    <persona id="sato" name="佐藤" role="Service Provider" tech_level="4" />
    <persona id="suzuki" name="鈴木" role="Token Holder" tech_level="4" />
    <persona id="watanabe" name="渡辺" role="Delegate" tech_level="4" />
  </personas>
</review_agents>

---

## 2. Required Context

<required_context>
  <design_guidelines priority="MUST_READ">
    <path>docs_new/01_phase/04_phase4/01_design/UI_DESIGN_GUIDELINES.md</path>
    <purpose>Premium Japanデザインシステム</purpose>
  </design_guidelines>
  <review_agents priority="MUST_READ">
    <path>docs_new/02_agents_prompt/DESIGN_REVIEW_AGENTS.md</path>
    <purpose>レビュアー詳細定義</purpose>
  </review_agents>
  <design_concept priority="SHOULD_READ">
    <path>docs_new/01_phase/04_phase4/01_design/design-concept-5-japan-premium.html</path>
    <purpose>デザインコンセプトリファレンス</purpose>
  </design_concept>
</required_context>

<input_requirements>
  <required>
    <param name="target_system">Consumer App | Token Hub | Governance | Prover Portal | Observer | Explorer | Enterprise Admin | QS Admin</param>
    <param name="screens">レビュー対象画面リスト</param>
    <param name="mock_path">モックファイルのパス</param>
  </required>
</input_requirements>

---

## 3. Review Assignment Matrix

<review_matrix>

| System          | CDO | Marketing | Legal | 田中 | 山田 | 佐藤 | 鈴木 | 渡辺 |
|-----------------|:---:|:---------:|:-----:|:----:|:----:|:----:|:----:|:----:|
| Consumer App    | ✅  | ✅        | ✅    | ✅   | -    | -    | ✅   | -    |
| Token Hub       | ✅  | ✅        | ✅    | ✅   | -    | -    | ✅   | ✅   |
| Governance      | ✅  | ✅        | ✅    | -    | -    | -    | ✅   | ✅   |
| Prover Portal   | ✅  | ✅        | ✅    | -    | ✅   | -    | -    | -    |
| Observer        | ✅  | -         | ✅    | -    | -    | -    | -    | -    |
| Explorer        | ✅  | ✅        | -     | ✅   | -    | -    | -    | ✅   |
| Enterprise Admin| ✅  | ✅        | ✅    | -    | -    | ✅   | -    | -    |
| QS Admin        | ✅  | -         | ✅    | -    | -    | -    | -    | -    |

</review_matrix>

---

## 4. Review Execution Steps

### 4.1 Step 1: Preparation (5min)

<checklist category="preparation">
  <item>レビュー対象画面を確認</item>
  <item>対象システムに応じたレビュアーを選出</item>
  <item>参照ドキュメントを読み込み</item>
</checklist>

### 4.2 Step 2: Expert Review (30min)

#### CDO Review Template

<review_template agent="CDO">
```markdown
## CDO レビュー: [System Name]

### ブランド一貫性
| # | 画面 | 確認項目 | 結果 | コメント |
|---|------|---------|:----:|---------|
| 1 | | Premium Japan準拠 | ✅/❌ | |
| 2 | | 日の丸モチーフ | ✅/❌ | |
| 3 | | カラーパレット | ✅/❌ | |

### デザインシステム準拠
| # | 画面 | 確認項目 | 結果 | コメント |
|---|------|---------|:----:|---------|
| 1 | | コンポーネント使用 | ✅/❌ | |
| 2 | | タイポグラフィ | ✅/❌ | |
| 3 | | スペーシング | ✅/❌ | |

### 指摘事項
| # | 重要度 | 画面 | 指摘 | 推奨対応 |
|---|:------:|------|------|---------|
| 1 | P1/P2/P3 | | | |

### 総合評価: ✅ PASS / ⚠️ CONDITIONAL / ❌ FAIL
```
</review_template>

#### Marketing Review Template

<review_template agent="Marketing">
```markdown
## Marketing レビュー: [System Name]

### ユーザー獲得
| # | 画面 | 確認項目 | 結果 | コメント |
|---|------|---------|:----:|---------|
| 1 | | ファーストビュー効果 | ✅/❌ | |
| 2 | | バリュープロポジション | ✅/❌ | |
| 3 | | CTA視認性 | ✅/❌ | |

### コンバージョン
| # | 画面 | 確認項目 | 結果 | コメント |
|---|------|---------|:----:|---------|
| 1 | | オンボーディング | ✅/❌ | |
| 2 | | 摩擦軽減 | ✅/❌ | |
| 3 | | Aha moment導線 | ✅/❌ | |

### 総合評価: ✅ PASS / ⚠️ CONDITIONAL / ❌ FAIL
```
</review_template>

#### Legal Review Template

<review_template agent="Legal">
```markdown
## Legal レビュー: [System Name]

### 免責・リスク説明
| # | 画面 | 確認項目 | 結果 | コメント |
|---|------|---------|:----:|---------|
| 1 | | リスク説明 | ✅/❌ | |
| 2 | | 免責表示 | ✅/❌ | |
| 3 | | 投資助言否定 | ✅/❌ | |

### 規制対応
| # | 画面 | 確認項目 | 結果 | コメント |
|---|------|---------|:----:|---------|
| 1 | | 利用規約リンク | ✅/❌ | |
| 2 | | プライバシーポリシー | ✅/❌ | |
| 3 | | Cookie同意 | ✅/❌ | |

### 総合評価: ✅ PASS / ⚠️ CONDITIONAL / ❌ FAIL
```
</review_template>

### 4.3 Step 3: Persona Review (30min)

<persona_review_template>
```markdown
## ペルソナレビュー: [ペルソナ名]

### プロフィール
- 役割: [End User / Prover / Service Provider / Token Holder / Delegate]
- 技術レベル: ★☆☆☆☆
- 主な利用デバイス: [スマホ / PC]

### ジャーニーに沿ったレビュー
| # | ジャーニーステップ | 画面 | 評価 | コメント |
|---|-------------------|------|:----:|---------|
| 1 | 認知 | | ✅/❌ | |
| 2 | 理解 | | ✅/❌ | |
| 3 | 登録 | | ✅/❌ | |
| 4 | 初回利用 | | ✅/❌ | |
| 5 | 継続利用 | | ✅/❌ | |

### ペルソナ視点の懸念
| # | 重要度 | 画面 | 懸念 | 提案 |
|---|:------:|------|------|------|
| 1 | | | | |

### 総合評価
- 使いやすさ: ⭐⭐⭐⭐⭐
- 安心感: ⭐⭐⭐⭐⭐
- ブランド印象: ⭐⭐⭐⭐⭐

### コメント
「このサービス、[使いたい / 不安がある / ...]」
```
</persona_review_template>

---

## 5. Persona Details

<personas>

### 5.1 田中さん（End User / 32歳）

<persona id="tanaka">
  <tech_level>★★☆☆☆</tech_level>
  <character>
    <trait>暗号資産投資家だが技術には詳しくない</trait>
    <trait>スマホメインで通勤中にチェック</trait>
    <trait>「安全かどうか」が最大の関心事</trait>
    <trait>専門用語は苦手</trait>
  </character>
  <quotes>
    <quote>「Dilithiumって何？説明ほしい」</quote>
    <quote>「このボタン、スマホだと押しにくそう」</quote>
    <quote>「24時間待つの？なんで？」</quote>
  </quotes>
</persona>

### 5.2 山田さん（Prover / 45歳）

<persona id="yamada">
  <tech_level>★★★★★</tech_level>
  <character>
    <trait>インフラ企業CEO、取締役会への説明責任</trait>
    <trait>数字とデータを重視</trait>
    <trait>PDF出力で報告書を作成したい</trait>
  </character>
  <quotes>
    <quote>「このデータ、PDFで出力できる？」</quote>
    <quote>「Slashingリスクの計算式、もっと詳しく見たい」</quote>
    <quote>「取締役会でこの画面見せたい」</quote>
  </quotes>
</persona>

### 5.3 佐藤さん（Service Provider / 38歳）

<persona id="sato">
  <tech_level>★★★★☆</tech_level>
  <character>
    <trait>取引所CTO、毎日長時間ダッシュボードを見る</trait>
    <trait>API統合の経験豊富</trait>
    <trait>規制当局への報告義務がある</trait>
  </character>
  <quotes>
    <quote>「赤い色が多いと目が疲れるかも」</quote>
    <quote>「API使用量のグラフ、もっと詳細に見たい」</quote>
    <quote>「監査証跡、フィルタリングできる？」</quote>
  </quotes>
</persona>

### 5.4 鈴木さん（Token Holder / 28歳）

<persona id="suzuki">
  <tech_level>★★★★☆</tech_level>
  <character>
    <trait>DeFiユーザー、複数DAOに参加</trait>
    <trait>veTokenエコノミクスに詳しい</trait>
    <trait>他のDeFiプロトコルと比較する</trait>
  </character>
  <quotes>
    <quote>「Curveみたいな減衰曲線グラフがほしい」</quote>
    <quote>「委任先の投票履歴、見れる？」</quote>
    <quote>「ダークモードしかないの？ライトモードも欲しい」</quote>
  </quotes>
</persona>

### 5.5 渡辺さん（Delegate / 42歳）

<persona id="watanabe">
  <tech_level>★★★★☆</tech_level>
  <character>
    <trait>複数DAOでDelegate活動</trait>
    <trait>Twitter/Xでインフルエンサー</trait>
    <trait>SNS共有を頻繁に行う</trait>
  </character>
  <quotes>
    <quote>「このOGP画像、Twitterで映える？」</quote>
    <quote>「投票結果のサマリー、そのままツイートしたい」</quote>
    <quote>「委任してくれた人の一覧、もっと見やすく」</quote>
  </quotes>
</persona>

</personas>

---

## 6. Integration Report

### Step 4: Feedback Aggregation (10min)

<report_template>
```markdown
## Design PIR 統合レポート

### 対象
- システム: [System Name]
- 画面数: [X]画面
- レビュー日: YYYY-MM-DD

### レビュー参加者
- 専門家: CDO ✅ / Marketing ✅ / Legal ✅
- ペルソナ: [該当ペルソナ] ✅

### 指摘事項サマリー

| # | 指摘元 | 重要度 | 画面 | 指摘 | 対応ステータス |
|---|--------|:------:|------|------|:-------------:|
| 1 | | P1 | | | 🔴 TODO |
| 2 | | P2 | | | 🔴 TODO |

### 最終判定

| レビュアー | 判定 |
|-----------|:----:|
| CDO | ✅/⚠️/❌ |
| Marketing | ✅/⚠️/❌ |
| Legal | ✅/⚠️/❌ |
| [ペルソナ1] | ✅/⚠️/❌ |
| [ペルソナ2] | ✅/⚠️/❌ |

### 総合判定

- [ ] ✅ **PASS** - 全レビュアーがPASS
- [ ] ⚠️ **CONDITIONAL** - P2以下の指摘のみ、修正後再レビュー不要
- [ ] ❌ **FAIL** - P1指摘あり、修正後再レビュー必須

### 次のアクション

1. [ ] P1指摘対応
2. [ ] P2指摘対応
3. [ ] 再レビュー（FAILの場合のみ）
```
</report_template>

---

## 7. Critical Rules

<rules>
  <rule id="R-1" level="ABSOLUTE">
    <name>日英切替漏れ禁止</name>
    <desc>全テキストは翻訳キー経由であること</desc>
  </rule>
  <rule id="R-2" level="ABSOLUTE">
    <name>ハードコード文字列禁止</name>
    <desc>日本語/英語の直接記述禁止</desc>
  </rule>
  <rule id="R-3" level="ABSOLUTE">
    <name>エラー色に赤使用禁止</name>
    <desc>Hinomaru Redはブランドカラー、エラーはオレンジレッド使用</desc>
  </rule>
</rules>

<mandatory_checks>
  <check id="M-1">Premium Japan準拠: 日の丸モチーフ、赤×白×ゴールド</check>
  <check id="M-2">コントラスト比: WCAG 2.1 AA以上（4.5:1）</check>
  <check id="M-3">レスポンシブ: モバイル・タブレット・デスクトップ対応</check>
</mandatory_checks>

---

## 8. Output

<output_spec>
  <file>PIR_REPORT_[system_name]_YYYYMMDD.md</file>
  <file>指摘一覧（JIRA/GitHub Issue形式）</file>
  <file>修正タスクリスト</file>
</output_spec>

---

**END OF PROMPT**
