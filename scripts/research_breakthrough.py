#!/usr/bin/env python3
"""技術ブレイクスルー探索 - Researcher & Crypto Auditor が課題を分析し解決策を提案"""

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

def get_file_content(path):
    file_data = github_api('GET', f'/repos/{REPO}/contents/{path}?ref={BASE_BRANCH}')
    if file_data and 'content' in file_data:
        return base64.b64decode(file_data['content']).decode('utf-8')
    return ""

def get_open_issues():
    return github_api('GET', f'/repos/{REPO}/issues?state=open&per_page=50') or []

def get_engineering_challenges(client, issues, context):
    """CTO/Engineerの課題を収集"""
    
    # 関連Issueを抽出
    eng_issues = [i for i in issues if any(
        l['name'] in ['agent:Engineer', 'agent:CTO', 'agent:Crypto Auditor', 'priority:high']
        for l in i.get('labels', [])
    )]
    
    issues_text = "\n".join([
        f"#{i['number']}: {i['title']}\n{i.get('body', '')[:500]}"
        for i in eng_issues[:10]
    ])
    
    system_prompt = """あなたはQuantum ShieldのCTOです。
現在のIssueとプロジェクト状況から、技術的な課題・ボトルネックを特定してください。

JSON形式で回答:
{
  "challenges": [
    {
      "title": "課題のタイトル",
      "description": "詳細な説明",
      "impact": "high/medium/low",
      "category": "performance/security/implementation/architecture"
    }
  ],
  "blockers": ["ブロッカー1", "ブロッカー2"],
  "wishlist": ["こういう技術があれば解決できる"]
}
"""
    
    try:
        message = client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=2000,
            system=system_prompt,
            messages=[{'role': 'user', 'content': f"プロジェクト情報:\n{context[:3000]}\n\n現在のIssue:\n{issues_text}"}]
        )
        
        import re
        text = message.content[0].text
        match = re.search(r'\{[\s\S]*\}', text)
        return json.loads(match.group()) if match else None
    except Exception as e:
        print(f"Error: {e}")
        return None

def research_solutions(client, challenges, context):
    """Researcher が解決策をリサーチ"""
    
    challenges_text = json.dumps(challenges, ensure_ascii=False, indent=2)
    
    system_prompt = """あなたはQuantum Shieldの Researcher です。
暗号技術、ブロックチェーン、ZK証明の最新動向に精通しています。

提示された課題に対して、技術的なブレイクスルーの可能性を調査・提案してください。

JSON形式で回答:
{
  "research_findings": [
    {
      "challenge_addressed": "対象の課題",
      "solution_type": "algorithm/library/architecture/optimization",
      "title": "解決策のタイトル",
      "description": "詳細な説明",
      "technical_details": "技術的な詳細",
      "implementation_effort": "high/medium/low",
      "expected_improvement": "期待される改善（例：50%高速化）",
      "references": ["参考文献・プロジェクト"]
    }
  ],
  "breakthrough_ideas": [
    {
      "idea": "革新的なアイデア",
      "rationale": "根拠",
      "risk": "リスク"
    }
  ],
  "recommended_priority": ["優先的に検討すべき解決策"]
}

重要:
- 必達要件: 証明生成10秒以内、ガス代87.5%削減
- Dilithium署名の最適化が最優先
- 実装可能性を重視
"""
    
    try:
        message = client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=3000,
            system=system_prompt,
            messages=[{'role': 'user', 'content': f"プロジェクト情報:\n{context[:2000]}\n\n課題:\n{challenges_text}"}]
        )
        
        import re
        text = message.content[0].text
        match = re.search(r'\{[\s\S]*\}', text)
        return json.loads(match.group()) if match else None
    except Exception as e:
        print(f"Error: {e}")
        return None

def crypto_audit_solutions(client, research_findings, context):
    """Crypto Auditor が暗号学的観点から検証"""
    
    findings_text = json.dumps(research_findings, ensure_ascii=False, indent=2)
    
    system_prompt = """あなたはQuantum Shieldの Crypto Auditor です。
暗号学の専門家として、提案された解決策を検証してください。

JSON形式で回答:
{
  "verified_solutions": [
    {
      "solution_title": "解決策タイトル",
      "cryptographic_validity": true/false,
      "security_assessment": "セキュリティ評価",
      "concerns": ["懸念点"],
      "recommendations": ["推奨事項"],
      "approval": "approved/conditional/rejected"
    }
  ],
  "additional_insights": [
    {
      "insight": "追加の暗号学的知見",
      "application": "適用方法"
    }
  ],
  "final_recommendation": "最終推奨事項"
}
"""
    
    try:
        message = client.messages.create(
            model='claude-sonnet-4-20250514',
            max_tokens=2000,
            system=system_prompt,
            messages=[{'role': 'user', 'content': f"プロジェクト情報:\n{context[:1500]}\n\nResearcherの調査結果:\n{findings_text}"}]
        )
        
        import re
        text = message.content[0].text
        match = re.search(r'\{[\s\S]*\}', text)
        return json.loads(match.group()) if match else None
    except Exception as e:
        print(f"Error: {e}")
        return None

