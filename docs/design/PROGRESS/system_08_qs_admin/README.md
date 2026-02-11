# 📁 System 08: QS Admin - Design Folder

> **Status**: 🔴 Not Started  
> **Priority**: P0  
> **Screens**: 40  
> **Target Users**: QS Foundation Internal

---

## Overview

QS AdminはQS財団の内部管理システムです。
全システムの監視・管理を担当する最重要システム。

### 画面構成

| Category | Screens | Count |
|----------|---------|:-----:|
| Dashboard | Overview, TVL, Active, Nodes, Alerts | 5 |
| Edition Management | Mode, Switch, Settings, History | 4 |
| L3 Node Management | List, Detail, Add/Remove, Config | 4 |
| Prover Management | List, Detail, Queue, Review, Suspend, Performance | 6 |
| Transaction Monitor | Lock, Unlock, Challenge, Slashing, Anomaly | 5 |
| Emergency | Dashboard, Pause, History, Recovery | 4 |
| Parameters | TimeLock, Bond, Slashing, Fee | 4 |
| Enterprise Customers | List, Detail, Contract, Billing, Control | 5 |
| Community | Delegates, Proposals, Council, Treasury | 4 |
| Reports | Daily, Weekly, Monthly, Revenue, Export | 5 |
| Audit Log | All, User, Security | 3 |

---

## Key Requirements

- **リアルタイム監視**: 全システム状態
- **緊急対応**: ワンクリックPause
- **包括的ログ**: 全操作記録
- **権限管理**: 厳格なアクセス制御

---

## Review Agents

| Agent | Focus |
|-------|-------|
| CDO（佐々木さん） | 運用効率、情報設計 |
| 全ペルソナ | 各システムとの整合性確認 |

---

⚠️ **Note**: 既存 `apps/admin-dashboard/` をベースに拡張

---

**Last Updated**: 2026-01-06