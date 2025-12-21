#!/usr/bin/env python3
"""エージェントが自律的・協調的にコードを書き、テスト、レビュー、修正する
+ Researcher/Crypto Auditor による技術ブレイクスルー探索"""

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

# エージェント定義（役割強化）
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

def get_project_context():
    """プロジェクトコンテキストを取得（NORTH_STAR + 最新リサーチ含む）"""
    context = ""
    for path in ['NORTH_STAR.md', 'PURPOSE.md', 'README.md', 'meetings/PROJECT_STATE.md']:
        file_data = github_api('GET', f'/repos/{REPO}/contents/{path}?ref={BASE_BRANCH}')
        if file_data and 'content' in file_data:
            content = base64.b64decode(file_data['content']).decode('utf-8')
            context += f"\n=== {path} ===\n{content[:3000]}\n"
    
    # 最新のリサーチレポートを取得
    research_files = github_api('GET', f'/repos/{REPO}/contents/research?ref={BASE_BRANCH}')
    if research_files and isinstance(research_files, list):
        latest = sorted([f for f in research_files if f['name'].endswith('.md')], 
                       key=lambda x: x['name'], reverse=True)[:1]
        for f in latest:
            file_data = github_api('GET', f'/repos/{REPO}/contents/{f["path"]}?ref={BASE_BRANCH}')
            if file_data and 'content' in file_data:
                content = base64.b64decode(file_data['content']).decode('utf-8')
                context += f"\n=== 最新リサーチ: {f['name']} ===\n{content[:2000]}\n"
    
    return context

def get_approved_issues():
    """承認済みIssueを依存関係順にソート"""
    issues = github_api('GET', f'/repos/{REPO}/issues?state=open&per_page=50')
    approved = []
    for issue in issues or []:
        if any(l['name'].startswith('agent:') for l in issue.get('labels', [])):
            comments = github_api('GET', f'/repos/{REPO}/issues/{issue["number"]}/comments')
            for c in (comments or []):
                if '✅ オーナー承認' in c.get('body', ''):
                    approved.append(issue)
                    break
    
    priority_order = {'priority:high': 0, 'priority:medium': 1, 'priority:low': 2}
    approved.sort(key=lambda x: min([priority_order.get(l['name'], 99) for l in x.get('labels', [])] or [99]))
    
    return approved

def consult_researcher_for_breakthrough(client, from_agent, challenge, context):
    """Researcher に技術的ブレイクスルーを相談（既存探索 + 理論設計）"""
    
    send_slack(f"🔬 *{from_agent}* → *Researcher* に技術相談中...\n課題: {challenge[:100]}...")
    
    system_prompt = f"""あなたは Quantum Shield の Researcher + 暗号数学専門家 です。

{from_agent} から技術的な課題の相談を受けています。

【Phase 1】まず既存のライブラリ・論文・実装を探してください。
【Phase 2】既存で解決できない場合、新しい技術・アルゴリズムを数学的に設計してください。

JSON形式で回答:
{{
  "existing_solutions": [
    {{
      "name": "名前",
      "type": "library/paper/implementation",
      "description": "説明",
      "applicability": "high/medium/low",
      "url": "参照先"
    }}
  ],
  "needs_new_invention": true/false,
  "theoretical_design": {{
    "title": "発明のタイトル（既存で解決できる場合は空）",
    "concept": "コンセプト",
    "mathematical_basis": "数学的根拠（定理、証明スケッチ）",
    "algorithm_steps": ["ステップ1", "ステップ2"],
    "expected_improvement": "期待される改善",
    "implementation_hint": "実装のヒント"
  }},
  "recommendation": "最終的な推奨（{from_agent}への具体的アドバイス）"
}}

プロジェクト情報:
{context[:3000]}
"""
    
    try:
        message = client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=2500,
            system=system_prompt,
            messages=[{'role': 'user', 'content': f"【{from_agent}からの技術相談】\n{challenge}"}]
        )
        
        text = message.content[0].text
        match = re.search(r'\{[\s\S]*\}', text)
        result = json.loads(match.group()) if match else None
        
        if result:
            # Slack に結果を報告
            existing_count = len(result.get('existing_solutions', []))
            needs_invention = result.get('needs_new_invention', False)
            
            if needs_invention and result.get('theoretical_design', {}).get('title'):
                design = result['theoretical_design']
                send_slack(f"""💡 *Researcher* の回答:

🔍 既存ソリューション: {existing_count}件発見
🆕 *新技術の理論設計*: {design.get('title', 'N/A')}

📐 数学的根拠: {design.get('mathematical_basis', 'N/A')[:150]}...

🎯 推奨: {result.get('recommendation', 'N/A')[:200]}...""")
            else:
                best = result.get('existing_solutions', [{}])[0] if result.get('existing_solutions') else {}
                send_slack(f"""✅ *Researcher* の回答:

🔍 既存ソリューション: {existing_count}件発見
📦 ベスト: {best.get('name', 'N/A')} ({best.get('applicability', '?')})

🎯 推奨: {result.get('recommendation', 'N/A')[:200]}...""")
        
        return result
        
    except Exception as e:
        print(f"Error: {e}")
        return None

