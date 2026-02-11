# Explorer App - 全画面データトレーサビリティ検証結果

**検証日時:** 2026-02-07
**検証対象:** Explorer全14画面
**検証方法:** Playwright MCP snapshot + API response比較 + SEQUENCES.md照合

---

## サマリー

| 指標 | 値 |
|:---|:---|
| 総画面数 | 14 |
| ✅ 正常 | 2 (glossary, about) |
| ⚠️ 警告 | 1 (landing - ハードコード統計値) |
| ❌ エラー | 6 (overview, locks, unlocks, provers, analytics, search) |
| 未確認 | 2 (locks/[id], unlocks/[id]) |
| ランタイムエラー | 1 (overview - mockRecentUnlocks.map is not a function) |
| 静的ページ | 3 (landing, glossary, about) |

### 根本原因

**FEコンポーネントがAPIの実データを無視し、FALLBACKデータを表示している。**

APIは全エンドポイントで正しい実データを返しているが（200 OK）、FEのExplorerコンポーネント群がFALLBACK定数を優先表示している。原因はhookのtry/catch内でFALLBACKを返すパターン、またはコンポーネント側でAPIデータをFALLBACKにマージ/上書きするロジック。

---

## 画面別詳細

### 1. /ja/explorer/landing（静的ページ）

| # | 表示項目 | 表示値 | 種別 | 正確性 | 問題 |
|:--|:---------|:------|:-----|:------:|:-----|
| 1 | ヒーローテキスト「Quantum Shieldのすべてを可視化」 | — | 静的 | ✅ | — |
| 2 | 説明文 | Lock、Unlock、Challengeの… | 静的 | ✅ | — |
| 3 | 総ロック量 (TVL) | **12,450 ETH** | ⚠️ハードコード | ❌ | API実データ: 0.01 ETH (10000000000000000 wei) |
| 4 | 総Lock数 | **8,234** | ⚠️ハードコード | ❌ | API実データ: 4 |
| 5 | 総Unlock数 | **6,892** | ⚠️ハードコード | ❌ | API実データ: 1 |
| 6 | アクティブProver | **47** | ⚠️ハードコード | ❌ | API実データ: 2 |
| 7 | 機能説明4カード | リアルタイム追跡、完全な透明性等 | 静的 | ✅ | — |
| 8 | 探索データ3カード | Lock一覧、Unlock一覧、分析 | 静的 | ✅ | — |
| 9 | 専門家の声 引用3件 | Vitalik, Antonopoulos, Samczsun | 静的 | ⚠️ | 注記あり「直接的な推奨ではない」が、引用の正確性は未検証 |
| 10 | フッターリンク | Consumer, QS Hub, Explorer等 | ナビ | ✅ | 遷移先URL正常 |

**判定:** ⚠️ 統計値4項目がハードコード。静的ページだがユーザーに誤った印象を与える。

---

### 2. /ja/explorer/overview ★ランタイムエラー

**ステータス: ❌ ランタイムエラーで表示不能**

```
TypeError: mockRecentUnlocks.map is not a function
src/components/explorer/Overview.tsx (428:38)
```

**原因:** `mockRecentUnlocks` が配列でなくオブジェクトまたはundefinedになっている。Overviewコンポーネントが`.map()`を呼ぶ際にクラッシュ。

**影響:** Explorer最重要画面が完全に使用不能。

---

### 3. /ja/explorer/locks

| # | 表示項目 | 表示値(画面) | API実データ | 正確性 | 問題 |
|:--|:---------|:-----------|:----------|:------:|:-----|
| 1 | ページタイトル「全Lock」 | 全Lock | — | ✅ | — |
| 2 | 総Lock数 | **24,891** | 4 | ❌ | FALLBACKデータ |
| 3 | 総ロック額 | **$847.2M** | ~0.01 ETH | ❌ | FALLBACKデータ |
| 4 | テーブル行数 | **6件** | 4件 | ❌ | FALLBACKの架空Lock表示 |
| 5 | Lock ID 1 | 0x7a3f...e821 | 0x15dc...fc90 | ❌ | 架空ID |
| 6 | 金額 1 | 125.5 ETH | 0.01 ETH | ❌ | 架空金額 |
| 7 | オーナー 1 | 0x9b2c...f412 | 0xe69b...cdc3 | ❌ | 架空アドレス |
| 8 | ページネーション | 全24891件 | 4件 | ❌ | FALLBACKのtotal値 |
| 9 | ステータスフィルター | 4オプション | — | ✅ | UI機能OK |
| 10 | ソート | 4オプション | — | ✅ | UI機能OK |

