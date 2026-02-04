# Design Brief: QS Admin

## Overview

| 項目 | 値 |
|------|-----|
| System | QS Admin |
| System ID | 08 |
| Directory | system_08_qs_admin |
| Priority | P0 |
| Total Screens | 40+ |
| Target Personas | 加藤さん（QS Staff 新人）、松本さん（QS Staff 上級） |
| Created | 2026-01-11 |

---

## Screen List

### Dashboard (5 screens)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 1 | Overview Dashboard | Dashboard | 全員 | システム全体の健全性、主要KPI |
| 2 | TVL Monitor | Dashboard | Operator+ | Total Value Locked推移 |
| 3 | Active Transactions | Dashboard | Operator+ | アクティブなLock/Unlock |
| 4 | Node Status | Dashboard | Admin+ | L3ノードステータス |
| 5 | Alert Center | Dashboard | 全員 | アラート一覧・通知設定 |

### Edition Management (4 screens)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 6 | Edition Mode | Edition | Super Admin | Basic/Decentralized/Enterprise切替 |
| 7 | Edition Switch | Edition | Super Admin | 切替確認・実行 |
| 8 | Edition Settings | Edition | Super Admin | Edition別パラメータ設定 |
| 9 | Edition History | Edition | Admin+ | 切替履歴 |

### L3 Node Management (4 screens)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 10 | Node List | Node | Admin+ | ノード一覧・ステータス |
| 11 | Node Detail | Node | Admin+ | 個別ノード詳細 |
| 12 | Node Add/Remove | Node | Super Admin | ノード追加・削除 |
| 13 | Node Config | Node | Super Admin | ノード設定 |

### Prover Management (6 screens)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 14 | Prover List | Prover | Operator+ | 全Prover一覧 |
| 15 | Prover Detail | Prover | Operator+ | 個別Prover詳細（Stake、SLA） |
| 16 | Prover Queue | Prover | Operator+ | 署名待ちキュー |
| 17 | Prover Application Review | Prover | Admin+ | 新規Prover審査 |
| 18 | Prover Suspend | Prover | Admin+ | Prover一時停止 |
| 19 | Prover Performance | Prover | Operator+ | パフォーマンスレポート |

### Transaction Monitor (5 screens)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 20 | Lock Monitor | TX Monitor | Operator+ | Lock TX一覧・詳細 |
| 21 | Unlock Monitor | TX Monitor | Operator+ | Unlock TX一覧・詳細 |
| 22 | Challenge Monitor | TX Monitor | Operator+ | Challenge状況 |
| 23 | Slashing Events | TX Monitor | Admin+ | Slashing発生履歴 |
| 24 | Anomaly Detection | TX Monitor | Admin+ | 異常検知アラート |

### Emergency Operations (4 screens)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 25 | Emergency Dashboard | Emergency | Admin+ | 緊急対応ダッシュボード |
| 26 | System Pause | Emergency | Super Admin | システム緊急停止 |
| 27 | Pause History | Emergency | Admin+ | Pause履歴・理由 |
| 28 | Recovery Procedures | Emergency | Admin+ | 復旧手順・チェックリスト |

### System Parameters (4 screens)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 29 | TimeLock Settings | Parameters | Super Admin | Time Lock期間設定（CP-3遵守） |
| 30 | Bond Settings | Parameters | Super Admin | Bond額設定 |
| 31 | Slashing Settings | Parameters | Super Admin | Slashing率設定（CP-4遵守） |
| 32 | Fee Settings | Parameters | Super Admin | 手数料設定 |

### Enterprise Customer Management (5 screens)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 33 | Customer List | Enterprise | Admin+ | Enterprise顧客一覧 |
| 34 | Customer Detail | Enterprise | Admin+ | 個別顧客詳細 |
| 35 | Contract Management | Enterprise | Super Admin | 契約管理 |
| 36 | Billing | Enterprise | Admin+ | 請求・支払い管理 |
| 37 | Customer Control | Enterprise | Admin+ | 顧客別制限・設定 |

### Community Management (4 screens)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 38 | Delegate Overview | Community | Operator+ | Delegate一覧 |
| 39 | Proposal Monitor | Community | Operator+ | ガバナンス提案監視 |
| 40 | Council Status | Community | Admin+ | Security/Purpose Council状況 |
| 41 | Treasury Status | Community | Admin+ | Treasury残高・使途 |

