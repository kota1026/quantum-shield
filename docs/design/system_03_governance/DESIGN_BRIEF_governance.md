# Design Brief: Governance

## Overview

| 項目 | 値 |
|------|-----|
| System | Governance |
| System ID | 03 |
| Directory | system_03_governance |
| Priority | P1 |
| Total Screens | 16 |
| Target Personas | Token Holder (鈴木さん), Delegate (渡辺さん), Proposer (高橋さん) |
| Created | 2026-01-10 |

---

## Screen List

### 3.1 Overview (2)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 3-1 | Governance Dashboard | Overview | 全ペルソナ | 投票力、アクティブ提案、統計 |
| 3-2 | My Voting Power | Overview | Token Holder, Delegate | veQS残高、委任状況、投票力計算 |

### 3.2 Proposals (4)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 3-3 | Proposals List | Proposals | 全ペルソナ | Active/Passed/Defeated フィルター |
| 3-4 | Proposal Detail | Proposals | 全ペルソナ | 提案内容、投票状況、議論 |
| 3-5 | Vote Interface | Proposals | Token Holder, Delegate | For/Against/Abstain 選択 |
| 3-6 | Vote Success | Proposals | Token Holder, Delegate | 投票完了確認 |

### 3.3 Create Proposal (4)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 3-7 | Create Step 1: Type | Create | Proposer | 提案タイプ選択（Parameter/Upgrade/Council） |
| 3-8 | Create Step 2: Details | Create | Proposer | タイトル、説明、実行内容 |
| 3-9 | Create Step 3: Preview | Create | Proposer | プレビュー、必要veQS確認 |
| 3-10 | Create Submit | Create | Proposer | 署名、提出確認 |

### 3.4 My Activity (3)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 3-11 | My Votes | Activity | Token Holder, Delegate | 投票履歴 |
| 3-12 | My Proposals | Activity | Proposer | 自分の提案リスト |
| 3-13 | Received Delegations | Activity | Delegate | 受けた委任一覧、委任者情報 |

### 3.5 Council (3)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 3-14 | Council Dashboard | Council | Security/Purpose Council | Council専用ダッシュボード |
| 3-15 | Emergency Actions | Council | Security Council | 緊急Pause管理 |
| 3-16 | Veto History | Council | Security/Purpose Council | Veto履歴、理由公開 |

---

## Design Requirements

### Color Usage (Premium Japan)

