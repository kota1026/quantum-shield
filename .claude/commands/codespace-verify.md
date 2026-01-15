# Codespaces UI確認コマンド

Codespacesで$ARGUMENTSシステムのUIを確認します。

## 1. Codespaces起動確認

ターミナルで以下を実行：

```bash
# サービス起動状態確認
docker ps

# PostgreSQL, Redis, RabbitMQが起動していない場合
cd /workspaces/quantum-shield
docker compose -f docker/docker-compose.dev.yml up -d

# フロントエンド起動
cd /workspaces/quantum-shield/apps/web
pnpm install
pnpm dev
```

## 2. ポート確認

Codespaces の「ポート」タブで以下を確認：
- **3000**: Next.js フロントエンド ← ここでUI確認
- **5432**: PostgreSQL
- **6379**: Redis
- **15672**: RabbitMQ管理画面

## 3. UI確認URL

ポート3000を「公開」に設定後、以下のURLでアクセス：

```
https://{codespace-name}-3000.app.github.dev/ja/consumer/landing
https://{codespace-name}-3000.app.github.dev/ja/consumer/dashboard
https://{codespace-name}-3000.app.github.dev/en/consumer/landing
```

## 4. 確認チェックリスト

- [ ] ページが404にならない
- [ ] Tailwindスタイルが適用されている（背景色、ボタン色）
- [ ] 日本語/英語切り替えが動作する
- [ ] hinomaru（赤）, gold（金）の色が表示される

## 5. トラブルシューティング

**502エラーの場合:**
```bash
cd /workspaces/quantum-shield/apps/web && pnpm dev
```

**スタイルが適用されない場合:**
```bash
ls apps/web/postcss.config.js  # 存在確認
cat apps/web/postcss.config.js # 内容確認
```

**ポートが表示されない場合:**
- Codespaces「ポート」タブ → 「ポートの追加」→ 3000
