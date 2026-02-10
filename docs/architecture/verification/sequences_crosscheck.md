# Phase C: 9シーケンス × 全画面 SEQUENCES.md横断照合

> **検証日時**: 2026-02-07
> **検証対象**: 9コアシーケンス + 1補助シーケンス vs 全アプリ画面表示
> **検証方法**: 各アプリ検証ファイルのSEQUENCES準拠情報を統合分析

---

## 照合サマリー

| # | Sequence | 関連アプリ | パラメータ一致 | 画面表示一致 | 総合判定 |
|:--|:---------|:----------|:------------:|:----------:|:-------:|
| 1 | Lock | Consumer, Explorer | ✅ | ✅ | ✅ |
| 2 | Unlock Normal | Consumer, Explorer, Observer | ✅ | ✅ | ✅ |
| 3 | Unlock Emergency | Consumer, Explorer | ⚠️ | ❌ | ❌ |
| 4 | Challenge + Slashing | Prover, Explorer, Observer | ⚠️ | ❌ | ❌ |
| 5 | Prover Registration | Prover, QS Admin | ⚠️ | ⚠️ | ⚠️ |
| 6 | Prover Exit | Prover | ✅ | ⚠️ | ⚠️ |
| 7 | Governance Proposal | Governance, QS Hub | ⚠️ | ❌ | ❌ |
| 8 | Emergency Pause | Enterprise | ⚠️ | ⚠️ | ⚠️ |
| 9 | Token Hub (veQS) | QS Hub, Governance | ✅ | ⚠️ | ⚠️ |

**総合**: ✅一致 2件, ⚠️部分一致 4件, ❌不一致 3件

---

## Sequence #1: Lock

### SEQUENCES.md定義

| パラメータ | 定義値 |
|:----------|:------|
| 参加者 | User, L3 Aegis (4node), L1 Vault |
| 署名 | ML-DSA-65 (Dilithium) ユーザー署名 |
| Gas | ~135K gas (~$7) |
| フロー | Lock Request → BFT合意 → Lock承認 → Deposit → Lock確定 → 同期 |
| データ | chain_id, asset, amount, dest_addr, expiry, nonce, pk_dilithium, sig_dilithium |
| SR_0 | SHA3-256("QS_LOCK_V1" || chain_id || asset || amount || ...) |

### 画面表示との照合

| アプリ | 画面 | パラメータ | 表示値 | 一致 |
|:------|:-----|:---------|:------|:----:|
| Consumer | /lock/processing | 5ステップ | Dilithium署名→TX署名→L3送信→Block確認→L1確認 | ✅ |
| Consumer | /lock/success | 解除待機時間 | 24時間 | ✅ |
| Consumer | /lock/success | Lock ID | 実データ (0xfc97b5f1...) | ✅ |
| Consumer | dashboard | Dilithium署名ボタン | 「Dilithium署名で資産をロックする」 | ✅ |
| Explorer | landing | 総Lock数 | 8,234 (⚠️FALLBACK, 実際4) | ⚠️表示値不正確 |
| Explorer | locks | Lock一覧 | FALLBACK架空データ | ❌表示値不正確 |

### 判定: ✅ パラメータ一致

Consumer Appの Lock フローは SEQUENCES.md と完全に一致。5ステップ（Dilithium署名→TX署名→L3送信→Block確認→L1確認）は仕様準拠。
Explorer の Lock データ表示は FALLBACK により不正確だが、これはデータ表示の問題でありシーケンス実装自体は正しい。

---

## Sequence #2: Unlock (Normal Path)

### SEQUENCES.md定義

| パラメータ | 定義値 |
|:----------|:------|
| Prover署名 | SPHINCS+ 2/5 必要 |
| Time Lock | 24時間 |
| Gas | ~490K gas (~$27) |
| VRF | Chainlink VRF でProver選出 |
| フロー | Unlock Req → BFT合意 → VRF → Prover選出(2/5) → SPHINCS+署名×2 → Submit → 24h Lock → Claim → Release |

### 画面表示との照合

