# Current Plan

> **Generated**: 2026-01-06 12:00 JST
> **Phase**: Phase 4 - UI/UX, Audit & Launch
> **Week**: W5-6 (End User App)

---

## 対象チェックリスト
`docs_new/01_phase/04_phase4/phase4.md`

---

## 仕様書参照

### 対象Sequence
| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| #1 Lock | Consumer App | SEQUENCES §1 - Lock Flow |
| #2 Unlock (Normal) | Consumer App | SEQUENCES §2 - Time Lock 24h |
| #3 Unlock (Emergency) | Consumer App | SEQUENCES §3 - Bond + 7d |
| #3' Resync | Consumer App | SEQUENCES §3' - 同期復旧 |

### セキュリティ要件
| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| Dilithium-III署名 | CORE_PRINCIPLES §必須アルゴリズム | ブラウザ内WASM生成、秘密鍵はローカルのみ |
| 24h Time Lock (Normal) | SEQ#2 | Unlock画面でカウントダウン表示 |
| 7d Time Lock (Emergency) | SEQ#3 | Emergency画面で警告表示 |
| Emergency Bond計算 | SEQ#3 | MAX(0.5 ETH, amount × 5%) 表示・確認 |
| 72h Emergency Timeout | SEQ#3 | Prover応答待ち画面でタイムアウト表示 |
| SMT Proof検証 | SEQ#1, #2 | Lock/Unlock確認画面でProof表示 |

---

## 戦略決定文書参照

> パス: `docs_new/01_phase/04_phase4/00_戦略決定文書/`

### 対象システム・ペルソナ
| 項目 | 値 |
|------|-----|
| 対象システム | Consumer App |
| 対象ペルソナ | End User (田中さん, 32歳) |
| 対象画面数 | 25画面 |
| 認証方式 | Wallet (SIWE) |
| 📱対応 | ✅ フル対応必須 |

### 参照ドキュメント
| ドキュメント | 参照セクション |
|------------|---------------|
| 01_ARCHITECTURE.md | §1.1 Consumer App |
| 02_PERSONAS.md | §1 End User (田中さん) |
| 03_USER_JOURNEYS.md | Part 1 End User Journey |
| 04_SCREENS.md | §2.1 Consumer App (25画面) |
| 05_AUTH_SECURITY.md | §2.1 Wallet (SIWE) |
| 06_DATA_DESIGN.md | §1 End User Data |
| 07_INTEGRATION.md | Part 1 Consumer App API |

### ユーザー添付資料
| 資料 | パス |
|------|------|
| UI統合計画 | `STEP_E_UI_INTEGRATION_PLAN.md` (プロジェクト添付) |

---

## 前回レビュー課題（該当時のみ）

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| - | - | なし（PIR-P4-004 レビュー待ち） | - |

---

## 今回のスコープ

### Consumer App 画面実装（25画面）

#### Public Pages（4画面）
| 画面ID | 画面名 | 優先度 | 状態 |
|--------|--------|:------:|:----:|
| CONSUMER-001 | Landing Page | 🔴 P0 | ⬜ |
| CONSUMER-002 | How It Works | 🟠 P1 | ⬜ |
| CONSUMER-003 | Security Explainer | 🟠 P1 | ⬜ |
| CONSUMER-004 | FAQ | 🟠 P1 | ⬜ |

#### Onboarding（4画面）
| 画面ID | 画面名 | 優先度 | 状態 |
|--------|--------|:------:|:----:|
| CONSUMER-005 | Wallet Connect | 🔴 P0 | ⬜ |
| CONSUMER-006 | Key Generation (Dilithium) | 🔴 P0 | ⬜ |
| CONSUMER-007 | Backup Instructions | 🔴 P0 | ⬜ |
| CONSUMER-008 | Ready | 🔴 P0 | ⬜ |

#### Main App - Dashboard（1画面）
| 画面ID | 画面名 | 優先度 | 状態 |
|--------|--------|:------:|:----:|
| CONSUMER-009 | Dashboard | 🔴 P0 | ⬜ |

#### Main App - Lock Flow（4画面）
| 画面ID | 画面名 | 優先度 | 状態 |
|--------|--------|:------:|:----:|
| CONSUMER-010 | Lock Input | 🔴 P0 | ⬜ |
| CONSUMER-011 | Lock Confirmation | 🔴 P0 | ⬜ |
| CONSUMER-012 | Lock Processing | 🔴 P0 | ⬜ |
| CONSUMER-013 | Lock Success | 🔴 P0 | ⬜ |

