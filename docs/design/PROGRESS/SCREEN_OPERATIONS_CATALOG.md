# Quantum Shield 画面操作カタログ

> 作成日: 2026-01-27
> 目的: QS Admin設計のためのUI/UX参照資料

---

## 概要

このドキュメントは、Quantum Shieldの6つのアプリケーションにおける全画面・全操作を記録したカタログです。

### 対象アプリケーション

| # | アプリ | 画面数 | ベースURL |
|---|--------|:------:|-----------|
| 1 | Observer Portal | 7 | `/observer/` |
| 2 | Explorer | 8 | `/explorer/` |
| 3 | Consumer App | 10 | `/consumer/` |
| 4 | QS Hub | 6 | `/qs-hub/` |
| 5 | Prover Portal | 6 | `/prover/` |
| 6 | Governance | 4 | `/governance/` |

---

## 1. Observer Portal

### 1.1 Landing (`/observer/landing`)
**目的**: Observerになるための情報提供とCTA

**主要要素**:
- ヒーローセクション: 「Observerになる」タイトル + 説明
- ネットワーク統計: アクティブObserver数、監視中のLock数、検出したChallenge数、報酬総額
- 役割説明: Observerの3つの主要機能（監視、検証、報告）
- 報酬説明: 報酬の仕組みと計算方法
- 要件セクション: 技術要件とステーク要件
- CTAセクション: 「申請を開始」ボタン

**操作**:
- 「申請を開始」→ `/observer/application`
- 「ログイン」→ `/observer/login`
- 「要件を確認」→ ページ内スクロール
- 言語切替（EN）→ 英語版に切替

### 1.2 Dashboard (`/observer/dashboard`)
**目的**: Observer向けのメイン監視画面

**主要要素**:
- ヘッダー: ロゴ、ナビゲーション（ダッシュボード、チャレンジ、報酬、設定）、ウォレット接続
- 統計カード:
  - 監視中のLock数（例: 1,247件）
  - 検出したChallenge数（例: 23件）
  - 報酬残高（例: 45.32 ETH）
  - 稼働率（例: 99.8%）
- 監視状況グラフ: 時系列チャート（7D/30D/ALL切替）
- 最近のアクティビティリスト

**操作**:
- 期間切替（7D/30D/ALL）→ グラフ更新
- アクティビティ行クリック → 詳細ダイアログ表示
- ナビゲーションリンク → 各ページへ遷移

### 1.3 Challenges (`/observer/challenges`)
**目的**: 検出したChallengeの一覧と管理

**主要要素**:
- フィルタータブ: All / Pending / Active / Resolved
- Challengeリスト（テーブル形式）:
  - ID（CHG-0xXXXX形式）
  - タイプ（Suspicious Activity / Signature Mismatch / Timeout）
  - ステータスバッジ（Pending/Active/Resolved）
  - 報告日時
  - 対象Lock ID
- ページネーション

**操作**:
- フィルタータブ切替 → リスト絞り込み
- 行クリック → Challenge詳細ダイアログ

**Challenge詳細ダイアログ**:
- Challenge ID、タイプ、ステータス
- 対象Lock情報（ID、金額、所有者アドレス）
- タイムライン（検出→調査中→解決）
- エビデンス情報
- アクション: 「詳細を確認」「エスカレート」

### 1.4 Rewards (`/observer/rewards`)
**目的**: 報酬の確認と請求

**主要要素**:
- 報酬サマリー: 総獲得報酬、今月の報酬、未請求報酬
- 報酬履歴テーブル:
  - 日付
  - タイプ（Challenge報酬/監視報酬/ボーナス）
  - 金額（ETH）
  - ステータス
- 請求ボタン

**操作**:
- 「請求」ボタン → ウォレット署名リクエスト

### 1.5 Settings (`/observer/settings`)
**目的**: Observer設定の管理

**主要要素**:
- 通知設定:
  - メール通知（トグル）
  - プッシュ通知（トグル）
  - Challenge検出時の通知
  - 報酬受取時の通知
