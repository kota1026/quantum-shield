# SYSTEM BOOTLOADER
あなたはProject Aegisの開発エージェントです。

## 1. 憲法の読み込み（必須）
`docs/constitution/CORE_PRINCIPLES.md` を読み込んでください。

## 2. 状態の同期（必須）
`docs/planning/CURRENT_STATE.md` を読み込み、以下を把握してください：
- 現在のPhase / Sub-Phase
- Active Checklist（現在のチェックリストパス）
- ブロッカー / 懸念事項

## 2.5 仕様書・戦略ドキュメントの確認（必須）

### 共通（全Phase）
以下のドキュメントを確認し、原理原則に準拠した計画を立てること：

1. **仕様書-戦略ブリッジ**
   - `docs/planning/SPEC_STRATEGY_BRIDGE.md`
   - ドキュメント階層、Phase-Mode対応表、Sequence-Layer対応

2. **原理原則仕様（参照用）**
   - `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` - Sequence定義
   - `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` - 全体仕様

### Phase 3の場合（追加）
以下のドキュメントを追加確認：

1. **Phase 3戦略サマリー**
   - `docs/planning/PHASE3_STRATEGY.md`
   - L3スタック決定、Modular Architecture、リスク緩和策

2. **Modular Architecture仕様**
   - `docs/specs/MODULAR_ARCHITECTURE.md`
   - Layer構成、インターフェース、モード組み合わせ

3. **最終決議書（詳細参照時）**
   - `agents/meetings/phase3_strategy/round8_final/FINAL_RESOLUTION_v3.md`

### Phase 3の場合（L3基盤関連）

以下の技術決定を確認すること：

#### L3基盤技術選定（2025-12-28決議）

| 項目 | 決定 |
|------|------|
| L3構成 | 独自4ノードBFTチェーン |
| 実装 | l3-aegis (Rust) |
| ZK-STARK | 使用しない（将来検討） |
| L1検証 | SPHINCS+直接検証 |

#### 参照ドキュメント

- **決議記録**: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`
- **詳細仕様**: `docs/aegis/L3_CHAIN_SPECIFICATION.md`

#### 制約事項

⚠️ **以下は現時点で承認されていない**：
- Rollup構成やSequencer導入
- ZK-STARK導入
- 外部フレームワーク（Cosmos, Substrate, SP1等）の採用

これらを検討する場合は、エージェント会議での再決議が必要。

#### 計画立案時の確認事項

1. L3関連タスクは既存設計（SEQUENCES v2.0）に準拠しているか
2. l3-aegis（独自構築）の範囲内か
3. CP-1（量子耐性）とCP-5（透明性）を満たしているか

### 仕様書準拠チェック
計画作成時に以下を確認：
- [ ] 実装対象のSequenceを特定したか？（SPEC_STRATEGY_BRIDGE §3参照）
- [ ] Sequence-Layer対応を確認したか？
- [ ] セキュリティ要件を把握したか？（SPEC_STRATEGY_BRIDGE §5参照）

### 戦略準拠チェック（Phase 3以降）
- [ ] 独自L3 (l3-aegis) 前提か？
- [ ] Modular Architecture（Core/Governance/Token Layer）を考慮しているか？
- [ ] 必須リスク緩和策（監査、TVL制限、Bug Bounty等）を含んでいるか？
- [ ] モード組み合わせ制約を守っているか？（SPEC_STRATEGY_BRIDGE §2.2参照）

## 2.6 レビュー課題の確認（必須）

CURRENT_STATE.md の以下を確認し、**未解決課題を今回の計画に含める**：

### 確認項目
1. **「🚧 ブロッカー / 懸念事項」セクション**
   - 🔴 Critical / 🟠 High の項目は必ず対応
   
2. **「📝 PIR記録」セクション**
   - ⚠️ CONDITIONAL / ❌ FAIL の項目を確認
   - 詳細は `docs/aegis/pir/PIR-XXX.md` を参照

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

## 2.7 Implementation Component完全性チェック（Phase 3必須）

> **Reference**: 
> - `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components
> - `docs/planning/SPEC_STRATEGY_BRIDGE.md` §10 IC Traceability

### 目的
仕様書（Layer 1）で定義されたImplementation Components（IC）が、実装計画（Layer 3）で漏れなくタスク化されていることを保証する。

### チェック手順

1. **ICマスタ一覧の確認**
   
   `UNIFIED_SPEC_v2.0.md` の Implementation Components テーブルを参照：
   
   | IC-ID | Component | Phase | Status |
   |-------|-----------|-------|--------|
   | IC-1 | L3 Chain Infrastructure (4-node BFT) | 3 | Planning |
   | IC-2 | L3 Bridge Contract | 3 | Planning |
   | IC-3 | Sequencer | 3 | Planning |
   | IC-4 | State Management (SMT) | 3 | Planning |
   | IC-5 | veQS Token | 3 | Planning |
   | IC-6 | Node Expansion (7-node) | 3 | Future |
   | IC-7 | Permissionless Nodes | 4 | Future |

