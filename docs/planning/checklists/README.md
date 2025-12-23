# Checklists Directory

> このディレクトリには、各Phase・Dayのチェックリストが格納されています。

---

## 📂 ディレクトリ構造

```
docs/planning/checklists/
├── README.md                          # このファイル
├── phase1_day8-10_vrf.md              # Day 8-10: VRF統合
├── phase1_day11-14_qa.md              # Day 11-14: 品質保証
└── phase1_month3-6_completion.md      # Month 3-6: 完了・監査
```

---

## 🔍 チェックリストの使い方

### SYSTEM BOOTLOADER連携

1. `docs/planning/CURRENT_STATE.md` で現在地を確認
2. 該当するチェックリストを読み込み
3. 未完了項目を確認
4. タスク実行
5. 完了後、チェックリストとCURRENT_STATEを更新

### 命名規則

```
phase{N}_{scope}_{description}.md

例:
- phase1_day8-10_vrf.md      → Phase 1, Day 8-10, VRF関連
- phase2_month7-8_zk.md      → Phase 2, Month 7-8, ZK Validity
```

---

## 📋 現在のアクティブチェックリスト

| Status | ファイル | 期間 |
|--------|---------|------|
| 🔄 ACTIVE | `phase1_day8-10_vrf.md` | Day 8-10 |
| ⬜ PENDING | `phase1_day11-14_qa.md` | Day 11-14 |
| ⬜ PENDING | `phase1_month3-6_completion.md` | Month 3-6 |

---

## ✅ チェックリスト更新ルール

1. タスク完了時は `□` → `☑` に変更
2. PIR完了後にPIR IDを記録
3. 全項目完了後、CURRENT_STATE.mdのリンクを次のチェックリストに更新

---

**END OF README**