def create_breakthrough_report(challenges, research, audit):
    """ブレイクスルーレポートを作成"""
    
    report = f"""# 🔬 技術ブレイクスルーレポート

**生成日時**: {datetime.now().strftime('%Y-%m-%d %H:%M')}

---

## 📋 特定された課題

"""
    
    for c in challenges.get('challenges', [])[:5]:
        report += f"### {c.get('title', 'N/A')}\n"
        report += f"- **影響度**: {c.get('impact', 'N/A')}\n"
        report += f"- **カテゴリ**: {c.get('category', 'N/A')}\n"
        report += f"- **説明**: {c.get('description', 'N/A')}\n\n"
    
    report += """---

## 💡 Researcher の調査結果

"""
    
    for f in research.get('research_findings', [])[:5]:
        report += f"### {f.get('title', 'N/A')}\n"
        report += f"- **対象課題**: {f.get('challenge_addressed', 'N/A')}\n"
        report += f"- **タイプ**: {f.get('solution_type', 'N/A')}\n"
        report += f"- **期待改善**: {f.get('expected_improvement', 'N/A')}\n"
        report += f"- **実装工数**: {f.get('implementation_effort', 'N/A')}\n"
        report += f"- **詳細**: {f.get('description', 'N/A')}\n\n"
    
    report += """---

## 🔐 Crypto Auditor の検証結果

"""
    
    for v in audit.get('verified_solutions', [])[:5]:
        status = "✅" if v.get('approval') == 'approved' else "⚠️" if v.get('approval') == 'conditional' else "❌"
        report += f"### {status} {v.get('solution_title', 'N/A')}\n"
        report += f"- **暗号学的妥当性**: {'有効' if v.get('cryptographic_validity') else '要検討'}\n"
        report += f"- **セキュリティ評価**: {v.get('security_assessment', 'N/A')}\n"
        report += f"- **推奨事項**: {', '.join(v.get('recommendations', []))}\n\n"
    
    report += f"""---

## 🎯 最終推奨事項

{audit.get('final_recommendation', 'N/A')}

---

## 🚀 次のアクション

CTO/Engineer チームは上記の検証済み解決策を検討し、実装の優先順位を決定してください。

"""
    
    return report

def main():
    if not all([GITHUB_TOKEN, SLACK_WEBHOOK, ANTHROPIC_KEY]):
        print('Missing environment variables')
        return
    
    client = anthropic.Anthropic(api_key=ANTHROPIC_KEY)
    
    send_slack("🔬 *技術ブレイクスルー探索を開始します*")
    
    # コンテキスト収集
    context = ""
    for path in ['NORTH_STAR.md', 'PURPOSE.md', 'README.md', 'meetings/PROJECT_STATE.md']:
        context += get_file_content(path)[:2000] + "\n"
    
    issues = get_open_issues()
    
    # Step 1: CTO/Engineer の課題収集
    send_slack("📋 *Step 1*: CTO/Engineer の課題を収集中...")
    challenges = get_engineering_challenges(client, issues, context)
    
    if not challenges:
        send_slack("❌ 課題収集に失敗しました")
        return
    
    challenge_count = len(challenges.get('challenges', []))
    send_slack(f"✅ {challenge_count}件の課題を特定しました")
    
    # Step 2: Researcher のリサーチ
    send_slack("🔬 *Step 2*: Researcher が解決策をリサーチ中...")
    research = research_solutions(client, challenges, context)
    
    if not research:
        send_slack("❌ リサーチに失敗しました")
        return
    
    findings_count = len(research.get('research_findings', []))
    send_slack(f"✅ {findings_count}件の解決策を発見しました")
    
    # Step 3: Crypto Auditor の検証
    send_slack("🔐 *Step 3*: Crypto Auditor が暗号学的観点から検証中...")
    audit = crypto_audit_solutions(client, research, context)
    
    if not audit:
        send_slack("❌ 検証に失敗しました")
        return
    
    approved = len([v for v in audit.get('verified_solutions', []) if v.get('approval') == 'approved'])
    send_slack(f"✅ {approved}件の解決策が承認されました")
    
    # Step 4: レポート作成
    report = create_breakthrough_report(challenges, research, audit)
    
    # GitHubに保存
    report_path = f"research/breakthrough-{datetime.now().strftime('%Y%m%d-%H%M')}.md"
    
    github_api('PUT', f'/repos/{REPO}/contents/{report_path}', {
        'message': f'🔬 技術ブレイクスルーレポート ({datetime.now().strftime("%Y-%m-%d")})',
        'content': base64.b64encode(report.encode()).decode(),
        'branch': BASE_BRANCH
    })
    
    # Slackに要約を送信
    summary = f"""🔬 *技術ブレイクスルーレポート完成*

📋 *特定された課題*: {challenge_count}件
💡 *発見された解決策*: {findings_count}件
✅ *承認された解決策*: {approved}件

🎯 *最終推奨*:
{audit.get('final_recommendation', 'N/A')[:300]}...

📄 *詳細レポート*: `{report_path}`

---
CTO/Engineer チームは上記を確認し、実装を検討してください。
"""
    
    send_slack(summary)
    
    # Issueを作成して連携
    github_api('POST', f'/repos/{REPO}/issues', {
        'title': f'[Research] 技術ブレイクスルー提案 ({datetime.now().strftime("%Y-%m-%d")})',
        'body': f"""## 🔬 技術ブレイクスルー提案

Researcher と Crypto Auditor が課題を分析し、解決策を提案しました。

### 📋 特定された課題
{json.dumps(challenges.get('challenges', [])[:3], ensure_ascii=False, indent=2)}

### 💡 承認された解決策
{json.dumps([v for v in audit.get('verified_solutions', []) if v.get('approval') == 'approved'][:3], ensure_ascii=False, indent=2)}

### 🎯 最終推奨
{audit.get('final_recommendation', 'N/A')}

---
📄 詳細レポート: `{report_path}`

**CTO/Engineer チームへ**: 上記の解決策を検討し、実装の可否を判断してください。
""",
        'labels': ['research', 'breakthrough', 'agent:Researcher', 'agent:Crypto Auditor']
    })
    
    send_slack("✅ *技術ブレイクスルー探索完了！* Issue を作成しました。")

if __name__ == '__main__':
    main()
