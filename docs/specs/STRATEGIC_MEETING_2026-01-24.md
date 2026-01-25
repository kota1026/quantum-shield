# 11体エージェント戦略会議記録

> **日時**: 2026-01-24
> **議題**: アプリ別詳細設計書（v1.1）の最終レビューと承認
> **参照**: [APP_DESIGN_SPECS.md](./APP_DESIGN_SPECS.md), [PERSONA_FEEDBACK.md](./PERSONA_FEEDBACK.md)
> **プロトコル**: AGENT_STRATEGIC_MEETING_PROTOCOL_v4.0

---

## PHASE 1: 課題提示 (5分)

### 議題
「Consumer以外の7アプリ（Token Hub, Governance, Prover, Observer, Enterprise, QS Admin, Explorer）の設計書が完成した。ペルソナフィードバックも反映済み。この設計書を最終承認してよいか？」

### 確認事項
1. 設計書がSEQUENCES.md、DATA_MODEL.mdと整合しているか
2. 各アプリの責務が明確で重複がないか
3. ペルソナフィードバックが適切に反映されているか
4. 実装に必要な情報が十分に含まれているか

---

## PHASE 2: 提案競争 (15分)

### Purpose Guardian
「設計書をCP-1〜CP-5の観点からレビューした。

**CP-1 (量子耐性)**:
- Token Hub、Governanceで量子耐性署名の説明が不十分
- Explorer用語集にDilithium/SPHINCS+の説明を追加すべき
- **提案**: 各アプリの「セキュリティ説明」セクションを追加

**CP-2 (Self-Custody)**:
- EnterpriseのホワイトリストモデルはSelf-Custodyを侵害しない
- ユーザーがConsumer Appで自己管理する点は維持されている
- **承認**

**CP-3 (Time Lock)**:
- Time Lock説明が不足。なぜ24時間なのか？
- **提案**: FAQ/用語集で理由を説明

**CP-4 (Slashing)**:
- Prover設計でSlashing条件が明確化されている
- **承認**

**CP-5 (透明性)**:
- Explorer設計で透明性要件を満たす
- **承認**」

### CTO
「技術アーキテクチャ観点でのレビュー:

**Token Hub + Governance統合の可能性**:
- 両者はveQSを共有している
- 現在は別アプリとして設計されているが、統合すべきか？
- **提案**: UI/UXは別アプリ、バックエンドAPIは共通化

**API設計の一貫性**:
- 各アプリのAPI命名規則が統一されていない
- `/api/prover/rewards/claim` vs `/api/observer/rewards/claim` は良い
- `/api/token-hub/claim` は `/api/token-hub/rewards/claim` に統一すべき
- **提案**: API命名規則を別ドキュメントで定義

**認証フローの確認**:
- RainbowKit使用アプリ: Consumer, Token Hub, Governance, Prover, Observer, Enterprise
- 内部認証: QS Admin
- 認証なし: Explorer
- **承認**: 設計通りで問題なし」

### CSO
「セキュリティ観点でのレビュー:

**Prover Portal**:
- HSM要件、マルチシグ要件が明確
- SLA違反時の自動停止が必要（現在は「選出確率低下」のみ）
- **提案**: 重大SLA違反時の自動停止フローを追加

**Observer**:
- Challenge前の「確信度」表示は良い改善
- ただし、誤検知救済措置が「Governance提案で補償」は弱い
- **懸念**: 自動化された誤検知に対する救済が不十分

**Enterprise**:
- ホワイトリスト承認フローにQS Admin承認が必要
- 二重チェックは良いセキュリティプラクティス
- **承認**

**全体**:
- 監査ログの保持期間が7年と明記されているのは良い
- **承認**」

### CFO
「コスト観点でのレビュー:

**ガス代見積もり**:
- Token Hubで追加されたガス代表示は良い
- 全アプリでガス代の事前表示を統一すべき
- **提案**: ガス代見積もりAPIを共通化

**Enterprise SLA**:
- 緊急申請オプション（追加料金）は収益化の機会
- 契約オプションとして明記されているのは良い
- **承認**

**運用コスト**:
- Observer報酬の60%分配は適切
- Insurance Fund 20%は十分か？TVL増加に伴い見直しが必要になる可能性
- **懸念**: Insurance Fund比率の長期的妥当性」

### CBO
「ビジネス観点でのレビュー:

**ユーザー獲得**:
- Landing → Login → Dashboard フローは標準的で良い
- 各アプリのValue Propositionが明確
- **承認**

**Enterprise ホワイトリストモデル**:
- API統合型より参入障壁が低い
- ただし、差別化要因が弱い
- **提案**: Enterprise向け専用機能（カスタムレポート、優先サポート）を強化