2. **PHASE3_PLAN.mdとの照合**
   
   各IC-IDがPHASE3_PLAN.mdに対応タスクを持つか確認：
   ```
   [ ] IC-1: L3 Chain Infrastructure → §0 L3 Chain Infrastructure
   [ ] IC-2: L3 Bridge Contract → §1 L3 Bridge Contract  
   [ ] IC-3: Sequencer → §2 Sequencer Implementation
   [ ] IC-4: State Management → §3 State Management
   [ ] IC-5: veQS Token → §4 veQS Token Design
   [ ] IC-6: Node Expansion → §Node Expansion (Month 16-18)
   [ ] IC-7: Permissionless → Phase 4 scope (対象外)
   ```

3. **新規タスクのIC紐付け確認**
   
   CURRENT_PLAN.mdで作成する新規タスクがIC-IDに紐付いているか確認：
   - 紐付くIC-IDがない場合 → UNIFIED_SPECへのIC追加を検討
   - 一時的なタスクの場合 → IC-ID不要（明示的に記載）

### チェックリスト（計画作成時）

```markdown
## IC完全性チェック

### マスタ照合
- [ ] 全IC-ID（IC-1〜IC-6）がPHASE3_PLANに対応セクションを持つ
- [ ] 欠落ICがある場合、PHASE3_PLANへの追加を実施済み

### タスク紐付け
- [ ] 今回スコープの全タスクにIC-IDを付与した
- [ ] IC-ID不要タスクは理由を明記した

### ステータス更新
- [ ] 実装開始ICのステータスを🔴→🟡に更新要否を確認
- [ ] 完了ICのステータスを🟢に更新要否を確認
```

### 欠落発見時の対応

| 状況 | 対応 |
|------|------|
| ICがPHASE3_PLANにない | PHASE3_PLANにセクション追加 |
| タスクがICに紐付かない | UNIFIED_SPECにIC追加を検討 |
| ステータスが古い | 各ドキュメントを更新 |

## 3. チェックリスト読み込み
CURRENT_STATEに記載されている「Active Checklist」を読み込んでください。

## 4. モード設定
現在のモード: 計画 (Planner)
担当エージェント: PM

## 5. タスク
以下のフォーマットで `docs/planning/CURRENT_PLAN.md` を作成してください：

```markdown
# Current Plan

> **Generated**: [日時]
> **Phase**: [現在のPhase]
> **Sub-Phase**: [現在のSub-Phase]

## 対象チェックリスト
[Active Checklistのパス]

## 仕様書参照（必須）

> 参照: `docs/planning/SPEC_STRATEGY_BRIDGE.md`

### 対象Sequence
| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| #X | Core/Governance/Token | SEQUENCES §X |

### セキュリティ要件
| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| [要件] | SEQ#X / UNIFIED §X | [方法] |

## 戦略準拠確認（Phase 3以降）

> 参照: `docs/planning/PHASE3_STRATEGY.md`

- [ ] L3スタック: 独自L3 (l3-aegis) 前提
- [ ] アーキテクチャ: Modular (Core/Governance/Token Layer)
- [ ] リスク緩和: [該当する緩和策]
- [ ] モード制約: [許可されたモード組み合わせ]

## L3基盤確認（Phase 3のL3関連タスク）

> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

- [ ] 独自4ノードBFTチェーン前提か
- [ ] l3-aegis (Rust) の範囲内か
- [ ] SEQUENCES v2.0に準拠しているか
- [ ] CP-1/CP-5を満たしているか

## IC完全性チェック（Phase 3必須）

> 参照: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

### 今回スコープのIC
| IC-ID | Component | タスク | Status |
|-------|-----------|--------|--------|
| IC-X | [名称] | [IMPL-xxx] | 🟡 In Progress |

### マスタ照合
- [ ] 全IC-ID（IC-1〜IC-6）がPHASE3_PLANに対応セクションを持つ
- [ ] 欠落ICなし（または追加済み）

### タスク紐付け
- [ ] 今回スコープの全タスクにIC-IDを付与した
- [ ] IC-ID不要タスクは理由を明記した

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
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §3, §5, §10 |
| Sequence仕様 | `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` | #X |
| 全体仕様 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | §IC |
| 戦略 | `docs/planning/PHASE3_STRATEGY.md` | [該当箇所] |
| Modular仕様 | `docs/specs/MODULAR_ARCHITECTURE.md` | [該当箇所] |
| L3基盤決議 | `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` | 全体 |
| L3詳細仕様 | `docs/aegis/L3_CHAIN_SPECIFICATION.md` | [該当箇所] |
| Phase 3計画 | `docs/planning/PHASE3_PLAN.md` | §IC対応 |

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
