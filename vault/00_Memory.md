# 00_Memory — Quantum Shield 引き継ぎ書

> Claude が毎セッション最初に読むファイル。更新日: 2026-07-14
> 詳細な実態は `docs/ACTUAL_STATE.md`、統合計画は `docs/INTEGRATION_METHODOLOGY_v2.md` を参照。

## 1. プロジェクト概要

耐量子暗号による資産カストディプロトコル。ユーザーの ETH を L1 Vault にロックし、
Dilithium (NIST FIPS 204 ML-DSA-65) + SPHINCS+ のデュアル署名、Prover Pool、VRF、Time Lock で保護する。

- L1 = Ethereum Sepolia (chain 11155111)、L3 = ローカル Anvil (31337) / Arbitrum Sepolia (421614)
- 2026-03-03 時点で Readiness 100%（全 9 シーケンス統合済み、L1 実トランザクション検証済み、L3 は 12 コントラクトを Arbitrum Sepolia にデプロイ + Sourcify 検証済み）
- 現在は **Beta 公開準備フェーズ**（下記「進行中」参照）

## 2. 体制・環境

- リポジトリ: `kota1026/quantum-shield`（オーナー: kota1026）
- Backend: Rust/Axum + sqlx + PostgreSQL 16 + Redis 7 + RabbitMQ（port 8080、`src/api/api/`）
- Frontend: Next.js 14 App Router + React Query + Wagmi/RainbowKit、i18n は ja/en（port 3000、`src/frontend/web/`）
- Contracts: Foundry。L1 41 ファイル / L3 58 ファイル（`src/contracts/`）
- 11 の frontend アプリ: consumer / prover / observer / explorer / governance / token-hub / qs-hub / qs-admin / admin / enterprise / ecosystem
- コントラクトアドレスは `.claude/rules/blockchain.md` が正。**新しい L1 デプロイは絶対に作らない**

## 3. コアシーケンス一覧（顧客ファイル相当）

| # | フロー | 状態 | ファイル |
|---|--------|------|---------|
| 1 | Consumer Lock | FE→BE→DB→L1 実証済み | [10_Flows/01_consumer-lock.md](10_Flows/01_consumer-lock.md) |
| 2 | Normal Unlock | 統合済み（24h timelock + Auto-Claim） | [10_Flows/02_normal-unlock.md](10_Flows/02_normal-unlock.md) |
| 3 | Emergency Unlock | 統合済み（7d + bond） | [10_Flows/03_emergency-unlock.md](10_Flows/03_emergency-unlock.md) |
| 4 | Prover Registration | API 統合済み | [10_Flows/04_prover-registration.md](10_Flows/04_prover-registration.md) |
| 5 | Observer Challenge | API 統合済み | [10_Flows/05_observer-challenge.md](10_Flows/05_observer-challenge.md) |
| 6 | Slashing | FE→API 統合済み | [10_Flows/06_slashing.md](10_Flows/06_slashing.md) |
| 7 | Governance | FE→BE→DB→L3 統合済み | [10_Flows/07_governance.md](10_Flows/07_governance.md) |
| 8 | Emergency Pause | FE→API 統合済み | [10_Flows/08_emergency-pause.md](10_Flows/08_emergency-pause.md) |
| 9 | Token Hub (veQS) | FE→BE→DB 統合済み | [10_Flows/09_token-hub.md](10_Flows/09_token-hub.md) |

## 4. 進行中プロジェクト

- **Beta 公開準備**: 漏洩シークレットのローテーション → git 履歴クリーニング → リポジトリ公開（手順: `docs/BETA_LAUNCH_GUIDE.md`）。直近コミットで Redis optional 化・本番 CORS・Docker イメージ修正済み
- **WASM SDK npm publish**: `src/frontend/sdk/wasm/pkg/` 準備完了、`npm login` 後に `./scripts/publish.sh --publish`
- **ピッチ資料の数値更新**: 「99% complete, L1 Sepolia + L3 Arbitrum Sepolia live」
- タスクの正は [20_Actions.md](20_Actions.md)

## 5. 主要プロセス

```bash
docker compose up -d postgres redis rabbitmq l3-node minio minio-init
cd src/api/api && DATABASE_URL="postgresql://quantum:quantum_dev@localhost:5432/quantum_shield" sqlx migrate run
cargo run --bin api-server        # :8080
cd src/frontend/web && pnpm dev   # :3000
```

- 品質ゲート: `npx tsc --noEmit` 0 errors / `cargo test` 全パス / `npx playwright test` 全パス / スタブ検出 0 件（`.claude/rules/testing.md`）
- 実装後は必ずスタブ検出 grep を実行（`CLAUDE.md` Session Rules 参照）

## 6. コミュニケーション様式

- コミット規約: `feat:` / `fix:` / `refactor:` / `test:`（英語、命令形）
- ドキュメントは日本語中心、コード・コミットは英語
- 1 セッション = 1 フローの 1 レイヤー。複数アプリを混ぜない
- UI テキストは必ず `t('key')` 経由（ja/en 両対応）、専門用語（Dilithium, SPHINCS+, veQS 等）は初出でツールチップ

## 7. 判断基準

詳細は [30_Library/decision-criteria.md](30_Library/decision-criteria.md)。要点:

1. 非テストファイルにモック/フォールバック/デモ定数を置かない（hooks が自動ブロック）
2. 型は一方向: DB → Backend `types.rs` → Frontend `types.ts` → Components。下位レイヤーが独自型を定義しない
3. L1 は既存 Sepolia コントラクトのみ。新規 L1 デプロイ禁止
4. アプリ層の暗号は NIST FIPS 204 / SHA3-256 のみ（keccak256・ECDSA 禁止、Solidity 内は例外）
5. データ取得コンポーネントは Loading / Error / Empty の 3 状態必須
6. 「ユニットテストが通る ≠ システムが動く」— DB 永続化・L1 トランザクション・実データ表示まで確認する（Moonwell Lesson）
