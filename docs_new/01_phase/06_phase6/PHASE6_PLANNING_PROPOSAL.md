# Phase 6 Planning Proposal
## サービスリリース準備フェーズ

> **Version**: 1.0 (Draft)
> **Date**: 2026-01-13
> **Status**: Planning Proposal
> **Author**: AI Planning Agent

---

## 1. Executive Summary

### 1.1 Phase 6の目標

Phase 6は**サービスリリース直前の最終準備フェーズ**として、以下を達成する：

```
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 6: SERVICE RELEASE PREPARATION                               │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  【コア目標】                                                        │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │ 1. UI/UX Excellence     - ユーザーファーストの体験提供         │  │
│  │ 2. Full Integration     - UI↔API↔Backend↔DB↔Sepolia連携     │  │
│  │ 3. Documentation Ready  - 全ドキュメント整備完了              │  │
│  │ 4. Production Quality   - リリース可能な品質保証              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  【成果物】                                                          │
│  • Sepolia Testnet上で完全動作するDApp                              │
│  • 日英対応の完全なUI（8システム）                                   │
│  • 法務ドキュメント一式（利用規約、SLA、契約書）                     │
│  • ホワイトペーパー・技術文書                                       │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 参照仕様書（厳守事項）

| ドキュメント | パス | 用途 |
|-------------|------|------|
| **Core Principles** | `docs_new/00_core/CORE_PRINCIPLES.md` | 不変原則（憲法） |
| **Unified Spec** | `docs_new/00_core/specs/UNIFIED_SPEC.md` | 統合仕様 |
| **Sequences** | `docs_new/00_core/specs/SEQUENCES.md` | フロー定義 |
| **Design Guidelines** | `docs_new/01_phase/04_phase4/01_design/UI_DESIGN_GUIDELINES.md` | デザインシステム |
| **Design Review Agents** | `docs_new/01_phase/04_phase4/01_design/DESIGN_REVIEW_AGENTS.md` | ペルソナ定義 |

---

## 2. 開発アプローチ

### 2.1 最新AI/UXベストプラクティスの統合

Phase 6では、世界最高峰のAI/UX開発手法を統合する：

#### Anthropic Agent Skills (参考)
- **Progressive Disclosure**: 必要な情報を段階的に提供
- **Skill-based Architecture**: 機能をモジュラーなスキルとして設計
- **MCP (Model Context Protocol)**: 標準化されたコンテキスト管理

> Source: [Anthropic Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)

#### OpenAI AgentKit / Agents SDK (参考)
- **Single Agent First**: まずシンプルに、複雑化は必要になってから
- **Measure → Improve → Ship**: 計測→改善→出荷のループ
- **Iterative Deployment**: 小さく始めて段階的に拡張

> Source: [OpenAI Agent Platform](https://openai.com/agent-platform/), [Practical Guide to Building Agents](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf)

#### 2025 UI/UX Best Practices
- **User-Centered Design**: ユーザーの行動・目標に基づく設計
- **Accessibility First**: WCAG 2.1 AA/AAA準拠
- **Micro-interactions**: 適切なフィードバックアニメーション
- **Mobile-First**: レスポンシブ設計の徹底

> Source: [UI/UX Design Best Practices 2025](https://uidesignz.com/blogs/ui-ux-design-best-practices)

### 2.2 SEP v3フレームワークの活用

既存のSEP v3プロセスを継続：

```
27_task_extraction → 20_task_define → 21_impl_verify_loop →
22_three_agent → 24_sandbox_execute → 25_event_log → 05_pir
```

### 2.3 Phase 6特有のプロセス

Phase 6では以下を追加：

```
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 6 SPECIFIC PROCESSES                                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  【UI/UX強化プロセス】                                               │
│  1. Design PIR: ペルソナレビュー（CDO、Marketing、Legal、ユーザー）  │
│  2. A11y Check: アクセシビリティ検証                                │
│  3. i18n Audit: 日英切替完全性監査                                  │
│                                                                     │
│  【統合テストプロセス】                                              │
│  1. E2E Integration: Sepolia Testnet上での統合テスト                │
│  2. Real Data Flow: 実際のデータフローの検証                        │
│  3. Error Scenario: エラーシナリオのテスト                          │
│                                                                     │
│  【ドキュメントプロセス】                                            │
│  1. Legal Review: 法務チームによるレビュー                          │
│  2. Technical Accuracy: 技術的正確性の検証                          │
│  3. User Testing: ユーザーによる可読性テスト                        │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 3. タスク構造

