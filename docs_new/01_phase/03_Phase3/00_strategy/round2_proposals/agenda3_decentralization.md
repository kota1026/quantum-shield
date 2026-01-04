# Round 2: 提案フェーズ - 議題3: 分散化設計

> **日時**: 2025-12-28
> **議題**: 分散化戦略（Security Council + DAO）
> **可決条件**: 過半数（6票/11票）

---

## 1. 分散化ロードマップ

### 提案3-A: 段階的分散化（推奨）

```
┌─────────────────────────────────────────────────────────────┐
│                Decentralization Roadmap                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Phase 3 (Month 10-18): Foundation                          │
│  ├── Team-controlled multisig                               │
│  ├── Security Council formation                             │
│  └── Token distribution begins                              │
│                                                             │
│  Phase 4 (Month 19-24): Transition                          │
│  ├── Security Council takes over                            │
│  ├── veQS governance activated                              │
│  └── Sequencer decentralization begins                      │
│                                                             │
│  Phase 5 (Month 25+): Full Decentralization                 │
│  ├── DAO full control                                       │
│  ├── Decentralized sequencer network                        │
│  └── Team multisig sunset                                   │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Timeline                                            │   │
│  │                                                      │   │
│  │  Phase 3        Phase 4        Phase 5              │   │
│  │  ────────────   ────────────   ────────────────►    │   │
│  │  Team Control → SC Control  → DAO Control           │   │
│  │  Month 10       Month 19       Month 25+            │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| フェーズ | 期間 | 制御主体 | 主要アクション |
|---------|------|---------|--------------|
| Phase 3 | M10-18 | Team | SC形成、トークン配布 |
| Phase 4 | M19-24 | Security Council | ガバナンス移行 |
| Phase 5 | M25+ | DAO | 完全分散化 |

**支持エージェント**: 全員

---

## 2. Security Council設計

### 提案3-B: 7名評議会（推奨）

```
┌─────────────────────────────────────────────────────────────┐
│                   Security Council                           │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Structure: 7 Members                                       │
│  ├── 3 Internal (Team/Foundation)                          │
│  ├── 2 External Experts (Security/Crypto)                  │
│  └── 2 Community Representatives (veQS elected)            │
│                                                             │
│  Thresholds:                                                │
│  ├── Normal Operations: 4/7 (57%)                          │
│  ├── Emergency Actions: 5/7 (71%)                          │
│  └── Critical Changes: 6/7 (86%)                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Powers Matrix                           │   │
│  │                                                      │   │
│  │  Action               │ Threshold │ Time Lock       │   │
│  │  ─────────────────────────────────────────────────  │   │
│  │  Emergency Pause      │   4/7     │   None          │   │
│  │  Parameter Update     │   5/7     │   48 hours      │   │
│  │  Contract Upgrade     │   5/7     │   7 days        │   │
│  │  Treasury < $100K     │   4/7     │   24 hours      │   │
│  │  Treasury > $100K     │   5/7     │   7 days        │   │
│  │  Member Replacement   │   5/7     │   14 days       │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  ⛔ PROHIBITED (CP Protection):                             │
│  ├── CP-1: Crypto algorithm changes                        │
│  ├── CP-3: Time Lock reduction                             │
│  ├── CP-4: Slashing mechanism removal                      │
│  └── These require DAO vote + 30-day Time Lock             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| パラメータ | 値 | 根拠 |
|-----------|-----|------|
| メンバー数 | 7名 | CSO推奨 |
| 通常閾値 | 4/7 | 運用効率 |
| 緊急閾値 | 5/7 | セキュリティ |
| 任期 | 2年 | 継続性 |
| 再選 | 1回まで | 新陳代謝 |

### 地理的分散要件

| 要件 | 仕様 |
|------|------|
| 単一国家上限 | 最大3名 |
| タイムゾーン | 最低3つ |
| 言語 | 英語必須 + 他言語推奨 |

**支持エージェント**: CSO, Purpose Guardian, Legal

---

## 3. DAO設計

### 提案3-C: veQS Governance

