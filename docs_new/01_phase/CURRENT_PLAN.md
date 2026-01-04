# Current Plan

> **Generated**: 2026-01-05 21:00 JST
> **Phase**: Phase 4 - UI/UX, Audit & Launch
> **Week**: W4-5

---

## 対象チェックリスト
`docs_new/01_phase/04_phase4/phase4.md`

---

## 仕様書参照

### 対象Sequence
| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| #1 Lock | User App | SEQUENCES §1 - Lock Flow |
| #2 Unlock (Normal) | User App | SEQUENCES §2 - Time Lock 24h |
| #3 Unlock (Emergency) | User App | SEQUENCES §3 - Bond + 7d |
| #5 Prover Registration | Admin Dashboard | SEQUENCES §5 - Registration |
| #8 Emergency Pause | Admin Dashboard | SEQUENCES §8 - Pause/Recovery |

### セキュリティ要件
| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| 24h Time Lock (Normal) | SEQ#2 | UnlockStatusコンポーネントで表示 |
| 7d Time Lock (Emergency) | SEQ#3 | Emergency Unlock画面で警告表示 |
| Emergency Bond計算 | SEQ#3 | MAX(0.5 ETH, amount × 5%) 表示 |
| Quadratic Slashing表示 | SEQ#4 | Prover Dashboard N² × 10% |
| 72h Emergency Timeout | SEQ#3 | Admin監視画面でアラート |
| 72h Pause上限 | SEQ#8 | Emergency Pause画面で残時間表示 |

---

## Phase 4準拠確認

> 参照: `docs_new/01_phase/04_phase4/PHASE4_PLAN.md`

- [x] 週次スケジュール: Week 4-5 対象タスク
- [x] タスクID: UI-001 ~ UI-007
- [x] 優先度: P0/P1/P2
- [x] 依存関係: Week 1-3 全完了 ✅
- [x] ペルソナスコープ: **Admin + Prover**

---

## 前回レビュー課題（該当時のみ）

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| - | - | なし（Week 3 PIR-P4-003 PASS） | - |

---

## 今回のスコープ

### Track C1: Prover Management Dashboard (Week 4-5)

| タスクID | 内容 | 優先度 | 状態 |
|---------|------|:------:|:----:|
| UI-001 | Prover registration interface | 🔴 P0 | ⬜ |
| UI-002 | Prover status monitoring | 🔴 P0 | ⬜ |
| UI-003 | Prover reward tracking | 🟠 P1 | ⬜ |
| UI-004 | Prover staking management | 🔴 P0 | ⬜ |

### Track C2: Service Provider Dashboard (Week 4-5)

| タスクID | 内容 | 優先度 | 状態 |
|---------|------|:------:|:----:|
| UI-005 | Provider registration flow | 🔴 P0 | ⬜ |
| UI-006 | Bridge service configuration | 🔴 P0 | ⬜ |
| UI-007 | Analytics dashboard | 🟡 P2 | ⬜ |

### Admin共通機能

| 機能 | 参照仕様 | 優先度 |
|------|---------|:------:|
| システム概要ダッシュボード | UI_UX_FUNCTIONAL_REQUIREMENTS §2.1 | P0 |
| L3ノード状態監視 | UI_UX_FUNCTIONAL_REQUIREMENTS §2.1 | P0 |
| Emergency Pause機能 | SEQ#8 + UI_UX_FUNCTIONAL_REQUIREMENTS §2.1 | P0 |
| 監査ログ表示 | UI_UX_FUNCTIONAL_REQUIREMENTS §2.1 | P1 |
| Edition切替UI | EDITION_SWITCH_SPEC.md | P1 |

---

## 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| Phase 4計画 | `PHASE4_PLAN.md` | Week 4-5, §5 |
| UI/UX要件 | `UI_UX_FUNCTIONAL_REQUIREMENTS_JP.md` | §2.1 Admin, §2.3 Prover |
| 会議決定事項 | `AGENT_MEETING_MINUTES_20260104.md` | §5.2 条件付き承認 |
| Prover登録フロー | `PROVER_REGISTRATION_FLOW.md` | 全体 |
| Edition切替仕様 | `EDITION_SWITCH_SPEC.md` | 全体 |
| Sequence仕様 | `SEQUENCES.md` | #5, #6, #8 |

---

## 成果物

| ファイル | 説明 | タスクID |
|---------|------|---------|
| `apps/admin-dashboard/` | Admin Dashboard React App | UI-001~007 |
| `apps/admin-dashboard/src/pages/Dashboard.tsx` | システム概要 | UI-001 |
| `apps/admin-dashboard/src/pages/Provers.tsx` | Prover管理 | UI-001~004 |
| `apps/admin-dashboard/src/pages/Providers.tsx` | Provider管理 | UI-005~006 |
| `apps/admin-dashboard/src/pages/Analytics.tsx` | 分析ダッシュボード | UI-007 |
| `apps/admin-dashboard/src/pages/Emergency.tsx` | Emergency Pause | (Admin共通) |
| `apps/admin-dashboard/src/pages/Edition.tsx` | Edition切替 | (Admin共通) |
| `apps/admin-dashboard/src/components/` | 共通コンポーネント | - |