- 監視設定:
  - 監視間隔（ドロップダウン: 1分/5分/15分）
  - アラート閾値
- セキュリティ設定:
  - 2FA有効化
  - APIキー管理
- アカウント:
  - 接続ウォレット表示
  - ウォレット変更

**操作**:
- トグル切替 → 設定即時保存
- ドロップダウン選択 → 設定更新
- 「保存」ボタン → 設定保存確認

---

## 2. Explorer

### 2.1 Landing (`/explorer/landing`)
**目的**: Explorerの紹介とナビゲーション

**主要要素**:
- ヒーローセクション: 検索バー（Lock ID / アドレス検索）
- クイック統計: 総Lock数、総ロック額、アクティブProver数
- 最近のLock/Unlockリスト
- カテゴリーナビゲーション: Locks / Unlocks / Challenges / Provers

**操作**:
- 検索バー入力 → 検索結果表示
- カテゴリーカード → 各一覧ページへ

### 2.2 Locks List (`/explorer/locks`)
**目的**: 全Lockの一覧表示

**主要要素**:
- フィルター:
  - ステータス（All/Active/Unlocking/Completed）
  - 金額範囲
  - 期間
- Lockリスト（テーブル形式）:
  - Lock ID（0x形式、短縮表示）
  - 金額（ETH）
  - Dilithium公開鍵（短縮表示）
  - ステータスバッジ
  - 作成日時
- ソート: 金額/日時
- ページネーション

**操作**:
- フィルタードロップダウン → リスト絞り込み（Active選択で99件→45件に絞込確認済）
- 行クリック → Lock詳細ダイアログ

**Lock詳細ダイアログ**:
- Lock ID（完全表示、コピーボタン）
- 金額: 5.0 ETH
- ステータス: Active（グリーンバッジ）
- 所有者アドレス（コピーボタン）
- Dilithium公開鍵（完全表示、コピーボタン）
- 作成日時
- トランザクションハッシュ（Etherscanリンク）
- 「閉じる」「Etherscanで確認」ボタン

### 2.3 Unlocks List (`/explorer/unlocks`)
**目的**: 全Unlock（解除リクエスト）の一覧表示

**主要要素**:
- フィルター: ステータス（All/Pending/Completed/Emergency）
- Unlockリスト:
  - Unlock ID
  - 元Lock ID（リンク）
  - 金額
  - 方式（Normal/Emergency）
  - Time Lock残り時間（カウントダウン表示: 例「23:45:12」）
  - ステータス
  - Prover署名状況（3/5形式）
- ページネーション

**操作**:
- 行クリック → Unlock詳細ダイアログ

**Unlock詳細ダイアログ**:
- Unlock ID、元Lock ID
- 金額、方式
- Time Lock残り時間（大きなカウントダウン表示）
- Prover署名リスト:
  - Prover名/ID
  - 署名ステータス（✓ Signed / ⏳ Pending）
  - 署名日時
- 進捗: 3/5署名完了（プログレスバー）

### 2.4 Challenges List (`/explorer/challenges`)
**目的**: 全Challengeの一覧表示

**主要要素**:
- フィルター: ステータス（All/Pending/Investigating/Resolved/Rejected）
- Challengeリスト:
  - Challenge ID
  - タイプ
  - 対象Lock/Unlock ID
  - 報告者（Observer ID）
  - ステータスバッジ
  - 報告日時
- ページネーション

**操作**:
- 行クリック → 詳細ページ（`/explorer/challenges/[id]`）
  ※詳細ページは未実装（404）

### 2.5 Provers List (`/explorer/provers`)
**目的**: 全Proverの一覧表示

**主要要素**:
- Proverリスト（カード形式、8件表示）:
  - Prover名（Tokyo Validator等）
  - ステータスバッジ（Active/Inactive）
  - ステーク額（例: 150.0 ETH）
  - 稼働率（例: 99.98%）
  - 処理した署名数
  - 参加日
- ソート: ステーク額/稼働率/署名数

**操作**:
- カードクリック → Prover詳細ページ

