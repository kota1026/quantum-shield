# オンチェーントラスト機構 要件定義書 (Phase 2: Proof-Based Trustless Enforcement)

> **Document Version**: 1.0
> **Created**: 2026-07-24
> **Status**: Draft (レビュー待ち)
> **Scope**: THRESH (SPHINCS+ 2/N 閾値検証) / L3 CoreLayer を「実 verifier」化する proof-based トラストレス強制
> **Related**: `docs/core/UNIFIED_SPEC.md`, `docs/core/SEQUENCES.md`, `docs/core/MODULAR_ARCHITECTURE.md`

---

## 1. 目的

Quantum Shield の設計原則 CP-5「透明性」は従来「全てオンチェーンで検証可能」と表明してきた。
しかしコード実態調査の結果、現行実装には**オンチェーンで暗号学的に強制されていないトラストポイント**が存在する（§3）。

本書は、この表明と実態のギャップを解消するための **Phase 2: proof-based トラストレスなオンチェーン強制** の要件を定義する。あわせて、対外表明を以下の通り置換する:

| 旧表明 | 新表明 |
|--------|--------|
| 「全てオンチェーンで検証可能」 | 「状態は L3 に記録・検証可能性を設計原則とし、トラストレスなオンチェーン暗号強制は proof-based で実装中」 |

この置換は「誇張の撤回」ではなく「強制メカニズムの明示」である。検証可能性（データの公開・追跡可能性）は既に成立している。Phase 2 で追加するのは**検証の強制**（不正な状態遷移がオンチェーンで拒否されること）である。

---

## 2. 用語定義

| 用語 | 定義 |
|------|------|
| **THRESH** | Prover Pool による SPHINCS+ 2/N 閾値署名検証経路。L1Vault の `_verifyThresholdSignatures` 系列を指す |
| **実 verifier** | 入力の暗号学的正当性を実際に検証し、不正入力を revert するオンチェーンコントラクト。プレースホルダ・簡易チェックを含まない |
| **proof-based** | 重い暗号検証（SPHINCS+ 署名 7,856 bytes × N 本、状態遷移）をオフチェーンで実行し、その実行正当性を ZK-STARK proof としてオンチェーンで検証する方式 |
| **トラストポイント** | 暗号学的強制ではなく、運用者・特権アドレス・オフチェーンプロセスへの信頼に依存している箇所 |
| **検証可能性 (Verifiability)** | 状態・イベントが公開され、第三者が事後検証できる性質。現行で成立済み |
| **強制 (Enforcement)** | 不正な状態遷移がオンチェーンで**事前に拒否**される性質。Phase 2 の対象 |

---

## 3. 現状分析 (As-Is): トラストポイント一覧

コード実態調査（2026-07-24, 対象コミット `3dc411e2`）による。

### 3.1 L1: THRESH 検証の簡易経路 【最重要ギャップ】

`src/l1/contracts/src/L1Vault.sol`

| # | 箇所 | 実態 | トラスト内容 |
|---|------|------|-------------|
| T-1 | `_verifySimplified` (L1109) | `sigHash = SHA3_256(pubKeyHash ‖ message ‖ sig)` を計算し **`sigHash != bytes32(0)` なら valid** — 恒真であり暗号検証ゼロ | 「active な Prover アドレスから送られた署名バイト列は正しい」という信頼。Prover が結託または秘密鍵漏洩なしで不正署名を通せる |
| T-2 | `useFullVerification` (L281, L1027) | フル検証への切替が `onlyOwner` の単独権限。owner が false に戻すことも可能 | owner 単一アドレスへの信頼 |
| T-3 | `_verifyWithSPHINCSVerifier` (L1080) | フル SPHINCS+ オンチェーン検証は実装済みだが、署名 7,856 bytes × N 本の直接検証はガス的に本番運用が非現実的 | 実質的に T-1 経路が常用される構造的誘因 |
| T-4 | `registerProver` (L961) | Prover 登録が `onlyOwner` | Prover 集合の構成が owner 信頼 |

### 3.2 L3: CoreLayer のプレースホルダ検証

`src/l3/src/core/CoreLayer.sol`

