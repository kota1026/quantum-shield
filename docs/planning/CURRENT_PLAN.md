# Current Plan

> **Generated**: 2025-12-31 00:00 JST
> **Phase**: 3 - L3 + Token + 完全分散化
> **Sub-Phase**: 3.1 Foundation

---

## 対象チェックリスト

`docs/checklists/phase3.1.md`

---

## 仕様書参照（必須）

> 参照: `docs/planning/SPEC_STRATEGY_BRIDGE.md`

### 対象Sequence

| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| N/A (インフラ) | Core (L3 Chain) | L3_CHAIN_SPECIFICATION §10 |

### セキュリティ要件

| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| P2P通信暗号化 | L3_CHAIN_SPEC §4.4 | TLS 1.3 / mTLS |
| ノード認証 | L3_CHAIN_SPEC §4.4 | Dilithium署名 |
| 合意閾値 | L3_CHAIN_SPEC §3.1 | 3/4 (75%) |
| 障害耐性 | L3_CHAIN_SPEC §3.1 | f=1 (1/4) |

---

## 戦略準拠確認（Phase 3）

> 参照: `docs/planning/PHASE3_STRATEGY.md`

- [x] L3スタック: 独自L3 (l3-aegis) 前提
- [x] アーキテクチャ: Modular (Core/Governance/Token Layer)
- [x] リスク緩和: 網羅的テスト（4ノード合意動作確認）
- [x] モード制約: 開発モード（`--dev --nodes=4`）

---

## L3基盤確認（Phase 3のL3関連タスク）

> 参照: `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md`

- [x] 独自4ノードBFTチェーン前提か → ✅
- [x] l3-aegis (Rust) の範囲内か → ✅
- [x] SEQUENCES v2.0に準拠しているか → ✅ (インフラレイヤー)
- [x] CP-1/CP-5を満たしているか → ✅ (Dilithium-III, SHA3-256, 全操作記録)

---

## IC完全性チェック（Phase 3必須）

> 参照: `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` §Implementation Components

### 今回スコープのIC

| IC-ID | Component | タスク | Status |
|-------|-----------|--------|--------|
| IC-1 | L3 Chain Infrastructure (4-node BFT) | L3-006 | 🟡 In Progress |

### マスタ照合

- [x] 全IC-ID（IC-1〜IC-6）がPHASE3_PLANに対応セクションを持つ
- [x] 欠落ICなし

### タスク紐付け

- [x] 今回スコープの全タスクにIC-IDを付与した
- [x] IC-ID不要タスクは理由を明記した（N/A）

---

## 前回レビュー課題

> CURRENT_STATE.mdより: **該当なし**

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| - | - | 🎉 Critical/High課題なし | - |

**L3-005 PIR-P3.1-006 PASS**により、前提タスクは全て完了済み。

---

## 今回のスコープ

### タスク: L3-006 4-node local testnet構築

> 参照: `docs/aegis/L3_CHAIN_SPECIFICATION.md` §10

### 実装項目

- [ ] [IMPL-001] Docker Compose設定作成 (IC-1)
  - 4ノード構成（node0-3）
  - ネットワーク設定（aegis-network）
  - ボリューム設定（データ永続化）

- [ ] [IMPL-002] 起動スクリプト作成 (IC-1)
  - `scripts/run-local-network.sh`
  - 4ノード同時起動
  - ログ出力設定

- [ ] [IMPL-003] P2Pネットワーク接続実装 (IC-1)
  - 静的ピアリスト設定
  - TLS 1.3接続
  - ノード間通信確認

- [ ] [IMPL-004] コンセンサス動作統合 (IC-1)
  - PBFT Pre-prepare/Prepare/Commit
  - 3/4 quorum達成
  - View change機構

### テスト項目

- [ ] [TEST-001] 4ノード起動確認テスト
  - 全ノード正常起動
  - RPC応答確認
  
- [ ] [TEST-002] P2P接続確認テスト
  - ノード間接続数: 各ノード3接続
  - TLS暗号化確認
  
- [ ] [TEST-003] コンセンサス動作確認テスト
  - ブロック生成（5秒間隔）
  - 署名検証（Dilithium-III）
  - ブロック同期

- [ ] [TEST-004] 耐障害性テスト
  - 1ノードダウン時の継続動作
  - f=1 (3/4) で合意継続
  - ノード復帰後の同期

- [ ] [TEST-005] CP-1準拠確認テスト
  - Dilithium-III署名使用確認
  - SHA3-256ハッシュ使用確認
  - 禁止アルゴリズム不使用確認

