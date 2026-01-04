# PIR-IC-2: CoreLayer (L3 Bridge Layer) セキュリティレビュー

> **Date**: 2026-01-03 22:00 JST  
> **Reviewer**: Red Team Agent  
> **Status**: ⚠️ **CONDITIONAL PASS**

---

## 1. レビュー対象

| 項目 | 値 |
|------|-----|
| **対象Plan** | IC-2 CoreLayer (L3 Bridge Layer) |
| **対象Sequence** | #1 Lock, #2 Unlock (Normal), #3 Unlock (Emergency), #3' Resync |
| **実装日時** | 2026-01-03 21:20 JST |
| **作成ファイル** | 5件 |

### 作成ファイル一覧

| ファイル | サイズ | 内容 |
|----------|--------|------|
| `l3-aegis/src/core/CoreLayer.sol` | 12,801 bytes | Bridge Layer実装 |
| `l3-aegis/src/interfaces/ICoreLayer.sol` | 5,942 bytes | インターフェース定義 |
| `l3-aegis/test/CoreLayer.t.sol` | 14,720 bytes | Unit Tests (24 tests) |
| `l3-aegis/test/interfaces/ICoreLayer.t.sol` | - | Interface Tests (5 tests) |
| `l3-aegis/test/e2e/*.sol` | - | E2E Tests (Mock使用) |

---

## 2. 仕様書要件確認（SPEC_STRATEGY_BRIDGE §5）

| 要件 | 出典 | 実装確認 | 結果 |
|------|------|---------|:----:|
| 24h Time Lock (Normal) | SEQ#2 | `CoreLayer.sol:L22 NORMAL_TIMELOCK = 24 hours` | ✅ |
| 7d Time Lock (Emergency) | SEQ#3 | `CoreLayer.sol:L25 EMERGENCY_TIMELOCK = 7 days` | ✅ |
| Emergency Bond計算 | SEQ#3 | `MAX(0.5 ETH, amount × 5%)` 実装済み | ✅ |
| Quadratic Slashing | SEQ#4 | CoreSlashingで実装予定（本コントラクト外） | ⚠️ N/A |
| 72h Emergency Timeout | SEQ#3 | `CoreLayer.sol:L28 EMERGENCY_TIMEOUT = 72 hours` | ✅ |
| 72h Pause上限 | SEQ#8 | GovernanceSwitchで実装済み | ⚠️ N/A |

---

## 3. Sequence-Layer整合性

| 対象Sequence | 期待Layer | 実装場所 | 結果 |
|-------------|----------|---------|:----:|
| #1 Lock | Core | `src/core/CoreLayer.sol:lock()` | ✅ |
| #2 Unlock (Normal) | Core | `src/core/CoreLayer.sol:unlock()` | ✅ |
| #3 Unlock (Emergency) | Core | `src/core/CoreLayer.sol:emergencyUnlock()` | ✅ |
| #3' Resync | Core | `src/core/CoreLayer.sol:resync()` | ✅ |
| #4 Challenge | Core | CoreSlashingで実装予定 | ⚠️ 別タスク |

---

## 4. L3基盤確認

| 確認項目 | 期待 | 実装 | 結果 |
|----------|------|------|:----:|
| L3構成 | 独自4ノードBFTチェーン | CoreLayerはL3 Bridge Layer | ✅ |
| 実装言語 | Rust (l3-aegis) / Solidity | Solidity for Bridge contracts | ✅ |
| ZK-STARK使用 | なし（将来検討） | `_verifyProof()` はプレースホルダー | ✅ |
| SEQUENCES準拠 | v2.0準拠 | SEQ #1-4, #3' 実装済み | ✅ |

---

## 5. 攻撃ベクトル分析

| # | 攻撃ベクトル | 検証結果 | 詳細 |
|---|-------------|:-------:|------|
| 1 | **リエントランシー攻撃** | ✅ SAFE | `claim()`: state変更 → ETH transfer（CEI準拠） |
| 2 | **フロントランニング** | ⚠️ 注意 | txHashはSHA3で生成、タイムスタンプ・nonce依存 |
| 3 | **オラクル操作** | ✅ N/A | 外部オラクル未使用 |
| 4 | **DoS攻撃** | ⚠️ LOW | 大量Lock時のガス消費は正常範囲 |
| 5 | **整数オーバーフロー** | ✅ SAFE | Solidity 0.8.24 自動チェック有効 |

---

## 6. 暗号実装確認（CP-1）

| 確認項目 | 結果 | 詳細 |
|----------|:----:|------|
| SHA3-256使用 | ✅ | `SHA3_256.hash()` via `_generateTxHash()` |
| keccak256不使用 | ✅ | セキュリティパスで keccak256 未使用 |
| ECDSA不使用 | ✅ | 未使用 |
| RSA不使用 | ✅ | 未使用 |