### 2.6 Analytics (`/explorer/analytics`)
**目的**: ネットワーク全体の統計情報

**主要要素**:
- 概要統計:
  - 総ロック額（TVL）
  - 総Lock数
  - アクティブProver数
  - 平均Time Lock期間
- グラフセクション:
  - TVL推移グラフ（時系列）
  - Lock/Unlock件数グラフ
  - Prover稼働率グラフ
- 期間切替: 7D / 30D / 90D / 1Y / ALL

**操作**:
- 期間タブ切替 → グラフ更新
- グラフホバー → ツールチップ表示

---

## 3. Consumer App

### 3.1 Landing (`/consumer/landing`)
**目的**: サービス紹介とユーザー獲得

**主要要素**:
- ヒーローセクション:
  - 「量子時代の資産保護」タイトル
  - 説明文
  - CTAボタン「今すぐ保護を始める」「詳しく見る」
  - 日の丸ビジュアル（アニメーション）
- 統計セクション: 総保護額、アクティブユーザー数、保護完了数
- 機能紹介:
  - 量子耐性署名（SPHINCS+/Dilithium）
  - 24時間セキュリティ
  - マルチシグ保護
- 仕組み説明（3ステップ）:
  1. ウォレット接続
  2. 資産をロック
  3. 量子耐性で保護
- FAQ セクション（アコーディオン）
- フッター

**操作**:
- 「今すぐ保護を始める」→ `/consumer/onboarding`
- FAQアコーディオン → 開閉
- スクロールアニメーション

### 3.2 Onboarding (`/consumer/onboarding`)
**目的**: 新規ユーザーのウォレット接続

**主要要素**:
- ステップインジケーター（1/3）
- ウォレット選択:
  - MetaMask（人気バッジ）
  - WalletConnect（人気バッジ）
  - Coinbase Wallet
- 説明テキスト
- 「MetaMaskを入手」リンク

**操作**:
- ウォレット選択 → 接続フロー開始
- 接続成功 → ダッシュボードへ

### 3.3 Dashboard (`/consumer/dashboard`)
**目的**: メイン操作画面

**主要要素**:
- ヘッダー:
  - ロゴ
  - ナビゲーション（ダッシュボード、ロック、アンロック、履歴）
  - Ecosystemドロップダウン
  - 設定ボタン
  - ウォレット表示（短縮アドレス + 緑ドット）
- 資産サマリー:
  - 保護中の資産総額（例: 15.5 ETH）
  - 利用可能残高
  - ロック中の数
- ロックフォーム:
  - 金額入力（数値入力 + MAX/50%/25%ボタン）
  - 推定手数料表示
  - 「ロックする」ボタン
- 最近のアクティビティ

**操作**:
- 金額入力（5.0 ETH入力確認済）
- MAX/50%/25%ボタン → 金額自動入力
- 「ロックする」→ 確認ダイアログ
- ナビゲーション → 各ページへ

### 3.4 Lock Confirmation（ダイアログ）
**目的**: ロック操作の確認

**主要要素**:
- ロック金額表示
- 手数料内訳
- 合計金額
- 注意事項（24時間ロック期間等）
- 「確認してロック」「キャンセル」ボタン

**操作**:
- 「確認してロック」→ ウォレット署名 → 成功画面
- 「キャンセル」→ ダイアログ閉じる

### 3.5 Lock Success（ダイアログ/ページ）
**目的**: ロック成功の通知

**主要要素**:
- 成功アイコン（チェックマーク、アニメーション）
- 「ロック完了」タイトル
- ロック詳細:
  - Lock ID
  - 金額
  - Dilithium公開鍵（短縮）
- トランザクションハッシュ（Etherscanリンク）
- 「ダッシュボードに戻る」「詳細を見る」ボタン

### 3.6 Unlock (`/consumer/unlock`)
**目的**: アンロック操作

**主要要素**:
- ロック済み資産リスト:
  - Lock ID
  - 金額
  - ロック日時
  - ステータス
  - 選択チェックボックス
