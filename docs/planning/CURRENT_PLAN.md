# Current Plan

> **Generated**: 2025-12-24 18:30 JST
> **Phase**: 1 - Foundation Bootstrap
> **Day**: 10 (14日間修正計画)

## 対象チェックリスト

`docs/planning/checklists/phase1_day8-10_vrf.md`

---

## 前回レビュー課題（CURRENT_STATE.mdより）

| # | 重要度 | 課題 | Status |
|---|--------|------|--------|
| 1 | ✅ 解決済 | L1Vault SMT検証のkeccak256→SHA3-256移行 | PIR-006で確認完了 |
| 2 | 🔴 High | Dilithium Lean4形式検証なし | Month 2-3で対応予定 |
| 3 | 🔴 High | SPHINCS+形式検証なし | Phase 2で対応予定 |
| 4 | 🟡 Medium | SHA3-256 Gas最適化（~1.3M） | Day 11で対応予定 |
| 5 | 🟡 Medium | 署名メッセージ作成のSHA3-256化 | Day 11で対応予定 |

> **Note**: 🔴 High項目はMonth 2-3 / Phase 2で対応予定のため、Day 10のブロッカーではない

---

## 前回完了項目（Day 8-9）

| PIR | 対象 | 判定 |
|-----|------|------|
| PIR-005 | VRF Integration | ✅ PASS |
| PIR-006 | Security Review | ✅ PASS |

### 完了した実装
- ✅ VRFConsumer.sol作成・テスト合格
- ✅ L1Vault + VRFConsumer統合
- ✅ L1Vault SMT検証のSHA3-256化
- ✅ セキュリティレビュー合格

---

## 今回のスコープ（Day 10: 統合テスト）

### E2Eテスト項目（チェックリストより）

- [ ] [E2E-001] Lock → Unlock (Normal) 完全フロー
- [ ] [E2E-002] Lock → Unlock (Emergency) 完全フロー
- [ ] [E2E-003] Challenge → Slashing フロー
- [ ] [E2E-004] VRF障害時のEmergency切り替え

### 統合テスト合格基準

- [ ] [PASS-001] 全E2Eテスト合格
- [ ] [PASS-002] ガス使用量確認（Unlock < 500K）
- [ ] [PASS-003] イベント発行確認
- [ ] [PASS-004] State Root遷移確認

### Core Principles準拠確認

- [ ] [CP-1] 量子耐性: VRFはDilithium署名と併用のみ
- [ ] [CP-2] Self-Custody: ユーザー鍵は保存しない
- [ ] [CP-3] Time Lock: 24h（Normal）/ 7日（Emergency）維持
- [ ] [CP-4] Slashing: 機能削除していない
- [ ] [CP-5] 透明性: 全操作がオンチェーン

---

## 参照ドキュメント

| 種類 | パス |
|------|------|
| 憲法 | `docs/constitution/CORE_PRINCIPLES.md` |
| Sequence参照 | `docs/constitution/QUANTUM_SHIELD_SEQUENCES_v2.0_REF.md` |
| 詳細仕様 | `docs/aegis/QUANTUM_SHIELD_UNIFIED_SPEC_v2.0.md` |
| PIR-005レポート | `docs/aegis/pir/PIR-005.md` |
| PIR-006レポート | `docs/aegis/pir/PIR-006.md` |
| PIRコードレビュールーチン | `docs/aegis/PIR_CODE_REVIEW_ROUTINE.md` |

---

## 成果物

| ファイル | 説明 |
|---------|------|
| `contracts/test/E2EIntegration.t.sol` | E2E統合テスト（新規） |
| `docs/aegis/pir/PIR-007.md` | Day 10 PIRレポート（新規） |

---

## 実行順序

### Step 1: テスト準備

1. 既存テストスイートの状態確認
   ```bash
   cd contracts && forge test --summary
   ```
2. E2E統合テストファイルの作成/確認

### Step 2: E2E-001 Normal Unlock フロー

3. Lock → Unlock (Normal Path) テスト実装
   - User Lock操作
   - 24h Time Lock経過
   - VRF Prover選出
   - 2/5 Threshold署名
   - Unlock完了確認

### Step 3: E2E-002 Emergency フロー

4. Lock → Unlock (Emergency Path) テスト実装
   - Emergency申請（7日 Time Lock）
   - Bond預託確認
   - 7日経過後のUnlock

### Step 4: E2E-003 Challenge/Slashing フロー

5. Challenge → Slashing テスト実装
   - 不正Proof提出
   - Challenge期間（48h）
   - Defense失敗
   - Slashing実行（60/20/20配分確認）

### Step 5: E2E-004 VRF障害時フロー

6. VRF障害時Emergency切り替えテスト
   - VRF 72hタイムアウト
   - 自動Emergency Path切り替え

### Step 6: 品質確認

7. 全E2Eテスト実行
   ```bash
   forge test --match-contract E2EIntegration -vvv
   ```
8. Gas使用量確認（Unlock < 500K目標）
9. イベント発行ログ確認
10. State Root遷移の正確性確認

### Step 7: PIR-007準備

11. PIR-007レポートドラフト作成
12. PIRコードレビュールーチン実行

---

## Core Principles確認

- [ ] CP-1: 完全量子耐性 - 違反なし（SHA3-256, Dilithium使用確認）
- [ ] CP-2: Self-Custody - 違反なし
- [ ] CP-3: Time Lock存在 - 違反なし（24h/7日維持）
- [ ] CP-4: Slashing存在 - 違反なし（60/20/20維持）
- [ ] CP-5: 透明性 - 違反なし

---

## リスク・懸念事項

| リスク | 重要度 | 緩和策 |
|--------|--------|--------|
| E2Eテストの複雑さ | 🟡 Medium | Sequenceドキュメントを参照し段階的実装 |
| Gas使用量が目標超過の可能性 | 🟡 Medium | Day 11の最適化フェーズで対応 |
| VRFモック精度 | 🟡 Medium | Chainlink VRF Mockを活用 |

---

## PIR-007 要件（Day 10用）

| 項目 | 要件 |
|------|------|
| E2Eテスト存在 | E2EIntegration.t.sol存在 |
| 全E2Eテスト合格 | 4シナリオ全合格 |
| Gas確認 | Unlock < 500K gas |
| 統合確認 | L1Vault + VRFConsumer + SMT連携確認 |
| イベント確認 | 全操作でイベント発行 |

---

## 完了報告テンプレート

```markdown
## Day 10 完了報告

**日時**: YYYY-MM-DD HH:MM JST
**担当**: Engineer, QA

### 完了項目
- [ ] E2E-001〜004
- [ ] PASS-001〜004

### テスト結果
- E2EIntegrationTest: XX/XX ✅
- 総テスト数: XXX

### Gas使用量
- Unlock (Normal): XXX gas
- Unlock (Emergency): XXX gas

### PIR判定
- [ ] PIR-007 PASS
- [ ] PIR-007 CONDITIONAL PASS
- [ ] PIR-007 FAIL

### 次のアクション
- Day 11: Gas最適化 + 署名メッセージSHA3化
```

---

**END OF CURRENT PLAN**
