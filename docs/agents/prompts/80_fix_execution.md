# 80: SEQUENCES.md実行可能化 修正実行プロンプト

> **Version**: 1.0
> **Purpose**: FIX_EXECUTION_PLAN.md の各修正項目を確実に実行し、画面+DB+SEQUENCES.mdの3点検証を行うプロンプトシステム
> **使用法**: 各セッションの冒頭でこのプロンプトを読み込み、指定されたFIX番号の修正を実行する

---

## トリガーコマンド

```
修正実行 FIX-{NNN}        ← 特定のFIX項目を実行
修正実行 Phase {N}         ← Phase N の全FIX項目を順次実行
修正実行 進捗確認          ← 全FIX項目の進捗を表示
修正実行 検証 FIX-{NNN}    ← 特定FIX項目の3点検証のみ実行
シーケンステスト {N}       ← シーケンス#{N}のE2E実行テスト
シーケンステスト 全て       ← 全9シーケンスのE2Eテスト
```

---

## STEP 0: 必須ドキュメント読み込み（毎セッション冒頭、スキップ禁止）

```
READ PARALLEL（必須 — 読み込み完了を報告してから作業開始）:
├── docs/architecture/FIX_EXECUTION_PLAN.md          ← 修正計画（★最重要）
├── docs/core/SEQUENCES.md                           ← 9コアシーケンス定義
├── docs/architecture/DATABASE_ACTUAL_STATE.md        ← DB実態
├── docs/architecture/STORAGE_ARCHITECTURE.md         ← ストレージアーキテクチャ
├── docs/architecture/DOCUMENT_CONTRADICTIONS.md      ← 矛盾記録
└── docs/architecture/verification/VERIFICATION_SUMMARY.md ← 検証結果サマリー

READ（対象FIXに応じて）:
├── docs/architecture/verification/{app}_verification.md  ← 該当アプリの検証結果
└── 対象FIXの修正対象ファイル（FIX_EXECUTION_PLAN.md に記載）
```

**読み込み完了報告（必須出力）:**
```
## 修正実行準備完了
- [x] FIX_EXECUTION_PLAN.md 読み込み完了（FIX-001~027, Phase 1-6）
- [x] SEQUENCES.md 読み込み完了（9コアシーケンス）
- [x] DATABASE_ACTUAL_STATE.md 読み込み完了（54テーブル）
- [x] VERIFICATION_SUMMARY.md 読み込み完了（159画面結果）
- 対象FIX: FIX-{NNN} ({修正名})
- 関連シーケンス: #{N} ({シーケンス名})
→ 修正実行を開始します
```

---

## STEP 1: 修正項目の確認と現状把握

### 1.1 FIX_EXECUTION_PLAN.md から対象FIXを読み込み

以下の情報を確認:
- **修正内容**: 何を修正するか
- **修正対象ファイル**: 具体的なファイルパスと行番号
- **影響シーケンス**: SEQUENCES.md のどのシーケンスに影響するか
- **完了条件**: チェックリスト
- **検証方法**: 3点検証の具体的手順

### 1.2 現状のコードを読み込み

修正対象ファイルを**全て読み込む**。FIX_EXECUTION_PLAN.md に記載されたファイルに加え、以下も確認:

```
# FEコード
apps/web/src/hooks/{app}/use{App}.ts         ← Hook の現状確認
apps/web/src/app/[locale]/{app}/{screen}/page.tsx  ← コンポーネントの現状確認
apps/web/locales/ja/{app}.json               ← i18n の現状確認

# BEコード
services/api/src/routes/{module}.rs          ← ハンドラの現状確認
services/api/src/db/repositories/{module}.rs ← リポジトリの現状確認
```

### 1.3 SEQUENCES.md パラメータ照合

対象シーケンスの以下を確認:
- パラメータ値（Bond, Quorum, Timelock, Multiplier等）
- データフロー（User → L3 → VRF → Prover → L1 等）
- データ構造（Request/Response フィールド）

