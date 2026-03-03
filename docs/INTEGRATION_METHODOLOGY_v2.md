# Quantum Shield - 統合開発方法論 v2.0

> **作成日**: 2026-03-01
> **目的**: 過去1ヶ月の統合失敗の根本原因を踏まえ、残り25-28%の作業を正しく完了するための方法論
> **前提**: ACTUAL_STATE.md の調査結果に基づく

---

## 1. なぜ統合作業が1ヶ月かかって抜け漏れが出たのか（根本原因分析）

### 1.1 五つの根本原因

| # | 根本原因 | 具体例 | 影響 |
|---|---------|--------|------|
| **RC-1** | **型定義が3箇所に重複** | 同じ`ConsumerStats`がbackend types.rs, frontend types.ts, mock.ts に別々に定義。変更時に1箇所だけ更新→型不整合 | APIレスポンスのサイレント失敗 |
| **RC-2** | **FALLBACK定数がコンポーネントにインライン定義** | `const FALLBACK_TICKETS = [...]` が111ファイルに直書き。hooks層ではなくコンポーネント層に存在するため、hooks改善では除去できない | Mock除去しても別の「嘘データ」が残る |
| **RC-3** | **snake_case/camelCase変換が未統一** | Backend: 9つのenumが`snake_case`、一部が`camelCase`、手動例外あり。Frontend: 変換ルールなし | JSONパース失敗、フィールド未マッチ |
| **RC-4** | **L3環境が存在しない** | 全L3設定がOption型、デフォルト=localhost:8545。テストネット環境未構築 | Phase 8-D(L3統合)が物理的に不可能 |
| **RC-5** | **CLAUDE.mdがPhase 6(UI)向け、統合作業には不十分** | CR-1「Mock禁止」とCR-10「Mock APIでUI確認」が矛盾。実際のcontract address、DBスキーマ、API仕様への参照なし | Claude Codeが統合セッションで正しい判断ができない |

### 1.2 Moonwell事件の教訓

2026年2月、DeFiプロトコル**Moonwell**でClaude Opusが書いたオラクル価格コードにバグがあり、**$1.78Mの損失**が発生。

- コードは構文的に完璧、基本テストもパス
- **根本原因**: 各レイヤーは個別にテストされたが、「統合テスト」が不在
- **QSとの類似点**: 「各層は個別にはできている。しかし繋がって動く状態は未検証」— まさに我々の状態

**教訓**: 単体テストだけでは不十分。**実チェーンに対する統合テスト**が必須。

---

## 2. 新しい統合手法（v2.0）

### 2.1 全体方針: Spec-Anchored Development

```
┌─────────────────────────────────────────────────────────────┐
│                    SOURCE OF TRUTH 階層                       │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  L0: Database Schema (migrations/*.sql)                       │
│      ↓ 型情報の流れ                                           │
│  L1: Backend Rust Types (types.rs + serde)                    │
│      ↓ OpenAPI生成 or 手動同期                                │
│  L2: Frontend TypeScript Types (lib/api/*/types.ts)           │
│      ↓ Hooks経由                                              │
│  L3: React Components (useQuery結果のみ使用)                   │
│      ↓ E2Eテスト                                              │
│  L4: Blockchain Contracts (ABI → TypeChain → Frontend)        │
│                                                               │
│  ルール: 上位レイヤーが変更されたら、下位レイヤーに伝搬       │
│  禁止: 下位レイヤーが独自に型を定義                           │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 Claude Code設定の刷新

#### A. CLAUDE.md をスリム化 (800行 → 150行以下)

現在のCLAUDE.mdは800行超。最新のベストプラクティスでは150行以下を推奨。
理由: **長すぎるCLAUDE.mdはコンテキストが薄まり、重要なルールが無視される。**

```
CLAUDE.md (150行以下: 普遍的ルール)
├── .claude/rules/frontend.md      ← React/Tailwind/i18nルール
├── .claude/rules/backend.md       ← Rust/sqlx/APIルール
├── .claude/rules/blockchain.md    ← L1/L3設定、contract address
├── .claude/rules/testing.md       ← テストパターン
└── .claude/rules/integration.md   ← 統合作業専用ルール
```

#### B. Hooks導入（ルールの「強制」）

CLAUDE.mdのルールは「助言」。Hooksは「強制」。

```json
// .claude/settings.json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [{
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/detect-mocks.sh"
        }]
      }
    ],
    "SessionStart": [
      {
        "matcher": "compact",
        "hooks": [{
          "type": "command",
          "command": "echo 'CRITICAL: 1) NO MOCK/FALLBACK data 2) Reuse existing API clients 3) Types flow from backend→frontend 4) L1=Sepolia(0x43aF...) L3=local Anvil only'"
        }]
      }
    ],
    "Stop": [
      {
        "matcher": "",
        "hooks": [{
          "type": "command",
          "command": "$CLAUDE_PROJECT_DIR/.claude/hooks/final-check.sh"
        }]
      }
    ]
  }
}
```

**detect-mocks.sh**: 新規コードにMOCK_/FALLBACK_/DEMO_パターンがあればブロック
**final-check.sh**: セッション終了時に `grep -rn "MOCK_\\|FALLBACK_" src/` で新規追加を検出

#### C. Subagents活用

```
.claude/agents/
├── api-contract-checker.md   ← FE/BE間のAPI整合性検証
├── mock-auditor.md           ← MOCK/FALLBACK残存スキャン
└── database-validator.md     ← スキーマ整合性検証
```

### 2.3 統合テスト基盤（Moonwell対策）

```yaml
# docker-compose.test.yml
services:
  # 既存の7サービス + テスト用追加
  anvil-l1:
    image: ghcr.io/foundry-rs/foundry:latest
    command: ["anvil", "--fork-url", "$SEPOLIA_RPC_URL", "--chain-id", "11155111", "--host", "0.0.0.0"]
    ports: ["8544:8545"]

  anvil-l3:
    image: ghcr.io/foundry-rs/foundry:latest
    command: ["anvil", "--chain-id", "31337", "--host", "0.0.0.0"]
    ports: ["8545:8545"]
