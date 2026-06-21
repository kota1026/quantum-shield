# 🎨 Step D: UI/UX要件 網羅的落とし込み

> **日時**: 2026年1月5日  
> **議長**: CDO (Engineer)  
> **議題**: 全プレイヤー・全シーケンスのUI/UX要件定義  
> **ステータス**: ✅ 完了

---

## 会議の目的

Step A-Cで定義した要件、およびSEQUENCES.mdの全8シーケンスを網羅し、Phase 4 UI/UX設計の基盤となる要件ドキュメントを作成する。

---

## 1. プレイヤー全体像とUI/UXマッピング

### 1.1 プレイヤー × 画面マトリクス

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                          Quantum Shield UI/UX 全体構成                           │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  【Public Area】                  【Authenticated Area】                         │
│  ┌─────────────────┐             ┌─────────────────────────────────────────┐   │
│  │ Landing Page    │             │ Dashboard (User)                        │   │
│  │ Documentation   │             │ ├── Lock/Unlock                         │   │
│  │ Explorer        │             │ ├── Transaction History                 │   │
│  │ Status Page     │             │ └── Settings                            │   │
│  └─────────────────┘             ├─────────────────────────────────────────┤   │
│                                  │ Token Hub                               │   │
│                                  │ ├── veQS Lock/Unlock                    │   │
│                                  │ ├── Delegation                          │   │
│                                  │ └── Rewards                             │   │
│                                  ├─────────────────────────────────────────┤   │
│                                  │ Governance                              │   │
│                                  │ ├── Proposals                           │   │
│                                  │ ├── Voting                              │   │
│                                  │ └── Delegates                           │   │
│                                  ├─────────────────────────────────────────┤   │
│                                  │ Prover Portal                           │   │
│                                  │ ├── Registration                        │   │
│                                  │ ├── Dashboard                           │   │
│                                  │ ├── Delegation Settings                 │   │
│                                  │ └── Exit                                │   │
│                                  ├─────────────────────────────────────────┤   │
│                                  │ Observer/Challenger Portal              │   │
│                                  │ ├── Monitor Dashboard                   │   │
│                                  │ ├── Challenge Submission                │   │
│                                  │ └── Rewards                             │   │
│                                  ├─────────────────────────────────────────┤   │
│                                  │ Council/Committee Portal                │   │
│                                  │ ├── Emergency Actions                   │   │
│                                  │ ├── Approval Queue                      │   │
│                                  │ └── Meeting Minutes                     │   │
│                                  └─────────────────────────────────────────┘   │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### 1.2 プレイヤー別アクセス権限

| プレイヤー | Public | User Dashboard | Token Hub | Governance | Prover Portal | Observer Portal | Council Portal |
|-----------|:------:|:--------------:|:---------:|:----------:|:-------------:|:---------------:|:--------------:|
| User | ✅ | ✅ | ✅ | ✅(投票) | ❌ | ❌ | ❌ |
| Delegator | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Delegate | ✅ | ✅ | ✅ | ✅(+登録) | ❌ | ❌ | ❌ |
| Proposer | ✅ | ✅ | ✅ | ✅(+作成) | ❌ | ❌ | ❌ |
| Prover | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ |
| Observer | ✅ | ✅ | ✅ | ✅ | ❌ | ✅(閲覧) | ❌ |
| Challenger | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ |
| Security Council | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ |
| Purpose Committee | ✅ | ✅ | ✅ | ✅(+審査) | ❌ | ❌ | ✅(一部) |

---

## 2. シーケンス別 UI/UX詳細設計

### 2.1 Sequence #1: Lock

#### ユーザージャーニー

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Lock Flow                                                                       │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  [1. 接続]        [2. 入力]        [3. 確認]        [4. 完了]                   │
│  ┌─────────┐      ┌─────────┐      ┌─────────┐      ┌─────────┐                │
│  │ Wallet  │ ───► │ Lock    │ ───► │ Preview │ ───► │ Success │                │
│  │ Connect │      │ Form    │      │ & Sign  │      │ Screen  │                │
│  └─────────┘      └─────────┘      └─────────┘      └─────────┘                │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### 画面設計

