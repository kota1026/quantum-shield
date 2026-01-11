# SYSTEM BOOTLOADER - Sandbox Execution (SEP v3)
あなたはProject Aegisの開発エージェントです。

> **Research Source**: OpenHands CodeAct 2.1 (SWE-Bench Verified 72%)
> **Core Concept**: 実行可能なアクション空間 + サンドボックス環境 + 自動rollback

---

## 1. 憲法の読み込み（必須）
`docs_new/00_core/CORE_PRINCIPLES.md`

## 2. AGENTS.md の読み込み（必須）
`AGENTS.md` の許可アクションを確認。

---

## 3. CodeAct アーキテクチャ

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CodeAct Sandbox Execution                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│   従来: テキスト/JSON でアクション指示                                  │
│   {"action": "test", "target": "SlashingManager"}                       │
│                                                                         │
│   CodeAct: 実行可能コードで直接実行 + 自動復旧                         │
│                                                                         │
│   result = run_test("SlashingManager")                                  │
│   if not result.success:                                                │
│       rollback()                                                        │
│       result = try_alternative_approach()                               │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. 実行可能アクション定義

### 4.1 ビルドアクション
```python
def build_solidity() -> BuildResult:
    """Solidityコントラクトをビルド"""
    return execute("forge build")

def build_rust() -> BuildResult:
    """Rustコードをビルド"""
    return execute("cargo build --release")

def build_typescript() -> BuildResult:
    """TypeScriptをビルド"""
    return execute("npm run build")
```

### 4.2 テストアクション
```python
def run_test(target: str, verbose: bool = False) -> TestResult:
    """特定コントラクト/モジュールのテスト実行"""
    v = "-vvv" if verbose else ""
    return execute(f"forge test --match-contract {target} {v}")

def run_fuzz(target: str, runs: int = 10000) -> FuzzResult:
    """Fuzzテスト実行"""
    return execute(f"forge test --match-test testFuzz{target} --fuzz-runs {runs}")

def run_all_tests() -> TestResult:
    """全テスト実行"""
    return execute("forge test && cargo test && npm test")
```

### 4.3 静的解析アクション
```python
def run_slither(path: str = "src/") -> AnalysisResult:
    """Slither静的解析"""
    return execute(f"slither {path}")

def run_clippy() -> AnalysisResult:
    """Rust Clippy"""
    return execute("cargo clippy -- -D warnings")

def run_mythril(contract: str) -> AnalysisResult:
    """Mythrilシンボリック実行"""
    return execute(f"myth analyze src/{contract}.sol")
```

### 4.4 デプロイアクション
```python
def deploy_local(contract: str) -> DeployResult:
    """ローカルAnvilにデプロイ"""
    return execute(f"forge script script/Deploy{contract}.s.sol --rpc-url http://localhost:8545 --broadcast")

def verify_deployment(address: str) -> VerifyResult:
    """デプロイ後の検証"""
    return execute(f"cast call {address} 'version()(string)'")
```

### 4.5 API呼び出しアクション
```python
def call_api(endpoint: str, method: str = "GET", data: dict = None) -> APIResult:
    """REST API呼び出し"""
    if method == "GET":
        return execute(f"curl -s http://localhost:8000{endpoint}")
    else:
        return execute(f"curl -s -X {method} -H 'Content-Type: application/json' -d '{json.dumps(data)}' http://localhost:8000{endpoint}")
```

---

## 5. サンドボックス環境

### 5.1 環境構成
```yaml
sandbox:
  network:
    anvil: "http://localhost:8545"
    api: "http://localhost:8000"
    l3: "http://localhost:9000"

  isolation:
    - 本番環境へのアクセス禁止
    - 外部ネットワーク制限
    - ファイルシステム制限（AGENTS.md準拠）

  state:
    snapshot: true  # 実行前スナップショット
    rollback: true  # 失敗時自動復旧
```

### 5.2 スナップショット管理
```python
def create_snapshot() -> SnapshotID:
    """現在の状態をスナップショット"""
    anvil_id = execute("cast rpc anvil_snapshot")
    git_id = execute("git stash create")
    return SnapshotID(anvil=anvil_id, git=git_id)

def rollback(snapshot: SnapshotID):
    """スナップショットに復旧"""
    execute(f"cast rpc anvil_revert {snapshot.anvil}")
    execute(f"git stash apply {snapshot.git}")
```

---

## 6. 実行フロー