| アプリ | 画面 | パラメータ | 表示値 | 一致 |
|:------|:-----|:---------|:------|:----:|
| Consumer | /unlock | 待機時間 | 24時間 | ✅ |
| Consumer | /unlock | 必要なもの | Dilithium秘密鍵 | ✅ |
| Consumer | /unlock | 手数料 | ガス代のみ | ✅ |
| Consumer | /unlock/processing | 5ステップ | ロック取得→Dilithium署名→L3送信→VRF Prover選定→タイムロック有効化 | ✅ |
| Explorer | unlocks | Prover署名 | 3/5 (FALLBACK) | ⚠️FALLBACKで3/5、正しくは2/5 |
| Explorer | unlocks | ツールチップ | 「5人の独立した承認者のうち…」 | ✅ |
| Explorer | glossary | 24h待機 | 「アンロック要求後24時間待機」 | ✅ |
| Observer | pending | アンロック一覧 | 実データ (0xe69b...cdc3, timelock_until) | ✅ |
| Observer | pending | リアルタイム監視 | カウントダウン表示 | ✅ |

### 判定: ✅ パラメータ一致

Consumer Appの Unlock Normal フローは SEQUENCES.md と一致。24h timelock、VRF Prover選定、5ステップが正しく実装。
Observer の pending 画面は unlocks テーブルの実データを正確に表示。
Explorer の FALLBACK データ (3/5) は仕様 (2/5) と不一致だが、これはFALLBACK値の誤りでありシーケンス実装自体は正しい。

---

## Sequence #3: Unlock (Emergency Path) ❌

### SEQUENCES.md定義

| パラメータ | 定義値 |
|:----------|:------|
| トリガー | 72時間 Prover応答なし |
| Prover署名 | 不要 |
| Time Lock | 7日 |
| Bond | MAX(0.5 ETH, amount × 5%) |

### 画面表示との照合

| アプリ | 画面 | パラメータ | 表示値 | 一致 |
|:------|:-----|:---------|:------|:----:|
| Consumer | /unlock | 緊急待機時間 | 7日間 | ✅ |
| Consumer | /unlock | 緊急Bond | MAX(0.5 ETH, 金額×5%) | ✅ |
| Consumer | /unlock | 緊急の必要なもの | ウォレット署名 | ✅ |
| Consumer | /emergency-bond | Bond計算 | MAX(0.5, amount×5%) | ✅ |
| Consumer | /unlock/processing | **緊急選択時のDilithium検証** | **Dilithium公開鍵検証が実行される** | ❌ |
| Explorer | glossary | 緊急アンロック説明 | **「全Proverの承認と7日間の待機期間」** | ❌ |

### 不一致詳細

1. **Consumer /unlock/processing (C2)**: 緊急アンロック選択時にもDilithium公開鍵検証が実行される
   - SEQUENCES.md: 緊急パスは「Prover署名不要」「ウォレット署名のみ」
   - 実装: `method=emergency` でも通常アンロックと同じ `requestUnlock()` を呼ぶ
   - **影響**: 秘密鍵紛失時のセーフティネットが機能しない（深刻度: Critical）

2. **Explorer glossary**: 「全Proverの承認と7日間の待機期間」
   - SEQUENCES.md: 緊急アンロックはProver承認**不要**（72h応答なしがトリガー）
   - **影響**: ユーザーに誤った仕様情報を提供（深刻度: High）

### 判定: ❌ 実装不一致

Consumer の緊急アンロックパスが SEQUENCES.md の仕様と異なる。秘密鍵紛失時に緊急アンロックが使えない致命的問題。

---

## Sequence #4: Challenge + Slashing ❌

### SEQUENCES.md定義

| パラメータ | 定義値 |
|:----------|:------|
| Slashing | Quadratic: N² × 10% |
| 報酬配分 | Challenger 60%, Insurance 20%, Burn 20% |
| Defense期限 | 48時間 |
| Challenge Bond | MAX(0.1 ETH, amount × 1%) |
| Lock延長 | → 7日 |

### Quadratic Slashing計算表

| 同時不正数 | Slash率 | 例: $400K Stake |
|:----------|:-------|:---------------|
| 1社 | 10% | $40K |
| 2社 | 40% | $160K/社 |
| 3社 | 90% | $360K/社 |
| 4社+ | 100% | 全額 |

### 画面表示との照合

| アプリ | 画面 | パラメータ | 表示値 | 一致 |
|:------|:-----|:---------|:------|:----:|
| Prover | challenges | Slashing N=1 | 40,000 QS (10%) | ✅ |
| Prover | landing | Slashingテーブル | 4段階（N=1~4+, 10%~100%） | ✅ |
| Explorer | glossary | スラッシング | **「ステークの50%」** | ❌ |
| Observer | suspicious | チャレンジ機能 | 100% Mock | ⚠️データ不在 |
| Observer | earnings | 報酬配分 | 100% Mock | ⚠️データ不在 |

