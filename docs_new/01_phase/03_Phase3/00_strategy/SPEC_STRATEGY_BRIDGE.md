# Specification-Strategy Bridge Document

> **Document Version**: 1.4  
> **Created**: 2025-12-28  
> **Updated**: 2025-01-01  
> **Purpose**: 既存仕様書（原理原則）とPhase 3戦略決議の連動を定義

---

## 1. ドキュメント階層

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Layer 0: 憲法（不変）                                                        │
│ └── docs/constitution/CORE_PRINCIPLES.md                                    │
│     ※ ガバナンス投票でも変更不可                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│ Layer 1: 原理原則仕様（安定）                                                │
│ ├── docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md      ← 「何をするか」        │
│ │   ※ 8つのSequence定義（Lock, Unlock, Challenge等）                        │
│ └── docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md   ← 「全体像」            │
│     ※ Phase定義、Token、ガバナンス、経済モデル                                │
│     ※ Implementation Components (IC) 定義                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│ Layer 1.5: ビジネス戦略（CEO承認で更新）                                      │
│ └── docs/planning/DEVELOPMENT_STRATEGY_v2.0.md       ← 「誰に売るか」        │
│     ※ 2本立て戦略（Enterprise / Decentralized）                              │
│     ※ 段階的分散化ロードマップ                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│ Layer 2: 戦略決議（Phase単位で更新）                        【本書の橋渡し】  │
│ ├── docs/planning/PHASE3_STRATEGY.md                 ← 「どう実現するか」    │
│ ├── docs/specs/MODULAR_ARCHITECTURE.md               ← 「実装設計」          │
│ ├── docs/planning/SPEC_STRATEGY_BRIDGE.md            ← 「Layer 1-2対応」     │
│ └── docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md      │
│     ※ L3基盤技術選定決議（2025-12-28）                    ← 「L3基盤決定」    │
├─────────────────────────────────────────────────────────────────────────────┤
│ Layer 2.5: L3詳細仕様（技術決議後）                                          │
│ └── docs/aegis/L3_CHAIN_SPECIFICATION.md             ← 「L3チェーン仕様」    │
│     ※ 独自4ノードBFTチェーン、l3-aegis実装仕様                               │
│     ※ 段階的拡張設計（Phase 1-4）                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│ Layer 3: 実装計画（週単位で更新）                                            │
│ ├── docs/planning/CURRENT_STATE.md                                          │
│ ├── docs/planning/CURRENT_PLAN.md                                           │
│ ├── docs/planning/PHASE3_PLAN.md                     ← 「Phase 3タスク」     │
│ └── docs/checklists/phase3.X.md                      ← 「サブフェーズ」      │
│     ├── phase3.1.md (Foundation)                                            │
│     ├── phase3.2.md (Token + Implementation)                                │
│     └── phase3.3.md (Node Expansion + Full Decentralization)                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 参照ルール

| 状況 | 参照先 |
|------|--------|
| 「何をすべきか」を確認 | Layer 1: SEQUENCES / UNIFIED_SPEC |
| 「どう実装するか」を確認 | Layer 2: STRATEGY / MODULAR_ARCHITECTURE |
| Layer 1とLayer 2の対応関係 | **本書（SPEC_STRATEGY_BRIDGE.md）** |
| L3基盤の技術選定 | Layer 2: L3_INFRASTRUCTURE_FINAL_DECISION |
| L3チェーンの詳細仕様 | Layer 2.5: L3_CHAIN_SPECIFICATION |
| ビジネス戦略（2本立て） | Layer 1.5: DEVELOPMENT_STRATEGY_v2.0 |
| 今日何をするか | Layer 3: CURRENT_PLAN |

---

## 1.5 L3基盤技術決定（2025-12-28）

### 1.5.1 決定サマリー