def consult_crypto_auditor_for_validation(client, design, context):
    """Crypto Auditor に理論設計の検証を依頼"""
    
    send_slack("🔐 *Crypto Auditor* が理論設計を検証中...")
    
    system_prompt = f"""あなたは Quantum Shield の Crypto Auditor（暗号数学専門家）です。

提案された理論設計を厳密に検証してください。

JSON形式で回答:
{{
  "mathematical_validity": true/false,
  "security_level": "推定セキュリティレベル（ビット）",
  "quantum_safe": true/false,
  "issues": ["問題点"],
  "corrections": ["修正案"],
  "verdict": "approved/conditional/rejected",
  "final_advice": "最終アドバイス"
}}

プロジェクト情報:
{context[:2000]}
"""
    
    try:
        message = client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=1500,
            system=system_prompt,
            messages=[{'role': 'user', 'content': f"理論設計の検証:\n{json.dumps(design, ensure_ascii=False, indent=2)}"}]
        )
        
        text = message.content[0].text
        match = re.search(r'\{[\s\S]*\}', text)
        result = json.loads(match.group()) if match else None
        
        if result:
            verdict_emoji = "✅" if result.get('verdict') == 'approved' else "⚠️" if result.get('verdict') == 'conditional' else "❌"
            send_slack(f"""{verdict_emoji} *Crypto Auditor* の検証結果:

数学的妥当性: {'✅' if result.get('mathematical_validity') else '❌'}
量子耐性: {'✅' if result.get('quantum_safe') else '⚠️'}
判定: {result.get('verdict', 'N/A')}

💬 {result.get('final_advice', 'N/A')[:200]}...""")
        
        return result
        
    except Exception as e:
        print(f"Error: {e}")
        return None

def consult_agent(client, from_agent, to_agent, question, context):
    """エージェント間でリアルタイム相談（Researcher は特別処理）"""
    
    # Researcher への技術相談は特別処理
    if to_agent == 'Researcher' and ('技術' in question or '実装' in question or 'どうすれば' in question or 'ライブラリ' in question or 'アルゴリズム' in question):
        result = consult_researcher_for_breakthrough(client, from_agent, question, context)
        if result:
            # 理論設計があればCrypto Auditorに検証依頼
            if result.get('needs_new_invention') and result.get('theoretical_design', {}).get('title'):
                validation = consult_crypto_auditor_for_validation(client, result['theoretical_design'], context)
                if validation:
                    result['crypto_validation'] = validation
            
            return json.dumps(result, ensure_ascii=False, indent=2)[:1500]
    
    # 通常のエージェント相談
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

