# Quantum Shield 推進マスタープラン

> 作成日: 2026-04-03
> 目的: Beta → 正式ローンチ → Grant獲得 → チーム構築

---

## Phase A: 信頼性の土台固め（今週）

### A-1. フロントエンド修正 ✅ 一部完了
- [x] GitHubリンク統一（kota1026/quantum-shield）
- [ ] ホワイトペーパーページに実コンテンツ追加（現在 /whitepaper.pdf が空）
- [ ] ブログURL確認（blog.quantumshield.io → 存在しなければ削除 or GitHub Pagesに差し替え）
- [ ] docs.quantumshield.io リンク確認（Security/Auditページ参照先）
- [ ] L1秘密鍵ローテーション（チャット履歴に露出）

### A-2. README・ドキュメント更新
- [ ] README.md にライブデモURL追加（https://quantum-shield.xyz）
- [ ] アーキテクチャ図をREADMEに埋め込み
- [ ] セットアップ手順の簡素化

---

## Phase B: 全機能テスト（来週）

### 9コアシーケンス検証

| # | シーケンス | FE画面 | BEルート | テスト状態 |
|---|-----------|--------|----------|-----------|
| 1 | **Lock** | /consumer/lock | POST /v1/locks | ✅ 動作確認済み |
| 2 | **Unlock (Normal)** | /consumer/unlock | POST /v1/locks/:id/unlock | ✅ 動作確認済み |
| 3 | **Unlock (Emergency)** | /consumer/emergency-bond | POST /v1/locks/:id/emergency-unlock | ⬜ 未テスト |
| 3' | **Resync** | 自動 | GET /v1/resync/:lockId | ⬜ 未テスト |
| 4 | **Challenge + Slashing** | /observer/challenge/new | POST /v1/challenges | ⬜ 未テスト |
| 5 | **Prover Registration** | /prover/application | POST /v1/provers/register | ⬜ 未テスト |
| 6 | **Prover Exit** | /prover/exit | POST /v1/provers/:id/exit | ⬜ 未テスト |
| 7 | **Governance Proposal** | /qs-hub/vote/proposals/create | POST /v1/governance/proposals | ⬜ 未テスト |
| 8 | **Emergency Pause** | /qs-admin/system | POST /v1/admin/emergency-pause | ⬜ 未テスト |
| 9 | **Token Hub (veQS)** | /qs-hub/stake/lock | POST /v1/token-hub/lock | ⬜ 未テスト |

### 追加機能テスト

| 機能 | 画面 | テスト状態 |
|------|------|-----------|
| **Explorer概要** | /explorer/overview | ⬜ 未テスト |
| **Explorer検索** | /explorer/search | ⬜ 未テスト |
| **Proverダッシュボード** | /prover/dashboard | ⬜ 未テスト |
| **Proverメトリクス** | /prover/metrics | ⬜ 未テスト |
| **Observer監視** | /observer/dashboard | ⬜ 未テスト |
| **QS-Hub ダッシュボード** | /qs-hub/dashboard | ⬜ 未テスト |
| **QS-Hub 報酬** | /qs-hub/rewards | ⬜ 未テスト |
| **QS-Hub 委任** | /qs-hub/vote/delegates | ⬜ 未テスト |
| **Token分配確認** | /qs-hub/get-qs | ⬜ 未テスト |
| **Adminダッシュボード** | /qs-admin/dashboard | ⬜ 未テスト |
| **Admin Treasury** | /qs-admin/treasury | ⬜ 未テスト |
| **Enterprise監視** | /enterprise/monitoring | ⬜ 未テスト |
| **Enterprise監査ログ** | /enterprise/audit-log | ⬜ 未テスト |

### テスト環境
- **推奨**: ローカルMacでClaude Code + Playwright MCP
- **代替**: スクリーンショットベースでの確認

---

## Phase C: 資金調達準備（今月中）

### C-1. Grant応募材料

| 材料 | 状態 | 優先度 |
|------|------|--------|
| EF Grant Application | ドラフトあり（docs/pitch/ef-grant-application.md） | ★★★ |
| Pitch Deck | ドラフトあり（docs/pitch/PITCH_DECK_v1.md） | ★★★ |
| ホワイトペーパー | 空 → 作成必要 | ★★★ |
| デモ動画（2-3分） | 未作成 | ★★ |
| ライブデモURL | https://quantum-shield.xyz ✅ | ★★★ |
| ロードマップ | 未作成 → 本ドキュメントで代替可 | ★★ |

### C-2. Grant応募先

| Grant | 金額 | 締切 | 相性 |
|-------|------|------|------|
| Ethereum Foundation ESP | $50K-$200K | Rolling | ★★★★★ |
| Arbitrum Foundation | $50K-$100K | Rolling | ★★★★ |
| Chainlink BUILD | サポート+LINK | Rolling | ★★★★ |
| Gitcoin Grants | コミュニティ次第 | ラウンド毎 | ★★★ |

---

## Phase D: セキュリティ強化（Grant資金確保後）

| タスク | 状態 | 優先度 |
|--------|------|--------|
| VRFコントラクトデプロイ（Sepolia） | スクリプト準備済み | ★★★ |
| Signature verification有効化テスト | 環境変数設定済み、動作未検証 | ★★★ |
| スマコン監査（外部） | 未実施 → Grant予算に含める | ★★ |
| Redis追加（Railway） | オプション | ★ |
| JWT秘密鍵強化 | 環境変数で仮設定 | ★★ |
| Rate limiting動作テスト | 有効化済み、未テスト | ★★ |

---

## Phase E: 成長戦略（継続）

### E-1. チーム構築
- [ ] Co-founder（BD/ビジネス）探し → ETH Tokyo, Crypto Discords
- [ ] スマコン監査パートナー契約
- [ ] フロントエンドエンジニア（業務委託）

### E-2. 認知拡大
- [ ] Mirror/Medium記事「なぜ耐量子暗号が今必要か」
- [ ] Twitter/Farcaster発信開始
- [ ] ETH Tokyo/ETH Denver 登壇応募
- [ ] DeFi Llamaリスティング（Mainnetデプロイ後）

### E-3. 技術ロードマップ
- [ ] Mainnet デプロイ準備
- [ ] マルチチェーン対応（Arbitrum, Base）
- [ ] HSM統合（鍵管理強化）
- [ ] SPHINCS+デュアル署名の完全統合

---

## 実行順序

```
今すぐ（このセッション）:
  → ホワイトペーパー骨格作成
  → ブログ/docsリンク確認・修正

今週:
  → 秘密鍵ローテーション
  → README更新
  → EF Grant Application最終化

来週（ローカルMac + Claude Code）:
  → 全9シーケンスの動作テスト
  → 全アプリ画面の動作確認
  → デモ動画撮影

今月:
  → EF Grant + Arbitrum Grant 応募
  → VRFコントラクトデプロイ
  → Co-founder探し開始
```
