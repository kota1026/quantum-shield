# 判断基準（Decision Criteria）

> 迷ったときの軸。正となる詳細ルールは `.claude/rules/` 配下（frontend / backend / blockchain / integration / testing）。

## 絶対に守る（違反したら手を止める）

1. **新規 L1 デプロイ禁止**。L1 = Sepolia の既存 3 コントラクトのみ（`.claude/rules/blockchain.md`）
2. **非テストファイルにモック/フォールバック/デモ定数を置かない**。hooks (`detect-mocks.sh`) が自動ブロックする
3. **秘密鍵・API キーをコードや config にハードコードしない**。`QS__` プレフィックスの env var 経由のみ
4. **アプリ層の暗号は NIST FIPS 204 ML-DSA-65 + SHA3-256 のみ**。keccak256 / ECDSA / pre-FIPS は禁止（Solidity コントラクト内は EVM 制約で例外）

## 設計判断の軸

5. **型は一方向に流す**: DB schema → Rust `types.rs` → TS `types.ts` → Components。下位が独自型を作りそうになったら上位を直す
6. **snake_case は API 境界まで、camelCase は FE 内部**。変換は API client 層の 1 箇所だけ
7. **データ取得コンポーネントは Loading / Error / Empty の 3 状態必須**
8. **アクセシビリティは WCAG 2.1 AA**（44px タップターゲット、4.5:1 コントラスト、aria-label）

## 検証の軸（Moonwell Lesson）

9. ユニットテストが通る ≠ システムが動く。必ず確認する:
   - DB に実際にレコードが永続化されたか（API 200 だけで満足しない）
   - L1 トランザクションが実際に送信されたか
   - フロントエンドが実データを表示しているか
10. HTTP 200 だけを見るスモークテストは不十分。データ表示・操作結果・エラー状態・空状態の 4 点を検証する

## 進め方の軸

11. 1 セッション = 1 フローの 1 レイヤー。欲張らない
12. 完璧な自動化より、まず手動で回る最小構成。着手が止まるくらいなら荒く始める