- アンロック方式選択:
  - 通常アンロック（24時間待機）
  - 緊急アンロック（7日待機、高手数料）
- 選択した資産の合計
- 「アンロックを申請」ボタン

**操作**:
- 資産選択 → 合計更新
- 方式選択（ラジオボタン）
- 「アンロックを申請」→ 確認ダイアログ

### 3.7 Unlock Success (`/consumer/unlock-success`)
**目的**: アンロック申請成功の通知

**主要要素**:
- 成功アイコン
- 「アンロック申請完了」タイトル
- Time Lockカウントダウン（23:59:59形式）
- 詳細:
  - 金額（10.00 ETH）
  - 推定完了時刻
  - トランザクションハッシュ
- 説明テキスト（Time Lock期間中の注意事項）
- 「履歴を見る」「ダッシュボードに戻る」ボタン

### 3.8 History (`/consumer/history`)
**目的**: トランザクション履歴の確認

**主要要素**:
- フィルター:
  - タイプ（All/Lock/Unlock）
  - 期間（過去7日/30日/全期間）
- 履歴リスト（テーブル形式）:
  - 日時
  - タイプ（Lock/Unlock、バッジ）
  - 金額
  - ステータス
  - トランザクションハッシュ（リンク）
- ページネーション

**操作**:
- フィルター変更 → リスト更新
- 行クリック → 詳細表示

### 3.9 Settings (`/consumer/settings`)
**目的**: ユーザー設定の管理

**主要要素**:
- 接続ウォレット:
  - アドレス表示
  - 「ウォレットを変更」ボタン
- 通知設定:
  - メール通知（トグル）
  - プッシュ通知（トグル）
- 表示設定:
  - 言語選択（日本語/English）
  - 通貨表示（ETH/USD/JPY）
  - テーマ（ダーク/ライト）
- セキュリティ:
  - トランザクション確認（トグル）
  - 高額取引警告（トグル）
- サポート:
  - FAQリンク
  - お問い合わせリンク

**操作**:
- トグル切替 → 設定保存
- ドロップダウン選択 → 設定更新

---

## 4. QS Hub (Token Hub + Governance)

### 4.1 Landing (`/qs-hub/landing`)
**目的**: QS Hubの紹介

**主要要素**:
- ヒーローセクション
- QSトークン説明
- veQS（投票エスクローQS）説明
- ロック期間と倍率の説明

### 4.2 Dashboard (`/qs-hub/dashboard`)
**目的**: トークン管理のメイン画面

**主要要素**:
- ヘッダー:
  - ナビゲーション（ダッシュボード、ロック、委任、報酬）
  - Ecosystemドロップダウン
  - 設定、ウォレット
- トークンサマリー:
  - QS残高
  - veQS残高
  - ロック中QS
  - 投票力
- ロックフォーム:
  - 金額入力
  - ロック期間選択（1週間/1ヶ月/3ヶ月/6ヶ月/1年/4年）
  - 獲得veQS表示（期間に応じた倍率）
  - 「ロックする」ボタン
- 現在のロック状況（リスト）

**操作**:
- 金額入力
- 期間選択 → veQS計算更新
- 「ロックする」→ 確認ダイアログ

### 4.3 Proposals (`/qs-hub/proposals`)
**目的**: ガバナンス提案の一覧と投票

**主要要素**:
- フィルタータブ: All / Active / Passed / Rejected
- 提案リスト:
  - 提案ID（QIP-XXX形式）
  - タイトル
  - ステータスバッジ（Active/Passed/Rejected）
  - 投票期限
  - 賛成/反対票（プログレスバー）
  - 投票率
- 「新規提案を作成」ボタン

**操作**:
- タブ切替 → リスト絞り込み
- 提案カード → 詳細ページ
- 「投票する」→ 投票ダイアログ

### 4.4 Rewards (`/qs-hub/rewards`)
**目的**: ステーキング報酬の確認と請求

**主要要素**:
- 報酬サマリー:
  - 累計報酬
  - 今期報酬
  - 未請求報酬
