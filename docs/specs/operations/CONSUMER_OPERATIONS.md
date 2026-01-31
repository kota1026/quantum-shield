# Consumer App 操作カタログ

> **Version**: 1.0
> **作成日**: 2026-01-26
> **対象画面数**: 28画面
> **Phase 1 P1-1**

---

## 概要

Consumer Appは一般ユーザー向けの資産保護アプリケーションです。
量子耐性暗号（Dilithium署名）を使用して、ユーザーのETH資産をロック・アンロックする機能を提供します。

### 主要フロー

1. **オンボーディング**: ウォレット接続 → Dilithiumキー生成 → バックアップ → 開始
2. **ロック**: ダッシュボード → ロック画面 → 確認モーダル → 処理中 → 成功
3. **通常アンロック**: ダッシュボード → アンロック選択 → 処理中 → 24時間待機 → 完了
4. **緊急アンロック**: アンロック選択 → 保証金確認 → 処理中 → 7日間チャレンジ期間 → 完了

---

## 画面一覧

| No | 画面ID | パス | 日本語名 | 状態 |
|----|--------|------|----------|:----:|
| 01 | landing | `/consumer/landing` | ランディング | 実装済 |
| 02 | login | `/consumer/login` | ログイン | 実装済 |
| 03 | onboarding | `/consumer/onboarding` | オンボーディング | 実装済 |
| 04 | wallet-connect | `/consumer/wallet-connect` | ウォレット接続 | 実装済 |
| 05 | dashboard | `/consumer/dashboard` | ダッシュボード | 実装済 |
| 06 | lock | `/consumer/lock` | ロック | 実装済 |
| 07 | lock-processing | `/consumer/lock/processing` | ロック処理中 | 実装済 |
| 08 | lock-success | `/consumer/lock/success` | ロック成功 | 実装済 |
| 09 | unlock | `/consumer/unlock` | アンロック選択 | 実装済 |
| 10 | unlock-processing | `/consumer/unlock/processing` | アンロック処理中 | 実装済 |
| 11 | unlock-success | `/consumer/unlock/success` | アンロック成功 | 実装済 |
| 12 | emergency-bond | `/consumer/emergency-bond` | 緊急アンロック保証金 | 実装済 |
| 13 | emergency-processing | `/consumer/emergency-processing` | 緊急アンロック処理中 | 実装済 |
| 14 | emergency-success | `/consumer/emergency-success` | 緊急アンロック成功 | 実装済 |
| 15 | history | `/consumer/history` | 取引履歴 | 実装済 |
| 16 | history-detail | `/consumer/history/[id]` | 取引詳細 | 実装済 |
| 17 | settings | `/consumer/settings` | 設定 | 実装済 |
| 18 | key-management | `/consumer/key-management` | 鍵管理 | 実装済 |
| 19 | notifications | `/consumer/notifications` | 通知 | 実装済 |
| 20 | faq | `/consumer/faq` | FAQ | 実装済 |
| 21 | help | `/consumer/help` | ヘルプ | 実装済 |
| 22 | contact | `/consumer/contact` | お問い合わせ | 実装済 |
| 23 | terms | `/consumer/terms` | 利用規約 | 実装済 |
| 24 | privacy | `/consumer/privacy` | プライバシーポリシー | 実装済 |
| 25 | cookie | `/consumer/cookie` | クッキーポリシー | 実装済 |
| 26 | security | `/consumer/security` | セキュリティ | 実装済 |
| 27 | how-it-works | `/consumer/how-it-works` | 仕組み説明 | 実装済 |

---

## 画面別操作カタログ

### 01. Landing (`/consumer/landing`)

#### 画面概要
Consumer Appの最初のランディングページ。量子耐性暗号の価値提案を伝え、ユーザーをオンボーディングへ誘導する。

#### UI要素と操作

