# Documentation Reorganization Migration Plan

> **Created**: 2026-01-04
> **Status**: Phase 1 完了 / Phase 2-3 保留

## 概要

このドキュメントは、quantum-shieldリポジトリのドキュメント整理計画と進捗を記録します。

## 完了した作業（Phase 1）

### 新規作成ファイル

| ファイル | 説明 |
|---------|------|
| `docs/README.md` | マスターインデックス |
| `docs/phases/phase1/SUMMARY.md` | Phase 1サマリー |
| `docs/phases/phase2/SUMMARY.md` | Phase 2サマリー |
| `docs/phases/phase3/SUMMARY.md` | Phase 3サマリー |
| `docs/specs/UNIFIED_SPEC.md` | 仕様書リファレンス |
| `MIGRATION_PLAN.md` | このファイル |

## 保留中の作業（Phase 2）

### PIRファイルの移動

Phase 1 PIR（`docs/aegis/`と`docs/aegis/pir/`から）→ `docs/phases/phase1/pir/`:
- PIR-002 〜 PIR-011
- GONOGO_PHASE1_COMPLETE.md

Phase 2 PIR → `docs/phases/phase2/pir/`:
- PIR-P2-002 〜 PIR-P2-012

Phase 3 PIR → `docs/phases/phase3/phase3.*/pir/`:
- PIR-P3.1-*
- PIR-P3.2-*
- PIR-P3.3-*

### チェックリストの統合

現在の場所:
- `docs/checklists/`
- `docs/planning/checklists/`

移動先:
- `docs/phases/phase*/checklists/`

### 会議記録の統合

現在の場所:
- `/meetings/`
- `docs/aegis/meetings/`

移動先:
- `docs/meetings/YYYY-MM/`

### アーカイブ

以下をアーカイブ:
- `docs/aegis/WBS.md` → 削除（古い）
- `docs/aegis/WBS_v2.0.md` → `docs/archive/wbs/`
- `docs/aegis/WBS_v2.1.md` → `docs/archive/wbs/`
- `docs/aegis/AGENT_MEETING_PROTOCOL_v3.*.md` → `docs/agents/archive/`

### 参照ファイルの削除

以下のポインターファイルを削除:
- `docs/aegis/SEQUENCES_v2.0.md`
- `docs/aegis/UNIFIED_SPEC_v2.0.md`
- `docs/constitution/QUANTUM_SHIELD_SEQUENCES_v2.0_REF.md`

## 新しいディレクトリ構造

```
docs/
├── README.md                    # マスターインデックス
├── constitution/                # 不変原則
├── specs/                       # 仕様書
├── design/                      # アーキテクチャ
├── phases/                      # フェーズ別
│   ├── phase1/
│   │   ├── SUMMARY.md
│   │   ├── checklists/
│   │   └── pir/
│   ├── phase2/
│   │   ├── SUMMARY.md
│   │   ├── checklists/
│   │   └── pir/
│   ├── phase3/
│   │   ├── SUMMARY.md
│   │   ├── phase3.1/
│   │   ├── phase3.2/
│   │   └── phase3.3/
│   └── phase4/
├── security/
├── cryptography/
│   ├── dilithium/
│   ├── kyber/
│   └── sphincs/
├── verification/
├── deployments/
├── meetings/
├── reports/
│   └── benchmarks/
├── guides/
├── planning/
│   └── archive/
├── agents/
│   └── archive/
└── archive/
    └── wbs/
```

## 実行方法

Phase 2以降の作業は、以下のスクリプトで一括実行可能:

```bash
# ローカルでリポジトリをクローン
git clone https://github.com/kota1026/quantum-shield.git
cd quantum-shield
git checkout docs/reorganization-2026-01-04

# PIRファイルの移動
mkdir -p docs/phases/phase1/pir
mv docs/aegis/PIR-002*.md docs/phases/phase1/pir/
mv docs/aegis/PIR-003*.md docs/phases/phase1/pir/
mv docs/aegis/PIR-004*.md docs/phases/phase1/pir/
mv docs/aegis/PIR-005*.md docs/phases/phase1/pir/
mv docs/aegis/pir/PIR-006.md docs/phases/phase1/pir/
mv docs/aegis/pir/PIR-007.md docs/phases/phase1/pir/
mv docs/aegis/pir/PIR-008.md docs/phases/phase1/pir/
mv docs/aegis/pir/PIR-009*.md docs/phases/phase1/pir/
mv docs/aegis/pir/PIR-010*.md docs/phases/phase1/pir/
mv docs/aegis/pir/PIR-011*.md docs/phases/phase1/pir/
mv docs/aegis/pir/GONOGO_PHASE1_COMPLETE.md docs/phases/phase1/pir/

# Phase 2 PIRの移動
mkdir -p docs/phases/phase2/pir
mv docs/aegis/pir/PIR-P2-*.md docs/phases/phase2/pir/

# Phase 3 PIRの移動
mkdir -p docs/phases/phase3/phase3.1/pir
mkdir -p docs/phases/phase3/phase3.2/pir
mkdir -p docs/phases/phase3/phase3.3/pir
mv docs/aegis/pir/PIR-P3.1-*.md docs/phases/phase3/phase3.1/pir/
mv docs/aegis/meetings/PIR-P3.2-*.md docs/phases/phase3/phase3.2/pir/
mv docs/aegis/meetings/PIR-P3.3-*.md docs/phases/phase3/phase3.3/pir/

# コミット
git add .
git commit -m "docs: complete PIR file reorganization"
git push
```

## 注意事項

1. **重複ファイル**: `PIR-P3.1-005.md` が `docs/aegis/pir/` と `docs/aegis/meetings/` の両方に存在。内容を確認してマージが必要。

2. **参照の更新**: PIRファイル移動後、他のドキュメントからの参照リンクを更新する必要あり。

3. **PIR_CODE_REVIEW_ROUTINE.md**: このファイルは `docs/aegis/` に維持（memoryに記載の参照パス）。

## 次のステップ

1. このPRをマージ
2. ローカルでPhase 2作業を実行
3. 新しいPRを作成
