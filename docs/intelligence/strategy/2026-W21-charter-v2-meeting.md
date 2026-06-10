---
status: STRATEGY MEETING SYNTHESIS — Charter v2 evaluation (7/7 NO FORK with packaging update)
date: 2026-05-13 Wed JST
parent: docs/intelligence/strategy/2026-W21-agentic-qs-meeting.md
participants: qs-pm, qs-cto, qs-cfo, qs-threat, qs-compete, qs-devils-ad, qs-crypto-research
verdict: NO FORK + adopt Principle 9 (EigenLayer AVS packaging) + evolutionary modifications
research_context: docs/intelligence/research/2026-W21-quantum-ai-pulse.md
---

# Charter v2 Strategy Meeting — Final Synthesis

## TL;DR

founder proposed Charter v2 ("AI Agent native" frame: buyer = AI Agent operator, settlement = sub-15min, infrastructure = decentralized AI required, fork as QS Ver 2.0). 7 agents evaluated under explicit v2 principles.

**Verdict: 7/7 MODIFY (no fork)**. Founder の市場観察は正しいが、対応は "fork" ではなく **"packaging 変更"**:

- **Principle 9 追加**: QS を **EigenLayer AVS primitive として packaging**(standalone custody product ではない)
- **2h cryptographic timelock floor**(15min は L1 finality + Observer Challenge + AML floor すべて違反、不可能)
- **Sentient ROMA V2 を required infra から REJECT**(research-stage、custody-grade ではない)
- **EigenLayer AVS は production-deployable**(slashing は live、$18B TVL distribution)
- **4 週間 move = Holesky AVS POC**(既存 Sepolia contracts wrapping、prior art 確保)

これで v1 institutional buyer + v2 agentic buyer **両方が同じ AVS packaging で対応可能**。Fork 不要、bandwidth 分散なし、audit cost 倍化なし。

# 全 7 体の verdict と核心 finding

| Agent | Verdict | 単一最重要 finding |
|---|---|---|
| **qs-pm** | MODIFY | "480k Coinbase agents = tx-count、operator-count ではない"。新発見: EigenLayer AVS を b2b2b primitive にすると Coinbase 競合回避可能 |
| **qs-cto** | MODIFY | **最低 timelock 2 時間**(15min は L1 finality 12.8 分 + Observer bisection 30 分 + AML 2h floor すべて違反)。SP1 wall-clock 試験が #1 engineering gate |
| **qs-cfo** | MODIFY | ESP EV: v1 $2,200/h > v2 $1,650/h(差 $8,250)。**Per-tx fee model は 2027 ではなく 2028 から**。Sentient ROMA V2 は dependency にしてはいけない |
| **qs-threat** | MODIFY | **CRQC 期待値 2030-2037 に圧縮**(中央値 2033)。v1 は JFSA/DORA/CNSA 2.0 に直接 map、v2 はゼロ。JFSA Innovation Hub への先制 position paper が "set the standard" の機会 |
| **qs-compete** | MODIFY | **v2 win rate は広いが ACV 低い**。Coinbase 2026 末出荷の 7-10 ヶ月 window。**4 週 move = EigenLayer AVS デプロイ** で prior art lock |
| **qs-devils-ad** | MODIFY | **最強反論: v2 は 1 つの未検証仮説から別の未検証仮説への lateral move、runway 焼きながら**。Defang: cold outreach + Ritual latency 両方を W21 中に並走 |
| **qs-crypto-research** | MODIFY | **Sentient ROMA V2 を REJECT**。EigenLayer AVS slashing は production-deployable、ただし **operator 鍵 rotation の AVS 7-day exit delay** が 6-month audit 遅延リスク |

# v2 vs v1 Win Rate(qs-compete)

