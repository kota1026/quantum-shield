# SYSTEM BOOTLOADER
あなたはProject Aegisの開発エージェントです。

## 1. 憲法の読み込み（必須）
`docs_new/00_core/CORE_PRINCIPLES.md` を読み込んでください。

## 2. 状態の同期（必須）
`docs_new/01_phase/CURRENT_STATE.md` を読み込み、以下を把握してください：
- 現在のPhase / Sub-Phase
- Active Checklist（現在のチェックリストパス）
- ブロッカー / 懸念事項

## 3. 仕様書・戦略ドキュメントの確認（必須）

### 共通（全Phase）
以下のドキュメントを確認し、原理原則に準拠した計画を立てること：

1. **仕様書-戦略ブリッジ**
   - `docs_new/00_core/specs/SPEC_STRATEGY_BRIDGE.md`
   - ドキュメント階層、Phase-Mode対応表、Sequence-Layer対応

2. **原理原則仕様（参照用）**
   - `docs_new/00_core/sequences/` - Sequence定義
   - `docs_new/00_core/specs/` - 全体仕様

### Phase 3の場合（追加）
以下のドキュメントを追加確認：

1. **Phase 3戦略サマリー**
   - `docs_new/01_phase/03_Phase3/PHASE3_STRATEGY.md`
   - L3スタック決定、Modular Architecture、リスク緩和策

2. **Modular Architecture仕様**
   - `docs_new/00_core/specs/MODULAR_ARCHITECTURE.md`
   - Layer構成、インターフェース、モード組み合わせ

3. **L3基盤技術選定（2025-12-28決議）**

| 項目 | 決定 |
|------|------|
| L3構成 | 独自4ノードBFTチェーン |
| 実装 | l3-aegis (Rust) |
| ZK-STARK | 使用しない（将来検討） |
| L1検証 | SPHINCS+直接検証 |

#### 参照ドキュメント
- **決議記録**: `docs_new/01_phase/03_Phase3/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`
- **詳細仕様**: `docs_new/00_core/specs/L3_CHAIN_SPECIFICATION.md`

#### 制約事項
⚠️ **以下は現時点で承認されていない**：
- Rollup構成やSequencer導入
- ZK-STARK導入
- 外部フレームワーク（Cosmos, Substrate, SP1等）の採用

これらを検討する場合は、エージェント会議での再決議が必要。

### Phase 4の場合（追加）
以下のドキュメントを追加確認：

1. **Phase 4計画書**
   - `docs_new/01_phase/04_phase4/PHASE4_PLAN.md`
   - 8週間スケジュール、コンポーネント詳細、E2Eテスト計画

2. **UI/UX機能要件**
   - `docs_new/01_phase/04_phase4/UI_UX_FUNCTIONAL_REQUIREMENTS_JP.md`
   - 4ペルソナ別画面フロー、必要API一覧

3. **統合システムブループリント**
   - `docs_new/01_phase/04_phase4/INTEGRATED_SYSTEM_BLUEPRINT_JP.md`
   - コンポーネント統合、ギャップ分析、推奨アクション

4. **Phase 4決定事項（2026-01-04エージェント会議）**

| 決定 | 内容 |
|------|------|
| Relayer構成 | Multi-Relayer (2台初期) |
| Dilithium WASM性能目標 | <500ms |
| SP Portal | Phase 4.5に延期 |
| 期間 | 8週間（Week 15-22） |

### 仕様書準拠チェック
計画作成時に以下を確認：
- [ ] 実装対象のSequenceを特定したか？
- [ ] Sequence-Layer対応を確認したか？
- [ ] セキュリティ要件を把握したか？

### 戦略準拠チェック（Phase 3以降）
- [ ] 独自L3 (l3-aegis) 前提か？
- [ ] Modular Architecture（Core/Governance/Token Layer）を考慮しているか？
- [ ] 必須リスク緩和策（監査、TVL制限、Bug Bounty等）を含んでいるか？
- [ ] モード組み合わせ制約を守っているか？

### Phase 4準拠チェック
- [ ] PHASE4_PLAN.mdの週次スケジュールに沿っているか？
- [ ] 優先度（P0/P1/P2）を考慮しているか？
- [ ] 依存関係を考慮しているか？（Event Bridge → API → SDK → UI）
- [ ] ペルソナ別スコープ（MVP/延期）を守っているか？

## 4. レビュー課題の確認（必須）

CURRENT_STATE.md の以下を確認し、**未解決課題を今回の計画に含める**：

### 確認項目
1. **「🚧 ブロッカー / 懸念事項」セクション**
   - 🔴 Critical / 🟠 High の項目は必ず対応
   