### 3.1 ワークストリーム概要

```
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 6 WORKSTREAMS                                                │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  WS-1: UI/UX Excellence                                             │
│  ├── 1.1 デザインシステム実装                                        │
│  ├── 1.2 8システムUI実装・ブラッシュアップ                           │
│  ├── 1.3 日英国際化完全対応                                          │
│  ├── 1.4 アクセシビリティ対応                                        │
│  └── 1.5 ペルソナベースUXテスト                                      │
│                                                                     │
│  WS-2: Backend Integration                                          │
│  ├── 2.1 API実装（モック禁止、実DB接続）                             │
│  ├── 2.2 データベース設計・実装                                      │
│  ├── 2.3 Sepolia Testnet接続                                        │
│  ├── 2.4 L3 Aegis統合                                               │
│  └── 2.5 Chainlink VRF統合                                          │
│                                                                     │
│  WS-3: Documentation                                                │
│  ├── 3.1 ホワイトペーパー                                            │
│  ├── 3.2 技術仕様書                                                  │
│  ├── 3.3 利用規約・プライバシーポリシー                              │
│  ├── 3.4 データ規約・SLA                                             │
│  └── 3.5 契約書テンプレート                                          │
│                                                                     │
│  WS-4: Quality Assurance                                            │
│  ├── 4.1 E2E統合テスト                                               │
│  ├── 4.2 セキュリティ監査                                            │
│  ├── 4.3 パフォーマンステスト                                        │
│  └── 4.4 UAT（ユーザー受け入れテスト）                               │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 3.2 WS-1: UI/UX Excellence（詳細）

#### 3.2.1 8システム一覧

| # | システム | 対象ユーザー | Phase 4モック | 優先度 |
|---|---------|-------------|---------------|:------:|
| 1 | **Consumer App** | End User（田中さん） | 18画面完成 | P1 |
| 2 | **Token Hub** | Token Holder（鈴木さん） | 未着手 | P2 |
| 3 | **Governance** | Delegate（渡辺さん） | 5画面完成 | P2 |
| 4 | **Prover Portal** | Prover（山田さん） | 10画面完成 | P1 |
| 5 | **Observer** | 監視者 | 未着手 | P3 |
| 6 | **Explorer** | 一般ユーザー | 未着手 | P3 |
| 7 | **Enterprise Admin** | Service Provider（佐藤さん） | 25画面完成 | P1 |
| 8 | **QS Admin** | QS運営 | 12画面完成 | P2 |

#### 3.2.2 UI実装タスク（WS-1詳細）

```markdown
## WS-1.1: デザインシステム実装
- [ ] TASK-P6-001: CSS Variables設定（Premium Japan）
- [ ] TASK-P6-002: Tailwind Config設定
- [ ] TASK-P6-003: コンポーネントライブラリ構築
  - [ ] Button (Primary/Secondary/Outline)
  - [ ] Card (Standard/Interactive/Accent)
  - [ ] Input (Text/Amount/Select)
  - [ ] Badge (Status/Quantum)
  - [ ] Progress Bar (Timelock)
  - [ ] Tooltip (専門用語説明用)
- [ ] TASK-P6-004: 日の丸アニメーション実装
- [ ] TASK-P6-005: レスポンシブレイアウト基盤

## WS-1.2: Consumer App UI実装
- [ ] TASK-P6-010: Phase 4モック→React実装
- [ ] TASK-P6-011: Wallet接続統合
- [ ] TASK-P6-012: Lock/Unlock フロー実装
- [ ] TASK-P6-013: Transaction履歴実装
- [ ] TASK-P6-014: Settings/Security実装
- [ ] TASK-P6-015: Design PIR（ペルソナレビュー）

