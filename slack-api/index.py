import json
import hashlib
import hmac
import time
import os
import urllib.request

def verify_slack_signature(body, timestamp, signature):
    """Verify Slack request signature"""
    signing_secret = os.environ.get('SLACK_SIGNING_SECRET', '')
    if not signing_secret:
        return False
    
    sig_basestring = f"v0:{timestamp}:{body}"
    my_signature = 'v0=' + hmac.new(
        signing_secret.encode(),
        sig_basestring.encode(),
        hashlib.sha256
    ).hexdigest()
    
    return hmac.compare_digest(my_signature, signature)

def send_slack_message(text, channel=None):
    """Send message to Slack"""
    webhook_url = os.environ.get('SLACK_WEBHOOK_URL')
    if not webhook_url:
        return False
    
    payload = {"text": text}
    if channel:
        payload["channel"] = channel
    
    data = json.dumps(payload).encode('utf-8')
    req = urllib.request.Request(webhook_url, data=data, headers={'Content-Type': 'application/json'})
    
    try:
        urllib.request.urlopen(req)
        return True
    except:
        return False

def handler(request):
    """Main Vercel serverless function handler"""
    
    # Health check
    if request.method == 'GET':
        return {
            'statusCode': 200,
            'body': json.dumps({'status': 'ok', 'service': 'quantum-shield-slack-api'})
        }
    
    if request.method != 'POST':
        return {
            'statusCode': 405,
            'body': json.dumps({'error': 'Method not allowed'})
        }
    
    try:
        body = request.body.decode('utf-8') if hasattr(request, 'body') else ''
        
        # Verify Slack signature
        timestamp = request.headers.get('X-Slack-Request-Timestamp', '')
        signature = request.headers.get('X-Slack-Signature', '')
        
        # Check timestamp to prevent replay attacks
        if abs(time.time() - int(timestamp)) > 60 * 5:
            return {
                'statusCode': 400,
                'body': json.dumps({'error': 'Invalid timestamp'})
            }
        
        if not verify_slack_signature(body, timestamp, signature):
            return {
                'statusCode': 401,
                'body': json.dumps({'error': 'Invalid signature'})
            }
        
        data = json.loads(body)
        
        # Handle URL verification challenge
        if data.get('type') == 'url_verification':
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'text/plain'},
                'body': data.get('challenge', '')
            }
        
        # Handle events
        if data.get('type') == 'event_callback':
            event = data.get('event', {})
            event_type = event.get('type')
            
            # Ignore bot messages
            if event.get('bot_id'):
                return {'statusCode': 200, 'body': 'ok'}
            
            # Handle app mentions
            if event_type == 'app_mention':
                text = event.get('text', '').lower()
                
                if '戦略会議' in text or 'strategy meeting' in text:
                    send_slack_message("🚀 戦略会議を開始します！11体のエージェントを召集中...")
                    # TODO: Trigger GitHub Actions workflow
                    
                elif 'ヘルプ' in text or 'help' in text:
                    help_text = """
*Quantum Shield Agent Commands:*
• `戦略会議を開始` - 11エージェント全員で戦略会議
• `クイックチェック` - CSO/Engineer/DevOpsで簡易確認  
• `セキュリティ優先` - セキュリティ重点レビュー
• `承認` / `OK` - 提案を承認
• `拒否` / `待って` - 提案を拒否
                    """
                    send_slack_message(help_text)
                
                else:
                    send_slack_message(f"👋 こんにちは！`ヘルプ` と言うとコマンド一覧を表示します。")
        
        return {'statusCode': 200, 'body': 'ok'}
        
    except Exception as e:
        return {
            'statusCode': 500,
            'body': json.dumps({'error': str(e)})
        }