**Token Hub + Governance**:
- 投資家にとって2つのアプリに分かれているのは不便
- ただし、veQSを持たない人もGovernance閲覧だけしたい場合がある
- **提案**: Token HubからGovernanceへの導線を強化、統合は見送り」

### Cost Guardian
「リソース効率観点でのレビュー:

**画面数**:
- Token Hub: 7画面（適切）
- Governance: 7画面（適切）
- Prover: 9画面（登録フローが長い、要簡素化検討）
- Observer: 8画面（適切）
- Enterprise: 8画面（大幅簡素化済み、良い）
- QS Admin: 11画面（管理画面として適切）
- Explorer: 5画面（認証なしで軽量、良い）

**共通コンポーネント活用**:
- StatCard, DataTable, Chartコンポーネントの再利用を推奨
- アプリごとに新規作成しない
- **提案**: 共通コンポーネント一覧を別ドキュメント化」

### Engineer
「実装観点でのレビュー:

**API設計**:
- リクエスト/レスポンスの型定義が明確
- snake_case (API) → camelCase (クライアント) 変換パターンが確立済み
- **承認**

**画面遷移**:
- 戻るボタン先が全て明確化されている
- **承認**

**テスト戦略**:
- 設計書にテスト要件が含まれていない
- **提案**: 各アプリのテスト要件セクションを追加

**i18n**:
- 翻訳キー構造がToken Hubで示されている
- 他アプリも同様の構造であることを明記すべき
- **提案**: 共通翻訳キー構造を別セクションに記載」

### Chief Cryptographer
「暗号学的観点でのレビュー:

**量子耐性説明**:
- Purpose Guardianの指摘に同意
- Dilithium, SPHINCS+の説明がExplorerの用語集のみ
- 各アプリで「なぜ量子耐性が重要か」を説明すべき
- **提案**: Onboarding/Landingで量子耐性の価値を説明

**veQS計算式**:
- 線形計算式は正しい
- 4年 = 208週の根拠を説明すべき（一般的なve-tokenモデル）
- **提案**: FAQ追加「なぜ最大4年？」

**署名検証**:
- Proverの署名フローは正しく設計されている
- **承認**」

### Researcher
「最新技術・ベストプラクティス観点でのレビュー:

**ve-tokenモデル**:
- Curve Finance, Uniswapで実績あり
- 4年最大ロックは業界標準
- **承認**

**Observer Challenge**:
- Optimistic Rollupと類似のChallenge期間設計
- 48時間のDefense期間は適切
- **承認**

**Governance Quorum**:
- 4%/8%/15%の段階的Quorumは良い設計
- 低すぎると乗っ取りリスク、高すぎると停滞リスク
- **提案**: Quorum要件の理由を文書化

**Enterprise ホワイトリスト**:
- シンプルなアプローチで実装容易
- API統合は将来Phase 4で検討可能
- **承認**」

### Legal
「法規制観点でのレビュー:

**NIST/FIPS準拠**:
- Dilithium (FIPS 204), SPHINCS+ (FIPS 205) 使用は適切
- 設計書に準拠規格を明記すべき
- **提案**: セキュリティ仕様セクションでFIPS番号を参照

**KYC/AML**:
- Consumer: ウォレット接続のみ（KYC不要）
- Enterprise: 契約ベース（オフラインでKYB実施）
- Prover/Observer: 登録時に本人確認が必要（設計書で明記すべき）
- **提案**: Prover/Observer登録でのKYB要件を明確化

**監査証跡**:
- 7年保持は適切（多くの規制で5-7年要求）
- **承認**

**Cookie/GDPR**:
- Landing/Dashboardでの同意取得が必要
- 既存のCookieBannerコンポーネントで対応済みと想定
- **確認要**: 実装時にGDPR準拠を確認」

### Red Team
「批判的分析:

**重大懸念**:

1. **Token Hub + Governance統合問題**:
   - 分離維持 vs 統合について明確な決定がない
   - 投資家（鈴木さん）の意見は「不便」
   - **要決定**: Phase 6実装前に方針決定すべき

2. **Observer誤検知リスク**:
   - システム誤検知でBond没収は厳しすぎる
   - 初心者Observerが損失を被る可能性
   - **要対策**: 誤検知率の公開、または初心者向けセーフガード

3. **Enterprise SLA履行保証**:
   - 「最大48時間」の承認SLAを誰がどう保証するのか
   - QS Admin側の人的リソースが不足する可能性
   - **要対策**: SLA違反時のペナルティまたは自動承認フォールバック

4. **ガス代高騰リスク**:
   - ガス代見積もりがあっても、実行時に高騰する可能性
   - ユーザーが想定外のガス代を支払うリスク
   - **要対策**: 最大ガス代設定オプション

