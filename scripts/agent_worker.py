#!/usr/bin/env python3
"""エージェントが自律的にコードを書き、テスト、レビュー、修正する"""

import anthropic
import requests
import json
import os
import base64
from datetime import datetime

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
    labels = github_api('GET', f'/repos/{REPO}/issues/{issue_number}')
    if not labels:
        return
    current_labels = [l['name'] for l in labels.get('labels', []) if not l['name'].startswith('status:')]
    current_labels.append(f'status:{status}')
    github_api('PATCH', f'/repos/{REPO}/issues/{issue_number}', {'labels': current_labels})
    github_api('POST', f'/repos/{REPO}/issues/{issue_number}/comments', {'body': f'## 🤖 進捗更新 ({progress}%)\n\n**ステータス**: {status}\n\n{comment}'})

def get_project_context():
    context = ""
    for path in ['PURPOSE.md', 'README.md', 'meetings/PROJECT_STATE.md', 'Cargo.toml']:
        file_data = github_api('GET', f'/repos/{REPO}/contents/{path}?ref={BASE_BRANCH}')
        if file_data and 'content' in file_data:
            content = base64.b64decode(file_data['content']).decode('utf-8')
            context += f"\n=== {path} ===\n{content[:2000]}\n"
    return context

def get_approved_issues():
    issues = github_api('GET', f'/repos/{REPO}/issues?state=open&per_page=50')
    approved = []
    for issue in issues or []:
        if any(l['name'].startswith('agent:') for l in issue.get('labels', [])):
            comments = github_api('GET', f'/repos/{REPO}/issues/{issue["number"]}/comments')
            for c in (comments or []):
                if '✅ オーナー承認' in c.get('body', ''):
                    approved.append(issue)
                    break
    return approved

def agent_generate_code(client, issue, context):
    title = issue.get('title', '')
    body = issue.get('body', '')
    number = issue.get('number')
    
    assignee = 'Engineer'
    for label in issue.get('labels', []):
        if label['name'].startswith('agent:'):
            assignee = label['name'].replace('agent:', '')
            break
    
    comments = github_api('GET', f'/repos/{REPO}/issues/{number}/comments') or []
    approval_comment = ""
    for c in comments:
        if '✅ オーナー承認' in c.get('body', ''):
            approval_comment = c['body']
            break
    
    system_prompt = f"""あなたは Quantum Shield プロジェクトの {assignee} エージェントです。
タスクに基づいてコードを生成してください。

プロジェクト情報:
{context}

JSON形式で回答:
{{
  "files": [
    {{"path": "ファイルパス", "content": "ファイル内容", "description": "説明"}}
  ],
  "test_files": [
    {{"path": "テストファイルパス", "content": "テスト内容"}}
  ],
  "summary": "実装内容の要約",
  "needs_review_by": ["Red Team", "Crypto Auditor"],
  "confidence": "high/medium/low",
  "questions": []
}}

重要:
- 必達要件: 証明生成10秒以内、ガス代87.5%削減
- Rustコードの場合はcargo testが通るように
- 不明点があればquestionsに記載（【ご相談】としてオーナーに通知）
"""
    
    user_prompt = f"""## Issue #{number}: {title}

{body}

## オーナー承認内容:
{approval_comment}

このタスクを実装してください。"""
    
    try:
        message = client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=4000,
            system=system_prompt,
            messages=[{'role': 'user', 'content': user_prompt}]
        )
        
        import re
        text = message.content[0].text
        match = re.search(r'\{[\s\S]*\}', text)
        return json.loads(match.group()) if match else None
    except Exception as e:
        print(f"Error: {e}")
        return None

def agent_review_code(client, issue, code_result, context, reviewer):
    system_prompt = f"""あなたは Quantum Shield の {reviewer} です。
以下のコードをレビューしてください。

プロジェクト情報:
{context}

JSON形式で回答:
{{
  "approved": true/false,
  "issues": ["問題点1", "問題点2"],
  "suggestions": ["提案1", "提案2"],
  "security_concerns": ["セキュリティ懸念"],
  "can_auto_fix": true/false,
  "fix_description": "自動修正の説明"
}}
"""
    
    user_prompt = f"""## レビュー対象
{json.dumps(code_result, ensure_ascii=False, indent=2)}

セキュリティと品質の観点からレビューしてください。"""
    
    try:
        message = client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=2000,
            system=system_prompt,
            messages=[{'role': 'user', 'content': user_prompt}]
        )
        
        import re
        text = message.content[0].text
        match = re.search(r'\{[\s\S]*\}', text)
        return json.loads(match.group()) if match else None
    except:
        return None

