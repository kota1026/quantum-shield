#!/usr/bin/env python3
"""エージェントが自律的・協調的にコードを書き、テスト、レビュー、修正する
アジャイル型: 北極星に沿ったタスクは承認不要で自律実行"""

import anthropic
import requests
import json
import os
import base64
import re
from datetime import datetime

GITHUB_TOKEN = os.environ.get('GITHUB_TOKEN')
SLACK_WEBHOOK = os.environ.get('SLACK_WEBHOOK_URL')
ANTHROPIC_KEY = os.environ.get('ANTHROPIC_API_KEY')
REPO = 'kota1026/quantum-shield'
BASE_BRANCH = 'dev/phase2-native-stark'

AGENTS = {
    'CSO': {'emoji': '🔒', 'role': 'セキュリティ総括、チーム統括、最終判断'},
    'Crypto Auditor': {'emoji': '🔐', 'role': '暗号実装、暗号学的検証、新暗号アルゴリズムの理論設計'},
    'Red Team': {'emoji': '🔴', 'role': '脆弱性対策、攻撃シミュレーション、セキュリティテスト'},
    'Engineer': {'emoji': '⚙️', 'role': 'コード実装、開発作業、API設計'},
    'CTO': {'emoji': '🏗️', 'role': '技術戦略、アーキテクチャ設計、技術的意思決定'},
    'DevOps': {'emoji': '🚀', 'role': 'CI/CD、インフラ、テスト自動化'},
    'Researcher': {'emoji': '🔬', 'role': '技術調査、既存ライブラリ探索、新技術の理論設計・発明'},
    'CBO': {'emoji': '📊', 'role': 'ビジネス検討、市場調査'},
}

# 北極星キーワード（これに関連するタスクは自律実行）
NORTH_STAR_KEYWORDS = [
    'dilithium', '署名', 'signature', '暗号', 'crypto', 'stark', 'proof', '証明',
    'verify', 'replay', '偽造', 'security', 'セキュリティ', '実装', 'implement'
]

def send_slack(text):
    if SLACK_WEBHOOK:
        requests.post(SLACK_WEBHOOK, json={'text': text})

def github_api(method, endpoint, data=None):
    url = f'https://api.github.com{endpoint}'
    headers = {'Authorization': f'token {GITHUB_TOKEN}', 'Accept': 'application/vnd.github.v3+json'}
    resp = getattr(requests, method.lower())(url, headers=headers, json=data if data else None)
    return resp.json() if resp.status_code < 400 else None

def get_base_sha():
    ref = github_api('GET', f'/repos/{REPO}/git/ref/heads/{BASE_BRANCH.replace("/", "%2F")}')
    return ref['object']['sha'] if ref else None

def create_branch(branch_name):
    base_sha = get_base_sha()
    if not base_sha:
        return False
    result = github_api('POST', f'/repos/{REPO}/git/refs', {'ref': f'refs/heads/{branch_name}', 'sha': base_sha})
    return result is not None

def create_or_update_file(branch, path, content, message):
    existing = github_api('GET', f'/repos/{REPO}/contents/{path}?ref={branch}')
    sha = existing.get('sha') if existing and 'sha' in existing else None
    data = {'message': message, 'content': base64.b64encode(content.encode()).decode(), 'branch': branch}
    if sha:
        data['sha'] = sha
    return github_api('PUT', f'/repos/{REPO}/contents/{path}', data) is not None

def create_pull_request(branch, title, body):
    result = github_api('POST', f'/repos/{REPO}/pulls', {'title': title, 'body': body, 'head': branch, 'base': BASE_BRANCH})
    return result.get('html_url') if result else None

def update_issue(issue_number, progress, status, comment):
    labels_data = github_api('GET', f'/repos/{REPO}/issues/{issue_number}')
    if not labels_data:
        return
    current_labels = [l['name'] for l in labels_data.get('labels', []) if not l['name'].startswith('status:')]
    current_labels.append(f'status:{status}')
    github_api('PATCH', f'/repos/{REPO}/issues/{issue_number}', {'labels': current_labels})
    github_api('POST', f'/repos/{REPO}/issues/{issue_number}/comments', {'body': f'## 🤖 進捗更新 ({progress}%)\n\n**ステータス**: {status}\n\n{comment}'})

