from http.server import BaseHTTPRequestHandler
import json
import hashlib
import hmac
import time
import os
import urllib.request
import re

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
                    thread_ts = event.get('thread_ts', '')
                    clean_text = self._remove_mention(text)
                    self._handle_mention(clean_text, channel, thread_ts)
            
            self.send_response(200)
            self.end_headers()
            
        except Exception as e:
            self.send_response(500)
            self.end_headers()
    
    def _remove_mention(self, text):
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
    
    def _handle_mention(self, text, channel, thread_ts=''):
        text_lower = text.lower()
        
        # 戦略会議（最優先）
        if '戦略会議' in text_lower or 'strategy meeting' in text_lower:
            mode = 'full'
            if 'クイック' in text_lower or 'quick' in text_lower:
                mode = 'quick'
            elif 'セキュリティ' in text_lower or 'security' in text_lower:
                mode = 'security'
            
            self._send_slack_message(f"🚀 戦略会議を開始します！モード: {mode}\n11体のエージェントを召集中...")
            success = self._trigger_github_actions('strategy-meeting', {'mode': mode, 'channel': channel})
            if success:
                self._send_slack_message("✅ GitHub Actions をトリガーしました。")
            return

    　　　# 緊急トリガー - Agent Worker を即座に起動
        if '緊急' in text_lower or 'urgent' in text_lower or 'エージェント実行' in text_lower or 'agent run' in text_lower:
            self._send_slack_message("🚨 *緊急モード起動！*\n\nAgent Worker を即座に実行します...")
            success = self._trigger_agent_worker()
            if success:
                self._send_slack_message("✅ Agent Worker をトリガーしました。数分後に結果を報告します。")
            else:
                self._send_slack_message("❌ Agent Worker の起動に失敗しました。")
            return
        
        # ヘルプ（完全一致に近い形）
        if text_lower.strip() in ['ヘルプ', 'help', 'へるぷ']:
            self._send_slack_message("""🔒 *CSO（チーフセキュリティオフィサー）です*

私が11体のエージェントチームを統括しています。

*コマンド:*
• `戦略会議を開始` - 全エージェントで正式な分析会議
• `進捗は？` - 現在のタスク状況を報告

*依頼の仕方:*
• `〇〇を進めてください` → タスク自動作成
• `〇〇を実装して` → GitHub Issue作成＆担当割り当て

*相談への回答:*
• `Aで行こう` / `Bでいい` → 該当Issueに自動反映

*エージェントチーム:*
🛡️ Purpose Guardian | 🔐 Crypto Auditor | 🔴 Red Team
🏗️ CTO | 🔒 CSO | 💰 CFO | 📊 CBO
⚙️ Engineer | 🔬 Researcher | 🚀 DevOps | ⚖️ Legal""")
            return
        
        # 選択肢への回答を検出（スレッド返信の場合に特に有効）
        choice_response = self._detect_choice_response(text)
        if choice_response:
            self._handle_choice_response(choice_response, text, channel)
            return
        
        # タスク依頼を判定（命令・依頼形の文脈）
        if self._is_task_request(text):
            self._handle_task_request(text, channel)
            return
        
        # 進捗報告（質問形式のみ）
        if self._is_status_request(text):
            self._send_slack_message("📊 進捗報告を準備中...")
            self._trigger_github_actions('progress-report', {'channel': channel})
            return
        
        # 通常の会話
        response = self._chat_with_agent_team(text)
        self._send_slack_message(response)
    
    def _detect_choice_response(self, text):
        """選択肢への回答を検出"""
        text_clean = text.strip().upper()
        text_lower = text.lower()
        
        # 単純な選択肢パターン
        simple_patterns = {
            'A': ['a', 'aで', 'aでいい', 'aで行こう', 'aでお願い', 'aを選択', 'aがいい', 'aで進めて', '推奨で', '推奨案で', '推奨でいい', '推奨で行こう'],
            'B': ['b', 'bで', 'bでいい', 'bで行こう', 'bでお願い', 'bを選択', 'bがいい', 'bで進めて'],
            'C': ['c', 'cで', 'cでいい', 'cで行こう', 'cでお願い', 'cを選択', 'cがいい', 'cで進めて'],
            'BOTH': ['両方', '両面', 'どちらも', '両方検討', '両面検討', '両方で'],
        }
        
        for choice, patterns in simple_patterns.items():
            for pattern in patterns:
                if text_lower == pattern or text_lower.startswith(pattern + ' ') or text_lower.startswith(pattern + '!') or text_lower.startswith(pattern + '！'):
                    return choice
        
        # より複雑なパターン
        if re.match(r'^a\s*(で|が|を|でいい|で行こう|でお願い)', text_lower):
            return 'A'
        if re.match(r'^b\s*(で|が|を|でいい|で行こう|でお願い)', text_lower):
            return 'B'
        if re.match(r'^c\s*(で|が|を|でいい|で行こう|でお願い)', text_lower):
            return 'C'
        
        # 「週次」「隔日」などの具体的な回答
        if '週次' in text_lower and ('でいい' in text_lower or 'で行こう' in text_lower or 'お願い' in text_lower):
            return 'A'  # 週次詳細報告
        if '隔日' in text_lower and ('でいい' in text_lower or 'で行こう' in text_lower or 'お願い' in text_lower):
            return 'B'  # 隔日簡易報告
        
        return None
    
    def _handle_choice_response(self, choice, original_text, channel):
        """選択肢への回答を処理"""
        # pending.jsonから未解決の相談を取得
        pending = self._get_pending_consultations()
        
        if not pending:
            self._send_slack_message("📋 現在、未解決の相談事項はありません。")
            return
        
        # 最新の未解決相談を取得
        unresolved = [p for p in pending if not p.get('resolved', False)]
        if not unresolved:
            self._send_slack_message("✅ 全ての相談事項は解決済みです。")
            return
        
        # 最新の相談を対象に
        latest = unresolved[-1]
        issue_number = latest.get('issue_number')
        issue_title = latest.get('issue_title', '')
        assignee = latest.get('assignee', '')
        question = latest.get('question', '')
        options = latest.get('options', [])
        
        # 選択肢の内容を特定
        if choice == 'BOTH':
            decision = "両面から検討"
            decision_detail = "A・B両方の観点から検討してください"
        elif choice == 'A' and options:
            decision = f"A: {options[0][:50]}..." if len(options[0]) > 50 else f"A: {options[0]}"
            decision_detail = options[0]
        elif choice == 'B' and len(options) > 1:
            decision = f"B: {options[1][:50]}..." if len(options[1]) > 50 else f"B: {options[1]}"
            decision_detail = options[1]
        elif choice == 'C' and len(options) > 2:
            decision = f"C: {options[2][:50]}..." if len(options[2]) > 50 else f"C: {options[2]}"
            decision_detail = options[2]
        else:
            decision = choice
            decision_detail = original_text
        
        # GitHub Issueにコメント追加
        success = self._add_approval_comment(issue_number, decision_detail, original_text)
        
        if success:
            # pending.jsonを更新
            self._resolve_consultation(issue_number)
            
            self._send_slack_message(f"""✅ *回答を反映しました*

📋 *Issue*: #{issue_number} {issue_title}
👤 *担当*: {assignee}
✨ *決定*: {decision}

エージェントが作業を開始します！""")
        else:
            self._send_slack_message(f"❌ Issue #{issue_number} への反映に失敗しました。手動で確認してください。")
    
    def _get_pending_consultations(self):
        """GitHubからpending.jsonを取得"""
        github_token = os.environ.get('GITHUB_TOKEN', '')
        if not github_token:
            return []
        
        url = "https://api.github.com/repos/kota1026/quantum-shield/contents/consultations/pending.json?ref=dev/phase2-native-stark"
        req = urllib.request.Request(
            url,
            headers={
                'Authorization': f'token {github_token}',
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Quantum-Shield-Bot'
            }
        )
        
        try:
            response = urllib.request.urlopen(req)
            data = json.loads(response.read().decode('utf-8'))
            import base64
            content = base64.b64decode(data['content']).decode('utf-8')
            return json.loads(content)
        except:
            return []
    
    def _add_approval_comment(self, issue_number, decision, original_text):
        """Issueに承認コメントを追加"""
        github_token = os.environ.get('GITHUB_TOKEN', '')
        if not github_token:
            return False
        
        comment_body = f"""## ✅ オーナー承認

**決定**: {decision}

> 原文: {original_text}

---

🚀 **アクション**: この決定に基づいて作業を進めてください。"""
        
        url = f"https://api.github.com/repos/kota1026/quantum-shield/issues/{issue_number}/comments"
        payload = {"body": comment_body}
        
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode('utf-8'),
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
    
    def _resolve_consultation(self, issue_number):
        """相談を解決済みにマーク（GitHub Actionsで処理）"""
        self._trigger_github_actions('resolve-consultation', {'issue_number': issue_number})
    
    def _is_task_request(self, text):
        """タスク依頼かどうかを文脈で判定"""
        request_patterns = [
            'してください', 'して下さい', 'しておいて',
            'お願い', 'をお願い', 'おねがい',
            '進めて', '実行して', '実装して', '対応して',
            '検討して', '調査して', '確認して', '報告して',
            '準備して', '整えて', '精査して', '作成して',
            '修正して', '追加して', '削除して', '更新して',
            'やって', 'よろしく', '頼む', '頼みます',
            'ように', '進めるように', '対応するように'
        ]
        
        text_lower = text.lower()
        return any(pattern in text_lower for pattern in request_patterns)
    
    def _is_status_request(self, text):
        """進捗確認の質問かどうかを判定"""
        status_patterns = [
            '進捗は', '進捗を教えて', '進捗どう', '進捗状況',
            'ステータス', 'status', '状況は', '状況を教えて',
            'どうなってる', 'どうなった', '進んでる'
        ]
        text_lower = text.lower()
        return any(pattern in text_lower for pattern in status_patterns)
    
    def _handle_task_request(self, text, channel):
        """タスク依頼を処理"""
        import anthropic
        
        self._send_slack_message("📋 *タスク依頼を受け付けました*\n\n🤖 AIがタスクを分析し、担当エージェントに振り分けています...")
        
        api_key = os.environ.get('ANTHROPIC_API_KEY', '')
        if not api_key:
            self._send_slack_message("❌ API設定エラー")
            return
        
        try:
            client = anthropic.Anthropic(api_key=api_key)
            
            system_prompt = """あなたはQuantum Shieldプロジェクトのタスク管理AIです。
ユーザーからの依頼を分析し、以下のJSON形式で出力してください。

{
  "tasks": [
    {
      "title": "タスクタイトル（簡潔に日本語で）",
      "description": "詳細な説明（日本語で）",
      "assignee": "担当エージェント名（英語）",
      "priority": "high/medium/low",
      "labels": ["security", "implementation"]
    }
  ],
  "summary": "依頼全体の要約（日本語1-2文）"
}

担当エージェント（assignee）の選択:
- Crypto Auditor: 暗号実装、Dilithium署名、暗号学的検証
- Red Team: 脆弱性対策、攻撃シミュレーション、セキュリティテスト
- Engineer: コード実装、開発作業
- DevOps: CI/CD、インフラ、テスト自動化
- CBO: ビジネス検討、部品売り、市場調査
- Researcher: 技術調査、最新動向リサーチ
- Legal: 法務、コンプライアンス
- CSO: セキュリティ総括、監査準備

複数の作業がある場合は、複数のtasksに分けてください。
必ず有効なJSON形式のみで回答してください。"""

            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=2000,
                system=system_prompt,
                messages=[{"role": "user", "content": text}]
            )
            
            response_text = message.content[0].text
            
            json_match = re.search(r'\{[\s\S]*\}', response_text)
            if json_match:
                task_data = json.loads(json_match.group())
            else:
                raise ValueError("JSON not found in response")
            
            created_issues = []
            github_token = os.environ.get('GITHUB_TOKEN', '')
            
            for task in task_data.get('tasks', []):
                issue = self._create_github_issue(
                    github_token,
                    task.get('title', 'Untitled'),
                    task.get('description', ''),
                    task.get('assignee', 'CSO'),
                    task.get('priority', 'medium'),
                    task.get('labels', [])
                )
                if issue:
                    created_issues.append(issue)
            
            summary = task_data.get('summary', '')
            report = f"""✅ *タスク登録完了*

📝 *要約*: {summary}

*作成したIssue ({len(created_issues)}件):*
"""
            for issue in created_issues:
                report += f"• <{issue['url']}|{issue['title']}> → *{issue['assignee']}*\n"
            
            report += """
---
各担当エージェントがタスクを確認し、作業を開始します。
進捗は随時Slackで報告します。問題があれば相談してください。"""
            
            self._send_slack_message(report)
            
        except json.JSONDecodeError as e:
            self._send_slack_message(f"❌ JSON解析エラー: タスク分析に失敗しました。もう一度お試しください。")
        except Exception as e:
            self._send_slack_message(f"❌ タスク処理エラー: {str(e)}")
    
    def _create_github_issue(self, token, title, description, assignee, priority, labels):
        """GitHub Issueを作成"""
        if not token:
            return None
        
        url = "https://api.github.com/repos/kota1026/quantum-shield/issues"
        
        all_labels = list(set(labels + [f"priority:{priority}", f"agent:{assignee}"]))
        
        body = f"""## タスク詳細
{description}

---
- **担当エージェント**: {assignee}
- **優先度**: {priority}
- **作成元**: Slack Bot
- **ステータス**: 🟡 作業中
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

　　　def _trigger_agent_worker(self):
        """Agent Worker を即座にトリガー"""
        github_token = os.environ.get('GITHUB_TOKEN', '')
        if not github_token:
            return False
        
        # workflow_dispatch でAgent Workerを起動
        url = "https://api.github.com/repos/kota1026/quantum-shield/actions/workflows/agent-worker.yml/dispatches"
        data = {"ref": "dev/phase2-native-stark"}
        
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
        except Exception as e:
            print(f"Agent Worker trigger failed: {e}")
            return False
