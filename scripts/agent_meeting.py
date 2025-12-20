import anthropic
import json
import os
import sys
import urllib.request

def send_slack(webhook_url, text):
    payload = json.dumps({"text": text}).encode('utf-8')
    req = urllib.request.Request(webhook_url, data=payload, headers={'Content-Type': 'application/json'})
    urllib.request.urlopen(req)

def main():
    mode = sys.argv[1] if len(sys.argv) > 1 else "quick"
    webhook_url = os.environ.get("SLACK_WEBHOOK_URL")
    
    client = anthropic.Anthropic()
    
    send_slack(webhook_url, f"🎯 *戦略会議開始* - モード: {mode}\n\n🤖 AIエージェントがコード分析中...")
    
    files_to_analyze = []
    for path in ["PURPOSE.md", "README.md", "Cargo.toml"]:
        try:
            with open(path, "r") as f:
                files_to_analyze.append(f"=== {path} ===\n{f.read()[:2000]}")
        except:
            pass
    context = "\n\n".join(files_to_analyze)
    
    agents = {
        "full": ["CSO", "Engineer", "DevOps", "Crypto Auditor", "Red Team"],
        "quick": ["CSO", "Engineer", "DevOps"],
        "security": ["CSO", "Crypto Auditor", "Red Team"]
    }
    agent_prompts = {
        "CSO": "セキュリティ責任者として、このプロジェクトのセキュリティ状況を1-2文で評価してください。",
        "Engineer": "エンジニアとして、コード品質と実装状況を1-2文で評価してください。",
        "DevOps": "DevOpsとして、インフラとCI/CD状況を1-2文で評価してください。",
        "Crypto Auditor": "暗号監査者として、暗号実装の安全性を1-2文で評価してください。",
        "Red Team": "Red Teamとして、潜在的な脆弱性を1-2文で指摘してください。"
    }
    agent_emojis = {"CSO": "🔒", "Engineer": "⚙️", "DevOps": "🚀", "Crypto Auditor": "🔐", "Red Team": "🔴"}
    
    selected_agents = agents.get(mode, agents["quick"])
    results = []
    
    for agent in selected_agents:
        prompt = agent_prompts[agent]
        message = client.messages.create(
            model="claude-sonnet-4-20250514",
            max_tokens=200,
            messages=[{"role": "user", "content": f"あなたは{agent}です。\n\nプロジェクト情報:\n{context}\n\n{prompt}"}]
        )
        response = message.content[0].text
        results.append(f"{agent_emojis[agent]} *{agent}*: {response}")
    
    report = "\n\n".join(results)
    send_slack(webhook_url, f"🎯 *戦略会議完了* - モード: {mode}\n\n📊 *エージェントレポート* ({len(selected_agents)}体)\n\n{report}\n\n✅ 分析完了\n_Quantum Shield Agent Army v1.0_")

if __name__ == "__main__":
    main()