### Reports (5 screens)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 42 | Daily Report | Reports | 全員 | 日次レポート |
| 43 | Weekly Report | Reports | Admin+ | 週次レポート |
| 44 | Monthly Report | Reports | Admin+ | 月次レポート |
| 45 | Revenue Report | Reports | Super Admin | 収益レポート |
| 46 | Export Center | Reports | Admin+ | レポートエクスポート |

### Audit Log (3 screens)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 47 | All Logs | Audit | Admin+ | 全操作ログ |
| 48 | User Activity | Audit | Admin+ | ユーザー別操作 |
| 49 | Security Events | Audit | Super Admin | セキュリティイベント |

### Onboarding (3 screens) - Staff向け

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 50 | Welcome | Onboarding | 新人 | 初回ログイン画面 |
| 51 | System Overview | Onboarding | 新人 | QS全体像説明 |
| 52 | Core Principles | Onboarding | 新人 | 5原則解説（CP-1〜5） |

### Staff Management (2 screens)

| # | Screen | Category | Persona | Notes |
|---|--------|----------|---------|-------|
| 53 | Staff List | Staff | Super Admin | スタッフ一覧・権限 |
| 54 | Permission Settings | Staff | Super Admin | 権限管理 |

---

## Design Requirements

### Color Usage

> Premium Japan デザインシステム準拠