| # | 箇所 | 実態 | トラスト内容 |
|---|------|------|-------------|
| T-5 | `_verifyProof` (L331) | `proof.length >= 32` で valid とする明示的プレースホルダ（`TODO: Integrate with actual STARK verifier`） | 任意の 32 bytes 以上のバイト列で state root を更新可能。L3 状態遷移は sequencer/運用者信頼 |

### 3.3 オフチェーン依存

| # | 箇所 | 実態 | トラスト内容 |
|---|------|------|-------------|
| T-6 | L3 Aegis BFT 4-node | Dilithium 検証・SR 計算・VRF 選出はオフチェーン実行 | 4 ノード運用者への信頼（BFT 前提: 悪意 <1/3） |
| T-7 | Auto-Claim Service | 24h 後の `executeUnlock()` 呼出はオフチェーン bot | 実行の liveness 信頼（safety はタイムロックで担保済み） |

### 3.4 既存の proof-based 資産（未統合）

以下は実装済みだが、T-1/T-5 の経路に**接続されていない**:

- `STARKVerifier.sol` — ZK-STARK proof 検証 v1.0（Goldilocks field, SHA3-256, FRI 統合, ガス最適化済み）
- `FRIVerifier.sol` — FRI low-degree proof 検証
- `BatchVerifier.sol` — バッチ検証（`verifySTARKBatch` あり）
- `stark/AIRConstraints.sol`, `stark/ConstraintEvaluator.sol` — AIR 制約評価
- `SPHINCSVerifier.sol` — フル SPHINCS+-SHAKE-128s 検証（FIPS 205, CP-1 準拠）

**結論**: 部品は揃っている。Phase 2 の本質は「新規暗号開発」ではなく「**実 verifier への配線と簡易経路の廃止**」である。

---

## 4. 目標トラストモデル (To-Be)

```
                     As-Is                              To-Be (Phase 2)
┌────────────────────────────────────┐   ┌────────────────────────────────────┐
│ L1 Unlock:                         │   │ L1 Unlock:                         │
│  Prover署名 → _verifySimplified    │   │  Prover署名 N本をオフチェーン検証   │
│  (恒真チェック = Registry照合のみ) │   │  → STARK proof 生成                │
│                                    │   │  → L1 で proof 検証 (数百K gas)    │
│ トラスト: Prover集合の誠実性       │   │ トラスト: STARK健全性 + Registry   │
├────────────────────────────────────┤   ├────────────────────────────────────┤
│ L3 State Root:                     │   │ L3 State Root:                     │
│  proof.length >= 32 で更新許可     │   │  STARKVerifier.verifyProof() 必須  │
│ トラスト: sequencer運用者          │   │ トラスト: STARK健全性              │
└────────────────────────────────────┘   └────────────────────────────────────┘
```

### 4.1 残余トラスト（Phase 2 完了後も残るもの・明示する）

| 残余トラスト | 理由 | 緩和策 |
|-------------|------|--------|
| STARK 回路 (AIR) の正しさ | 回路バグは proof で強制できない | 監査 + 公開仕様 + テストベクタ |
| L3 BFT 4-node の liveness | proof は safety のみ強制 | Emergency Unlock 経路（7d + bond）の維持 |
| Auto-Claim の liveness | 同上 | ユーザー手動 claim の常時許可 |
| ガバナンス（verifier 差替権限） | アップグレード経路は必要 | Timelock + SecurityCouncil 多署名 + 無効化不可制約（FR-GOV-2） |

---

## 5. フェーズ定義

| Phase | 内容 | 状態 |
|-------|------|------|
| Phase 0 | 運用者信頼モデル（owner 直接操作） | 完了（過去） |
| Phase 1 | THRESH 構造の導入: Prover Registry + 2/N 署名収集 + タイムロック。ただし検証は簡易経路（T-1） | **完了（現行）** |
| **Phase 2** | **proof-based トラストレス強制: THRESH/L3 を実 verifier に接続、簡易経路の廃止** | **実装中（本書のスコープ）** |
| Phase 3 | Permissionless 化: Prover 登録の脱 owner、verifier パラメータのガバナンス移管完了 | 将来 |

---

## 6. 機能要件