### 不一致詳細

1. **Explorer glossary**: スラッシングを「ステークの50%」と記載
   - SEQUENCES.md: Quadratic N²×10%（1社=10%, 2社=40%, 3社=90%, 4社+=100%）
   - **影響**: ユーザーにスラッシングの仕組みを誤解させる（深刻度: Medium）

2. **Observer suspicious/earnings**: 100% Mock データ
   - チャレンジ関連の画面が全てMock
   - 報酬配分（60%/20%/20%）が画面に正しく反映されているか確認不可

### 判定: ❌ Explorer glossary 不一致 + Observer 検証不可

---

## Sequence #5: Prover Registration ⚠️

### SEQUENCES.md定義

| パラメータ | Phase 1 | Phase 2 | Phase 3+ |
|:----------|:-------|:-------|:--------|
| 最低Stake | $400K ETH | $500K $QS | $500K $QS |
| HSM使用 | 必須 | 必須 | 必須 |
| 2-of-3マルチシグ | 必須 | 必須 | 必須 |
| 法的契約 | 必須 | 必須 | 必須 |
| 承認 | 財団招待 | Council 3/9 + 自動 | 自動 |

### 画面表示との照合

| アプリ | 画面 | パラメータ | 表示値 | 一致 |
|:------|:-----|:---------|:------|:----:|
| Prover | requirements | 最低Stake | $400,000+ | ✅ |
| Prover | requirements | HSM | FIPS 140-2 Level 3+ | ✅ |
| Prover | requirements | 稼働率 | 99.9% | ✅ |
| Prover | requirements | レスポンスタイム | <30秒 | ✅ |
| Prover | landing | 稼働率 | 99.97% | ⚠️ 99.9% vs 99.97% |
| Prover | application | フォーム | 4ステップ、Public/Enterprise選択 | ✅ |
| QS Admin | provers | ステーク量 | 5,000-12,000 QS (Mock) | ❌ $400K/$500K と大幅乖離 |
| Explorer | glossary | ステーク要件 | **「100 ETH以上」** | ❌ USD建てではなくETH固定額 |

### 不一致詳細

1. **Prover landing vs requirements**: 稼働率 99.97% vs 99.9%
   - landing は i18n 値（マーケティング数値）、requirements は仕様値
   - 矛盾するが requirements 側が SEQUENCES 準拠 ✅

2. **QS Admin provers**: Mock データのステーク量 5,000-55,000 QS
   - SEQUENCES.md: $400K/$500K
   - Mock データが非現実的な値 → 管理者に誤認させる

3. **Explorer glossary**: 「Proverになるには100 ETH以上」
   - SEQUENCES.md: Phase別 USD建て（$400K/$500K）
   - ETH固定額は誤り

### 判定: ⚠️ コア画面一致、周辺画面に矛盾

---

## Sequence #6: Prover Exit ⚠️

### SEQUENCES.md定義

| パラメータ | 定義値 |
|:----------|:------|
| Unbonding期間 | 7日 |
| Unbonding中 | Slash対象 |
| 4ステップ | 退出申請 → pending → Pool除外 → VRF対象外 → 7日 → Stake返還 |

### 画面表示との照合

| アプリ | 画面 | パラメータ | 表示値 | 一致 |
|:------|:-----|:---------|:------|:----:|
| Prover | exit | クーリング期間 | 7日間 | ✅ |
| Prover | exit | 処理タイムライン | 4ステージ | ✅ |
| Prover | exit | 早期Exitペナルティ | 5% (-$20,000) | ✅ |
| Prover | exit | ロック解除日 | 2026/09/20 (残り183日) | ⚠️Mock |
| Prover | exit | 全データ | 100% Mock — API hookなし | ⚠️ |

### 判定: ⚠️ パラメータ一致だがデータは100% Mock

7日間 Unbonding はSEQUENCES準拠。ただしExit画面は100%Mockで実際のAPI連携なし。

---

## Sequence #7: Governance Proposal ❌

### SEQUENCES.md定義

| パラメータ | 定義値 |
|:----------|:------|
| 提案タイプ | parameter, treasury, upgrade, signal, emergency |
| 定足数 (Quorum) | parameter=4%, treasury=6%, upgrade=8%, signal=3%, emergency=15% |
| 議論期間 | 7日 |
| 投票期間 | 7日 |
| Time Lock | 7日 |
| 投票力 | veQS残高ベース |
| 評議会拒否権 | 6/9 で Veto可能 |
| Bond | 1 ETH |