- 現在のEpoch情報:
  - Epoch番号
  - 残り時間
  - プログレスバー
- 報酬履歴テーブル
- 「報酬を請求」ボタン

**操作**:
- 「報酬を請求」→ ウォレット署名

### 4.5 Delegate (`/qs-hub/delegate`)
**目的**: 投票力の委任

**主要要素**:
- 現在の委任状況
- 委任先選択（アドレス入力またはリストから選択）
- 委任量入力
- 「委任する」ボタン

### 4.6 Settings (`/qs-hub/settings`)
**目的**: QS Hub設定

---

## 5. Prover Portal

### 5.1 Landing (`/prover/landing`)
**目的**: Proverになるための情報提供とCTA

**主要要素**:
- ヒーローセクション:
  - 「Proverになろう 未来を守りながら報酬を獲得」
  - 「量子耐性インフラ」バッジ
  - CTAボタン「Proverに申請する」「要件を確認」
  - 日の丸ビジュアル（アニメーション）
- ネットワーク統計:
  - 127 アクティブProver
  - $50.8M 総ステーク
  - 18.5% 年間ROI推定
  - 99.97% ネットワーク稼働率
- 仕組みセクション「Quantum Shieldとは」:
  - 量子耐性署名（SPHINCS+/Dilithium説明）
  - 分散型Proverネットワーク
  - 報酬とインセンティブ
- エコシステムカード（Consumer App, QS Hub）
- 要件セクション:
  - ステーク要件: $400,000
  - HSM要件: FIPS 140-2 L3+
  - SLA要件: 99.9% / 30s
  - 「すべての要件を見る」リンク
- ROI計算機:
  - ステーク額入力（150→200 ETH変更確認済）
  - 月間予想取引量入力（50000 ETH）
  - 予想稼働率入力（99.9%）
  - 結果表示:
    - 年間収益見込み: 240.48 ETH
    - 署名手数料: 240.00 ETH
    - パフォーマンスボーナス: 0.48 ETH
    - ステークROI: 120.2%（200 ETH時）
- 二次スラッシングリスク説明（テーブル）:
  | 違反Prover数 | スラッシング率 | 損失額 |
  |-------------|--------------|--------|
  | 1 Prover | 10% | $40,000 |
  | 2 Provers | 40% | $160,000 |
  | 3 Provers | 90% | $360,000 |
  | 4+ Provers | 100% | $400,000 |
- 専門家の声（NIST, Daniel J. Bernstein, Ethereum Foundation）
- 最終CTAセクション

**操作**:
- 「Proverに申請する」→ `/prover/application`
- 「ログイン」→ `/prover/login`
- ROI計算機の入力 → リアルタイム結果更新
- 言語切替（EN）→ 英語版

### 5.2 Requirements (`/prover/requirements`)
**目的**: Prover要件の詳細説明

**主要要素**:
- 基本要件:
  - ステーク要件: $400,000+
  - HSM認証: FIPS 140-2 Level 3+
  - 稼働率: 99.9%
  - 応答時間: < 30s
- 技術仕様:
  - CPU: 16コア以上（Intel Xeon推奨）
  - メモリ: 64GB以上（ECC RAM推奨）
  - ストレージ: 1TB NVMe SSD（RAID構成推奨）
  - ネットワーク: 1Gbps以上（冗長化必須）
- セキュリティ要件:
  - HSM認証
  - 鍵管理
  - アクセス制御
  - 監査ログ
  - インシデント対応
- 運用要件:
  - 可用性
  - 監視
  - バックアップ
  - アップデート
  - コミュニケーション
- スラッシングリスク:
  - 軽微な違反: 1-5%
  - 重大な違反: 5-25%
  - 致命的な違反: 25-100%
  - 二次スラッシング説明
- CTAセクション「申請を開始」「利用規約を確認」

**操作**:
- 「申請を開始」→ `/prover/application`

### 5.3 Login (`/prover/login`)
**目的**: 既存Proverのログイン