def cso_coordinate(client, issues, context):
    """CSOが全体を統括し、優先順位と依存関係を判断"""
    issues_summary = "\n".join([
        f"#{i['number']}: {i['title']} (ラベル: {', '.join([l['name'] for l in i.get('labels', [])])})"
        for i in issues[:10]
    ])
    
    system_prompt = f"""あなたは Quantum Shield の CSO（Chief Security Officer）です。
チーム全体を統括し、タスクの優先順位と依存関係を判断してください。

プロジェクト情報:
{context[:3000]}

JSON形式で回答:
{{
  "priority_order": [1, 3, 2],
  "blocked_issues": {{"2": "Issue #1の完了待ち"}},
  "immediate_action": "今すぐ取り組むべきIssue番号",
  "team_instructions": "チームへの指示"
}}
"""
    
    try:
        message = client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=1000,
            system=system_prompt,
            messages=[{'role': 'user', 'content': f"現在のIssue一覧:\n{issues_summary}\n\n優先順位と依存関係を判断してください。"}]
        )
        
        text = message.content[0].text
        match = re.search(r'\{[\s\S]*\}', text)
        return json.loads(match.group()) if match else None
    except:
        return None

def agent_work_with_collaboration(client, issue, context):
    """協調型でタスクを実行（Researcher/Crypto Auditor の理論設計含む）"""
    title = issue.get('title', '')
    body = issue.get('body', '')
    number = issue.get('number')
    
    assignee = 'Engineer'
    for label in issue.get('labels', []):
        if label['name'].startswith('agent:'):
            assignee = label['name'].replace('agent:', '')
            break
    
    agent_info = AGENTS.get(assignee, {'emoji': '⚙️', 'role': '開発者'})
    
    comments = github_api('GET', f'/repos/{REPO}/issues/{number}/comments') or []
    approval_comment = ""
    for c in comments:
        if '✅ オーナー承認' in c.get('body', ''):
            approval_comment = c['body']
            break
    
    system_prompt = f"""あなたは Quantum Shield の {assignee} です。
役割: {agent_info['role']}

【重要】NORTH_STAR（週次目標）に沿って作業してください。
【重要】技術的に難しい課題があれば、必ず Researcher に相談してください。
【重要】Researcher は既存ライブラリ探索 + 新技術の理論設計ができます。

プロジェクト情報:
{context}

JSON形式で回答:
{{
  "analysis": "タスクの分析結果",
  "technical_challenges": ["技術的な課題（あれば）"],
  "consult_requests": [
    {{"to": "Researcher", "question": "技術的な相談内容"}}
  ],
  "files": [
    {{"path": "ファイルパス", "content": "ファイル内容", "description": "説明"}}
  ],
  "test_files": [
    {{"path": "テストファイルパス", "content": "テスト内容"}}
  ],
  "summary": "実装内容の要約",
  "needs_review_by": ["Red Team", "Crypto Auditor"],
  "confidence": "high/medium/low",
  "owner_questions": []
}}

注意:
- 技術的に難しければ Researcher に相談（既存探索 + 理論設計してくれる）
- 暗号関連で不安があれば Crypto Auditor に相談
- エージェント間で解決できない場合のみ owner_questions に記載
"""
    
    user_prompt = f"""## Issue #{number}: {title}

{body}

## オーナー承認内容:
{approval_comment}

このタスクを分析し、必要に応じて Researcher や他エージェントに相談しながら実装してください。
"""
    
    try:
        message = client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=4000,
            system=system_prompt,
            messages=[{'role': 'user', 'content': user_prompt}]
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
            consult_results.append({
                'from': assignee,
                'to': to_agent,
                'question': question,
                'answer': answer
            })
        
        result['consult_results'] = consult_results
        return result
        
    except Exception as e:
        print(f"Error: {e}")
        return None

def agent_review_code(client, issue, code_result, context, reviewer):
    """レビューエージェント"""
    agent_info = AGENTS.get(reviewer, {'emoji': '🤖', 'role': 'レビュアー'})
    
    system_prompt = f"""あなたは Quantum Shield の {reviewer} です。
役割: {agent_info['role']}

以下のコードをレビューしてください。

プロジェクト情報:
{context[:2000]}

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
{json.dumps(code_result, ensure_ascii=False, indent=2)[:3000]}

セキュリティと品質の観点からレビューしてください。
"""
    
    try:
        message = client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=2000,
            system=system_prompt,
            messages=[{'role': 'user', 'content': user_prompt}]
        )
        
        text = message.content[0].text
        match = re.search(r'\{[\s\S]*\}', text)
        return json.loads(match.group()) if match else None
    except:
        return None

