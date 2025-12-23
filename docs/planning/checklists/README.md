# Checklists Directory

> このディレクトリには、各Sequence別のチェックリストが格納されています。

---

## 📂 ディレクトリ構造

```
docs/planning/checklists/
├── README.md                              # このファイル
├── sequence_1_lock.md                     # Seq#1: Lock
├── sequence_2_unlock_normal.md            # Seq#2: Unlock (Normal) ← 🔄 ACTIVE
├── sequence_3_unlock_emergency.md         # Seq#3: Unlock (Emergency)
├── sequence_3p_resync.md                  # Seq#3': Resync
├── sequence_4_challenge.md                # Seq#4: Challenge + Slashing
├── sequence_5_prover_registration.md      # Seq#5: Prover Registration
├── sequence_6_prover_exit.md              # Seq#6: Prover Exit
└── formal_verification.md                 # 形式検証チェックリスト
```

---

## 🔍 使い方

### SYSTEM BOOTLOADER連携

1. `docs/planning/CURRENT_STATE.md` で現在地を確認
2. `Active Checklist` に記載されたチェックリストを読み込み
3. 未完了項目を確認
4. タスク実行
5. 完了後、チェックリストとCURRENT_STATEを更新

### 命名規則

```
sequence_{N}_{description}.md

例:
- sequence_1_lock.md       → Sequence #1: Lock
- sequence_2_unlock_normal.md → Sequence #2: Unlock (Normal)
- sequence_4_challenge.md  → Sequence #4: Challenge + Slashing
```

---

## 📋 Sequence Status Overview

| Seq# | ファイル | Status | 担当 |
|------|---------|--------|------|
| 1 | `sequence_1_lock.md` | ✅ COMPLETE | - |
| **2** | **`sequence_2_unlock_normal.md`** | **🔄 ACTIVE** | **Engineer** |
| 3 | `sequence_3_unlock_emergency.md` | ⏳ PENDING | - |
| 3' | `sequence_3p_resync.md` | ⬜ NOT STARTED | - |
| 4 | `sequence_4_challenge.md` | ⏳ PENDING | - |
| 5 | `sequence_5_prover_registration.md` | ⬜ NOT STARTED | - |
| 6 | `sequence_6_prover_exit.md` | ⬜ NOT STARTED | - |

---

## ✅ チェックリスト更新ルール

1. タスク完了時は `□` → `☑` に変更
2. PIR完了後にPIR IDを記録
3. 全項目完了後、CURRENT_STATE.mdのActive Checklistを次のシーケンスに更新
4. 完了したチェックリストのStatusを `✅ COMPLETE` に変更

---

## 🔗 関連ドキュメント

| ドキュメント | パス |
|-------------|------|
| 現在の状態 | `docs/planning/CURRENT_STATE.md` |
| 憲法 | `docs/constitution/CORE_PRINCIPLES.md` |
| シーケンス参照 | `docs/constitution/QUANTUM_SHIELD_SEQUENCES_v2.0_REF.md` |
| 詳細シーケンス | `docs/aegis/QUANTUM_SHIELD_SEQUENCES_v2.0.md` |

---

**END OF README**
