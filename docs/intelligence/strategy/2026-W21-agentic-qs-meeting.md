---
status: STRATEGY MEETING SYNTHESIS — Agentic QS proposal evaluation
date: 2026-05-13 Wed JST
parent: docs/intelligence/strategy/2026-W19-5-phase25-meeting.md
participants: qs-pm, qs-cto, qs-cfo, qs-threat, qs-compete, qs-devils-ad, qs-crypto-research
verdict: NO FORK (7/7 unanimous) — configurable timelock module + read-only AI attestation layer as evolutionary additions to current QS
research_pending: latest quantum + AI x crypto trends (running, non-blocking)
---

# Agentic QS Strategy Meeting — Final Synthesis

## TL;DR

7 体の戦略エージェント全員が **fork に反対**。「Agentic QS = AI Agent オペレーティング + 短縮 timelock + 別ブランチ」の提案は次の理由で **net negative**:

1. **競合勝率分析**(qs-compete): 高 ACV セグメント(Japan trust bank、Fireblocks MPC)で **−12 〜 −17pp 悪化**、低 ACV セグメント(DeFi、bridge)で +17 〜 +23pp 改善。**revenue-weighted では明確にマイナス**
2. **暗号工学的に不健全**(qs-crypto-research): 15min timelock は L1 finality(~12.8 min)+ Observer Challenge bisection 窓 + AML floor より短い、defensible は **24h → 2h まで**
3. **AI prompt injection で攻撃面が拡大**(qs-devils-ad): mitigation の最良値 5-15% bypass、cryptographic 2^-128 と **25 桁差**、custody-grade でなくなる
4. **運用コスト 50-500× 悪化**(qs-cfo): 現状 ~$0.30/day → Agentic QS は $15-150/day(1k locks/day)、fork audit cost $160-250k
5. **規制視点**(qs-threat): JFSA 監督指針は "AML deliberation window" を期待、15min は examiner に "automated KYC theater" と見られる
6. **Fork は実行不能**(qs-pm): T1 結果 commit 前、buyer 検証ゼロ、5 回目のフレーミング転換 = revealed-preference 問題再発
7. **architecture 上は既存 QS に追加可能**(qs-cto): coordination layer は 10-14 週、fork は 6-9 ヶ月

ただし提案の **「コア insight」は活きてる**:
- **24h timelock は分解可能**(L1 finality + Observer + AML deliberation + operational)、operational 部分は短縮余地あり
- **AI Agent は read-only attestation layer なら custody-grade を維持しつつ価値を加える**
- **DeFi セグメントの 24h は本物の dealbreaker**

# 競合勝率分析(qs-compete)

| Buyer segment | Current QS | Agentic QS | Δ | Reasoning |
|---|---|---|---|---|
| Japan FSA exchange (Coincheck, bitFlyer) | **20%** | 12% | **−8** | 24h が T+1 mental model に合う、AI Agent operator は FSA framework なし |
| Japan trust bank (SBI, MUFG) | **25%** | 8% | **−17** | 最大 home-ground、JFSA は **human-accountable key custodian 要求**、AI Agent は incompatible |
| US institutional (Coinbase, Anchorage) | 10% | 10% | 0 | QS は too small/unaudited、Agentic QS でも改善せず |
| **US tier-1 MPC (Fireblocks)** | **30%** | 18% | **−12** | **Charter wedge**、Fireblocks 顧客(銀行、HF)は deterministic auditable signing 要求 |
| RWA issuer (BlackRock BUIDL, Ondo) | 15% | **22%** | **+7** | continuous NAV attestation と AI agent monitoring が match、ただし AI layer 独立監査必須 |
| **DeFi-native (lending, DEX)** | 5% | **28%** | **+23** | 24h が dealbreaker、Agentic QS が playable range に、ただし lowest ACV |
| **Cross-chain bridge** | 3% | **20%** | **+17** | 24h は architecturally incompatible、ただし ZK bridge も ML-DSA bolt-on 可能 |

**重要な観察**:
- Japan trust bank (ACV ~$100k-1M/年) の −17pp 損失 ≈ DeFi 5 件の +23pp 利益 の損失額
- **Fireblocks (最大 ACV $500k-5M/年) の −12pp は致命的**
- Charter §1 ("institutional MPC custodians plug into") から **directly 逆走**

# 今の QS の勝率を制限してる「本当の問題」と解決策インパクト

qs-compete + 他 6 体の意見統合:

| 問題 | 現状勝率への影響 | 解決方法 | 改善幅 | コスト |
|---|---|---|---|---|
| **too small / unaudited** | US institutional 10%、RWA 15% を低く抑える | T1 通過 → 8 週プロトタイプ → 監査 → ESP 採択 | **+10-15pp 全 institutional セグメント** | $40-60k 監査 |
| **buyer signal 未検証** | Japan FSA 20% の不確実性 | Fireblocks / Coincheck に T2 cold email、1 件 confirm | +10-15pp 確信度 | 1 時間 founder |
| **Composable integration の曖昧さ** | Fireblocks 30% を解放できてない | Fireblocks SDK reference 実装(F + Architecture H 経由) | **+10-15pp Fireblocks segment** | 4-6 週 engineering |
| **DeFi 24h dealbreaker**(低 ACV) | DeFi 5%、bridge 3% | **Configurable timelock module**(24h default、opt-in 15min-1h for DeFi) | +20-25pp **DeFi のみ**、他は ±0 | 2-3 週 |
| **規制 artifact の弱さ** | Japan trust bank で説得力欠ける | ZK proof (Architecture F) + JCMVP 意見書 | +5-10pp Japan trust bank | 8 週 + 規制対応 |