### 画面表示との照合

| アプリ | 画面 | パラメータ | 表示値 | 一致 |
|:------|:-----|:---------|:------|:----:|
| Governance | create | parameter定足数 | 4% | ✅ |
| Governance | create | upgrade定足数 | 8% | ✅ |
| Governance | create | signal定足数 | 3% | ✅ |
| Governance | create | **treasury定足数** | **表示なし** | ❌ |
| Governance | create | **emergency定足数** | **表示なし** | ❌ |
| Governance | create | タイムロック | 7日間 | ✅ |
| Governance | create | 評議会拒否権 | あり | ✅ |
| Governance | create | ユーザーveQS | 125,000 veQS (ハードコード) | ⚠️ |
| Governance | create | 最低veQS | 10,000 veQS (ハードコード) | ⚠️ |
| Governance | onboarding | veQS計算式 | QS × (残り日数/730日) | ✅ |
| Explorer | glossary | クォーラム | **「総veQSの10%以上」** | ❌ |
| QS Hub | 全画面 | 提案データ | Mock (MOCK_PROPOSALS) | ⚠️ |

### 不一致詳細

1. **Governance create**: 5提案タイプのうち3つしか表示なし
   - 欠落: treasury (6%), emergency (15%)
   - **影響**: 財務提案と緊急提案が作成できない（深刻度: High）

2. **Explorer glossary**: クォーラムを一律「10%」と記載
   - SEQUENCES.md: タイプ別（4%/6%/8%/3%/15%）
   - **影響**: ユーザーにガバナンス仕様を誤解させる

3. **Governance create**: veQS残高/最低要件がハードコード
   - 実際のウォレット/コントラクトから取得すべき

### 判定: ❌ 提案タイプ欠落 + Explorer glossary 矛盾

---

## Sequence #8: Emergency Pause & Recovery ⚠️

### SEQUENCES.md定義

| パラメータ | 定義値 |
|:----------|:------|
| Pause閾値 | Security Council 5/9 |
| 最大Pause期間 | 72時間（延長はToken Vote） |
| 緊急投票 | 48時間 |
| 対応策 | 修正承認 / Pause延長(+7日) / 即時解除 |
| Pause影響 | 新規Lock/Unlock停止、進行中Unlock継続 |

### 画面表示との照合

| アプリ | 画面 | パラメータ | 表示値 | 一致 |
|:------|:-----|:---------|:------|:----:|
| Enterprise | — | Emergency Pause機能 | 画面なし（専用画面未確認） | ⚠️ |
| Enterprise | dashboard | システム稼働率 | 99.99% (FALLBACK) | ⚠️Mock |
| Enterprise | monitoring | アラート | 100% FALLBACK_ALERTS | ⚠️Mock |
| QS Hub | — | Pause状態表示 | 確認なし | ⚠️ |
| QS Admin | system | システムステータス | "operational"/"degraded" (英語) | ⚠️英語のまま |

### 不一致詳細

1. **Emergency Pause専用画面が見当たらない**
   - SEQUENCES.md ではSecurity Council 5/9 でPause発動
   - Enterprise / QS Admin のどちらにも「緊急停止」ボタンや専用UIが未確認
   - QS Admin system 画面に "operational" / "degraded" ステータスはあるが、Pause操作UIなし

2. **72時間制限の表示なし**
   - 最大Pause期間 72時間の情報がどの画面にも表示されていない

### 判定: ⚠️ 画面実装が未確認/不完全

Emergency Pause & Recovery は最も画面実装が遅れているシーケンス。専用のPause操作UI、72h制限表示、Token Vote連携が必要。

---

## Sequence #9: Token Hub (veQS) ⚠️

### SEQUENCES.md定義

#### 9.1 veQS Lock

| パラメータ | 定義値 |
|:----------|:------|
| veQS計算 | veQS = QS_locked × multiplier(duration) |
| Multiplier | 1m=1.0x, 3m=1.5x, 6m=2.0x, 12m=3.0x, 24m=5.0x, 48m=8.0x |
| 署名 | Dilithium |

#### 9.2 Delegation

| パラメータ | 定義値 |
|:----------|:------|
| 自己委任 | 禁止 |
| 連鎖委任 | 禁止 |
| 複数委任先 | 許可 |
| 委任取消 | amount=0で即時取消 |