def process_issue_collaboratively(client, issue, context):
    """協調型でIssueを処理"""
    number = issue['number']
    title = issue['title']
    
    assignee = 'Engineer'
    for label in issue.get('labels', []):
        if label['name'].startswith('agent:'):
            assignee = label['name'].replace('agent:', '')
            break
    
    agent_info = AGENTS.get(assignee, {'emoji': '⚙️'})
    
    send_slack(f"{agent_info['emoji']} *{assignee}* が *Issue #{number}* の作業を開始: {title}")
    update_issue(number, 25, 'working', f'{assignee}がコード生成を開始しました')
    
    # Step 1: 協調型でタスク実行
    work_result = agent_work_with_collaboration(client, issue, context)
    if not work_result:
        update_issue(number, 25, 'blocked', '❌ タスク分析に失敗しました')
        return
    
    # 相談結果をIssueにコメント
    if work_result.get('consult_results'):
        consult_summary = "\n".join([
            f"**{c['from']}** → **{c['to']}**: {c['question']}\n> 回答: {str(c['answer'])[:300]}"
            for c in work_result['consult_results']
        ])
        github_api('POST', f'/repos/{REPO}/issues/{number}/comments', {
            'body': f"## 💬 エージェント間相談（技術ブレイクスルー含む）\n\n{consult_summary}"
        })
    
    # オーナーへの相談が必要な場合
    if work_result.get('owner_questions'):
        questions = '\n'.join([f"• {q}" for q in work_result['owner_questions']])
        send_slack(f"""🚨 *【ご相談】Issue #{number}*

❓ エージェント間で解決できなかった事項:
{questions}

ご判断をお願いします。""")
        update_issue(number, 30, 'need_consultation', f'確認事項があります:\n{questions}')
        return
    
    # ファイルがなければ完了
    if not work_result.get('files'):
        update_issue(number, 100, 'completed', f"分析完了:\n{work_result.get('summary', '')}")
        send_slack(f"✅ *Issue #{number}* 分析完了！")
        return
    
    update_issue(number, 50, 'testing', f'コード生成完了。レビュー中...\n\n生成ファイル数: {len(work_result.get("files", []))}')
    
    # Step 2: レビュー
    reviewers = work_result.get('needs_review_by', ['Engineer'])
    all_approved = True
    review_comments = []
    
    for reviewer in reviewers[:2]:
        send_slack(f"🔍 *{reviewer}* がレビュー中...")
        review = agent_review_code(client, issue, work_result, context, reviewer)
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
    
    for file in work_result.get('files', []):
        create_or_update_file(branch_name, file['path'], file['content'], f'[#{number}] {file.get("description", "Add file")}')
    
    for test_file in work_result.get('test_files', []):
        create_or_update_file(branch_name, test_file['path'], test_file['content'], f'[#{number}] Add test')
    
    # Step 4: PR作成
    pr_body = f"""## Issue #{number} 対応

{work_result.get('summary', '')}

### エージェント間相談（技術ブレイクスルー含む）
{chr(10).join([f"- {c['from']} → {c['to']}: {c['question'][:50]}..." for c in work_result.get('consult_results', [])])}

### 生成ファイル
{chr(10).join(['- ' + f['path'] for f in work_result.get('files', [])])}

### レビュー結果
{chr(10).join(review_comments)}

---
🤖 Generated by Quantum Shield Agent Army (Collaborative + Research Mode)
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
    
    # CSOによる統括
    send_slack("🔒 *CSO* がタスクの優先順位と依存関係を分析中...")
    coordination = cso_coordinate(client, approved_issues, context)
    
    if coordination:
        send_slack(f"""📋 *CSO統括レポート*

🎯 *即時対応*: Issue #{coordination.get('immediate_action', '?')}
📝 *チームへの指示*: {coordination.get('team_instructions', 'N/A')}
""")
    
    send_slack(f"🤖 *エージェント協調作業開始*\n\n承認済みタスク: {len(approved_issues)}件")
    
    for issue in approved_issues[:3]:
        process_issue_collaboratively(client, issue, context)
    
    send_slack("✅ *本サイクルの作業完了*\n\n次回: 30分後に再実行")

if __name__ == '__main__':
    main()
