#!/usr/bin/env python3
"""デイリースタンドアップ - CSOが毎朝チーム状況を報告"""

import anthropic
import requests
import json
import os
import base64

GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
SLACK_WEBHOOK = os.environ.get('SLACK_WEBHOOK_URL')
ANTHROPIC_KEY = os.environ.get('ANTHROPIC_API_KEY')
REPO = 'kota1026/quantum-shield'
BASE_BRANCH = 'dev/phase2-native-stark'

def send_slack(text):
    if SLACK_WEBHOOK:
        requests.post(SLACK_WEBHOOK, json={'text': text})

def github_api(method, endpoint, data=None):
    url = f'https://api.github.com{endpoint}'
    headers = {'Authorization': f'token {GITHUB_TOKEN}', 'Accept': 'application/vnd.github.v3+json'}
    resp = getattr(requests, method.lower())(url, headers=headers, json=data if data else None)
    return resp.json() if resp.status_code < 400 else None

def get_north_star():
    file_data = github_api('GET', f'/repos/{REPO}/contents/NORTH_STAR.md?ref={BASE_BRANCH}')
    if file_data and 'content' in file_data:
        return base64.b64decode(file_data['content']).decode('utf-8')
    return ""

def get_open_issues():
    return github_api('GET', f'/repos/{REPO}/issues?state=open&per_page=50') or []

def get_pending_consultations():
    file_data = github_api('GET', f'/repos/{REPO}/contents/consultations/pending.json?ref={BASE_BRANCH}')
    if file_data and 'content' in file_data:
        content = base64.b64decode(file_data['content']).decode('utf-8')
        pending = json.loads(content)
        return [p for p in pending if not p.get('resolved', False)]
    return []

def main():
    if not all([GITHUB_TOKEN, SLACK_WEBHOOK, ANTHROPIC_KEY]):
        print('Missing environment variables')
        return
    
    client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
    
    north_star = get_north_star()
    issues = get_open_issues()
    pending = get_pending_consultations()
    
    # ステータス別に集計
    status_count = {}
    agent_count = {}
    
    for issue in issues:
        status = 'open'
        for label in issue.get('labels', []):
            if label['name'].startswith('status:'):
                status = label['name'].replace('status:', '')
            if label['name'].startswith('agent:'):
                agent = label['name'].replace('agent:', '')
                agent_count[agent] = agent_count.get(agent, 0) + 1
        status_count[status] = status_count.get(status, 0) + 1
    
    # CSO分析
    system_prompt = """あなたはQuantum ShieldのCSOです。
毎朝のスタンドアップで簡潔に報告してください（3-5文）。
1. 北極星への進捗
2. 今日の優先事項
3. ブロッカーがあれば警告
"""
    
    try:
        message = client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=500,
            system=system_prompt,
            messages=[{'role': 'user', 'content': f"北極星:\n{north_star[:1000]}\n\nIssue数: {len(issues)}\n未解決相談: {len(pending)}"}]
        )
        cso_report = message.content[0].text
    except:
        cso_report = "分析中..."
    
    # レポート作成
    emoji_map = {'working': '🟡', 'completed': '🟢', 'blocked': '🔴', 'need_consultation': '🟠', 'open': '⚪'}
    
    status_lines = [f"{emoji_map.get(s, '⚪')} {s}: {c}件" for s, c in status_count.items()]
    agent_lines = [f"• {a}: {c}件" for a, c in agent_count.items()]
    
    report = f"""☀️ *おはようございます！デイリースタンドアップ*

📊 *Issue状況*:
{chr(10).join(status_lines)}

👥 *エージェント別*:
{chr(10).join(agent_lines)}

🚨 *未解決の相談*: {len(pending)}件

---
🔒 *CSO報告*:
{cso_report}
"""
    
    send_slack(report)

if __name__ == '__main__':
    main()
