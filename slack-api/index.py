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
            
            # Handle URL verification challenge (MUST respond immediately)
            if data.get('type') == 'url_verification':
                challenge = data.get('challenge', '')
                self.send_response(200)
                self.send_header('Content-Type', 'text/plain')
                self.end_headers()
                self.wfile.write(challenge.encode())
                return
            
            # Verify Slack signature for other requests
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
                    self._handle_mention(text)
            
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
            return True  # Skip verification if no secret
        
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
    
    def _handle_mention(self, text):
        """Handle app mention events"""
        webhook_url = os.environ.get('SLACK_WEBHOOK_URL')
        if not webhook_url:
            return
        
        if '戦略会議' in text or 'strategy' in text:
            message = "🚀 戦略会議を開始します！11体のエージェントを召集中..."
        elif 'ヘルプ' in text or 'help' in text:
            message = """*Quantum Shield Agent Commands:*
• `戦略会議を開始` - 11エージェント全員で戦略会議
• `クイックチェック` - CSO/Engineer/DevOpsで簡易確認
• `セキュリティ優先` - セキュリティ重点レビュー
• `承認` / `OK` - 提案を承認
• `拒否` / `待って` - 提案を拒否"""
        else:
            message = "👋 こんにちは！`ヘルプ` と言うとコマンド一覧を表示します。"
        
        self._send_slack_message(message)
    
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
