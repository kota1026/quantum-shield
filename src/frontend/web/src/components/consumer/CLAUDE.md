# Consumer App Integration Rules

## 完了条件
このアプリの統合は、以下がすべて満たされた時に完了：

1. [x] DEMO_ パターン使用数 = 0
2. [x] 全コンポーネントで useQuery/useMutation 使用
3. [ ] Loading/Error/Empty の3状態実装
4. [ ] E2Eテスト全PASS
5. [ ] ログ検証PASS（バックエンドが実際にDB/Blockchainと通信）

## 検証コマンド
```bash
./scripts/verify-consumer.sh
npx playwright test apps/web/e2e/consumer/integration.spec.ts
```

## 依存関係
- 前提: Backend API稼働、PostgreSQL稼働
- 提供: Lock/Unlock機能、ユーザーダッシュボード

## API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| /v1/consumer/dashboard | GET | ダッシュボードデータ取得 |
| /v1/lock | POST | Lock作成 |
| /v1/unlock | POST | Unlock申請 |
| /v1/user/locks | GET | ユーザーのLock一覧 |
| /v1/user/transactions | GET | 取引履歴 |

## Hooks
- `useConsumer.ts`: useUserDashboard, useUserTransactions, useCreateLock, useRequestUnlock

## 禁止事項
- DEMO_ プレフィックスのモックデータ使用
- ハードコード日本語（t() 経由必須）
- console.log（logger 使用必須）