| ID | 要素 | 種類 | 操作 | 遷移先 | データ |
|----|------|------|------|--------|--------|
| L01 | Skip to main content | リンク | クリック | - | - |
| L02 | ヘッダーロゴ | リンク | クリック | `/consumer/landing` | - |
| L03 | 「始める」ボタン | Button (primary) | クリック | `/consumer/onboarding` | - |
| L04 | 「仕組みを見る」ボタン | Button (secondary) | クリック | `#how-it-works` | - |
| L05 | Stats Cards | 表示のみ | - | - | TVL, Active Provers, Time Lock, Incidents |
| L06 | Feature Cards | 表示 + Tooltip | ホバー | - | Dilithium, TimeLock, SMT, Self-Custody, Emergency, Transparency |
| L07 | Step Cards | 表示のみ | - | - | 3ステップの説明 |
| L08 | 「詳しく見る」リンク | リンク | クリック | `/consumer/how-it-works` | - |
| L09 | Expert Quotes | 表示 + 外部リンク | クリック | 外部URL | - |
| L10 | Probability Timeline | 表示のみ | - | - | 量子脅威確率 |
| L11 | CTA Button | Button (secondary) | クリック | `/consumer/onboarding` | - |
| L12 | Footer Links | リンク | クリック | 各ページ | - |
| L13 | Cookie Banner | Banner + Button | クリック | - | Cookie同意 |

#### データフロー

```
入力データ: なし（静的コンテンツ）
出力データ: Cookie同意状態（localStorage）
```

---

### 02. Login (`/consumer/login`)

#### 画面概要
既存ユーザーのログイン画面。ウォレット接続でログイン。

#### UI要素と操作

| ID | 要素 | 種類 | 操作 | 遷移先 | データ |
|----|------|------|------|--------|--------|
| LG01 | 戻るボタン | リンク | クリック | `/consumer/landing` | - |
| LG02 | ウォレット接続ボタン | Button | クリック | RainbowKit Modal | - |
| LG03 | RainbowKit Modal | Modal | ウォレット選択 | `/consumer/dashboard` | WalletAddress |

#### データフロー

```
入力データ: なし
出力データ:
  - walletAddress: string (wagmi)
  - isConnected: boolean (wagmi)
```

---

### 03. Onboarding (`/consumer/onboarding`)

#### 画面概要
新規ユーザーのオンボーディング。4ステップで完了。

#### UI要素と操作

**Step 1: ウォレット接続**

| ID | 要素 | 種類 | 操作 | 遷移先 | データ |
|----|------|------|------|--------|--------|
| O101 | 戻るボタン | リンク | クリック | `/consumer/landing` | - |
| O102 | Progress Bar | 表示のみ | - | - | currentStep |
| O103 | MetaMask Option | Button | クリック | RainbowKit | - |
| O104 | WalletConnect Option | Button | クリック | RainbowKit | - |
| O105 | Coinbase Option | Button | クリック | RainbowKit | - |
| O106 | 「ウォレットとは？」リンク | Button | クリック | walletHelp Modal | - |
| O107 | WalletHelp Modal | Modal | 閉じる | - | - |

**Step 2: キー生成**

| ID | 要素 | 種類 | 操作 | 遷移先 | データ |
|----|------|------|------|--------|--------|
| O201 | Self-Custody Notice | 表示のみ | - | - | - |
| O202 | Key Visual | Animation | - | - | - |
| O203 | 「Dilithiumとは？」リンク | Button | クリック | Dilithium Modal | - |
| O204 | 「キーを生成」ボタン | Button (primary) | クリック | Step 3へ | DilithiumKeyPair |
| O205 | Progress Bar | 表示 | - | - | generationProgress |
| O206 | Dilithium Modal | Modal | 閉じる | - | - |

**Step 3: バックアップ**

| ID | 要素 | 種類 | 操作 | 遷移先 | データ |
|----|------|------|------|--------|--------|
| O301 | Warning Box | 表示のみ | - | - | - |
| O302 | 「ダウンロード」ボタン | Button | クリック | ファイルDL | BackupFile (JSON) |
| O303 | 「ダウンロード済み」チェック | Checkbox | チェック | - | checkDownloaded |
| O304 | 「安全に保存済み」チェック | Checkbox | チェック | - | checkSaved |
| O305 | 「続ける」ボタン | Button (primary) | クリック | Step 4へ | - |

**Step 4: 完了**

| ID | 要素 | 種類 | 操作 | 遷移先 | データ |
|----|------|------|------|--------|--------|
| O401 | Success Icon | 表示のみ | - | - | - |
| O402 | Features List | 表示のみ | - | - | - |
| O403 | 「ダッシュボードへ」ボタン | Button (primary) | クリック | `/consumer/dashboard` | - |
| O404 | 「チュートリアル」リンク | Button | クリック | Tutorial Modal | - |
| O405 | Tutorial Modal | Modal | 閉じる | - | - |