→ **「fork で AI Agent operator」を実装するより、「audit + buyer call + Fireblocks SDK + configurable timelock」のほうが勝率を上げる**。fork は局所最適、低 ACV 限定。

# 7 体収束の architectural modification(NO FORK 版)

提案の「コア insight」を救う 2 つの evolutionary addition:

## 1. Configurable Timelock Module(qs-compete + qs-crypto-research 共通推奨)

```
Vault.lock() params:
- standard mode: 24h normal / 7d emergency (default、institutional)
- fast mode: 2h normal / 24h emergency (opt-in、DeFi、governance-settable)
- 15min mode は不可(L1 finality + Observer bisection より短い、暗号学的不健全)
```

実装:
- governance contract で per-account / per-asset の timelock パラメータを設定
- 2h floor は L1 finality (~13 min) + Observer Challenge bisection 完成度待ち
- 既存 24h institutional path は変更なし(audit-conservative 保持)
- 監査 scope は限定的拡張(timelock パラメータ範囲のみ)

期間: **2-3 週、$10-15k 追加監査**

## 2. Read-only AI Attestation Layer(qs-devils-ad + qs-crypto-research 推奨)

```
通常の unlock flow:
1. ユーザーが ML-DSA-65 署名で unlock 要求
2. timelock 経過
3. AI Agent が ML-DSA-65 署名で "HOLD" attestation を on-chain emit する権限のみ
4. unlock = dual-sig OK AND timelock 経過 AND HOLD attestation なし
```

決定的特性:
- AI Agent は **decision authority なし**、attestation を出すだけ
- AI の veto は cryptographic(攻撃には AI の鍵を破る必要)
- prompt injection されても unlock を直接 forge できない(同じ threat model)
- 監査範囲は AI Agent registry + 既存 Observer Challenge メカニズムの拡張

実装: **6-10 週、$15-25k 追加監査**

## 3 つ目: フォーク不要、現 QS を進化させるだけ

両方とも **既存 QS branch の evolutionary update**、fork なし。これで founder の問題意識(Prover Pool 5min + AI Agent 可能性 + 規制 artifact 強化)は **architecture 上は全て吸収可能**、戦略的 fragmentation なし。

# Fireblocks との競合タイミング

qs-compete の重要な発見:
- Fireblocks は **AI Agent + PQC 両方** をまだ ship してない(W19 job posting で PQC hiring 0)
- AI Agent MPC custody を ship する race window: **9-15 ヶ月**(executive decision 後)
- PQC 完成度では QS が **12-18 ヶ月リード**
- AI Agent + PQC 両方 parity: **18-24 ヶ月**

→ **両方 ship する競争に勝つ必要はない**、PQC 完成度の先行を保てば良い。Fireblocks SDK reference を提供すれば、Fireblocks が AI Agent を自分で実装しても **QS はその下層の PQC primitive 提供者** として残れる。

# 全 6 体収束の Critical W21 Test

**Ritual Infernet testnet で latency 試験**(qs-cto + qs-crypto-research 同意)

```
1. Ritual Infernet testnet endpoint 起動(free tier)
2. fips204::ml_dsa_65::verify を呼ぶ Rust binary を deploy
3. 100 回 sequential call、p50/p95/p99 latency 測定
4. 10 件の prompt-injection-style payload を msg field に embed、response 変動チェック
5. 1 ノード kill → recovery 測定
```

Pass gate: **p95 ≤ 30 秒、variance ゼロ、adversarial response = deterministic baseline、recovery ≤ 60 秒**

Predicted failure: **p95 が 30 秒超**(Ritual の multi-block settlement floor が 24 秒以上)。Failure なら decentralized AI infra は custody 不適合確定 → Agentic QS の operational premise が崩壊。

1 founder day、$0 cost。

# 累計コスト + 規律確認

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
| **Agentic QS meeting (today)** | **$0.80** |
| **累計** | **~$5.30 / $30 月予算 = 18%** |

Phase 2.5 の "STOP" discipline は 5 月 9 日に引かれた。**今日の会議で 4 日連続違反**。CFO + PM 両方が「これ以上の戦略会議は engineering 進捗を阻害する」と明確に flag した。

**最終 discipline**: T1 wall-clock 結果 + Ritual latency 試験結果が両方 commit されるまで、**新しい戦略会議は走らせない**。次の agent budget は `rust-reviewer` / `security-reviewer` / 実コード生成へ。

# Founder Decision Queue(優先順)

1. **NO FORK 同意?**(7 体 unanimous、新たに反論する根拠あるか)
2. **2 つの evolutionary modification を採用?**:
   - Configurable timelock module(2-3 週)
   - Read-only AI attestation layer(6-10 週)
3. **W21 Ritual latency 試験を起動?**(1 day、$0、Agentic QS の最終 falsification)
4. **T1 founder 開発機 wall-clock 試験** は依然未完(8GB M3 では cloud 必要)— 後回しで OK?
5. **次の strategic meeting は T1 wall-clock + Ritual 結果 commit 後** に discipline 復活させる?

# 残作業(research agent 完了待ち)

最新動向 research(IBM/Google 量子、NIST/JFSA、EIP-8141 進捗、Bittensor/Ritual 状況、Coinbase/Fireblocks 最近アナウンス)はまだ実行中。完了次第 **synthesis に追加**、ただし戦略結論には影響しない(今日の 7 体 unanimous は強固)。