| 画面 | 要素 | 機能 |
|------|------|------|
| **Lock Form** | Asset Selector | 対応資産選択（ETH, USDC等） |
| | Amount Input | 金額入力（Max設定可） |
| | Destination Chain | 送金先チェーン選択 |
| | Destination Address | 送金先アドレス入力 |
| | Dilithium Key Status | 鍵生成/インポート状態 |
| | Fee Preview | 手数料表示（0.05% + Gas） |
| **Preview & Sign** | Transaction Summary | 入力内容サマリー |
| | Dilithium Signature | 署名要求（ブラウザ/ハードウェア） |
| | Gas Estimate | Gas費用見積もり |
| | Confirm Button | 実行ボタン |
| **Success** | Lock ID | 発行されたlock_id |
| | Transaction Hash | L1 Tx Hash（リンク） |
| | SR_0 | State Root表示 |
| | Next Steps | Unlock方法の説明 |

#### Dilithium鍵管理UI

| 機能 | 説明 |
|------|------|
| **鍵生成** | ブラウザ内でDilithium鍵ペア生成 |
| **鍵インポート** | 既存鍵のインポート（JSON/Mnemonic） |
| **鍵エクスポート** | 暗号化バックアップのダウンロード |
| **鍵表示** | 公開鍵の表示（QRコード対応） |
| **鍵削除** | ローカル鍵の削除（警告付き） |

---

### 2.2 Sequence #2: Unlock (Normal Path)

#### ユーザージャーニー

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Unlock (Normal) Flow                                                            │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  [1. 選択]    [2. 署名]    [3. 待機]     [4. 待機]    [5. Claim]   [6. 完了]   │
│  ┌───────┐   ┌───────┐   ┌───────┐    ┌───────┐   ┌───────┐    ┌───────┐     │
│  │ Lock  │──►│Dilithium──►│ Prover │──►│ 24h   │──►│ Claim │──►│Success│     │
│  │Select │   │ Sign  │   │Signing │   │TimeLock   │ Submit│   │ Screen│     │
│  └───────┘   └───────┘   └───────┘    └───────┘   └───────┘    └───────┘     │
│                                                                                 │
│  ※ステータス表示: Pending → ProverSigning → TimeLock → Claimable → Completed  │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### 画面設計

| 画面 | 要素 | 機能 |
|------|------|------|
| **Lock Selection** | Active Locks List | ロック一覧（フィルタ/ソート） |
| | Lock Details | 選択ロックの詳細 |
| | Amount to Unlock | 引き出し額（部分/全額） |
| | Destination Address | 送金先（デフォルト: Lock時と同じ） |
| **Dilithium Sign** | Unlock Request Preview | 要求内容サマリー |
| | Sign Button | Dilithium署名実行 |
| **Prover Signing** | Status Indicator | 「Prover署名中...」 |
| | Prover Progress | 選出Prover、署名状況 |
| | Estimated Time | 推定完了時間（~5分） |
| **Time Lock** | Countdown Timer | 24時間カウントダウン |
| | Release Time | 解放予定時刻 |
| | Challenge Status | Challenge有無表示 |
| | Notification Toggle | 通知設定（メール/Push） |
| **Claim** | Claim Button | Claim実行ボタン |
| | Gas Estimate | Gas費用 |
| **Success** | Amount Released | 解放額 |
| | Transaction Hash | L1 Tx Hash |

---

### 2.3 Sequence #3: Unlock (Emergency Path)

