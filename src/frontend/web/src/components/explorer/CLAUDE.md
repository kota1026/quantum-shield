# Explorer App Integration Rules

## 完了条件
このアプリの統合は、以下がすべて満たされた時に完了：

1. [x] DEMO_ パターン使用数 = 0
2. [x] 全コンポーネントで useQuery/useMutation 使用
3. [ ] Loading/Error/Empty の3状態実装
4. [ ] E2Eテスト全PASS
5. [ ] ログ検証PASS（バックエンドが実際にDB/Blockchainと通信）

## 検証コマンド
```bash
./scripts/verify-explorer.sh
npx playwright test apps/web/e2e/explorer/integration.spec.ts
```

## 依存関係
- 前提: Backend API稼働、PostgreSQL稼働
- 提供: ネットワーク統計、Lock/Unlock/Prover閲覧

## API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| /v1/explorer/overview | GET | ネットワーク概要 |
| /v1/explorer/locks | GET | Lock一覧 |
| /v1/explorer/locks/:id | GET | Lock詳細 |
| /v1/explorer/unlocks | GET | Unlock一覧 |
| /v1/explorer/provers | GET | Prover一覧 |
| /v1/explorer/provers/:id | GET | Prover詳細 |
| /v1/explorer/challenges | GET | Challenge一覧 |
| /v1/explorer/search | GET | 検索 |
| /v1/explorer/analytics | GET | 分析データ |

## Hooks
- `useExplorer.ts`: 21 hooks for all explorer operations

## 禁止事項
- DEMO_ プレフィックスのモックデータ使用
- ハードコード日本語（t() 経由必須）
- console.log（logger 使用必須）