### 6.1 FR-THRESH: L1 閾値検証の実 verifier 化

| ID | 要件 | 優先度 |
|----|------|:------:|
| FR-THRESH-1 | Unlock (Normal/Emergency) の SPHINCS+ 2/N 検証は、**STARK proof 検証を経由した強制**とする。proof は「(a) 各署名が FIPS 205 に従い検証済み (b) 署名者公開鍵が指定ブロック時点の ProverRegistry active 集合コミットメントに含まれる (c) valid 数 ≥ 閾値」を attest する | MUST |
| FR-THRESH-2 | `_verifySimplified`（恒真チェック）は本番経路から**削除**する。テスト用に残す場合は別コントラクト（`*Testnet.sol`）に隔離し、mainnet ビルドに含めない | MUST |
| FR-THRESH-3 | proof 検証失敗時は revert し、理由コード付きイベントを emit する（BE-003 ログ要件と対応） | MUST |
| FR-THRESH-4 | フォールバック経路として、フル SPHINCS+ 直接オンチェーン検証（`_verifyWithSPHINCSVerifier`）を**常時利用可能**に維持する（proof 生成系の障害時に資産が取り出せなくなることを防ぐ。ガス高コストは許容） | MUST |
| FR-THRESH-5 | ProverRegistry の active 集合は、proof の public input として参照可能なコミットメント（SHA3-256 ベース）をオンチェーンで維持する | MUST |
| FR-THRESH-6 | 検証方式の選択（proof-based / full-direct）はトランザクション提出者が選べる。**無検証経路は存在しない** | MUST |

### 6.2 FR-L3: CoreLayer の実 verifier 化

| ID | 要件 | 優先度 |
|----|------|:------:|
| FR-L3-1 | `CoreLayer._verifyProof` のプレースホルダ（`proof.length >= 32`）を削除し、`STARKVerifier.verifyProof()` 呼出に置換する | MUST |
| FR-L3-2 | state root 更新（`updateStateRoot` 系）は有効な STARK proof なしでは revert する。初期状態（`stateRoot == bytes32(0)`）の例外は deploy 時 1 回に限定する | MUST |
| FR-L3-3 | proof の public inputs は最低限 `(oldStateRoot, newStateRoot, batchCommitment)` を含み、状態遷移の連続性を強制する | MUST |
| FR-L3-4 | STARKVerifier のアドレスは immutable または Timelock+ガバナンス経由でのみ差替可能とする | MUST |
| FR-L3-5 | L3 上の検証失敗・成功はイベントとして記録し、Explorer で追跡可能にする（検証可能性の維持） | SHOULD |

### 6.3 FR-GOV: 権限・ガバナンス制約

| ID | 要件 | 優先度 |
|----|------|:------:|
| FR-GOV-1 | `useFullVerification` 相当のフラグを owner 単独で**無効化する権限を廃止**する。Phase 2 完了後、検証強制は不可逆（Core Principles CP-3/CP-4 と同格の憲法級制約） | MUST |
| FR-GOV-2 | verifier コントラクトの差替は Timelock（≥ 48h）+ SecurityCouncil 承認を必須とし、差替先が検証を弱める変更（no-op verifier 等）でないことをレビュー対象とする | MUST |
| FR-GOV-3 | Prover 登録の `onlyOwner`（T-4）は Phase 2 では維持してよいが、Phase 3 での stake ベース自動承認（`STAKE_AUTO`）移行を阻害する設計にしない | SHOULD |

### 6.4 FR-MSG: 対外表明・ドキュメントの置換

