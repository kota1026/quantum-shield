# 仕様レビュー結果

## 日時
2025-12-24 21:15 JST

## 対象
Day 11 - SHA3-256 Gas最適化 & keccak256移行

## ステータス
⚠️ 指摘事項あり - 対応後に実装へ進むこと

## 指摘事項

### [ISSUE-001] 追加のkeccak256使用箇所（公開鍵ハッシュ）
- **リスクレベル**: MEDIUM
- **該当原則**: CP-1（完全量子耐性）
- **問題**: L1Vault.sol内に、CURRENT_PLANでカバーされていないkeccak256使用箇所が存在
  - L256: `bytes32 dilithiumPubKeyHash = keccak256(dilithiumPubKey);`
  - L641: `bytes32 sphincsPubKeyHash = keccak256(sphincsPublicKey);`
- **対策**: 
  - SHA3_256.hash()に置換を検討
  - ただし、これらは**識別子用途**（セキュリティクリティカルではない）の可能性あり
  - Day 11スコープ外として次回Day 12で対応するか、今回に含めるか判断が必要
- [ ] 対応済み

### [ISSUE-002] FraudProof/DefenseProofのkeccak256使用
- **リスクレベル**: LOW
- **該当原則**: CP-1（完全量子耐性）
- **問題**: Challenge関連でkeccak256使用
  - L465: `fraudProofHash: keccak256(fraudProof),`
  - L527: `emit ChallengeFiled(lockId, msg.sender, keccak256(fraudProof), ...)`
  - L541: `bytes32 defenseProofHash = keccak256(defenseProof);`
- **対策**:
  - これらは**イベント・ログ用識別子**であり、暗号学的セキュリティへの直接影響は低い
  - 一貫性のためSHA3-256への移行を推奨するが、優先度は低い
- [ ] 対応済み

### [ISSUE-003] CURRENT_PLANのFIX-008/009は既に実装済み
- **リスクレベル**: INFO
- **該当原則**: N/A
- **問題**: CURRENT_PLANに記載のFIX-008、FIX-009は既にコードに反映済み
  - `_verifyThresholdSignatures()`: SHA3_256.hashPair使用確認 ✅
  - `_verifySimplified()`: SHA3_256.hash使用確認 ✅
- **対策**: CURRENT_PLANの更新、または今回の作業スコープを再定義
- [x] 確認済み

## 実装時の注意事項

1. **IMPL-010（SHA3-256 Gas最適化）は予定通り実行可能**
   - 既存のSHA3_256.sol最適化は独立したタスク
   - 他の指摘事項と並行して進められる

2. **keccak256残存箇所の判断が必要**
   - CORE_PRINCIPLES.mdでは keccak256 は「絶対禁止」と明記
   - しかし、識別子用途（非暗号学的用途）での使用可否は明確でない
   - **推奨**: 一貫性のため、全てSHA3-256へ移行

3. **テスト影響**
   - 公開鍵ハッシュ計算の変更は、テストデータの更新が必要
   - 233件の統合テストへの影響を確認すること

## 判断依頼

**CEOへの確認事項**:

ISSUE-001（公開鍵ハッシュ）について、以下のいずれかを選択してください：

- **Option A**: Day 11で追加対応（スコープ拡大）
  - メリット: 完全なkeccak256排除
  - デメリット: Day 11の工数増加

- **Option B**: Day 12で対応（スコープ維持）
  - メリット: Day 11は計画通り進行
  - デメリット: keccak256が一時的に残存

- **Option C**: 識別子用途として許容
  - メリット: 変更不要
  - デメリット: CP-1の厳密解釈に反する可能性

---

**レビュー実施者**: Chief Cryptographer (02_spec.md)

**END OF SPEC REVIEW**