### コード確認詳細

```solidity
// CoreLayer.sol Line 94 - CP-1準拠
return SHA3_256.hash(data);
```

- SHA3_256.sol: FIPS 202準拠、ドメイン分離バイト 0x06
- テストファイルのkeccak256使用（イベント検証）は**非セキュリティパス、許容**

---

## 7. 発見事項

| # | 重要度 | 項目 | 仕様書出典 | 説明 | 対策 |
|---|--------|------|-----------|------|------|
| 1 | 🟡 **Medium** | _verifyProof プレースホルダー | SEQ#2 | 実際のSTARK検証なし（`proof.length >= 32`のみ） | 本番前にSTARKVerifier統合必須 |
| 2 | 🟢 Low | Domain Separator固定値 | CP-1 | LOCK_DOMAIN等がハードコード | コメント or 検証テスト追加推奨 |
| 3 | 🟢 Low | claim関数の受取人設計 | SEQ#2 | 任意recipientへclaim可能 | 設計意図確認（代理claim許可?） |
| 4 | 🟢 Info | テストのkeccak256使用 | - | イベントトピック検証（Forge標準） | セキュリティパス外、問題なし |
| 5 | ⚠️ Pending | SEQ#4 Challenge未実装 | SEQ#4 | CoreSlashingは別コントラクト | 次回タスクで実装確認 |

---

## 8. 静的解析結果

**手動コードレビュー**（GitHubアクセス制限のためSlither未実行）:

| 項目 | 結果 |
|------|:----:|
| Reentrancy | ✅ CEI Pattern準拠 |
| Integer Overflow | ✅ Solidity 0.8.24 SafeMath |
| Access Control | ✅ Public関数は正当なフロー |
| External Calls | ⚠️ `recipient.call{value}` 使用（ガード付き） |

**推奨**: 本番前にSlitherフルスキャン必須（TEST-004で予定）

---

## 9. テスト結果確認

| テストスイート | テスト数 | 結果 |
|---------------|:-------:|:----:|
| CoreLayerTest | 24 | ✅ ALL PASS |
| ICoreLayerTest | 5 | ✅ ALL PASS |
| **Total** | **29** | ✅ **ALL PASS** |

### テストカバレッジ

- ✅ SEQ#1 Lock: 5 tests
- ✅ SEQ#2 Unlock: 3 tests
- ✅ SEQ#3 Emergency: 5 tests
- ✅ SEQ#3' Resync: 2 tests
- ✅ Claim: 3 tests
- ✅ CP Compliance: 3 tests
- ✅ View Functions: 3 tests

---

## 10. CP準拠状況

| CP | 内容 | 状態 | 詳細 |
|----|------|:----:|------|
| **CP-1** | 完全量子耐性 | ✅ | SHA3-256 ONLY, keccak256排除 |
| **CP-2** | Self-Custody | ✅ | 管理者鍵なし |
| **CP-3** | Time Lock存在 | ✅ | 24h/7d 定数、0化不可 |
| **CP-4** | Slashing存在 | ⚠️ | Emergency Bond存在、Quadratic Slashingは別 |
| **CP-5** | 透明性 | ✅ | 全操作でイベント発行 |

---

## 11. 判定

### ⚠️ **CONDITIONAL PASS**

以下の条件付きで次フェーズへ進行可:

#### 必須条件

1. **🟡 Medium**: `_verifyProof()` のプレースホルダー性を認識し、本番デプロイ前にSTARK Verifier統合を必須タスクとして追跡する

#### 推奨条件

2. **🟢 Low**: `claim()` の受取人設計意図を確認（任意アドレスへのclaimが許可されるか明文化）
3. **🟢 Low**: Domain Separator値の検証コメント追加

---

## 12. 次のアクション

| # | タスク | 優先度 | 対応時期 |
|---|--------|:------:|---------|
| 1 | STARK Verifier統合タスク作成 | 🟡 Medium | Phase 4前 |
| 2 | claim()設計意図の確認・文書化 | 🟢 Low | 次回PIR |
| 3 | TEST-004 Slitherフルスキャン | 🔴 P0 | Track B |
| 4 | SEQ#4 Challenge実装（CoreSlashing） | 🟠 High | 次タスク |

---

## 13. 承認

| 役割 | 承認 | 日時 |
|------|:----:|------|
| Red Team Agent | ⚠️ CONDITIONAL | 2026-01-03 22:00 JST |
| Security Reviewer | ⬜ PENDING | - |
| PIR Chair | ⬜ PENDING | - |

---

**END OF PIR-IC-2**