def get_project_context():
    context = ""
    for path in ['NORTH_STAR.md', 'PURPOSE.md', 'README.md']:
        file_data = github_api('GET', f'/repos/{REPO}/contents/{path}?ref={BASE_BRANCH}')
        if file_data and 'content' in file_data:
            content = base64.b64decode(file_data['content']).decode('utf-8')
            context += f"\n=== {path} ===\n{content[:3000]}\n"
    return context

def is_north_star_aligned(issue):
    """北極星に沿ったタスクかどうか判定（承認不要で自律実行）"""
    title = issue.get('title', '').lower()
    body = issue.get('body', '').lower()
    labels = [l['name'].lower() for l in issue.get('labels', [])]
    
    # priority:high は自律実行
    if 'priority:high' in labels:
        return True
    
    # 北極星キーワードが含まれていれば自律実行
    text = f"{title} {body}"
    for keyword in NORTH_STAR_KEYWORDS:
        if keyword.lower() in text:
            return True
    
    return False

def is_already_working(issue):
    """既に作業中かどうか"""
    labels = [l['name'] for l in issue.get('labels', [])]
    return any(l.startswith('status:') and l != 'status:open' for l in labels)

def get_autonomous_issues():
    """自律実行可能なIssueを取得（承認不要）"""
    issues = github_api('GET', f'/repos/{REPO}/issues?state=open&per_page=50')
    autonomous = []
    
    for issue in issues or []:
        # エージェント担当のIssueのみ
        if not any(l['name'].startswith('agent:') for l in issue.get('labels', [])):
            continue
        
        # 既に作業中はスキップ
        if is_already_working(issue):
            continue
        
        # 北極星に沿っていれば自律実行
        if is_north_star_aligned(issue):
            autonomous.append(issue)
    
    # 優先度でソート
    priority_order = {'priority:high': 0, 'priority:medium': 1, 'priority:low': 2}
    autonomous.sort(key=lambda x: min([priority_order.get(l['name'], 99) for l in x.get('labels', [])] or [99]))
    
    return autonomous

def consult_agent(client, from_agent, to_agent, question, context):
    """エージェント間でリアルタイム相談"""
    agent_info = AGENTS.get(to_agent, {'emoji': '🤖', 'role': '専門家'})
    
    system_prompt = f"""あなたは Quantum Shield の {to_agent} です。
役割: {agent_info['role']}

{from_agent} から相談を受けています。
専門家として簡潔に回答してください（3-5文）。

プロジェクト情報:
{context[:2000]}
"""
    
    try:
        message = client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=500,
            system=system_prompt,
            messages=[{'role': 'user', 'content': f"【{from_agent}からの相談】\n{question}"}]
        )
        return message.content[0].text
    except Exception as e:
        return f"相談エラー: {e}"

def agent_work(client, issue, context):
    """エージェントがタスクを実行"""
    title = issue.get('title', '')
    body = issue.get('body', '')
    number = issue.get('number')
    
    assignee = 'Engineer'
    for label in issue.get('labels', []):
        if label['name'].startswith('agent:'):
            assignee = label['name'].replace('agent:', '')
            break
    
    agent_info = AGENTS.get(assignee, {'emoji': '⚙️', 'role': '開発者'})
    
    system_prompt = f"""あなたは Quantum Shield の {assignee} です。
役割: {agent_info['role']}

【重要】NORTH_STAR（週次目標）に沿って作業してください。
【重要】コード実装が必要なタスクでは、必ず files にコードを含めてください。

プロジェクト情報:
{context}

JSON形式で回答:
{{
  "analysis": "タスクの分析結果",
  "consult_requests": [
    {{"to": "エージェント名", "question": "相談内容"}}
  ],
  "files": [
    {{"path": "ファイルパス", "content": "ファイル内容", "description": "説明"}}
  ],
  "test_files": [
    {{"path": "テストファイルパス", "content": "テスト内容"}}
  ],
  "summary": "実装内容の要約",
  "needs_review_by": ["Red Team"],
  "confidence": "high/medium/low"
}}
"""
    
    try:
        message = client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=4000,
            system=system_prompt,
            messages=[{'role': 'user', 'content': f"## Issue #{number}: {title}\n\n{body}\n\nこのタスクを実装してください。"}]
        )
        
        text = message.content[0].text
        match = re.search(r'\{[\s\S]*\}', text)
        if not match:
            return None
        
        result = json.loads(match.group())
        
        # エージェント間相談を処理
        consult_results = []
        for consult in result.get('consult_requests', []):
            to_agent = consult.get('to', 'Engineer')
            question = consult.get('question', '')
            send_slack(f"💬 *{assignee}* → *{to_agent}* に相談中...")
            answer = consult_agent(client, assignee, to_agent, question, context)
            consult_results.append({'from': assignee, 'to': to_agent, 'question': question, 'answer': answer})
            send_slack(f"✅ *{to_agent}*: {answer[:150]}...")
        
        result['consult_results'] = consult_results
        return result
        
    except Exception as e:
        print(f"Error: {e}")
        return None

