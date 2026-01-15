# PR作成・マージコマンド

現在のブランチの変更をPR作成してmainにマージします。

## 1. 変更確認

```bash
git status
git log --oneline origin/main..HEAD
```

## 2. コミット（未コミットがある場合）

```bash
git add -A
git commit -m "$ARGUMENTS"
git push -u origin $(git branch --show-current)
```

## 3. PR作成

GitHub Web UIで作成:
1. https://github.com/kota1026/quantum-shield/pulls
2. 「New pull request」
3. compare: 現在のブランチを選択
4. 「Create pull request」

または gh CLI:
```bash
gh pr create --title "$ARGUMENTS" --body "Phase 6 implementation updates"
```

## 4. マージ

GitHub Web UIで:
1. PRページを開く
2. 「Merge pull request」
3. 「Confirm merge」

または gh CLI:
```bash
gh pr merge --merge
```

## 5. ローカル更新

```bash
git checkout main
git pull origin main
```

## 6. Codespaces同期

Codespacesで:
```bash
git pull origin main
cd apps/web && pnpm install && pnpm dev
```
