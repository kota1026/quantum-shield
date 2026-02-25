# QS Admin Integration Rules

## 完了条件
このアプリの統合は、以下がすべて満たされた時に完了：

1. [x] DEMO_ パターン使用数 = 0
2. [x] 全コンポーネントで useQuery/useMutation 使用
3. [x] Loading/Error/Empty の3状態実装
4. [ ] E2Eテスト全PASS
5. [ ] ログ検証PASS（バックエンドが実際にDB/Blockchainと通信）

## 検証コマンド
```bash
./scripts/verify-qs-admin.sh
npx playwright test apps/web/e2e/qs-admin/integration.spec.ts
```

## 依存関係
- 前提: Backend API稼働、PostgreSQL稼働、Admin認証
- 提供: 65 endpoints (13カテゴリ) の管理機能

## API Categories (65 endpoints)
| Category | Endpoints | Description |
|----------|:---------:|-------------|
| auth | 5 | ログイン、ログアウト、2FA |
| dashboard | 3 | 概要、統計、アラート |
| transactions | 8 | Lock/Unlock監視 |
| users | 6 | ユーザー管理 |
| prover | 6 | Prover承認・管理 |
| observer | 4 | Observer管理 |
| treasury | 10 | ウォレット・送金 |
| governance | 5 | 提案管理 |
| members | 2 | スタッフ管理 |
| support | 4 | チケット・FAQ |
| announcements | 2 | お知らせ |
| analytics | 4 | 分析 |
| system | 6 | ログ・メンテナンス |

## Hooks
- `hooks/admin/*.ts`: 9 hook files, 63 operations

## API Client
- `lib/api/admin/client.ts`: 完成済み

## 禁止事項
- DEMO_ プレフィックスのモックデータ使用
- ハードコード日本語（t() 経由必須）
- console.log（logger 使用必須）
