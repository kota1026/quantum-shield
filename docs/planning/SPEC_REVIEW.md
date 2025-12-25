# 仕様レビュー結果

## 日時
2025-12-25 15:30 JST

## 対象
Day 13: SPHINCS+ Lean4形式検証 + 外部レビュー準備

## ステータス
⚠️ 指摘事項あり - **CEO判断後**に実装へ進むこと

---

## 指摘事項

### [ISSUE-001] keccak256使用箇所の残存
- **リスクレベル**: MEDIUM
- **該当原則**: CP-1（完全量子耐性）
- **ファイル**: `contracts/src/SPHINCSVerifier.sol` Line 303
- **問題**: 
  ```solidity
  function computePublicKeyHash(bytes calldata publicKey) 
      external 
      pure 
      returns (bytes32) 
  {
      if (publicKey.length != PUBLIC_KEY_SIZE) revert InvalidPublicKeyLength();
      return keccak256(publicKey);  // ← CP-1違反
  }
  ```
  Core Principles禁止事項: `keccak256（SHA3-256を使用すること）`
- **対策**: `keccak256` → `sha256(abi.encodePacked(bytes1(0x07), publicKey))` または Solidity SHA3ライブラリ使用
- [ ] 対応済み

---

### [ISSUE-002] SPHINCS+-SHA2-128s採用の整合性確認（CEO判断要）
- **リスクレベル**: LOW（情報確認）
- **該当原則**: CP-1（完全量子耐性）
- **問題**: 
  Core Principlesには「SHA-256 / SHA-2ファミリー（Grover攻撃リスク）」が禁止事項として記載。
  現行実装`SPHINCS+-SHA2-128s`はNIST FIPS 205準拠の量子耐性アルゴリズムだが、内部的にSHA-256を使用。
  
  **解釈オプション**:
  1. **許容解釈**: FIPS 205準拠SPHINCS+内部でのSHA-256使用は、アルゴリズム全体として量子耐性が保証されているため許容
  2. **厳格解釈**: SPHINCS+-SHAKE-128s（SHA3/SHAKE256ベース）への移行が必要

- **推奨**: FIPS 205準拠であり量子耐性は確保されているため、許容解釈を採用しDay 13実装を継続

- [ ] CEO判断済み

---

## Lean4形式検証への影響

| 影響 | 詳細 |
|------|------|
| ISSUE-001 | 形式検証対象外（ユーティリティ関数）→ 検証作業に影響なし |
| ISSUE-002 | CEO判断でSHA2版継続の場合 → 現行コードで形式検証可能 |

**結論**: ISSUE-001は軽微な修正で対応可能。ISSUE-002はCEO判断待ち。

---

## 実装時の注意事項

1. **SPHINCS+ Lean4証明作成時**
   - 現行Solidity実装（SHA-256ベース）と整合性を取ること
   - FIPS 205 SPHINCS+-SHA2-128sのパラメータを使用

2. **ISSUE-001修正時**
   - `computePublicKeyHash`のみ修正
   - 署名検証ロジック（sha256使用）は変更不要

3. **NIST KATテスト**
   - SPHINCS+-SHA2-128s用のKATベクターを使用

---

## 次のアクション

1. **CEO判断待ち**: ISSUE-002について許容解釈でよいか確認
2. **許容判断の場合**: 03_impl.mdへ進行、ISSUE-001は実装フェーズで対応
3. **厳格判断の場合**: SPHINCS+-SHAKE-128sへの移行計画を策定

---

**END OF SPEC REVIEW**
