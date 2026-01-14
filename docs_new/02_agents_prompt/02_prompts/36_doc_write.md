# 36_doc_write.md - Documentation Writing Prompt

## Phase 6: ドキュメント作成

> **Version**: 1.0
> **Date**: 2026-01-14
> **Purpose**: サービスリリース向けドキュメント作成
> **Structure**: Anthropic Claude 4.x XML Best Practices準拠

---

## 1. Overview

<purpose>
Quantum Shieldサービスリリースに必要な全ドキュメントを作成する。
技術文書、法的文書、ユーザー向けドキュメントを網羅的にカバー。
</purpose>

<document_categories>
  <category id="technical">
    <name>技術ドキュメント</name>
    <items>
      <item>Whitepaper</item>
      <item>API Reference</item>
      <item>Architecture Guide</item>
      <item>Integration Guide</item>
    </items>
  </category>
  <category id="legal">
    <name>法的ドキュメント</name>
    <items>
      <item>Terms of Service</item>
      <item>Privacy Policy</item>
      <item>Data Processing Agreement</item>
      <item>SLA (Service Level Agreement)</item>
    </items>
  </category>
  <category id="user">
    <name>ユーザードキュメント</name>
    <items>
      <item>User Guide</item>
      <item>FAQ</item>
      <item>Quick Start Guide</item>
      <item>Troubleshooting</item>
    </items>
  </category>
</document_categories>

---

## 2. Required Context

<required_context>
  <core_specs priority="MUST_READ">
    <path>docs_new/01_phase/02_phase2/UNIFIED_SPEC.md</path>
    <path>docs_new/01_phase/02_phase2/CORE_PRINCIPLES.md</path>
    <path>docs_new/01_phase/02_phase2/SEQUENCES.md</path>
  </core_specs>
  <design_guidelines priority="MUST_READ">
    <path>docs_new/01_phase/04_phase4/01_design/UI_DESIGN_GUIDELINES.md</path>
  </design_guidelines>
  <phase6_planning priority="MUST_READ">
    <path>docs_new/01_phase/06_phase6/PHASE6_PLANNING_PROPOSAL.md</path>
  </phase6_planning>
</required_context>

---

## 3. Technical Documents

### 3.1 Whitepaper Structure

<whitepaper_template>
```markdown
# Quantum Shield: Post-Quantum Asset Protection Protocol

## Abstract
[150-200 words summarizing the protocol]

## 1. Introduction
### 1.1 The Quantum Threat
### 1.2 Current Solutions and Limitations
### 1.3 Our Approach

## 2. Protocol Architecture
### 2.1 L1 Vault (Ethereum Sepolia)
### 2.2 L3 Aegis (4-Node BFT)
### 2.3 Prover Network

## 3. Cryptographic Foundation
### 3.1 Dilithium-3 Digital Signatures
### 3.2 Kyber-768 Key Encapsulation
### 3.3 Zero-Knowledge Proof of Key Ownership

## 4. Lock-Unlock Mechanism
### 4.1 7-Day Lock Period
### 4.2 Prover Majority Voting
### 4.3 Emergency Recovery

## 5. Token Economics
### 5.1 QS Token Utility
### 5.2 Staking Requirements
### 5.3 Reward Distribution

## 6. Governance
### 6.1 Proposal System
### 6.2 Council Structure
### 6.3 Voting Mechanism

## 7. Security Analysis
### 7.1 Threat Model
### 7.2 Attack Vectors
### 7.3 Mitigations

## 8. Roadmap

## 9. Conclusion

## References
```
</whitepaper_template>

### 3.2 API Reference Template

<api_reference_template>
```markdown
# Quantum Shield API Reference

## Base URL
- Production: `https://api.quantumshield.io/v1`
- Testnet: `https://api.sepolia.quantumshield.io/v1`

## Authentication
Bearer Token認証を使用。

## Endpoints

### Lock Operations

#### POST /locks
新規ロック作成

**Request Body**
| Field | Type | Required | Description |
|-------|------|:--------:|-------------|
| walletAddress | string | Yes | 対象ウォレットアドレス |
| dilithiumPublicKey | string | Yes | Dilithium公開鍵 |
| lockDays | number | No | ロック日数（デフォルト: 7） |