**API確認:** `GET /v1/explorer/locks?sort=newest&page=1` → 200 OK, 4件の実Lock返却
**判定:** ❌ APIは正しいがFEがFALLBACKデータを表示

---

### 4. /ja/explorer/unlocks

| # | 表示項目 | 表示値(画面) | API実データ | 正確性 | 問題 |
|:--|:---------|:-----------|:----------|:------:|:-----|
| 1 | 保留中 | **127** | 1 | ❌ | FALLBACK |
| 2 | 完了 | **8,234** | 0 | ❌ | FALLBACK |
| 3 | テーブル行数 | **5件** | 1件 | ❌ | FALLBACKの架空Unlock表示 |
| 4 | Unlock ID 1 | 0x2e7f...d934 | 0x9439...f195 | ❌ | 架空ID |
| 5 | Time Lock | 23h 14m 残り | 実データ計算値不明 | ⚠️ | FALLBACK値 |
| 6 | Prover署名 | 3/5 | — | ⚠️ | FALLBACK値 |
| 7 | ページネーション | 全1件（表記） | 1件 | ⚠️ | 矛盾: テーブルは5件だが「全1件」と表示 |
| 8 | Prover署名ツールチップ | 「5人の独立した承認者のうち…」 | — | ✅ | SEQUENCES準拠 |

**API確認:** `GET /v1/explorer/unlocks?page=1` → 200 OK, 1件の実Unlock返却
**判定:** ❌ APIは正しいがFEがFALLBACKデータを表示

---

### 5. /ja/explorer/challenges

| # | 表示項目 | 表示値(画面) | API実データ | 正確性 | 問題 |
|:--|:---------|:-----------|:----------|:------:|:-----|
| 1 | 総Challenge数 | 0 | 0 | ✅ | 正確 |
| 2 | アクティブ/解決済みタブ | — | — | ✅ | UI OK |
| 3 | テーブル | 空 | 空 | ✅ | 正確 |
| 4 | 成功率 | 0% | 0% | ✅ | 正確 |
| 5 | Bond ツールチップ | あり | — | ✅ | UI OK |

**API確認:** `GET /v1/explorer/challenges?page=1` → 200 OK, 0件
**判定:** ✅ データ0件のため正しく空表示（FALLBACK不使用）

---

### 6. /ja/explorer/provers

| # | 表示項目 | 表示値(画面) | API実データ | 正確性 | 問題 |
|:--|:---------|:-----------|:----------|:------:|:-----|
| 1 | 総Prover数 | **8** | 2 | ❌ | FALLBACK |
| 2 | オンライン数 | **8/8** | 2 | ❌ | FALLBACK |
| 3 | 平均稼働率 | **99.87%** | 計算不能 | ❌ | FALLBACK |
| 4 | 平均応答時間 | **1.2s** | DB未記録 | ❌ | FALLBACK |
| 5 | 総署名数 | **45,892** | 0 | ❌ | FALLBACK |
| 6 | Prover名 | Alpha, Beta, Gamma... | null (名前なし) | ❌ | 架空名 |
| 7 | Proverアドレス | 0x1a2b...3c4d等 | 0xe69B...CDC3 | ❌ | 架空アドレス |
| 8 | リンク先 | /provers/prover-1 等 | /provers/{実ID} | ❌ | 架空URL |
| 9 | 説明テキスト「5社のうち2社が…」 | — | — | ✅ | SEQUENCES準拠 |
| 10 | 「99.5%以上の稼働率」 | — | — | ✅ | SEQUENCES準拠 |

**API確認:** `GET /v1/explorer/provers` → 200 OK, 2件の実Prover返却
**判定:** ❌ 完全にFALLBACKデータ。APIの実データ無視。

---

### 7. /ja/explorer/analytics