| ID | 要件 | 優先度 |
|----|------|:------:|
| FR-MSG-1 | `UNIFIED_SPEC.md` Core Principles CP-5 の記述を「状態は L3 に記録・検証可能性を設計原則とし、トラストレスなオンチェーン暗号強制は proof-based で実装中」に置換する | MUST |
| FR-MSG-2 | 以下の派生ドキュメントの同種表現を CP-5 新表明に整合させる: `docs/design/PROGRESS/DESIGN_SPEC_v3.md` (CP-3), `docs/design/PROGRESS/system_03_governance/DESIGN_BRIEF_governance.md` (L142), `docs/design/PROGRESS/system_06_explorer/DESIGN_BRIEF_explorer.md` (L114)。`docs/archive/` 配下は歴史的記録として凍結し変更対象外 | MUST |
| FR-MSG-3 | ピッチ資料（`docs/pitch/`）・フロントエンド表示文言（i18n キー）に「全てオンチェーンで検証可能」と同義の断定表現が残存しないこと。Phase 2 完了時に「proof-based で強制」へ更新する | SHOULD |
| FR-MSG-4 | Phase 2 完了までの期間、対外表明には「実装中 (in implementation)」を明記し、完了時に本書の受け入れ基準（§8）を満たした証跡（監査レポート・テストネット検証 tx）とともに表明を更新する | MUST |

---

## 7. 非機能要件

| ID | 要件 | 目標値 |
|----|------|--------|
| NFR-1 | **量子耐性 (CP-1)**: proof システムを含む全ハッシュは SHA3-256/SHAKE256 (FIPS 202)。keccak256・ECDSA・SHA-256 の新規導入禁止（EVM ネイティブ制約による既存例外を除く） | 128-bit PQ セキュリティ |
| NFR-2 | **ガス上限**: proof-based Unlock の L1 検証ガスは、現行 Unlock 総ガス目標（~490K gas, SEQUENCES §2）の 2 倍以内 | ≤ 1M gas / unlock |
| NFR-3 | **Proof 生成時間**: Normal Unlock の 24h タイムロック内に十分収まること | ≤ 1h (p99) |
| NFR-4 | **フォールバック可用性**: proof 生成系が全停止しても FR-THRESH-4 経路で資産回収可能 | RTO = 0（常時有効） |
| NFR-5 | **監査**: 簡易経路削除・verifier 統合の diff は外部監査（または Slither + 手動レビューの二重チェック）を経ること。`slither-reports/` に結果を残す | Critical/High 0 件 |
| NFR-6 | **テスト**: 新規/変更エンドポイント・コントラクト関数ごとに成功系 + 失敗系（不正 proof、閾値未達、非 active prover、リプレイ）を最低 1 件ずつ。E2E は「proof 検証失敗で revert すること」自体を検証する（HTTP 200 のみのスモーク禁止 — testing.md 準拠） | 全パス |
| NFR-7 | **後方互換**: 既存 Lock（Phase 1 で作成済み）の Unlock が Phase 2 移行後も可能であること。移行時に資産が凍結されないこと | 100% |

---

## 8. 受け入れ基準 (Phase 2 完了の定義)

機械検証可能な形で定義する:

1. **簡易経路の不在**:
   ```bash
   grep -rn "_verifySimplified" src/l1/contracts/src/ --include="*.sol" | grep -v Testnet | grep -v test
   # → 0 件
   ```
2. **プレースホルダの不在**:
   ```bash
   grep -rn "proof.length >= 32\|TODO: Integrate with actual STARK" src/l3/src/ --include="*.sol"
   # → 0 件
   ```
3. **検証強制の実証（テストネット）**: Sepolia / Arbitrum Sepolia 上で
   - 有効 proof での Unlock 成功 tx
   - **不正 proof での Unlock revert tx**（これが「強制」の証跡）
   の両方を記録し、`docs/ACTUAL_STATE.md` に tx hash を記載する
4. **権限の不可逆化**: `useFullVerification` を無効化する owner 関数が存在しない（または恒久 true）ことをコントラクトコードで確認
5. **ドキュメント整合**: FR-MSG-1/2 の全対象ファイルが新表明に更新済み
6. **テスト**: `forge test`（L1/L3）・`cargo test`・Playwright 統合テスト全パス、NFR-6 の失敗系テスト含む
7. **ガス計測**: proof-based Unlock の実測ガスが NFR-2 以内であることを forge gas-report で記録

---

## 9. スコープ外 (Non-Goals)