**主要要素**:
- シールドアイコン
- 「Prover Portalにログイン」タイトル
- 「登録済みのウォレットを接続してダッシュボードにアクセス」説明
- ウォレット選択:
  - MetaMask（人気バッジ）
  - WalletConnect（人気バッジ）
  - Coinbase Wallet
- 「MetaMaskを入手」リンク
- 「新規申請を開始」リンク

**操作**:
- ウォレット選択 → 接続フロー
- 接続成功 → ダッシュボードへ

### 5.4 Application (`/prover/application`)
**目的**: Prover申請の5ステップウィザード

**タブ切替**:
- パブリック申請（デフォルト）
- 企業版招待

**ステップインジケーター**: 1→2→3→4→5

#### Step 1: 基本情報
- 組織名（必須）: Sample Prover Inc.
- 国（必須）: 日本（195カ国のドロップダウン）
- ウェブサイト: https://sample-prover.io
- 連絡先メール（必須）: contact@sample-prover.io
- バリデーター経験: 3〜5年（ドロップダウン: 経験なし/1〜2年/3〜5年/5年以上）

#### Step 2: 技術要件
- チェックボックス:
  - ☑ FIPS 140-2 Level 3+ HSM（SPHINCS+鍵保管用）
  - ☑ 99.9%稼働率（24時間365日の監視と冗長インフラ）
  - ☑ 30秒応答時間（署名リクエストを30秒以内に処理）
  - ☑ 2-of-3+マルチシグ（マルチシグによる運用セキュリティ）
- HSMプロバイダー: AWS CloudHSM（ドロップダウン: Thales Luna/AWS CloudHSM/Azure Dedicated HSM/その他）
- インフラの場所: AWS Tokyo (ap-northeast-1)

#### Step 3: 法務・KYB
- 事業者識別番号（必須）: 1234567890123
  - 説明: 日本は法人番号(13桁)、米国はEIN、英国は会社登録番号、シンガポールはUEN等
- 事業者証明書類アップロード（PDF/JPG/PNG）
- 同意チェックボックス:
  - ☑ Prover利用規約を読み、スラッシングリスクを理解した上で同意
  - ☑ KYB（事業者確認）に同意し、必要に応じて追加書類を提供することに同意
  - ☑ 最低$400,000相当のETHのステークが必要であり、二次スラッシングの対象であることを理解

#### Step 4: ステークデポジット
- ステーク額選択（ラジオボタン）:
  - ○ 100 ETH: 最低ステーク額 - 基本的な処理枠
  - ◉ 200 ETH: 標準ステーク額 - 優先処理枠あり（選択済）
  - ○ 500 ETH: プレミアムステーク額 - 最優先処理 + ボーナス報酬
- ウォレット接続ボタン
- 重要事項:
  - ステークは最低180日間ロック
  - SLA違反時はQuadratic Slashingの対象
  - ステーク額に応じて報酬配分比率が決定
- ☑ ステーク額とロック期間、Slashingリスクを理解し、同意します

#### Step 5: 確認（未到達）
- 申請内容の最終確認
- 「申請を送信」ボタン

**企業版招待タブ**:
- 招待コード入力フィールド（例: ENT-INV-2026-XXXX）
- 「確認」ボタン（disabled状態）
- 説明: 招待コードは運営企業の管理者から送付されます

**操作**:
- フォーム入力 → バリデーション
- 「続ける」→ 次のステップへ
- 「戻る」→ 前のステップへ
- タブ切替 → パブリック/企業版切替

---

## 6. Governance

### 6.1 Landing (`/governance/landing`)
**目的**: ガバナンスの紹介

**主要要素**:
- ヒーローセクション
- ガバナンスの仕組み説明
- 投票力の説明（veQS）
- 提案プロセスの説明

### 6.2 Proposals (`/governance/proposals`)
**目的**: ガバナンス提案の一覧

（QS Hub Proposalsと同様）

### 6.3 Council (`/governance/council`)
**目的**: ガバナンス評議会の情報

**主要要素**:
- 評議会メンバーリスト
- 役割説明
- 選挙情報

