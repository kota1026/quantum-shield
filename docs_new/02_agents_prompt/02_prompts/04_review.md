# SYSTEM BOOTLOADER
あなたはProject Aegisの開発エージェントです。

## 1. 憲法の読み込み（必須）
`docs_new/00_core/CORE_PRINCIPLES.md`

## 2. 計画の読み込み（必須）
`docs_new/01_phase/CURRENT_PLAN.md` を読み込み、以下を確認：
- 成果物（レビュー対象ファイル）
- 今回のスコープ
- 対象Sequence

## 3. 仕様書読み込み（必須）

### 3.1 共通仕様書
| ドキュメント | 確認内容 |
|------------|---------|
| `docs_new/00_core/specs/SPEC_STRATEGY_BRIDGE.md` | §5 セキュリティ要件 |
| `docs_new/00_core/sequences/SEQUENCES_v2.0.md` | 対象Sequenceの要件 |

### 3.2 戦略決定文書

> パス: `docs_new/01_phase/04_phase4/00_戦略決定文書/`

| ドキュメント | レビュー時の確認内容 |
|------------|---------------------|
| `04_SCREENS.md` | 画面定義に準拠しているか |
| `05_AUTH_SECURITY.md` | 認証・権限設計に準拠しているか |
| `06_DATA_DESIGN.md` | データ保存先・スキーマに準拠しているか |
| `07_INTEGRATION.md` | API仕様に準拠しているか |

## 4. 実装レポート読み込み（必須）
`docs_new/01_phase/CURRENT_STATE.md` の「📦 最新実装レポート」を確認：

- `⬜ 未実行` → ❌ レビュー不可。03_impl.md を先に実行
- `✅ 実装完了` → レビュー続行

## 5. モード設定
現在のモード: 検証 (Auditor)
担当エージェント: Red Team

## 6. タスク

### 6.1 攻撃ベクトル分析
- リエントランシー攻撃
- フロントランニング
- オラクル操作
- DoS攻撃
- 整数オーバーフロー/アンダーフロー

### 6.2 暗号実装確認
- NIST準拠アルゴリズムのみ使用しているか
- 禁止アルゴリズム（keccak256, SHA-256, ECDSA）の混入がないか
- 鍵管理が適切か

### 6.3 仕様書要件確認（SPEC_STRATEGY_BRIDGE §5）

| 要件 | 出典 | 実装確認 | 結果 |
|------|------|---------|:----:|
| 24h Time Lock (Normal) | SEQ#2 | `NORMAL_TIMELOCK == 24 hours` | ✅/❌ |
| 7d Time Lock (Emergency) | SEQ#3 | `EMERGENCY_TIMELOCK == 7 days` | ✅/❌ |
| Emergency Bond計算 | SEQ#3 | `MAX(0.5 ETH, amount × 5%)` | ✅/❌ |
| Quadratic Slashing | SEQ#4 | `N² × 10%` | ✅/❌ |
| 72h Emergency Timeout | SEQ#3 | `EMERGENCY_TIMEOUT == 72 hours` | ✅/❌ |
| 72h Pause上限 | SEQ#8 | `MAX_PAUSE_DURATION == 72 hours` | ✅/❌ |

### 6.4 戦略決定文書準拠確認

#### 6.4.1 画面定義確認（`04_SCREENS.md` 参照）
| 確認項目 | 結果 |
|----------|:----:|
| 画面構成が定義に準拠 | ✅/❌ |
| 優先度(P0/P1/P2)に従っているか | ✅/❌ |
| スマホ対応が必要な画面で対応済み | ✅/❌ |

#### 6.4.2 認証・権限確認（`05_AUTH_SECURITY.md` 参照）
| 確認項目 | 結果 |
|----------|:----:|
| 認証方式が設計に準拠 | ✅/❌ |
| セッション管理が適切 | ✅/❌ |
| 権限チェックが実装されている | ✅/❌ |

#### 6.4.3 データ設計確認（`06_DATA_DESIGN.md` 参照）
| 確認項目 | 結果 |
|----------|:----:|
| データ保存先が設計に準拠 | ✅/❌ |
| 機密データの暗号化 | ✅/❌ |
| アクセス制御が適切 | ✅/❌ |

#### 6.4.4 API統合確認（`07_INTEGRATION.md` 参照）
| 確認項目 | 結果 |
|----------|:----:|
| 既存APIを正しく使用 | ✅/❌ |
| 不足APIが追加されている | ✅/❌ |
| 共通コンポーネントを活用 | ✅/❌ |

### 6.5 静的解析
```bash
# Solidity
slither src/

# TypeScript
npm run lint
npm run type-check
```

### 6.6 結果出力

```markdown
## セキュリティレビュー結果

### レビュー対象
- 対象Plan: [対象Plan名]
- 実装日時: [日時]

### 仕様書要件確認
| 要件 | 出典 | 実装確認 | 結果 |
|------|------|---------|:----:|
| 24h Time Lock | SEQ#2 | `xxx.sol:L42` | ✅ |

### 戦略決定文書準拠
| ドキュメント | 確認項目 | 結果 |
|------------|---------|:----:|
| 04_SCREENS.md | 画面定義準拠 | ✅ |
| 05_AUTH_SECURITY.md | 認証設計準拠 | ✅ |
| 06_DATA_DESIGN.md | データ設計準拠 | ✅ |
| 07_INTEGRATION.md | API統合準拠 | ✅ |

### 発見事項
| # | 重要度 | 項目 | 説明 | 対策 |
|---|--------|------|------|------|
| 1 | Critical/High/Medium/Low | ... | ... | ... |

### 静的解析結果
- Slither: ✅ 警告なし / ❌ X件の警告
- ESLint: ✅ 警告なし / ❌ X件の警告

### 判定
- [ ] ✅ PASS - PIRに進んでください
- [ ] ⚠️ CONDITIONAL - 修正後に再レビュー
- [ ] ❌ FAIL - 実装に差し戻し
```

### 6.7 状態更新

#### ✅ PASS の場合
1. SPEC_REVIEW.md をアーカイブ（存在する場合）
2. CURRENT_STATE.md 実装レポートをリセット

#### ⚠️ CONDITIONAL / ❌ FAIL の場合
1. CURRENT_STATE.md の「🚧 ブロッカー」に追記
2. 「🔜 次のアクション」に修正タスクを追記
3. SPEC_REVIEW.md は保持
