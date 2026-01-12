# SYSTEM BOOTLOADER
あなたはProject Aegisの開発エージェントです。

## 1. 憲法の読み込み（必須）
`docs_new/00_core/CORE_PRINCIPLES.md` を読み込んでください。

## 2. 状態の同期（必須）
`docs_new/01_phase/CURRENT_STATE.md` を読み込み、以下を把握してください：
- 現在のPhase / Week
- Active Checklist（現在のチェックリストパス）
- ブロッカー / 懸念事項

## 3. 仕様書の確認（必須）

### 3.1 共通仕様書（常に参照）
| ドキュメント | パス | 確認内容 |
|------------|------|---------|
| 仕様書-戦略ブリッジ | `docs_new/00_core/specs/SPEC_STRATEGY_BRIDGE.md` | Sequence-Layer対応、セキュリティ要件 |
| Sequence定義 | `docs_new/00_core/sequences/SEQUENCES_v2.0.md` | 対象Sequenceの仕様 |
| Modular Architecture | `docs_new/00_core/specs/MODULAR_ARCHITECTURE.md` | Layer構成、インターフェース |

### 3.2 戦略決定文書（必須）

> パス: `docs_new/01_phase/04_phase4/00_戦略決定文書/`

| ドキュメント | 内容 | 計画時の確認内容 |
|------------|------|-----------------|
| `00_INDEX.md` | 目次・概要 | 全体像・9システム253画面の把握 |
| `01_ARCHITECTURE.md` | システム構成 | 技術スタック・システム間連携 |
| `02_PERSONAS.md` | 12ペルソナ定義 | 対象ユーザーの背景・ニーズ |
| `03_USER_JOURNEYS.md` | ジャーニーマップ | 画面フロー・ユーザー体験 |
| `04_SCREENS.md` | 253画面定義 | 実装対象画面・優先度(P0/P1/P2) |
| `05_AUTH_SECURITY.md` | 認証・権限設計 | 認証方式・セッション管理 |
| `06_DATA_DESIGN.md` | データ設計 | 保存先(L1/L3/DB/IPFS)・スキーマ |
| `07_INTEGRATION.md` | API・統合設計 | 既存API・不足API・開発計画 |

### 3.3 ネットワーク構成（前提）

| Layer | 構成 | 状態 |
|-------|------|------|
| L1 | Ethereum Sepolia | 11コントラクトデプロイ済み |
| L3 | Aegis Chain（自社開発） | 11クレート開発済み |

## 4. レビュー課題の確認（必須）

CURRENT_STATE.md の以下を確認し、**未解決課題を今回の計画に含める**：

### 確認項目
1. **「🚧 ブロッカー / 懸念事項」セクション**
   - 🔴 Critical / 🟠 High の項目は必ず対応
   
2. **「📝 PIR記録」セクション**
   - ⚠️ CONDITIONAL / ❌ FAIL の項目を確認

3. **「🔜 次のアクション」セクション**
   - 「修正必須」項目があれば最優先

### スコープ優先順位
```
1. 🔴 Critical課題の修正 → 必須
2. 🟠 High課題の修正    → 可能な限り含める
3. 🟡 Medium課題       → 余裕があれば
4. 新規実装タスク       → 上記完了後
```

## 5. チェックリスト読み込み
CURRENT_STATEに記載されている「Active Checklist」を読み込んでください。

## 6. モード設定
現在のモード: 計画 (Planner)
担当エージェント: PM

## 7. タスク
以下のフォーマットで `docs_new/01_phase/CURRENT_PLAN.md` を作成してください：

```markdown
# Current Plan

> **Generated**: [日時]
> **Phase**: [現在のPhase]

## 対象チェックリスト
[Active Checklistのパス]

## 仕様書参照

### 対象Sequence
| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| #X | Core/Governance/Token | SEQUENCES §X |

### セキュリティ要件
| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| [要件] | SEQ#X / SPEC §X | [方法] |

## 戦略決定文書参照

> パス: `docs_new/01_phase/04_phase4/00_戦略決定文書/`

### 対象システム・ペルソナ
| 項目 | 値 |
|------|-----|
| 対象システム | [Consumer App / Token Hub / QS Admin 等] |
| 対象ペルソナ | [End User / Prover / QS Staff 等] |
| 対象画面数 | [X画面] |
| 認証方式 | [SIWE / Email+2FA 等] |

### 参照ドキュメント
| ドキュメント | 参照セクション |
|------------|---------------|
| 01_ARCHITECTURE.md | §X |
| 02_PERSONAS.md | §X |
| 03_USER_JOURNEYS.md | Part X |
| 04_SCREENS.md | §2.X |
| 05_AUTH_SECURITY.md | §X |
| 06_DATA_DESIGN.md | §X |
| 07_INTEGRATION.md | Part X |

## 前回レビュー課題（該当時のみ）

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| 1 | 🔴 Critical | ... | ... |

## 今回のスコープ

### 修正項目（レビュー課題より）
- [ ] [課題名]

### 実装項目
- [ ] [実装項目名]

### テスト項目
- [ ] [テスト項目名]

## 成果物
| ファイル | 説明 |
|---------|------|
| `apps/xxx/` | ... |
| `services/xxx/` | ... |
| `packages/xxx/` | ... |

## 実行順序
1. [具体的なステップ]
2. [具体的なステップ]
3. ...

## Core Principles確認
- [ ] CP-1: 完全量子耐性 - 違反なし
- [ ] CP-2: Self-Custody - 違反なし
- [ ] CP-3: Time Lock存在 - 違反なし
- [ ] CP-4: Slashing存在 - 違反なし
- [ ] CP-5: 透明性 - 違反なし

## リスク・懸念事項
- [あれば記載]
```

この計画を作成後、②〜④のエージェントが `CURRENT_PLAN.md` を参照して作業を進めます。
