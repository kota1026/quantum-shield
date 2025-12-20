from http.server import BaseHTTPRequestHandler
import json
import hashlib
import hmac
import time
import os
import urllib.request

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'status': 'ok', 'service': 'quantum-shield-slack-api'}).encode())
    
    def do_POST(self):
        try:
            retry_num = self.headers.get('X-Slack-Retry-Num')
            if retry_num:
                self.send_response(200)
                self.end_headers()
                return
            
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body)
            
            if data.get('type') == 'url_verification':
                self.send_response(200)
                self.send_header('Content-Type', 'text/plain')
                self.end_headers()
                self.wfile.write(data.get('challenge', '').encode())
                return
            
            timestamp = self.headers.get('X-Slack-Request-Timestamp', '')
            signature = self.headers.get('X-Slack-Signature', '')
            if not self._verify_signature(body, timestamp, signature):
                self.send_response(401)
                self.end_headers()
                return
            
            if data.get('type') == 'event_callback':
                event = data.get('event', {})
                if event.get('bot_id'):
                    self.send_response(200)
                    self.end_headers()
                    return
                
                if event.get('type') == 'app_mention':
                    text = event.get('text', '')
                    channel = event.get('channel', '')
                    clean_text = self._remove_mention(text)
                    self._handle_mention(clean_text, channel)
            
            self.send_response(200)
            self.end_headers()
            
        except Exception as e:
            self.send_response(500)
            self.end_headers()
    
    def _remove_mention(self, text):
        import re
        return re.sub(r'<@[A-Z0-9]+>', '', text).strip()
    
    def _verify_signature(self, body, timestamp, signature):
        signing_secret = os.environ.get('SLACK_SIGNING_SECRET', '')
        if not signing_secret:
            return True
        try:
            if abs(time.time() - int(timestamp)) > 60 * 5:
                return False
        except:
            return False
        sig_basestring = f"v0:{timestamp}:{body}"
        my_signature = 'v0=' + hmac.new(signing_secret.encode(), sig_basestring.encode(), hashlib.sha256).hexdigest()
        return hmac.compare_digest(my_signature, signature)
    
    def _handle_mention(self, text, channel):
        text_lower = text.lower()
        
        # 戦略会議
        if '戦略会議' in text_lower or 'strategy' in text_lower:
            mode = 'full'
            if 'クイック' in text_lower or 'quick' in text_lower:
                mode = 'quick'
            elif 'セキュリティ' in text_lower or 'security' in text_lower:
                mode = 'security'
            
            self._send_slack_message(f"🚀 戦略会議を開始します！モード: {mode}\n11体のエージェントを召集中...")
            success = self._trigger_github_actions('strategy-meeting', {'mode': mode, 'channel': channel})
            if success:
                self._send_slack_message("✅ GitHub Actions をトリガーしました。")
            else:
                self._send_slack_message("❌ GitHub Actions のトリガーに失敗しました。")
        
        # ヘルプ
        elif 'ヘルプ' in text_lower or 'help' in text_lower:
            self._send_slack_message("""🔒 *CSO（チーフセキュリティオフィサー）です*

私が11体のエージェントチームを統括しています。

*コマンド:*
• `戦略会議を開始` - 全エージェントで正式な分析会議
• `進捗報告` - 現在のタスク状況を報告
• タスク依頼 → 自動的にIssue作成＆担当割り当て

*エージェントチーム:*
🛡️ Purpose Guardian | 🔐 Crypto Auditor | 🔴 Red Team
🏗️ CTO | 🔒 CSO | 💰 CFO | 📊 CBO
⚙️ Engineer | 🔬 Researcher | 🚀 DevOps | ⚖️ Legal""")
        
        # 進捗報告
        elif '進捗' in text_lower or 'status' in text_lower or '報告' in text_lower:
            self._send_slack_message("📊 進捗報告を準備中...")
            self._trigger_github_actions('progress-report', {'channel': channel})
        
        # タスク依頼を検出（長文 or 特定キーワード）
        elif self._is_task_request(text):
            self._handle_task_request(text, channel)
        
        # 通常の会話
        else:
            response = self._chat_with_agent_team(text)
            self._send_slack_message(response)
    
    def _is_task_request(self, text):
        """タスク依頼かどうかを判定"""
        task_keywords = ['進めて', '対策', '実行', '実装', '検討', 'お願い', 
                        '報告して', '確認して', '調査', 'タスク', '作業']
        text_lower = text.lower()
        
        # キーワードが含まれているか
        has_keyword = any(kw in text_lower for kw in task_keywords)
        # ある程度の長さがあるか
        is_long = len(text) > 50
        
        return has_keyword and is_long
    
    def _handle_task_request(self, text, channel):
        """タスク依頼を処理"""
        import anthropic
        
        self._send_slack_message("📋 タスク依頼を受け付けました。分析中...")
        
        api_key = os.environ.get('ANTHROPIC_API_KEY', '')
        if not api_key:
            self._send_slack_message("❌ API設定エラー")
            return
        
        try:
            client = anthropic.Anthropic(api_key=api_key)
            
            # タスクを分解して担当を割り当て
            system_prompt = """あなたはQuantum Shieldプロジェクトのタスク管理AIです。
ユーザーからの依頼を分析し、以下のJSON形式で出力してください。

{
  "tasks": [
    {
      "title": "タスクタイトル（簡潔に）",
      "description": "詳細な説明",
      "assignee": "担当エージェント名",
      "priority": "high/medium/low",
      "labels": ["ラベル1", "ラベル2"]
    }
  ],
  "summary": "依頼全体の要約（1-2文）"
}

担当エージェント:
- Crypto Auditor: 暗号実装、Dilithium、署名
- Red Team: 脆弱性、攻撃対策、セキュリティテスト
- Engineer: コード実装、開発
- DevOps: CI/CD、インフラ
- CBO: ビジネス検討、部品売り
- Researcher: 技術調査、最新動向
- Legal: 法務、コンプライアンス
- CSO: セキュリティ総括

必ずJSON形式のみで回答してください。"""

            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=1500,
                system=system_prompt,
                messages=[{"role": "user", "content": text}]
            )
            
            response_text = message.content[0].text
            
            # JSONを抽出
            import re
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                task_data = json.loads(json_match.group())
            else:
                raise ValueError("JSON not found")
            
            # GitHub Issuesを作成
            created_issues = []
            github_token = os.environ.get('GITHUB_TOKEN', '')
            
            for task in task_data.get('tasks', []):
                issue = self._create_github_issue(
                    github_token,
                    task['title'],
                    task['description'],
                    task['assignee'],
                    task.get('priority', 'medium'),
                    task.get('labels', [])
                )
                if issue:
                    created_issues.append(issue)
            
            # Slackに報告
            summary = task_data.get('summary', '')
            report = f"""✅ *タスク登録完了*

📝 *要約*: {summary}

*作成したIssue ({len(created_issues)}件):*
"""
            for issue in created_issues:
                report += f"• [{issue['title']}]({issue['url']}) → {issue['assignee']}\n"
            
            report += "\n各エージェントが担当タスクを確認し、作業を開始します。"
            
            self._send_slack_message(report)
            
            # GitHub Actionsでタスクファイル保存をトリガー
            self._trigger_github_actions('task-created', {
                'channel': channel,
                'tasks': task_data
            })
            
        except Exception as e:
            self._send_slack_message(f"❌ タスク処理エラー: {str(e)}")
    
    def _create_github_issue(self, token, title, description, assignee, priority, labels):
        """GitHub Issueを作成"""
        if not token:
            return None
        
        url = "https://api.github.com/repos/kota1026/quantum-shield/issues"
        
        # 優先度をラベルに追加
        all_labels = labels + [f"priority:{priority}", f"agent:{assignee}"]
        
        body = f"""## タスク詳細
{description}

---
**担当エージェント**: {assignee}
**優先度**: {priority}
**作成元**: Slack Bot
"""
        
        payload = {
            "title": f"[{assignee}] {title}",
            "body": body,
            "labels": all_labels
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'token {token}',
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Quantum-Shield-Bot'
            },
            method='POST'
        )
        
        try:
            response = urllib.request.urlopen(req)
            issue_data = json.loads(response.read().decode('utf-8'))
            return {
                'title': title,
                'url': issue_data['html_url'],
                'number': issue_data['number'],
                'assignee': assignee
            }
        except Exception as e:
            print(f"Issue creation failed: {e}")
            return None
    
    def _chat_with_agent_team(self, user_message):
        """エージェントチームとの会話"""
        import anthropic
        
        api_key = os.environ.get('ANTHROPIC_API_KEY', '')
        if not api_key:
            return "🔒 CSO: AI応答機能が設定されていません。"
        
        try:
            client = anthropic.Anthropic(api_key=api_key)
            
            agent_keywords = {
                "purpose guardian": ("Purpose Guardian", "🛡️"),
                "crypto auditor": ("Crypto Auditor", "🔐"),
                "red team": ("Red Team", "🔴"),
                "cto": ("CTO", "🏗️"),
                "cso": ("CSO", "🔒"),
                "cfo": ("CFO", "💰"),
                "cbo": ("CBO", "📊"),
                "engineer": ("Engineer", "⚙️"),
                "researcher": ("Researcher", "🔬"),
                "devops": ("DevOps", "🚀"),
                "legal": ("Legal", "⚖️"),
            }
            
            user_lower = user_message.lower()
            selected_agent = None
            
            for keyword, agent_info in agent_keywords.items():
                if keyword in user_lower:
                    selected_agent = agent_info
                    break
            
            if selected_agent:
                agent_name, emoji = selected_agent
                system_prompt = f"あなたはQuantum Shieldの{agent_name}です。専門分野について具体的に回答。日本語で2-4文。"
            else:
                agent_name, emoji = "CSO", "🔒"
                system_prompt = """あなたはQuantum ShieldのCSO。11体のエージェントを統括。
チームの見解をまとめて回答。日本語で3-5文。"""
            
            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=500,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}]
            )
            return f"{emoji} *{agent_name}*: {message.content[0].text}"
            
        except Exception as e:
            return f"🔒 CSO: エラー: {str(e)}"
    
    def _trigger_github_actions(self, event_type, payload):
        github_token = os.environ.get('GITHUB_TOKEN', '')
        if not github_token:
            return False
        
        url = "https://api.github.com/repos/kota1026/quantum-shield/dispatches"
        data = {
            "event_type": event_type,
            "client_payload": payload
        }
        
        req = urllib.request.Request(
            url,
            data=json.dumps(data).encode('utf-8'),
            headers={
                'Content-Type': 'application/json',
                'Authorization': f'token {github_token}',
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Quantum-Shield-Bot'
            },
            method='POST'
        )
        
        try:
            urllib.request.urlopen(req)
            return True
        except:
            return False
    
    def _send_slack_message(self, text):
        webhook_url = os.environ.get('SLACK_WEBHOOK_URL')
        if not webhook_url:
            return
        
        payload = json.dumps({"text": text}).encode('utf-8')
        req = urllib.request.Request(webhook_url, data=payload, headers={'Content-Type': 'application/json'})
        try:
            urllib.request.urlopen(req)
        except:
            pass
