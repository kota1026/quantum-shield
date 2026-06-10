---
status: ENGINEERING DECISION (not requiring strategy meeting per Phase 2.5 discipline)
date: 2026-05-13
parent: docs/intelligence/strategy/2026-W19-5-phase25-meeting.md
trigger: founder confirmed F+H hybrid + level III fixed (Sun 2026-05-10 ~JST evening)
authority: founder
---

# Architecture F+H Hybrid — Engineering Addendum

## 決定

QS Path A の cost-optimization layer 設計を次の通り確定:

1. **Architecture F + H ハイブリッド** を採用(F のみではない)
2. **NIST FIPS 204 ML-DSA-65 (security level III)** に固定

## なぜこの組み合わせか

### F のみだと取りこぼす場面
- 単一署名 verify を level II で済ませたい custodian → EIP-8051 precompile (~4,500 gas) を使いたいが F 単独設計では precompile に経路を持たない
- EIP-8051/8052 が Glamsterdam(または後継 fork)で出荷した場合に、QS が precompile の恩恵を自動的に受け取れない

### H を追加すると
ルーティング契約 1 つで全ケースをカバー:

```
署名検証ルーティング:
├── 単一署名 + level II OK? → EIP-8051 precompile (~4,500 gas)
├── 単一署名 + level III 必須 → F at N=1 (~270k gas)
├── batch ≥ 4 + level III → F at N=4 (~67k gas/sig)
└── batch ≥ 256 + level III → F at N=256 (~1,055 gas/sig)
```

precompile が未出荷でも F が cover、出荷後は H が precompile に切り替える。

## level III 固定の根拠

| 出典 | 内容 |
|---|---|
| `docs/intelligence/strategy/2026-W19.md` | W19 戦略メモが ML-DSA-65 を確定 |
| `.claude/charter.md` §2 | Hard rule として ML-DSA-65 を指定 |
| `docs/intelligence/strategy/2026-W19-5-phase25-meeting.md` qs-threat | CNSA 2.0 institutional default は level III、JFSA も level 未指定だが level III が defensible |

EIP-8051 が level II 限定なので、QS が level III 固定である限り precompile の直接恩恵は限定的。それでも H パターンで「将来 level III precompile が出たら自動切替」できる柔軟性は維持。

## なぜ strategy meeting を開かないか

Phase 2.5 synthesis で **「STOP all strategic meetings until T1 result is committed」** と discipline を引いた。F+H は:

1. **architecture choice の修正ではなく拡張** — F の base design は不変、ルーティング契約 1 つ追加するだけ
2. **engineering-level decision** — strategic optimization の数値比較で結論が出る、6 体の strategic agents の追加レビュー不要
3. **追加コスト最小** — H のコストは routing contract 1 つ、F の audit scope を実質的に増やさない

→ Phase 2.5 discipline と矛盾しない。

## 次に必要な工程

### Immediate (founder)
- 開発機の RAM 確認(Q1 from earlier — まだ未回答)
  - 32GB+ → 自分で T1 再現可能
  - 16GB → クラウド機械必要

### T1 reproduction
- founder hardware で `cargo run --release -- --execute` 実行 → cycle count = 2,739,124 ぴったりか確認(determinism check)
- ≥32GB 機械で `cargo run --release -- --prove` 実行 → wall-clock 計測
  - ≤30s → **PASS** → T1.5 (N=4 prove ≤5min) へ
  - 30-60s → **MARGINAL** → granularity 再考
  - >60s → **FAIL** → A-only 退却

### T1.5 (after T1 PASS)
- N=4, N=16, N=64 で prove 時間計測
- 線形 vs super-linear 判定
- N=256 想定の最終評価

### F+H 設計実装(T1.5 通過後)
- F は既に T1 で substrate 確認済み
- H = routing contract Solidity 設計(EIP-8141 ratification 状況次第で先送り可)
- ルーティングロジック:
  - L1 Vault が caller の希望(level + batch size)を受け取る
  - precompile 経路 / F 経路 / fallback 経路を分岐
  - EIP-8051/8052 出荷確認は constructor 時の chain-id + block-number チェックでオン/オフ

## 影響を受ける既存ドキュメント(後で更新)

- `docs/intelligence/strategy/2026-W19-5-phase25-meeting.md` — "F のみ" を "F+H" に表現修正
- `docs/intelligence/research/2026-W19-crypto-optimization-deep.md` §6 — Architecture H の詳細設計を追記
- `docs/grants/EF_ESP_APPLICATION.md`(将来再提出時) — F+H として narrative 統一

これらは founder review 待ち、優先度低。Engineering 進行を妨げない。