**出力（必須）:**
```
## 現状把握完了

### 修正対象 FIX-{NNN}: {修正名}
- 影響シーケンス: #{N} {シーケンス名}
- SEQUENCES.md パラメータ: {具体的な値}

### 現在のコード状態
| ファイル | 現状 | 問題点 |
|:--------|:-----|:------|
| {file1} | {現状の説明} | {何が問題か} |
| {file2} | {現状の説明} | {何が問題か} |

### 修正方針
{具体的にどう修正するか}
```

---

## STEP 2: コード修正実行

### 2.1 修正の実行

FIX_EXECUTION_PLAN.md の修正内容に従い、コードを修正する。

**修正時のルール:**

```xml
<rule id="FX-001">
  SEQUENCES.md のパラメータ値をハードコードする場合、コメントで出典を明記:
  // SEQUENCES.md v2.1 Sequence #3: Bond = MAX(0.5 ETH, amount × 5%)
</rule>

<rule id="FX-002">
  Mock/FALLBACK除去時は必ず3状態（Loading/Error/Empty）を実装:
  - Loading: Skeleton コンポーネント
  - Error: ErrorState コンポーネント + エラーメッセージ
  - Empty: EmptyState コンポーネント + 「データがありません」
</rule>

<rule id="FX-003">
  i18n修正時は ja/en 両方を同時に修正。片方のみの修正は禁止。
</rule>

<rule id="FX-004">
  BE修正時は BE-001~003 ルールを遵守:
  - BE-001: スタブレスポンス禁止
  - BE-002: テスト用コード修正禁止
  - BE-003: ログ出力必須（info!("DB query: ..."), warn!("DB error: ..."))
</rule>

<rule id="FX-005">
  型修正時はFE-BE間のマッピングを確認:
  - FE: camelCase → BE: snake_case (serde rename)
  - FE: string → BE: String / &str
  - FE: number → BE: i64 / BigDecimal / u128
</rule>
```

### 2.2 修正結果の記録

```
## 修正実行結果

### 修正したファイル
| # | ファイル | 変更内容 | 行数 |
|:--|:--------|:--------|:----:|
| 1 | {file1} | {何を変更したか} | {変更行数} |
| 2 | {file2} | {何を変更したか} | {変更行数} |

### TypeScript コンパイル確認
{コンパイル結果}

### Rust ビルド確認（BE修正時のみ）
{ビルド結果}
```

---

## STEP 3: 3点検証（★最重要 — スキップ禁止）

修正後に以下の3点を全て検証する。1つでも失敗したら修正をやり直す。

### 3.1 画面検証（Playwright MCP）

```
# 画面を開いてスナップショット取得
browser_navigate → http://localhost:3000/ja/{app}/{screen}
browser_snapshot → 全表示項目を記録
browser_console_messages → JS エラーがないこと
browser_network_requests → API呼び出しが発生していること

# 修正項目に応じた操作
- Mock除去: API実データが表示されているか確認
- パラメータ修正: SEQUENCES.md定義値が表示されているか確認
- クラッシュ修正: 画面が正常に表示されるか確認
- i18n修正: 翻訳テキストが正しいか確認
```

**出力（必須）:**
```
## 画面検証結果

### スナップショット: /ja/{app}/{screen}
| # | 表示項目 | 期待値（SEQUENCES.md） | 実際の表示値 | 結果 |
|:--|:---------|:---------------------|:-----------|:----:|
| 1 | {項目1} | {SEQUENCES定義値} | {画面表示値} | ✅/❌ |
| 2 | {項目2} | {期待値} | {画面表示値} | ✅/❌ |

### Console
- JS エラー: {あり/なし}
- 警告: {内容}

### Network
- API 呼び出し: {endpoint} → {status code}
- レスポンス: {正常/エラー}
```

### 3.2 データベース検証

```bash
# 該当テーブルのデータ確認
psql -d quantum_shield -c "SELECT {columns} FROM {table} WHERE {condition} LIMIT 5"

# 画面表示値との照合
# 画面に表示されている数値がDBの値と一致するか確認
```

