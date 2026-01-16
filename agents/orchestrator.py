#!/usr/bin/env python3
"""Quantum Shield - Agent Orchestrator"""

import os
import sys
import json
import yaml
import time
from pathlib import Path
from datetime import datetime
from typing import List, Dict, Optional
from concurrent.futures import ThreadPoolExecutor, as_completed

try:
    from github import Github
    import requests
except ImportError:
    Github = None
    requests = None

from base_agent import AgentReport, AgentStatus


class AgentOrchestrator:
    def __init__(self, project_root: str, github_token: str = None, slack_webhook: str = None):
        self.project_root = Path(project_root)
        self.github_token = github_token or os.environ.get("GITHUB_TOKEN")
        self.slack_webhook = slack_webhook or os.environ.get("SLACK_WEBHOOK_URL")
        self.github = Github(self.github_token) if Github and self.github_token else None
        self.reports: List[AgentReport] = []

    def load_agent(self, agent_id: str):
        agent_map = {
            "cso": ("cso_agent", "CSOAgent"),
            "researcher": ("researcher_agent", "ResearcherAgent"),
            "devops": ("devops_agent", "DevOpsAgent"),
        }
        if agent_id not in agent_map:
            return None
        module_name, class_name = agent_map[agent_id]
        try:
            agents_dir = self.project_root / "agents"
            if str(agents_dir) not in sys.path:
                sys.path.insert(0, str(agents_dir))
            module = __import__(module_name)
            return getattr(module, class_name)(str(self.project_root))
        except Exception as e:
            print(f"Failed to load {agent_id}: {e}")
            return None

    def run_agent(self, agent_id: str) -> Optional[AgentReport]:
        agent = self.load_agent(agent_id)
        if agent:
            return agent.run()
        return None

    def run_all(self, agent_ids: List[str] = None) -> List[AgentReport]:
        if agent_ids is None:
            agent_ids = ["cso", "researcher", "devops"]
        self.reports = []
        with ThreadPoolExecutor(max_workers=4) as executor:
            futures = {executor.submit(self.run_agent, aid): aid for aid in agent_ids}
            for future in as_completed(futures):
                report = future.result()
                if report:
                    self.reports.append(report)
        return self.reports

    def overall_status(self) -> AgentStatus:
        if not self.reports:
            return AgentStatus.SKIPPED
        if any(r.status == AgentStatus.FAIL for r in self.reports):
            return AgentStatus.FAIL
        if any(r.status == AgentStatus.PARTIAL for r in self.reports):
            return AgentStatus.PARTIAL
        return AgentStatus.PASS

    def generate_report(self) -> str:
        md = f"# Agent Report - {datetime.now().strftime('%Y-%m-%d %H:%M')}\n\n"
        md += f"**Overall**: {self.overall_status().value}\n\n"
        md += "| Agent | Status |\n|-------|--------|\n"
        for r in self.reports:
            md += f"| {r.agent_name} | {r.status.value} |\n"
        md += "\n---\n\n"
        for r in self.reports:
            md += r.to_markdown() + "\n---\n\n"
        return md

    def send_slack(self, message: str):
        if requests and self.slack_webhook:
            try:
                requests.post(self.slack_webhook, json={"text": message})
            except Exception as e:
                print(f"Slack error: {e}")

    def create_issue(self, title: str, body: str):
        if self.github:
            try:
                repo = self.github.get_repo(os.environ.get("GITHUB_REPOSITORY", "kota1026/quantum-shield"))
                repo.create_issue(title=title, body=body[:65000], labels=["agent-report", "automated"])
            except Exception as e:
                print(f"Issue error: {e}")

    def save_reports(self):
        output = self.project_root / "agents" / "logs"
        output.mkdir(parents=True, exist_ok=True)
        ts = datetime.now().strftime("%Y-%m-%d_%H-%M-%S")
        with open(output / f"{ts}_report.md", 'w') as f:
            f.write(self.generate_report())
        with open(output / f"{ts}_report.json", 'w') as f:
            json.dump({"status": self.overall_status().value, "reports": [r.to_dict() for r in self.reports]}, f, indent=2)


def main():
    project = sys.argv[1] if len(sys.argv) > 1 else os.getcwd()
    orch = AgentOrchestrator(project)
    orch.run_all()
    print(orch.generate_report())
    orch.save_reports()
    status = orch.overall_status()
    if status == AgentStatus.FAIL:
        orch.create_issue(f"Agent Report FAIL - {datetime.now().strftime('%Y-%m-%d')}", orch.generate_report())
    orch.send_slack(f"Agent Report: {status.value}")
    sys.exit(1 if status == AgentStatus.FAIL else 0)

if __name__ == "__main__":
    main()
