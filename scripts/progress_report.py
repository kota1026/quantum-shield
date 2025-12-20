#!/usr/bin/env python3
"""90分ごとの進捗報告 + エージェント作業実行"""

import anthropic
import requests
import json
import os
from datetime import datetime

GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
SLACK_WEBHOOK = os.environ.get('SLACK_WEBHOOK_URL')
ANTHROPIC_KEY = os.environ.get('ANTHROPIC_API_KEY')
REPO = 'kota1026/quantum-shield'

def send_slack(text):
    if SLACK_WEBHOOK:
        requests.post(SLACK_WEBHOOK, json={'text': text})

def get_open_issues():
    url = f'https://api.github.com/repos/{REPO}/issues'
    headers = {'Authorization': f'token {GITHUB_TOKEN}'}
    params = {'state': 'open', 'per_page': 50}
    resp = requests.get(url, headers=headers, params=params)
    return resp.json() if resp.status_code == 200 else []

def get_consultations():
    try:
        with open('consultations/pending.json', 'r') as f:
            return json.load(f)
    except:
        return []

def save_consultation(consultation):
    os.makedirs('consultations', exist_ok=True)
    pending = get_consultations()
    pending.append(consultation)
    with open('consultations/pending.json', 'w') as f:
        json.dump(pending, f, ensure_ascii=False, indent=2)

def add_issue_comment(issue_number, comment):
    url = f'https://api.github.com/repos/{REPO}/issues/{issue_number}/comments'
    headers = {'Authorization': f'token {GITHUB_TOKEN}'}
    requests.post(url, headers=headers, json={'body': comment})

def analyze_and_work_on_issue(client, issue):
    title = issue.get('title', '')
    body = issue.get('body', '')
    number = issue.get('number')
    labels = [l['name'] for l in issue.get('labels', [])]
    
    assignee = 'CSO'
    for label in labels:
        if label.startswith('agent:'):
            assignee = label.replace('agent:', '')
            break
    
    context = ''
    for path in ['PURPOSE.md', 'README.md', 'meetings/PROJECT_STATE.md']:
        try:
            with open(path, 'r') as f:
                context += f'\n=== {path} ===\n{f.read()[:1500]}'
        except:
            pass
    
    system_prompt = f"""あなたは Quantum Shield の {assignee} です。
タスクを分析し作業を進めてください。

プロジェクト情報:
{context}

JSON形式で回答:
{{
  "status": "working/blocked/need_consultation/completed",
  "progress_percent": 0-100,
  "current_work": "現在やっていること",
  "findings": "発見事項",
  "next_steps": "次のステップ",
  "consultation": null または {{"question": "相談内容", "options": ["A", "B"], "recommendation": "推奨"}},
  "blockers": []
}}

重要な判断が必要な場合は必ずconsultationを設定。"""
    
    try:
        message = client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=1500,
            system=system_prompt,
            messages=[{'role': 'user', 'content': f'Issue #{number}: {title}\n\n{body}'}]
        )
        
        import re
        text = message.content[0].text
        match = re.search(r'\{[\s\S]*\}', text)
        result = json.loads(match.group()) if match else {'status': 'working', 'progress_percent': 10}
        result.update({'issue_number': number, 'issue_title': title, 'assignee': assignee})
        return result
    except Exception as e:
        return {'status': 'error', 'issue_number': number, 'issue_title': title, 'assignee': assignee, 'error': str(e)}

def main():
    if not all([GITHUB_TOKEN, SLACK_WEBHOOK, ANTHROPIC_KEY]):
        print('Missing environment variables')
        return
    
    client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
    send_slack('📊 *90分定期報告を開始*\n\n🤖 エージェントがタスクを確認中...')
    
    issues = get_open_issues()
    agent_issues = [i for i in issues if any(l['name'].startswith('agent:') for l in i.get('labels', []))]
    
    if not agent_issues:
        send_slack('📊 *進捗報告*\n\n現在アクティブなタスクはありません。')
        return
    
    results = []
    
    for issue in agent_issues[:10]:
        result = analyze_and_work_on_issue(client, issue)
        results.append(result)
        
        # Issueにコメント
        comment = f"""## 🤖 エージェント作業報告 ({datetime.now().strftime('%m/%d %H:%M')})

**担当**: {result.get('assignee')} | **進捗**: {result.get('progress_percent', 0)}%

**現在の作業**: {result.get('current_work', 'N/A')}

**発見事項**: {result.get('findings', 'N/A')}

**次のステップ**: {result.get('next_steps', 'N/A')}
"""
        add_issue_comment(result['issue_number'], comment)
        
        # 相談が必要な場合
        if result.get('consultation'):
            c = result['consultation']
            consultation = {
                'timestamp': datetime.now().isoformat(),
                'issue_number': result['issue_number'],
                'issue_title': result['issue_title'],
                'assignee': result['assignee'],
                'question': c.get('question'),
                'options': c.get('options'),
                'recommendation': c.get('recommendation'),
                'resolved': False
            }
            save_consultation(consultation)
            
            opts = '\n'.join([f"• {opt}" for opt in c.get('options', [])])
            send_slack(f"""🚨 *【ご相談】エージェントからの相談*

📋 *Issue*: <https://github.com/{REPO}/issues/{result['issue_number']}|#{result['issue_number']} {result['issue_title']}>
👤 *担当*: {result['assignee']}

❓ *相談内容*:
{c.get('question')}

🔀 *選択肢*:
{opts}

💡 *推奨*: {c.get('recommendation')}

---
ご判断をお願いします。""")
    
    # サマリー
    report = f"📊 *90分定期報告* ({datetime.now().strftime('%m/%d %H:%M')})\n\n"
    for r in results:
        emoji = {'working': '🟡', 'blocked': '🔴', 'need_consultation': '🟠', 'completed': '🟢'}.get(r.get('status'), '⚪')
        report += f"{emoji} *#{r['issue_number']}* {r['issue_title'][:25]}... ({r.get('progress_percent', 0)}%) - {r['assignee']}\n"
    
    pending = [c for c in get_consultations() if not c.get('resolved')]
    if pending:
        report += f"\n⚠️ *未解決の【ご相談】*: {len(pending)}件"
    
    report += "\n\n_次回報告: 90分後_"
    send_slack(report)

if __name__ == '__main__':
    main()