#### データフロー

```
入力データ: なし
生成データ:
  - publicKey: string (Dilithium public key)
  - privateKey: string (暗号化済み、バックアップファイルに含まれる)
  - backupFile: JSON {
      version: "1.0",
      algorithm: "Dilithium-III",
      created: ISO8601,
      encrypted_private_key: string,
      public_key: string
    }
出力データ:
  - walletAddress: string (wagmi経由)
  - isConnected: boolean
  - keyPair: ローカルに保存（IndexedDB or localStorage）
```

---

### 04. Dashboard (`/consumer/dashboard`)

#### 画面概要
ログイン後のメイン画面。資産残高、最近のアクティビティを表示。

#### UI要素と操作

| ID | 要素 | 種類 | 操作 | 遷移先 | データ |
|----|------|------|------|--------|--------|
| D01 | Header Logo | リンク | クリック | `/consumer/dashboard` | - |
| D02 | Nav: ダッシュボード | NavLink | クリック | `/consumer/dashboard` | - |
| D03 | Nav: ロック | Button | クリック | LockAssetCard にスクロール | - |
| D04 | Nav: アンロック | NavLink | クリック | `/consumer/unlock` | - |
| D05 | Nav: 履歴 | NavLink | クリック | `/consumer/history` | - |
| D06 | Ecosystem Dropdown | Dropdown | クリック | - | isMenuOpen |
| D07 | Ecosystem > Consumer App | MenuLink | クリック | `/consumer/dashboard` | - |
| D08 | Ecosystem > QS Hub | MenuLink | クリック | `/qs-hub/dashboard` | - |
| D09 | Ecosystem > Ecosystem | MenuLink | クリック | `/ecosystem` | - |
| D10 | Settings Button | リンク | クリック | `/consumer/settings` | - |
| D11 | Wallet Button | Button | クリック | WalletModal | walletAddress |
| D12 | StatCard: Total Locked | Card (clickable) | クリック | `/consumer/history` | totalLocked |
| D13 | StatCard: Available | Card (clickable) | クリック | `/consumer/unlock` | available |
| D14 | StatCard: Pending | Card (clickable) | クリック | `/consumer/unlock` | pendingUnlock |
| D15 | StatCard: Transactions | Card (clickable) | クリック | `/consumer/history` | transactions |
| D16 | LockAssetCard | Card | - | - | balance |
| D17 | Lock Amount Input | Input (number) | 入力 | - | amount |
| D18 | Quick Amount: 25% | Button | クリック | - | amount = balance * 0.25 |
| D19 | Quick Amount: 50% | Button | クリック | - | amount = balance * 0.50 |
| D20 | Quick Amount: 75% | Button | クリック | - | amount = balance * 0.75 |
| D21 | Quick Amount: MAX | Button | クリック | - | amount = balance |
| D22 | 「ロックする」ボタン | Button (primary) | クリック | LockModal | - |
| D23 | LockModal | Modal | - | - | amount |
| D24 | LockModal > キャンセル | Button (outline) | クリック | Modal閉じる | - |
| D25 | LockModal > 確認 | Button (primary) | クリック | `/consumer/lock/processing` | amount |
| D26 | RecentActivity | List | - | - | Transaction[] |
| D27 | RecentActivity Item | Card (clickable) | クリック | `/consumer/history/{id}` | transactionId |
| D28 | 「すべて見る」リンク | リンク | クリック | `/consumer/history` | - |
| D29 | WalletModal | Modal | - | - | address |
| D30 | WalletModal > コピー | Button | クリック | - | clipboard |
| D31 | WalletModal > 切断 | Button (danger) | クリック | `/consumer` | - |
| D32 | MobileNav | BottomNav | - | - | - |

#### データフロー

```
入力データ（API/Mock）:
  - totalLocked: number (ETH)
  - available: number (ETH)
  - pendingUnlock: number (件数)
  - transactions: number (総取引数)
  - recentTransactions: Transaction[] {
      id: string,
      type: 'lock' | 'unlocking' | 'unlock',
      amount: string,
      timestamp: string,
      status: 'complete' | 'pending'
    }

出力データ:
  - lockAmount: number (ロック金額入力)
  → /consumer/lock/processing?amount={lockAmount}
```

---