| Segment | v1 win % | v2 win % | Δ | Notes |
|---|---|---|---|---|
| **Japan trust bank**(最高 ACV) | 25% | 6% | **−19** | AI Agent operator frame と incompatible |
| **Fireblocks**(charter wedge) | 30% | 22% | **−8** | "PQC on top of MPC" framing は維持、ただし internally build 圧力 |
| Japan FSA exchange | 20% | 8% | −12 | v2 frame 範囲外 |
| US institutional custody | 10% | 5% | −5 | Coinbase が internal build |
| **RWA issuer agentic** | 15% | **28%** | **+13** | Ondo agentic NAV、real new use case |
| **DeFi-native** | 5% | **32%** | **+27** | Configurable timelock module 必須 |
| Cross-chain bridge | 3% | 22% | +19 | 同上 |
| Coinbase Agentic Wallets ecosystem(new) | — | 15% | +15 | Coinbase が in-house build、QS は attestation layer above |
| x402 / Agentic.market infra(new) | — | 20% | +20 | Linux Foundation governance、PQC primitive 未存在 |
| MEV searcher fleets(new) | — | 10% | +10 | EIP-8051 出荷後 |
| **EigenLayer AVS as QS packaging**(new) | — | **18%** | **+18** | **280+ AVS projects が trust-minimized comp 求める、PQC AVS ゼロ** |
| JP-side agent custody(new) | — | 5% | +5 | 2027 以降 |

**Aggregate revenue-weighted**:
- v1: Japan trust bank + Fireblocks の高 ACV 2 segment が dominant → 22-28% 期待値
- v2: 広いが低 ACV → DeFi integration fee $10k-100k/年 vs Fireblocks $500k-5M/年

**正直な数字**: v2 は **closure 確率が高いが、近期 revenue-weighted EV は v1 を下回る**(Fireblocks が bite した場合)。長期は v2 が ecosystem growth narrative で勝つ可能性。

# Pricing reality check(qs-compete + qs-cfo)

founder の "480k agents × $0.01/settlement × 100/day = $175M/year" 計算は **defensible ではない**:

- Coinbase Agentic Wallets: 3 ヶ月で 480k agents、累計 $50M volume = **agent あたり累計 $35 のみ**(per day ではない)
- QS が 1bp 手数料取れたとして 3 ヶ月で $5,000 = "not a business"

**現実的 revenue model**: B2B per-protocol fee(per-transaction ではない)
- Target = protocol operator(DeFi protocol、RWA issuer、bridge)、agent 個別ではない
- 価格: $20k-100k/年 per protocol(regulatory compliance certification)
- 18 months target: 5 protocols = **$100k-500k ARR**

これは v1 institutional ACV($500k-5M)より小さい、ただし confirmation 確率は高い。

# qs-devils-ad の最強反論 + defang

**「Charter v2 は 30% 理論勝率の institutional path を捨てて、0% 検証の agent path に lateral move。両方 buyer 未検証のまま runway 焼く」**

これが今日の最重要 epistemological 観察。W19 から数えて **5 回のフレーム転換**(standalone PQC chain → composable MPC layer → A+C hybrid → F+H read-only attestation → Agentic QS v2 fork)、一度も buyer 検証してない。devils-ad 曰く「strategic elegance への最適化、buyer confirmation の avoidance」。

**Defang**: 今後 1 週間で **同時並列**:
1. Fireblocks API team への cold email("2026 PQC roadmap に third-party attestation primitive slot あるか")
2. AI Agent operator 5 件への cold email("$500/month for ML-DSA-65 attestation、interested?")
3. Ritual Infernet latency 試験
4. SP1 wall-clock 試験(クラウド機械)

これで **どの frame が現実か** をデータで決める、もう strategy meeting で議論しない。

# 真の解 = Principle 9: EigenLayer AVS packaging

qs-pm + qs-compete + qs-crypto-research が独立に到達:

> **QS を "standalone custody product" ではなく "EigenLayer AVS primitive" として packaging**

これだと:
- v1 institutional buyer も使える(Fireblocks が AVS を取り込む)
- v2 agentic buyer も使える(ElizaOS / ROMA V2 が AVS 経由で integration)
- Coinbase が standalone custody 出荷しても QS は **competing layer ではなく underlying primitive**
- EigenLayer $18B TVL の distribution moat を借りられる
- 280+ AVS projects が "trust-minimized computation" を求めている、**PQC attestation AVS はゼロ**