## WS-1.3: 国際化（i18n）完全対応
- [ ] TASK-P6-020: i18n基盤設定（next-intl）
- [ ] TASK-P6-021: 翻訳ファイル作成（日本語）
- [ ] TASK-P6-022: 翻訳ファイル作成（英語）
- [ ] TASK-P6-023: 言語切替コンポーネント
- [ ] TASK-P6-024: 日英切替漏れ監査（全画面）
- [ ] TASK-P6-025: 数値・日付フォーマット国際化

## WS-1.4: アクセシビリティ対応
- [ ] TASK-P6-030: WCAG 2.1 AA準拠チェック
- [ ] TASK-P6-031: キーボードナビゲーション
- [ ] TASK-P6-032: スクリーンリーダー対応
- [ ] TASK-P6-033: コントラスト比検証
- [ ] TASK-P6-034: Reduced Motion対応

## WS-1.5: UXテスト
- [ ] TASK-P6-040: ペルソナジャーニーテスト（田中さん）
- [ ] TASK-P6-041: ペルソナジャーニーテスト（山田さん）
- [ ] TASK-P6-042: ペルソナジャーニーテスト（佐藤さん）
- [ ] TASK-P6-043: ペルソナジャーニーテスト（鈴木さん）
- [ ] TASK-P6-044: ペルソナジャーニーテスト（渡辺さん）
```

### 3.3 WS-2: Backend Integration（詳細）

#### 3.3.1 アーキテクチャ概要

```
┌─────────────────────────────────────────────────────────────────────┐
│  PHASE 6 SYSTEM ARCHITECTURE                                        │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │   Next.js   │───>│  API Routes │───>│  Backend    │             │
│  │   Frontend  │<───│  (REST/WS)  │<───│  Services   │             │
│  └─────────────┘    └─────────────┘    └──────┬──────┘             │
│         │                                      │                    │
│         │                                      ▼                    │
│         │                              ┌─────────────┐             │
│         │                              │  PostgreSQL │             │
│         │                              │  Database   │             │
│         │                              └─────────────┘             │
│         │                                      │                    │
│         ▼                                      ▼                    │
│  ┌─────────────┐                       ┌─────────────┐             │
│  │   Wallet    │                       │  L3 Aegis   │             │
│  │ (MetaMask)  │                       │  (4 nodes)  │             │
│  └──────┬──────┘                       └──────┬──────┘             │
│         │                                      │                    │
│         └──────────────────┬───────────────────┘                   │
│                            ▼                                        │
│                     ┌─────────────┐                                │
│                     │  Sepolia    │                                │
│                     │  Testnet    │                                │
│                     │  (L1 Vault) │                                │
│                     └─────────────┘                                │
│                            │                                        │
│                            ▼                                        │
│                     ┌─────────────┐                                │
│                     │  Chainlink  │                                │
│                     │  VRF        │                                │
│                     └─────────────┘                                │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

#### 3.3.2 API設計原則

> ⚠️ **重要**: APIのモックデータ返却は禁止。必ず実DBに接続すること。

```markdown
## WS-2.1: API実装
- [ ] TASK-P6-050: API設計書作成（OpenAPI 3.0）
- [ ] TASK-P6-051: 認証・認可基盤（JWT + Wallet Signature）
- [ ] TASK-P6-052: Lock API実装
- [ ] TASK-P6-053: Unlock API実装
- [ ] TASK-P6-054: Transaction履歴API
- [ ] TASK-P6-055: Prover Status API
- [ ] TASK-P6-056: Governance API
- [ ] TASK-P6-057: WebSocket実装（リアルタイム更新）

## WS-2.2: Database設計・実装
- [ ] TASK-P6-060: ERD設計
- [ ] TASK-P6-061: PostgreSQL スキーマ定義
- [ ] TASK-P6-062: Prisma ORM設定
- [ ] TASK-P6-063: マイグレーション設定
- [ ] TASK-P6-064: インデックス最適化
- [ ] TASK-P6-065: バックアップ戦略

## WS-2.3: Sepolia Testnet接続
- [ ] TASK-P6-070: L1 Vault コントラクトデプロイ
- [ ] TASK-P6-071: ethers.js統合
- [ ] TASK-P6-072: Transaction監視
- [ ] TASK-P6-073: Event Listener実装
- [ ] TASK-P6-074: Gas推定・表示

## WS-2.4: L3 Aegis統合
- [ ] TASK-P6-080: L3 RPC接続
- [ ] TASK-P6-081: BFT合意状態取得
- [ ] TASK-P6-082: SMT Proof検証
- [ ] TASK-P6-083: Lock/Unlock状態同期

## WS-2.5: Chainlink VRF統合
- [ ] TASK-P6-090: VRF Coordinator接続
- [ ] TASK-P6-091: Prover選出ロジック
- [ ] TASK-P6-092: VRF結果検証
```

