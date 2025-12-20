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
    """エージェント担当のOpenなIssueを取得"""
    url = f'https://api.github.com/repos/{REPO}/issues'
    headers = {'Authorization': f'token {GITHUB_TOKEN}'}
    params = {'state': 'open', 'per_page': 50}
    resp = requests.get(url, headers=headers, params=params)
    return resp.json() if resp.status_code == 200 else []

def get_consultations():
    """未解決の相談事項を取得"""
    try:
        with open('consultations/pending.json', 'r') as f:
            return json.load(f)
    except:
        return []

def save_consultation(consultation):
    """相談事項を保存"""
    os.makedirs('consultations', exist_ok=True)
    pending = get_consultations()
    pending.append(consultation)
    with open('consultations/pending.json', 'w') as f:
        json.dump(pending, f, ensure_ascii=False, indent=2)

def add_issue_comment(issue_number, comment):
    """Issueにコメントを追加"""
    url = f'https://api.github.com/repos/{REPO}/issues/{issue_number}/comments'
    headers = {'Authorization': f'token {GITHUB_TOKEN}'}
    requests.post(url, headers=headers, json={'body': comment})

def analyze_and_work_on_issue(client, issue):
    """エージェントがIssueを分析して作業"""
    title = issue.get('title', '')
    body = issue.get('body', '')
    number = issue.get('number')
    labels = [l['name'] for l in issue.get('labels', [])]
    
    # 担当エージェントを特定
    assignee = 'CSO'
    for label in labels:
        if label.startswith('agent:'):
            assignee = label.replace('agent:', '')
            break
    
    # プロジェクト情報を読み込み
    context = ''
    for path in ['PURPOSE.md', 'README.md', 'meetings/PROJECT_STATE.md']:
        try:
            with open(path, 'r') as f:
                context += f'\n=== {path} ===\n{f.read()[:1500]}'
        except:
            pass
    
    system_prompt = f"""あなたは Quantum Shield の {assignee} です。
以下のタスクを分析し、作業を進めてください。

プロジェクト情報:
{context}

回答は以下のJSON形式で:
{{
  "status": "working/blocked/need_consultation/completed",
  "progress_percent": 0-100,
  "current_work": "現在やっていること",
  "findings": "発見事項・分析結果",
  "next_steps": "次のステップ",
  "consultation": null または {{
    "question": "相談内容",
    "options": ["選択肢A", "選択肢B"],
    "recommendation": "推奨案"
  }},
  "blockers": ["障害があれば"]
}}

重要な判断が必要な場合や、チームで意見が分かれる場合は必ずconsultationを設定してください。"""
    
    user_prompt = f"""## Issue #{number}: {title}

{body}

このタスクを分析し、作業を進めてください。"""
    
    try:
        message = client.messages.create(
            model='claude-sonnet-4
