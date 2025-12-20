from http.server import BaseHTTPRequestHandler
import json
import hashlib
import hmac
import time
import os
import urllib.request

class handler(BaseHTTPRequestHandler):
    def do_GET(self):
        """Health check endpoint"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.end_headers()
        self.wfile.write(json.dumps({'status': 'ok', 'service': 'quantum-shield-slack-api'}).encode())
    
    def do_POST(self):
        """Handle Slack events"""
        try:
            # Ignore Slack retries
            retry_num = self.headers.get('X-Slack-Retry-Num')
            if retry_num:
                self.send_response(200)
                self.end_headers()
                return
            
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            data = json.loads(body)
            
            # Handle URL verification
            if data.get('type') == 'url_verification':
                self.send_response(200)
                self.send_header('Content-Type', 'text/plain')
                self.end_headers()
                self.wfile.write(data.get('challenge', '').encode())
                return
            
            # Verify signature
            timestamp = self.headers.get('X-Slack-Request-Timestamp', '')
            signature = self.headers.get('X-Slack-Signature', '')
            if not self._verify_signature(body, timestamp, signature):
                self.send_response(401)
                self.end_headers()
                return
            
            # Handle events
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
        
        # 戦略会議コマンド
        if '戦略会議' in text_lower or 'strategy' in text_lower:
            mode = 'full'
            if 'クイック' in text_lower or 'quick' in text_lower:
                mode = 'quick'
            elif 'セキュリティ' in text_lower or 'security' in text_lower:
                mode = 'security'
            
            self._send_slack_message(f"🚀 戦略会議を開始します！モード: {mode}\n11体のエージェントを召集中...")
            success = self._trigger_github_actions(mode, channel)
            if success:
                self._send_slack_message("✅ GitHub Actions をトリガーしました。エージェントが分析を開始します...")
            else:
                self._send_slack_message("❌ GitHub Actions のトリガーに失敗しました。")
        
        # ヘルプ
        elif 'ヘルプ' in text_lower or 'help' in text_lower:
            self._send_slack_message("""🔒 *CSO（チーフセキュリティオフィサー）です*

私が11体のエージェントチームを統括しています。

*コマンド:*
• `戦略会議を開始` - 全エージェントで正式な分析会議
• `クイックチェック` - 簡易確認（CSO/Engineer/DevOps）
• `セキュリティ優先` - セキュリティ重点レビュー

*自由に話しかけてください:*
• 質問や相談 → 私がチームと協議して回答
• `〇〇に詳しく聞きたい` → 担当エージェントが直接回答