#### ユーザージャーニー

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Unlock (Emergency) Flow                                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  [1. 検知]      [2. Bond]      [3. 待機]      [4. Claim]     [5. 完了]         │
│  ┌─────────┐   ┌─────────┐    ┌─────────┐   ┌─────────┐    ┌─────────┐        │
│  │ 72h     │──►│ Emergency│──►│ 7日     │──►│ Claim   │──►│ Success │        │
│  │ Timeout │   │ Submit   │   │ TimeLock│   │ + Bond  │   │ + Bond  │        │
│  │ 検知    │   │ + Bond   │   │         │   │ 返還    │   │ 返還    │        │
│  └─────────┘   └─────────┘    └─────────┘   └─────────┘    └─────────┘        │
│                                                                                 │
│  ※自動検知: Prover応答72時間なしで Emergency Mode 自動表示                      │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### 画面設計

| 画面 | 要素 | 機能 |
|------|------|------|
| **Emergency Detection** | Alert Banner | 「Emergency Modeが利用可能」 |
| | Reason Display | 発動理由（Prover応答なし等） |
| | Normal vs Emergency | 両パスの比較説明 |
| **Emergency Submit** | Bond Calculator | Bond額計算表示 `MAX(0.5 ETH, amount × 5%)` |
| | Bond Payment | Bond支払い確認 |
| | Risk Warning | リスク説明（7日待機、Challenge可能性） |
| | Submit Button | Emergency Unlock実行 |
| **7-Day Time Lock** | Countdown Timer | 7日カウントダウン |
| | Challenge Status | Challenge有無（強調表示） |
| | Bond Status | Bond保持中表示 |
| **Claim + Bond Return** | Claim Button | Claim実行 |
| | Return Breakdown | 資産 + Bond返還内訳 |

---

### 2.4 Sequence #3': Resync

#### UI/UX

| 画面 | 要素 | 機能 |
|------|------|------|
| **Sync Status** | Sync Indicator | L1-L3同期状態表示 |
| | Pending Syncs | 同期待ちLock一覧 |
| **Manual Resync** | Resync Button | 手動同期実行 |
| | L1 Tx Hash Input | 同期対象のL1 Tx Hash |
| | Resync Result | 成功/失敗表示 |

---

### 2.5 Sequence #4: Challenge + Slashing

#### Challenger向け画面

| 画面 | 要素 | 機能 |
|------|------|------|
| **Monitor Dashboard** | Pending Unlocks | Time Lock中のUnlock一覧 |
| | Alerts | 異常検知アラート一覧 |
| | My Challenges | 自分のChallenge履歴 |
| **Challenge Form** | Target Unlock | 対象Unlock選択 |
| | Evidence Upload | 証拠アップロード（SR不一致証明等） |
| | Bond Calculator | Bond額表示 `MAX(0.1 ETH, amount × 1%)` |
| | Submit Challenge | Challenge提起 |
| **Challenge Status** | Progress Tracker | Submitted → Defense期間 → 判定 |
| | Defense Status | Proverの反証状況 |
| | Countdown | 48時間Defense期限 |
| **Challenge Result** | Outcome | 勝利/敗北 |
| | Reward/Loss | 報酬額 or Bond没収額 |
| | Claim Reward | 報酬Claimボタン |

#### Slashing表示（Prover向け）

| 画面 | 要素 | 機能 |
|------|------|------|
| **Slash Alert** | Alert Banner | Slash発生アラート |
| | Slash Details | 理由、額、同時不正者数 |
| | Remaining Stake | 残Stake表示 |
| **Slash History** | Slash Log | 過去のSlash履歴 |

---

### 2.6 Sequence #5: Prover Registration

#### ユーザージャーニー

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Prover Registration Flow                                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  [1. 申請]      [2. 書類]      [3. Stake]    [4. 審査]      [5. 完了]          │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐          │
│  │ Start   │──►│ Document│──►│ Stake   │──►│ Review  │──►│ Active  │          │
│  │ Application  │ Upload │   │ Deposit │   │ Pending │   │ Prover  │          │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘   └─────────┘          │
│                                                                                 │
│  ※Phase別: Phase 1は招待制、Phase 2はCouncil承認、Phase 3は自動承認           │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### 画面設計

