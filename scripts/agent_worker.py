#!/usr/bin/env python3
"""エージェントが自律的にコードを書き、テスト、レビュー、修正する
自律実行v2: NORTH_STAR.mdから動的読み込み、相談なし、高速サイクル
"""

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

def get_north_star():
    """NORTH_STAR.md から北極星情報を動的に取得"""
    file_data = github_api('GET', f'/repos/{REPO}/contents/NORTH_STAR.md?ref={BASE_BRANCH}')
    if not file_data or 'content' not in file_data:
        # デフォルトキーワード
        return {
            'content': '',
            'keywords': ['dilithium', '署名', 'signature', '暗号', 'crypto', 'stark', 'proof', '証明', 'verify', 'replay', '偽造', 'security', 'fips', 'nist', 'ml-dsa', 'zk', 'prover']
        }
    
    content = base64.b64decode(file_data['content']).decode('utf-8')
    
    # キーワードセクションを抽出
    keywords = []
    if '## キーワード' in content:
        keyword_section = content.split('## キーワード')[1].split('##')[0]
        keywords = [k.strip().lower() for k in keyword_section.replace('\n', ',').split(',') if k.strip() and len(k.strip()) > 1]
    
    # キーワードが見つからなければデフォルト
    if not keywords:
        keywords = ['dilithium', '署名', 'signature', '暗号', 'crypto', 'stark', 'proof', '証明', 'verify', 'replay', '偽造', 'security', 'fips', 'nist', 'ml-dsa', 'zk', 'prover']
    
    return {
        'content': content,
        'keywords': keywords
    }

def get_project_context(north_star_content):
    """プロジェクトコンテキストを取得"""
    context = f"\n=== NORTH_STAR.md (現在の北極星) ===\n{north_star_content}\n"
    
    for path in ['PURPOSE.md', 'README.md']:
        file_data = github_api('GET', f'/repos/{REPO}/contents/{path}?ref={BASE_BRANCH}')
        if file_data and 'content' in file_data:
            content = base64.b64decode(file_data['content']).decode('utf-8')
            context += f"\n=== {path} ===\n{content[:2000]}\n"
    
    return context

def is_north_star_aligned(issue, north_star):
    """北極星に沿ったタスクかどうか（動的判定）"""
    title = issue.get('title', '').lower()
    body = issue.get('body', '').lower()
    labels = [l['name'].lower() for l in issue.get('labels', [])]
    
    # priority:high は常に自律実行
    if 'priority:high' in labels:
        return True
    
    # 北極星キーワードチェック
    text = f"{title} {body}"
    for keyword in north_star.get('keywords', []):
        if keyword.lower() in text:
            return True
    
    return False

def is_already_working(issue):
    """既に作業中かどうか"""
    labels = [l['name'] for l in issue.get('labels', [])]
    return any(l.startswith('status:') and l not in ['status:open', 'status:blocked'] for l in labels)

def get_autonomous_issues(north_star):
    """自律実行可能なIssueを取得"""
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
        if is_north_star_aligned(issue, north_star):
            autonomous.append(issue)
    
    # 優先度でソート
    priority_order = {'priority:high': 0, 'priority:medium': 1, 'priority:low': 2}
    autonomous.sort(key=lambda x: min([priority_order.get(l['name'], 99) for l in x.get('labels', [])] or [99]))
    
    return autonomous

def agent_work(client, issue, context, north_star_content):
    """エージェントがタスクを実行（自律判断モード）"""
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

【最重要】完全自律実行モード
あなたは北極星に沿ったタスクを **相談なしで** 自分で判断・実行する権限があります。

1. 相談は不要です - 自分で最善の判断をして実行してください
2. 「調査」「確認」「分析」タスクは具体的な結果・成果物を出してください
3. 実装タスクは実際にコードを書いてください
4. 迷ったら北極星の方向に沿って決定してください

【現在の北極星】
{north_star_content}

【プロジェクト情報】
{context}

【出力形式】JSON:
{{
  "decision": "自分で決定した方針（相談せず即決定）",
  "analysis": "タスクの分析結果",
  "files": [
    {{"path": "ファイルパス", "content": "ファイル内容", "description": "説明"}}
  ],
  "summary": "実装・分析内容の要約（具体的に）",
  "next_steps": ["次のアクション1", "次のアクション2"]
}}

