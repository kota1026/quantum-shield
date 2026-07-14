# 20_Actions — タスク台帳

> 書式: `- [ ] タスク | 担当 | 期日 | 関連`
> 完了したら `- [x]` にして「完了ログ」へ移動。Claude はセッション終了時にここを更新する。

## オープン

- [ ] 漏洩シークレットのローテーション（Anthropic API key / Infura / L1 秘密鍵） | kota | 公開前必須 | `docs/BETA_LAUNCH_GUIDE.md` Step 1
- [ ] git 履歴クリーニング（git-filter-repo で .env 系を除去） | kota | ローテーション後 | `docs/BETA_LAUNCH_GUIDE.md` Step 2
- [ ] リポジトリ公開（Beta） | kota | 履歴クリーニング後 | `docs/BETA_LAUNCH_GUIDE.md` Step 3〜
- [ ] WASM SDK を npm publish（`npm login` 後 `./scripts/publish.sh --publish`） | kota | — | `src/frontend/sdk/wasm/`
- [ ] ピッチ資料の数値更新（99% complete, L1 Sepolia + L3 Arbitrum Sepolia live） | kota | — | `docs/pitch/`

## 完了ログ

- [x] 2026-03-03: Phase 0-6 全完了（Readiness 100%）| 詳細は `docs/ACTUAL_STATE.md`
- [x] 2026-03-03: L3 Arbitrum Sepolia 12 コントラクトデプロイ + Sourcify 検証
- [x] 直近: Beta デプロイ向け修正（Redis optional / 本番 CORS / Docker イメージに config 同梱）
- [x] 2026-07-14: Project Memory Vault (`vault/`) を導入
