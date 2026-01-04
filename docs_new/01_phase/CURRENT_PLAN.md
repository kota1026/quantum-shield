# Current Plan

> **Generated**: 2026-01-05 18:00 JST  
> **Phase**: Phase 4 - UI/UX, Audit & Launch  
> **Week**: 3 (Client SDK)

---

## 対象チェックリスト

`docs_new/01_phase/04_phase4/phase4.md`

---

## 仕様書参照

### 対象Sequence

| Sequence | 実装Layer | 仕様書参照箇所 |
|----------|----------|---------------|
| SEQ#1 | SDK (Client) | Lock: User→L3署名要求 |
| SEQ#2 | SDK (Client) | Normal Unlock: 24h TimeLock表示 |
| SEQ#3 | SDK (Client) | Emergency Unlock: Bond計算表示 |
| SEQ#8 | SDK (Client) | Emergency Pause状態表示 |

### セキュリティ要件

| 要件 | 仕様書出典 | 実装方法 |
|------|----------|---------|
| Dilithium-III署名 | CP-1, FIPS 204 | WASM Module (ML-DSA-65) |
| SHA3-256ハッシュ | CP-1, FIPS 202 | WASM Module |
| 秘密鍵ローカル管理 | CP-2 | クライアントサイドのみ保持 |
| Time Lock表示 | CP-3, SEQ#2 | 24h/7d残り時間計算 |

---

## Phase 4準拠確認

> 参照: `docs_new/01_phase/04_phase4/PHASE4_PLAN.md`

- [x] 週次スケジュール: Week 3 対象タスク
- [x] タスクID: SDK-001~005, AUDIT-001
- [x] 優先度: P0 (SDK-001~003), P1 (SDK-004~005), P0 (AUDIT-001)
- [x] 依存関係: Week 2 API Layer完了 (PIR-P4-002 PASS) ✅
- [x] ペルソナスコープ: End User (Dilithium鍵管理、Lock/Unlock)

---

## 前回レビュー課題

| # | 重要度 | 課題 | 対策 |
|---|--------|------|------|
| - | - | なし | PIR-P4-002 PASS、全課題解決済み |

### PIR-P4-002推奨事項（Week 3で対応検討）

| # | 項目 | 推奨 | 今回対応 |
|---|------|------|:--------:|
| 1 | API認証 | JWT/OAuth実装 | ⬜ Week 4以降 |
| 2 | SMT Proof | placeholder→本実装 | ⬜ Week 6-7 |

---

## 今回のスコープ

### 実装項目

| タスクID | 項目名 | 優先度 | 成果物 |
|---------|--------|:------:|--------|
| SDK-001 | TypeScript SDK基盤 | P0 | `packages/sdk/typescript/` |
| SDK-002 | Dilithium WASM Module (<500ms) | P0 | `packages/sdk/wasm/` |
| SDK-003 | Wallet接続 | P0 | MetaMask連携実装 |
| SDK-004 | React Hooks | P1 | `packages/sdk/react/` |
| SDK-005 | SDK Documentation | P1 | SDK_GUIDE.md |
| AUDIT-001 | AUDIT_SCOPE.md作成 | P0 | 監査スコープ定義 |

### テスト項目

| タスクID | 項目名 | 内容 |
|---------|--------|------|
| TEST-SDK-001 | WASM性能テスト | 鍵生成<500ms, 署名<100ms, 検証<50ms |
| TEST-SDK-002 | NIST KAT検証 | FIPS 204 Known Answer Tests |
| TEST-SDK-003 | TypeScript Unit Tests | SDK API全関数 |
| TEST-SDK-004 | React Hooks Tests | useQuantumShield, useLock, useUnlock |

### 参照ドキュメント