#### Main App - Unlock Flow Normal（7画面）
| 画面ID | 画面名 | 優先度 | 状態 |
|--------|--------|:------:|:----:|
| CONSUMER-014 | Unlock Select | 🔴 P0 | ⬜ |
| CONSUMER-015 | Unlock Method | 🔴 P0 | ⬜ |
| CONSUMER-016 | Dilithium Sign | 🔴 P0 | ⬜ |
| CONSUMER-017 | Prover Waiting | 🔴 P0 | ⬜ |
| CONSUMER-018 | Time Lock Countdown | 🔴 P0 | ⬜ |
| CONSUMER-019 | Unlock Ready | 🔴 P0 | ⬜ |
| CONSUMER-020 | Unlock Complete | 🔴 P0 | ⬜ |

#### Main App - Unlock Flow Emergency（1画面）
| 画面ID | 画面名 | 優先度 | 状態 |
|--------|--------|:------:|:----:|
| CONSUMER-021 | Emergency Bond | 🔴 P0 | ⬜ |

#### Main App - その他（3画面）
| 画面ID | 画面名 | 優先度 | 状態 |
|--------|--------|:------:|:----:|
| CONSUMER-022 | History | 🟠 P1 | ⬜ |
| CONSUMER-023 | Settings | 🟠 P1 | ⬜ |
| CONSUMER-024 | Key Management | 🔴 P0 | ⬜ |

#### Exit（1画面）
| 画面ID | 画面名 | 優先度 | 状態 |
|--------|--------|:------:|:----:|
| CONSUMER-025 | Account Disconnect | 🟠 P1 | ⬜ |

---

## 成果物

| ファイル | 説明 | 画面ID |
|---------|------|--------|
| `apps/consumer/` | Consumer App Next.js 14 App | 全画面 |
| `apps/consumer/src/app/(public)/` | Public Pages | CONSUMER-001~004 |
| `apps/consumer/src/app/(auth)/onboarding/` | Onboarding Flow | CONSUMER-005~008 |
| `apps/consumer/src/app/(app)/dashboard/` | Dashboard | CONSUMER-009 |
| `apps/consumer/src/app/(app)/lock/` | Lock Flow | CONSUMER-010~013 |
| `apps/consumer/src/app/(app)/unlock/` | Unlock Flow | CONSUMER-014~021 |
| `apps/consumer/src/app/(app)/history/` | History | CONSUMER-022 |
| `apps/consumer/src/app/(app)/settings/` | Settings & Keys | CONSUMER-023~024 |
| `apps/consumer/src/app/(app)/exit/` | Exit Flow | CONSUMER-025 |
| `apps/consumer/src/components/` | 共通コンポーネント | - |
| `apps/consumer/src/hooks/` | React Hooks | - |
| `apps/consumer/tests/` | テスト | - |

---

## 技術スタック

| コンポーネント | 技術 | 理由 |
|---------------|------|------|
| フレームワーク | Next.js 14 (App Router) | モバイル対応、SSR/SSG |
| スタイリング | Tailwind CSS | 高速開発、レスポンシブ |
| 状態管理 | TanStack Query + Zustand | API状態 + ローカル状態 |
| 認証 | SIWE (Sign-In with Ethereum) | Wallet接続 |
| Wallet接続 | wagmi v2 + viem | Week 3 SDK活用 |
| Dilithium | @quantum-shield/sdk (WASM) | Week 3成果物活用 |
| フォーム | React Hook Form + Zod | バリデーション |
| アニメーション | Framer Motion | UXエンハンス |
| テスト | Vitest + Testing Library + Playwright | Unit + E2E |

---

## 実行順序

### Day 1-2: プロジェクトセットアップ + 認証基盤
1. `apps/consumer/` プロジェクト作成（Next.js 14 + TypeScript）
2. Tailwind CSS + 共通レイアウト実装
3. SIWE認証フロー実装（Wallet Connect）
4. Dilithium鍵生成ページ実装（WASM連携）

### Day 3-4: Onboarding + Dashboard
5. **CONSUMER-005~008**: Onboarding Flow
   - Wallet Connect画面
   - Dilithium鍵生成（ブラウザ内、<500ms）
   - 鍵バックアップ指示（ダウンロード/QRコード）
   - 準備完了画面
6. **CONSUMER-009**: Dashboard
   - 総資産表示
   - Lock中資産一覧
   - 進行中Unlock一覧
   - クイックアクション

### Day 5-6: Lock Flow
7. **CONSUMER-010~013**: Lock Flow
   - 資産選択・金額入力
   - Lock確認画面（Gas見積もり）
   - Lock処理中（Dilithium署名→L3→L1）
   - Lock成功（lock_id, SR_0表示）

### Day 7-8: Unlock Flow (Normal)
8. **CONSUMER-014~020**: Unlock Flow (Normal)
   - 対象Lock選択
   - 通常/緊急選択
   - Dilithium署名画面
   - Prover署名待ち（VRF選出表示）
   - 24h Time Lock カウントダウン
   - Claim可能通知
   - Unlock完了