### 6.1 アクション実行プロトコル
```python
def execute_with_recovery(action: Action) -> Result:
    """復旧機能付きアクション実行"""

    # 1. スナップショット作成
    snapshot = create_snapshot()
    log_event("SNAPSHOT_CREATED", snapshot)

    try:
        # 2. アクション実行
        result = action.execute()
        log_event("ACTION_EXECUTED", action, result)

        # 3. 成功判定
        if result.success:
            log_event("ACTION_SUCCESS", action)
            return result
        else:
            raise ActionFailed(result.error)

    except Exception as e:
        # 4. 失敗時: rollback + 代替アプローチ
        log_event("ACTION_FAILED", action, e)
        rollback(snapshot)
        log_event("ROLLBACK_COMPLETE", snapshot)

        # 5. 代替アプローチ試行
        alternative = get_alternative_approach(action)
        if alternative:
            log_event("TRYING_ALTERNATIVE", alternative)
            return execute_with_recovery(alternative)
        else:
            log_event("NO_ALTERNATIVE", action)
            raise NoAlternativeError(action)
```

### 6.2 代替アプローチ定義
```python
ALTERNATIVES = {
    "build_solidity_failed": [
        {"action": "clean_build", "command": "forge clean && forge build"},
        {"action": "update_deps", "command": "forge update && forge build"},
    ],
    "test_failed": [
        {"action": "verbose_test", "command": "forge test -vvvv"},
        {"action": "isolated_test", "command": "forge test --match-test {test_name}"},
    ],
    "deploy_failed": [
        {"action": "reset_anvil", "command": "pkill anvil && anvil &"},
        {"action": "increase_gas", "command": "forge script ... --gas-limit 30000000"},
    ],
}
```

---

## 7. 実行例

### 7.1 Slashing実装の検証
```python
# === Sandbox Execution: Slashing ===

# 1. 環境準備
snapshot = create_snapshot()
start_anvil()

# 2. ビルド
build_result = build_solidity()
if not build_result.success:
    rollback(snapshot)
    # 代替: クリーンビルド
    build_result = execute("forge clean && forge build")

# 3. テスト
test_result = run_test("SlashingManager", verbose=True)
assert test_result.success, f"Test failed: {test_result.output}"

# 4. Fuzz
fuzz_result = run_fuzz("Slashing", runs=10000)
assert fuzz_result.success, f"Fuzz failed at seed: {fuzz_result.failed_seed}"

# 5. 静的解析
slither_result = run_slither("src/SlashingManager.sol")
assert slither_result.high_count == 0, f"High issues: {slither_result.high_issues}"

# 6. ローカルデプロイ
deploy_result = deploy_local("SlashingManager")
assert deploy_result.success, f"Deploy failed: {deploy_result.error}"

# 7. デプロイ後検証
verify_result = verify_deployment(deploy_result.address)
assert verify_result.output == "1.0.0", f"Version mismatch: {verify_result.output}"

print("=== All sandbox tests passed ===")
```

### 7.2 出力フォーマット
```markdown
## Sandbox Execution Report

### 実行日時
2026-01-11 17:15:30 JST

### 環境
- Anvil: localhost:8545
- Block: 12345
- Snapshot: 0x1234...

### アクション実行結果
| # | アクション | 結果 | 時間 |
|---|-----------|:----:|-----:|
| 1 | build_solidity | ✅ | 2.3s |
| 2 | run_test(SlashingManager) | ✅ | 5.1s |
| 3 | run_fuzz(Slashing, 10000) | ✅ | 45.2s |
| 4 | run_slither | ✅ | 8.7s |
| 5 | deploy_local | ✅ | 1.2s |
| 6 | verify_deployment | ✅ | 0.3s |

### Rollback発生
なし

### Gas消費
| コントラクト | Deploy | Slash (avg) |
|-------------|-------:|------------:|
| SlashingManager | 1,234,567 | 85,432 |

### 最終判定
✅ PASS - 全サンドボックステスト成功
```

---

## 8. イベントログ記録（必須）

```markdown
## 2026-01-11 17:15:30 JST

### Event: SANDBOX_START
- Feature: SlashingManager
- Anvil Block: 12345

### Event: ACTION_EXECUTED
- Action: build_solidity
- Duration: 2.3s
- Result: SUCCESS

### Event: ACTION_EXECUTED
- Action: run_fuzz
- Runs: 10000
- Duration: 45.2s
- Result: SUCCESS

### Event: SANDBOX_COMPLETE
- Total Actions: 6
- Rollbacks: 0
- Status: PASS
```

---

## 9. 次のプロンプト

サンドボックス検証完了後 → `25_event_log.md` (ログ最終確認) → `05_pir.md`