```
┌─────────────────────────────────────────────────────────────┐
│                    DAO Governance                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Proposal Flow:                                             │
│                                                             │
│  1. Discussion (Forum)                                      │
│     └── 7 days minimum                                      │
│                                                             │
│  2. Temperature Check (Snapshot)                            │
│     └── 3 days, 1% veQS quorum                             │
│                                                             │
│  3. Formal Vote (On-chain)                                  │
│     └── 7 days, 4% veQS quorum                             │
│                                                             │
│  4. Time Lock                                               │
│     └── 2-30 days (depending on type)                      │
│                                                             │
│  5. Execution                                               │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Voting Parameters                       │   │
│  │                                                      │   │
│  │  Parameter              │ Value                      │   │
│  │  ───────────────────────────────────────────────    │   │
│  │  Proposal Threshold     │ 0.5% veQS                  │   │
│  │  Quorum                 │ 4% veQS                    │   │
│  │  Approval               │ >50% of votes              │   │
│  │  Max Voting Power       │ 5% per address             │   │
│  │  Delegation             │ Allowed                    │   │
│  │  Vote Locking           │ Until proposal ends        │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| パラメータ | 値 | 根拠 |
|-----------|-----|------|
| 提案閾値 | 0.5% veQS | アクセス容易 |
| 定足数 | 4% veQS | 正当性確保 |
| 承認 | 過半数 | 標準的 |
| 最大投票権 | 5%/アドレス | 51%攻撃防止 |

**支持エージェント**: CFO, CBO, Researcher

---

## 4. CP保護メカニズム

### 提案3-D: 憲法ロック（Purpose Guardian必須要件）

```
┌─────────────────────────────────────────────────────────────┐
│                CP Protection Mechanism                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ⛔ IMMUTABLE (変更不可):                                   │
│  ├── CP-1: 量子耐性暗号の使用                               │
│  └── CP-2: Self-Custody原則                                │
│                                                             │
│  🔒 SUPER-MAJORITY REQUIRED (変更に超多数決):               │
│  ├── CP-3: Time Lock最小値（24h以上）                       │
│  ├── CP-4: Slashing存在義務                                │
│  └── CP-5: 透明性要件                                       │
│                                                             │
│  Requirements for CP-3/4/5 Changes:                         │
│  ├── 75% veQS approval                                      │
│  ├── 30-day Time Lock                                       │
│  ├── Security Council 6/7 approval                         │
│  └── External security audit                                │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │            Constitution Lock Contract                │   │
│  │                                                      │   │
│  │  contract ConstitutionLock {                        │   │
│  │      // CP-1, CP-2: Immutable                       │   │
│  │      bool public constant QUANTUM_REQUIRED = true;  │   │
│  │      bool public constant SELF_CUSTODY = true;      │   │
│  │                                                      │   │
│  │      // CP-3, CP-4, CP-5: Super-majority changeable │   │
│  │      uint256 public minTimeLock = 24 hours;         │   │
│  │      bool public slashingEnabled = true;            │   │
│  │      bool public transparencyRequired = true;       │   │
│  │                                                      │   │
│  │      function updateCP(...)                         │   │
│  │          requires 75% veQS                          │   │
│  │          requires 6/7 SC                            │   │
│  │          requires 30-day timelock                   │   │
│  │          requires external audit;                   │   │
│  │  }                                                  │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

| CP | 変更可否 | 要件 |
|----|---------|------|
| CP-1 | ❌ 不可 | コード内immutable |
| CP-2 | ❌ 不可 | コード内immutable |
| CP-3 | ⚠️ 超多数決 | 75% veQS + 6/7 SC + 30日 |
| CP-4 | ⚠️ 超多数決 | 75% veQS + 6/7 SC + 30日 |
| CP-5 | ⚠️ 超多数決 | 75% veQS + 6/7 SC + 30日 |

**Purpose Guardian評価**:
> ✅ **承認**
> 
> CP-1とCP-2のimmutable化は必須要件を満たしている。
> CP-3/4/5の変更に超多数決 + 長期Time Lockを要求することで、
> 軽率な変更を防止できる。
> 
> **拒否権行使なし**

---

## 5. 緊急対応プロトコル

### 提案3-E: Emergency Response

```
┌─────────────────────────────────────────────────────────────┐
│                Emergency Response Protocol                   │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Severity Levels:                                           │
│                                                             │
│  🔴 CRITICAL (Active exploit, fund loss)                    │
│  ├── Action: Immediate pause                                │
│  ├── Authority: Any 4/7 SC members                         │
│  ├── Time Lock: None                                        │
│  └── Post-action: 24h report required                       │
│                                                             │
│  🟠 HIGH (Vulnerability discovered)                         │
│  ├── Action: Selective pause + fix                         │
│  ├── Authority: 5/7 SC members                             │
│  ├── Time Lock: 24 hours                                   │
│  └── Post-action: 48h report required                       │
│                                                             │
│  🟡 MEDIUM (Potential issue)                                │
│  ├── Action: Enhanced monitoring + patch                    │
│  ├── Authority: 5/7 SC members                             │
│  ├── Time Lock: 7 days                                     │
│  └── Post-action: Weekly report                             │
│                                                             │
│  Recovery Process:                                          │
│  ├── 1. Incident response (immediate)                       │
│  ├── 2. Root cause analysis (24-48h)                       │
│  ├── 3. Fix development (depends)                          │
│  ├── 4. Security audit (1-2 weeks)                         │
│  ├── 5. Staged rollout (1 week)                            │
│  └── 6. Post-mortem (public, 30 days)                      │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**支持エージェント**: CSO, Red Team, DevOps

---

## エージェント別投票予告

| エージェント | ロードマップ | SC | DAO | CP保護 | 緊急対応 |
|------------|------------|-----|-----|--------|---------|
| Purpose Guardian | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 |
| CTO | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 |
| CSO | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 |
| CFO | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 |
| CBO | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 |
| Engineer | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 |
| Crypto Auditor | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 |
| Red Team | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 |
| Researcher | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 |
| DevOps | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 |
| Legal | 🟢 | 🟢 | 🟢 | 🟢 | 🟢 |

**予測結果**: 全会一致（11/11）

---

**議題3 Round 2: COMPLETE**