| 画面 | 要素 | 機能 |
|------|------|------|
| **Application Start** | Requirements Checklist | 要件一覧表示 |
| | Eligibility Check | 適格性確認 |
| | Start Button | 申請開始 |
| **Document Upload** | HSM Attestation | HSM証明書アップロード |
| | Multisig Proof | 2-of-3設定証明 |
| | KYC Documents | 各鍵管理者のKYC |
| | Legal Agreement | Prover Agreement署名 |
| | NDA/SLA | NDA/SLA署名 |
| **Stake Deposit** | Stake Amount | $500K相当表示 |
| | Payment Method | ETH/QS選択 |
| | Deposit Button | Stake入金 |
| | Escrow Status | エスクロー状態 |
| **Review Pending** | Application Status | 審査状況表示 |
| | Checklist Progress | チェックリスト進捗 |
| | Council Votes | Council投票状況（Phase 2） |
| | Estimated Time | 推定承認時間 |
| **Active Prover** | Prover ID | 発行されたID |
| | Dashboard Link | Prover Dashboard へ |
| | First Steps | 初期設定ガイド |

---

### 2.7 Sequence #6: Prover Exit

#### ユーザージャーニー

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Prover Exit Flow                                                                │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  [1. 申請]      [2. Unbonding]   [3. 引き出し]   [4. 完了]                      │
│  ┌─────────┐   ┌─────────────┐   ┌─────────┐   ┌─────────┐                     │
│  │ Exit    │──►│ 7日          │──►│ Withdraw│──►│ Exit    │                     │
│  │ Request │   │ Unbonding   │   │ Stake   │   │ Complete│                     │
│  └─────────┘   └─────────────┘   └─────────┘   └─────────┘                     │
│                                                                                 │
│  ※Unbonding中もSlash対象                                                        │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### 画面設計

| 画面 | 要素 | 機能 |
|------|------|------|
| **Exit Request** | Exit Warning | 退出時の注意事項 |
| | Pending Unlocks | 進行中Unlock一覧 |
| | Delegation Info | Delegator通知確認 |
| | Confirm Exit | 退出申請ボタン |
| **Unbonding** | Countdown | 7日カウントダウン |
| | Slash Risk | Slash可能性の警告 |
| | Status | 「VRF選出対象外」表示 |
| **Withdraw** | Withdraw Button | Stake引き出し |
| | Final Amount | 最終返還額（Slash控除後） |
| | Delegation Return | Delegation返還状況 |

---

### 2.8 Sequence #7: Governance Proposal

#### ユーザージャーニー（Proposer）

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Governance Proposal Flow                                                        │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  [1. 作成]    [2. 議論]    [3. 投票]    [4. TimeLock]  [5. 実行]               │
│  ┌───────┐   ┌───────┐   ┌───────┐   ┌───────────┐   ┌───────┐                │
│  │Create │──►│Forum  │──►│Voting │──►│7日TimeLock│──►│Execute│                │
│  │Proposal   │Discussion │Period │   │           │   │       │                │
│  │(7日)  │   │(7日)  │   │(7日)  │   │           │   │       │                │
│  └───────┘   └───────┘   └───────┘   └───────────┘   └───────┘                │
│                                                                                 │
│  ※Purpose Committeeチェック、Council Veto可能性あり                             │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

#### 画面設計

| 画面 | 要素 | 機能 |
|------|------|------|
| **Create Proposal** | Proposal Type | タイプ選択（パラメータ/アップグレード/Council） |
| | Title/Description | 提案タイトル・説明 |
| | Actions | 実行アクション定義 |
| | Forum Link | Forum投稿へのリンク |
| | Threshold Check | 閾値確認（veQS残高） |
| | Bond Payment | 1 ETH Bond支払い |
| | Submit | 提出ボタン |
| **Proposal List** | Active Proposals | アクティブ提案一覧 |
| | Filters | ステータス/タイプ/作成者フィルタ |
| | Search | 検索機能 |
| **Proposal Detail** | Summary | 提案サマリー |
| | Timeline | 議論期間 → 投票期間 → TimeLock |
| | Current Status | 現在のステータス |
| | Vote Distribution | For/Against/Abstain分布 |
| | Quorum Progress | Quorum達成率 |
| | Discussion Link | Forum/Discordへのリンク |
| | Vote Button | 投票ボタン（投票期間中） |
| **Vote** | Voting Power | 自分の投票力表示 |
| | Choice | For/Against/Abstain選択 |
| | Reason (Optional) | 理由入力（オプション） |
| | Confirm Vote | 投票確定 |
| **Execution** | Execute Button | 実行ボタン（TimeLock後） |
| | Execution Result | 実行結果表示 |