| 用途 | 色 | 使用場面 |
|------|-----|---------|
| Primary Actions | Hinomaru Red (#BC002D) | Vote Submit, Create Proposal |
| Secondary | Gold (#C9A962) | View Details, Delegate Links |
| Background | Dark (#0A0A0C) | ページ背景 |
| For Vote | Success Green (#00C896) | 賛成票、可決 |
| Against Vote | Orange Red (#E07040) | 反対票、否決 |
| Abstain | Gray (#8080A0) | 棄権 |
| Quorum Progress | Gold Gradient | 定足数プログレスバー |

### Key Visual Elements

| 要素 | 説明 |
|------|------|
| 投票力インジケーター | 円形ゲージ + veQS数値表示 |
| 提案カード | ステータスバッジ + 投票期限カウントダウン |
| 投票分布バー | For/Against/Abstainの横棒グラフ |
| Quorumプログレス | 定足数到達度の視覚化 |
| タイムライン | 提案のフェーズ進行表示 |
| Delegateアバター | 委任先のプロフィールカード |

### Component Patterns

| パターン | 使用場面 |
|---------|---------|
| ステータスバッジ | Active/Pending/Passed/Defeated/Vetoed |
| カウントダウンタイマー | 投票期限、Time Lock |
| 投票ボタングループ | For/Against/Abstain 3択 |
| 署名モーダル | Dilithium署名要求 |
| トランザクション確認 | 投票・提案提出前の確認 |

---

## Persona Details

### 【鈴木さん】Token Holder (veQSホルダー)

| 項目 | 内容 |
|------|------|
| 年齢 | 28歳 |
| 技術レベル | ★★★★☆（高め） |
| 背景 | DeFiユーザー、他DAOにも参加経験、veTokenエコノミクスに詳しい |
| 主な課題 | 投票を忘れたら報酬がもらえない？委任先が信頼できるか？ |
| 期待する体験 | 効率的な投票、報酬の可視化、信頼できるDelegateへの委任 |
| 利用デバイス | スマホ 50%（通知確認）、PC 50%（ロック操作、委任設定） |

### 【渡辺さん】Delegate (DAOコミュニティリーダー)

| 項目 | 内容 |
|------|------|
| 年齢 | 42歳 |
| 技術レベル | ★★★★☆（高め） |
| 背景 | 複数DAOでDelegate活動、Twitter/Xフォロワー5万人、ガバナンス分析発信 |
| 主な課題 | 委任されたveQSを正しく使う責任、重要な投票を見逃さない |
| 期待する体験 | 委任状況の把握、投票理由の透明な公開、報酬管理 |
| 利用デバイス | PC 80%（分析作業、投票）、スマホ 20%（通知確認） |

### 【高橋さん】Proposer (プロトコル改善提案者)

| 項目 | 内容 |
|------|------|
| 年齢 | 35歳 |
| 技術レベル | ★★★★★（エキスパート） |
| 背景 | QS大口veQSホルダー、ブロックチェーンエンジニア経験5年 |
| 主な課題 | 提案に必要なveQS量は？否決されたらどうなる？ |
| 期待する体験 | 明確な提案プロセス、投票状況のリアルタイム確認 |
| 利用デバイス | PC 90%（提案作成、技術分析）、スマホ 10%（投票状況確認） |

---

## Special Considerations

### ガバナンス固有の要件

| 要件 | 説明 | CP参照 |
|------|------|--------|
| 透明性 | 全ての投票はオンチェーンで検証可能 | CP-5 |
| Time Lock | 可決後の実行には7日間のTime Lock | CP-3 |
| Veto権 | Security/Purpose CouncilのVeto可視化 | - |
| Quorum | 提案タイプ別の定足数表示 | - |

### Quorum要件（CORE_PRINCIPLESより）

| 提案タイプ | 必要Quorum | Time Lock |
|-----------|-----------|----------|
| パラメータ調整（Bond額等） | 4% | 7日 |
| コントラクトアップグレード | 8% | 7日 |
| Council メンバー変更 | 15% | 7日 |

### Council Veto表示

- Security Council: セキュリティ関連提案へのVeto権
- Purpose Committee: Core Principles (CP-1〜CP-5) 違反提案へのVeto権
- Veto実行時は理由を必ず公開（透明性 CP-5）

---

## User Journey Mapping

### Token Holder (鈴木さん) フロー

```
Dashboard → Proposals List → Proposal Detail → Vote → Vote Success
     ↓
My Voting Power → Delegate（Token Hubへ遷移）
```

### Delegate (渡辺さん) フロー

```
Dashboard → Received Delegations → Proposal Detail → Vote → Vote Success
     ↓
My Votes → 投票理由公開
```

### Proposer (高橋さん) フロー

```
Dashboard → Create Step 1 → Step 2 → Step 3 → Submit
     ↓
My Proposals → Proposal Detail → 投票状況監視
```

---

## File Mapping (予定)

| # | Screen | Mock File | Notes |
|---|--------|-----------|-------|
| 3-1 | Governance Dashboard | 01_dashboard.html | メインダッシュボード |
| 3-2 | My Voting Power | 01_dashboard.html内 | タブまたはセクション |
| 3-3 | Proposals List | 02_proposals_list.html | フィルター付きリスト |
| 3-4 | Proposal Detail | 02_proposal_detail.html | 詳細 + 投票状況 |
| 3-5 | Vote Interface | 02_proposal_detail.html内 | 投票モーダル |
| 3-6 | Vote Success | 02_vote_success.html | 成功画面 |
| 3-7 | Create Step 1 | 03_create_proposal.html | ステップ1 |
| 3-8 | Create Step 2 | 03_create_proposal.html | ステップ2 |
| 3-9 | Create Step 3 | 03_create_proposal.html | ステップ3 |
| 3-10 | Create Submit | 03_create_submit.html | 提出確認 |
| 3-11 | My Votes | 04_my_activity.html | 投票履歴タブ |
| 3-12 | My Proposals | 04_my_activity.html | 提案履歴タブ |
| 3-13 | Received Delegations | 04_my_activity.html | 委任受領タブ |
| 3-14 | Council Dashboard | 05_council.html | Council専用 |
| 3-15 | Emergency Actions | 05_council.html内 | 緊急アクション |
| 3-16 | Veto History | 05_veto_history.html | Veto履歴 |

---

## Review Agents

| Agent | Focus | チェックポイント |
|-------|-------|-----------------|
| CDO（佐々木さん） | 透明性・信頼感の表現 | 投票結果の可視化、Veto理由の明示 |
| Legal（西村さん） | 投票プロセスの合法性 | 免責事項、投票の法的性質説明 |
| 鈴木さん | 投票のわかりやすさ | 初心者でも迷わないUI |
| 渡辺さん | 提案作成フロー | Delegate向け情報の充実 |

---

## Next Steps

1. **→ 09_design_create.md** でワイヤーフレーム・モック作成
2. 推定HTMLファイル数: **6-8ファイル**
3. 重要画面: Dashboard, Proposals List, Proposal Detail, Create Proposal

---

## Changelog

| Date | Action | Notes |
|------|--------|-------|
| 2026-01-10 | DESIGN_BRIEF作成 | 08_design_prep完了 |

---

**END OF DESIGN BRIEF**