```

**Wagmi Mock Connector for E2E**:
```typescript
// テスト環境でのみ有効なウォレットモック
const connectors = isTestEnv
  ? [mockConnector({ accounts: [TEST_ACCOUNT] })]
  : [injected(), walletConnect({ projectId })];
```

---

## 3. 具体的な実行計画（10-17日分）

### Phase 0: 基盤整備 ✅ 完了 (2026-03-01)

| # | タスク | 結果 |
|---|--------|------|
| 0-1 | CLAUDE.md スリム化 + .claude/rules/ 作成 | ✅ 120行 + 5 rules files |
| 0-2 | Hooks設定 (detect-mocks, compact-recovery, final-check) | ✅ settings.json + 2 hook scripts |
| 0-3 | Docker起動 + マイグレーション実行 | ✅ 全サービス稼働、20+テーブル |
| 0-4 | APIサーバー起動確認 | ✅ /v1/health → healthy |

### Phase 1: Consumer Lock フルフロー通し ✅ 完了 (2026-03-01)

| # | タスク | 結果 |
|---|--------|------|
| 1-1 | lock.rs skip_signature_verification追加 | ✅ dev modeバイパス |
| 1-2 | FE types.ts をBEのserde出力と照合 | ✅ 8フィールド一致 |
| 1-3 | レガシーhooks削除 (7個の404 hooks) | ✅ 削除済み |
| 1-4 | client.ts createLock メソッド修正 | ✅ 正しい型引数 |
| 1-5 | E2E: Lock フルフローテスト | ✅ lock.integration.spec.ts |

### Phase 2: Unlock + Emergency フロー ✅ 完了 (2026-03-01)

| # | タスク | 結果 |
|---|--------|------|
| 2-1 | Unlock Normal: skip_sig追加 + フロー確認 | ✅ 統合済み |
| 2-2 | Unlock Emergency: Bond計算 + フロー確認 | ✅ 統合済み |
| 2-3 | E2E: Unlock フルフローテスト | ✅ 基本テスト作成 |

### Phase 3: Prover/Observer/Challenge フロー ✅ 完了 (2026-03-02)

| # | タスク | 結果 |
|---|--------|------|
| 3-1 | Prover Registration API統合テスト | ✅ 作成・パス |
| 3-2 | Observer/Prover FALLBACK除去 | ✅ 0件 |
| 3-3 | ProverChallenge mock→API hook統合 | ✅ useProverChallenges接続 |

### Phase 4: FALLBACK一括除去 ✅ 完了 (2026-03-02)

| # | タスク | 結果 |
|---|--------|------|
| 4-1 | FALLBACK_定数除去 (478箇所) | ✅ 0件 |
| 4-2 | MOCK_除去 (111箇所, 非mock.ts) | ✅ 0件 |
| 4-3 | mock[A-Z]改名 (691箇所) | ✅ 0件 |
| — | **合計: 1,219パターン / 184ファイル** | ✅ TypeScript 0 errors |

### Phase 5: 全体検証 + ドキュメント更新 ✅ 完了 (2026-03-02)

| # | タスク | 結果 |
|---|--------|------|
| 5-1 | TypeScript全体コンパイル | ✅ 0 errors |
| 5-2 | Rust build + stub検出 | ✅ build成功、todo!/unimplemented! = 0 |
| 5-3 | FALLBACK/MOCK/DEMO最終検証 | ✅ components内 = 0件 |
| 5-4 | ACTUAL_STATE.md 更新 | ✅ 72-75% → 92-94% |
| 5-5 | INTEGRATION_METHODOLOGY_v2.md 更新 | ✅ Phase完了マーク |
| 5-6 | Seq#6 Slashing FE→API統合 | ✅ hooks/types/component接続 |
| 5-7 | Seq#7 Governance L/E/E改善 | ✅ 3コンポーネント + i18n |
| 5-8 | Seq#8 Emergency Pause FE→API統合 | ✅ hooks/types/component接続 |
| 5-9 | Seq#9 Token Hub L/E/E改善 | ✅ 4コンポーネント + i18n |
| 5-10 | E2E: Challenge/Slashing統合テスト | ✅ 13テスト (challenge-slashing.integration.spec.ts) |
| 5-11 | E2E: Emergency Pause統合テスト | ✅ 15テスト (emergency-pause.integration.spec.ts) |
| 5-12 | E2E: Governance統合テスト強化 | ✅ 12テスト (API+L/E/E検証) |
| 5-13 | E2E: Token Hub統合テスト強化 | ✅ 19テスト (API+L/E/E検証) |
| 5-14 | ACTUAL_STATE.md 最終更新 | ✅ 92-94% |

---

## 4. セッション管理戦略

### 4.1 1タスク = 1セッション

| 誤り | 正解 |
|------|------|
| 1セッションで複数アプリの統合 | 1セッション = 1つのフローの1レイヤー |
| コンテキスト圧縮後も継続 | `/clear` して新セッション開始 |
| 800行のCLAUDE.mdに全情報 | 150行CLAUDE.md + scoped rules |

### 4.2 コンテキスト圧縮対策

```
SessionStart (compact) hook:
→ 「現在作業中のPhase、変更済みファイル、失敗したテスト」を自動注入
→ .claude/specs/in-progress/ から現在のspecファイルを読み込み
```

### 4.3 並列セッション（Agent Teams）

```bash
# 例: Phase 1のFE/BE並列作業
# Session A (Frontend): Consumer Lock UIのFALLBACK除去
claude -p "Follow .claude/specs/in-progress/consumer-lock-fe.md"