| 項目 | 決定 |
|------|------|
| L3構成 | 独自4ノードBFTチェーン |
| 実装 | l3-aegis (Rust) |
| 合意方式 | PBFT variant (f=1) |
| ZK-STARK | 使用しない（将来検討） |
| L1検証 | SPHINCS+直接検証 (~$25) |

### 1.5.2 仕様書との整合性

この決定は以下の既存仕様との整合性を確認済み：

| 仕様書 | 整合性 | 備考 |
|--------|:------:|------|
| SEQUENCES v2.0 | ✅ | 全Sequenceがl3-aegisで実装可能 |
| UNIFIED_SPEC v2.0 | ✅ | Phase定義に影響なし |
| CORE_PRINCIPLES | ✅ | CP-1/CP-5を完全満足 |

### 1.5.3 除外した選択肢

| 選択肢 | 除外理由 | CP影響 |
|--------|---------|--------|
| Rollup + ZK-STARK | 透明性欠如 | CP-5違反リスク |
| Cosmos SDK | Go言語でl3-aegis(Rust)と不整合 | - |
| Substrate | CP-1改造が複雑 | CP-1リスク |
| SP1/Risc Zero | Sequencer構成で透明性欠如 | CP-5違反リスク |

### 1.5.4 参照ドキュメント

