---
title: "機関向け MPC custody に PQC をどう乗せるか — 国内取引所の選択肢"
emoji: "🛡️"
type: "tech"
topics: ["postquantum", "custody", "ethereum", "compliance", "cryptography"]
published: false
---

## 結論先出し

- 国内仮想通貨取引所・信託銀行が「ポスト量子（PQC）custody」を**今日**検討すべき理由は、量子コンピュータの恐怖ではなく、**NSA CNSA 2.0** と **改正資金決済法**・**NISC PQC 移行ガイドライン**が同時に動いているからである。
- 既存 MPC custody（BitGo / Fireblocks / Anchorage / 国内 HSM）に PQC を載せる選択肢は、現状 (a) 鍵ローテーションでの hedge、(b) 単一 PQC 署名の bolt-on、(c) **PQC attestation layer の composable な追加**、の 3 つに整理できる。
- Quantum Shield (QS) は (c) のポジションを取り、ML-DSA-65 と SPHINCS+ の dual NIST 署名構造を Sepolia 上にデプロイ済みである。本稿はその設計判断の背景と、国内 compliance チームが今読み解くべき規制クロスウォークを共有する。

---

## なぜ 2026 年の今、PQC custody を考えるのか

「Harvest Now, Decrypt Later（HNDL）」の議論は、custody 文脈では実はそれほど重要ではない。トランザクション署名は使い切りで、過去のトランザクション署名を後から復号する意味は薄い。

custody 文脈で本当に効いてくるのは次の 2 点である:

1. **規制の deadline が動き始めた**。NSA の CNSA 2.0 は 2030 年までに ML-DSA への移行を義務化しており、米国ベンダー経由で日本市場にサービス提供する custodian は対応せざるを得ない。
2. **長期 control key（マスター鍵 / コールドキー）が量子に晒される時間が長すぎる**。ホットウォレットの鍵は 90 日ローテで済むが、信託のコールドキーは 5〜10 年運用される。CNSA 2.0 の 2030 期限は、そのまま「今年新しく作るコールドキーの寿命中に効く」期限である。

つまり論点は「量子コンピュータがいつ来るか」ではなく、「**規制適合と長期鍵保護**を、現行 MPC custody を壊さずにどう載せるか」になる。

---

## 国内 custody 市場の課題

国内の事業者が直面している規制圧力を簡単に整理する。

- **改正資金決済法（2023 年改正）**: 暗号資産交換業者・電子決済手段等取引業者に対して「適切な暗号制御」を要求している。「適切」の解釈は監督指針側で動いており、PQC を含む方向に進むことはほぼ既定路線である。
- **NISC PQC 移行ガイドライン（2025–2026）**: 政府機関・重要インフラ向けの PQC 移行ロードマップが整備されつつある。金融機関は重要インフラ側に該当する。
- **JCMVP（暗号モジュール試験及び認証制度）**: NIST FIPS 140-3 と整合する形で ML-DSA / SLH-DSA を扱うアルゴリズムリストの更新が議論されている。
- **JFSA とトラストバンク連携**: 信託銀行の tokenized-securities（受益証券のトークン化）案件が立ち上がっており、これらの長期 custody key は PQC 対応が前提になる。

問題は、**既存の MPC custody / HSM ベースの基盤に PQC を載せる「現実的な選択肢」が薄い**ことである。Threshold ECDSA は理論的には PQC 化が研究されているが、production-grade な MPC ベンダーで ML-DSA threshold をサポートしているところは（2026 年 5 月時点で）まだ少ない。

---

## 3 つの選択肢の比較

国内 custodian が取りうるアプローチを 3 つに整理した。

### (a) MPC + 鍵ローテーションで quantum を hedge する

現状の主流。ECDSA の threshold scheme を維持しつつ、ローテーション周期を短くする。

- 長所: 既存スタックを変えなくていい。compliance 報告も従来形式で済む。
- 短所: PQC ではない。CNSA 2.0 直撃。コールドキー / マスター鍵の長期保護にはならない。

### (b) 既存 custody に PQC 単一署名を bolt-on する

Fireblocks / hyperscaler の一部が検討している方向。MPC ECDSA の上に ML-DSA 署名を「追加でつける」。

- 長所: ベンダー側で完結する。ユーザーの operational change が小さい。
- 短所: dual sig ではないので「ML-DSA が後年に破られた場合」のフォールバックがない。また attestation 経路が単一ベンダーに閉じる。

### (c) PQC attestation layer を MPC custody に composable に積む

Quantum Shield のポジショニング。MPC custodian 自身は ECDSA / threshold ECDSA のままでよく、その上の **attestation layer** として PQC 署名と prover pool 検証を載せる。

- 長所: 既存 custodian（BitGo / Fireblocks / Anchorage / 国内信託）と**併用できる**。custodian を置き換える必要がない。
- 短所: attestation layer 側の運用責任が新たに発生する。VRF / prover pool の運用習熟が必要。

(c) が「PQC custody chain を新しく作る」のではなく「**既存 custody の補強層**」として動く点が、本稿の主旨である。

---

## Quantum Shield の構造（要点のみ）

詳細仕様は別記事に譲り、ここでは選択肢 (c) を実装するうえでの最小構成を示す。

### Dual NIST signature の役割分担

