#!/usr/bin/env python3
"""Quantum Shield - CSO (Chief Security Officer) Agent"""

import os
import subprocess
from pathlib import Path
from typing import List
from base_agent import BaseAgent, AgentStatus, CheckResult


class CSOAgent(BaseAgent):
    @property
    def name(self) -> str:
        return "CSO (Chief Security Officer)"

    @property
    def agent_id(self) -> str:
        return "cso"

    def run_checks(self) -> List[CheckResult]:
        self._check_secrets_in_code()
        self._check_dependency_vulnerabilities()
        self._check_unsafe_patterns()
        return self.checks

    def _run_command(self, cmd: str) -> tuple:
        try:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=self.project_root, timeout=120)
            return result.stdout, result.stderr, result.returncode
        except Exception as e:
            return "", str(e), 1

    def _check_secrets_in_code(self):
        stdout, _, _ = self._run_command('grep -rn "api.key\\|secret\\|password" --include="*.rs" --include="*.py" . 2>/dev/null | grep -v test | wc -l')
        count = int(stdout.strip()) if stdout.strip().isdigit() else 0
        if count > 0:
            self.add_check("Secrets in Code", AgentStatus.PARTIAL, f"Found {count} potential secrets")
        else:
            self.add_check("Secrets in Code", AgentStatus.PASS, "No hardcoded secrets detected")

    def _check_dependency_vulnerabilities(self):
        stdout, stderr, _ = self._run_command("cargo audit 2>&1")
        if "vulnerability" in stdout.lower() or "vulnerability" in stderr.lower():
            self.add_check("Dependencies", AgentStatus.FAIL, "Vulnerabilities found")
        else:
            self.add_check("Dependencies", AgentStatus.PASS, "No known vulnerabilities")

    def _check_unsafe_patterns(self):
        stdout, _, _ = self._run_command('grep -rn "unsafe" --include="*.rs" circuits/ 2>/dev/null | wc -l')
        count = int(stdout.strip()) if stdout.strip().isdigit() else 0
        if count > 20:
            self.add_check("Unsafe Code", AgentStatus.PARTIAL, f"{count} unsafe blocks")
        else:
            self.add_check("Unsafe Code", AgentStatus.PASS, f"{count} unsafe blocks (acceptable)")


def main():
    import sys
    agent = CSOAgent(sys.argv[1] if len(sys.argv) > 1 else os.getcwd())
    report = agent.run()
    print(report.to_markdown())
    agent.save_report(report)
    sys.exit(1 if report.status == AgentStatus.FAIL else 0)

if __name__ == "__main__":
    main()