def process_issue(client, issue, context):
    """Issueを処理"""
    number = issue['number']
    title = issue['title']
    
    assignee = 'Engineer'
    for label in issue.get('labels', []):
        if label['name'].startswith('agent:'):
            assignee = label['name'].replace('agent:', '')
            break
    
    agent_info = AGENTS.get(assignee, {'emoji': '⚙️'})
    
    send_slack(f"{agent_info['emoji']} *{assignee}* が *Issue #{number}* を自律実行開始: {title}")
    update_issue(number, 25, 'working', f'{assignee}が自律的に作業を開始しました（北極星に沿ったタスク）')
    
    # タスク実行
    work_result = agent_work(client, issue, context)
    if not work_result:
        update_issue(number, 25, 'blocked', '❌ タスク分析に失敗しました')
        return
    
    # 相談結果をIssueにコメント
    if work_result.get('consult_results'):
        consult_summary = "\n".join([
            f"**{c['from']}** → **{c['to']}**: {c['question']}\n> {str(c['answer'])[:200]}"
            for c in work_result['consult_results']
        ])
        github_api('POST', f'/repos/{REPO}/issues/{number}/comments', {
            'body': f"## 💬 エージェント間相談\n\n{consult_summary}"
        })
    
    # ファイルがなければ分析完了
    if not work_result.get('files'):
        update_issue(number, 100, 'completed', f"分析完了:\n{work_result.get('summary', '')}")
        send_slack(f"✅ *Issue #{number}* 分析完了！")
        return
    
    update_issue(number, 50, 'coding', f'コード生成完了。ファイル数: {len(work_result.get("files", []))}')
    
    # ブランチ作成 & ファイル追加
    branch_name = f'agent/issue-{number}'
    if not create_branch(branch_name):
        # ブランチが既に存在する場合は続行
        pass
    
    for file in work_result.get('files', []):
        create_or_update_file(branch_name, file['path'], file['content'], f'[#{number}] {file.get("description", "Add file")}')
    
    for test_file in work_result.get('test_files', []):
        create_or_update_file(branch_name, test_file['path'], test_file['content'], f'[#{number}] Add test')
    
    # PR作成
    pr_body = f"""## Issue #{number} 対応（自律実行）

{work_result.get('summary', '')}

### エージェント間相談
{chr(10).join([f"- {c['from']} → {c['to']}: {c['question'][:50]}..." for c in work_result.get('consult_results', [])])}

### 生成ファイル
{chr(10).join(['- ' + f['path'] for f in work_result.get('files', [])])}

---
🤖 Generated by Quantum Shield Agent Army (Autonomous Mode)
"""
    
    pr_url = create_pull_request(branch_name, f'[Agent] {title}', pr_body)
    
    if pr_url:
        update_issue(number, 100, 'completed', f'✅ PR作成完了: {pr_url}')
        send_slack(f"✅ *Issue #{number}* 完了！\n\nPR: {pr_url}")
    else:
        update_issue(number, 90, 'pr_exists', 'PRは既に存在するか作成に失敗')

def main():
    if not all([GITHUB_TOKEN, SLACK_WEBHOOK, ANTHROPIC_KEY]):
        print('Missing environment variables')
        return
    
    client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
    context = get_project_context()
    
    # 自律実行可能なIssueを取得
    autonomous_issues = get_autonomous_issues()
    
    if not autonomous_issues:
        send_slack("📋 *自律実行可能なタスクなし*\n\n北極星に沿った新しいタスクを作成するか、既存タスクに `priority:high` ラベルを追加してください。")
        print('No autonomous issues to process')
        return
    
    send_slack(f"""🚀 *自律実行モード開始*

📋 対象タスク: {len(autonomous_issues)}件
🎯 北極星に沿ったタスクを承認なしで実行します
""")
    
    for issue in autonomous_issues[:3]:
        process_issue(client, issue, context)
    
    send_slack("✅ *本サイクルの作業完了*\n\n次回: 30分後に再実行")

if __name__ == '__main__':
    main()
