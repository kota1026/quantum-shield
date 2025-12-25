# 仕様レビュー結果

## 日時
2025-12-25 11:35 JST（第2回レビュー）

## 対象
Day 13: SPHINCS+ SHAKE移行 + Lean4形式検証 + 外部レビュー準備

## ステータス
✅ 仕様確認完了 - **CEO判断済み** - 実装に進んでください

---

## CEO判断（2025-12-25）

| 項目 | 判断 | 対応 |
|------|------|------|
| ISSUE-002 | **厳格解釈採用** | SPHINCS+-SHAKE-128sへ移行 |
| ISSUE-001 | **対応する** | keccak256→SHA3-256変更 |

---

## 変更スコープ（Day 13 拡張）

### 🔴 最優先: SPHINCS+-SHAKE-128s移行

#### SPHINCSVerifier.sol 全面改修

| 変更箇所 | 現行 | 変更後 | 行番号(目安) |
|---------|------|--------|-------------|
| `_computeDigest()` | `sha256()` | SHAKE256 | ~197 |
| `_computeFORSTreeRoot()` | `sha256()` | SHAKE256 | ~242, 257, 265 |
| `_hashFORSRoots()` | `sha256()` | SHAKE256 | ~281 |
| `_computeWOTSChain()` | `sha256()` | SHAKE256 | ~338 |
| `_compressWOTSPublicKey()` | `sha256()` | SHAKE256 | ~351 |
| `_climbMerkleTree()` | `sha256()` | SHAKE256 | ~368 |
| `computePublicKeyHash()` | `keccak256()` | SHA3-256 | ~303 |
| コントラクト名/コメント | SHA2-128s | SHAKE-128s | 全体 |

#### SHAKE256実装方法

**オプションA（推奨）**: Solidityプリコンパイル不在のため、Yul/アセンブリでSHA3 opcode活用
```solidity
// SHA3-256 (keccak256と異なるパディング)
function sha3_256(bytes memory data) internal pure returns (bytes32) {
    // SHAKE256の256ビット出力として実装
    // または外部ライブラリ使用
}
```

**オプションB**: OpenZeppelin等の既存SHA3ライブラリ使用

**オプションC**: SHAKE256をプリコンパイルとして扱い、L2/L3で対応

---

### パラメータ変更なし確認

| パラメータ | SHA2-128s | SHAKE-128s | 変更 |
|-----------|-----------|------------|------|
| N | 16 | 16 | なし |
| W | 16 | 16 | なし |
| WOTS_LEN | 35 | 35 | なし |
| FORS_TREES | 14 | 14 | なし |
| FORS_HEIGHT | 12 | 12 | なし |
| SUBTREE_HEIGHT | 9 | 9 | なし |
| D | 7 | 7 | なし |
| SIGNATURE_SIZE | 7856 | 7856 | なし |
| PUBLIC_KEY_SIZE | 32 | 32 | なし |

---

## Core Principles準拠確認

| 原則 | 確認結果 |
|------|---------|
| CP-1: 完全量子耐性 | ✅ SHAKE256採用でSHA-256禁止を遵守 |
| CP-2: Self-Custody | ✅ 変更なし |
| CP-3: Time Lock存在 | ✅ 変更なし |
| CP-4: Slashing存在 | ✅ 変更なし |
| CP-5: 透明性 | ✅ 変更なし |

---

## 実装順序（推奨）

### Step 1: SHA3/SHAKE256ライブラリ準備
1. Solidity用SHA3-256ライブラリ調査・選定
2. SHAKE256実装またはライブラリ導入
3. 単体テスト作成

### Step 2: SPHINCSVerifier.sol改修
1. ハッシュ関数呼び出しを全てSHAKE256に置換
2. `computePublicKeyHash()`をSHA3-256に変更
3. コメント・ドキュメント更新（SHA2→SHAKE）

### Step 3: テスト更新
1. 既存テストのハッシュ期待値更新
2. SPHINCS+-SHAKE-128s用KATベクター取得
3. 全テスト実行・PASS確認

### Step 4: Lean4形式検証
1. SHAKE256ベースでLean4証明作成
2. Solidity↔Lean4整合性検証

---

## リスク評価

| リスク | 重要度 | 対策 |
|--------|--------|------|
| SHAKE256 Solidity実装の複雑性 | 🔴 HIGH | 既存ライブラリ調査、必要に応じYul実装 |
| Gas cost増加の可能性 | 🟡 MEDIUM | ベンチマーク実施、最適化 |
| KATベクター入手 | 🟢 LOW | NIST公式サイトから取得可能 |

---

## 成果物（更新）

| ファイル | 説明 |
|---------|------|
| `contracts/src/libraries/SHA3.sol` | **SHA3-256/SHAKE256ライブラリ（新規）** |
| `contracts/src/SPHINCSVerifier.sol` | **SHAKE-128s版に改修** |
| `proofs/lean4/SPHINCS_SHAKE.lean` | **SHAKE版Lean4形式証明** |
| `test-vectors/PQCsignKAT_SPHINCS_SHAKE.rsp` | **SHAKE版KATベクター** |

---

## 次のアクション

✅ **実装に進む**: `03_impl.md`を実行
- Step 1からSHA3/SHAKE256ライブラリ準備を開始
- SPHINCSVerifier.sol改修を実施

---

**END OF SPEC REVIEW**