**出力（必須）:**
```
## DB検証結果

### テーブル: {table_name}
| カラム | DB値 | 画面表示値 | 一致 |
|:------|:-----|:---------|:----:|
| {col1} | {db_value} | {screen_value} | ✅/❌ |

### データ整合性
- レコード数: DB={N}, 画面={N} → {一致/不一致}
- 計算値: {計算式} = {計算結果} vs 画面 {表示値} → {一致/不一致}
```

### 3.3 SEQUENCES.md パラメータ照合

```
## SEQUENCES.md照合結果

### シーケンス #{N}: {シーケンス名}
| パラメータ | SEQUENCES.md定義 | BE実装値 | FE表示値 | 3者一致 |
|:----------|:----------------|:--------|:--------|:------:|
| {param1} | {spec_value} | {be_value} | {fe_value} | ✅/❌ |
| {param2} | {spec_value} | {be_value} | {fe_value} | ✅/❌ |
```

---

## STEP 4: ドキュメント更新

### 4.1 FIX_EXECUTION_PLAN.md 更新

修正項目の完了条件チェックリストを更新:
```markdown
**完了条件**:
- [x] {条件1} ← 完了日時: 2026-02-XX
- [x] {条件2}
- [ ] {未完了の条件}
```

### 4.2 verification ファイル更新

該当アプリの verification ファイルを更新:
```
docs/architecture/verification/{app}_verification.md
```

修正した画面の検証結果を最新化:
- ⚠️ → ✅ （Mock/FALLBACK除去完了）
- ❌ → ✅ （クラッシュ修正完了）

### 4.3 VERIFICATION_SUMMARY.md 更新

全体サマリーの数値を更新:
- ✅正常画面数
- ⚠️警告画面数
- ❌エラー画面数
- SEQUENCES一致数

### 4.4 Architecture ドキュメント更新（Phase 6 FIX-023~027 実行時）

以下のドキュメントを修正内容に応じて更新:
- `DATABASE_ACTUAL_STATE.md`: テーブル使用状況
- `APP_API_MAPPING.md`: FE→BE→DB マッピング
- `DOCUMENT_CONTRADICTIONS.md`: 矛盾の解決状況
- `STORAGE_ARCHITECTURE.md`: データフロー

---

## STEP 5: 完了報告

### 5.1 FIX完了レポート（必須出力）

```
## FIX-{NNN} 完了レポート: {修正名}

### 修正サマリー
| 項目 | 値 |
|:-----|:---|
| 修正FIX | FIX-{NNN}: {修正名} |
| 影響シーケンス | #{N}: {シーケンス名} |
| 修正ファイル数 | {N} |
| 変更行数 | {N} |

### 3点検証結果
| 検証 | 結果 | 詳細 |
|:-----|:----:|:-----|
| 画面表示 | ✅/❌ | {概要} |
| DB データ | ✅/❌ | {概要} |
| SEQUENCES.md | ✅/❌ | {概要} |

### 完了条件チェックリスト
- [x] {条件1}
- [x] {条件2}
- [x] {条件3}

### 更新したドキュメント
- [x] FIX_EXECUTION_PLAN.md
- [x] {app}_verification.md
- [x] VERIFICATION_SUMMARY.md

### 次のFIX
→ FIX-{NNN+1}: {次の修正名}
```

---

## シーケンステスト実行手順

### コマンド: `シーケンステスト {N}`

対象シーケンスのE2E実行テストを行う。

#### 前提条件
- API サーバー稼働中: `cd services/api && cargo run`
- PostgreSQL 稼働中: `psql -d quantum_shield -c "SELECT 1"`
- フロントエンド稼働中: `cd apps/web && pnpm dev`

#### テスト手順

##### シーケンス #1: Lock テスト
```
1. Consumer Dashboard 開く → /ja/consumer/dashboard
2. 「ロックする」ボタンクリック → /ja/consumer/lock に遷移
3. 金額入力、Dilithium署名実行
4. 処理中画面で5ステップが順に進むことを確認
5. 完了画面で lock_id が表示されること確認
6. DB: SELECT * FROM locks WHERE lock_id = '{表示されたID}'
7. Explorer: /ja/explorer/locks で新しいロックが表示されること確認
```

