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
            # Ignore Slack retries to prevent duplicate messages
            retry_num = self.headers.get('X-Slack-Retry-Num')
            if retry_num:
                self.send_response(200)
                self.end_headers()
                return
            
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length).decode('utf-8')
            
            # Parse JSON
            data = json.loads(body)
            
            # Handle URL verification challenge
            if data.get('type') == 'url_verification':
                challenge = data.get('challenge', '')
                self.send_response(200)
                self.send_header('Content-Type', 'text/plain')
                self.end_headers()
                self.wfile.write(challenge.encode())
                return
            
            # Verify Slack signature
            timestamp = self.headers.get('X-Slack-Request-Timestamp', '')
            signature = self.headers.get('X-Slack-Signature', '')
            
            if not self._verify_signature(body, timestamp, signature):
                self.send_response(401)
                self.end_headers()
                return
            
            # Handle events
            if data.get('type') == 'event_callback':
                event = data.get('event', {})
                
                # Ignore bot messages
                if event.get('bot_id'):
                    self.send_response(200)
                    self.end_headers()
                    return
                
                # Handle app mentions
                if event.get('type') == 'app_mention':
                    text = event.get('text', '')
                    channel = event.get('channel', '')
                    clean_text = self._remove_mention(text)
                    self._handle_mention(clean_text, channel)
            
            self.send_response(200)
            self.end_headers()
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
    
    def _remove_mention(self, text):
        """Remove bot mention from text"""
        import re
        return re.sub(r'<@[A-Z0-9]+>', '', text).strip()
    
    def _verify_signature(self, body, timestamp, signature):
        """Verify Slack request signature"""
        signing_secret = os.environ.get('SLACK_SIGNING_SECRET', '')
        if not signing_secret:
            return True
        
        try:
            if abs(time.time() - int(timestamp)) > 60 * 5:
                return False
        except:
            return False
        
        sig_basestring = f"v0:{timestamp}:{body}"
        my_signature = 'v0=' + hmac.new(
            signing_secret.encode(),
            sig_basestring.encode(),
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(my_signature, signature)
    
    def _handle_mention(self, text, channel):
        """Handle app mention events"""
        text_lower = text.lower()
        
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
                self._send_slack_message("❌ GitHub Actions のトリガーに失敗しました。GITHUB_TOKEN を確認してください。")
                
        elif 'ヘルプ' in text_lower or 'help' in text_lower:
            message = """*Quantum Shield Agent Commands:*
• `戦略会議を開始` - 11エージェント全員で戦略会議
• `クイックチェック` - CSO/Engineer/DevOpsで簡易確認
• `セキュリティ優先` - セキュリティ重点レビュー
• `承認` / `OK` - 提案を承認
• `拒否` / `待って` - 提案を拒否
• または自由に話しかけてください！"""
            self._send_slack_message(message)
            
        elif '承認' in text_lower or '進めて' in text_lower:
            self._send_slack_message("✅ 承認を受け付けました。処理を進めます。")
            self._trigger_github_actions('approval', channel, approved=True)
            
        elif '拒否' in text_lower or '止めて' in text_lower or '待って' in text_lower:
            self._send_slack_message("🛑 拒否を受け付けました。処理を中断します。")
            self._trigger_github_actions('approval', channel, approved=False)
            
        else:
            response = self._chat_with_claude(text)
            self._send_slack_message(response)
    
    def _chat_with_claude(self, user_message):
        """Chat with Claude for free conversation"""
        import anthropic
        
        api_key = os.environ.get('ANTHROPIC_API_KEY', '')
        if not api_key:
            return "🤖 AI応答機能が設定されていません。ANTHROPIC_API_KEY を確認してください。"
        
        try:
            client = anthropic.Anthropic(api_key=api_key)
            
            system_prompt = """あなたは Quantum Shield Bot です。
耐量子暗号とゼロ知識証明を組み合わせたクロスチェーンブリッジプロジェクト「Quantum Shield」のAIアシスタントです。

特徴:
- 量子コンピュータ耐性のある暗号技術（Dilithium署名）
- SP1 zkVM を使用したゼロ知識証明
- EVM互換チェーン間のブリッジ

親切で、技術的な質問にも答えられます。日本語で回答してください。簡潔に、2-3文で回答してください。"""
            
            message = client.messages.create(
                model="claude-sonnet-4-20250514",
                max_tokens=300,
                system=system_prompt,
                messages=[{"role": "user", "content": user_message}]
            )
            
            return f"🤖 {message.content[0].text}"
            
        except Exception as e:
            return f"🤖 エラーが発生しました: {str(e)}"
    
    def _trigger_github_actions(self, mode, channel, approved=None):
        """Trigger GitHub Actions workflow"""
        github_token = os.environ.get('GITHUB_TOKEN', '')
        if not github_token:
            return False
        
        url = "https://api.github.com/repos/kota1026/quantum-shield/dispatches"
        
        payload = {
            "event_type": "strategy-meeting" if approved is None else "approval-response",
            "client_payload": {
                "mode": mode,
                "channel": channel,
                "approved": approved
            }
        }
        
        data = json.dumps(payload).encode('utf-8')
        req = urllib.request.Request(
            url,
            data=data,
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
            print(f"GitHub Actions trigger failed: {e}")
            return False
    
    def _send_slack_message(self, text):
        """Send message to Slack"""
        webhook_url = os.environ.get('SLACK_WEBHOOK_URL')
        if not webhook_url:
            return
        
        payload = json.dumps({"text": text}).encode('utf-8')
        req = urllib.request.Request(
            webhook_url,
            data=payload,
            headers={'Content-Type': 'application/json'}
        )
        
        try:
            urllib.request.urlopen(req)
        except:
            pass
