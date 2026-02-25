#!/usr/bin/env python3
"""Quantum Shield - Risk Analyst Agent

Analyzes risks across all dimensions:
- Technical risks
- Security risks
- Operational risks
- Timeline risks
"""

import os
import sys
from pathlib import Path
from typing import List, Dict, Optional
from datetime import datetime
from dataclasses import dataclass
from enum import Enum

sys.path.insert(0, str(Path(__file__).parent.parent))
from base_agent import BaseAgent, AgentStatus, CheckResult


class RiskLevel(Enum):
    CRITICAL = "CRITICAL"
    HIGH = "HIGH"
    MEDIUM = "MEDIUM"
    LOW = "LOW"


@dataclass
class Risk:
    id: str
    category: str
    description: str
    level: RiskLevel
    likelihood: str
    impact: str
    mitigation: str
    owner: str


class RiskAnalystAgent(BaseAgent):
    """Risk Analyst - Comprehensive risk assessment and monitoring."""

    @property
    def name(self) -> str:
        return "Risk Analyst"

    @property
    def agent_id(self) -> str:
        return "risk_analyst"

    @property
    def is_critical(self) -> bool:
        return False

    def run_checks(self) -> List[CheckResult]:
        """Run risk assessment checks."""
        risks = self._identify_risks()
        critical_risks = [r for r in risks if r.level == RiskLevel.CRITICAL]
        high_risks = [r for r in risks if r.level == RiskLevel.HIGH]

        if critical_risks:
            self.add_check(
                name="Critical Risk Assessment",
                status=AgentStatus.FAIL,
                message=f"{len(critical_risks)} critical risk(s) identified"
            )
        elif high_risks:
            self.add_check(
                name="High Risk Assessment",
                status=AgentStatus.PARTIAL,
                message=f"{len(high_risks)} high risk(s) identified"
            )
        else:
            self.add_check(
                name="Risk Assessment",
                status=AgentStatus.PASS,
                message="No critical or high risks identified"
            )

        return self.checks

    def _identify_risks(self) -> List[Risk]:
        """Identify current project risks."""
        return [
            Risk(
                id="R001",
                category="Security",
                description="STARK proof verification not yet audited",
                level=RiskLevel.HIGH,
                likelihood="MEDIUM",
                impact="HIGH",
                mitigation="Schedule third-party audit before mainnet",
                owner="crypto_auditor"
            ),
            Risk(
                id="R002",
                category="Technical",
                description="Gas costs may exceed budget on complex proofs",
                level=RiskLevel.MEDIUM,
                likelihood="MEDIUM",
                impact="MEDIUM",
                mitigation="Implement proof batching and gas optimization",
                owner="engineer"
            )
        ]

    def generate_risk_matrix(self, agent_reports: List[Dict]) -> Dict:
        """Generate a risk matrix from agent reports."""
        risk_matrix = {
            "technical": [],
            "security": [],
            "operational": [],
            "timeline": []
        }

        for report in agent_reports:
            agent_id = report.get("agent_id", "")
            status = report.get("status", "PASS")
            
            if status in ["FAIL", "PARTIAL"]:
                if agent_id in ["crypto_auditor", "red_team", "cso"]:
                    risk_matrix["security"].append({
                        "source": agent_id,
                        "issues": report.get("recommendations", [])
                    })
                elif agent_id in ["engineer", "cto"]:
                    risk_matrix["technical"].append({
                        "source": agent_id,
                        "issues": report.get("recommendations", [])
                    })
                elif agent_id == "devops":
                    risk_matrix["operational"].append({
                        "source": agent_id,
                        "issues": report.get("recommendations", [])
                    })

        return risk_matrix

    def calculate_risk_score(self, risk_matrix: Dict) -> Dict:
        """Calculate overall risk score."""
        category_scores = {}
        total_issues = 0

        for category, risks in risk_matrix.items():
            category_issues = sum(len(r.get("issues", [])) for r in risks)
            total_issues += category_issues
            
            if category_issues == 0:
                score = 100
            elif category_issues <= 2:
                score = 80
            elif category_issues <= 5:
                score = 60
            else:
                score = 40
            
            category_scores[category] = {
                "score": score,
                "issues_count": category_issues
            }

        overall_score = sum(c["score"] for c in category_scores.values()) // len(category_scores) if category_scores else 100

        return {
            "overall_score": overall_score,
            "total_issues": total_issues,
            "category_scores": category_scores,
            "rating": self._score_to_rating(overall_score)
        }

    def _score_to_rating(self, score: int) -> str:
        """Convert score to rating."""
        if score >= 90:
            return "EXCELLENT"
        elif score >= 70:
            return "GOOD"
        elif score >= 50:
            return "FAIR"
        else:
            return "POOR"

    def recommend_mitigations(self, risk_matrix: Dict) -> List[Dict]:
        """Recommend mitigation strategies."""
        mitigations = []

        if risk_matrix.get("security"):
            mitigations.append({
                "priority": "HIGH",
                "action": "Conduct comprehensive security review",
                "assigned_to": ["crypto_auditor", "red_team"],
                "deadline": "Before any deployment"
            })

        if risk_matrix.get("technical"):
            mitigations.append({
                "priority": "MEDIUM",
                "action": "Address technical debt and code quality issues",
                "assigned_to": ["engineer", "cto"],
                "deadline": "This sprint"
            })

        if risk_matrix.get("operational"):
            mitigations.append({
                "priority": "MEDIUM",
                "action": "Review and improve CI/CD pipeline",
                "assigned_to": ["devops"],
                "deadline": "This week"
            })

        return mitigations
