# Enterprise Admin Integration Rules

## 完了条件
このアプリの統合は、以下がすべて満たされた時に完了：

1. [x] DEMO_ パターン使用数 = 0
2. [x] 全コンポーネントで useQuery/useMutation 使用
3. [ ] Loading/Error/Empty の3状態実装
4. [ ] E2Eテスト全PASS
5. [ ] ログ検証PASS（バックエンドが実際にDB/Blockchainと通信）

## 検証コマンド
```bash
./scripts/verify-enterprise.sh
npx playwright test apps/web/e2e/enterprise/integration.spec.ts
```

## 依存関係
- 前提: Backend API稼働、PostgreSQL稼働、Enterprise契約
- 提供: エンタープライズダッシュボード、TVL、Volume、Prover管理

## API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| /v1/enterprise/dashboard | GET | ダッシュボード |
| /v1/enterprise/tvl | GET | TVL統計 |
| /v1/enterprise/volume | GET | ボリューム統計 |
| /v1/enterprise/provers | GET | Prover一覧 |
| /v1/enterprise/provers/:id | GET | Prover詳細 |
| /v1/enterprise/observers | GET | Observer一覧 |
| /v1/enterprise/transactions | GET | 取引一覧 |
| /v1/enterprise/monitoring | GET | 監視データ |
| /v1/enterprise/status | GET | システムステータス |

## Hooks
- `useEnterprise.ts`: 14 hooks for enterprise operations

## 禁止事項
- DEMO_ プレフィックスのモックデータ使用
- ハードコード日本語（t() 経由必須）
- console.log（logger 使用必須）
