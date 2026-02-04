# Observer App Integration Rules

## 完了条件
このアプリの統合は、以下がすべて満たされた時に完了：

1. [x] DEMO_ パターン使用数 = 0
2. [x] 全コンポーネントで useQuery/useMutation 使用
3. [ ] Loading/Error/Empty の3状態実装
4. [ ] E2Eテスト全PASS
5. [ ] ログ検証PASS（バックエンドが実際にDB/Blockchainと通信）

## 検証コマンド
```bash
./scripts/verify-observer.sh
npx playwright test apps/web/e2e/observer/integration.spec.ts
```

## 依存関係
- 前提: Backend API稼働、PostgreSQL稼働
- 提供: Observer登録・監視、Challenge提出

## API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| /v1/observer/register | POST | Observer登録申請 |
| /v1/observer/dashboard | GET | ダッシュボードデータ |
| /v1/observer/alerts | GET | アラート一覧 |
| /v1/observer/challenge | POST | Challenge提出 |

## Hooks
- `useObserver.ts`: useObserverDashboard, useObserverAlerts, useObserverRegister, useSubmitChallenge

## 禁止事項
- DEMO_ プレフィックスのモックデータ使用
- ハードコード日本語（t() 経由必須）
- console.log（logger 使用必須）
