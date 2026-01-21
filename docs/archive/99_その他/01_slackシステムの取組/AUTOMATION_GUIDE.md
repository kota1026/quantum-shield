# Quantum Shield CI/CD 自動化ガイド

## 1. GitHub Actions による自動テスト

`.github/workflows/ci.yml` を作成：

```yaml
name: Quantum Shield CI

on:
  push:
    branches: [main, dev/*]
  pull_request:
    branches: [main]

jobs:
  rust-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
        with:
          submodules: recursive
      
      - name: Setup Rust
        uses: dtolnay/rust-action@stable
      
      - name: Build pq-crystals FFI
        run: |
          cd circuits/dilithium-stark
          cargo build --features pq_crystals_ffi
      
      - name: Run NIST KAT Tests
        run: |
          cd circuits/dilithium-stark
          cargo test test_nist_kat_ffi -- --nocapture
      
      - name: Run All Tests
        run: |
          cd circuits/dilithium-stark
          cargo test

  lean4-proofs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Lean4
        uses: leanprover/lean-action@v1
      
      - name: Build Proofs
        run: |
          cd proofs/lean4
          lake update
          lake build
      
      - name: Check for sorry
        run: |
          if grep -q "sorry" proofs/lean4/NTT.lean; then
            echo "ERROR: sorry found in NTT.lean"
            exit 1
          fi

  solidity-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Foundry
        uses: foundry-rs/foundry-toolchain@v1
      
      - name: Run Tests
        run: |
          cd contracts
          forge test -vv

  notify-on-failure:
    needs: [rust-tests, lean4-proofs, solidity-tests]
    if: failure()
    runs-on: ubuntu-latest
    steps:
      - name: Send Slack Notification
        uses: 8398a7/action-slack@v3
        with:
          status: ${{ job.status }}
          webhook_url: ${{ secrets.SLACK_WEBHOOK }}
```

## 2. 自動エージェント監査（定期実行）

`.github/workflows/agent-audit.yml`:

```yaml
name: Agent System Audit

on:
  schedule:
    - cron: '0 9 * * 1'  # 毎週月曜9時
  workflow_dispatch:  # 手動実行可能

jobs:
  audit:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      
      - name: Run Agent Audit
        run: |
          chmod +x scripts/verify_p0_fixes.sh
          ./scripts/verify_p0_fixes.sh
      
      - name: Generate Report
        run: |
          echo "Audit completed at $(date)" >> audit_report.md
      
      - name: Upload Report
        uses: actions/upload-artifact@v4
        with:
          name: audit-report
          path: audit_report.md
```

## 3. ローカル自動化（pre-commit hooks）

`.git/hooks/pre-commit`:

```bash
#!/bin/bash
echo "Running pre-commit checks..."

# Rust tests
cd circuits/dilithium-stark
if ! cargo test --quiet; then
    echo "❌ Rust tests failed"
    exit 1
fi

# Check for sorry in Lean4
if grep -q "sorry" proofs/lean4/NTT.lean; then
    echo "❌ Found 'sorry' in Lean4 proofs"
    exit 1
fi

echo "✅ All pre-commit checks passed"
```

## 4. MCP Server による Claude自動実行

Claude Desktop + MCP Server で自動化：

```json
// claude_desktop_config.json
{
  "mcpServers": {
    "quantum-shield": {
      "command": "node",
      "args": ["path/to/mcp-server.js"],
      "env": {
        "PROJECT_PATH": "/Users/kotakato/pqc_zk/zk-dilithium-ntt"
      }
    }
  }
}
```

これにより、Claudeが直接テストを実行できるようになります。