- L3 BFT ノードの permissionless 化（Phase 3 / IC-7）
- Dilithium 署名（ユーザー署名）のオンチェーン直接検証 — 引き続きオフチェーン検証 + proof 集約の対象
- 新しい proof システムの開発 — 既存 STARKVerifier v1.0 スタックを使用
- L1 コントラクトの再デプロイによる新 L1 作成（blockchain.md ルール: 既存 Sepolia コントラクトを使用。verifier 接続は既存アップグレード経路/新規 verifier 参照設定で行う）
- Auto-Claim サービスの分散化（liveness 問題であり本書の safety スコープ外）

---

## 10. トレーサビリティ

| 要件 | 対応コード/ドキュメント | 検証手段 | 状況 (2026-07-24) |
|------|------------------------|----------|-------------------|
| FR-THRESH-1 | STARK 集約 proof（AIR 回路） | 受け入れ基準 3 | 🟡 ギャップ分析完了 → `STARK_AIR_GAP_ANALYSIS.md` (M0〜M5) |
| FR-THRESH-2,6 | `L1Vault.sol`: `_verifySimplified` 削除、verifier 必須化 | 受け入れ基準 1 | 🟢 実装済み |
| FR-THRESH-4 | `L1Vault.sol` `_verifyWithSPHINCSVerifier` + `SPHINCSVerifier.sol` | forge test（フル検証経路） | 🟢 実装済み（唯一の経路に） |
| FR-THRESH-5 | `ProverRegistry.sol` | forge test + proof public input 整合テスト | 🔴 未着手 |
| FR-L3-1,2,3 | `CoreLayer.sol` + `IStateVerifier` + `L3StateVerifier.sol` (STARKVerifier 接続) | 受け入れ基準 2, 3 | 🟢 実装済み（配線完了。STARK 健全性の深化は R-2） |
| FR-L3-4 | `CoreLayer.stateVerifier` immutable | コードレビュー | 🟢 実装済み |
| FR-L3-5 | `StateVerified` イベント emit | forge test | 🟢 実装済み |
| FR-GOV-1 | `L1Vault.sol`: `setFullVerification` 削除、verifier unset 不可 | 受け入れ基準 4 | 🟢 実装済み |
| FR-GOV-2 | `L1Vault.sol`: propose→SecurityCouncil 承認→48h Timelock→execute の 2 段階差替 | forge test (governance flow) | 🟢 実装済み |
| FR-MSG-1 | `UNIFIED_SPEC.md` CP-5 | 受け入れ基準 5 | 🟢 実施済み |
| FR-MSG-2 | 派生ドキュメント 3 件 | grep 検証 | 🟢 実施済み（archive は凍結） |
| FR-MSG-3 | ピッチ資料・i18n | grep 検証 | 🔴 未着手 |
| NFR-1 | 全 .sol / proof 回路 | Slither + grep "keccak256" | 🟡 継続（新規コードは SHA3 のみ） |
| NFR-6 | `src/l1/contracts/test/`, `src/l3/test/` | forge test | 🟢 失敗系テスト追加済み |

---

## 11. リスクと論点（レビュー時の決定事項）

| # | 論点 | 推奨 | 決定 |
|---|------|------|:----:|
| R-1 | 既存 Sepolia L1Vault は immutable。簡易経路削除は新 verifier 参照の設定変更で足りるか、Vault 再デプロイが必要か（blockchain.md「新 L1 作成禁止」との整合） | **§12 の分析に基づき Option B（Sepolia 上への新 Vault デプロイ + 移行）を推奨**。即時の stopgap として Option A（旧 Vault のフル検証有効化）を併用 | 提案済み（要承認） |
| R-2 | STARK 回路（SPHINCS+ 検証の AIR 化）の実装工数 — 既存 `AIRConstraints.sol` がどこまでカバーするか | **ギャップ分析完了 → `docs/core/STARK_AIR_GAP_ANALYSIS.md`**。SPHINCS+ 回路は未着手だが Dilithium 回路 (~6,000 行) と prover service が既存。G1〜G7 のギャップとマイルストーンを定義 | 分析済み |
| R-3 | proof 生成の実行主体（Prover 自身 / 専用 proving service） | Phase 2 は専用 service（`src/crypto/stark-prover` が原型。liveness は FR-THRESH-4 で担保）、Phase 3 で分散化 | 未決 |
| R-4 | CP-5 の文言変更は「憲法は変更不可」原則と矛盾しないか | 本変更は保証の**強化**（検証可能性→強制）+ 実態の正確な表明であり、原則の弱体化ではないことを明記して承認プロセスを通す | PR #200 マージにより実質承認 |

