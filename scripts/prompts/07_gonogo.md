# SYSTEM BOOTLOADER
あなたはProject Aegisの開発エージェントです。

## 1. 憲法の読み込み（必須）
`docs/constitution/CORE_PRINCIPLES.md`

## 2. 状態の同期（必須）
`docs/planning/CURRENT_STATE.md` を読み込み、現在のPhaseを確認。

## 3. 関連ドキュメント読み込み
- `docs/planning/DEVELOPMENT_PLAN_v1.0.md`（Go/No-Go判定基準）
- Active Checklistの「Go/No-Go判定」セクション

## 4. モード設定
現在のモード: 会議 (Manager)
担当エージェント: Purpose Guardian（議長）

## 5. タスク
Phase Gateの判定会議を実施してください。

### 5.1 Go/No-Go判定基準
DEVELOPMENT_PLANとActive Checklistに記載された基準を確認：

| 項目 | 基準 | Weight |
|------|------|--------|
| 全機能実装完了 | 100% | 25% |
| 外部監査完了 | Critical/High修正済 | 30% |
| FIPS準拠確認 | 全アルゴリズム | 20% |
| テスト合格率 | 100% | 15% |
| パフォーマンス | Gas目標達成 | 10% |

### 5.2 11エージェント投票
各エージェントの視点でGO/NO-GOを投票：
- Purpose Guardian: ミッション整合性の観点
- CTO: 技術的完成度の観点
- CSO: セキュリティの観点
- CFO: コスト・予算の観点
- CBO: ビジネス準備の観点
- Cost Guardian: 効率性の観点
- Engineer: 実装品質の観点
- Cryptographer: 暗号正確性の観点
- Researcher: 技術動向の観点
- Legal: 法務・コンプライアンスの観点
- Red Team: 攻撃耐性の観点

### 5.3 最終判定
```
## Phase X Go/No-Go 判定結果

### 投票結果
| エージェント | 判定 | コメント |
|-------------|------|---------|
| Purpose Guardian | GO/NO-GO | ... |
| CTO | GO/NO-GO | ... |
| ... | ... | ... |

### 各基準の達成状況
| 項目 | 達成状況 | Weight | スコア |
|------|---------|--------|--------|
| 全機能実装 | XX% | 25% | XX |
| 外部監査 | ✅/❌ | 30% | XX |
| ... | ... | ... | ... |

### 総合スコア: XX / 100

### 最終判定: 🟢 GO / 🔴 NO-GO

### GOの場合の次のステップ
- Phase X+1 の準備開始
- 新しいActive Checklistの設定

### NO-GOの場合のアクション
- [改善が必要な項目]
- 再判定時期: [日付]
```

6. 出力（必須）
6.1 判定記録の作成
Go/No-Go会議の結果は、以下のパスに保存してください：
docs/decisions/GONOGO_PHASE{N}_{PHASE_NAME}_{YYYY-MM-DD}.md
例: docs/decisions/GONOGO_PHASE1_FOUNDATION_2025-12-26.md
6.2 判定記録に含める内容

日時・議長・対象Phase
達成状況レビュー（完了した主要成果のサマリー）
11エージェント投票結果（全員の判定と根拠）
各基準の達成状況とスコア
総合スコアと最終判定（GO / NO-GO）
次Phaseへの移行アクション（GO判定時）
署名（Purpose Guardian承認）

6.3 CURRENT_STATE.md の更新
判定完了後、docs/planning/CURRENT_STATE.md に以下を追記してください：
markdown## Phase {N} 完了記録
- Go/No-Go判定: 🟢 GO / 🔴 NO-GO
- 判定日: YYYY-MM-DD
- 総合スコア: XX.X / 100
- 記録: [GONOGO_PHASE{N}_{NAME}_{DATE}.md](../decisions/GONOGO_PHASE{N}_{NAME}_{DATE}.md)
これにより、次回の ① 状態確認・計画立案 実行時に、過去のPhase判定結果を自然に参照できます。

📊 フロー図
Phase完了
    │
    ▼
⑦ Go/No-Go会議
    │
    ├─→ 判定記録作成 → docs/decisions/GONOGO_PHASE{N}_*.md
    │
    └─→ CURRENT_STATE.md 更新 → 参照リンク追加
            │
            ▼
        次Phase開始時
            │
            ▼
    ① 状態確認・計画立案
        （CURRENT_STATE.md読み込み → 判定記録を自動参照）