### 05. Lock (`/consumer/lock`)

#### 画面概要
資産ロック専用画面（ダッシュボードからも可能だが、より詳細な設定可能）。

#### UI要素と操作

| ID | 要素 | 種類 | 操作 | 遷移先 | データ |
|----|------|------|------|--------|--------|
| LK01 | 戻るボタン | リンク | クリック | `/consumer/dashboard` | - |
| LK02 | Badge: 量子耐性保護 | Badge + Tooltip | ホバー | - | - |
| LK03 | HinomaryVisual | Animation | - | - | - |
| LK04 | Lock Amount Input | Input | 入力 | - | amount |
| LK05 | Available Balance | 表示 | - | - | balance |
| LK06 | Quick Amount Buttons | Button Group | クリック | - | amount |
| LK07 | Period Selection | RadioGroup | 選択 | - | period: 1|2|3|5 years |
| LK08 | Lock Summary | Card | - | - | amount, period, unlockDate, fee |
| LK09 | 「資産をロック」ボタン | Button (primary) | クリック | LockConfirmModal | - |
| LK10 | Dilithium Tooltip | Tooltip | ホバー | - | - |
| LK11 | Info Section | Card | - | - | - |
| LK12 | LockConfirmModal | Modal | - | - | amount, period, unlockDate |
| LK13 | Modal > キャンセル | Button (outline) | クリック | Modal閉じる | - |
| LK14 | Modal > 確認 | Button (primary) | クリック | `/consumer/lock/processing` | amount, period |

#### データフロー

```
入力データ:
  - balance: number (ETH) - Demo: 12.50

入力（ユーザー）:
  - amount: number (0.01 ~ balance)
  - period: 1 | 2 | 3 | 5 (年)

計算データ:
  - unlockDate: Date (now + period years)
  - estimatedGas: string ("~0.005 ETH")

出力データ:
  → /consumer/lock/processing?amount={amount}&period={period}
```

---

### 06. Lock Processing (`/consumer/lock/processing`)

#### 画面概要
ロックトランザクション処理中の進捗表示。

#### UI要素と操作

| ID | 要素 | 種類 | 操作 | 遷移先 | データ |
|----|------|------|------|--------|--------|
| LP01 | Loading Animation | Animation | - | - | - |
| LP02 | Title | 表示 | - | - | - |
| LP03 | Step 1: Dilithium署名 | Step + Tooltip | - | - | status |
| LP04 | Step 2: TX作成 | Step | - | - | status |
| LP05 | Step 3: ブロードキャスト | Step | - | - | status |
| LP06 | Step 4: 確認 | Step | - | - | status |
| LP07 | TX Hash | 表示 | - | - | txHash |

#### データフロー

```
入力データ（URL params）:
  - amount: string
  - period: string

処理中データ:
  - steps: Step[] { id, status: 'pending'|'active'|'complete' }
  - txHash: string (generated/mock)

出力データ:
  → /consumer/lock/success?amount={amount}&period={period}&txHash={txHash}

処理時間: ~5秒（Demo）
```

---

### 07. Lock Success (`/consumer/lock/success`)

#### 画面概要
ロック完了画面。

#### UI要素と操作

| ID | 要素 | 種類 | 操作 | 遷移先 | データ |
|----|------|------|------|--------|--------|
| LS01 | Success Icon | Animation | - | - | - |
| LS02 | Title | 表示 | - | - | - |
| LS03 | Lock Details Card | Card | - | - | - |
| LS04 | Lock ID / TX Hash | 表示 + Copy | クリック | - | clipboard |
| LS05 | Amount | 表示 | - | - | amount |
| LS06 | Period | 表示 | - | - | period |
| LS07 | Unlock Date | 表示 | - | - | unlockDate |
| LS08 | 「ダッシュボードへ」ボタン | Button (primary) | クリック | `/consumer/dashboard` | - |
| LS09 | 「履歴を見る」ボタン | Button (outline) | クリック | `/consumer/history` | - |

#### データフロー

```
入力データ（URL params）:
  - amount: string
  - period: string
  - txHash: string

計算データ:
  - unlockDate: Date (now + period years)

出力データ: なし（遷移のみ）
```

---

### 08. Unlock (`/consumer/unlock`)

#### 画面概要
アンロック方法選択画面。ロック済み資産を選択し、通常または緊急アンロックを選択。

