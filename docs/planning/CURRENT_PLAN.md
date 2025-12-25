# Current Plan

> **Generated**: 2025-12-25 (JST)  
> **Phase**: 2 - Security Council + Token  
> **Week**: 5 (Month 7)

## 対象チェックリスト

`docs/planning/PHASE2_CHECKLIST.md`

---

## 前回レビュー課題（Slither静的解析より）

> CURRENT_STATE.md より自動取得 (2025-12-25)

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| 1 | 🔴 Critical | L1Vault リエントランシー脆弱性 (SL-001〜004) | CEIパターン適用、状態更新を外部call前に移動 |
| 2 | 🟠 High | Missing Events (SL-006〜008) | OwnershipTransferred等のイベント追加 |
| 3 | 🟠 High | Zero-Check (SL-009〜010) | require(address != address(0)) 追加 |
| 4 | 🟠 High | Unused Return (SL-011) | 戻り値の適切な処理 |

---

## 今回のスコープ

### 修正項目（レビュー課題より）

#### SEC-001: L1Vault リエントランシー修正 [🔴 Critical]

- [ ] [FIX-001] `autoResolveChallenge()` - CEIパターン適用
- [ ] [FIX-002] `resolveChallenge()` - CEIパターン適用
- [ ] [FIX-003] `_resolveValidChallenge()` - CEIパターン適用
- [ ] [FIX-004] `_resolveInvalidChallenge()` - CEIパターン適用

#### SEC-002: Events/ZeroCheck修正 [🟠 High]

- [ ] [FIX-005] L1Vault.sol - `OwnershipTransferred`イベント追加
- [ ] [FIX-006] L1Vault.sol - `updateSecurityCouncil`イベント追加
- [ ] [FIX-007] QuantumShield.sol - `OwnershipTransferred`イベント追加
- [ ] [FIX-008] QuantumShield.sol - `setVerifier`ゼロアドレスチェック追加
- [ ] [FIX-009] VRFConsumer.sol - `OwnershipTransferred`イベント追加
- [ ] [FIX-010] VRFConsumer.sol - constructor/setVRFConfigゼロアドレスチェック追加
- [ ] [FIX-011] VRFConsumer.sol - `_selectProver`戻り値処理

### テスト項目

- [ ] [TEST-SEC-001] リエントランシー攻撃テスト（攻撃が失敗することを確認）
- [ ] [TEST-SEC-002] 既存テスト全PASS確認（regression test）
- [ ] [TEST-SEC-003] イベント発行テスト
- [ ] [TEST-SEC-004] ゼロアドレスrevert確認テスト

---

## 参照ドキュメント

| 種別 | パス |
|------|------|
| 憲法 | `docs/constitution/CORE_PRINCIPLES.md` |
| Slitherレポート | `docs/aegis/security/SLITHER_REPORT_2025-12-25.md` |
| CURRENT_STATE | `docs/planning/CURRENT_STATE.md` |
| L1Vault実装 | `contracts/src/L1Vault.sol` |
| QuantumShield実装 | `contracts/src/QuantumShield.sol` |
| VRFConsumer実装 | `contracts/src/VRFConsumer.sol` |

---

## 成果物

| ファイル | 説明 |
|---------|------|
| `contracts/src/L1Vault.sol` | リエントランシー修正版 |
| `contracts/src/QuantumShield.sol` | Events/ZeroCheck追加版 |
| `contracts/src/VRFConsumer.sol` | Events/ZeroCheck追加版 |
| `contracts/test/security/ReentrancyTest.t.sol` | リエントランシーテスト |
| `docs/aegis/pir/PIR-SEC-001.md` | セキュリティレビュー記録 |

---

## 実行順序

### Phase A: SEC-001 リエントランシー修正 [🔴 Critical]

1. **現状確認**: L1Vault.sol の該当4関数を詳細分析
2. **修正設計**: 各関数のCEIパターン適用設計
3. **実装**:
   - `autoResolveChallenge()` - 状態更新を先に実行
   - `resolveChallenge()` - insuranceFund更新を先に実行
   - `_resolveValidChallenge()` - totalLocked更新を先に実行
   - `_resolveInvalidChallenge()` - insuranceFund/totalBurned更新を先に実行
4. **テスト作成**: リエントランシー攻撃テスト
5. **テスト実行**: 全テストPASS確認

### Phase B: SEC-002 Events/ZeroCheck修正 [🟠 High]

6. **L1Vault.sol修正**:
   - `event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);`
   - `event SecurityCouncilUpdated(address indexed previousCouncil, address indexed newCouncil);`
7. **QuantumShield.sol修正**:
   - `OwnershipTransferred`イベント追加
   - `setVerifier`にゼロアドレスチェック追加
8. **VRFConsumer.sol修正**:
   - `OwnershipTransferred`イベント追加
   - constructor/setVRFConfigにゼロアドレスチェック追加
   - `_selectProver`戻り値処理
9. **テスト作成**: イベント・revertテスト追加
10. **テスト実行**: 全テストPASS確認

### Phase C: 検証 & レビュー

11. **Slither再実行**: HIGH/MEDIUM 0件確認
12. **PIR準備**: PIR-SEC-001レビュードキュメント作成
13. **CURRENT_STATE更新**: 完了ステータス反映

---

## 修正パターン（参考）

### CEIパターン（Checks-Effects-Interactions）

```solidity
// ❌ 現状（脆弱）
function autoResolveChallenge(bytes32 requestId) external {
    // ... checks ...
    (bool success,) = challenger.call{value: amount}("");  // Interaction
    require(success, "Transfer failed");
    request.bond = 0;  // Effect ← 外部call後に更新 = 脆弱性
}

// ✅ 修正後
function autoResolveChallenge(bytes32 requestId) external {
    // ... checks ...
    uint256 bondAmount = request.bond;  // ローカル変数にコピー
    request.bond = 0;  // Effect ← 先に状態更新
    (bool success,) = challenger.call{value: bondAmount}("");  // Interaction
    require(success, "Transfer failed");
}
```

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - 違反なし（今回は暗号アルゴリズム変更なし）
- [x] CP-2: Self-Custody - 違反なし（秘密鍵管理に影響なし）
- [x] CP-3: Time Lock存在 - 違反なし（Time Lock機能維持）
- [x] CP-4: Slashing存在 - 違反なし（Slashing機能維持）
- [x] CP-5: 透明性 - 違反なし（オンチェーン検証維持、イベント追加で透明性向上）

---

## リスク・懸念事項

| # | リスク | 重要度 | 対策 |
|---|--------|--------|------|
| 1 | CEI修正によるロジック変更 | MEDIUM | 既存テスト全PASS確認 |
| 2 | Gas消費の微増 | LOW | ローカル変数使用で最小化 |
| 3 | イベント追加によるGas増加 | LOW | 管理関数のみなので許容 |

---

## 完了条件

| 条件 | 基準 | 必須 |
|------|------|------|
| SEC-001修正完了 | 4関数すべてCEI適用 | ✅ |
| SEC-002修正完了 | Events/ZeroCheck追加 | ✅ |
| テスト全PASS | 既存 + 新規テスト | ✅ |
| Slither HIGH | 0件 | ✅ |
| Slither MEDIUM | 0件 | ✅ |
| PIR-SEC-001 | PASS判定 | ✅ |

---

**Ready for: 02_spec.md (Specification Review)**

---

**END OF CURRENT PLAN**
