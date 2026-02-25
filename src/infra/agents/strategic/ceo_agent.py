#!/usr/bin/env python3
"""Quantum Shield - CEO Agent

The CEO Agent synthesizes input from all agents and makes final strategic decisions.
It has the highest authority in the agent hierarchy (except for Kota's override).
"""

import os
import sys
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime

sys.path.insert(0, str(Path(__file__).parent.parent))
from base_agent import BaseAgent, AgentStatus, CheckResult


class CEOAgent(BaseAgent):
    """CEO Agent - Final decision maker for strategic direction."""

    @property
    def name(self) -> str:
        return "CEO (Chief Executive Officer)"

    @property
    def agent_id(self) -> str:
        return "ceo"

    @property
    def is_critical(self) -> bool:
        return False  # CEO makes recommendations, Kota has final say

    def run_checks(self) -> List[CheckResult]:
        """CEO doesn't run technical checks - synthesizes other agents' reports."""
        self.add_check(
            name="Strategic Readiness",
            status=AgentStatus.PASS,
            message="Ready to synthesize agent reports and propose strategic direction."
        )
        return self.checks

    def synthesize_reports(self, agent_reports: List[Dict]) -> Dict:
        """Synthesize all agent reports into a strategic summary."""
        critical_issues = []
        warnings = []
        passed = []
        recommendations = []

        for report in agent_reports:
            status = report.get("status", "SKIPPED")
            agent_name = report.get("agent_name", "Unknown")
            
            if status == "FAIL":
                critical_issues.append({
                    "agent": agent_name,
                    "issues": report.get("recommendations", [])
                })
            elif status == "PARTIAL":
                warnings.append({
                    "agent": agent_name,
                    "warnings": report.get("recommendations", [])
                })
            else:
                passed.append(agent_name)

            recommendations.extend(report.get("recommendations", []))

        return {
            "timestamp": datetime.now().isoformat(),
            "overall_status": self._determine_project_status(critical_issues, warnings),
            "critical_issues": critical_issues,
            "warnings": warnings,
            "passed_agents": passed,
            "prioritized_actions": self._prioritize_actions(recommendations),
            "strategic_recommendation": self._generate_strategic_recommendation(
                critical_issues, warnings, passed
            )
        }

    def _determine_project_status(self, critical: List, warnings: List) -> str:
        """Determine overall project health status."""
        if critical:
            return "CRITICAL"
        elif warnings:
            return "CAUTION"
        return "HEALTHY"

    def _prioritize_actions(self, recommendations: List[str]) -> List[Dict]:
        """Prioritize recommendations based on keywords and impact."""
        high_priority_keywords = ["security", "fail", "critical", "vulnerability", "unsafe"]
        medium_priority_keywords = ["fix", "review", "warning", "todo"]

        prioritized = []
        for rec in recommendations:
            rec_lower = rec.lower()
            if any(kw in rec_lower for kw in high_priority_keywords):
                priority = "HIGH"
            elif any(kw in rec_lower for kw in medium_priority_keywords):
                priority = "MEDIUM"
            else:
                priority = "LOW"
            
            prioritized.append({"action": rec, "priority": priority})

        # Sort by priority
        priority_order = {"HIGH": 0, "MEDIUM": 1, "LOW": 2}
        return sorted(prioritized, key=lambda x: priority_order[x["priority"]])

    def _generate_strategic_recommendation(self, critical: List, warnings: List, passed: List) -> str:
        """Generate a strategic recommendation based on current status."""
        if critical:
            return (
                f"🚨 HALT RECOMMENDED: {len(critical)} critical issue(s) detected. "
                "Address security and core functionality issues before proceeding. "
                "Recommend immediate review by Kota."
            )
        elif warnings:
            return (
                f"⚠️ PROCEED WITH CAUTION: {len(warnings)} warning(s) detected. "
                f"{len(passed)} agents passed all checks. "
                "Can continue development while addressing warnings in parallel."
            )
        else:
            return (
                f"✅ ALL CLEAR: All {len(passed)} agents report healthy status. "
                "Project is on track. Recommend continuing with planned roadmap."
            )

    def propose_next_actions(self, synthesis: Dict) -> List[Dict]:
        """Propose next actions for the team."""
        actions = []
        
        # Add critical actions first
        for issue in synthesis.get("critical_issues", []):
            for i, item in enumerate(issue["issues"][:3]):  # Top 3 per agent
                actions.append({
                    "action": item,
                    "assigned_to": issue["agent"],
                    "trust_level": 3,  # Requires approval
                    "deadline": "ASAP"
                })

        # Add warning actions
        for warning in synthesis.get("warnings", []):
            for item in warning["warnings"][:2]:  # Top 2 per agent
                actions.append({
                    "action": item,
                    "assigned_to": warning["agent"],
                    "trust_level": 2,  # Notify only
                    "deadline": "This week"
                })

        return actions