### 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| 仕様書-戦略ブリッジ | `docs/planning/SPEC_STRATEGY_BRIDGE.md` | §1.5, §3.3 |
| L3詳細仕様 | `docs/aegis/L3_CHAIN_SPECIFICATION.md` | §3, §4, §10 |
| L3基盤決議 | `docs/aegis/meetings/L3_INFRASTRUCTURE_FINAL_DECISION_2025-12-28.md` | 全体 |
| 全体仕様 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` | §IC, §L3 Infrastructure |
| Phase 3.1チェックリスト | `docs/checklists/phase3.1.md` | Track A: L3-006 |

---

## 成果物

| ファイル | 説明 | IC-ID |
|---------|------|-------|
| `l3-aegis/docker/docker-compose.yml` | 4ノードDocker Compose設定 | IC-1 |
| `l3-aegis/scripts/run-local-network.sh` | ローカルネットワーク起動スクリプト | IC-1 |
| `l3-aegis/scripts/stop-local-network.sh` | ローカルネットワーク停止スクリプト | IC-1 |
| `l3-aegis/config/node0.toml` - `node3.toml` | 各ノード設定ファイル（更新） | IC-1 |
| `l3-aegis/tests/integration/four_node_test.rs` | 4ノード統合テスト | - |

---

## 実行順序

### Phase 1: Docker環境構築

1. **Docker Compose設定作成**
   - `docker-compose.yml` 作成
   - 4ノードサービス定義（aegis-node0〜3）
   - ネットワーク設定（aegis-network, bridge mode）
   - ボリューム設定（data永続化）

2. **Dockerfile確認・更新**
   - 既存Dockerfile確認
   - マルチステージビルド最適化
   - 実行イメージ軽量化

### Phase 2: ネットワーク設定

3. **ノード設定ファイル更新**
   - `node0.toml` - `node3.toml` にピアリスト追加
   - 静的ピア設定（TLS 1.3）
   - ポート設定（8001-8004, RPC: 9001-9004）

4. **P2P接続実装確認**
   - aegis-network クレートの接続確認
   - Dilithium署名によるノード認証
   - mTLS設定

### Phase 3: コンセンサス統合

5. **PBFT設定調整**
   - 4ノード用quorum設定（3/4）
   - タイムアウト設定（dev mode: 高速化）
   - View change設定

6. **署名統合確認**
   - Dilithium-III合意署名
   - 3/4署名収集
   - ブロック確定

### Phase 4: テスト実行

7. **起動テスト**
   ```bash
   ./scripts/run-local-network.sh
   docker ps  # 4コンテナ確認
   ```

8. **コンセンサステスト**
   ```bash
   cargo test --package aegis-consensus --test four_node_integration
   ```

9. **耐障害性テスト**
   ```bash
   docker stop aegis-node3  # 1ノード停止
   # 残り3ノードで合意継続確認
   docker start aegis-node3  # 復帰
   # 同期確認
   ```

10. **PIR準備**
    - テスト結果収集
    - ログ確認
    - CP-1準拠確認

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - Dilithium-III, SHA3-256のみ使用
- [x] CP-2: Self-Custody - L3はユーザー秘密鍵を保持しない
- [x] CP-3: Time Lock存在 - L1で24h/7日Time Lock（L3影響なし）
- [x] CP-4: Slashing存在 - L1でSlashing実行（L3影響なし）
- [x] CP-5: 透明性 - 全操作がL3ブロックに記録

---

## Modular Architecture確認（Phase 3）

- [x] Core Layer: L3 Chain Infrastructure（インフラ基盤）
- [ ] Governance Layer: N/A（本タスク対象外）
- [ ] Token Layer: N/A（本タスク対象外）
- [x] Layer間依存: なし（L3基盤は独立）

---

## 技術仕様サマリー

> 参照: `docs/aegis/L3_CHAIN_SPECIFICATION.md` §10

### 4ノードローカルモード設定

| 項目 | 値 |
|------|-----|
| ノード数 | 4 |
| 合意閾値 | 3/4 (75%) |
| 障害耐性 | f=1 |
| ブロック間隔 | 1秒（dev mode、本番は5秒） |
| View Change | 3秒（dev mode、本番は10秒） |
| メモリ使用量 | ~2GB（4ノード合計） |
| P2Pプロトコル | 独自TCP + TLS 1.3 |

### ポート割り当て

| ノード | P2Pポート | RPCポート |
|--------|----------|----------|
| node0 | 8001 | 9001 |
| node1 | 8002 | 9002 |
| node2 | 8003 | 9003 |
| node3 | 8004 | 9004 |

---

## リスク・懸念事項

| # | リスク | 重要度 | 対策 |
|---|--------|--------|------|
| 1 | Docker環境差異 | 🟡 Medium | CI/CDでの検証、README手順整備 |
| 2 | P2P接続タイムアウト | 🟡 Medium | retry機構、ログ出力強化 |
| 3 | メモリ不足（開発環境） | 🟢 Low | 最小2GB要件をREADME記載 |

---

## 完了基準（PIR判定基準）

### 基本基準（6項目）

| # | 基準 | 検証方法 |
|---|------|---------| 
| 1 | 4ノード同時起動成功 | `docker ps` で4コンテナ確認 |
| 2 | P2P接続確立 | 各ノード3ピア接続確認 |
| 3 | ブロック生成 | 高さ増加確認（RPC） |
| 4 | 合意達成 | 3/4署名確認 |
| 5 | テスト全PASS | `cargo test` 結果 |
| 6 | ログエラーなし | Docker logs確認 |

### L3基盤基準（4項目）

| # | 基準 | 検証方法 |
|---|------|---------|
| 7 | L3_CHAIN_SPECIFICATION §10準拠 | 設定値照合 |
| 8 | CP-1準拠 | アルゴリズム確認 |
| 9 | 耐障害性 | 1ノードダウンテスト |
| 10 | 復旧動作 | ノード復帰後同期確認 |

---

## 次のステップ（L3-006完了後）

| # | タスク | 優先度 |
|---|--------|--------|
| 1 | SETUP-003 Phase 2資産統合準備 | 🟠 High |
| 2 | CORE-001 State Manager基盤 | 🟠 High |
| 3 | エコシステム構築計画策定（CBO） | 🟠 High |

---

**END OF CURRENT PLAN**