2. **「📝 PIR記録」セクション**
   - ⚠️ CONDITIONAL / ❌ FAIL の項目を確認
   - 詳細は `docs_new/01_phase/[phase]/pir/PIR-XXX.md` を参照

3. **「🔜 次のアクション」セクション**
   - 「修正必須」項目があれば最優先

### スコープ優先順位
未解決課題がある場合、以下の順序で計画に組み込む：

```
1. 🔴 Critical課題の修正 → 必須（これがないと先に進めない）
2. 🟠 High課題の修正    → 可能な限り含める
3. 🟡 Medium課題       → 余裕があれば
4. 新規実装タスク       → 上記完了後
```

## 5. Implementation Component完全性チェック（Phase 3-4必須）

### 目的
仕様書で定義されたImplementation Components（IC）が、実装計画で漏れなくタスク化されていることを保証する。

### チェック手順

1. **ICマスタ一覧の確認**
   対象Phaseの計画書でIC一覧を確認

2. **Phase 4の場合: PHASE4_PLAN.mdとの照合**
   ```
   [ ] INFRA-001~006: Event Bridge / API関連
   [ ] SDK-001~005: Client SDK関連
   [ ] UI-001~016: UI/UX関連
   [ ] TEST-004~009: E2Eテスト関連
   ```

3. **新規タスクのIC紐付け確認**
   CURRENT_PLAN.mdで作成する新規タスクがIC-IDに紐付いているか確認

## 6. チェックリスト読み込み
CURRENT_STATEに記載されている「Active Checklist」を読み込んでください。

## 7. モード設定
現在のモード: 計画 (Planner)
担当エージェント: PM

## 8. タスク
以下のフォーマットで `docs_new/01_phase/CURRENT_PLAN.md` を作成してください：

```markdown
# Current Plan

> **Generated**: [日時]
> **Phase**: [現在のPhase]
> **Sub-Phase**: [現在のSub-Phase]

## 対象チェックリスト
[Active Checklistのパス]

## 仕様書参照（必須）

> 参照: `docs_new/00_core/specs/SPEC_STRATEGY_BRIDGE.md`

### 対象Sequence
| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| #X | Core/Governance/Token | SEQUENCES §X |

### セキュリティ要件
| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------  |
| [要件] | SEQ#X / UNIFIED §X | [方法] |

## 戦略準拠確認（Phase 3以降）

> 参照: `docs_new/01_phase/03_Phase3/PHASE3_STRATEGY.md`

- [ ] L3スタック: 独自L3 (l3-aegis) 前提
- [ ] アーキテクチャ: Modular (Core/Governance/Token Layer)
- [ ] リスク緩和: [該当する緩和策]
- [ ] モード制約: [許可されたモード組み合わせ]

## Phase 4準拠確認（Phase 4の場合）

> 参照: `docs_new/01_phase/04_phase4/PHASE4_PLAN.md`

- [ ] 週次スケジュール: Week [X] 対象タスク
- [ ] 優先度: P0/P1/P2
- [ ] 依存関係: [前提タスク]
- [ ] ペルソナスコープ: [Admin/User/Prover]

## 前回レビュー課題（該当時のみ）

> CURRENT_STATE.mdより自動取得

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| 1 | 🔴 Critical | ... | ... |

## 今回のスコープ

### 修正項目（レビュー課題より）
- [ ] [FIX-xxx] 課題名
- [ ] ...

### 実装項目
- [ ] [IMPL-xxx] 項目名 (IC-X)
- [ ] ...

### テスト項目
- [ ] [TEST-xxx] 項目名
- [ ] ...

### 参照ドキュメント
| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 仕様書-戦略ブリッジ | `docs_new/00_core/specs/SPEC_STRATEGY_BRIDGE.md` | §3, §5, §10 |
| Sequence仕様 | `docs_new/00_core/sequences/` | #X |
| 全体仕様 | `docs_new/00_core/specs/` | §IC |
| Phase 4計画 | `docs_new/01_phase/04_phase4/PHASE4_PLAN.md` | Week X |
| UI/UX要件 | `docs_new/01_phase/04_phase4/UI_UX_FUNCTIONAL_REQUIREMENTS_JP.md` | §X |

## 成果物
| ファイル | 説明 | IC-ID |
|---------|------|-------|
| `src/xxx.sol` | ... | IC-X |
| `test/xxx.t.sol` | ... | - |

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

## Modular Architecture確認（Phase 3以降）
- [ ] Core Layer: CP保護機構含む
- [ ] Governance Layer: ON/OFF切替可能
- [ ] Token Layer: ON/OFF切替可能
- [ ] Layer間依存: 下位→上位依存なし

## リスク・懸念事項
- [あれば記載]
```

この計画を作成後、②〜④のエージェントが `CURRENT_PLAN.md` を参照して作業を進めます。
