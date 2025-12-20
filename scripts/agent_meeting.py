import anthropic
import json
import os
import sys
import urllib.request
from datetime import datetime

def send_slack(webhook_url, text):
    payload = json.dumps({"text": text}).encode('utf-8')
    req = urllib.request.Request(webhook_url, data=payload, headers={'Content-Type': 'application/json'})
    urllib.request.urlopen(req)

def save_meeting_minutes(mode, results, summary):
    """議事録をファイルに保存"""
    now = datetime.now()
    filename = f"meetings/{now.strftime('%Y-%m-%d')}-{mode}-meeting.md"
    
    content = f"""# 戦略会議議事録
**日時**: {now.strftime('%Y年%m月%d日 %H:%M')}
**モード**: {mode}
**参加エージェント**: {len(results)}体

---

## エージェントレポート

"""
    for result in results:
        content += f"{result}\n\n"
    
    content += f"""---

## サマリー（CSO総括）

{summary}

---

## 次のアクション

_会議結果に基づいて更新_

---
_Quantum Shield Agent Army v1.0_
"""
    
    with open(filename, "w") as f:
        f.write(content)
    
    return filename

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "quick"
    webhook_url = os.environ.get("SLACK_WEBHOOK_URL")
    
    client = anthropic.Anthropic()
    
    send_slack(webhook_url, f"🎯 *戦略会議開始* - モード: {mode}\n\n🤖 11体のAIエージェントがコード分析中...")
    
    # プロジェクト情報を読み込み
    files_to_analyze = []
    for path in ["PURPOSE.md", "README.md", "Cargo.toml", "meetings/PROJECT_STATE.md"]:
        try:
            with open(path, "r") as f:
                files_to_analyze.append(f"=== {path} ===\n{f.read()[:2000]}")
        except:
            pass
    context = "\n\n".join(files_to_analyze)
    
    # 11体のエージェント定義
    agents = {
        "full": [
            "Purpose Guardian", "Crypto Auditor", "Red Team", "CTO", "CSO",
            "CFO", "CBO", "Engineer", "Researcher", "DevOps", "Legal"
        ],
        "quick": ["CSO", "Engineer", "DevOps"],
        "security": ["Purpose Guardian", "Crypto Auditor", "Red Team", "CSO"]
    }
    
    agent_prompts = {
        "Purpose Guardian": "PURPOSE.md準拠の守護者として、このプロジェクトがミッションに沿っているか1-2文で評価してください。",
        "Crypto Auditor": "暗号監査者として、暗号実装の安全性を1-2文で評価してください。",
        "Red Team": "Red Teamとして、潜在的な脆弱性を1-2文で指摘してください。",
        "CTO": "CTOとして、技術戦略とアーキテクチャを1-2文で評価してください。",
        "CSO": "セキュリティ責任者として、このプロジェクトのセキュリティ状況を1-2文で評価してください。",
        "CFO": "CFOとして、開発コストとリソース効率を1-2文で評価してください。",
        "CBO": "ビジネス責任者として、このプロジェクトのビジネス価値を1-2文で評価してください。",
        "Engineer": "エンジニアとして、コード品質と実装状況を1-2文で評価してください。",
        "Researcher": "研究者として、使用している技術の最新性と革新性を1-2文で評価してください。",
        "DevOps": "DevOpsとして、インフラとCI/CD状況を1-2文で評価してください。",
        "Legal": "法務担当として、コンプライアンスと規制リスクを1-2文で評価してください。"
    }
    
    agent_emojis = {
        "Purpose Guardian": "🛡️",
        "Crypto Auditor": "🔐",
        "Red Team": "🔴",
        "CTO": "🏗️",
        "CSO": "🔒",
        "CFO": "💰",
        "CBO": "📊",
        "Engineer": "⚙️",
        "Researcher": "🔬",
        "DevOps": "🚀",
        "Legal": "⚖️"
    }
    
    selected_agents = agents.get(mode, agents["quick"])
    results = []
    raw_results = []
    
    for agent in selected_agents:
        prompt = agent_prompts[agent]
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=200,
            messages=[{"role": "user", "content": f"あなたは{agent}です。\n\nプロジェクト情報:\n{context}\n\n{prompt}"}]
        )
        response = message.content[0].text
        results.append(f"{agent_emojis[agent]} *{agent}*: {response}")
        raw_results.append({"agent": agent, "emoji": agent_emojis[agent], "response": response})
    
    # CSO による総括
    all_reports = "\n".join([f"{r['agent']}: {r['response']}" for r in raw_results])
    summary_message = client.messages.create(
        model="claude-sonnet-4-20250514",
        max_tokens=300,
        messages=[{"role": "user", "content": f"""あなたはCSO（チーフセキュリティオフィサー）です。
以下の各エージェントのレポートを総括し、3-4文でまとめてください。
重要なポイントと推奨アクションを含めてください。

{all_reports}"""}]
    )
    summary = summary_message.content[0].text
    
    # 議事録を保存
    try:
        minutes_file = save_meeting_minutes(mode, results, summary)
        send_slack(webhook_url, f"📝 議事録を保存しました: `{minutes_file}`")
    except Exception as e:
        send_slack(webhook_url, f"⚠️ 議事録保存エラー: {str(e)}")
    
    # Slackに結果を送信
    report = "\n\n".join(results)
    send_slack(webhook_url, f"""🎯 *戦略会議完了* - モード: {mode}

📊 *エージェントレポート* ({len(selected_agents)}体)

{report}

---

🔒 *CSO総括*:
{summary}

✅ 分析完了
_Quantum Shield Agent Army v1.0_""")

if __name__ == "__main__":
    main()
