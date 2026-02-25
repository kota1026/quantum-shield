# QS Hub Integration Rules

## 完了条件
このアプリの統合は、以下がすべて満たされた時に完了：

1. [x] DEMO_ パターン使用数 = 0
2. [x] 全コンポーネントで useQuery/useMutation 使用
3. [ ] Loading/Error/Empty の3状態実装
4. [ ] E2Eテスト全PASS
5. [ ] ログ検証PASS（バックエンドが実際にDB/Blockchainと通信）

## 検証コマンド
```bash
./scripts/verify-qs-hub.sh
npx playwright test apps/web/e2e/qs-hub/integration.spec.ts
```

## 依存関係
- 前提: Backend API稼働、PostgreSQL稼働
- 提供: QSガバナンス、ステーキング、リワード

## API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| /v1/qs-hub/dashboard/stats | GET | ダッシュボード統計 |
| /v1/qs-hub/proposals | GET | 提案一覧 |
| /v1/qs-hub/proposals/:id | GET | 提案詳細 |
| /v1/qs-hub/proposals/:id/vote | POST | 投票 |
| /v1/qs-hub/council | GET | カウンシル |
| /v1/qs-hub/stakes | GET/POST | ステーク |
| /v1/qs-hub/delegates | GET | デリゲート |
| /v1/qs-hub/rewards | GET | リワード |
| /v1/qs-hub/rewards/claim | POST | リワード請求 |

## Hooks
- `useQSHub.ts`: 15 hooks for governance and staking

## 禁止事項
- DEMO_ プレフィックスのモックデータ使用
- ハードコード日本語（t() 経由必須）
- console.log（logger 使用必須）