##### シーケンス #2: Unlock (Normal) テスト
```
1. Consumer Dashboard → ロック済み資産を選択
2. 「アンロックする」ボタンクリック → /ja/consumer/unlock
3. 通常アンロック選択
4. 処理中画面: ロック取得→Dilithium署名→L3送信→VRF Prover選定→タイムロック有効化
5. DB: SELECT * FROM unlock_requests WHERE lock_id = '{lock_id}'
6. DB: SELECT * FROM vrf_requests WHERE unlock_id = '{unlock_id}'
7. Observer: /ja/observer/pending で表示確認
8. 24h timelock カウントダウン表示確認
```

##### シーケンス #3: Unlock (Emergency) テスト ★FIX-001後
```
1. Consumer → ロック済み資産選択
2. 緊急アンロック選択
3. ★Dilithium署名ステップがスキップされること確認
4. Bond計算表示: MAX(0.5 ETH, amount × 5%)
5. ウォレット署名のみで処理実行
6. DB: unlock_requests.is_emergency = true, bond_amount 正しい値
7. 7日 timelock 開始確認
```

##### シーケンス #4: Challenge + Slashing テスト
```
1. Observer → /ja/observer/suspicious で不審TX確認
2. Challenge作成: Bond表示 MAX(0.1 ETH, amount × 1%)
3. DB: SELECT * FROM challenges WHERE challenger = '{wallet}'
4. Defense期限: 48h
5. Slashing計算: N²×10%
6. 報酬配分: Challenger 60%, Insurance 20%, Burn 20%
```

##### シーケンス #5: Prover Registration テスト
```
1. Prover → /ja/prover/application で4ステップフォーム入力
2. Stake: $400K (Phase 1) 確認
3. HSM: FIPS 140-2 Level 3+ 確認
4. DB: SELECT * FROM provers WHERE status = 'pending_approval'
5. QS Admin: /ja/qs-admin/provers/requests で申請確認
```

##### シーケンス #6: Prover Exit テスト
```
1. Prover → /ja/prover/exit で退出開始
2. 7日 unbonding期間表示
3. DB: SELECT * FROM prover_exits WHERE prover_id = '{id}'
4. unbonding_end = initiated_at + 7 days
```

##### シーケンス #7: Governance Proposal テスト ★FIX-006後
```
1. Governance → /ja/governance/create で提案作成
2. 全5タイプ選択可能確認
3. 各タイプのQuorum値表示: Signal 3%, Parameter 4%, Treasury 6%, Upgrade 8%, Emergency 15%
4. DB: SELECT proposal_type, quorum FROM proposals WHERE proposal_id = '{id}'
5. 投票: /ja/governance/proposals/{id} で投票
6. DB: SELECT * FROM votes WHERE proposal_id = '{id}'
```

##### シーケンス #8: Emergency Pause テスト
```
1. Enterprise → Emergency操作UI確認
2. 5/9 Security Council 署名要件確認
3. 72h 最大期間確認
```

##### シーケンス #9: Token Hub (veQS) テスト ★FIX-007後
```
1. Token Hub → /ja/token-hub/lock でQSロック
2. 期間選択 → Multiplierプレビュー確認
3. 1ヶ月=1.0x, 3ヶ月=1.5x, 6ヶ月=2.0x, 12ヶ月=3.0x, 24ヶ月=5.0x, 48ヶ月=8.0x
4. DB: SELECT locked_amount, veqs_value FROM veqs_locks WHERE wallet_address = '{addr}'
5. veqs_value = locked_amount × multiplier 確認
6. QS Hub: /ja/qs-hub/dashboard でveQS残高表示確認
```

---

## Critical Rules