| # | 表示項目 | 表示値(画面) | API実データ | 正確性 | 問題 |
|:--|:---------|:-----------|:----------|:------:|:-----|
| 1 | 現在のTVL | **$847.2M** | 0.01 ETH | ❌ | FALLBACK |
| 2 | TVL変化率 | **+12.4%** | 算出不能 | ❌ | FALLBACK |
| 3 | 累計Lock数 | **24,891** | 4 | ❌ | FALLBACK |
| 4 | 累計Unlock数 | **18,234** | 1 | ❌ | FALLBACK |
| 5 | 平均Lock金額 | **34.2 ETH** | 0.01 ETH | ❌ | FALLBACK |
| 6 | 平均Lock期間 | **45 days** | 算出不能 | ❌ | FALLBACK |
| 7 | 成功率 | **99.8%** | 算出不能 | ❌ | FALLBACK |
| 8 | TVL推移グラフ | 01/01~01/10, 12500~15234 ETH | 時系列データなし | ❌ | 完全架空 |
| 9 | 取引量グラフ | Lock 45-72件/日, Unlock 32-58件/日 | 時系列データなし | ❌ | 完全架空 |
| 10 | Lock分布 | Active 65, Unlocking 25, Unlocked 10 | 実分布: Active 3, unlock_pending 1 | ❌ | FALLBACK |
| 11 | Unlock分布 | 通常 85, 緊急 15 | 通常 1, 緊急 0 | ❌ | FALLBACK |
| 12 | Challenge発生率 | 0.3%, 153解決済, 3係争中 | 0件 | ❌ | FALLBACK |
| 13 | Prover稼働率テーブル | Alpha~Epsilon, 99.5-99.9% | 2 Prover, データなし | ❌ | FALLBACK |
| 14 | Prover稼働率 | 99.7%, 目標99.5%以上 | 算出不能 | ❌ | FALLBACK |

**API確認:** `GET /v1/explorer/analytics/stats` → 200 OK, totalLocks:4, totalUnlocks:1
**判定:** ❌ 全データがFALLBACK。最もデータ密度が高い画面で最も問題が深刻。

---

### 8. /ja/explorer/search

| # | 表示項目 | 表示値(画面) | API実データ | 正確性 | 問題 |
|:--|:---------|:-----------|:----------|:------:|:-----|
| 1 | 検索結果数 | **4件** | — | ❌ | 検索クエリなしで架空結果表示 |
| 2 | Lock結果 1 | 125.5 ETH, 0x7a3f...e821 | — | ❌ | 架空データ |
| 3 | Lock結果 2 | 50.0 ETH, 0x7a3f1d9e...c734b821 | — | ❌ | 架空データ |
| 4 | Unlock結果 | 通常, 23h 14m, 3/5署名 | — | ❌ | 架空データ |
| 5 | アドレス結果 | 175.5 ETH, 2 Lock, 15 TX | — | ❌ | 架空データ |
| 6 | タブフィルター | すべて/Lock/Unlock/アドレス/Challenge | — | ✅ | UI機能OK |

**判定:** ❌ 検索未実行なのに架空の結果を表示

---

### 9. /ja/explorer/glossary（静的ページ）

| # | 表示項目 | 表示値 | SEQUENCES.md | 正確性 | 問題 |
|:--|:---------|:------|:------------|:------:|:-----|
| 1 | Lock/Unlock説明 | アンロック要求後24時間待機 | 24h timelock ✅ | ✅ | — |
| 2 | 緊急アンロック | **「全Proverの承認と7日間の待機期間」** | Prover承認不要、bond必要 | ❌ | **SEQUENCES矛盾**: 緊急アンロックはProver承認不要（72h非応答トリガー）|
| 3 | Prover説明 | 「5社のうち2社がランダムに選出」 | 2/5 Prover SPHINCS+ ✅ | ✅ | — |
| 4 | クォーラム | **「総veQSの10%以上」** | 4%/8%/15%（タイプ別） | ❌ | **SEQUENCES矛盾**: 一律10%は誤り |
| 5 | ステーク要件 | **「Proverになるには100 ETH以上」** | $400K/$500K（Phase別） | ❌ | **SEQUENCES矛盾**: ETH固定額ではなくUSD建て |
| 6 | Dilithium説明 | NIST標準化 | FIPS 204 ✅ | ✅ | — |
| 7 | STARK説明 | ゼロ知識証明 | ✅ | ✅ | — |
| 8 | Challenge説明 | ボンドを預けて異議申立 | ✅ | ✅ | — |
| 9 | スラッシング | 「ステークの50%」 | N²×10%（Quadratic） | ⚠️ | 簡略化。正確にはQuadraticスラッシング |
| 10 | veQS | 「ロック期間が長いほど投票力」 | veQS = QS × multiplier(1.0-8.0x) | ✅ | 大筋正しい |
| 11 | エポック | 「通常は1週間」 | SEQUENCES未定義 | ⚠️ | SEQUENCESに明記なし |
| 12 | ボンド | 「1 ETHのボンドを預けて」 | MAX(0.5 ETH, 5%) | ⚠️ | 例示だが固定額の誤印象 |