**Response**
```json
{
  "lockId": "lock_abc123",
  "status": "pending",
  "expiresAt": "2026-01-21T00:00:00Z"
}
```

**Error Codes**
| Code | Description |
|------|-------------|
| 400 | Invalid parameters |
| 401 | Unauthorized |
| 409 | Lock already exists |
```
</api_reference_template>

---

## 4. Legal Documents

### 4.1 Terms of Service Structure

<terms_of_service>
```markdown
# Quantum Shield 利用規約

最終更新日: YYYY-MM-DD
発効日: YYYY-MM-DD

## 第1条（定義）
1. 「本サービス」とは...
2. 「ユーザー」とは...
3. 「QSトークン」とは...

## 第2条（サービス内容）
1. 量子耐性資産保護
2. ロック・アンロック機能
3. ガバナンス参加

## 第3条（利用資格）
1. 18歳以上であること
2. 制裁対象国の居住者でないこと
3. 本規約に同意すること

## 第4条（禁止事項）
1. 不正アクセス
2. マネーロンダリング
3. 市場操作

## 第5条（免責事項）
1. 暗号資産の価格変動
2. ブロックチェーンネットワークの障害
3. 第三者サービスの障害

## 第6条（個人情報の取り扱い）
プライバシーポリシーに従う

## 第7条（変更）
30日前の通知により変更可能

## 第8条（準拠法・管轄）
日本法を準拠法とし、東京地方裁判所を専属管轄とする
```
</terms_of_service>

### 4.2 Privacy Policy Structure

<privacy_policy>
```markdown
# Quantum Shield プライバシーポリシー

## 1. 収集する情報
### 1.1 直接収集する情報
- ウォレットアドレス
- メールアドレス（任意）
- 公開鍵情報

### 1.2 自動収集する情報
- IPアドレス
- デバイス情報
- 利用ログ

## 2. 情報の利用目的
- サービス提供
- セキュリティ維持
- 分析・改善

## 3. 情報の共有
- 法的要求への対応
- サービス提供者との共有

## 4. データ保持期間
- アカウント削除後5年間

## 5. ユーザーの権利
- アクセス権
- 訂正権
- 削除権
- ポータビリティ権

## 6. Cookie
- 必須Cookie
- 分析Cookie（オプトアウト可能）

## 7. 連絡先
privacy@quantumshield.io
```
</privacy_policy>

### 4.3 SLA Structure

<sla_template>
```markdown
# Quantum Shield Service Level Agreement

## 1. サービス可用性

| Tier | Uptime Target | Credits |
|------|:-------------:|:-------:|
| Gold | 99.9% | 10% per 0.1% below |
| Platinum | 99.95% | 25% per 0.05% below |
| Enterprise | 99.99% | Custom |

## 2. レスポンス時間

| Operation | Target | P99 |
|-----------|:------:|:---:|
| Lock Creation | 3s | 5s |
| Unlock Request | 2s | 4s |
| Balance Query | 500ms | 1s |

## 3. サポート対応時間

| Priority | First Response | Resolution |
|----------|:--------------:|:----------:|
| Critical | 15 min | 4 hours |
| High | 1 hour | 8 hours |
| Medium | 4 hours | 24 hours |
| Low | 24 hours | 72 hours |

## 4. 除外事項
- 予告されたメンテナンス
- フォースマジュール
- ユーザー起因の問題
- 第三者サービス障害

## 5. 報告とクレジット
- 月次レポート提供
- クレジットは翌月適用
- クレジット上限: 月額の50%
```
</sla_template>

---

## 5. User Documents

### 5.1 Quick Start Guide

<quickstart_template>
```markdown
# Quantum Shield クイックスタートガイド

## 🚀 5分で始める量子耐性資産保護

### Step 1: ウォレット接続
1. 画面右上の「Connect Wallet」をクリック
2. MetaMaskを選択
3. 接続を承認

### Step 2: Dilithium鍵ペア生成
1. 「Generate Keys」をクリック
2. ブラウザでの鍵生成を待つ（約3秒）
3. 秘密鍵をダウンロードして安全に保管

⚠️ **重要**: 秘密鍵は絶対に他人に共有しないでください

### Step 3: 資産をロック
1. 「Lock Assets」をクリック
2. ロック額を入力
3. ロック期間を選択（推奨: 7日以上）
4. 「Confirm Lock」で確定

