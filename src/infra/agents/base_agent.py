#!/usr/bin/env python3
"""
Quantum Shield - Base Agent Class
All agents inherit from this base class.
"""

import os
import json
import yaml
from abc import ABC, abstractmethod
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum

try:
    from github import Github
except ImportError:
    Github = None

try:
    import requests
except ImportError:
    requests = None


class AgentStatus(Enum):
    PASS = "PASS"
    PARTIAL = "PARTIAL"
    FAIL = "FAIL"
    SKIPPED = "SKIPPED"


class TrustLevel(Enum):
    AUTOMATIC = 1
    NOTIFY = 2
    APPROVAL = 3
    PROHIBITED = 4


@dataclass
class CheckResult:
    name: str
    status: AgentStatus
    message: str
    details: Optional[Dict] = None
    timestamp: str = None

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now().isoformat()


@dataclass
class AgentReport:
    agent_name: str
    agent_id: str
    status: AgentStatus
    checks: List[CheckResult]
    summary: str
    recommendations: List[str]
    timestamp: str = None
    duration_seconds: float = 0

    def __post_init__(self):
        if self.timestamp is None:
            self.timestamp = datetime.now().isoformat()

    def to_dict(self) -> Dict:
        return {
            "agent_name": self.agent_name,
            "agent_id": self.agent_id,
            "status": self.status.value,
            "checks": [asdict(c) for c in self.checks],
            "summary": self.summary,
            "recommendations": self.recommendations,
            "timestamp": self.timestamp,
            "duration_seconds": self.duration_seconds
        }

    def to_markdown(self) -> str:
        status_emoji = {
            AgentStatus.PASS: "PASS",
            AgentStatus.PARTIAL: "WARN",
            AgentStatus.FAIL: "FAIL",
            AgentStatus.SKIPPED: "SKIP"
        }
        md = f"## {self.agent_name}\n\n"
        md += f"**Status**: {self.status.value}\n"
        md += f"**Duration**: {self.duration_seconds:.2f}s\n\n"
        md += "### Checks\n\n"
        for check in self.checks:
            md += f"- [{check.status.value if hasattr(check.status, 'value') else check.status}] {check.name}: {check.message}\n"
        md += f"\n### Summary\n\n{self.summary}\n"
        if self.recommendations:
            md += "\n### Recommendations\n\n"
            for rec in self.recommendations:
                md += f"- {rec}\n"
        return md


class BaseAgent(ABC):
    def __init__(self, project_root: str = None):
        self.project_root = Path(project_root or os.getcwd())
        self.config = self._load_config()
        self.trust_levels = self._load_trust_levels()
        self.github = self._init_github()
        self.checks: List[CheckResult] = []

    @property
    @abstractmethod
    def name(self) -> str:
        pass

    @property
    @abstractmethod
    def agent_id(self) -> str:
        pass

    @property
    def is_critical(self) -> bool:
        return False

    def _load_config(self) -> Dict:
        config_path = self.project_root / "agents" / "config" / "verification_flow.yaml"
        if config_path.exists():
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        return {}

    def _load_trust_levels(self) -> Dict:
        config_path = self.project_root / "agents" / "config" / "trust_levels.yaml"
        if config_path.exists():
            with open(config_path, 'r') as f:
                return yaml.safe_load(f)
        return {}

    def _init_github(self) -> Optional[Any]:
        if Github is None:
            return None
        token = os.environ.get("GITHUB_TOKEN")
        return Github(token) if token else None

    def add_check(self, name: str, status: AgentStatus, message: str, details: Dict = None):
        self.checks.append(CheckResult(name=name, status=status, message=message, details=details))

    @abstractmethod
    def run_checks(self) -> List[CheckResult]:
        pass

    def determine_overall_status(self) -> AgentStatus:
        if not self.checks:
            return AgentStatus.SKIPPED
        statuses = [c.status for c in self.checks]
        if AgentStatus.FAIL in statuses:
            return AgentStatus.FAIL
        elif AgentStatus.PARTIAL in statuses:
            return AgentStatus.PARTIAL
        return AgentStatus.PASS

    def generate_summary(self) -> str:
        passed = sum(1 for c in self.checks if c.status == AgentStatus.PASS)
        failed = sum(1 for c in self.checks if c.status == AgentStatus.FAIL)
        partial = sum(1 for c in self.checks if c.status == AgentStatus.PARTIAL)
        return f"{passed} passed, {failed} failed, {partial} warnings out of {len(self.checks)} checks."

    def generate_recommendations(self) -> List[str]:
        recommendations = []
        for check in self.checks:
            if check.status == AgentStatus.FAIL:
                recommendations.append(f"Fix: {check.name}")
            elif check.status == AgentStatus.PARTIAL:
                recommendations.append(f"Review: {check.name}")
        return recommendations

    def run(self) -> AgentReport:
        import time
        start = time.time()
        self.checks = []
        self.run_checks()
        return AgentReport(
            agent_name=self.name,
            agent_id=self.agent_id,
            status=self.determine_overall_status(),
            checks=self.checks,
            summary=self.generate_summary(),
            recommendations=self.generate_recommendations(),
            duration_seconds=time.time() - start
        )

    def save_report(self, report: AgentReport, output_dir: str = None):
        if output_dir is None:
            output_dir = self.project_root / "agents" / "logs"
        output_path = Path(output_dir)
        output_path.mkdir(parents=True, exist_ok=True)
        timestamp = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        json_path = output_path / f"{timestamp}_{self.agent_id}.json"
        with open(json_path, 'w') as f:
            json.dump(report.to_dict(), f, indent=2)
        md_path = output_path / f"{timestamp}_{self.agent_id}.md"
        with open(md_path, 'w') as f:
            f.write(report.to_markdown())
        return json_path, md_path