#### UI要素と操作

| ID | 要素 | 種類 | 操作 | 遷移先 | データ |
|----|------|------|------|--------|--------|
| U01 | 戻るボタン | リンク | クリック | `/consumer/dashboard` | - |
| U02 | Section: ロック選択 | Section | - | - | - |
| U03 | LockCard 1 | RadioCard | 選択 | - | selectedLockId |
| U04 | LockCard 2 | RadioCard | 選択 | - | selectedLockId |
| U05 | LockCard 3 (Pending) | RadioCard | 選択 | - | selectedLockId, remainingTime |
| U06 | Section: 方法選択 | Section | - | - | - |
| U07 | MethodCard: 通常アンロック | RadioCard | 選択 | - | selectedMethod: 'normal' |
| U08 | MethodCard: 緊急アンロック | RadioCard | 選択 | - | selectedMethod: 'emergency' |
| U09 | 「?」ボタン（通常） | Button | クリック | TimeLockModal | - |
| U10 | TimeLockModal | Modal | 閉じる | - | - |
| U11 | Emergency Warning | Alert | - | - | - |
| U12 | 「アンロック開始」ボタン | Button (primary) | クリック | 遷移先は方法による | - |

#### データフロー

```
入力データ（Demo）:
  - locks: LockItem[] {
      id: string,
      number: number,
      amount: string,
      timestamp: string,
      status: 'locked' | 'pending',
      remainingTime?: string
    }

入力（ユーザー）:
  - selectedLockId: string
  - selectedMethod: 'normal' | 'emergency'

出力データ:
  - 通常: → /consumer/unlock/processing?lockId={selectedLockId}
  - 緊急: → /consumer/emergency-bond?lockId={selectedLockId}
```

---

### 09. Unlock Processing (`/consumer/unlock/processing`)

#### 画面概要
通常アンロック処理中の進捗表示。

#### UI要素と操作

| ID | 要素 | 種類 | 操作 | 遷移先 | データ |
|----|------|------|------|--------|--------|
| UP01 | Loading Animation | Animation | - | - | - |
| UP02 | Title | 表示 | - | - | - |
| UP03 | Step 1: Dilithium署名 | Step + Tooltip | - | - | status |
| UP04 | Step 2: Prover検証 | Step + Tooltip | - | - | status |
| UP05 | Step 3: ブロードキャスト | Step | - | - | status |
| UP06 | Step 4: 確認 | Step | - | - | status |
| UP07 | TX Hash | Link (外部) | クリック | Etherscan | txHash |

#### データフロー

```
入力データ（URL params）:
  - lockId: string

処理中データ:
  - steps: Step[]
  - txHash: string

出力データ:
  → /consumer/unlock/success

処理時間: ~5秒（Demo）
```

---

### 10. Unlock Success (`/consumer/unlock/success`)

#### 画面概要
通常アンロック開始成功画面。24時間タイムロック待機開始を通知。

#### UI要素と操作

| ID | 要素 | 種類 | 操作 | 遷移先 | データ |
|----|------|------|------|--------|--------|
| US01 | Success Icon | Animation | - | - | - |
| US02 | Title | 表示 | - | - | - |
| US03 | TimeLock Info Card | Card | - | - | - |
| US04 | Countdown | 表示 | - | - | 23:59:59 (Demo) |
| US05 | Details: Amount | 表示 | - | - | amount |
| US06 | Details: Completion | 表示 | - | - | estimatedCompletion |
| US07 | Details: TX Hash | Link (外部) | クリック | Etherscan | txHash |
| US08 | Info Message | 表示 | - | - | - |
| US09 | 「履歴を見る」ボタン | Button (secondary) | クリック | `/consumer/history` | - |
| US10 | 「ダッシュボードへ」ボタン | Button (primary) | クリック | `/consumer/dashboard` | - |

#### データフロー

```
表示データ（Demo）:
  - amount: "10.00 ETH"
  - estimatedCompletion: "2026-01-16 12:00"
  - txHash: "0x8b4e...1d3f"
  - countdown: "23:59:59"

出力データ: なし（遷移のみ）
```

---

### 11. Emergency Bond (`/consumer/emergency-bond`)

#### 画面概要
緊急アンロックの保証金確認画面。

#### UI要素と操作