5. **QS Admin権限集中**:
   - Prover承認、Enterprise承認、Emergency Pauseの権限が集中
   - 内部不正リスク
   - **要対策**: 操作の多重署名要件を検討

**軽微懸念**:

6. API命名規則の不統一（CTOも指摘）
7. テスト要件の欠如（Engineerも指摘）
8. 量子耐性説明の不足（複数エージェント指摘）」

---

## PHASE 3: 相互批評 (10分)

### Red Team批判への各エージェント応答

**CTO → Token Hub統合問題**:
「統合は見送りを提案する。理由:
1. veQS保有者のみが投票できるが、Governance閲覧は誰でも可能にしたい
2. 統合すると機能が複雑化し、初心者に不親切
3. Token Hub → Governance の導線強化で対応可能」

**CSO → Observer誤検知リスク**:
「初心者向けセーフガードを提案:
1. 登録後3ヶ月は『練習モード』でBond不要のシミュレーションChallenge
2. 過去類似事例の勝率表示は既に設計済み
3. 誤検知率の週次公開をダッシュボードに追加」

**CFO → Enterprise SLA履行**:
「SLA違反時の対応を提案:
1. 48時間超過で自動エスカレーション（Slack通知）
2. 72時間超過で自動承認（ただし監査ログに警告記録）
3. SLA違反が月3回でEnterprise顧客に謝罪・補償」

**Engineer → ガス代高騰リスク**:
「maxFeePerGas設定を提案:
1. ユーザーが最大許容ガス代を設定可能
2. 超過時はトランザクション中止
3. ガス代予測はBlocknative APIで実装」

**CSO → QS Admin権限集中**:
「多重署名を提案:
1. Prover承認: 2-of-3 Admin署名
2. Emergency Pause: Security Council 5/9（既存設計通り）
3. パラメータ変更: Governance経由（既存設計通り）
重大操作は単独では実行不可に」

### Purpose Guardian総括
「Red Teamの懸念は妥当。以下の対応を推奨:
1. Token Hub/Governance統合は見送り、導線強化
2. Observer練習モードを追加
3. Enterprise SLA自動エスカレーションを追加
4. ガス代maxFee設定を追加
5. QS Admin多重署名を追加

これらはCore Principlesに違反しない。」

---

## PHASE 4: 統合・投票 (10分)

### 投票議題1: Token Hub + Governance統合について

| エージェント | 投票 | 理由 |
|------------|:----:|------|
| Purpose Guardian | 反対 | 統合による複雑化はユーザー体験を損なう |
| CTO | 反対 | バックエンド共通化で十分、UI統合は不要 |
| CSO | 中立 | セキュリティ観点では影響なし |
| CFO | 反対 | 開発コスト増、ROI不明 |
| CBO | 賛成 | 投資家には便利 |
| Cost Guardian | 反対 | 画面数増加、保守コスト増 |
| Engineer | 反対 | 実装複雑化 |
| Chief Cryptographer | 中立 | 暗号学的に影響なし |
| Researcher | 中立 | どちらでも問題なし |
| Legal | 中立 | 法的に影響なし |
| Red Team | 反対 | 統合により障害影響範囲が拡大 |

**結果**: 反対 7、賛成 1、中立 3
**決定**: Token Hub + Governance は **統合しない**（導線強化で対応）

---

### 投票議題2: 設計書v1.1の承認

| エージェント | 投票 | 条件 |
|------------|:----:|------|
| Purpose Guardian | 条件付き賛成 | 量子耐性説明を各アプリに追加 |
| CTO | 条件付き賛成 | API命名規則ドキュメント追加 |
| CSO | 条件付き賛成 | Observer練習モード追加 |
| CFO | 賛成 | - |
| CBO | 賛成 | - |
| Cost Guardian | 賛成 | - |
| Engineer | 条件付き賛成 | テスト要件セクション追加 |
| Chief Cryptographer | 条件付き賛成 | FIPS参照追加 |
| Researcher | 賛成 | - |
| Legal | 条件付き賛成 | KYB要件明確化 |
| Red Team | 条件付き賛成 | 上記全対応後 |

**結果**: 賛成 11（条件付き 7、無条件 4）
**決定**: 設計書v1.1は **条件付きで承認**

---

## PHASE 5: シーケンス作成 (15分)

### 承認条件への対応タスク

