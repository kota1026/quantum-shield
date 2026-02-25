# Token Hub Integration Rules

## 完了条件
このアプリの統合は、以下がすべて満たされた時に完了：

1. [x] DEMO_ パターン使用数 = 0
2. [x] 全コンポーネントで useQuery/useMutation 使用
3. [ ] Loading/Error/Empty の3状態実装
4. [ ] E2Eテスト全PASS
5. [ ] ログ検証PASS（バックエンドが実際にDB/Blockchainと通信）

## 検証コマンド
```bash
./scripts/verify-token-hub.sh
npx playwright test apps/web/e2e/token-hub/integration.spec.ts
```

## 依存関係
- 前提: Backend API稼働、PostgreSQL稼働
- 提供: QSトークンステーキング、veQS、リワード

## API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| /v1/token-hub/dashboard | GET | ダッシュボード |
| /v1/token-hub/lock | POST | veQSロック作成 |
| /v1/token-hub/locks | GET | ロック一覧 |
| /v1/token-hub/extend | POST | ロック延長 |
| /v1/token-hub/delegates | GET | デリゲート一覧 |
| /v1/token-hub/delegate | POST | 委任 |
| /v1/token-hub/rewards | GET | リワード情報 |
| /v1/token-hub/claim | POST | リワード請求 |

## Hooks
- `useTokenHub.ts`: 18 hooks for staking, delegation, rewards

## 禁止事項
- DEMO_ プレフィックスのモックデータ使用
- ハードコード日本語（t() 経由必須）
- console.log（logger 使用必須）