| ID | 要素 | 種類 | 操作 | 遷移先 | データ |
|----|------|------|------|--------|--------|
| EB01 | 戻るボタン | リンク | クリック | `/consumer/unlock` | - |
| EB02 | Warning Banner | Alert | - | - | - |
| EB03 | Bond Card | Card | - | - | - |
| EB04 | Unlock Amount | 表示 | - | - | amount |
| EB05 | Wait Time | 表示 | - | - | 7日間 |
| EB06 | Bond Formula | 表示 | - | - | MAX(0.5 ETH, amount × 5%) |
| EB07 | Required Bond | 表示 | - | - | bondAmount |
| EB08 | Info List | List | - | - | - |
| EB09 | Confirmation Checkbox | Checkbox | チェック | - | isConfirmed |
| EB10 | 「キャンセル」ボタン | リンク | クリック | `/consumer/unlock` | - |
| EB11 | 「保証金を預託」ボタン | Button (warning) | クリック | `/consumer/emergency-processing` | - |

#### データフロー

```
入力データ（Demo）:
  - amount: 10.00 ETH
  - waitDays: 7

計算データ:
  - bondAmount: MAX(0.5, amount * 0.05) = 0.5 ETH

入力（ユーザー）:
  - isConfirmed: boolean

出力データ:
  → /consumer/emergency-processing (isConfirmed && !isSubmitting)
```

---

### 12. History (`/consumer/history`)

#### 画面概要
全取引履歴一覧。フィルタリング機能付き。

#### UI要素と操作

| ID | 要素 | 種類 | 操作 | 遷移先 | データ |
|----|------|------|------|--------|--------|
| H01 | 戻るボタン | リンク | クリック | `/consumer/dashboard` | - |
| H02 | 「CSV出力」ボタン | Button | クリック | - | (未実装) |
| H03 | Stats: Total Locked | 表示 | - | - | totalLocked |
| H04 | Stats: Total TX | 表示 | - | - | totalTransactions |
| H05 | Stats: In Progress | 表示 | - | - | inProgress |
| H06 | Filter: すべて | Tab | クリック | - | activeFilter: 'all' |
| H07 | Filter: ロック | Tab | クリック | - | activeFilter: 'lock' |
| H08 | Filter: アンロック | Tab | クリック | - | activeFilter: 'unlock' |
| H09 | Filter: 待機中 | Tab | クリック | - | activeFilter: 'pending' |
| H10 | Filter: 緊急 | Tab | クリック | - | activeFilter: 'emergency' |
| H11 | History List | List | - | - | filteredTransactions |
| H12 | HistoryItem | Card (clickable) | クリック | `/consumer/history/{id}` | transactionId |
| H13 | Empty State | 表示 | - | - | - |
| H14 | 「もっと見る」ボタン | Button (ghost) | クリック | - | (未実装) |

#### データフロー

```
入力データ（Demo）:
  - stats: {
      totalLocked: "24.85 ETH",
      totalTransactions: 15,
      inProgress: 2
    }
  - transactions: HistoryTransaction[] {
      id: string,
      type: 'lock' | 'normalUnlock' | 'emergencyUnlock' | 'unlockComplete',
      status: 'complete' | 'pending24h' | 'pending7d',
      amount: string,
      timestamp: string,
      txHash: string,
      blockConfirmed?: number,
      remainingTime?: string,
      bondAmount?: string
    }

入力（ユーザー）:
  - activeFilter: FilterType

計算データ:
  - filteredTransactions: Transaction[] (フィルタリング済み)

出力データ:
  → /consumer/history/{id}
```

---

### 13. History Detail (`/consumer/history/[id]`)

#### 画面概要
単一取引の詳細表示。タイムライン、詳細情報を表示。

#### UI要素と操作

| ID | 要素 | 種類 | 操作 | 遷移先 | データ |
|----|------|------|------|--------|--------|
| HD01 | 戻るボタン | リンク | クリック | `/consumer/history` | - |
| HD02 | Transaction Type Icon | 表示 | - | - | type |
| HD03 | Transaction Type Label | 表示 | - | - | type |
| HD04 | Status Badge | Badge | - | - | status |
| HD05 | Amount | 表示 | - | - | amount |
| HD06 | TX Hash | 表示 + Copy + Link | クリック | Etherscan / clipboard | txHash |
| HD07 | Date | 表示 | - | - | timestamp |
| HD08 | Confirmations | 表示 + Tooltip | - | - | blockConfirmed |
| HD09 | Bond Amount | 表示 + Tooltip | - | - | bondAmount |
| HD10 | Remaining Time | 表示 | - | - | remainingTime |
| HD11 | Timeline | List | - | - | timelineSteps |
| HD12 | 「履歴に戻る」ボタン | Button (ghost) | クリック | `/consumer/history` | - |
| HD13 | 「アンロック状況」ボタン | Button (secondary) | クリック | `/consumer/unlock` | - |