---

## 12. R-1 分析: 既存 Sepolia Vault への Phase 2 反映方針

> 追記: 2026-07-24。決定者の承認待ち。

### 前提事実

- Phase 2 の L1Vault コード（簡易経路削除・verifier 必須化・FR-GOV-2 ガバナンス）は本リポジトリに実装済みだが、**Sepolia にデプロイ済みの Vault はプロキシなしの immutable コントラクト**であり、バイトコードに簡易経路（`_verifySimplified`）と `setFullVerification`（owner が検証を無効化できるスイッチ）を含んだままである
- ドキュメント間で Vault アドレスが不一致: `blockchain.md` は `0x07012aeF...7260`、`SEQUENCES.md` は `0x6F889C00...1c67`。**反映作業前にどちらが正か on-chain で検証すること**
- テストネット Vault の TVL は ~0.18 ETH（テスト資金のみ）であり、移行リスクは金銭的には僅少

### 選択肢

| Option | 内容 | 達成される保証 | コスト/リスク |
|:------:|------|---------------|--------------|
| **A** | 旧 Vault の設定変更のみ: `setSPHINCSVerifier` で実 verifier を設定し `setFullVerification(true)` を維持 | 検証は**現在**有効。ただし owner が単独でいつでも無効化可能（FR-GOV-1 未達）。簡易経路もバイトコードに残存 | 最小（tx 2 本）。「実装中」表明は変えられない |
| **B** | Phase 2 コードの新 Vault を Sepolia にデプロイし、新規 Lock を新 Vault へ移行。旧 Vault は既存 Lock の Unlock 専用として残置（NFR-7 準拠） | FR-THRESH-2/6・FR-GOV-1/2 が**オンチェーンで**成立。受け入れ基準 3（不正 proof revert の実 tx）を取得可能 | デプロイ + config/blockchain.md/フロントエンドのアドレス更新。blockchain.md ルールの解釈確認が必要（下記） |
| **C** | テストネットは現状維持し、次のマイルストーン（メインネット or 次期テストネット再構築)で Phase 2 コードを初回デプロイ | コードのみ。オンチェーン保証の実証なし | ゼロ。ただし Phase 2 完了宣言（§8）が不可能 |

### blockchain.md「新 L1 作成禁止」との整合

同ルールの趣旨は「**L1 チェーンを別チェーンに変えない / 既存デプロイを勝手に乱立させない**」であり、同一 Sepolia チェーン上でのプロトコル改訂に伴う新バージョンのコントラクトデプロイを禁じるものではないと解釈する（実際、ProverRegistry は「新規デプロイ予定 (TBD)」と記載されており、コントラクト追加は想定内）。ただしこの解釈の確定は決定者の承認事項とする。

### 推奨

**Option B を推奨**（即時の stopgap として Option A を併用可）。理由:
1. §8 受け入れ基準 3・4 は旧 Vault では構造的に達成不可能（簡易経路と無効化スイッチがバイトコードに焼き込まれている）
2. テストネットである今が移行コスト最小のタイミング（TVL 僅少・利用者限定）
3. メインネットは初回から Phase 2 コードで launch する前提であり、テストネットで移行手順（新旧並走・旧 Lock の残置 Unlock）を検証しておく価値が高い

### 実施手順（承認後）

1. on-chain で現行 Vault アドレスを確定し、ドキュメント不一致を解消
2. `SPHINCSVerifier` → `L1Vault`（Phase 2 版）の順に Sepolia へデプロイ（`script/DeployL1Vault.s.sol` 使用）
3. Prover 登録 + Registry 接続、フル検証経路での lock→unlock 実 tx と**不正署名 revert の実 tx** を記録（受け入れ基準 3）
4. `blockchain.md`・`config/default.yaml`・フロントエンド env のアドレス更新（旧 Vault は「legacy (unlock-only)」として記載残置）
5. `docs/ACTUAL_STATE.md` に移行記録を追記