---

### 2.9 Sequence #8: Emergency Pause & Recovery

#### Council向け画面

| 画面 | 要素 | 機能 |
|------|------|------|
| **Emergency Dashboard** | System Status | 全体ステータス（Active/Paused） |
| | Alert Feed | 緊急アラート一覧 |
| | Quick Actions | Pause/Unpause/Prover停止 |
| **Pause Initiation** | Pause Reason | 理由選択/入力 |
| | Scope | Pause範囲（全体/部分） |
| | Multi-sig | 5/9署名収集 |
| | Execute Pause | Pause実行 |
| **Pause Status** | Countdown | 72時間カウントダウン |
| | Pending Actions | 進行中Unlock等の状況 |
| | Response Plan | 対応計画入力 |
| **Recovery** | Upgrade Proposal | 緊急アップグレード提案 |
| | Extension Request | 延長要求 |
| | Unpause Request | 解除要求 |
| | Vote Status | Token Vote状況 |

---

## 3. Token Hub 詳細設計

### 3.1 veQS Lock/Unlock

| 画面 | 要素 | 機能 |
|------|------|------|
| **veQS Dashboard** | QS Balance | 保有QS残高 |
| | veQS Balance | 保有veQS残高 |
| | Voting Power | 投票力表示 |
| | Lock Status | ロック状況一覧 |
| **Lock QS** | Amount Input | ロック額入力 |
| | Lock Period | ロック期間選択（1週間〜4年） |
| | veQS Preview | 獲得veQS・投票力プレビュー |
| | Lock Button | ロック実行 |
| **Extend Lock** | Current Lock | 現在のロック情報 |
| | New Period | 新しい期間選択 |
| | veQS Increase | 投票力増加プレビュー |
| | Extend Button | 延長実行 |
| **Unlock** | Lock Selection | 解除対象選択 |
| | Early Unlock Option | 早期解除オプション |
| | Penalty Calculator | ペナルティ計算表示 |
| | Unlock Button | 解除実行 |

### 3.2 Delegation

| 画面 | 要素 | 機能 |
|------|------|------|
| **Delegate List** | Delegate Cards | Delegate一覧カード |
| | Filters | 投票力/参加率/専門分野フィルタ |
| | Sort | 委任量/参加率ソート |
| | Search | 名前検索 |
| **Delegate Profile** | Name/Avatar | Delegate識別情報 |
| | Statement | ポリシーステートメント |
| | Voting History | 投票履歴 |
| | Delegation Received | 受けた委任量 |
| | Social Links | SNSリンク |
| | Delegate Button | 委任実行ボタン |
| **My Delegation** | Current Delegations | 現在の委任状況 |
| | Delegation Amount | 委任額 |
| | Change/Remove | 変更/解除ボタン |
| **Delegate Registration** | Name Input | Delegate名入力 |
| | Statement Input | ステートメント入力 |
| | Social Links | SNSリンク入力 |
| | Register Button | 登録ボタン |

### 3.3 Rewards

| 画面 | 要素 | 機能 |
|------|------|------|
| **Rewards Dashboard** | Unclaimed Rewards | 未Claim報酬 |
| | Claim History | Claim履歴 |
| | Reward Sources | 報酬源内訳（Prover/Delegation等） |
| | Claim All | 一括Claimボタン |

---

## 4. Prover Portal 詳細設計

### 4.1 Prover Dashboard