### Step 4: アンロック申請
1. 「Request Unlock」をクリック
2. Dilithium署名を生成
3. 検証完了を待つ（最大7日）
4. 承認後、資産が返却

## 🆘 困ったときは
- [FAQ](/faq)
- [サポート](/support)
- [Discord](https://discord.gg/quantumshield)
```
</quickstart_template>

### 5.2 FAQ Template

<faq_template>
```markdown
# よくある質問 (FAQ)

## 基本

### Q: Quantum Shieldとは何ですか？
量子コンピュータの脅威から暗号資産を保護するプロトコルです。

### Q: なぜ量子耐性が必要ですか？
将来の量子コンピュータは現在の暗号を解読できる可能性があります。

### Q: 対応しているブロックチェーンは？
Ethereum (Sepolia Testnet) に対応しています。

## ロック・アンロック

### Q: ロック期間は変更できますか？
ロック後の期間変更はできません。

### Q: アンロックにはどれくらい時間がかかりますか？
標準で7日間の検証期間があります。

### Q: 緊急アンロックは可能ですか？
Council承認による緊急アンロック機能があります。

## セキュリティ

### Q: 秘密鍵を紛失した場合は？
アカウント回復機能をご利用ください。

### Q: Dilithium署名とは何ですか？
NIST標準化された量子耐性デジタル署名です。

## トークン

### Q: QSトークンの用途は？
ガバナンス投票とステーキングに使用します。

### Q: ステーキング報酬はありますか？
はい、APY約5-10%の報酬があります。
```
</faq_template>

---

## 6. i18n Requirements

<i18n_rules>
  <rule id="I18N-1">
    全ドキュメントは日本語・英語の両方を作成
  </rule>
  <rule id="I18N-2">
    法的文書は各言語で法的レビューを受ける
  </rule>
  <rule id="I18N-3">
    技術用語は統一された訳語を使用
    <glossary>
      <term en="Lock" ja="ロック" />
      <term en="Unlock" ja="アンロック" />
      <term en="Prover" ja="証明者" />
      <term en="Vault" ja="ボルト" />
      <term en="Governance" ja="ガバナンス" />
      <term en="Staking" ja="ステーキング" />
      <term en="Delegation" ja="委任" />
    </glossary>
  </rule>
</i18n_rules>

---

## 7. Output Checklist

```markdown
## Documentation Review Checklist

### Technical Accuracy
- [ ] 仕様との整合性確認
- [ ] コードサンプルの動作確認
- [ ] APIエンドポイントの正確性

### Legal Compliance
- [ ] 法務レビュー完了
- [ ] 準拠法の明記
- [ ] 免責事項の適切性

### Accessibility
- [ ] 読みやすい文章構造
- [ ] 専門用語の説明
- [ ] 画像のalt属性

### i18n
- [ ] 日本語版完成
- [ ] 英語版完成
- [ ] 用語の一貫性

### Version Control
- [ ] 更新日の記載
- [ ] バージョン番号
- [ ] 変更履歴
```

---

## 8. Output Format

```markdown
## Document Delivery

### Filename Convention
- Technical: `{doc_type}_{version}_{lang}.md`
- Legal: `{doc_type}_{effective_date}_{lang}.md`
- User: `{doc_type}_{lang}.md`

### Delivery Structure
docs/
├── technical/
│   ├── whitepaper_v1.0_ja.md
│   ├── whitepaper_v1.0_en.md
│   ├── api_reference_v1.0_ja.md
│   └── api_reference_v1.0_en.md
├── legal/
│   ├── terms_of_service_2026-01-14_ja.md
│   ├── terms_of_service_2026-01-14_en.md
│   ├── privacy_policy_2026-01-14_ja.md
│   └── privacy_policy_2026-01-14_en.md
└── user/
    ├── quickstart_ja.md
    ├── quickstart_en.md
    ├── faq_ja.md
    └── faq_en.md

### Judgment
- [ ] ✅ **COMPLETE** - 全ドキュメント作成完了
- [ ] ⚠️ **PARTIAL** - 一部ドキュメント未完成
- [ ] ❌ **INCOMPLETE** - 重要ドキュメント未作成
```

---

**END OF PROMPT**