**判定:** ⚠️ 3箇所でSEQUENCES.mdと明確な矛盾あり

---

### 10-14. 未詳細確認画面

| # | 画面 | ステータス | 備考 |
|:--|:-----|:----------|:-----|
| 10 | /explorer/locks/[id] | 未確認 | FALLBACKパターンと同様の問題が予想される |
| 11 | /explorer/unlocks/[id] | 未確認 | 同上 |
| 12 | /explorer/provers/[id] | 未確認 | FALLBACK prover-1~8のIDは架空のため404の可能性 |
| 13 | /explorer/about | 未確認 | 静的ページ |
| 14 | /explorer/glossary | ✅確認済 | 上記参照 |

---

## API実データ vs 画面表示 比較

### API応答確認結果（全200 OK）

| Endpoint | 実データ | 画面表示 | 一致 |
|:---------|:--------|:--------|:----:|
| GET /v1/explorer/locks | 4件, 0.01 ETH each | 6件, 125.5 ETH等 | ❌ |
| GET /v1/explorer/unlocks | 1件, normal, pending | 5件, 通常+緊急混在 | ❌ |
| GET /v1/explorer/challenges | 0件 | 0件 | ✅ |
| GET /v1/explorer/provers | 2件, active | 8件, Alpha~Theta | ❌ |
| GET /v1/explorer/overview | TVL: 0.01ETH, Locks:4, Provers:2 | クラッシュ | ❌ |
| GET /v1/explorer/analytics/stats | TVL: 0.01ETH, Locks:4 | $847.2M, 24891 | ❌ |

---

## 問題一覧（深刻度順）

| # | 深刻度 | 画面 | 問題 | 原因 | 対策 |
|:--|:------:|:-----|:-----|:-----|:-----|
| 1 | ❌CRITICAL | overview | `mockRecentUnlocks.map is not a function` ランタイムエラー | Overview.tsx L428 - FALLBACKデータの型不整合 | Overview.tsx修正: 配列保証 or optional chaining |
| 2 | ❌CRITICAL | locks, unlocks, provers, analytics, search | FALLBACKデータがAPIの実データを完全に上書き | FEコンポーネントのFALLBACK優先ロジック | コンポーネント修正: APIデータ優先、FALLBACK削除またはisLoading時のみ使用 |
| 3 | ❌HIGH | glossary | 緊急アンロック説明がSEQUENCES矛盾（「全Prover承認」→実際は不要） | i18nテキストの誤り | glossary翻訳修正 |
| 4 | ❌HIGH | glossary | クォーラム「10%」はSEQUENCES矛盾（4%/8%/15%） | i18nテキストの誤り | glossary翻訳修正: タイプ別表記に |
| 5 | ⚠️MED | glossary | Proverステーク「100 ETH」はSEQUENCES矛盾（$400K/$500K） | i18nテキストの誤り | glossary翻訳修正: USD建て表記に |
| 6 | ⚠️MED | glossary | スラッシング「50%」は不正確（Quadratic N²×10%） | 簡略化しすぎ | glossary修正: Quadratic表記追加 |
| 7 | ⚠️MED | landing | 統計値4項目がハードコード | 静的ページにFALLBACK定数使用 | API取得に変更 or 「デモデータ」表記 |
| 8 | ⚠️LOW | analytics | TVL/取引量の時系列データなし | daily_metricsテーブル未実装 | BE: daily_metrics集計ジョブ実装 |
| 9 | ⚠️LOW | provers | 応答時間データなし | BEにレスポンスタイム計測未実装 | BE: Prover応答時間の記録・集計実装 |

---

## SEQUENCES.md照合結果（Explorer関連）

| シーケンス | 画面内の記述 | SEQUENCES定義 | 一致 |
|:----------|:-----------|:------------|:----:|
| Unlock Normal | 24時間待機 | 24h timelock | ✅ |
| Unlock Emergency | 全Prover承認+7日 | Prover不要+bond+7日 | ❌ |
| Prover 2/5署名 | 5社のうち2社 | 2/5 SPHINCS+ | ✅ |
| Challenge Bond | 1 ETH例示 | MAX(0.5 ETH, 5%) | ⚠️ |
| Quorum | 10% | 4%/8%/15% | ❌ |
| Prover Stake | 100 ETH | $400K/$500K | ❌ |
| Slashing | 50% | N²×10% (Quadratic) | ❌ |
| veQS | ロック期間比例 | QS×multiplier(1-8x) | ✅ |