- **決議記録**: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`
- **詳細仕様**: `docs/aegis/L3_CHAIN_SPECIFICATION.md`

---

## 2. Phase-Mode 対応表

### 2.1 既存Phase定義と推奨モード

既存仕様書（UNIFIED_SPEC_v2.0.md）のPhase定義と、Modular Architectureのモードを対応付け：

| 既存Phase | 期間 | 推奨Governanceモード | 推奨Tokenモード | 備考 |
|-----------|------|---------------------|-----------------|------|
| Phase 1 | M1-6 | CENTRALIZED | DISABLED | 開発・テスト、TVL $1M |
| Phase 2 | M7-12 | MULTISIG | BASIC | Security Council稼働、$QS発行 |
| Phase 3 | M13-18 | DECENTRALIZED | BASIC/FULL | Token投票開始、veQS |
| Phase 4 | M19-24 | DECENTRALIZED | FULL | 完全分散化 |
| （譲渡用） | - | MULTISIG | DISABLED | 仕様書にない新構成 |

### 2.2 モード組み合わせ制約

既存仕様書との整合性を維持するため、以下の制約を設ける：

| # | Governance | Token | 許可 | 理由 |
|---|------------|-------|:----:|------|
| 1 | CENTRALIZED | DISABLED | ✅ | Phase 1相当 |
| 2 | CENTRALIZED | BASIC | ✅ | 初期トークン発行 |
| 3 | CENTRALIZED | FULL | ⚠️ | 注意: 中央集権+完全Token化 |
| 4 | MULTISIG | DISABLED | ✅ | 譲渡用最小構成 |
| 5 | MULTISIG | BASIC | ✅ | Phase 2相当 |
| 6 | MULTISIG | FULL | ✅ | 運用移行期 |
| 7 | DECENTRALIZED | DISABLED | ❌ | 禁止: veQS投票不可で矛盾 |
| 8 | DECENTRALIZED | BASIC | ✅ | 分散化初期 |
| 9 | DECENTRALIZED | FULL | ✅ | Phase 3-4相当（推奨） |

※ ⚠️ は技術的には可能だが、思想的に注意が必要
※ ❌ は既存仕様との矛盾があり禁止

---

## 3. Sequence → Layer マッピング

### 3.1 基本マッピング

既存仕様書の各Sequenceを、Modular ArchitectureのどのLayerで実装するか：

| Sequence | 名称 | 実装Layer | Governance依存 | Token依存 | 常時有効 |
|----------|------|-----------|:--------------:|:---------:|:--------:|
| #1 | Lock | Core | - | - | ✅ |
| #2 | Unlock (Normal) | Core | - | - | ✅ |
| #3 | Unlock (Emergency) | Core | - | - | ✅ |
| #3' | Resync | Core | - | - | ✅ |
| #4 | Challenge + Slashing | Core | - | - | ✅ |
| #5 | Prover Registration | Core + Governance | ON時拡張 | ON時$QS | ✅（基本） |
| #6 | Prover Exit | Core + Governance | ON時拡張 | ON時$QS | ✅（基本） |
| #7 | Governance Proposal | Governance | 必須 | veQS必須 | ❌（条件付き） |
| #8 | Emergency Pause | Core + Governance | ON時拡張 | - | ✅（基本） |

### 3.2 Sequence実装の詳細

#### Core Layer固定（Sequence #1-4, #3'）

これらはモードに関わらず常に有効。Core Layerに実装：

```
Lock (#1)        → CoreBridge.lock()
Unlock (#2)      → CoreBridge.unlock()
Emergency (#3)   → CoreBridge.emergencyUnlock()
Resync (#3')     → CoreBridge.resync()
Challenge (#4)   → CoreSlashing.challenge()
```

#### モード依存（Sequence #5-8）

モードによって動作が変わる。以下の拡張仕様を適用：

| Sequence | Governance OFF | Governance ON |
|----------|---------------|---------------|
| #5 Prover Reg | Admin単独承認 | Council/自動承認 |
| #6 Prover Exit | Admin単独承認 | Council/自動承認 |
| #7 Governance | ❌ 無効 | ✅ veQS投票 |
| #8 Emergency | Admin単独Pause | SC 5/9 or マルチシグ |

### 3.3 L3基盤との対応

2025-12-28決議により、L3基盤は独自4ノードBFTチェーン（l3-aegis）を採用。
各SequenceはL3上で以下のように実装される：

| Sequence | L3での役割 |
|----------|-----------
| #1 Lock | L3トランザクションとして記録 |
| #2 Unlock | Prover署名がL3ブロックに記録 |
| #3 Emergency | Emergency Bond記録 |
| #4 Challenge | 署名否認防止（L3証拠） |
| #5-6 Prover | 登録/退出がL3状態に反映 |

---

## 4. CP保護トレーサビリティ

### 4.1 CP → 仕様書 → 戦略 → 実装 対応

| CP | 内容 | 仕様書定義 | 戦略での実現 | 実装Layer | 保護レベル |
|----|------|-----------|-------------|----------|-----------|
| CP-1 | 完全量子耐性 | UNIFIED §暗号 | Core Layer SHA3-256, Dilithium, SPHINCS+ | Core | IMMUTABLE |
| CP-2 | Self-Custody | UNIFIED §Self-Custody | Core Layer ユーザー署名検証 | Core | IMMUTABLE |
| CP-3 | Time Lock存在 | SEQ #2, #3 | Core Layer Time Lock強制 | Core | SUPERMAJORITY |
| CP-4 | Slashing存在 | SEQ #4 | Core Layer Quadratic Slashing | Core | SUPERMAJORITY |
| CP-5 | 透明性 | UNIFIED §透明性 | 全Layer Event発行 + L3記録 | All | SUPERMAJORITY |

### 4.2 CP保護の実装ガイドライン

```solidity
// IConstitutionLock.sol での保護レベル定義

enum ProtectionLevel {
    IMMUTABLE,      // CP-1, CP-2: 変更不可
    SUPERMAJORITY   // CP-3, CP-4, CP-5: 超多数決で変更可
}

// CP-1, CP-2 は ConstitutionLock.sol で強制
// CP-3, CP-4, CP-5 はパラメータとして定義し、超多数決ガード付き
```

### 4.3 L3基盤とCP保護

L3基盤（独自4ノードBFTチェーン）は以下のCPを強化：

| CP | L3による強化 |
|----|-------------|
| CP-1 | Dilithium-III + SPHINCS+の二重保護 |
| CP-5 | 全操作がL3ブロックに記録（透明性100%） |

---

## 5. セキュリティ要件マトリクス

### 5.1 仕様書要件 → Phase 3実装対応

| 仕様書要件 | 出典 | Phase 3実装 | 検証方法 |
|-----------|------|------------|---------|
| 24h Time Lock (Normal) | SEQ#2 Step8 | Core Layer `NORMAL_TIMELOCK` | Unit Test |
| 7d Time Lock (Emergency) | SEQ#3 Step5 | Core Layer `EMERGENCY_TIMELOCK` | Unit Test |
| Emergency Bond | SEQ#3 | Core Layer `calculateBond()` | Unit Test |
| Quadratic Slashing N²×10% | SEQ#4 | Core Layer `calculateSlash()` | Unit Test + Formal |
| 2/5 Prover署名 (SPHINCS+) | UNIFIED Phase1 | Core Layer + Prover検証 | Integration Test |
| 72h Emergency Timeout | SEQ#3 条件 | Core Layer `EMERGENCY_TIMEOUT` | Unit Test |
| 72h Pause上限 | SEQ#8 | Core + Governance | Scenario Test |
| VRF Prover選出 | SEQ#2 Step2-3 | Chainlink VRF統合 | Integration Test |
| HSM 2-of-3内部マルチシグ | UNIFIED Prover仕様 | Prover要件（オフチェーン） | Attestation |

### 5.2 セキュリティ検証チェックリスト

実装時に以下を確認：

- [ ] Time Lock値がハードコードされているか（0に変更不可）
- [ ] Slashing計算がQuadratic (N²×10%) に従っているか
- [ ] Emergency Bond計算が MAX(0.5 ETH, amount × 5%) か
- [ ] VRF統合がChainlinkを使用しているか
- [ ] 禁止アルゴリズム（keccak256, SHA-256, ECDSA）が混入していないか
- [ ] L3基盤がl3-aegis（独自BFT）を使用しているか

---

## 6. モード別 Sequence 有効性マトリクス

### 6.1 完全マトリクス

| Sequence | Core Only | +Gov(C) | +Gov(M) | +Gov(D) | +Tok(B) | +Tok(F) |
|----------|:---------:|:-------:|:-------:|:-------:|:-------:|:-------:|
| #1 Lock | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| #2 Unlock | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| #3 Emergency | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| #3' Resync | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| #4 Challenge | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| #5 Prover Reg | ✅(固定) | ✅(admin) | ✅(N/M) | ✅(auto) | ✅($QS) | ✅(veQS) |
| #6 Prover Exit | ✅(固定) | ✅(admin) | ✅(N/M) | ✅(auto) | ✅($QS) | ✅(veQS) |
| #7 Governance | ❌ | ❌ | ❌ | ✅ | ❌ | ✅(veQS) |
| #8 Emergency | ✅(admin) | ✅(admin) | ✅(N/M) | ✅(SC) | - | - |

**凡例**:
- Gov: C=CENTRALIZED, M=MULTISIG, D=DECENTRALIZED
- Tok: B=BASIC, F=FULL
- SC = Security Council

### 6.2 実装時の判断フロー

```
Sequence実装時:
    │
    ├─→ #1-4, #3': Core Layerに実装（モード不問）
    │
    └─→ #5-8: モード依存
            │
            ├─→ Core機能: Core Layerに実装（常時有効）
            │
            └─→ 拡張機能: Governance/Token Layerに実装
                        （各モードで条件分岐）
```

---

## 7. 衝突解決: 拡張仕様

### 7.1 Emergency Pause 拡張仕様（Sequence #8）

既存仕様書はPhase 2-4でSecurity Council 5/9を前提としているが、
Modular Architectureでは異なるガバナンスモードに対応が必要。

| Governanceモード | Pause権限 | 最大期間 | 延長方法 |
|-----------------|----------|---------|---------
| CENTRALIZED | Admin単独 | 72時間 | Admin判断 |
| MULTISIG | N/M承認（例: 3/5） | 72時間 | マルチシグ再承認 |
| DECENTRALIZED | SC 5/9 | 72時間 | Token Vote |

**実装ガイドライン**:

```solidity
// GovernanceSwitch.sol
function emergencyPause() external {
    GovernanceMode mode = getGovernanceMode();
    
    if (mode == GovernanceMode.CENTRALIZED) {
        require(msg.sender == admin, "Not admin");
    } else if (mode == GovernanceMode.MULTISIG) {
        require(isMultisigApproved(PAUSE_ACTION), "Multisig required");
    } else { // DECENTRALIZED
        require(isSecurityCouncilApproved(5, 9), "SC 5/9 required");
    }
    
    _pause(72 hours);
}
```

### 7.2 Prover Stake 拡張仕様（Sequence #5, #6）

既存仕様書はPhase別にStake通貨を定義（Phase 1: ETH, Phase 2+: $QS）。
Modular ArchitectureではTokenモードに対応が必要。

| Tokenモード | Stake通貨 | 最低Stake額 | 仕様書対応 |
|------------|----------|------------|-----------|
| DISABLED | ETH | $400K相当 | Phase 1準拠 |
| BASIC | $QS or ETH | $500K相当 | Phase 2拡張 |
| FULL | $QS必須 | $500K相当 | Phase 2+準拠 |

**実装ガイドライン**:

```solidity
// TokenSwitch.sol
function getStakeCurrency() external view returns (address) {
    TokenMode mode = getTokenMode();
    
    if (mode == TokenMode.DISABLED) {
        return address(0); // ETH
    } else {
        return qsTokenAddress; // $QS
    }
}

function getMinimumStake() external view returns (uint256) {
    TokenMode mode = getTokenMode();
    
    if (mode == TokenMode.DISABLED) {
        return 400_000 * 1e18; // $400K in ETH
    } else {
        return 500_000 * 1e18; // $500K in $QS
    }
}
```

### 7.3 Prover承認 拡張仕様（Sequence #5）

既存仕様書はPhase別に承認方式を定義。Modular Architectureでは両方に対応：

| Governanceモード | 承認方式 | 仕様書対応 |
|-----------------|---------|-----------
| CENTRALIZED | Admin単独承認 | Phase 1: 財団招待 |
| MULTISIG | N/M承認 + 自動条件 | Phase 2: Council 3/9 + 自動 |
| DECENTRALIZED | 自動承認（条件満たせば） | Phase 3+: 自動承認 |

**自動承認条件（全モード共通）**:
1. 最低Stake額を満たす
2. HSM使用の証明
3. 2-of-3マルチシグ設定
4. 稼働率SLA（99.5%）への同意
5. 法的契約書への署名

### 7.4 Governance Proposal 有効条件（Sequence #7）

Sequence #7（Governance Proposal）は以下の条件でのみ有効：

```
有効条件:
  Governance = DECENTRALIZED
  AND
  Token = BASIC or FULL（veQS投票のため）
```

それ以外のモード組み合わせでは、Sequence #7は無効（呼び出し不可）。

---

## 8. プロンプト参照ガイド

### 8.1 各プロンプトでの仕様書参照

| プロンプト | 参照すべき仕様書 | 参照タイミング |
|-----------|----------------|---------------|
| 01_plan | 本書（SPEC_STRATEGY_BRIDGE） | 計画立案時 |
| 02_spec | SEQUENCES（該当Sequence） | 仕様確認時 |
| 03_impl | SEQUENCES + 本書§7（拡張仕様） | 実装時 |
| 04_review | 本書§5（セキュリティ要件） | レビュー時 |
| 05_pir | 本書§4（CP保護） | PIR判定時 |
| 07_gonogo | UNIFIED_SPEC + 本書§2（Phase-Mode） | Go/No-Go時 |

### 8.2 クイックリファレンス

**Sequence実装時**:
```
Core機能（#1-4, #3'） → 常にCore Layer
モード依存（#5-8）   → 本書§3.2, §7を参照
```

**セキュリティ確認時**:
```
Time Lock       → SEQ#2, #3 + 本書§5
Slashing        → SEQ#4 + 本書§5
Emergency Pause → SEQ#8 + 本書§7.1
```

**CP保護確認時**:
```
CP-1, CP-2 → IMMUTABLE（Core Layer強制）
CP-3〜CP-5 → SUPERMAJORITY（パラメータ+ガード）
```

**L3基盤確認時**:
```
技術選定   → 本書§1.5 または L3_INFRASTRUCTURE_FINAL_DECISION
詳細仕様   → L3_CHAIN_SPECIFICATION.md
```

---

## 9. ビジネス戦略参照

> **Reference**: `docs/planning/DEVELOPMENT_STRATEGY_v2.0.md`

### 9.1 2本立てターゲット戦略

| Edition | Target | L3構成 | Prover | 重視点 |
|---------|--------|--------|--------|--------|
| **Enterprise** | 金融系システム会社 | 4ノード固定 | 許可制 | 安定性・規制対応 |
| **Decentralized** | DEX・ブリッジ等 | 段階的拡張 | 段階的Permissionless | 分散性・透明性 |

### 9.2 段階的分散化ロードマップ

> **Reference**: `docs/aegis/L3_CHAIN_SPECIFICATION.md` §9

| Phase | L3 Nodes | Prover | メンバーシップ |
|-------|----------|--------|---------------|
| 1-2 | 4 (QS運営) | 5社固定 | Static |
| 3 | 4 (SC管理) | SC承認制 | CouncilManaged |
| 4 | Permissionless | Permissionless | Stake-based |

> ⚠️ **2本立て設計（CEO指示 2025-01-01）**: Enterprise版は全Phaseで4ノード固定。Decentralized版のPhase 4でPermissionless。

### 9.3 コードベース共通化

```
l3-aegis（共通コードベース）
├── --membership=static    → Enterprise / Phase 1-2
├── --membership=council   → Phase 3
└── --membership=stake     → Phase 4 Decentralized
```

---

## 10. Implementation Component Traceability

> **Reference**: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

### 10.1 IC → Phase/Task マッピング

| IC-ID | Component | Phase | Checklist | Task IDs | Status |
|-------|-----------|-------|-----------|----------|--------|
| IC-1 | L3 Chain Infrastructure (4-node BFT) | 3.1 | `phase3.1.md` | Track A (L3 Chain) | 🟢 Complete |
| IC-2 | L3 Bridge Contract | 3.1 | `phase3.1.md` | CORE-001〜003 | 🟡 In Progress |
| IC-3 | Sequencer | 3.2 | `phase3.2.md` | SEQ-001〜008 | 🔴 Planning |
| IC-4 | State Management (SMT) | 3.1 | `phase3.1.md` | CORE-001 (CoreState) | 🟢 Complete |
| IC-5 | veQS Token | 3.2 | `phase3.2.md` | TOKEN-001〜014 | 🔴 Planning |
| IC-6 | ~~Node Expansion (4→7)~~ | - | - | - | ❌ **不要（CEO指示 2025-01-01）** |
| IC-7 | Permissionless Nodes | 4 | (Future) | - | ⚪ Future |

### 10.2 Phase 3サブフェーズ構造

```
Phase 3 (Month 10-18)
│
├── Phase 3.1: Foundation (Month 10-12)
│   ├── Checklist: docs/checklists/phase3.1.md
│   ├── IC-1: L3 Chain Infrastructure ✅
│   ├── IC-2: L3 Bridge Contract (CORE-001〜003) 🟡
│   └── IC-4: State Management ✅
│
├── Phase 3.2: Token + Implementation (Month 13-15)
│   ├── Checklist: docs/checklists/phase3.2.md
│   ├── IC-3: Sequencer拡張 (Multi-Sequencer)
│   ├── IC-5: veQS Token設計・実装
│   └── Governance Layer完全実装
│
└── Phase 3.3: Full Decentralization (Month 16-18)
    ├── Checklist: docs/checklists/phase3.3.md
    ├── ❌ IC-6: ~~Node Expansion (4→7)~~ 不要（CEO指示 2025-01-01）
    ├── Full Decentralization (Stage 3)
    └── Security Council Transition
```

### 10.3 IC完全性チェック

計画立案時（01_plan.md）に以下を確認：

```
[ ] 全IC-IDがチェックリストに対応タスクを持つか？
    → IC-1〜IC-6 がphase3.X.mdに紐付いているか確認
    
[ ] 新規タスクがIC-IDに紐付いているか？
    → 紐付いていない場合、UNIFIED_SPECへの追加を検討
    
[ ] Statusが更新されているか？
    → 実装開始時に🔴→🟡、完了時に🟢
```

### 10.4 チェックリスト参照ルール

| 作業 | 参照チェックリスト |
|------|-------------------|
| Phase 3.1タスク実行 | `docs/checklists/phase3.1.md` |
| Phase 3.2タスク実行 | `docs/checklists/phase3.2.md` |
| Phase 3.3タスク実行 | `docs/checklists/phase3.3.md` |
| IC-1, IC-2, IC-4 関連 | `phase3.1.md` |
| IC-3, IC-5 関連 | `phase3.2.md` |
| IC-6 関連 | `phase3.3.md` |

---

## 11. Go/No-Go判定ポイント

### 11.1 Phase 3サブフェーズ Go/No-Go

| 判定ポイント | 時期 | 必須条件 | 記録先 |
|-------------|------|---------|--------|
| Phase 3.1 → 3.2 | Month 12末 | L3 Chain稼働、Core Layer完了 | `GONOGO_PHASE3.1_*.md` |
| Phase 3.2 → 3.3 | Month 15末 | veQS Token稼働、第1回監査開始 | `GONOGO_PHASE3.2_*.md` |
| Phase 3 → 4 | Month 18末 | Full Decentralization達成 | `GONOGO_PHASE3_*.md` |

### 11.2 各サブフェーズの主要判定基準

**Phase 3.1 (Foundation)**:
- [ ] L3 Chain 4-node稼働
- [ ] Core Layer (CORE-001〜003) 完了
- [ ] Pluggable Layer基盤完了
- [ ] 全テストPASS

**Phase 3.2 (Token + Implementation)**:
- [ ] veQS Token (IC-5) デプロイ・動作
- [ ] Multi-Sequencer (IC-3) 動作
- [ ] Security Council 9名初期構成
- [ ] 第1回監査開始

**Phase 3.3 (Full Decentralization)**:
- [ ] ❌ ~~Node Expansion 4→7 (IC-6)~~ 不要（CEO指示 2025-01-01）
- [ ] Full Decentralization (Stage 3) 達成
- [ ] Security Council選出完了
- [ ] 第2回監査完了
- [ ] Bug Bounty Program稼働

---

## 12. 変更履歴

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2025-12-28 | 初版作成 |
| 1.1 | 2025-12-28 | L3基盤技術選定(2025-12-28決議)への参照を追加（§1.5） |
| 1.2 | 2025-12-29 | §9 ビジネス戦略参照、§10 IC Traceability追加 |
| 1.3 | 2025-12-30 | §10 IC→Phase/Taskマッピング更新、Phase 3サブフェーズ構造追加、§11 Go/No-Go判定ポイント追加 |
| 1.4 | 2025-01-01 | ❌ IC-6不要（CEO指示）、2本立て設計（Enterprise/Decentralized）反映 |

---

**END OF DOCUMENT**
