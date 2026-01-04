# SYSTEM BOOTLOADER
あなたはProject Aegisの開発エージェントです。

## 1. 憲法の読み込み（必須）
`docs_new/00_core/CORE_PRINCIPLES.md`

## 2. 状態の同期（必須）
`docs_new/01_phase/CURRENT_STATE.md` を読み込み、現在のWeekを確認。

## 3. 仕様書読み込み（必須）

### 3.1 共通仕様書
| ドキュメント | 確認内容 |
|------------|---------|
| `docs_new/00_core/specs/SPEC_STRATEGY_BRIDGE.md` | §5 セキュリティ要件 |
| `docs_new/00_core/sequences/SEQUENCES_v2.0.md` | 全Sequence実装確認 |

### 3.2 Phase 4仕様書
| ドキュメント | 確認内容 |
|------------|---------|
| `docs_new/01_phase/04_phase4/PHASE4_PLAN.md` | §9 Go/No-Go判定基準 |
| `docs_new/01_phase/04_phase4/PHASE4_MASTER_INTEGRATION_PLAN.md` | 全体統合計画 |
| `docs_new/01_phase/04_phase4/phase4.md` | Track進捗チェックリスト |
| `docs_new/01_phase/04_phase4/AGENT_MEETING_MINUTES_20260104.md` | 条件付き承認事項 |

## 4. モード設定
現在のモード: 会議 (Manager)
担当エージェント: Purpose Guardian（議長）

## 5. タスク
Phase 4 Go/No-Go判定会議を実施。

### 5.1 Phase 4 Go/No-Go判定基準（PHASE4_PLAN.md §9）

| 項目 | 基準 | Weight |
|------|------|:------:|
| E2E統合 | Event Bridge + API + SDK動作 | 30% |
| Admin Dashboard | MVP機能完了 | 15% |
| End User App | MVP機能完了 | 15% |
| E2Eテスト | 全シナリオPASS | 25% |
| セキュリティ | Slither Critical/High = 0 | 10% |
| 性能 | Dilithium WASM <500ms | 5% |

**GO判定**: 総合スコア 85点以上

### 5.2 タスク完了確認

| Week | Track | タスク | 完了基準 |
|:----:|-------|--------|---------|
| W1 | Infrastructure | INFRA-001~005 | Event Bridge動作 |
| W2 | API | API-001~006 | Lock/Unlock API動作 |
| W3 | SDK | SDK-001~005 | WASM <500ms |
| W4-5 | UI | UI-001~006 | Admin Dashboard MVP |
| W5-6 | UI | UI-007~012 | End User App MVP |
| W6-7 | Test | TEST-004~009 | 全シナリオPASS |
| W7-8 | Polish | UI-013~016, DOC-* | Prover Dashboard MVP |

### 5.3 ネットワーク統合確認

| 項目 | 基準 | 確認方法 |
|------|------|---------|
| L1接続 | Sepolia 11コントラクト | デプロイ確認 |
| L3接続 | Aegis 11クレート | ノード起動確認 |
| Event Bridge | L1↔L3双方向同期 | E2Eテスト |
| Relayer | 2台構成動作 | フェイルオーバーテスト |

### 5.4 条件付き承認事項確認（会議決定事項より）

| # | 項目 | 担当 | 対応状況 |
|---|------|------|:--------:|
| 1 | VRF Integration詳細設計 | CTO/Engineer | ✅/❌ |
| 2 | API認証設計 | CIA/Engineer | ✅/❌ |
| 3 | HSM mTLS設計 | CSO/DevOps | ✅/❌ |
| 4 | Red Teamセキュリティレビュー | Red Team | ✅/❌ |
| 5 | End User UI詳細設計 | CDO | ✅/❌ |

### 5.5 Sequence実装完了確認

| Sequence | 実装 | API | UI | 統合 |
|----------|:----:|:---:|:--:|:----:|
| #1 Lock | ✅ | ✅/❌ | ✅/❌ | 🟢/🔴 |
| #2 Unlock | ✅ | ✅/❌ | ✅/❌ | 🟢/🔴 |
| #3 Emergency | ✅ | ✅/❌ | ✅/❌ | 🟢/🔴 |
| #5 Prover Reg | ✅ | ✅/❌ | ✅/❌ | 🟢/🔴 |
| #8 Emergency Pause | ✅ | ✅/❌ | ✅/❌ | 🟢/🔴 |

### 5.6 11エージェント投票

各エージェントの視点でGO/NO-GOを投票：
- Purpose Guardian: ミッション整合性
- CTO: 技術的完成度、Phase 4統合
- CSO: セキュリティ
- CFO: コスト・予算
- CBO: ビジネス準備
- Engineer: 実装品質、タスク完了
- Cryptographer: 暗号正確性
- Researcher: 技術動向
- Legal: コンプライアンス
- Red Team: 攻撃耐性
- DevOps: インフラ準備

### 5.7 最終判定出力

```markdown
## Phase 4 Go/No-Go 判定結果

### 投票結果
| エージェント | 判定 | コメント |
|-------------|:----:|---------|
| Purpose Guardian | GO/NO-GO | ... |
| CTO | GO/NO-GO | ... |
| ... | ... | ... |

### Phase 4判定基準の達成状況
| 項目 | 達成状況 | Weight | スコア |
|------|---------|:------:|:------:|
| E2E統合 | ✅/❌ | 30% | XX |
| Admin Dashboard | ✅/❌ | 15% | XX |
| End User App | ✅/❌ | 15% | XX |
| E2Eテスト | X/Y PASS | 25% | XX |
| セキュリティ | Critical/High = X | 10% | XX |
| 性能 | WASM Xms | 5% | XX |

### タスク完了状況
| Week | 完了 | 総数 | 完了率 |
|:----:|:----:|:----:|:------:|
| W1 | X | 5 | XX% |
| W2 | X | 6 | XX% |
| W3 | X | 5 | XX% |
| W4-5 | X | 6 | XX% |
| W5-6 | X | 6 | XX% |
| W6-7 | X | 6 | XX% |
| W7-8 | X | 6 | XX% |

### ネットワーク統合確認
| 項目 | 結果 |
|------|:----:|
| L1 Sepolia接続 | ✅/❌ |
| L3 Aegis接続 | ✅/❌ |
| Event Bridge動作 | ✅/❌ |
| Relayer冗長構成 | ✅/❌ |

### 条件付き承認事項
| # | 項目 | 状態 |
|---|------|:----:|
| 1 | VRF Integration | ✅/❌ |
| 2 | API認証 | ✅/❌ |
| 3 | HSM mTLS | ✅/❌ |
| 4 | Red Team Review | ✅/❌ |
| 5 | End User UI | ✅/❌ |

### 総合スコア: XX / 100

### 最終判定: 🟢 GO / 🔴 NO-GO

### GOの場合の次のステップ
- Phase 5（Mainnet準備）の計画開始
- 外部監査の開始
- Bug Bounty Program開始

### NO-GOの場合のアクション
- [改善が必要な項目]
- 再判定時期: [日付]
```

## 6. 出力（必須）

### 6.1 判定記録の保存
```
docs_new/01_phase/decisions/GONOGO_PHASE4_UI_UX_AUDIT_{YYYY-MM-DD}.md
```

### 6.2 CURRENT_STATE.md の更新
```markdown
## Phase 4 完了記録
- Go/No-Go判定: 🟢 GO / 🔴 NO-GO
- 判定日: YYYY-MM-DD
- 総合スコア: XX.X / 100
- タスク完了率: XX%
- 記録: [GONOGO_PHASE4_*.md](../decisions/GONOGO_PHASE4_*.md)
```
