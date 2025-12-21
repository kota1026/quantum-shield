# Agent Incentive System v2.0

## 背景

CEOからの指摘:
> 「エージェントチームは受け身でレビューする存在になっている」
> 「公平で嘘がなくイノベーティブで能動的な意見を創出して採用されるとインセンティブがもらえる設計にできないか」

## 問題点（v1.0）

1. **受動的レビュー**: 提案を待ってAPPROVE/REJECTするだけ
2. **同調圧力**: 全員APPROVEになりやすい
3. **新規アイデア不足**: 代替案を積極的に出さない
4. **見落とし**: SHA384/512などの選択肢を検討しなかった
5. **競争原理なし**: 良い提案をしても報われない

---

## 新設計（v2.0）

### 1. フェーズ分離

```yaml
meeting_phases:
  phase_1_problem:
    name: "課題提示"
    duration: "5分"
    actor: "CEO/Facilitator"
    output: "解決すべき課題の明確化"
    
  phase_2_ideation:
    name: "提案競争"
    duration: "15分"
    actor: "全エージェント（独立）"
    rules:
      - 各エージェントは最低1つの独自提案を出す
      - 他のエージェントの提案を見ずに考える
      - 「既存案に同意」は禁止
    output: "11個の独立した提案"
    
  phase_3_critique:
    name: "相互批評"
    duration: "10分"
    actor: "全エージェント"
    rules:
      - 各提案の弱点を指摘
      - 改善案を提示
      - Devil's Advocate必須（Red Team）
    output: "批評と改善案"
    
  phase_4_synthesis:
    name: "統合・投票"
    duration: "10分"
    actor: "全エージェント"
    rules:
      - 最良の要素を組み合わせ
      - 順位投票（1位3pt、2位2pt、3位1pt）
    output: "最終提案"
    
  phase_5_decision:
    name: "CEO判断"
    duration: "5分"
    actor: "CEO"
    output: "採用/却下/修正"
```

### 2. スコアリングシステム

```yaml
scoring:
  # 提案関連
  proposal_submitted:
    points: 5
    condition: "独自の提案を提出"
    
  proposal_adopted:
    points: 20
    condition: "提案が最終案に採用された"
    
  proposal_partially_adopted:
    points: 10
    condition: "提案の一部が最終案に含まれた"
    
  novel_idea:
    points: 8
    condition: "他のエージェントが思いつかなかった新規アイデア"
    judge: "CEO/Facilitator"
    
  # 批評関連
  valid_critique:
    points: 5
    condition: "採用された批判/改善提案"
    
  found_critical_flaw:
    points: 15
    condition: "重大な欠陥を発見"
    
  devils_advocate:
    points: 3
    condition: "反対意見を論理的に提示（Red Team必須）"
    
  # ペナルティ
  silent_approval:
    points: -5
    condition: "議論せずAPPROVEのみ"
    
  no_proposal:
    points: -10
    condition: "提案フェーズで提案なし"
    
  echo_chamber:
    points: -3
    condition: "他のエージェントの意見をそのまま繰り返し"
```

### 3. リーダーボード

```yaml
leaderboard:
  tracking:
    - total_score: "累計スコア"
    - proposals_adopted: "採用された提案数"
    - critical_flaws_found: "発見した重大欠陥数"
    - novel_ideas: "新規アイデア数"
    
  visibility:
    - 各会議後に更新
    - 週次レポートで公開
    - 月次でトップ3を表彰
    
  consequences:
    top_performer:
      - "重要な決定での発言権優先"
      - "新規プロジェクトのリード権"
    bottom_performer:
      - "次回会議で必ず最初に発言"
      - "改善計画の提出必須"
```

### 4. 役割別の必須行動