| 画面 | 要素 | 機能 |
|------|------|------|
| **Overview** | Status | Active/Inactive/Unbonding |
| | Stake Amount | Stake額 |
| | Delegation Received | 受けたDelegation |
| | Total Value | 合計価値 |
| | Earnings (Epoch) | 今Epochの報酬 |
| | Earnings (Total) | 累計報酬 |
| **Performance** | Signatures This Epoch | 今Epochの署名数 |
| | Signature Success Rate | 成功率 |
| | Response Time Avg | 平均応答時間 |
| | Uptime | 稼働率 |
| **Stake Management** | Current Stake | 現在のStake |
| | Required Stake | 必要Stake（価格調整後） |
| | Add Stake | Stake追加ボタン |
| | Stake History | Stake履歴 |
| **Alerts** | Stake Warning | Stake不足警告 |
| | Timeout Warning | タイムアウト警告 |
| | Slash Alert | Slash通知 |

### 4.2 Delegation Settings

| 画面 | 要素 | 機能 |
|------|------|------|
| **Delegation Config** | Accept Delegation | ON/OFF切り替え |
| | Commission Rate | 手数料率設定（0-30%） |
| | Max Delegation | 上限設定（自動: 10倍） |
| **Delegators List** | Delegator Table | Delegator一覧 |
| | Amount | 委任額 |
| | Since | 委任開始日 |
| | Earnings Shared | 分配報酬額 |

---

## 5. Explorer（公開）詳細設計

| 画面 | 要素 | 機能 |
|------|------|------|
| **Home** | Protocol Stats | TVL、総Unlock数、Prover数等 |
| | Recent Activity | 最近のLock/Unlock |
| | Search Bar | Lock ID/Tx Hash/アドレス検索 |
| **Lock Detail** | Lock Info | 全Lock情報 |
| | State Root (SR_0) | 状態ルート |
| | Unlock History | 関連Unlock履歴 |
| **Unlock Detail** | Unlock Info | 全Unlock情報 |
| | Prover Signatures | 署名Prover情報 |
| | Challenge Status | Challenge状況 |
| | Time Lock Status | Time Lock状況 |
| **Prover List** | Active Provers | アクティブProver一覧 |
| | Stake | Stake額 |
| | Performance | パフォーマンス指標 |
| | Slash History | Slash履歴 |
| **Governance** | Active Proposals | アクティブ提案 |
| | Past Proposals | 過去提案 |
| | Voting Stats | 投票統計 |

---

## 6. モバイル対応方針

### 6.1 対応範囲

| 機能 | モバイル対応 | 備考 |
|------|:-----------:|------|
| Lock/Unlock | ✅ | WalletConnect対応 |
| veQS Lock | ✅ | |
| Delegation | ✅ | |
| 投票 | ✅ | |
| Prover登録 | ⚠️ 一部 | 書類アップロードは非対応 |
| Prover Dashboard | ✅ | 閲覧のみ |
| Challenge | ⚠️ 一部 | 簡易版 |
| Council操作 | ❌ | デスクトップ推奨 |

### 6.2 レスポンシブブレークポイント

| サイズ | 幅 | 対象 |
|-------|-----|------|
| Mobile | < 768px | スマートフォン |
| Tablet | 768px - 1024px | タブレット |
| Desktop | > 1024px | デスクトップ |

---

## 7. 通知システム

### 7.1 通知種類

| 通知 | トリガー | 配信先 |
|------|---------|--------|
| Lock確定 | L1 Tx確認 | UI Toast, Email |
| Prover署名完了 | 2/5署名収集 | UI Toast, Push |
| Time Lock終了 | 24h/7d経過 | UI Toast, Email, Push |
| Challenge発生 | Challenge提起 | UI Alert, Email, Push |
| Slash発生 | Slash執行 | UI Alert, Email, Push |
| 投票開始 | 提案が投票期間へ | Email |
| 投票終了間近 | 終了24h前 | Email, Push |
| Stake不足 | 価格調整で不足 | UI Alert, Email |
| Emergency Pause | Pause発動 | 全ユーザーにAlert |