これは **フレーム変更 でも fork でもなく packaging 変更**。

## Charter v1.1 追加 principle

```
Principle 9: Package as composable AVS primitive, not standalone custody product

QS の value は cryptographic attestation primitive そのもの。
standalone custody product として Coinbase / Fireblocks と competing するのではなく、
EigenLayer AVS として登録、agentic infrastructure operators(ElizaOS、ROMA V2)から
institutional MPC custodians(Fireblocks、Anchorage)まで共通の under-layer を提供する。
```

# 4 週間アクション(具体)

| Week | Action | Falsifiable output | Cost |
|---|---|---|---|
| **W21** | (a) SP1 wall-clock 試験(クラウド ~$5)+ (b) Ritual Infernet latency 試験(1 日、$0)+ (c) 5 件 cold email(Fireblocks + AI Agent operators) | 3 件データ commit | ~$5 + 1 week founder |
| **W22** | EigenLayer AVS minimal POC(既存 Sepolia contracts wrapping、Holesky deploy、ElizaOS / ROMA V2 GitHub issue) | Holesky contract address + GitHub repo + 2 通 outreach | 1 founder week |
| **W23** | ESP application v1 narrative で submit(15h、$2,200/h EV) | application 提出完了 | 15 founder h |
| **W24** | Sentient Foundation BD outreach(Sandeep Nailwal、Himanshu Tyagi) | 1 件 meeting 取得 or 拒否 | 4-6 founder h |

総 founder 時間 ~2-3 週間 / 累計コスト ~$10。Phase 2.5 で commit した F+C 路線と並行可能。

# Hegotia → Hegotá 訂正(research finding)

EIP-8141 が想定される fork の正式名称は **"Hegotá"**(末尾アキュート)、QS docs の **"Hegotia" は誤記**。grep -rn 'Hegotia' で 4 箇所要修正、後で grep + sed で一括対応。

# 累計コスト + 規律強化

| Phase | コスト |
|---|---|
| W19.5 audit | $0.50 |
| Tier-2 research | $1.20 |
| Phase 2.4 meeting | $0.60 |
| Phase 2.1b EF alignment | $0.30 |
| crypto-research deep dive | $0.30 |
| Phase 2.5 meeting | $0.70 |
| T1 SP1 spike | $0.50 |
| T1.5 scaling | $0.00 |
| Cycle count benchmarks | $0.40 |
| Agentic QS meeting | $0.80 |
| Latest quantum/AI research | $0.40 |
| **Charter v2 meeting (today)** | **$1.00** |
| **累計** | **~$6.70 / $30 月予算 = 22%** |

cfo の hard stop assertion: **「This paper is the last strategy meeting this week」**。次の agent budget は engineering(rust-reviewer、security-reviewer、AVS POC コード生成)に回す。

新しい discipline:
- ✋ **STOP strategic meetings until 3 つの試験データ commit**(SP1 wall-clock + Ritual latency + buyer cold-email response)
- ✅ Permitted agent invocations: code review、AVS POC engineering、ESP rewrite

# Founder decision queue

1. **NO FORK + Principle 9 (EigenLayer AVS packaging) 採用?**(7/7 unanimous、新たに反論あるか)
2. **Charter v1.1 として明文化**(Principle 9 追加 + Hegotia → Hegotá 訂正)?
3. **4 週間 action plan を実行?**(W21 試験 → W22 AVS POC → W23 ESP submit → W24 Sentient outreach)
4. **次の戦略会議は 3 試験データ commit 後** に discipline 復活確定?

founder の市場観察(POC → 商用、AI Agent 主役)は **核心的に正しかった**。ただし対応は frame 変更 + fork ではなく、**Principle 9 追加 + 既存 architecture の AVS packaging**。これで founder の insight を charter に組み込みつつ、6 月間の strategic investment を無駄にしない。
