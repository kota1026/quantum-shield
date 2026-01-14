#!/usr/bin/env python3
"""Quantum Shield - DevOps Agent"""

import os
import subprocess
from pathlib import Path
from typing import List
from base_agent import BaseAgent, AgentStatus, CheckResult


class DevOpsAgent(BaseAgent):
    @property
    def name(self) -> str:
        return "DevOps"

    @property
    def agent_id(self) -> str:
        return "devops"

    def run_checks(self) -> List[CheckResult]:
        self._check_ci_config()
        self._check_docker_config()
        self._check_git_status()
        return self.checks

    def _run_command(self, cmd: str) -> tuple:
        try:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=self.project_root, timeout=60)
            return result.stdout, result.stderr, result.returncode
        except Exception as e:
            return "", str(e), 1

    def _check_ci_config(self):
        workflows_dir = self.project_root / ".github" / "workflows"
        if not workflows_dir.exists():
            self.add_check("CI Config", AgentStatus.PARTIAL, "No workflows found")
            return
        workflows = list(workflows_dir.glob("*.yml")) + list(workflows_dir.glob("*.yaml"))
        has_ci = any("ci" in w.stem.lower() for w in workflows)
        has_daily = any("daily" in w.stem.lower() for w in workflows)
        if has_ci and has_daily:
            self.add_check("CI Config", AgentStatus.PASS, f"{len(workflows)} workflows")
        else:
            self.add_check("CI Config", AgentStatus.PARTIAL, f"Missing: {'ci' if not has_ci else ''} {'daily' if not has_daily else ''}")

    def _check_docker_config(self):
        dockerfile = self.project_root / "Dockerfile"
        if dockerfile.exists():
            self.add_check("Docker", AgentStatus.PASS, "Dockerfile present")
        else:
            self.add_check("Docker", AgentStatus.PARTIAL, "No Dockerfile")

    def _check_git_status(self):
        stdout, _, _ = self._run_command("git status --porcelain")
        uncommitted = len([l for l in stdout.strip().split('\n') if l.strip()]) if stdout.strip() else 0
        branch_out, _, _ = self._run_command("git branch --show-current")
        branch = branch_out.strip() if branch_out else "unknown"
        if uncommitted > 10:
            self.add_check("Git Status", AgentStatus.PARTIAL, f"{uncommitted} uncommitted on {branch}")
        else:
            self.add_check("Git Status", AgentStatus.PASS, f"Clean on {branch}")


def main():
    import sys
    agent = DevOpsAgent(sys.argv[1] if len(sys.argv) > 1 else os.getcwd())
    report = agent.run()
    print(report.to_markdown())
    agent.save_report(report)

if __name__ == "__main__":
    main()