### 7.2 通知設定

| 設定項目 | オプション |
|---------|----------|
| Email通知 | ON/OFF |
| Push通知 | ON/OFF |
| 通知頻度 | 即時/日次ダイジェスト |
| 通知種類 | 個別ON/OFF |

---

## 8. アクセシビリティ要件

| 要件 | 対応 |
|------|------|
| WCAG 2.1 AA | 準拠 |
| キーボード操作 | 全機能対応 |
| スクリーンリーダー | ARIA対応 |
| コントラスト比 | 4.5:1以上 |
| フォントサイズ | 可変対応 |
| 言語 | 英語（初期）、日本語（Phase 2） |

---

## 9. 技術スタック推奨

| レイヤー | 技術 |
|---------|------|
| Frontend | Next.js 14 + TypeScript |
| UI Library | shadcn/ui + Tailwind CSS |
| State Management | Zustand / Jotai |
| Web3 | wagmi + viem |
| Dilithium | WASM (liboqs binding) |
| API | REST + WebSocket |
| Hosting | Vercel / Cloudflare Pages |

---

## 合意事項

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│  Step D: UI/UX要件 網羅的落とし込み 結果                                         │
├─────────────────────────────────────────────────────────────────────────────────┤
│                                                                                 │
│  【全体構成】                                                                    │
│  ✅ 6つのメインエリア定義（Public/Dashboard/Token/Governance/Prover/Council）  │
│  ✅ プレイヤー×画面アクセス権限マトリクス                                        │
│                                                                                 │
│  【シーケンス別UI/UX】                                                           │
│  ✅ #1 Lock: 4ステップフロー、Dilithium鍵管理UI                                 │
│  ✅ #2 Unlock (Normal): 6ステップフロー、24h Time Lock表示                      │
│  ✅ #3 Unlock (Emergency): 5ステップフロー、Bond表示                            │
│  ✅ #3' Resync: 自動/手動同期UI                                                 │
│  ✅ #4 Challenge: Monitor Dashboard、Challenge Form、Result                     │
│  ✅ #5 Prover Registration: 5ステップフロー、書類アップロード                   │
│  ✅ #6 Prover Exit: 4ステップフロー、Unbonding表示                              │
│  ✅ #7 Governance: 提案作成→投票→実行フロー                                    │
│  ✅ #8 Emergency: Council専用Dashboard                                         │
│                                                                                 │
│  【Token Hub】                                                                   │
│  ✅ veQS Lock/Unlock/Extend                                                     │
│  ✅ Delegation（Delegate一覧、委任、登録）                                       │
│  ✅ Rewards Dashboard                                                           │
│                                                                                 │
│  【Prover Portal】                                                               │
│  ✅ Dashboard（Performance、Stake、Alerts）                                     │
│  ✅ Delegation Settings                                                         │
│                                                                                 │
│  【Explorer】                                                                    │
│  ✅ Lock/Unlock詳細                                                             │
│  ✅ Prover一覧                                                                  │
│  ✅ Governance表示                                                              │
│                                                                                 │
│  【その他】                                                                      │
│  ✅ モバイル対応方針                                                            │
│  ✅ 通知システム                                                                │
│  ✅ アクセシビリティ要件                                                        │
│  ✅ 技術スタック推奨                                                            │
│                                                                                 │
└─────────────────────────────────────────────────────────────────────────────────┘
```

**投票結果**: 全エージェント賛成 ✅

---

## 出席エージェント

| エージェント | 役割 | 主な発言 |
|-------------|------|---------|
| CDO (Engineer) | 議長 | 全体構成、技術スタック |
| CTO | 技術 | シーケンス設計、API設計 |
| CSO | セキュリティ | 認証、アクセス制御 |
| CFO | 経済 | Token Hub設計 |
| CBO | ビジネス | ユーザー体験 |
| Legal | 法務 | アクセシビリティ |
| CEO (Kota) | 承認 | - |

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-05 | 初版作成 |

---

**END OF DOCUMENT**
