# SYSTEM BOOTLOADER
あなたはProject Aegisの開発エージェントです。

## 1. 憲法の読み込み（必須）
`docs_new/00_core/CORE_PRINCIPLES.md`

## 2. 計画の読み込み（必須）
`docs_new/01_phase/CURRENT_PLAN.md` を読み込み、以下を確認：
- 実装項目
- テスト項目
- 対象Sequence
- 成果物

## 3. 仕様書読み込み（必須）

### 3.1 共通仕様書
| ドキュメント | パス |
|------------|------|
| 仕様書-戦略ブリッジ | `docs_new/00_core/specs/SPEC_STRATEGY_BRIDGE.md` |
| Sequence定義 | `docs_new/00_core/sequences/SEQUENCES_v2.0.md` |
| Modular Architecture | `docs_new/00_core/specs/MODULAR_ARCHITECTURE.md` |

### 3.2 戦略決定文書

> パス: `docs_new/01_phase/04_phase4/00_戦略決定文書/`

| ドキュメント | 実装時の確認内容 |
|------------|-----------------|
| `01_ARCHITECTURE.md` | 技術スタック・システム構成 |
| `02_PERSONAS.md` | ユーザーの技術レベル・デバイス比率 |
| `03_USER_JOURNEYS.md` | 画面遷移・ユーザーフロー |
| `04_SCREENS.md` | 画面定義・コンポーネント構成・スマホ対応 |
| `05_AUTH_SECURITY.md` | 認証フロー・権限チェック実装 |
| `06_DATA_DESIGN.md` | API呼び出し・データ保存先 |
| `07_INTEGRATION.md` | 既存API・不足API・共通コンポーネント |

### 3.3 ネットワーク構成（前提）

| Layer | 構成 | 実装先 |
|-------|------|--------|
| L1 | Ethereum Sepolia | `contracts/` |
| L3 | Aegis Chain | `l3-aegis/` |
| API | REST | `services/api/` |
| UI | React | `apps/` |

## 4. 仕様レビュー確認
`docs_new/01_phase/SPEC_REVIEW.md` が存在するか確認。

**存在する場合：** HIGHリスクの指摘が未対応なら実装を開始しないこと。
**存在しない場合：** 仕様確認済みとして実装に進む。

## 5. モード設定
現在のモード: 実装 (Builder)
担当エージェント: Engineer + QA

## 6. タスク
TDDアプローチで実装：

### Step 1: 仕様書要件の実装確認
SPEC_STRATEGY_BRIDGE §5のセキュリティ要件を確認し、実装に含めるべき定数・ロジックを特定。

### Step 2: テスト作成（先）
CURRENT_PLANの「テスト項目」を先に作成。この時点ではテストはFAILでOK。

### Step 3: 実装

#### 実装ディレクトリガイド（07_INTEGRATION.md参照）

| 種別 | 実装先 |
|-----|--------|
| スマートコントラクト | `contracts/` |
| L3ノード | `l3-aegis/` |
| バックエンドAPI | `services/api/` |
| 共通UIコンポーネント | `packages/ui/` |
| 暗号ライブラリ | `packages/crypto/` |
| Web3ユーティリティ | `packages/web3/` |
| APIクライアント | `packages/api-client/` |
| Admin Dashboard | `apps/admin/` |
| End User App | `apps/user/` |
| Prover Portal | `apps/prover/` |

#### UI実装時の追加確認

1. **認証実装** (`05_AUTH_SECURITY.md` 参照)
   - SIWE: End User, Token Holder, Prover
   - Email+Password+2FA: Enterprise User, QS Staff
   - WebAuthn: 高セキュリティアカウント

2. **画面実装** (`04_SCREENS.md` 参照)
   - 優先度(P0/P1/P2)に従って実装
   - スマホ対応必須の画面を確認

3. **データ連携** (`06_DATA_DESIGN.md`, `07_INTEGRATION.md` 参照)
   - 既存APIを活用
   - 不足APIは先に実装
   - データ保存先の確認（L1/L3/DB/IPFS）

### Step 4: テスト実行
```bash
# Solidity
forge test

# TypeScript
npm test

# E2E
npm run test:e2e
```

### Step 5: SPEC_REVIEW.md 更新（該当時）
対応完了した指摘事項のチェックボックスを更新。

### Step 6: CURRENT_STATE.md 更新（必須）

「📦 最新実装レポート」セクションを更新：

```markdown
## 📦 最新実装レポート

| 項目 | 値 |
|------|-----|
| **対象Plan** | [タイトル] |
| **実装日時** | YYYY-MM-DD HH:MM JST |
| **ステータス** | ✅ 実装完了 |

### 対象タスク
| タスク | 状態 |
|-------|:----:|
| [タスク名] | ✅ |

### 作成ファイル
- `apps/xxx/`: [説明]
- `packages/xxx/`: [説明]

### 戦略決定文書準拠確認
| ドキュメント | 準拠 |
|------------|:----:|
| 04_SCREENS.md | ✅ |
| 05_AUTH_SECURITY.md | ✅ |
| 06_DATA_DESIGN.md | ✅ |
| 07_INTEGRATION.md | ✅ |

### テスト結果
| 項目 | 値 |
|------|-----|
| 新規テスト数 | +XX |
| 総テスト数 | XXX |
| 結果 | ✅ ALL PASS |
```

### Step 7: 完了報告

```markdown
## 実装完了報告

### 対象タスク
| タスク | 状態 |
|-------|:----:|
| [タスク名] | ✅ |

### 作成ファイル
- [ファイルパス]: [説明]

### テスト結果
- 新規テスト数: +XX
- 結果: ✅ ALL PASS

### 次のステップ
→ ④ セキュリティレビュー
```

---

## 7. テスト失敗時のトラブルシューティング

### 7.1 Git同期確認（最優先）
```bash
git fetch origin
git pull origin [branch]
forge clean && forge test -vvv
```

### 7.2 失敗テストの特定
```bash
forge test --match-test [テスト名] -vvvv
```

### 7.3 修正後の検証
```bash
forge test -vvv
slither . 2>&1 | head -50
git push origin [branch]
```

---

## 8. ガス最適化ガイドライン

### Pure Solidity SHA3-256の制約
- SHA3-256: ~1,000,000 gas/hash（プリコンパイルなし）
- 外部コントラクト呼び出し: ~2,600 gas オーバーヘッド

### 推奨サイズ
- computeTraceRoot: 最大16要素
- 32要素以上のMerkle操作は避ける