### 6.4 Settings (`/governance/settings`)
**目的**: ガバナンス設定

---

## 共通UIパターン

### ヘッダー
- ロゴ（Quantum Shield + サブタイトル）
- 主要ナビゲーション（丸みを帯びたピル形状）
- Ecosystemドロップダウン:
  - Consumer App（Shield アイコン、hinomaru色）
  - QS Hub / Token Hub（Coins アイコン、gold色）
  - Governance（Vote アイコン、gold色）
  - Observer Portal（Eye アイコン、success色）
  - Prover Portal（Cpu アイコン、warning色）
  - Ecosystem概要リンク
- 設定ボタン（歯車アイコン、丸型）
- ウォレット接続ボタン（接続状態で緑ドット + 短縮アドレス）
- 言語切替（EN/JP）

### フッター
- ロゴ + 説明文
- プロダクトリンク
- リソースリンク（ホワイトペーパー、ブログ、GitHub）
- サポートリンク（FAQ、セキュリティ、お問い合わせ）
- 法的リンク（利用規約、プライバシーポリシー、リスク開示）
- コピーライト

### カラーパレット
- Background: #0a0a0a (ダーク)
- Surface: #121212
- Gold: #D4AF37 (ブランドカラー)
- Hinomaru: #BC002D (日の丸)
- Success: #10B981 (グリーン)
- Warning: #F59E0B (オレンジ)
- Error: #EF4444 (レッド)

### ボタンスタイル
- Primary: Gold背景、ダークテキスト
- Secondary: 透明背景、Gold枠線
- Danger: Hinomaru背景
- Disabled: 50%透明度

### フォーム要素
- 入力フィールド: ダーク背景、枠線、フォーカス時Gold枠
- ドロップダウン: 同様のスタイル
- チェックボックス: Hinomaru色でチェック
- ラジオボタン: 選択時Hinomaru背景
- トグルスイッチ: Success色でON状態

### テーブル
- ヘッダー: 背景色付き
- 行: ホバー時ハイライト
- ソート: 昇順/降順アイコン
- ページネーション: 数字ボタン + 前後ナビ

### カード
- 丸みを帯びた角（border-radius）
- 軽い影
- ホバー時の上昇効果

### モーダル/ダイアログ
- 中央配置
- オーバーレイ背景
- 閉じるボタン（右上）
- アクションボタン（下部）

### ステータスバッジ
- Active: グリーン
- Pending: オレンジ
- Completed: グリーン
- Failed/Rejected: レッド
- Investigating: イエロー

---

## データモデル参照

### Lock
```typescript
{
  id: string;          // 0x形式のハッシュ
  amount: string;      // ETH単位
  owner: string;       // ウォレットアドレス
  dilithiumPubKey: string;
  status: 'active' | 'unlocking' | 'completed';
  createdAt: Date;
  txHash: string;
}
```

### Unlock
```typescript
{
  id: string;
  lockId: string;
  amount: string;
  method: 'normal' | 'emergency';
  timeLockEnd: Date;
  status: 'pending' | 'completed';
  proverSignatures: {
    proverId: string;
    signed: boolean;
    signedAt?: Date;
  }[];
}
```

### Challenge
```typescript
{
  id: string;          // CHG-0x形式
  type: 'suspicious_activity' | 'signature_mismatch' | 'timeout';
  targetId: string;    // Lock/Unlock ID
  reporterId: string;  // Observer ID
  status: 'pending' | 'investigating' | 'resolved' | 'rejected';
  reportedAt: Date;
  evidence?: string;
}
```

### Prover
```typescript
{
  id: string;
  name: string;
  status: 'active' | 'inactive';
  stakeAmount: string;
  uptime: number;      // パーセンテージ
  signaturesProcessed: number;
  joinedAt: Date;
}
```

---

## 作成者情報

このカタログは、Playwright MCPを使用して全画面を実際に操作し、その内容を記録したものです。

**記録日時**: 2026-01-27
**対象環境**: localhost:3000（開発環境）
**言語**: 日本語
