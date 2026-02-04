# Governance App Integration Rules

## 完了条件
このアプリの統合は、以下がすべて満たされた時に完了：

1. [x] DEMO_ パターン使用数 = 0
2. [x] 全コンポーネントで useQuery/useMutation 使用
3. [ ] Loading/Error/Empty の3状態実装
4. [ ] E2Eテスト全PASS
5. [ ] ログ検証PASS（バックエンドが実際にDB/Blockchainと通信）

## 検証コマンド
```bash
./scripts/verify-governance.sh
npx playwright test apps/web/e2e/governance/integration.spec.ts
```

## 依存関係
- 前提: Backend API稼働、PostgreSQL稼働、veQS残高
- 提供: 提案作成・投票・結果表示

## API Endpoints
| Endpoint | Method | Description |
|----------|--------|-------------|
| /v1/governance/proposals | GET | 提案一覧 |
| /v1/governance/proposals/:id | GET | 提案詳細 |
| /v1/governance/proposals | POST | 提案作成 |
| /v1/governance/vote | POST | 投票 |
| /v1/governance/council | GET | カウンシルメンバー |
| /v1/governance/delegates | GET | デリゲート一覧 |

## Hooks
- `useGovernance.ts`: useProposals, useProposalDetail, useVote, useCouncil

## 禁止事項
- DEMO_ プレフィックスのモックデータ使用
- ハードコード日本語（t() 経由必須）
- console.log（logger 使用必須）