#### 9.3 Reward

| パラメータ | 定義値 |
|:----------|:------|
| 配分 | veQS保有60%, 投票参加30%, 委任ボーナス10% |

### 画面表示との照合

| アプリ | 画面 | パラメータ | 表示値 | 一致 |
|:------|:-----|:---------|:------|:----:|
| Governance | onboarding | veQS計算 | QS × (残り日数/730日) | ⚠️ |
| Governance | onboarding | 最大ロック | 2年 (1 QS = 1 veQS) | ✅ |
| QS Hub | stake/lock | QS残高 | 12,450 QS (MOCK_BALANCE) | ⚠️Mock |
| QS Hub | stake/lock | ロック期間選択肢 | 1m/3m/6m/12m/24m/48m | ✅ |
| QS Hub | stake/lock | Multiplier表 | 1.0x~8.0x | ✅ |
| QS Hub | stake/unlock | ポジション一覧 | Mock (MOCK_STAKE_POSITIONS) | ⚠️Mock |
| QS Hub | vote/delegates | 委任一覧 | Mock (MOCK_DELEGATES) | ⚠️Mock |
| QS Hub | rewards | 報酬配分 | Mock (MOCK_REWARDS) | ⚠️Mock |
| QS Hub | dashboard | 報酬USD値 | ❌ CRASH (undefined.toLocaleString) | ❌ |

### 不一致詳細

1. **Governance onboarding**: veQS計算式 `QS × (残り日数/730日)`
   - SEQUENCES.md: `veQS = QS_locked × multiplier(duration)` でmultiplierテーブルが6段階
   - onboarding の計算式は「線形減衰」を示しており、multiplierテーブルとは異なるモデル
   - ⚠️ 二つの計算モデルが混在している可能性あり

2. **QS Hub dashboard CRASH**: `rewards.usdValue.toLocaleString()` で undefined エラー
   - Mock データの rewards オブジェクトに usdValue フィールドが欠落

3. **QS Hub 全データ画面**: Mock データのため実際の veQS 計算/委任/報酬の検証不可

### 判定: ⚠️ Multiplier テーブル自体は正しいが、画面実装は Mock 依存

---

## 横断的課題一覧

### ❌ Critical（SEQUENCES.md と明確に矛盾）

| # | シーケンス | 画面 | 問題 | 対策 |
|:--|:---------|:-----|:-----|:-----|
| SC-1 | #3 Emergency | Consumer /unlock/processing | 緊急アンロック時もDilithium検証が実行される（仕様: ウォレット署名のみ） | emergency用の別パスを実装 |
| SC-2 | #3 Emergency | Explorer glossary | 「全Prover承認+7日」→仕様: Prover不要+Bond+7日 | glossary テキスト修正 |
| SC-3 | #7 Governance | Governance /create | treasury/emergency提案タイプが欠落 | 5タイプすべて表示 |
| SC-4 | #7 Governance | Explorer glossary | クォーラム「10%」→仕様: タイプ別4%/6%/8%/3%/15% | glossary テキスト修正 |
| SC-5 | #4 Challenge | Explorer glossary | スラッシング「50%」→仕様: Quadratic N²×10% | glossary テキスト修正 |

### ⚠️ High（パラメータ不一致 / Mock依存）

| # | シーケンス | 画面 | 問題 | 対策 |
|:--|:---------|:-----|:-----|:-----|
| SH-1 | #5 Registration | Explorer glossary | Proverステーク「100 ETH」→仕様: $400K/$500K | glossary テキスト修正 |
| SH-2 | #5 Registration | QS Admin provers | Mock ステーク 5,000-55,000 QS | Mock値を仕様準拠に更新 |
| SH-3 | #5 Registration | Prover landing | 稼働率99.97% vs requirements 99.9% | 数値統一 |
| SH-4 | #2 Unlock Normal | Explorer unlocks | FALLBACK Prover署名 3/5 → 仕様: 2/5 | FALLBACK値修正 |
| SH-5 | #9 veQS | QS Hub dashboard | CRASH (rewards.usdValue undefined) | Mock データ修正 |
| SH-6 | #8 Emergency | Enterprise/QS Admin | Emergency Pause操作UIが未実装 | 専用画面実装 |

### ⚠️ Medium（表現の不正確さ / 検証不可）

