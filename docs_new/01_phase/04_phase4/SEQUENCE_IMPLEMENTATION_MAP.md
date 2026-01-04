# Quantum Shield - シーケンス実装マッピング仕様書 v1.0

> **作成日**: 2026-01-04
> **目的**: 各シーケンスに対して「既存コード」「新規必要コード」「UI/UX」を完全マッピング
> **レビュー**: CDO + Chief Integration Architect 確認必須

---

## 目次

1. [概要](#1-概要)
2. [Sequence #1: Lock](#2-sequence-1-lock)
3. [Sequence #2: Unlock (Normal)](#3-sequence-2-unlock-normal)
4. [Sequence #3: Unlock (Emergency)](#4-sequence-3-unlock-emergency)
5. [Sequence #3': Resync](#5-sequence-3-resync)
6. [Sequence #4: Challenge + Slashing](#6-sequence-4-challenge--slashing)
7. [Sequence #5: Prover Registration](#7-sequence-5-prover-registration)
8. [Sequence #6: Prover Exit](#8-sequence-6-prover-exit)
9. [Sequence #7: Governance Proposal](#9-sequence-7-governance-proposal)
10. [Sequence #8: Emergency Pause](#10-sequence-8-emergency-pause)
11. [統合ギャップ分析](#11-統合ギャップ分析)

---

## 1. 概要

### 1.1 シーケンス一覧と実装状況

| # | シーケンス | L1実装 | L3実装 | API実装 | UI/UX実装 | 統合状態 |
|---|-----------|:------:|:------:|:-------:|:---------:|:--------:|
| 1 | Lock | ✅ | ✅ | ❌ | ❌ | 🔴 未接続 |
| 2 | Unlock (Normal) | ✅ | ⚠️ 部分 | ❌ | ❌ | 🔴 未接続 |
| 3 | Unlock (Emergency) | ✅ | ⚠️ 部分 | ❌ | ❌ | 🔴 未接続 |
| 3' | Resync | ⚠️ 部分 | ❌ | ❌ | ❌ | 🔴 未接続 |
| 4 | Challenge + Slashing | ✅ | ❌ | ❌ | ❌ | 🔴 未接続 |
| 5 | Prover Registration | ⚠️ 部分 | ✅ | ❌ | ❌ | 🔴 未接続 |
| 6 | Prover Exit | ⚠️ 部分 | ⚠️ 部分 | ❌ | ❌ | 🔴 未接続 |
| 7 | Governance Proposal | ❌ | ✅ | ❌ | ❌ | 🔴 未接続 |
| 8 | Emergency Pause | ✅ | ✅ | ❌ | ❌ | 🟡 接続可能 |

### 1.2 凡例

| 記号 | 意味 |
|------|------|
| ✅ | 完全実装済み |
| ⚠️ | 部分実装（追加作業必要） |
| ❌ | 未実装 |
| 🔴 | 未接続（統合作業必要） |
| 🟡 | 接続可能（軽微な作業で統合可能） |
| 🟢 | 完全統合済み |

---

## 2. Sequence #1: Lock

### 2.1 既存コード

#### L1 (Solidity)

| ファイル |