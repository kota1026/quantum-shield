#!/usr/bin/env python3
"""Quantum Shield - Log Manager"""

import os
import json
from pathlib import Path
from datetime import datetime, timedelta
from typing import List, Dict, Optional

try:
    from github import Github
except ImportError:
    Github = None


class LogManager:
    def __init__(self, log_dir: str = None, github_token: str = None, gist_id: str = None):
        self.log_dir = Path(log_dir or "agents/logs")
        self.github_token = github_token or os.environ.get("GITHUB_TOKEN")
        self.gist_id = gist_id or os.environ.get("AGENT_LOG_GIST_ID")
        self.github = Github(self.github_token) if Github and self.github_token else None

    def get_log_files(self, pattern: str = "*.md") -> List[Path]:
        if not self.log_dir.exists():
            return []
        return sorted(self.log_dir.glob(pattern))

    def get_old_logs(self, days: int) -> List[Path]:
        cutoff = datetime.now() - timedelta(days=days)
        old = []
        for f in self.get_log_files():
            try:
                date_str = f.name[:10]
                if datetime.strptime(date_str, "%Y-%m-%d") < cutoff:
                    old.append(f)
            except ValueError:
                pass
        return old

    def cleanup(self, days: int = 30, delete: bool = False) -> Dict:
        old = self.get_old_logs(days)
        result = {"found": len(old), "deleted": 0}
        if delete:
            for f in old:
                f.unlink()
                result["deleted"] += 1
        return result

    def sync_to_gist(self, max_files: int = 10) -> bool:
        if not self.github or not self.gist_id:
            return False
        files = self.get_log_files()[-max_files:]
        if not files:
            return False
        try:
            gist = self.github.get_gist(self.gist_id)
            gist_files = {}
            for f in files:
                content = f.read_text()[:100000]
                gist_files[f.name] = {"content": content}
            gist.edit(files=gist_files)
            return True
        except Exception as e:
            print(f"Gist sync error: {e}")
            return False

    def get_summary(self, days: int = 7) -> Dict:
        cutoff = datetime.now() - timedelta(days=days)
        summary = {"runs": 0, "pass": 0, "partial": 0, "fail": 0}
        for f in self.get_log_files("*.json"):
            try:
                if datetime.strptime(f.name[:10], "%Y-%m-%d") < cutoff:
                    continue
                data = json.loads(f.read_text())
                summary["runs"] += 1
                status = data.get("status", "").upper()
                if status == "PASS":
                    summary["pass"] += 1
                elif status == "PARTIAL":
                    summary["partial"] += 1
                elif status == "FAIL":
                    summary["fail"] += 1
            except Exception:
                pass
        return summary


def main():
    import sys
    log_dir = sys.argv[1] if len(sys.argv) > 1 else "agents/logs"
    action = sys.argv[2] if len(sys.argv) > 2 else "summary"
    mgr = LogManager(log_dir)
    if action == "cleanup":
        print(mgr.cleanup(days=30, delete=True))
    elif action == "sync":
        print("Synced" if mgr.sync_to_gist() else "Failed")
    else:
        print(mgr.get_summary())

if __name__ == "__main__":
    main()