| # | シーケンス | 画面 | 問題 | 対策 |
|:--|:---------|:-----|:-----|:-----|
| SM-1 | #4 Challenge | Explorer glossary | Bond「1 ETH」→仕様: MAX(0.1 ETH, amount×1%) | 動的表記に修正 |
| SM-2 | #9 veQS | Governance onboarding | 計算式「QS × (残り日数/730日)」vs multiplierテーブル | 計算モデル統一 |
| SM-3 | #4 Challenge | Observer | suspicious/earnings 100% Mock — 検証不可 | API統合 |
| SM-4 | #6 Prover Exit | Prover exit | 全データ100% Mock — 検証不可 | API統合 |
| SM-5 | #9 veQS | QS Hub全画面 | 全データ Mock — veQS計算の実動作検証不可 | API統合 |

---

## Explorer Glossary: SEQUENCES矛盾の集中地点

Explorer glossary は SEQUENCES.md との矛盾が最も集中している画面（5件）:

| # | 用語 | glossary記載 | SEQUENCES.md定義 | 矛盾種別 |
|:--|:-----|:-----------|:---------------|:--------|
| 1 | 緊急アンロック | 全Prover承認+7日 | Prover不要+Bond+7日 | ❌完全誤り |
| 2 | クォーラム | 総veQSの10% | 4%/6%/8%/3%/15% (タイプ別) | ❌完全誤り |
| 3 | Proverステーク | 100 ETH以上 | $400K/$500K (Phase別, USD建て) | ❌完全誤り |
| 4 | スラッシング | ステークの50% | N²×10% (Quadratic) | ⚠️不正確 |
| 5 | Bond | 1 ETHの例示 | MAX(0.5ETH, 5%) / MAX(0.1ETH, 1%) | ⚠️不正確 |

**対策**: Explorer glossary の i18n テキスト（ja/en）を SEQUENCES.md に準拠して一括修正

---

## シーケンスごとの画面カバレッジ

### 画面が存在するシーケンス

| # | Sequence | 専用画面 | 状態 |
|:--|:---------|:--------|:-----|
| 1 | Lock | Consumer: dashboard, lock/*, lock/processing, lock/success | ✅ 完全 |
| 2 | Unlock Normal | Consumer: unlock, unlock/processing, unlock/success | ✅ 完全 |
| 3 | Unlock Emergency | Consumer: emergency-bond, emergency-bond/processing, emergency-bond/success | ⚠️ 画面あり、実装不一致 |
| 5 | Prover Registration | Prover: requirements, application, application-status | ✅ 完全 |
| 6 | Prover Exit | Prover: exit | ⚠️ 100%Mock |
| 7 | Governance Proposal | Governance: create | ⚠️ 不完全（タイプ欠落） |
| 9 | Token Hub (veQS) | QS Hub: stake/lock, stake/unlock, stake/extend, vote/*, rewards | ✅ 画面あり、全Mock |

### 画面が不足/不明確なシーケンス

| # | Sequence | 不足画面 | 推奨 |
|:--|:---------|:--------|:-----|
| 4 | Challenge + Slashing | Challenger専用の「チャレンジ提出」画面が明確でない | Observer/suspicious からのフロー整備 |
| 8 | Emergency Pause | Security Council の「Pause発動」画面が未確認 | Enterprise/QS Admin に専用画面追加 |

---

## 修正優先度

### P0: 即座修正（仕様違反 — セキュリティ影響）

1. **SC-1**: Consumer 緊急アンロックのDilithium検証バイパス実装
   - 秘密鍵紛失時のセーフティネットが機能しないのは致命的

### P1: 高優先度（ドキュメント矛盾 — ユーザー誤認）

2. **SC-2~5**: Explorer glossary の5箇所のSEQUENCES矛盾修正
3. **SC-3**: Governance create に treasury/emergency 提案タイプ追加
4. **SH-5**: QS Hub dashboard の CRASH 修正

### P2: 中優先度（Mock/FALLBACK問題）

5. **SH-1~4**: 各 FALLBACK/Mock 値の SEQUENCES 準拠化
6. **SH-6**: Emergency Pause 操作UI の実装検討
7. **SM-2**: veQS 計算モデル（線形減衰 vs multiplierテーブル）の統一

### P3: 低優先度（API統合後に自動解決）

8. **SM-3~5**: Observer, Prover Exit, QS Hub のAPI統合
   - API統合完了後にMock値は自動的に置き換わる
