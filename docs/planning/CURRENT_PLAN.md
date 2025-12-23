# Quantum Shield - CURRENT_PLAN.md

> **Version**: 1.0  
> **Created**: 2025-12-23  
> **Status**: Phase 0.5 再始動  
> **Branch**: dev/restructure

---

## 📍 現状認識

### ブランチ状況

| ブランチ | 状態 | 内容 |
|---------|------|------|
| `dev/phase2-native-stark` | Day 9完了 | VRF統合済、250+テスト |
| `dev/restructure` | 初期構築中 | Stateless Architecture基盤 |

### 問題認識

dev/phase2-native-starkでの実装は技術的には進んでいるが、以下の課題が発生：

1. **仕様との乖離**: 実装が仕様書から逸脱している可能性（文書改竄問題の経験）
2. **検証不足**: Sequence単位での仕様準拠確認が未実施
3. **アーキテクチャ変更**: Stateless Architecture導入により、プロジェクト管理方法が変更

---

## 🔄 Phase 0.5: Stateless Architecture 再始動

### 目的

**ゼロベースで仕様準拠を検証し、Stateless Architectureの下で実装状況を正確にマッピングする**

### Phase 0.5 タスク一覧

| # | タスク | 担当 | 状態 | 成果物 |
|---|--------|------|------|--------|
| 0.5.1 | Stateless Architecture基盤完成 | Engineer | 🟡 進行中 | docs/constitution/, docs/planning/ |
| 0.5.2 | 既存実装の仕様準拠監査 | All Agents | ⬜ 未着手 | AUDIT_REPORT.md |
| 0.5.3 | Sequence別チェックリスト作成 | Engineer | 🟡 一部完了 | docs/planning/checklists/ |
| 0.5.4 | ブランチ統合計画策定 | CTO | ⬜ 未着手 | MERGE_PLAN.md |
| 0.5.5 | dev/restructure完成・マージ | Engineer | ⬜ 未着手 | PR |

---

## 📋 Phase 0.5.1: Stateless Architecture 基盤完成

### 必要ファイル構成

```
docs/
├── constitution/               # 不変の原則（CEO承認必要）
│   ├── CORE_PRINCIPLES.md     ✅ 作成済
│   ├── QUANTUM_SHIELD_SEQUENCES_v2.0_REF.md  ✅ 作成済
│   └── QUANTUM_SHIELD_UNIFIED_SPEC_v2.0_REF.md  ⬜ 要作成
│
├── rules/                      # 運用ルール
│   ├── BOOTLOADER.md          ⬜ 要作成
│   ├── AGENT_MEETING_PROTOCOL.md  ⬜ 要作成
│   └── PIR_CODE_REVIEW_ROUTINE.md  ⬜ 要作成
│
├── planning/                   # プロジェクト状態（毎セッション更新）
│   ├── CURRENT_STATE.md       ✅ 作成済
│   ├── CURRENT_PLAN.md        ✅ 作成済（本ファイル）
│   ├── checklists/            🟡 一部作成
│   │   ├── sequence_1_lock.md ✅ 作成済
│   │   ├── sequence_2_unlock_normal.md  ⬜ 要作成
│   │   ├── sequence_3_unlock_emergency.md  ⬜ 要作成
│   │   ├── sequence_4_challenge.md  ⬜ 要作成
│   │   └── ...
│   └── logs/                   # セッションログ
│       └── .gitkeep           ✅ 作成済
│
└── memory/                     # 旧アーキテクチャ（移行後削除）
    ├── rules.md               → constitution/ へ移行
    ├── state.json             → planning/CURRENT_STATE.md へ移行
    └── context.md             → 廃止（各チャットは使い捨て）
```

### Phase 0.5.1 アクションアイテム

| # | アクション | 優先度 | 所要時間 |
|---|----------|--------|---------|
| 1 | QUANTUM_SHIELD_UNIFIED_SPEC_v2.0_REF.md 作成 | High | 30分 |
| 2 | BOOTLOADER.md 作成 | High | 30分 |
| 3 | 残りのSequenceチェックリスト作成 (7ファイル) | Medium | 2時間 |
| 4 | rules/ディレクトリへのプロトコル移行 | Medium | 30分 |

---

## 📋 Phase 0.5.2: 既存実装の仕様準拠監査

### 目的

dev/phase2-native-starkの実装が、正規仕様（QUANTUM_SHIELD_*）に準拠しているか検証

### 監査対象

