# Prover Portal Integration Rules

## 完了条件
このアプリの統合は、以下がすべて満たされた時に完了：

1. [x] DEMO_ パターン使用数 = 0
2. [x] 全コンポーネントで useQuery/useMutation 使用
3. [ ] Loading/Error/Empty の3状態実装
4. [ ] E2Eテスト全PASS
5. [ ] ログ検証PASS（バックエンドが実際にDB/Blockchainと通信）

## 検証コマンド
```bash
./scripts/verify-prover.sh
npx playwright test apps/web/e2e/prover/integration.spec.ts
```

## 依存関係
- 前提: Backend API稼働、PostgreSQL稼働
- 提供: Prover登録・管理、署名リクエスト処理

## API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| /v1/prover/register | POST | Prover登録申請 |
| /v1/prover/dashboard | GET | ダッシュボードデータ |
| /v1/prover/requests | GET | 署名リクエスト一覧 |
| /v1/prover/sign | POST | 署名実行 |
| /v1/prover/metrics | GET | パフォーマンスメトリクス |

## Hooks
- `useProver.ts`: useProverDashboard, useProverRequests, useProverRegister, useProverSign

## 禁止事項
- DEMO_ プレフィックスのモックデータ使用
- ハードコード日本語（t() 経由必須）
- console.log（logger 使用必須）
