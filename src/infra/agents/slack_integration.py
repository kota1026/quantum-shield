#!/usr/bin/env python3
"""Quantum Shield - Slack Integration Module

Handles bidirectional communication with Slack:
- Receiving commands from Kota
- Sending reports and approval requests
- Processing approval/rejection responses
"""

import os
import json
import hashlib
import hmac
import time
from typing import Dict, List, Optional
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum

try:
    import requests
except ImportError:
    requests = None


class ApprovalStatus(Enum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    TIMEOUT = "timeout"


@dataclass
class ApprovalRequest:
    request_id: str
    meeting_id: str
    actions: List[Dict]
    created_at: datetime
    expires_at: datetime
    status: ApprovalStatus = ApprovalStatus.PENDING


class SlackIntegration:
    """Slack integration for agent communication."""

    APPROVE_KEYWORDS = ["承認", "OK", "進めて", "approve", "go", "続行", "やって", "実行"]
    REJECT_KEYWORDS = ["拒否", "止めて", "reject", "stop", "待って", "却下", "ダメ", "やめて"]
    MEETING_TRIGGERS = ["戦略会議を開始", "戦略会議を開いて", "ミーティングを開始", "start meeting"]
    QUICK_TRIGGERS = ["クイックチェック", "状況は?", "進捗は?", "quick check", "status"]
    SECURITY_TRIGGERS = ["セキュリティ優先", "セキュリティチェック", "security check"]

    def __init__(
        self,
        bot_token: str = None,
        signing_secret: str = None,
        webhook_url: str = None,
        default_channel: str = "#quantum-shield-alerts"
    ):
        self.bot_token = bot_token or os.environ.get("SLACK_BOT_TOKEN")
        self.signing_secret = signing_secret or os.environ.get("SLACK_SIGNING_SECRET")
        self.webhook_url = webhook_url or os.environ.get("SLACK_WEBHOOK_URL")
        self.default_channel = default_channel
        self.pending_approvals: Dict[str, ApprovalRequest] = {}

    def verify_slack_signature(self, timestamp: str, body: str, signature: str) -> bool:
        """Verify that request came from Slack."""
        if not self.signing_secret:
            return True

        if abs(time.time() - int(timestamp)) > 60 * 5:
            return False

        sig_basestring = f"v0:{timestamp}:{body}"
        computed_sig = 'v0=' + hmac.new(
            self.signing_secret.encode(),
            sig_basestring.encode(),
            hashlib.sha256
        ).hexdigest()

        return hmac.compare_digest(computed_sig, signature)

    def parse_command(self, text: str) -> Dict:
        """Parse incoming message and determine command type."""
        text_lower = text.lower().strip()

        for keyword in self.APPROVE_KEYWORDS:
            if keyword.lower() in text_lower:
                return {"type": "approval", "action": "approve", "original": text}

        for keyword in self.REJECT_KEYWORDS:
            if keyword.lower() in text_lower:
                return {"type": "approval", "action": "reject", "original": text}

        for trigger in self.MEETING_TRIGGERS:
            if trigger.lower() in text_lower:
                return {"type": "meeting", "mode": "full", "original": text}

        for trigger in self.QUICK_TRIGGERS:
            if trigger.lower() in text_lower:
                return {"type": "meeting", "mode": "quick", "original": text}

        for trigger in self.SECURITY_TRIGGERS:
            if trigger.lower() in text_lower:
                return {"type": "meeting", "mode": "security", "original": text}

        return {"type": "unknown", "original": text}

    def send_message(self, text: str = None, blocks: List[Dict] = None, channel: str = None) -> bool:
        """Send a message to Slack."""
        if not requests:
            print(f"[Slack] Would send: {text}")
            return False

        channel = channel or self.default_channel

        if self.webhook_url:
            payload = {"text": text}
            if blocks:
                payload["blocks"] = blocks
            try:
                resp = requests.post(self.webhook_url, json=payload)
                return resp.status_code == 200
            except Exception as e:
                print(f"[Slack] Webhook error: {e}")

        if self.bot_token:
            try:
                resp = requests.post(
                    "https://slack.com/api/chat.postMessage",
                    headers={"Authorization": f"Bearer {self.bot_token}"},
                    json={"channel": channel, "text": text, "blocks": blocks}
                )
                return resp.json().get("ok", False)
            except Exception as e:
                print(f"[Slack] API error: {e}")

        return False

    def send_approval_request(
        self,
        meeting_id: str,
        summary: str,
        actions: List[Dict],
        timeout_hours: int = 24
    ) -> ApprovalRequest:
        """Send an approval request to Slack."""
        request_id = f"approval_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        expires_at = datetime.now() + timedelta(hours=timeout_hours)

        approval = ApprovalRequest(
            request_id=request_id,
            meeting_id=meeting_id,
            actions=actions,
            created_at=datetime.now(),
            expires_at=expires_at
        )
        self.pending_approvals[request_id] = approval

        action_list = "\n".join([f"• {a.get('action', 'Unknown action')}" for a in actions[:5]])
        if len(actions) > 5:
            action_list += f"\n... and {len(actions) - 5} more"

        blocks = [
            {
                "type": "header",
                "text": {"type": "plain_text", "text": "🔔 承認リクエスト - Quantum Shield"}
            },
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"*概要*\n{summary}"}
            },
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"*提案されたアクション*\n{action_list}"}
            },
            {
                "type": "context",
                "elements": [{"type": "mrkdwn", "text": f"⏰ タイムアウト: {expires_at.strftime('%Y-%m-%d %H:%M')} JST"}]
            },
            {
                "type": "actions",
                "elements": [
                    {"type": "button", "text": {"type": "plain_text", "text": "✅ 承認"}, "style": "primary", "action_id": f"approve_{request_id}"},
                    {"type": "button", "text": {"type": "plain_text", "text": "❌ 拒否"}, "style": "danger", "action_id": f"reject_{request_id}"}
                ]
            },
            {
                "type": "context",
                "elements": [{"type": "mrkdwn", "text": "💬 返信で「承認」「OK」「進めて」または「拒否」「止めて」「待って」"}]
            }
        ]

        self.send_message(text=f"承認リクエスト: {summary}", blocks=blocks, channel="#quantum-shield-approvals")
        return approval

    def process_approval_response(self, action: str, request_id: str = None) -> Dict:
        """Process an approval or rejection response."""
        approval = None
        if request_id and request_id in self.pending_approvals:
            approval = self.pending_approvals[request_id]
        elif self.pending_approvals:
            approval = list(self.pending_approvals.values())[-1]

        if not approval:
            return {"success": False, "message": "承認待ちのリクエストがありません。"}

        if approval.status != ApprovalStatus.PENDING:
            return {"success": False, "message": f"このリクエストは既に処理済みです: {approval.status.value}"}

        if datetime.now() > approval.expires_at:
            approval.status = ApprovalStatus.TIMEOUT
            return {"success": False, "message": "このリクエストはタイムアウトしました。"}

        if action == "approve":
            approval.status = ApprovalStatus.APPROVED
            return {"success": True, "message": "✅ 承認されました。アクションを実行します。", "actions": approval.actions}
        else:
            approval.status = ApprovalStatus.REJECTED
            return {"success": True, "message": "❌ 拒否されました。アクションは実行されません。", "actions": []}

    def get_help_message(self) -> str:
        """Get help message for Slack commands."""
        return """🛡️ *Quantum Shield - Commands*

*戦略会議*
• 「戦略会議を開始して」- フル戦略会議を開始
• 「クイックチェック」- 簡易ステータス確認
• 「セキュリティ優先で進めて」- セキュリティ重点レビュー

*承認応答*
• 「承認」「OK」「進めて」- アクションを承認
• 「拒否」「止めて」「待って」- アクションを拒否

*その他*
• 「ヘルプ」- このメッセージを表示
"""