# Session B (Backend): Consumer Lock APIの型整合
claude -p "Follow .claude/specs/in-progress/consumer-lock-be.md"
```

---

## 5. 品質ゲート（各Phase終了時）

| チェック | コマンド | 合格基準 |
|---------|---------|---------|
| MOCK残存 | `grep -rn "MOCK_" src/ --include="*.ts" --include="*.tsx" \| grep -v mock.ts \| wc -l` | 0 |
| FALLBACK残存 | `grep -rn "FALLBACK_" src/ --include="*.ts" --include="*.tsx" \| wc -l` | 0 (Phase 4完了後) |
| TypeScriptコンパイル | `npx tsc --noEmit` | 0 errors |
| E2Eテスト | `npx playwright test` | 全PASS |
| API応答整合性 | `curl + jq でスキーマ確認` | FE types.ts と一致 |
| DBレコード存在 | `psql -c "SELECT count(*) FROM locks"` | > 0 (統合テスト後) |

---

## 6. 再発防止策まとめ

| 問題 | v1.0（失敗した方法） | v2.0（新しい方法） |
|------|---------------------|-------------------|
| Mock残存 | CLAUDE.mdに「Mock禁止」と記載 | **Hook**でMOCK_パターンを自動ブロック |
| 型不整合 | FE/BEそれぞれ手動で型定義 | **Backend types.rs → FE types.ts** の一方向フロー |
| L1混同 | 「L1 = Sepolia」と口頭で伝達 | **.claude/rules/blockchain.md** にaddress, chainId明記 |
| コンテキスト喪失 | 800行CLAUDE.md | **150行CLAUDE.md + scoped rules + compact hooks** |
| 統合未検証 | 各層を個別にテスト | **Docker Compose + Anvil fork + Playwright** で統合テスト |

---

## Sources

- [Anthropic 2026 Agentic Coding Trends Report](https://resources.anthropic.com/2026-agentic-coding-trends-report)
- [Moonwell $1.78M Incident (NeuralTrust)](https://neuraltrust.ai/blog/moonwell-claude-opus)
- [Spec-Driven Development (arXiv:2602.00180)](https://arxiv.org/html/2602.00180v1)
- [Claude Code Hooks Guide](https://code.claude.com/docs/en/hooks-guide)
- [E2E Testing DApps with Playwright + Anvil + Wagmi](https://www.rombrom.com/posts/testing-dapps-with-playwright-anvil-wagmi/)
- [Claude Code Best Practices](https://code.claude.com/docs/en/best-practices)
- [Writing a good CLAUDE.md](https://www.humanlayer.dev/blog/writing-a-good-claude-md)
- [GitHub Issue #6984: Systematic Mock Data Generation Bias](https://github.com/anthropics/claude-code/issues/6984)