| 用途 | 色 | 使用場面 |
|------|-----|----------|
| Primary Actions | Hinomaru Red (#BC002D) | 緊急Pause、重要アクション |
| Secondary | Gold (#C9A962) | ナビゲーション、装飾 |
| Background | Dark (#0A0A0C) | ページ背景 |
| Success | Green (#00C896) | 正常ステータス、完了 |
| Warning | Orange (#F0A030) | 警告、注意 |
| Error | Orange-Red (#E07040) | エラー（赤は避ける） |

### Key Visual Elements

1. **リアルタイム監視UI**
   - ライブ更新インジケーター
   - パルスアニメーション（重要アラート）
   - ステータスバッジ

2. **緊急対応UI**
   - 大きなPauseボタン（ワンクリック）
   - 確認ダイアログ（誤操作防止）
   - カウントダウンタイマー

3. **権限可視化**
   - 権限レベルバッジ
   - アクセス不可の明確な表示
   - 操作ログへのリンク

4. **データテーブル**
   - ソート・フィルター
   - ページネーション
   - CSV/PDFエクスポート

### Special Considerations

1. **権限レベル対応**
   - Viewer: 閲覧のみ
   - Operator: TX監視、アラート確認
   - Support: チケット対応（将来）
   - Admin: Pause権限、Prover管理
   - Super Admin: 全権限

2. **Core Principles 遵守**
   - CP-1: 量子耐性 → 全暗号関連表示で確認
   - CP-2: Self-Custody → 秘密鍵サーバー保管禁止
   - CP-3: Time Lock存在 → 0に設定できないUI
   - CP-4: Slashing存在 → 削除不可の明示
   - CP-5: 透明性 → 全操作ログ記録

3. **新人オンボーディング**
   - 段階的な情報開示
   - 5原則の理解確認
   - 緊急対応手順の習得

4. **既存コード連携**
   - `apps/admin-dashboard/` をベースに拡張
   - 既存コンポーネント流用

---

## Persona Details

### 加藤さん（QS Staff 新人）

| 項目 | 内容 |
|------|------|
| 技術レベル | ★★★☆☆（成長中） |
| 年齢 | 26歳 |
| 背景 | 新卒エンジニア、ブロックチェーン基礎知識あり |
| 主な課題 | QSの仕組み理解、緊急対応手順の習得、権限拡大 |
| 期待する体験 | 分かりやすいUI、段階的な権限取得、ドキュメントへのアクセス |
| デバイス | PC 100%（業務用） |

**UX配慮**:
- 専門用語にはツールチップ
- オンボーディング画面での丁寧な説明
- 誤操作防止の確認ダイアログ
- 「誰に聞けばいいか」が分かるUI

### 松本さん（QS Staff 上級）

| 項目 | 内容 |
|------|------|
| 技術レベル | ★★★★★（エキスパート） |
| 年齢 | 35歳 |
| 背景 | QS財団創業メンバー、10年のブロックチェーン開発経験 |
| 主な責任 | 新人教育、緊急Pause判断、Prover審査、システム監視 |
| 期待する体験 | 効率的な操作、包括的なビュー、素早い緊急対応 |
| デバイス | PC 90%、スマホ 10%（緊急アラート） |

**UX配慮**:
- キーボードショートカット
- ダッシュボードのカスタマイズ
- バッチ処理対応
- 詳細ログへの素早いアクセス

---

## User Journeys Reference

### 新人スタッフ（加藤さん）

```
入社 → オンボーディング → 権限取得 → 日常運用 → 緊急対応（見学）→ 権限昇格

1. 入社初日: Viewer権限付与
2. オンボーディング: Welcome → QS全体像 → 5原則 → アーキテクチャ → 担当領域 → 緊急手順
3. 研修完了後: Operator権限付与
4. 日常業務: TX監視、アラート確認
5. 6ヶ月後: Support権限検討
6. 昇進時: Admin権限付与
```

### 上級スタッフ（松本さん）

```
毎朝確認 → Prover審査 → 新人教育 → 緊急対応 → ポストモーテム

1. 毎朝: システム全体の健全性確認（Dashboard）
2. 定期: 新規Prover申請審査
3. 随時: 新人の権限昇格承認
4. 緊急時: Pause実行 → コミュニティ報告
5. 復旧後: ポストモーテム作成
```

---

## Screen Categories Summary

| Category | Screens | Primary Persona | Access Level |
|----------|:-------:|-----------------|--------------|
| Dashboard | 5 | 全員 | Viewer+ |
| Edition Management | 4 | 松本さん | Super Admin |
| L3 Node Management | 4 | 松本さん | Admin+ |
| Prover Management | 6 | 両方 | Operator+ |
| Transaction Monitor | 5 | 両方 | Operator+ |
| Emergency Operations | 4 | 松本さん | Admin+ |
| System Parameters | 4 | 松本さん | Super Admin |
| Enterprise Customer | 5 | 松本さん | Admin+ |
| Community Management | 4 | 両方 | Operator+ |
| Reports | 5 | 両方 | 権限別 |
| Audit Log | 3 | 松本さん | Admin+ |
| Onboarding | 3 | 加藤さん | 新人 |
| Staff Management | 2 | 松本さん | Super Admin |
| **Total** | **54** | | |

> 注: 当初40画面想定から54画面に拡張。Staff Onboarding/Managementを追加。

---

## File Structure

```
system_08_qs_admin/
├── README.md                       # システム概要 ✅ 存在
├── DESIGN_BRIEF_qs_admin.md        # ★ 本ドキュメント
├── DESIGN_MANIFEST.md              # → 09_design_create で作成
├── PIR_QS_ADMIN.md                 # → 10_design_pir で作成
└── wip/
    ├── wireframes/                 # ワイヤーフレーム用
    └── mocks/                      # HTMLモック用
```

---

## Next Steps

1. → **09_design_create.md** でワイヤーフレーム・HTMLモック作成
2. 優先順位:
   - Phase 1: Dashboard (5) + Emergency Operations (4) + Onboarding (3) = 12画面
   - Phase 2: Prover Management (6) + Transaction Monitor (5) = 11画面
   - Phase 3: 残り31画面

---

## References

| ドキュメント | パス |
|--------------|------|
| Core Principles | `docs_new/00_core/CORE_PRINCIPLES.md` |
| Personas | `docs_new/01_phase/04_phase4/00_戦略決定文書/02_PERSONAS.md` |
| User Journeys | `docs_new/01_phase/04_phase4/00_戦略決定文書/03_USER_JOURNEYS.md` |
| UI Design Guidelines | `docs_new/01_phase/04_phase4/01_design/UI_DESIGN_GUIDELINES.md` |
| UI Progress Tracker | `docs_new/01_phase/04_phase4/01_design/UI_PROGRESS_TRACKER.md` |
| Existing Admin Code | `apps/admin-dashboard/` |

---

**END OF DESIGN BRIEF**