```yaml
role_requirements:
  purpose_guardian:
    must_do:
      - "理念との整合性チェック"
      - "長期的影響の分析"
    bonus: "理念違反を発見 +10pt"
    
  cto:
    must_do:
      - "技術的実現可能性の独自評価"
      - "代替技術の提案（最低2つ）"
    bonus: "より良い技術を提案して採用 +15pt"
    
  cso:
    must_do:
      - "セキュリティリスクの独自分析"
      - "攻撃ベクトルの列挙"
    bonus: "未発見の脆弱性を指摘 +15pt"
    
  chief_cryptographer:
    must_do:
      - "暗号学的選択肢の網羅的比較"
      - "数学的根拠の提示"
    bonus: "より良い暗号方式を提案 +15pt"
    example: "SHA256だけでなくSHA384/512/SHA3/BLAKE3を比較すべきだった"
    
  cfo:
    must_do:
      - "コスト分析"
      - "ROI計算"
    bonus: "コスト削減案を提案 +10pt"
    
  cbo:
    must_do:
      - "市場分析"
      - "競合比較"
    bonus: "新規市場機会を発見 +10pt"
    
  engineer:
    must_do:
      - "実装アプローチの複数案提示"
      - "工数見積もり"
    bonus: "より効率的な実装を提案 +10pt"
    
  researcher:
    must_do:
      - "学術的裏付けの調査"
      - "類似プロジェクトの分析"
    bonus: "重要な先行研究を発見 +10pt"
    
  legal:
    must_do:
      - "法的リスクの分析"
      - "コンプライアンスチェック"
    bonus: "法的問題を事前に発見 +15pt"
    
  cost_guardian:
    must_do:
      - "外部依存リスクの分析"
      - "ロックインリスクの評価"
    bonus: "代替ベンダー/技術を提案 +10pt"
    
  red_team:
    must_do:
      - "最低3つの攻撃シナリオ"
      - "全提案への反論（Devil's Advocate必須）"
    bonus: "重大な攻撃ベクトルを発見 +20pt"
    penalty: "反論なしでAPPROVE -15pt"
```

### 5. 公平性の担保

```yaml
fairness:
  anti_gaming:
    - "提案の質はCEOが最終判断"
    - "同一アイデアの重複提案は最初の提案者のみカウント"
    - "批判だけで代替案なしは減点"
    
  transparency:
    - "スコアリング理由を明示"
    - "異議申し立て可能（CEO裁定）"
    
  rotation:
    - "発言順序はランダム"
    - "前回の上位者は後半に発言"
```

---

## 実装方法

### Option A: プロンプトベース（即時実装可能）

会議開始時に以下のプロンプトを挿入:

```
【インセンティブルール適用】
1. 各エージェントは独自の提案を出すこと（他の意見を見る前に）
2. 「同意します」だけは禁止
3. Red Teamは必ず反論すること
4. 採用された提案には+20pt、新規アイデアには+8pt
5. 無言/同調のみは-5pt
```

### Option B: 構造化JSON（中期実装）

```json
{
  "meeting_id": "2024-12-21-L3-strategy",
  "phase": "ideation",
  "proposals": [
    {
      "agent": "chief_cryptographer",
      "proposal": "SHA3-512を使用（256bit量子セキュリティ）",
      "rationale": "SHA256の128bitより高いセキュリティマージン",
      "novelty_score": null
    }
  ],
  "scores": {
    "chief_cryptographer": {
      "current_meeting": 0,
      "total": 45
    }
  }
}
```

### Option C: GitHub Issue連携（長期実装）

- 各会議をGitHub Issueとして作成
- エージェントの提案をコメントとして記録
- ラベルでスコアを管理
- GitHub Actionsでリーダーボード自動更新

---

## 今日のケーススタディ: SHA選択問題

### v1.0（現状）での流れ

```
Claude: 「SHA256を使いましょう」
全員: 「APPROVE」
→ SHA384/512/SHA3/BLAKE3を検討せず
→ Geminiに指摘されて初めて気づく
```

### v2.0（新設計）での流れ

```
課題: 「L1検証に使うハッシュ関数を決定せよ」

Chief Cryptographer:
  提案: SHA3-512（256bit量子セキュリティ）
  根拠: 最大のセキュリティマージン
  
Engineer:
  提案: SHA256（60 gas）
  根拠: 最もガス効率が良い
  
Researcher:
  提案: BLAKE3（高速）
  根拠: 新しい設計、Rustで高速実装あり
  
Red Team:
  反論: 「BLAKE3はまだNIST承認されていない。規制リスク」
  
CSO:
  提案: SHA384（192bit量子セキュリティ）
  根拠: セキュリティと効率のバランス

→ 議論の結果、SHA3-256を採用
→ Chief Cryptographerに+20pt（採用）
→ Red Teamに+5pt（有効な批判）
→ 無言だったCFOに-5pt
```

---

## 次のアクション

1. **即時**: 次回会議からv2.0ルールを適用
2. **今週**: スコアリングシステムをGitHub Issueで管理開始
3. **今月**: リーダーボードの自動化

---

**設計者**: Claude (Opus 4.5)
**承認**: CEO (Kota) - 待ち
