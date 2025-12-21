# 🎯 北極星（現在の目標）

## 必達要件
- NIST FIPS 204 (ML-DSA/Dilithium) 準拠
- 形式検証に耐えられる実装
- 完全量子耐性
- L1/L2相互運用性（既存資産を量子耐性化できるレイヤー）
- NIST採用の暗号証明生成 → zk検証 → 資産ロック → リリースできるProverまでセット
- 証明時間10秒以内
- ガス代を安く

## キーワード
dilithium, 署名, signature, 暗号, crypto, stark, proof, 証明,
verify, replay, 偽造, security, セキュリティ, fips, nist, ml-dsa,
zk, prover, verifier, 実装, implement, 量子, quantum, bridge

## 禁止事項
- テストで勝手にずる（検証しなきゃいけないことを検証せずにOKとする等）
- コードで勝手にずる（検証しなきゃいけないことを検証せずにOKとする等）

## 現在の優先順位
1. Dilithium署名のSP1 zkVM統合（量子耐性の実現）
2. 証明生成時間の最適化（10秒以内達成）
3. ガス効率化のためのコントラクト設計

---
*最終更新: 2024-12-21 by Owner*
```

---

## 📋 更新チェックリスト

| # | ファイル | リンク | 操作 |
|---|----------|--------|------|
| 1 | `scripts/agent_worker.py` | [編集](https://github.com/kota1026/quantum-shield/edit/dev/phase2-native-stark/scripts/agent_worker.py) | 全置換 |
| 2 | `.github/workflows/agent-worker.yml` | [編集](https://github.com/kota1026/quantum-shield/edit/dev/phase2-native-stark/.github/workflows/agent-worker.yml) | 全置換 |
| 3 | `NORTH_STAR.md` | [編集](https://github.com/kota1026/quantum-shield/edit/dev/phase2-native-stark/NORTH_STAR.md) | 更新 or 新規 |

---

## 変更後の動き
```
You: Slackで「北極星を〜に変更」
  ↓
NORTH_STAR.md を編集
  ↓
次サイクル（15分後）から新しい北極星で自律実行！

## 備考

- このファイルはCSOが毎日更新
- 全エージェントは作業前にこのファイルを参照すること
- 北極星に貢献しない作業は後回しにすること
