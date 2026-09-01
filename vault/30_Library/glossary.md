# 用語集（Glossary）

> UI ツールチップや資料作成時の噛み砕き表現の正。初出の専門用語はここの説明を使う。

| 用語 | 説明 |
|------|------|
| **Dilithium (ML-DSA-65)** | NIST FIPS 204 標準の格子ベース耐量子署名。本プロジェクトのユーザー署名の主方式 |
| **SPHINCS+** | ハッシュベースの耐量子署名。Dilithium と組み合わせてデュアル署名を構成（片方が破られても安全） |
| **デュアル署名** | Dilithium + SPHINCS+ の 2 方式で同時署名する本プロトコルの中核設計 |
| **Prover** | ロック資産の正当性を証明するステーク付きノード。ProverRegistry に登録し、不正時は Slashing される |
| **Observer** | Prover を監視し、不正を疑ったら Challenge を発行する役割。VRF で検証者が選ばれる |
| **Challenge** | Observer が Prover の不正を申し立てる手続き。Defense → 判定 → Slashing のパイプラインに繋がる |
| **Slashing** | 不正 Prover のステーク没収。quadratic（二次）カーブで違反回数に応じて没収額が増える |
| **VRF** | Verifiable Random Function。検証可能な乱数で Challenge の検証者を公平に選出。timeout 300 秒 |
| **Time Lock** | Unlock 要求から実行までの強制待機。Normal 24h / Emergency 7 日。不正 Unlock への防御線 |
| **Auto-Claim** | 24h の Time Lock 経過後、ユーザー操作なしで自動的に Claim を実行するバックエンドサービス |
| **Emergency Bond** | Emergency Unlock 時に預ける保証金。最低 0.5 ETH または 5%。濫用防止 |
| **veQS** | QS トークンをロックして得る投票権付きトークン（vote-escrowed QS）。ガバナンスと報酬分配に使用 |
| **SR0** | `lockWithSR0` の SR0。L1 Vault へのロック時の署名要件レベル |
| **L1 / L3** | L1 = Ethereum Sepolia（資産の実体）、L3 = Anvil ローカル / Arbitrum Sepolia（ガバナンス・トークン経済） |
| **SIWE** | Sign-In with Ethereum。ウォレット署名によるログイン。JWT 発行に使用 |