| # | 実装 | 仕様準拠確認項目 | 担当Agent |
|---|------|-----------------|-----------|
| 1 | L1Vault.sol | Slashing配分60/20/20、Bond計算、Defense期間 | CSO, Engineer |
| 2 | SHA3_256.sol | FIPS 202準拠（keccak256ではない） | Crypto Auditor |
| 3 | SparseMerkleTree.sol | SHA3-256使用 | Crypto Auditor |
| 4 | StateRootCalculator.sol | SR_0/SR_1計算式 | Engineer |
| 5 | ProverSelector.sol | VRF確率計算 P(i) = Stake_i / Σ Stake | Engineer |
| 6 | VRFConsumerMock.sol | Fallback機構 | QA |

### 監査手順

```
1. QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md から該当仕様を抽出
2. QUANTUM_SHIELD_SEQUENCES_v2.0.md からフローを確認
3. 実装コードと仕様を1行ずつ照合
4. 乖離があれば AUDIT_REPORT.md に記録
5. 修正が必要な場合、PIR会議で決議
```

---

## 📋 Phase 0.5.3: Sequence別チェックリスト作成

### 作成すべきチェックリスト

| # | Sequence | ファイル名 | 状態 |
|---|----------|-----------|------|
| 1 | Lock | sequence_1_lock.md | ✅ 作成済 |
| 2 | Unlock (Normal) | sequence_2_unlock_normal.md | ⬜ 未着手 |
| 3 | Unlock (Emergency) | sequence_3_unlock_emergency.md | ⬜ 未着手 |
| 3' | Resync | sequence_3_resync.md | ⬜ 未着手 |
| 4 | Challenge + Slashing | sequence_4_challenge.md | ⬜ 未着手 |
| 5 | Prover Registration | sequence_5_prover_registration.md | ⬜ 未着手 |
| 6 | Prover Exit | sequence_6_prover_exit.md | ⬜ 未着手 |
| 7 | Governance Proposal | sequence_7_governance.md | ⬜ 未着手 |
| 8 | Emergency Pause | sequence_8_emergency_pause.md | ⬜ 未着手 |

### チェックリストテンプレート

各チェックリストは以下の構造を持つ：

1. **仕様参照** (SEQUENCES_v2.0からの引用)
2. **実装項目** (コード、テスト、レビュー)
3. **成果物リンク** (commit SHA, ファイルパス)
4. **PIR決議** (会議ID、日付、判定)

---

## 📋 Phase 0.5.4: ブランチ統合計画

### 統合戦略

```
Option A: dev/restructure を main にマージ → dev/phase2-native-stark をリベース
Option B: dev/phase2-native-stark の実装を dev/restructure にチェリーピック
Option C: 新ブランチ dev/phase3-unified を作成し、両方から必要な部分を移植
```

### 推奨: Option B

**理由**:
1. dev/restructure の構造が「正」となるべき
2. 既存実装は監査後にチェリーピック
3. 監査で問題が見つかった実装は移植しない

### 統合手順

```
1. dev/restructure で Stateless Architecture 完成
2. Phase 0.5.2 監査完了
3. 監査PASSした実装のみチェリーピック
4. dev/restructure を main にマージ
5. dev/phase2-native-stark をアーカイブ
```

---

## 🗓️ Phase 0.5 スケジュール

| Day | タスク | 成果物 |
|-----|--------|--------|
| 0.5-Day1 | Stateless Architecture基盤完成 | docs/constitution/, docs/rules/ |
| 0.5-Day2 | 全Sequenceチェックリスト作成 | docs/planning/checklists/*.md |
| 0.5-Day3 | 既存実装監査 (L1Vault, SHA3) | AUDIT_REPORT.md Part 1 |
| 0.5-Day4 | 既存実装監査 (VRF, StateRoot) | AUDIT_REPORT.md Part 2 |
| 0.5-Day5 | ブランチ統合・PIR会議 | MERGE_PLAN.md, PIR-011 |

---

## ✅ 次のアクション

### 即時実行（このセッション）

1. [x] 本ファイル (CURRENT_PLAN.md) をGitHubにプッシュ
2. [ ] BOOTLOADER.md を作成
3. [ ] QUANTUM_SHIELD_UNIFIED_SPEC_v2.0_REF.md を作成

### 次セッション

1. [ ] 残りのSequenceチェックリスト作成
2. [ ] 既存実装監査開始

---

## 📝 Change Log

| Date | Author | Change |
|------|--------|--------|
| 2025-12-24 | CEO/Claude | Phase 0.5 再始動計画策定、GitHubプッシュ |

---

**END OF DOCUMENT**