*エージェントチーム:*
🛡️ Purpose Guardian | 🔐 Crypto Auditor | 🔴 Red Team
🏗️ CTO | 🔒 CSO | 💰 CFO | 📊 CBO
⚙️ Engineer | 🔬 Researcher | 🚀 DevOps | ⚖️ Legal""")
        
        # 承認/拒否
        elif '承認' in text_lower or '進めて' in text_lower:
            self._send_slack_message("✅ 承認を受け付けました。処理を進めます。")
        elif '拒否' in text_lower or '止めて' in text_lower or '待って' in text_lower:
            self._send_slack_message("🛑 拒否を受け付けました。処理を中断します。")
        
        # 特定エージェントへの質問
        else:
            response = self._chat_with_agent_team(text)
            self._send_slack_message(response)
    
    def _chat_with_agent_team(self, user_message):
        """Chat with agent team - CSO coordinates, specific agents can answer directly"""
        import anthropic
        
        api_key = os.environ.get('ANTHROPIC_API_KEY', '')
        if not api_key:
            return "🔒 CSO: AI応答機能が設定されていません。"
        
        try:
            client = anthropic.Anthropic(api_key=api_key)
            
            # 特定エージェントへの直接質問を検出
            agent_keywords = {
                "purpose guardian": ("Purpose Guardian", "🛡️", "PURPOSE.md準拠とミッション整合性の専門家"),
                "crypto auditor": ("Crypto Auditor", "🔐", "暗号実装とDilithium署名の専門家"),
                "red team": ("Red Team", "🔴", "脆弱性発見と攻撃シミュレーションの専門家"),
                "cto": ("CTO", "🏗️", "技術戦略とアーキテクチャの専門家"),
                "cso": ("CSO", "🔒", "セキュリティ総括とリスク管理の専門家"),
                "cfo": ("CFO", "💰", "コスト分析とリソース最適化の専門家"),
                "cbo": ("CBO", "📊", "ビジネス価値と市場戦略の専門家"),
                "engineer": ("Engineer", "⚙️", "コード品質と実装の専門家"),
                "researcher": ("Researcher", "🔬", "最新技術研究と革新性の専門家"),
                "devops": ("DevOps", "🚀", "インフラとCI/CDの専門家"),
                "legal": ("Legal", "⚖️", "コンプライアンスと法務の専門家"),
            }
            
            user_lower = user_message.lower()
            selected_agent = None
            
            for keyword, agent_info in agent_keywords.items():
                if keyword in user_lower or agent_info[0].lower() in user_lower:
                    selected_agent = agent_info
                    break
            
            if selected_agent:
                # 特定エージェントが直接回答
                agent_name, emoji, role = selected_agent
                system_prompt = f"""あなたは Quantum Shield プロジェクトの {agent_name} です。
{role}です。

プロジェクト概要:
- 耐量子暗号（Dilithium署名）とゼロ知識証明を組み合わせたクロスチェーンブリッジ
- SP1 zkVM を使用
- EVM互換チェーン間のブリッジ

あなたの専門分野について、具体的かつ実践的なアドバイスをしてください。
日本語で、2-4文で回答してください。"""
                
                message = client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=400,
                    system=system_prompt,
                    messages=[{"role": "user", "content": user_message}]
                )
                return f"{emoji} *{agent_name}*: {message.content[0].text}"
            
            else:
                # CSOがチームを代表して回答
                system_prompt = """あなたは Quantum Shield プロジェクトの CSO（チーフセキュリティオフィサー）です。
11体のエージェントチームを統括しています。

チームメンバー:
- 🛡️ Purpose Guardian: ミッション整合性
- 🔐 Crypto Auditor: 暗号実装
- 🔴 Red Team: 脆弱性発見
- 🏗️ CTO: 技術戦略
- 💰 CFO: コスト分析
- 📊 CBO: ビジネス価値
- ⚙️ Engineer: 実装品質
- 🔬 Researcher: 最新研究
- 🚀 DevOps: インフラ
- ⚖️ Legal: コンプライアンス

プロジェクト概要:
- 耐量子暗号（Dilithium署名）とゼロ知識証明を組み合わせたクロスチェーンブリッジ
- SP1 zkVM を使用
- EVM互換チェーン間のブリッジ

あなたはチームの意見を統括して回答します。
必要に応じて「〇〇（エージェント名）によると...」のように他のエージェントの見解も含めてください。
重要な場合は「詳しくは〇〇に聞いてください」と案内してください。
日本語で、3-5文で回答してください。"""
                
                message = client.messages.create(
                    model="claude-sonnet-4-20250514",
                    max_tokens=500,
                    system=system_prompt,
                    messages=[{"role": "user", "content": user_message}]
                )
                return f"🔒 *CSO*: {message.content[0].text}"
            
        except Exception as e:
            return f"🔒 CSO: エラーが発生しました: {str(e)}"
    
    def _trigger_github_actions(self, mode, channel, approved=None):
        github_token = os.environ.get('GITHUB_TOKEN', '')
        if not github_token:
            return False
        
        url = "https://api.github.com/repos/kota1026/quantum-shield/dispatches"
        payload = {
            "event_type": "strategy-meeting" if approved is None else "approval-response",
            "client_payload": {"mode": mode, "channel": channel, "approved": approved}
        }
        
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
