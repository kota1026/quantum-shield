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
                    text = event.get('text', '').lower()
                    channel = event.get('channel', '')
                    self._handle_mention(text, channel)
            
            self.send_response(200)
            self.end_headers()
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
    
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
        
        if '戦略会議' in text or 'strategy' in text:
            mode = 'full'
            if 'クイック' in text or 'quick' in text:
                mode = 'quick'
            elif 'セキュリティ' in text or 'security' in text:
                mode = 'security'
            
            self._send_slack_message(f"🚀 戦略会議を開始します！モード: {mode}\n11体のエージェントを召集中...")
            
            # Trigger GitHub Actions
            success = self._trigger_github_actions(mode, channel)
            if success:
                self._send_slack_message("✅ GitHub Actions をトリガーしました。エージェントが分析を開始します...")
            else:
                self._send_slack_message("❌ GitHub Actions のトリガーに失敗しました。GITHUB_TOKEN を確認してください。")
                
        elif 'ヘルプ' in text or 'help' in text:
            message = """*Quantum Shield Agent Commands:*
• `戦略会議を開始` - 11エージェント全員で戦略会議
• `クイックチェック` - CSO/Engineer/DevOpsで簡易確認
• `セキュリティ優先` - セキュリティ重点レビュー
• `承認` / `OK` - 提案を承認
• `拒否` / `待って` - 提案を拒否"""
            self._send_slack_message(message)
            
        elif '承認' in text or 'ok' in text or '進めて' in text:
            self._send_slack_message("✅ 承認を受け付けました。処理を進めます。")
            self._trigger_github_actions('approval', channel, approved=True)
            
        elif '拒否' in text or '止めて' in text or '待って' in text:
            self._send_slack_message("🛑 拒否を受け付けました。処理を中断します。")
            self._trigger_github_actions('approval', channel, approved=False)
            
        else:
            self._send_slack_message("👋 こんにちは！`ヘルプ` と言うとコマンド一覧を表示します。")
    
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