| # | 条件 | 担当 | 優先度 | 対応 |
|---|------|------|:------:|------|
| 1 | 量子耐性説明を各アプリに追加 | Purpose Guardian | 高 | v1.2で追加 |
| 2 | API命名規則ドキュメント追加 | CTO | 中 | 別ドキュメント作成 |
| 3 | Observer練習モード追加 | CSO | 高 | 設計書に追加 |
| 4 | テスト要件セクション追加 | Engineer | 中 | 各アプリに追加 |
| 5 | FIPS参照追加 | Chief Cryptographer | 低 | セキュリティセクション追加 |
| 6 | Prover/Observer KYB要件明確化 | Legal | 高 | 登録フローに追加 |
| 7 | Enterprise SLA自動エスカレーション | CFO | 中 | SLAセクション更新 |
| 8 | ガス代maxFee設定 | Engineer | 中 | API設計に追加 |
| 9 | QS Admin多重署名 | CSO | 高 | 権限セクション追加 |

---

## PHASE 6: 全体レビュー (10分)

### チェックリスト

- [x] CP-1〜CP-5 準拠確認 (Purpose Guardian) → **条件付きOK**（量子耐性説明追加後）
- [x] 技術的実現可能性確認 (CTO) → **OK**
- [x] セキュリティ要件充足 (CSO) → **条件付きOK**（練習モード、多重署名追加後）
- [x] 予算内収まり確認 (CFO) → **OK**

---

## PHASE 7: 課題再発見 (10分)

### 全エージェント懸念提出

| エージェント | 懸念 | 重要度 |
|------------|------|:------:|
| Purpose Guardian | 量子コンピュータ実用化時期の不確実性。説明が「将来」では弱い | 低 |
| CTO | スマートコントラクトのアップグレード戦略が未定義 | 中 |
| CSO | HSM障害時のProver復旧手順が不明 | 中 |
| CFO | Insurance Fundの運用方針が未定義 | 中 |
| CBO | 競合（LayerZero等）との差別化が設計に反映されていない | 低 |
| Cost Guardian | Prover 5社体制の持続可能性（1社離脱時の影響） | 中 |
| Engineer | Mock APIから本番API移行のマイグレーション戦略が未定義 | 中 |
| Chief Cryptographer | Dilithiumの鍵ローテーション戦略が未定義 | 中 |
| Researcher | veQSモデルの経済的持続可能性（長期シミュレーション未実施） | 低 |
| Legal | マルチジュリスディクション対応（EU, US, JP規制の違い） | 中 |
| Red Team | 設計書が長大で、実装者が見落としやすい | 中 |

### 対応方針
- 上記は設計書v1.1のスコープ外
- 別途「運用設計書」「移行計画書」で対応
- Phase 7懸念として記録、Phase 6実装時に検討

---

## PHASE 8: 機能別最終投票 (10分)

### Token Hub設計 → **承認** (11/11)
### Governance設計 → **承認** (11/11)
### Prover Portal設計 → **条件付き承認** (KYB要件明確化後)
### Observer設計 → **条件付き承認** (練習モード追加後)
### Enterprise設計 → **承認** (11/11)
### QS Admin設計 → **条件付き承認** (多重署名追加後)
### Explorer設計 → **承認** (11/11)

---

## PHASE 9: 最終シーケンス提示 (5分)

### 決定事項

1. **設計書v1.1は条件付きで承認**
2. **Token Hub + Governance統合は見送り**（導線強化で対応）
3. **v1.2での追加タスク**:
   - 量子耐性説明の各アプリ追加
   - Observer練習モード
   - Prover/Observer KYB要件
   - QS Admin多重署名
   - API命名規則ドキュメント（別文書）

### 次のアクション

| # | アクション | 担当 | 期限 |
|---|----------|------|------|
| 1 | 設計書v1.2作成 | CTO | 手順⑤前 |
| 2 | 現状URLと設計書の比較 | CTO | 手順⑤ |
| 3 | 変更計画作成 | CTO | 手順⑤ |

---

## ポイント集計

| エージェント | 獲得ポイント | 内訳 |
|------------|:------------:|------|
| Purpose Guardian | +13 | 建設的批評 +5, 新規アイデア +8 |
| CTO | +15 | 提案部分採用 +10, 建設的批評 +5 |
| CSO | +23 | 提案完全採用 +20, 建設的批評 +3 |
| CFO | +10 | 提案部分採用 +10 |
| CBO | +5 | 建設的批評 +5 |
| Cost Guardian | +5 | 建設的批評 +5 |
| Engineer | +15 | 提案部分採用 +10, 建設的批評 +5 |
| Chief Cryptographer | +10 | 提案部分採用 +10 |
| Researcher | +5 | 建設的批評 +5 |
| Legal | +15 | 提案部分採用 +10, 建設的批評 +5 |
| Red Team | +20 | 重大欠陥発見 +15, 建設的批評 +5 |

---

**会議終了**

*記録者: CTOエージェント*
*承認: Purpose Guardian*