### 3.4 WS-3: Documentation（詳細）

#### 3.4.1 ドキュメント一覧

```markdown
## WS-3.1: ホワイトペーパー
- [ ] TASK-P6-100: ホワイトペーパー構成策定
- [ ] TASK-P6-101: 技術概要セクション
- [ ] TASK-P6-102: 経済モデルセクション
- [ ] TASK-P6-103: ガバナンスセクション
- [ ] TASK-P6-104: ロードマップセクション
- [ ] TASK-P6-105: 日英両版作成
- [ ] TASK-P6-106: PDF/Web版作成

## WS-3.2: 技術仕様書
- [ ] TASK-P6-110: API仕様書（OpenAPI）
- [ ] TASK-P6-111: コントラクト仕様書
- [ ] TASK-P6-112: データベース仕様書
- [ ] TASK-P6-113: セキュリティ仕様書

## WS-3.3: 利用規約・プライバシーポリシー
- [ ] TASK-P6-120: 利用規約ドラフト作成
- [ ] TASK-P6-121: プライバシーポリシードラフト
- [ ] TASK-P6-122: Cookie Policy
- [ ] TASK-P6-123: 法務レビュー依頼
- [ ] TASK-P6-124: 日英両版最終化

## WS-3.4: SLA・データ規約
- [ ] TASK-P6-130: SLA定義（可用性99.5%等）
- [ ] TASK-P6-131: データ保持ポリシー
- [ ] TASK-P6-132: インシデント対応手順
- [ ] TASK-P6-133: サポートレベル定義

## WS-3.5: 契約書テンプレート
- [ ] TASK-P6-140: Prover契約書テンプレート
- [ ] TASK-P6-141: Enterprise契約書テンプレート
- [ ] TASK-P6-142: パートナー契約書テンプレート
- [ ] TASK-P6-143: NDA テンプレート
```

### 3.5 WS-4: Quality Assurance（詳細）

```markdown
## WS-4.1: E2E統合テスト
- [ ] TASK-P6-150: E2Eテスト基盤構築（Playwright）
- [ ] TASK-P6-151: Consumer App E2E
- [ ] TASK-P6-152: Prover Portal E2E
- [ ] TASK-P6-153: Enterprise Admin E2E
- [ ] TASK-P6-154: Governance E2E
- [ ] TASK-P6-155: クロスシステムE2E

## WS-4.2: セキュリティ監査
- [ ] TASK-P6-160: スマートコントラクト監査準備
- [ ] TASK-P6-161: フロントエンドセキュリティ監査
- [ ] TASK-P6-162: API セキュリティテスト
- [ ] TASK-P6-163: ペネトレーションテスト

## WS-4.3: パフォーマンステスト
- [ ] TASK-P6-170: 負荷テスト（k6）
- [ ] TASK-P6-171: Lighthouse監査
- [ ] TASK-P6-172: Core Web Vitals最適化

## WS-4.4: UAT
- [ ] TASK-P6-180: UATシナリオ作成
- [ ] TASK-P6-181: 内部UATセッション
- [ ] TASK-P6-182: フィードバック収集・反映
```

---

## 4. Phase 6専用プロンプト提案

### 4.1 新規プロンプト一覧