---

## 技術スタック

| コンポーネント | 技術 | 理由 |
|---------------|------|------|
| フレームワーク | React 18 + TypeScript | SDK React Hooksとの統合 |
| スタイリング | Tailwind CSS | 高速開発、Week 3 SDKと統一 |
| 状態管理 | TanStack Query (React Query) | API状態管理、キャッシュ |
| ルーティング | React Router v6 | SPA |
| フォーム | React Hook Form + Zod | バリデーション |
| API通信 | SDK (@quantum-shield/sdk) | Week 3成果物活用 |
| Wallet接続 | wagmi + viem | Week 3成果物活用 |
| テスト | Vitest + Testing Library | Jest互換 |

---

## 実行順序

### Day 1-2: プロジェクトセットアップ + ダッシュボード
1. `apps/admin-dashboard/` プロジェクト作成（Vite + React + TypeScript）
2. 共通レイアウト実装（Sidebar, Header, Navigation）
3. Dashboard概要画面実装（TVL, ノード状態, アラート）

### Day 3-4: Prover管理画面
4. **UI-001**: Prover registration interface
   - 登録フォーム（HSMアップロード、マルチシグ設定）
   - 登録状態表示（pending/active/suspended）
5. **UI-002**: Prover status monitoring
   - リアルタイムステータス表示
   - HSM接続状態
   - 応答時間メトリクス

### Day 5-6: Prover詳細 + Staking
6. **UI-003**: Prover reward tracking
   - 報酬履歴
   - 報酬引出UI
7. **UI-004**: Prover staking management
   - Stake残高表示
   - Stake追加/引出（Unbonding 7日表示）
   - Slashingリスク表示（Quadratic N²×10%）

### Day 7-8: Provider + Bridge設定
8. **UI-005**: Provider registration flow
   - Enterprise/Decentralized選択
   - 契約情報入力
9. **UI-006**: Bridge service configuration
   - Event Bridge設定
   - HSM連携設定
   - Multi-Relayer構成表示

### Day 9-10: Analytics + Emergency
10. **UI-007**: Analytics dashboard
    - TVL推移グラフ
    - Lock/Unlock統計
    - Proverパフォーマンス
11. Emergency Pause機能
    - 緊急停止ボタン（5/9 Security Council表示）
    - Pause状態表示（72h残時間）
    - 復旧手順ガイド
12. Edition切替UI
    - Enterprise/Decentralized切替
    - CP準拠確認表示

### Day 11-12: テスト + 統合
13. コンポーネントテスト作成
14. E2E統合テスト（SDK → API → 画面）
15. ビルド・デプロイ準備

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - Dilithium/SPHINCS+署名表示のみ、量子脆弱アルゴリズムなし
- [x] CP-2: Self-Custody - 秘密鍵はクライアント管理、サーバー保存なし
- [x] CP-3: Time Lock存在 - 24h/7d Time Lock表示、0への設定不可
- [x] CP-4: Slashing存在 - Quadratic Slashing (N²×10%) 表示
- [x] CP-5: 透明性 - 全操作は監査ログに記録、オンチェーン検証可能

---

## リスク・懸念事項

| # | リスク | 重要度 | 緩和策 |
|---|--------|:------:|--------|
| 1 | API認証未実装 | 🟠 Medium | Week 4で暫定Basic Auth、本番はJWT |
| 2 | HSM連携UI（モック） | 🟡 Low | HSM_INTEGRATION_SPEC.md参照、本番連携はPhase 4.5 |
| 3 | Security Council UI | 🟡 Low | Phase 3 Council投票機能を再利用 |

---

## 推奨事項（PIR-P4-002/003より）

| # | 推奨 | 対応方針 |
|---|------|---------|
| 1 | API認証 (JWT/OAuth) | Admin Dashboardと同時実装検討 |
| 2 | SMT Proof本実装 | 状態表示のみ、証明生成はバックエンド |
| 3 | E2Eテスト (SDK→API→L1/L3) | Week 4-5最終日に実施 |

---

## 次のアクション

| # | アクション | 担当 | 期限 |
|---|-----------|------|------|
| 1 | 02_spec.md実行（SPEC_REVIEW.md作成） | Engineer | 計画後 |
| 2 | 03_impl.md実行（実装） | Engineer | 仕様後 |
| 3 | 04_review.md実行（セキュリティレビュー） | Red Team | 実装後 |
| 4 | 05_pir.md実行（PIR-P4-004） | 全体 | レビュー後 |

---

**END OF CURRENT PLAN**