#### データフロー

```
入力データ:
  - transaction: HistoryTransaction {
      id: string,
      type: TransactionType,
      status: TransactionStatus,
      amount: string,
      timestamp: string,
      txHash: string,
      blockConfirmed?: number,
      remainingTime?: string,
      bondAmount?: string
    }

計算データ:
  - timelineSteps: Step[] (typeに応じて動的生成)

出力データ: なし（遷移のみ）
```

---

### 14. Settings (`/consumer/settings`)

#### 画面概要
ユーザー設定画面。アカウント、通知、表示、セキュリティ設定。

#### UI要素と操作

| ID | 要素 | 種類 | 操作 | 遷移先 | データ |
|----|------|------|------|--------|--------|
| S01 | 戻るボタン | リンク | クリック | `/consumer/dashboard` | - |
| S02 | Section: アカウント | Section | - | - | - |
| S03 | 鍵管理 | SettingsItem | クリック | `/consumer/key-management` | - |
| S04 | 接続済みウォレット | SettingsItem | クリック | - | walletAddress |
| S05 | Section: 通知 | Section | - | - | - |
| S06 | プッシュ通知 | SettingsItem + Toggle | トグル | - | pushNotifications |
| S07 | メール通知 | SettingsItem + Toggle | トグル | - | emailNotifications |
| S08 | Section: 表示 | Section | - | - | - |
| S09 | ダークモード | SettingsItem + Toggle | トグル | - | darkMode |
| S10 | 言語 | SettingsItem + Value | クリック | - | locale: 'ja' | 'en' |
| S11 | 通貨 | SettingsItem + Value | クリック | - | currency |
| S12 | Section: セキュリティ | Section | - | - | - |
| S13 | 自動ロック | SettingsItem + Value | クリック | - | autoLockMinutes |
| S14 | 生体認証 | SettingsItem + Toggle | トグル | - | biometricAuth |
| S15 | Section: サポート | Section | - | - | - |
| S16 | FAQ | SettingsItem | クリック | `/consumer/faq` | - |
| S17 | お問い合わせ | SettingsItem | クリック | `/consumer/contact` | - |
| S18 | 利用規約 | SettingsItem | クリック | `/consumer/terms` | - |
| S19 | Section: 危険ゾーン | Section (danger) | - | - | - |
| S20 | ウォレット切断 | SettingsItem (danger) | クリック | confirm → `/consumer` | - |
| S21 | Version Info | Footer | - | - | version, build |

#### データフロー

```
入力データ（Demo/Storage）:
  - walletAddress: "0x7a3f...9c2d"
  - pushNotifications: boolean
  - emailNotifications: boolean
  - darkMode: boolean
  - locale: 'ja' | 'en'
  - currency: 'JPY (¥)' | 'USD ($)' | 'EUR (€)'
  - autoLockMinutes: 5 | 10 | 15 | 30
  - biometricAuth: boolean

出力データ:
  - 各設定値の変更（localStorage/API）
  - locale変更時: URL locale prefix 変更
```

---

### 15. Key Management (`/consumer/key-management`)

#### 画面概要
Dilithium鍵の管理画面。公開鍵表示、バックアップ、エクスポート、再生成。

#### UI要素と操作