| 種類 | ドキュメント | 参照セクション |
|------|------------|---------------|
| Phase 4計画 | `PHASE4_PLAN.md` | Week 3, §4.3 Client SDK構成 |
| API仕様 | `API_SPECIFICATION.md` | Lock/Unlock APIエンドポイント |
| 会議決定 | `AGENT_MEETING_MINUTES_20260104.md` | Dilithium WASM <500ms目標 |
| 暗号要件 | `CORE_PRINCIPLES.md` | CP-1 完全量子耐性 |

---

## 成果物

| ファイル | 説明 | タスクID |
|---------|------|---------|
| `packages/sdk/wasm/` | Dilithium WASM Module (FIPS 204 ML-DSA-65) | SDK-002 |
| `packages/sdk/wasm/src/lib.rs` | WASM exports (keygen, sign, verify) | SDK-002 |
| `packages/sdk/wasm/pkg/` | wasm-pack output (.wasm, .js, .d.ts) | SDK-002 |
| `packages/sdk/typescript/` | TypeScript SDK | SDK-001 |
| `packages/sdk/typescript/src/client.ts` | API Client (Lock, Unlock, Status) | SDK-001 |
| `packages/sdk/typescript/src/crypto.ts` | WASM wrapper | SDK-001 |
| `packages/sdk/typescript/src/wallet.ts` | MetaMask連携 | SDK-003 |
| `packages/sdk/typescript/src/types.ts` | 型定義 | SDK-001 |
| `packages/sdk/react/` | React Hooks | SDK-004 |
| `packages/sdk/react/src/useQuantumShield.ts` | メインHook | SDK-004 |
| `packages/sdk/react/src/useLock.ts` | Lock操作Hook | SDK-004 |
| `packages/sdk/react/src/useUnlock.ts` | Unlock操作Hook | SDK-004 |
| `packages/sdk/react/src/useDilithium.ts` | 鍵管理Hook | SDK-004 |
| `docs_new/01_phase/04_phase4/SDK_GUIDE.md` | SDKドキュメント | SDK-005 |
| `docs_new/00_core/AUDIT_SCOPE.md` | 監査スコープ定義 | AUDIT-001 |

---

## 実行順序

### Day 1: WASM基盤構築 (SDK-002 Part 1)

1. `packages/sdk/wasm/` ディレクトリ構造作成
2. `Cargo.toml` 設定 (wasm-bindgen, fips204)
3. `src/lib.rs` Dilithium WASM exports実装
4. NIST FIPS 204 ML-DSA-65 実装
   - `keygen()` - 鍵ペア生成
   - `sign(secret_key, message)` - 署名生成
   - `verify(public_key, message, signature)` - 署名検証
5. `wasm-pack build --target web`

### Day 2: WASM性能最適化 & KAT検証 (SDK-002 Part 2)

1. 性能ベンチマーク実行
   - 目標: 鍵生成 <500ms, 署名 <100ms, 検証 <50ms
2. NIST KATファイルでの検証
3. wasm-opt最適化
4. バンドルサイズ最適化 (<1MB目標)

### Day 3: TypeScript SDK基盤 (SDK-001)

1. `packages/sdk/typescript/` ディレクトリ構造作成
2. `package.json`, `tsconfig.json` 設定
3. `src/crypto.ts` - WASM wrapper実装
4. `src/client.ts` - API Client実装
   - `lock(amount, tokenAddress)`
   - `unlock(lockId, unlockType)`
   - `getStatus(lockId)`
   - `getTimeLockRemaining(lockId)`
5. `src/types.ts` - 型定義

### Day 4: Wallet接続 & React Hooks (SDK-003, SDK-004)

1. `src/wallet.ts` - MetaMask連携
   - `connectWallet()`
   - `signTransaction()`
   - `getAddress()`
2. `packages/sdk/react/` ディレクトリ構造作成
3. React Hooks実装
   - `useQuantumShield()` - メインコンテキスト
   - `useLock()` - Lock操作
   - `useUnlock()` - Unlock操作
   - `useDilithium()` - 鍵管理

### Day 5: ドキュメント & 監査準備 (SDK-005, AUDIT-001)

