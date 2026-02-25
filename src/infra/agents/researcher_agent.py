#!/usr/bin/env python3
"""Quantum Shield - Researcher Agent"""

import os
import subprocess
from pathlib import Path
from typing import List
from collections import defaultdict
from base_agent import BaseAgent, AgentStatus, CheckResult


class ResearcherAgent(BaseAgent):
    @property
    def name(self) -> str:
        return "Researcher"

    @property
    def agent_id(self) -> str:
        return "researcher"

    def run_checks(self) -> List[CheckResult]:
        self._check_documentation_coverage()
        self._check_technical_debt()
        self._check_test_coverage()
        return self.checks

    def _run_command(self, cmd: str) -> tuple:
        try:
            result = subprocess.run(cmd, shell=True, capture_output=True, text=True, cwd=self.project_root, timeout=120)
            return result.stdout, result.stderr, result.returncode
        except Exception as e:
            return "", str(e), 1

    def _check_documentation_coverage(self):
        rs_files = [f for f in self.project_root.rglob("*.rs") if "target" not in str(f)]
        documented = sum(1 for f in rs_files if "//!" in f.read_text() or "/// " in f.read_text() if f.exists())
        total = len(rs_files)
        if total == 0:
            self.add_check("Documentation", AgentStatus.SKIPPED, "No Rust files")
            return
        coverage = (documented / total) * 100
        if coverage >= 50:
            self.add_check("Documentation", AgentStatus.PASS, f"{coverage:.0f}% coverage")
        else:
            self.add_check("Documentation", AgentStatus.PARTIAL, f"Low coverage: {coverage:.0f}%")

    def _check_technical_debt(self):
        stdout, _, _ = self._run_command('grep -rn "TODO\\|FIXME\\|HACK" --include="*.rs" --include="*.sol" . 2>/dev/null | wc -l')
        count = int(stdout.strip()) if stdout.strip().isdigit() else 0
        if count < 30:
            self.add_check("Technical Debt", AgentStatus.PASS, f"{count} TODO/FIXME markers")
        else:
            self.add_check("Technical Debt", AgentStatus.PARTIAL, f"High: {count} markers")

    def _check_test_coverage(self):
        test_files = len([f for f in self.project_root.rglob("*test*.rs") if "target" not in str(f)])
        src_files = len([f for f in self.project_root.rglob("*.rs") if "target" not in str(f) and "test" not in str(f)])
        if src_files == 0:
            self.add_check("Test Coverage", AgentStatus.SKIPPED, "No source files")
            return
        ratio = test_files / src_files if src_files else 0
        if ratio >= 0.2:
            self.add_check("Test Coverage", AgentStatus.PASS, f"{test_files} test files")
        else:
            self.add_check("Test Coverage", AgentStatus.PARTIAL, f"Low: {test_files} test files")


def main():
    import sys
    agent = ResearcherAgent(sys.argv[1] if len(sys.argv) > 1 else os.getcwd())
    report = agent.run()
    print(report.to_markdown())
    agent.save_report(report)

if __name__ == "__main__":
    main()