既存のSEP v3プロンプトに加え、Phase 6用に以下を提案：

| # | ファイル | 目的 |
|---|----------|------|
| 30 | `30_ui_impl.md` | UIコンポーネント実装 |
| 31 | `31_design_pir.md` | デザインPIR（ペルソナレビュー） |
| 32 | `32_i18n_audit.md` | 国際化完全性監査 |
| 33 | `33_a11y_check.md` | アクセシビリティ検証 |
| 34 | `34_api_impl.md` | API実装（モック禁止） |
| 35 | `35_db_design.md` | データベース設計 |
| 36 | `36_doc_write.md` | ドキュメント作成 |
| 37 | `37_e2e_test.md` | E2E統合テスト |

### 4.2 プロンプト概要

#### 30_ui_impl.md（UIコンポーネント実装）

```markdown
## 目的
Phase 4モックからReactコンポーネントを実装

## 入力
- Phase 4モックHTML
- UI_DESIGN_GUIDELINES.md
- 対象システム仕様

## 出力
- Reactコンポーネント
- Storybook ストーリー
- ユニットテスト

## 検証
- Design System準拠
- レスポンシブ対応
- アクセシビリティ
```

#### 31_design_pir.md（デザインPIR）

```markdown
## 目的
5ペルソナ + 3専門家によるデザインレビュー

## 参加Agent
- CDO（佐々木さん）: ブランド一貫性
- Marketing（田村さん）: コンバージョン
- Legal（西村さん）: 規制・免責
- 田中さん: End User視点
- 山田さん: Prover視点
- 佐藤さん: Service Provider視点
- 鈴木さん: Token Holder視点
- 渡辺さん: Delegate視点

## 出力
- PIRレポート
- 指摘事項一覧
- PASS / CONDITIONAL / FAIL判定
```

#### 32_i18n_audit.md（国際化監査）

```markdown
## 目的
日英切替の完全性を保証

## チェック項目
- [ ] 全テキストが翻訳キー経由
- [ ] ハードコード文字列なし
- [ ] 日付・数値フォーマット
- [ ] 言語切替動作確認
- [ ] 翻訳品質チェック

## 出力
- 監査レポート
- 漏れ一覧
- 修正タスク
```

---

## 5. 依存関係と実行順序

### 5.1 依存関係グラフ