- **ML-DSA-65 (FIPS 204)**: hot path。ロック生成・通常 unlock の署名で使う。サイズと検証コストのバランスが良く、頻繁な操作に向く。
- **SPHINCS+ / SLH-DSA (FIPS 205)**: emergency unlock と long-term control key 経路で使う。hash-based なので構造的仮定が少なく、長期鍵の最後の砦として置く。

これは「dual sig が主役」というより、「**hot path と long-term path で署名要件が違う**」という素直な分離である。

### L1 / L3 の分担

- **L1 (Ethereum Sepolia)** に Vault・ProverRegistry・SPHINCS+ Verifier をデプロイ済み:
  - Vault: `0x07012aeF87C6E423c32F2f8eaF81762f63337260`
  - ProverRegistry: `0x08e1fc1A0d614bc132B48950760c7A291cCB8946`
  - SPHINCS+ Verifier: `0xD090b5A627d9bd6D96a8b5f6F504ebCa79980103`
- **L3** で Prover Pool が ML-DSA 署名を検証し、VRF で選ばれた prover が SPHINCS+ co-signature を生成する。
- Dilithium 単独検証は ~15.5M gas で L1 ブロック gas limit を超えるため、**state root commitment** で L1 側のコストを ~200k gas に圧縮する。

### ML-DSA verify の擬似コード（L3 側のイメージ）

```rust
// L3 Prover が受け取るのは (lock_params, pk_dilithium, sig)
fn verify_lock(req: LockRequest) -> Result<StateRoot> {
    // 1. ML-DSA-65 (FIPS 204) で署名検証
    ml_dsa_65::verify(&req.pk, &req.message, &req.sig)?;

    // 2. SR0 = SHA3-256(lock_params || pk_dilithium) を計算
    let sr0 = sha3_256(&[req.lock_params.encode(), req.pk.encode()].concat());

    // 3. L1 Vault には SR0 (32 bytes) のみコミット
    Ok(StateRoot(sr0))
}
```

### 既存 custody 操作者として何が試せるか

- 既存の MPC custody は触らずに、**「lock 操作の attestation」だけを QS に通す**構成で PoC 可能である。
- Sepolia の既存コントラクトに対して、自社が管理している ML-DSA 鍵で lock を作り、L3 prover の co-sign を観察するところから始められる。
- リポジトリは `https://github.com/kota1026/quantum-shield`。

---

## 規制適合の観点 — クロスウォーク

compliance 部門が稟議を通すために必要な対応関係を簡単にまとめる。

| 要件元 | 該当箇所 | QS の対応 |
|---|---|---|
| NSA CNSA 2.0 (2030 ML-DSA) | 連邦調達経由の custodian | ML-DSA-65 を hot path で使用 |
| NIST FIPS 204 (ML-DSA) | NIST 公式準拠 | FIPS 204 準拠の ML-DSA-65 実装 |
| NIST FIPS 205 (SLH-DSA) | 長期鍵保護 | SPHINCS+ を emergency / long-term で使用 |
| FSA 改正資金決済法 (2023) | 「適切な暗号制御」 | dual NIST sig による defense-in-depth |
| NISC PQC 移行ガイドライン | 政府・重要インフラ | ロードマップとの整合性を継続確認 |
| JCMVP | 暗号モジュール認証 | 公開意見募集タイミングをウォッチ |
| EU DORA | ICT リスク管理 | EU 子会社経由で運用する場合の追加要件 |
| US OMB M-23-02 | 連邦機関 PQC 移行 | 米国側 partner 経由で間接的に効く |

JCMVP の ML-DSA / SLH-DSA 対応は今後の公開意見募集で動く可能性が高く、国内 custody 事業者にとってはここが当面のウォッチポイントになる。

---

## CTA — 一緒に詰めたい論点

QS は単独で完結するプロダクトではなく、既存の MPC custodian と組み合わせて動かすことを前提にしている。次のような形でフィードバックをいただきたい:

- **国内取引所・信託銀行 compliance 部門の方**: 「自社の MPC custody の前段に attestation layer を挟む」構成が、実運用上どこで詰まりそうかについて、GitHub Issue でぜひ議論させてほしい: `https://github.com/kota1026/quantum-shield/issues`
- **ETH 系開発者の方**: dual NIST sig の verifier 実装 / state root design に対するレビュー大歓迎。
- **EF ESP application**: 2026-05-11 提出予定。ESP / EF Post-Quantum Security 研究公募と整合させる方向でドラフトを詰めており、レビューに協力してくれる方がいると嬉しい。

営業電話は不要。Issue で淡々と詰めていきたい。

---

## 次のステップ（founder 側の作業チェックリスト）

公開前に founder が手を入れるべき箇所:

- [ ] L1 コントラクトアドレス 3 件（Vault / ProverRegistry / SPHINCS+ Verifier）が `.claude/rules/blockchain.md` の最新値と一致しているか再確認する
- [ ] 「JFSA 改正資金決済法 2023」「NISC PQC 移行ガイドライン 2025–2026」の表記が最新の公式名称・年次と一致しているか事実確認する（特に JCMVP の公開意見募集ステータス）
- [ ] ML-DSA verify 擬似コードを実コードと突合し、`sha3_256` のドメインセパレーション仕様と齟齬がないかレビューする
- [ ] EF ESP 提出予定日（2026-05-11）が最新スケジュールと一致しているか、`docs/grants/EF_ESP_APPLICATION.md` と照合する
- [ ] Zenn フロントマターの `published: false` を、公開判断後に `true` に切り替える（公開タイミングは W19 customer discovery のキックオフ日と揃える）