【重要】
- 相談選択肢を出すな！自分で決めろ！
- 「どうすべきでしょうか？」は禁止。「〜を実行した」と報告しろ
- filesが空でも、summaryに具体的な分析結果や決定事項を書け
"""
    
    try:
        message = client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=4000,
            system=system_prompt,
            messages=[{'role': 'user', 'content': f"## Issue #{number}: {title}\n\n{body}\n\n自律的に判断し、このタスクを完了させてください。相談不要、即実行。"}]
        )
        
        text = message.content[0].text
        match = re.search(r'\{[\s\S]*\}', text)
        if not match:
            return {'summary': text[:500], 'decision': '分析完了', 'files': [], 'next_steps': []}
        
        result = json.loads(match.group())
        return result
        
    except Exception as e:
        print(f"Error: {e}")
        return None

def process_issue(client, issue, context, north_star_content):
    """Issueを処理（相談なし）"""
    number = issue['number']
    title = issue['title']
    
    assignee = 'Engineer'
    for label in issue.get('labels', []):
        if label['name'].startswith('agent:'):
            assignee = label['name'].replace('agent:', '')
            break
    
    agent_info = AGENTS.get(assignee, {'emoji': '⚙️'})
    
    send_slack(f"{agent_info['emoji']} *{assignee}* が *Issue #{number}* を自律実行: {title}")
    update_issue(number, 25, 'working', f'{assignee}が自律的に作業を開始')
    
    work_result = agent_work(client, issue, context, north_star_content)
    if not work_result:
        update_issue(number, 50, 'blocked', '❌ タスク処理に失敗')
        return
    
    # ファイルがなければ分析完了
    if not work_result.get('files'):
        summary = work_result.get('summary', '分析完了')
        decision = work_result.get('decision', '')
        next_steps = work_result.get('next_steps', [])
        
        comment = f"**決定事項**: {decision}\n\n**サマリー**:\n{summary}"
        if next_steps:
            comment += f"\n\n**次のステップ**:\n" + "\n".join([f"- {s}" for s in next_steps])
        
        update_issue(number, 100, 'completed', comment)
        send_slack(f"✅ *Issue #{number}* 完了！\n決定: {decision[:80]}...")
        return
    
    update_issue(number, 50, 'coding', f'コード生成中。ファイル数: {len(work_result.get("files", []))}')
    
    branch_name = f'agent/issue-{number}'
    create_branch(branch_name)
    
    for file in work_result.get('files', []):
        create_or_update_file(branch_name, file['path'], file['content'], f'[#{number}] {file.get("description", "Add file")}')
    
    pr_body = f"""## Issue #{number} 対応（自律実行）

**決定事項**: {work_result.get('decision', 'N/A')}

### サマリー
{work_result.get('summary', '')}

### 生成ファイル
{chr(10).join(['- `' + f['path'] + '`: ' + f.get('description', '') for f in work_result.get('files', [])])}

### 次のステップ
{chr(10).join(['- ' + s for s in work_result.get('next_steps', [])])}

---
🤖 Generated by Quantum Shield Agent (Autonomous v2)
"""
    
    pr_url = create_pull_request(branch_name, f'[Agent] {title}', pr_body)
    
    if pr_url:
        update_issue(number, 100, 'completed', f'✅ PR作成完了: {pr_url}')
        send_slack(f"🎉 *Issue #{number}* PR作成！\n{pr_url}")
    else:
        update_issue(number, 90, 'pr_exists', 'PRは既に存在するか作成に失敗')

def main():
    if not all([GITHUB_TOKEN, SLACK_WEBHOOK, ANTHROPIC_KEY]):
        print('Missing environment variables')
        return
    
    client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
    
    # 北極星を動的に取得
    north_star = get_north_star()
    context = get_project_context(north_star.get('content', ''))
    
    autonomous_issues = get_autonomous_issues(north_star)
    
    if not autonomous_issues:
        send_slack("📋 *自律実行可能なタスクなし*\n新しいタスクを作成するか、`priority:high` ラベルを追加してください。")
        return
    
    send_slack(f"""🚀 *自律実行モード v2*

📋 対象: {len(autonomous_issues)}件
⚡ 相談なし・自律判断で即実行
🎯 北極星: NORTH_STAR.md から読み込み済み
""")
    
    # 5件ずつ処理
    for issue in autonomous_issues[:5]:
        process_issue(client, issue, context, north_star.get('content', ''))
    
    remaining = len(autonomous_issues) - 5
    if remaining > 0:
        send_slack(f"⏳ 残り {remaining} 件は次サイクルで処理")
    
    send_slack("✅ *サイクル完了* | 次回: 15分後")

if __name__ == '__main__':
    main()