```xml
<rule id="FX-100" level="ABSOLUTE">
  3点検証（画面+DB+SEQUENCES.md）を省略してFIX完了と宣言することは禁止。
  全3点が✅でなければ、修正をやり直すこと。
</rule>

<rule id="FX-101" level="ABSOLUTE">
  Mock/FALLBACK除去時は必ず Loading/Error/Empty の3状態を実装すること。
  エラー状態を放置したまま「Mock除去完了」とは認めない。
</rule>

<rule id="FX-102" level="ABSOLUTE">
  SEQUENCES.mdのパラメータ値と画面表示値が不一致の場合、
  SEQUENCES.mdの値を正とする。FEまたはBEのコードを修正すること。
</rule>

<rule id="FX-103" level="ABSOLUTE">
  FIX_EXECUTION_PLAN.md のチェックリスト更新なしに次のFIXに進むことは禁止。
  verification ファイルの更新も必須。
</rule>

<rule id="FX-104" level="ABSOLUTE">
  BEコード修正時は cargo build + cargo test を実行し、
  ビルド成功 + テスト通過を確認すること。
</rule>

<rule id="FX-105" level="MUST">
  FEコード修正時は TypeScript コンパイル確認を行うこと。
  tsconfig strict モードでのエラーは全て解消すること。
</rule>

<rule id="FX-106" level="MUST">
  i18n修正は ja/en 両言語を同時に修正すること。
  片方のみの修正で完了とは認めない。
</rule>
```

---

## 進捗確認コマンド

`修正実行 進捗確認` を受けたら以下を実行:

1. `docs/architecture/FIX_EXECUTION_PLAN.md` を読み込み
2. 各FIX項目のチェックリスト状態を集計
3. 以下の形式で報告:

```
## 修正実行 進捗レポート

### Phase別進捗
| Phase | FIX項目 | 完了 | 残り | 進捗 |
|:-----:|:--------|:---:|:---:|:----:|
| 1 (P0) | FIX-001~004 | {n}/4 | {n}/4 | {%} |
| 2 (P1) | FIX-005~008 | {n}/4 | {n}/4 | {%} |
| 3 (P1) | FIX-009~012 | {n}/4 | {n}/4 | {%} |
| 4 (P1-2) | FIX-013~016 | {n}/4 | {n}/4 | {%} |
| 5 (P2) | FIX-017~022 | {n}/6 | {n}/6 | {%} |
| 6 (P3) | FIX-023~027 | {n}/5 | {n}/5 | {%} |

### シーケンス実行可能状態
| # | Sequence | 必要FIX | 完了FIX | 実行可能 |
|:--|:---------|:--------|:--------|:--------:|
| 1 | Lock | FIX-011,014 | {n}/{total} | ✅/❌ |
| ... | ... | ... | ... | ... |

### 全体進捗
- 完了FIX: {n}/27
- 実行可能シーケンス: {n}/9
- 次のFIX: FIX-{NNN} ({修正名})
```

---

## 関連ファイル参照

| 用途 | パス |
|:-----|:-----|
| **修正計画** | `docs/architecture/FIX_EXECUTION_PLAN.md` |
| **シーケンス定義** | `docs/core/SEQUENCES.md` |
| **DB実態** | `docs/architecture/DATABASE_ACTUAL_STATE.md` |
| **ストレージ設計** | `docs/architecture/STORAGE_ARCHITECTURE.md` |
| **矛盾記録** | `docs/architecture/DOCUMENT_CONTRADICTIONS.md` |
| **移行計画** | `docs/architecture/MIGRATION_PLAN.md` |
| **検証サマリー** | `docs/architecture/verification/VERIFICATION_SUMMARY.md` |
| **アプリ別検証** | `docs/architecture/verification/{app}_verification.md` |
| **FE Hooks** | `apps/web/src/hooks/{app}/use{App}.ts` |
| **BE Routes** | `services/api/src/routes/{module}.rs` |
| **BE Repos** | `services/api/src/db/repositories/{module}.rs` |
| **i18n (ja)** | `apps/web/locales/ja/{app}.json` |
| **i18n (en)** | `apps/web/locales/en/{app}.json` |