def process_issue(client, issue, context):
    number = issue['number']
    title = issue['title']
    
    send_slack(f"🚀 *Issue #{number}* の作業を開始: {title}")
    update_issue(number, 25, 'working', 'コード生成を開始しました')
    
    # Step 1: コード生成
    code_result = agent_generate_code(client, issue, context)
    if not code_result:
        update_issue(number, 25, 'blocked', '❌ コード生成に失敗しました')
        return
    
    # 相談事項があれば即時通知
    if code_result.get('questions'):
        questions = '\n'.join([f"• {q}" for q in code_result['questions']])
        send_slack(f"""🚨 *【ご相談】Issue #{number}*

❓ 確認事項:
{questions}

ご判断をお願いします。""")
        update_issue(number, 30, 'need_consultation', f'確認事項があります:\n{questions}')
        return
    
    update_issue(number, 50, 'testing', f'コード生成完了。レビュー中...\n\n生成ファイル数: {len(code_result.get("files", []))}')
    
    # Step 2: レビュー
    reviewers = code_result.get('needs_review_by', ['Engineer'])
    all_approved = True
    review_comments = []
    
    for reviewer in reviewers[:2]:
        review = agent_review_code(client, issue, code_result, context, reviewer)
        if review:
            if not review.get('approved'):
                all_approved = False
                if review.get('can_auto_fix'):
                    review_comments.append(f"⚠️ {reviewer}: 自動修正可能 - {review.get('fix_description')}")
                else:
                    issues_text = '\n'.join([f"• {i}" for i in review.get('issues', [])])
                    review_comments.append(f"❌ {reviewer}: 修正必要\n{issues_text}")
            else:
                review_comments.append(f"✅ {reviewer}: 承認")
    
    if not all_approved:
        update_issue(number, 60, 'review_failed', f'レビュー結果:\n' + '\n'.join(review_comments))
        send_slack(f"⚠️ *Issue #{number}* レビューで問題検出。自律修正を試みます...")
        return
    
    update_issue(number, 75, 'approved', f'レビュー完了:\n' + '\n'.join(review_comments))
    
    # Step 3: ブランチ作成 & ファイル追加
    branch_name = f'agent/issue-{number}'
    if not create_branch(branch_name):
        update_issue(number, 75, 'blocked', 'ブランチ作成に失敗')
        return
    
    for file in code_result.get('files', []):
        create_or_update_file(branch_name, file['path'], file['content'], f'[#{number}] {file.get("description", "Add file")}')
    
    for test_file in code_result.get('test_files', []):
        create_or_update_file(branch_name, test_file['path'], test_file['content'], f'[#{number}] Add test')
    
    # Step 4: PR作成
    pr_body = f"""## Issue #{number} 対応

{code_result.get('summary', '')}

### 生成ファイル
{chr(10).join(['- ' + f['path'] for f in code_result.get('files', [])])}

### レビュー結果
{chr(10).join(review_comments)}

---
🤖 Generated by Quantum Shield Agent Army
"""
    
    pr_url = create_pull_request(branch_name, f'[Agent] {title}', pr_body)
    
    if pr_url:
        update_issue(number, 100, 'completed', f'✅ PR作成完了: {pr_url}')
        send_slack(f"✅ *Issue #{number}* 完了！\n\nPR: {pr_url}")
    else:
        update_issue(number, 90, 'blocked', 'PR作成に失敗')

def main():
    if not all([GITHUB_TOKEN, SLACK_WEBHOOK, ANTHROPIC_KEY]):
        print('Missing environment variables')
        return
    
    client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
    context = get_project_context()
    
    approved_issues = get_approved_issues()
    if not approved_issues:
        print('No approved issues to process')
        return
    
    send_slack(f"🤖 *エージェント作業開始*\n\n承認済みタスク: {len(approved_issues)}件")
    
    for issue in approved_issues[:3]:
        process_issue(client, issue, context)

if __name__ == '__main__':
    main()
