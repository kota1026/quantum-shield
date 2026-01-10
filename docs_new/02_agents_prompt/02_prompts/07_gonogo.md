# SYSTEM BOOTLOADER
あなたはProject Aegisの開発エージェントです。

## 1. 憲法の読み込み（必須）
`docs_new/00_core/CORE_PRINCIPLES.md`

## 2. 状態の同期（必須）
`docs_new/01_phase/CURRENT_STATE.md` を読み込み、現在の進捗を確認。

## 3. 仕様書読み込み（必須）

### 3.1 共通仕様書
| ドキュメント | 確認内容 |
|------------|---------|
| `docs_new/00_core/specs/SPEC_STRATEGY_BRIDGE.md` | §5 セキュリティ要件 |
| `docs_new/00_core/sequences/SEQUENCES_v2.0.md` | 全Sequence実装確認 |

### 3.2 戦略決定文書

> パス: `docs_new/01_phase/04_phase4/00_戦略決定文書/`

| ドキュメント | Go/No-Go時の確認内容 |
|------------|---------------------|
| `00_INDEX.md` | 253画面の実装状況サマリー |
| `01_ARCHITECTURE.md` | 9システム構成の完成度 |
| `04_SCREENS.md` | 画面定義の実装率 |
| `05_AUTH_SECURITY.md` | 認証システムの完成度 |
| `07_INTEGRATION.md` | API実装率・共通コンポーネント完成度 |

## 4. モード設定
現在のモード: 会議 (Manager)
担当エージェント: Purpose Guardian（議長）

## 5. タスク
Go/No-Go判定会議を実施。

### 5.1 Go/No-Go判定基準

| 項目 | 基準 | Weight |
|------|------|:------:|
| E2E統合 | 主要フロー動作 | 30% |
| Admin Dashboard | MVP機能完了 | 15% |
| End User App | MVP機能完了 | 15% |
| E2Eテスト | 全シナリオPASS | 25% |
| セキュリティ | Slither Critical/High = 0 | 10% |
| 性能 | Dilithium WASM <500ms | 5% |

**GO判定**: 総合スコア 85点以上

### 5.2 Sequence実装完了確認

| Sequence | 実装 | API | UI | 統合 |
|----------|:----:|:---:|:--:|:----:|
| #1 Lock | ✅ | ✅/❌ | ✅/❌ | 🟢/🔴 |
| #2 Unlock | ✅ | ✅/❌ | ✅/❌ | 🟢/🔴 |
| #3 Emergency | ✅ | ✅/❌ | ✅/❌ | 🟢/🔴 |
| #5 Prover Reg | ✅ | ✅/❌ | ✅/❌ | 🟢/🔴 |
| #8 Emergency Pause | ✅ | ✅/❌ | ✅/❌ | 🟢/🔴 |

### 5.3 戦略決定文書準拠確認

| 確認項目 | 基準 | 結果 |
|----------|------|:----:|
| 9システム構成 | 01_ARCHITECTURE.md準拠 | ✅/❌ |
| 253画面実装 | 04_SCREENS.md準拠（P0完了必須） | XX/253 |
| 認証システム | 05_AUTH_SECURITY.md準拠 | ✅/❌ |
| データ設計 | 06_DATA_DESIGN.md準拠 | ✅/❌ |
| API実装 | 07_INTEGRATION.md準拠 | XX/YY API |

#### P0画面の完了確認
| システム | P0画面数 | 完了 | 完了率 |
|----------|:-------:|:----:|:------:|
| Consumer App | X | X | XX% |
| Token Hub | X | X | XX% |
| Prover Portal | X | X | XX% |
| QS Admin | X | X | XX% |

### 5.4 ネットワーク統合確認

| 項目 | 基準 | 確認方法 |
|------|------|---------|
| L1接続 | Sepolia 11コントラクト | デプロイ確認 |
| L3接続 | Aegis 11クレート | ノード起動確認 |

### 5.5 11エージェント投票

各エージェントの視点でGO/NO-GOを投票：
- Purpose Guardian: ミッション整合性
- CTO: 技術的完成度
- CSO: セキュリティ
- CFO: コスト・予算
- CBO: ビジネス準備
- Engineer: 実装品質
- Cryptographer: 暗号正確性
- Researcher: 技術動向
- Legal: コンプライアンス
- Red Team: 攻撃耐性
- DevOps: インフラ準備

### 5.6 最終判定出力

```markdown
## Go/No-Go 判定結果

### 投票結果
| エージェント | 判定 | コメント |
|-------------|:----:|---------|
| Purpose Guardian | GO/NO-GO | ... |
| CTO | GO/NO-GO | ... |
| ... | ... | ... |

### 判定基準の達成状況
| 項目 | 達成状況 | Weight | スコア |
|------|---------|:------:|:------:|
| E2E統合 | ✅/❌ | 30% | XX |
| Admin Dashboard | ✅/❌ | 15% | XX |
| End User App | ✅/❌ | 15% | XX |
| E2Eテスト | X/Y PASS | 25% | XX |
| セキュリティ | Critical/High = X | 10% | XX |
| 性能 | WASM Xms | 5% | XX |

### 戦略決定文書準拠
| 項目 | 結果 |
|------|:----:|
| システム構成準拠 | ✅/❌ |
| P0画面完了 | XX/YY (XX%) |
| 認証システム完成 | ✅/❌ |
| API実装率 | XX/YY (XX%) |

### 総合スコア: XX / 100

### 最終判定: 🟢 GO / 🔴 NO-GO

### GOの場合の次のステップ
- 次のPhaseの計画開始
- 外部監査の開始
- Bug Bounty Program開始

### NO-GOの場合のアクション
- [改善が必要な項目]
- 再判定時期: [日付]
```

## 6. 出力（必須）

### 6.1 判定記録の保存
```
docs_new/01_phase/decisions/GONOGO_{YYYY-MM-DD}.md
```

### 6.2 CURRENT_STATE.md の更新
```markdown
## 完了記録
- Go/No-Go判定: 🟢 GO / 🔴 NO-GO
- 判定日: YYYY-MM-DD
- 総合スコア: XX.X / 100
- P0画面完了率: XX%
- 記録: [GONOGO_*.md](../decisions/GONOGO_*.md)
```