### Day 9-10: Unlock Flow (Emergency) + その他
9. **CONSUMER-021**: Emergency Bond
   - Bond計算表示: MAX(0.5 ETH, amount × 5%)
   - 7日Time Lock警告
   - Bond支払い確認
10. **CONSUMER-022~025**: History, Settings, Key Management, Exit
    - 履歴一覧（フィルタ・検索）
    - 設定画面
    - 鍵管理（バックアップ再ダウンロード）
    - アカウント切断

### Day 11-12: Public Pages + テスト + 統合
11. **CONSUMER-001~004**: Public Pages
    - Landing Page（ヒーロー、CTA）
    - How It Works
    - Security Explainer
    - FAQ
12. コンポーネントテスト作成
13. E2E統合テスト（SDK → API → 画面）
14. モバイルレスポンシブ確認
15. ビルド・デプロイ準備

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - Dilithium-III/SPHINCS+署名、量子脆弱アルゴリズム不使用
- [x] CP-2: Self-Custody - Dilithium秘密鍵はブラウザ内のみ、サーバー送信なし
- [x] CP-3: Time Lock存在 - 24h/7d Time Lock表示、0への設定不可
- [x] CP-4: Slashing存在 - Emergency Bond表示（間接的にSlashing関連）
- [x] CP-5: 透明性 - SMT Proof表示、オンチェーン検証リンク提供

---

## データフロー（Self-Custody準拠）

```
┌─────────────────────────────────────────────────────────────────┐
│                     Consumer App Data Flow                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  【Dilithium鍵生成】                                            │
│  ┌────────────┐                                                 │
│  │ ブラウザ   │ ← 秘密鍵はここのみ（localStorage暗号化）       │
│  │ WASM      │                                                 │
│  │ Dilithium │                                                 │
│  └─────┬─────┘                                                 │
│        │                                                        │
│        ▼ 公開鍵のみ送信                                        │
│  ┌────────────┐     ┌────────────┐     ┌────────────┐         │
│  │ API        │────►│ L3 Aegis   │────►│ L1 Vault   │         │
│  │ Backend    │     │ 公開鍵登録 │     │ 公開鍵記録 │         │
│  └────────────┘     └────────────┘     └────────────┘         │
│                                                                 │
│  【署名フロー】                                                 │
│  ┌────────────┐                                                 │
│  │ ブラウザ   │ ← 署名はブラウザ内で実行                       │
│  │ Dilithium  │                                                │
│  │ sign()     │                                                │
│  └─────┬─────┘                                                 │
│        │                                                        │
│        ▼ 署名済みデータのみ送信                                │
│  ┌────────────┐                                                 │
│  │ API        │                                                 │
│  │ Backend    │                                                 │
│  └────────────┘                                                 │
│                                                                 │
│  ⚠️ 秘密鍵がサーバーに渡ることは絶対にない                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## リスク・懸念事項

| # | リスク | 重要度 | 緩和策 |
|---|--------|:------:|--------|
| 1 | Dilithium WASM パフォーマンス | 🟠 Medium | Week 3で<500ms達成済み、モバイルでの追加検証 |
| 2 | 鍵バックアップUX | 🟠 Medium | 複数方式提供（ダウンロード/QR/クラウド暗号化） |
| 3 | モバイルWallet接続 | 🟠 Medium | WalletConnect v2対応、主要Wallet動作確認 |
| 4 | 72h Prover Timeout UX | 🟡 Low | 明確な進捗表示、Emergency Path誘導 |

---

## 推奨事項（PIR-P4-002/003より）

| # | 推奨 | 対応方針 |
|---|------|---------|
| 1 | E2Eテスト (SDK→API→L1/L3) | Week 5-6最終日に Playwright実施 |
| 2 | WASM本番性能測定 | モバイル実機テスト実施 |
| 3 | API認証 (JWT/OAuth) | Consumer Appと同時検討（Week 5-6） |

---

## 次のアクション

| # | アクション | 担当 | 期限 |
|---|-----------|------|------|
| 0 | **PIR-P4-004 完了待ち**（Week 4-5 Admin Dashboard） | 全体 | 現在 |
| 1 | 02_spec.md実行（SPEC_REVIEW.md作成） | Engineer | 計画後 |
| 2 | 03_impl.md実行（実装） | Engineer | 仕様後 |
| 3 | 04_review.md実行（セキュリティレビュー） | Red Team | 実装後 |
| 4 | 05_pir.md実行（PIR-P4-005） | 全体 | レビュー後 |

---

**END OF CURRENT PLAN**
