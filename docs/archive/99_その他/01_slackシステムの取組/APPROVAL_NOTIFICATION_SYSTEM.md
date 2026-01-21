# 承認ワークフロー自動通知システム

## 概要

Claudeとの対話で承認が必要な場合にスマホ通知を受け取り、
承認するとワークフローが継続する仕組みを構築します。

---

## 方法1: GitHub Actions + モバイル承認（推奨）

### 仕組み
1. Claudeが承認必要タスクを検出
2. GitHub Issueを自動作成
3. GitHubアプリがスマホにPush通知
4. スマホでIssueをCloseすると承認完了
5. Webhook経由でワークフロー継続

### 設定手順

#### Step 1: GitHub Mobile アプリをインストール
- iOS: https://apps.apple.com/app/github/id1477376905
- Android: https://play.google.com/store/apps/details?id=com.github.android

#### Step 2: 通知設定をON
- Settings → Notifications → Push notifications → Issues → ON

#### Step 3: 承認ワークフロー

```yaml
# .github/workflows/approval-workflow.yml
name: Approval Workflow

on:
  repository_dispatch:
    types: [approval-required]

jobs:
  request-approval:
    runs-on: ubuntu-latest
    steps:
      - name: Create Approval Issue
        uses: actions/github-script@v7
        with:
          script: |
            const issue = await github.rest.issues.create({
              owner: context.repo.owner,
              repo: context.repo.repo,
              title: '🔔 承認が必要です: ${{ github.event.client_payload.task }}',
              body: `
              ## 承認リクエスト
              
              **タスク**: ${{ github.event.client_payload.task }}
              **詳細**: ${{ github.event.client_payload.details }}
              **作成日時**: ${new Date().toISOString()}
              
              ---
              
              ✅ **承認する場合**: このIssueをCloseしてください
              ❌ **拒否する場合**: "rejected" ラベルを追加してください
              `,
              labels: ['approval-pending']
            });
            console.log(`Created issue #${issue.data.number}`);

  wait-for-approval:
    needs: request-approval
    runs-on: ubuntu-latest
    steps:
      - name: Wait for Issue Close
        uses: actions/github-script@v7
        with:
          script: |
            // Poll for issue close (max 24 hours)
            const maxWait = 24 * 60 * 60 * 1000;
            const pollInterval = 30 * 1000; // 30 seconds
            const startTime = Date.now();
            
            while (Date.now() - startTime < maxWait) {
              const issues = await github.rest.issues.listForRepo({
                owner: context.repo.owner,
                repo: context.repo.repo,
                labels: 'approval-pending',
                state: 'closed'
              });
              
              if (issues.data.length > 0) {
                console.log('Approval received!');
                return;
              }
              
              await new Promise(r => setTimeout(r, pollInterval));
            }
            
            throw new Error('Approval timeout');

      - name: Continue Workflow
        run: |
          echo "Approval received, continuing..."
          # ここで次のタスクを実行
```

---

## 方法2: Slack Bot + Interactive Messages

### 仕組み
1. Slack Botが承認リクエストを送信
2. スマホのSlackアプリに通知
3. ボタンタップで承認/拒否
4. Webhook経由でワークフロー継続

### 設定

```python
# approval_bot.py
import os
from slack_sdk import WebClient
from slack_sdk.socket_mode import SocketModeClient
from slack_sdk.socket_mode.response import SocketModeResponse

client = WebClient(token=os.environ["SLACK_BOT_TOKEN"])

def send_approval_request(task: str, details: str, callback_url: str):
    client.chat_postMessage(
        channel="#quantum-shield-approvals",
        blocks=[
            {
                "type": "section",
                "text": {
                    "type": "mrkdwn",
                    "text": f"*🔔 承認リクエスト*\n\n*タスク*: {task}\n*詳細*: {details}"
                }
            },
            {
                "type": "actions",
                "elements": [
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "✅ 承認"},
                        "style": "primary",
                        "action_id": "approve",
                        "value": callback_url
                    },
                    {
                        "type": "button",
                        "text": {"type": "plain_text", "text": "❌ 拒否"},
                        "style": "danger",
                        "action_id": "reject",
                        "value": callback_url
                    }
                ]
            }
        ]
    )
```

---

## 方法3: Telegram Bot（最もシンプル）

### 仕組み
1. Telegram Botが通知を送信
2. スマホのTelegramアプリに通知
3. /approve または /reject コマンドで応答
4. Webhook経由でワークフロー継続

### 設定

```python
# telegram_approval.py
import telebot
import os

bot = telebot.TeleBot(os.environ["TELEGRAM_BOT_TOKEN"])
CHAT_ID = os.environ["TELEGRAM_CHAT_ID"]

def send_approval_request(task: str, task_id: str):
    markup = telebot.types.InlineKeyboardMarkup()
    markup.add(
        telebot.types.InlineKeyboardButton("✅ 承認", callback_data=f"approve:{task_id}"),
        telebot.types.InlineKeyboardButton("❌ 拒否", callback_data=f"reject:{task_id}")
    )
    
    bot.send_message(
        CHAT_ID,
        f"🔔 *承認リクエスト*\n\n*タスク*: {task}\n*ID*: `{task_id}`",
        parse_mode="Markdown",
        reply_markup=markup
    )

@bot.callback_query_handler(func=lambda call: call.data.startswith("approve:"))
def handle_approval(call):
    task_id = call.data.split(":")[1]
    # Webhookを叩いてワークフロー継続
    bot.answer_callback_query(call.id, "承認しました ✅")
    # trigger_workflow_continuation(task_id)
```

---

## 方法4: Claude Projects + Memory（最も統合的）

### 仕組み
Claude Projectsのメモリ機能を活用：

1. 承認待ちタスクをメモリに記録
2. 次回の会話開始時に自動検出
3. 「続きをやって」で継続

### 使用例

```
[前回の会話終了時]
Claude: 「P0-5のタスクは承認待ちです。承認後に『続きをやって』と言ってください。」

[新しい会話]
User: 続きをやって
Claude: [メモリから承認待ちタスクを検出] 「P0-5を継続します...」
```

---

## 推奨構成

| ユースケース | 推奨方法 |
|-------------|---------|
| 個人開発 | Telegram Bot |
| チーム開発 | Slack Bot |
| OSS/エンタープライズ | GitHub Actions |
| Claude統合 | Claude Projects + Memory |

---

## 今すぐできる最小構成

### Telegram Bot 5分セットアップ

1. @BotFather で新しいBotを作成
2. Bot Tokenを取得
3. 自分のChat IDを取得（@userinfobot）
4. 以下のスクリプトを実行：

```bash
# .env
TELEGRAM_BOT_TOKEN=your_token
TELEGRAM_CHAT_ID=your_chat_id
```

```python
# notify.py
import requests
import os

def notify(message: str):
    token = os.environ["TELEGRAM_BOT_TOKEN"]
    chat_id = os.environ["TELEGRAM_CHAT_ID"]
    url = f"https://api.telegram.org/bot{token}/sendMessage"
    requests.post(url, json={"chat_id": chat_id, "text": message})

# 使用例
notify("🔔 承認が必要です: Phase 0修正完了")
```

これで、Pythonスクリプトから直接スマホに通知を送れます！