1. `SDK_GUIDE.md` 作成
   - インストール手順
   - 基本的な使い方
   - APIリファレンス
   - React統合ガイド
2. `AUDIT_SCOPE.md` 作成
   - 監査対象コントラクト一覧
   - 監査対象範囲
   - 除外事項
   - セキュリティ要件

### Day 6-7: テスト & PIR準備

1. WASM Unit Tests (`packages/sdk/wasm/tests/`)
2. TypeScript Unit Tests (`packages/sdk/typescript/tests/`)
3. React Hooks Tests (`packages/sdk/react/tests/`)
4. E2E統合テスト (SDK → API → L1/L3)
5. セキュリティレビュー準備

---

## 性能目標（AGENT_MEETING_MINUTES_20260104 決定事項）

| 操作 | 目標 | 測定条件 |
|------|:----:|---------|
| Dilithium鍵生成 | <500ms | Chrome/Firefox最新版、M1 Mac相当 |
| 署名生成 | <100ms | 32バイトメッセージ |
| 署名検証 | <50ms | 32バイトメッセージ |
| WASMバンドル | <1MB | gzip圧縮後 |

---

## Core Principles確認

- [x] CP-1: 完全量子耐性 - FIPS 204 ML-DSA-65 (Dilithium-III)使用、SHA3-256使用
- [x] CP-2: Self-Custody - 秘密鍵はクライアントサイドのみ保持、サーバー送信なし
- [x] CP-3: Time Lock存在 - SDK側でTimeLock残り時間計算・表示
- [x] CP-4: Slashing存在 - SDK側でSlashing状態表示（Prover向け）
- [x] CP-5: 透明性 - すべての操作はオンチェーントランザクション経由

---

## 禁止事項確認

| 禁止アルゴリズム | チェック |
|-----------------|:--------:|
| keccak256 | ❌ 使用禁止 |
| SHA-256 / SHA-2 | ❌ 使用禁止 |
| ECDSA | ❌ 使用禁止 |
| RSA | ❌ 使用禁止 |
| secp256k1署名 | ❌ 使用禁止 (Wallet接続のみ許可) |

> **Note**: MetaMask接続にはsecp256k1を使用しますが、これはウォレット認証のみであり、
> Quantum Shield内部の署名にはDilithium-III (FIPS 204 ML-DSA-65)を使用します。

---

## リスク・懸念事項

| # | リスク | 重要度 | 緩和策 |
|---|--------|:------:|--------|
| 1 | WASM性能未達 | 🟡 Medium | 早期ベンチマーク、wasm-opt最適化 |
| 2 | バンドルサイズ肥大 | 🟡 Medium | Tree shaking、コード分割 |
| 3 | ブラウザ互換性 | 🟡 Medium | Safari/Firefox/Chrome全検証 |
| 4 | FIPS 204ライブラリ不安定 | 🟡 Medium | fips204クレート使用、KAT検証 |

---

## 依存関係確認

### 前提条件（完了済み）

| 週 | 内容 | 状態 | PIR |
|:--:|------|:----:|-----|
| W1 | Event Bridge | ✅ | PIR-P4-001 PASS |
| W2 | API Layer | ✅ | PIR-P4-002 PASS |

### Week 3完了条件

- SDK-001~005 全タスク完了
- AUDIT-001 完了
- WASM性能目標達成 (<500ms鍵生成)
- NIST KAT検証PASS
- セキュリティレビューPASS
- PIR-P4-003 PASS

---

## 次のステップ

1. **② 仕様書作成** - `02_spec.md` 実行 (SDK詳細仕様)
2. **③ 実装** - `03_impl.md` 実行
3. **④ レビュー** - `04_review.md` 実行
4. **⑤ PIR** - `05_pir.md` 実行 (PIR-P4-003)
5. **⑥ 状態更新** - `06_update.md` 実行

---

**END OF CURRENT PLAN**