| ID | 要素 | 種類 | 操作 | 遷移先 | データ |
|----|------|------|------|--------|--------|
| KM01 | 戻るボタン | リンク | クリック | `/consumer/settings` | - |
| KM02 | Warning Box | Alert | - | - | - |
| KM03 | Public Key Display | Code Block | - | - | publicKey |
| KM04 | Dilithium Tooltip | Tooltip | ホバー | - | - |
| KM05 | Status Badge | Badge | - | - | "有効" |
| KM06 | 「コピー」ボタン | Button | クリック | - | clipboard |
| KM07 | Section: 鍵管理 | Section | - | - | - |
| KM08 | バックアップ | ActionItem | クリック | BackupModal | - |
| KM09 | 秘密鍵を表示 | ActionItem | クリック | ExportModal | - |
| KM10 | 鍵を再生成 | ActionItem (danger) | クリック | RegenerateModal | - |
| KM11 | Section: 履歴 | Section | - | - | - |
| KM12 | 作成日 | InfoItem | - | - | keyCreatedDate |
| KM13 | 最終バックアップ | InfoItem | - | - | lastBackupDate |
| KM14 | BackupModal | Modal | - | - | - |
| KM15 | ExportModal | Modal | - | - | privateKey (警告付き) |
| KM16 | RegenerateModal | Modal | - | - | 確認後再生成 |

#### データフロー

```
入力データ（Demo）:
  - publicKey: "0x7a3f9c2d8e1b4f6a0c5d7e9f2b4a6c8d1e3f5a7b9c0d2e4f6a8b0c2d4e6f8a0b..."
  - keyCreatedDate: "2026-01-01 10:00:00"
  - lastBackupDate: "2026-01-01 10:05:32"

操作:
  - コピー: publicKey → clipboard
  - バックアップ: 暗号化秘密鍵をJSONでダウンロード
  - エクスポート: 秘密鍵を表示（警告付き）
  - 再生成: 新しいDilithiumキーペア生成（危険操作）
```

---

## データエンティティ

### Transaction

```typescript
interface Transaction {
  id: string;
  type: 'lock' | 'normalUnlock' | 'emergencyUnlock' | 'unlockComplete';
  status: 'complete' | 'pending24h' | 'pending7d';
  amount: string;
  timestamp: string;
  txHash: string;
  blockConfirmed?: number;
  remainingTime?: string;
  bondAmount?: string;
}
```

### Lock

```typescript
interface Lock {
  id: string;
  number: number;
  amount: string;
  timestamp: string;
  status: 'locked' | 'pending';
  remainingTime?: string;
  period?: number; // 1, 2, 3, 5 years
  unlockDate?: string;
}
```

### UserSettings

```typescript
interface UserSettings {
  pushNotifications: boolean;
  emailNotifications: boolean;
  darkMode: boolean;
  locale: 'ja' | 'en';
  currency: 'JPY' | 'USD' | 'EUR';
  autoLockMinutes: number;
  biometricAuth: boolean;
}
```

### DilithiumKeyPair

```typescript
interface DilithiumKeyPair {
  publicKey: string;
  encryptedPrivateKey: string;
  createdAt: string;
  algorithm: 'Dilithium-III';
}
```

---

## API/バックエンド要件

### 必要なエンドポイント（Phase 2で実装）

| メソッド | エンドポイント | 説明 |
|----------|---------------|------|
| GET | `/api/consumer/balance` | ウォレット残高取得 |
| GET | `/api/consumer/locks` | ロック済み資産一覧 |
| GET | `/api/consumer/transactions` | 取引履歴 |
| GET | `/api/consumer/transaction/:id` | 取引詳細 |
| POST | `/api/consumer/lock` | ロック実行 |
| POST | `/api/consumer/unlock/normal` | 通常アンロック開始 |
| POST | `/api/consumer/unlock/emergency` | 緊急アンロック開始 |
| GET | `/api/consumer/settings` | 設定取得 |
| PUT | `/api/consumer/settings` | 設定更新 |

### ブロックチェーン連携（Phase 2で実装）

| 操作 | コントラクト関数 | 説明 |
|------|-----------------|------|
| ロック | `QShieldVault.lock()` | 資産をスマートコントラクトにロック |
| 通常アンロック | `QShieldVault.requestUnlock()` | 24時間タイムロック開始 |
| 緊急アンロック | `QShieldVault.emergencyUnlock()` | 保証金預託 + 7日チャレンジ開始 |
| ステータス確認 | `QShieldVault.getLockStatus()` | ロック状態確認 |

---

## 注記

- 現在の実装はすべてDemoデータ（Mock）を使用
- ウォレット接続はRainbowKit/wagmiで実装済み
- Dilithium署名はUI上のシミュレーションのみ（実際の暗号処理は未実装）
- 24時間タイムロック、7日チャレンジ期間はUI表示のみ
- 本番実装では、スマートコントラクトとの連携が必要
