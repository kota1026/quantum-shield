#!/usr/bin/env python3
"""Quantum Shield - Strategy Meeting Orchestrator

Orchestrates strategy meetings where all 11 agents participate
to analyze project status and propose next actions.

Usage:
    python strategy_meeting.py [--mode full|quick|security]
"""

import os
import sys
import json
import yaml
import argparse
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

from base_agent import AgentReport, AgentStatus
from orchestrator import AgentOrchestrator


class StrategyMeeting:
    """Orchestrates strategy meetings with all agents."""

    ALL_AGENTS = [
        "purpose_guardian", "cto", "cso", "cfo", "cbo",
        "engineer", "crypto_auditor", "red_team",
        "researcher", "devops", "legal"
    ]
    SECURITY_AGENTS = ["cso", "crypto_auditor", "red_team"]
    QUICK_AGENTS = ["cso", "engineer", "devops"]

    def __init__(self, project_root: str = None):
        self.project_root = Path(project_root or os.getcwd())
        self.orchestrator = AgentOrchestrator(str(self.project_root))
        self.meeting_result = None

        # Import strategic agents
        try:
            from strategic import CEOAgent, StrategyAdvisorAgent, RiskAnalystAgent
            self.ceo = CEOAgent(str(self.project_root))
            self.strategy_advisor = StrategyAdvisorAgent(str(self.project_root))
            self.risk_analyst = RiskAnalystAgent(str(self.project_root))
        except ImportError:
            self.ceo = None
            self.strategy_advisor = None
            self.risk_analyst = None

    def start_meeting(self, mode: str = "full", context: Dict = None) -> Dict:
        """Start a strategy meeting."""
        context = context or {}
        timestamp = datetime.now().isoformat()

        if mode == "security":
            agents = self.SECURITY_AGENTS
        elif mode == "quick":
            agents = self.QUICK_AGENTS
        else:
            agents = self.ALL_AGENTS

        meeting_id = f"meeting_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        print(f"\n{'='*60}")
        print(f"🛡️ QUANTUM SHIELD - STRATEGY MEETING")
        print(f"{'='*60}")
        print(f"Meeting ID: {meeting_id}")
        print(f"Mode: {mode.upper()}")
        print(f"Participating Agents: {len(agents)}")
        print(f"Started: {timestamp}")
        print(f"{'='*60}\n")

        # Phase 1: Run agent checks
        print("📊 Phase 1: Gathering Agent Reports...")
        agent_reports = self.orchestrator.run_all(agents)
        reports_dict = [r.to_dict() for r in agent_reports]

        # Phase 2: Risk Analysis
        risk_matrix = {}
        risk_score = {"overall_score": 100, "rating": "N/A"}
        mitigations = []
        
        if self.risk_analyst:
            print("\n🔍 Phase 2: Risk Analysis...")
            self.risk_analyst.run()
            risk_matrix = self.risk_analyst.generate_risk_matrix(reports_dict)
            risk_score = self.risk_analyst.calculate_risk_score(risk_matrix)
            mitigations = self.risk_analyst.recommend_mitigations(risk_matrix)

        # Phase 3: Strategic Analysis
        priorities = {}
        strategic_options = []
        
        if self.strategy_advisor:
            print("\n📈 Phase 3: Strategic Analysis...")
            self.strategy_advisor.run()
            priorities = self.strategy_advisor.analyze_priorities(context)
            strategic_options = self.strategy_advisor.generate_strategic_options(context)

        # Phase 4: CEO Synthesis
        ceo_synthesis = {"overall_status": "UNKNOWN", "strategic_recommendation": "N/A"}
        proposed_actions = []
        
        if self.ceo:
            print("\n👔 Phase 4: CEO Synthesis...")
            ceo_synthesis = self.ceo.synthesize_reports(reports_dict)
            proposed_actions = self.ceo.propose_next_actions(ceo_synthesis)

        # Compile meeting result
        self.meeting_result = {
            "meeting_id": meeting_id,
            "timestamp": timestamp,
            "mode": mode,
            "context": context,
            "participants": agents,
            "agent_reports": reports_dict,
            "risk_analysis": {"matrix": risk_matrix, "score": risk_score, "mitigations": mitigations},
            "strategic_analysis": {"priorities": priorities, "options": strategic_options},
            "ceo_synthesis": ceo_synthesis,
            "proposed_actions": proposed_actions,
            "requires_approval": self._check_approval_needed(ceo_synthesis, proposed_actions)
        }

        print(f"\n{'='*60}")
        print(f"Meeting Complete: {meeting_id}")
        print(f"Overall Status: {ceo_synthesis.get('overall_status', 'UNKNOWN')}")
        print(f"Risk Score: {risk_score.get('overall_score', 0)}/100 ({risk_score.get('rating', 'N/A')})")
        print(f"Proposed Actions: {len(proposed_actions)}")
        print(f"Requires Approval: {self.meeting_result['requires_approval']}")
        print(f"{'='*60}\n")

        self._save_meeting_result()
        return self.meeting_result

    def _check_approval_needed(self, synthesis: Dict, actions: List[Dict]) -> bool:
        if synthesis.get("overall_status") == "CRITICAL":
            return True
        for action in actions:
            if action.get("trust_level", 1) >= 3:
                return True
        return False

    def _save_meeting_result(self):
        if not self.meeting_result:
            return

        output_dir = self.project_root / "agents" / "logs" / "meetings"
        output_dir.mkdir(parents=True, exist_ok=True)

        meeting_id = self.meeting_result["meeting_id"]
        json_path = output_dir / f"{meeting_id}.json"
        with open(json_path, 'w') as f:
            json.dump(self.meeting_result, f, indent=2, default=str)

        md_path = output_dir / f"{meeting_id}.md"
        with open(md_path, 'w') as f:
            f.write(self.generate_meeting_summary())

        print(f"Meeting saved: {json_path}")

    def generate_meeting_summary(self) -> str:
        if not self.meeting_result:
            return "No meeting result available."

        r = self.meeting_result
        synthesis = r.get("ceo_synthesis", {})
        risk = r.get("risk_analysis", {}).get("score", {})

        md = f"""# 🛡️ Quantum Shield Strategy Meeting

**Meeting ID**: {r['meeting_id']}
**Date**: {r['timestamp']}
**Mode**: {r['mode'].upper()}
**Participants**: {len(r['participants'])} agents

---

## 📊 Executive Summary

**Overall Status**: {synthesis.get('overall_status', 'UNKNOWN')}
**Risk Score**: {risk.get('overall_score', 'N/A')}/100 ({risk.get('rating', 'N/A')})

{synthesis.get('strategic_recommendation', 'No recommendation available.')}

---

## 🚨 Critical Issues

"""
        critical = synthesis.get('critical_issues', [])
        if critical:
            for issue in critical:
                md += f"### {issue['agent']}\n"
                for item in issue['issues']:
                    md += f"- {item}\n"
                md += "\n"
        else:
            md += "No critical issues detected.\n\n"

        md += """---

## 📋 Proposed Actions

| Priority | Action | Assigned To | Trust Level |
|----------|--------|-------------|-------------|
"""
        for action in r.get('proposed_actions', [])[:10]:
            priority = "🔴" if action.get('deadline') == 'ASAP' else "🟡"
            md += f"| {priority} | {action['action']} | {action['assigned_to']} | L{action['trust_level']} |\n"

        md += f"""\n---

## 🔄 Next Steps

**Requires Approval**: {'Yes - Please respond with 「承認」 or 「拒否」' if r['requires_approval'] else 'No - Auto-proceeding'}

"""
        return md

    def get_slack_message(self) -> Dict:
        if not self.meeting_result:
            return {"text": "No meeting result available."}

        r = self.meeting_result
        synthesis = r.get("ceo_synthesis", {})
        risk = r.get("risk_analysis", {}).get("score", {})
        status = synthesis.get('overall_status', 'UNKNOWN')

        status_emoji = {"HEALTHY": "✅", "CAUTION": "⚠️", "CRITICAL": "🚨"}.get(status, "❓")

        blocks = [
            {"type": "header", "text": {"type": "plain_text", "text": "🛡️ Quantum Shield - Strategy Meeting Report"}},
            {
                "type": "section",
                "fields": [
                    {"type": "mrkdwn", "text": f"*Status*\n{status_emoji} {status}"},
                    {"type": "mrkdwn", "text": f"*Risk Score*\n{risk.get('overall_score', 'N/A')}/100"},
                    {"type": "mrkdwn", "text": f"*Mode*\n{r['mode'].upper()}"},
                    {"type": "mrkdwn", "text": f"*Agents*\n{len(r['participants'])}"}
                ]
            },
            {
                "type": "section",
                "text": {"type": "mrkdwn", "text": f"*Strategic Recommendation*\n{synthesis.get('strategic_recommendation', 'N/A')}"}
            }
        ]

        if r['requires_approval']:
            blocks.append({
                "type": "actions",
                "elements": [
                    {"type": "button", "text": {"type": "plain_text", "text": "✅ 承認"}, "style": "primary", "action_id": f"approve_{r['meeting_id']}"},
                    {"type": "button", "text": {"type": "plain_text", "text": "❌ 拒否"}, "style": "danger", "action_id": f"reject_{r['meeting_id']}"},
                    {"type": "button", "text": {"type": "plain_text", "text": "📋 詳細"}, "action_id": f"details_{r['meeting_id']}"}
                ]
            })

        return {"text": f"Strategy Meeting: {status}", "blocks": blocks}


def main():
    parser = argparse.ArgumentParser(description="Quantum Shield Strategy Meeting")
    parser.add_argument("--mode", choices=["full", "quick", "security"], default="full")
    parser.add_argument("--project", default=None)
    parser.add_argument("--slack", action="store_true")
    args = parser.parse_args()

    meeting = StrategyMeeting(args.project)
    result = meeting.start_meeting(mode=args.mode)

    if args.slack:
        print(json.dumps(meeting.get_slack_message(), indent=2, ensure_ascii=False))
    else:
        print(meeting.generate_meeting_summary())

    if result.get("ceo_synthesis", {}).get("overall_status") == "CRITICAL":
        sys.exit(1)
    sys.exit(0)


if __name__ == "__main__":
    main()