```
┌─────────────────────────────────────────────────────────────────────┐
│  DEPENDENCY GRAPH                                                   │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  Phase 1: Foundation                                                │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │ WS-1.1      │    │ WS-2.2      │    │ WS-2.3      │             │
│  │ Design      │    │ Database    │    │ Sepolia     │             │
│  │ System      │    │ Design      │    │ Connection  │             │
│  └──────┬──────┘    └──────┬──────┘    └──────┬──────┘             │
│         │                  │                  │                    │
│         ▼                  ▼                  ▼                    │
│  Phase 2: Core Implementation                                       │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │ WS-1.2      │───>│ WS-2.1      │───>│ WS-2.4/2.5  │             │
│  │ UI Impl     │    │ API Impl    │    │ L3/VRF      │             │
│  └──────┬──────┘    └─────────────┘    └─────────────┘             │
│         │                                                          │
│         ▼                                                          │
│  Phase 3: Enhancement                                               │
│  ┌─────────────┐    ┌─────────────┐                                │
│  │ WS-1.3      │    │ WS-1.4      │                                │
│  │ i18n        │    │ A11y        │                                │
│  └──────┬──────┘    └──────┬──────┘                                │
│         │                  │                                       │
│         └────────┬─────────┘                                       │
│                  ▼                                                 │
│  Phase 4: Quality & Docs                                           │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐             │
│  │ WS-3.x      │    │ WS-4.x      │    │ WS-1.5      │             │
│  │ Docs        │    │ Testing     │    │ UX Test     │             │
│  └─────────────┘    └─────────────┘    └─────────────┘             │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### 5.2 クリティカルパス

1. **Design System** → **Consumer App UI** → **i18n** → **Design PIR**
2. **Database Design** → **API Implementation** → **E2E Tests**
3. **Sepolia Connection** → **L3 Integration** → **VRF Integration**

---

## 6. 品質ゲート

### 6.1 各フェーズの完了条件

| フェーズ | 完了条件 |
|---------|---------|
| **Phase 1** | Design System実装完了、DB/Sepolia接続確認 |
| **Phase 2** | Consumer App動作確認、API E2E Pass |
| **Phase 3** | i18n 100%カバレッジ、A11y監査Pass |
| **Phase 4** | 全ドキュメント完成、UAT完了 |

### 6.2 品質基準

| カテゴリ | 基準 |
|---------|------|
| **テストカバレッジ** | ≥ 80% |
| **E2E Pass率** | 100% |
| **Lighthouse Score** | ≥ 90 (Performance, Accessibility) |
| **WCAG準拠** | AA Level |
| **i18n カバレッジ** | 100%（漏れゼロ） |
| **セキュリティ監査** | High/Critical 0件 |

---

## 7. リスクと対策

### 7.1 識別済みリスク

| # | リスク | 影響度 | 発生確率 | 対策 |
|---|--------|:------:|:--------:|------|
| R1 | データベースなしで開発開始 | 高 | 中 | 最初にDB設計を完了 |
| R2 | i18n漏れによる後戻り | 中 | 高 | 32_i18n_audit定期実行 |
| R3 | ペルソナ要件の見落とし | 中 | 中 | Design PIR必須化 |
| R4 | Sepolia接続問題 | 高 | 低 | 早期接続テスト |
| R5 | 法務レビュー遅延 | 中 | 中 | 早期ドラフト共有 |

---

## 8. 提案：Phase 6専用プロンプト作成

以下のプロンプトを新規作成することを提案：

### 8.1 即時作成推奨

| 優先度 | プロンプト | 理由 |
|:------:|-----------|------|
| P1 | `30_ui_impl.md` | UI実装の標準化 |
| P1 | `31_design_pir.md` | ペルソナレビュー標準化 |
| P1 | `32_i18n_audit.md` | i18n漏れ防止 |
| P2 | `34_api_impl.md` | モック禁止の徹底 |
| P2 | `36_doc_write.md` | ドキュメント品質確保 |

### 8.2 プロンプト作成フロー

```
1. 本計画承認後
2. プロンプトドラフト作成
3. CEOレビュー
4. prompts/ディレクトリに配置
5. Phase 6開発開始
```

---

## 9. 次のアクション

### 9.1 承認後の即時アクション

1. **Phase 6ディレクトリ構造作成**
2. **プロンプト30-37の作成**
3. **TASK-P6-001〜005（Design System）の開始**
4. **DB設計の着手**

### 9.2 承認待ち事項

- [ ] 本計画の承認
- [ ] プロンプト新規作成の承認
- [ ] タスク優先順位の最終確認

---

## 10. 参考リソース

### 10.1 外部リソース

- [Anthropic Agent Skills](https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills)
- [Anthropic Claude Agent SDK](https://www.anthropic.com/engineering/building-agents-with-the-claude-agent-sdk)
- [OpenAI Agent Platform](https://openai.com/agent-platform/)
- [OpenAI Practical Guide to Building Agents](https://cdn.openai.com/business-guides-and-resources/a-practical-guide-to-building-agents.pdf)
- [UI/UX Design Best Practices 2025](https://uidesignz.com/blogs/ui-ux-design-best-practices)
- [MIT Morningside Academy for Design](https://design.mit.edu/)

### 10.2 内部リソース

- `docs_new/00_core/CORE_PRINCIPLES.md`
- `docs_new/00_core/specs/UNIFIED_SPEC.md`
- `docs_new/00_core/specs/SEQUENCES.md`
- `docs_new/01_phase/04_phase4/01_design/UI_DESIGN_GUIDELINES.md`
- `docs_new/01_phase/04_phase4/01_design/DESIGN_REVIEW_AGENTS.md`
- `docs_new/02_agents_prompt/02_prompts/00_SEP_v3_INDEX.md`

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-13 | 初版作成（Planning Proposal） |

---

**END OF DOCUMENT**
