# Quantum Shield Demo Video Script
## Duration: 60 seconds | Format: Screen recording + voiceover

---

## Pre-recording Setup

```bash
# 1. Start the app
cd apps/web && pnpm dev

# 2. Open browser
# URL: http://localhost:3000/ja/consumer/dashboard

# 3. Screen recording tool
# Mac: Cmd+Shift+5 or OBS Studio
# Windows: OBS Studio
# Resolution: 1920x1080, 30fps

# 4. Optional: Connect MetaMask to Sepolia
# Import test wallet with Sepolia ETH
```

### Browser Setup
- Chrome, ダークモード OFF
- ブックマークバー非表示
- 拡張機能アイコン最小化
- ウィンドウサイズ: 1920x1080（フルスクリーン）

---

## Script

### [0:00 - 0:05] Opening — Hook

**画面**: Consumer App ダッシュボード
**ナレーション**:
> "Quantum computers will break every crypto wallet's signature. NIST has set the standard. The question isn't if — it's who protects your assets first."

### [0:05 - 0:15] Problem → Solution

**画面**: ダッシュボード → 資産表示にズーム
**操作**: マウスで残高をポイント
**ナレーション**:
> "Quantum Shield protects smart contract assets using both NIST post-quantum standards — Dilithium and SPHINCS+ — in a 3-layer architecture. No Ethereum protocol changes required."

### [0:15 - 0:30] Lock Flow Demo

**操作シーケンス**:
1. 「ロックする」ボタンをクリック
2. ロック画面で金額を入力（例: 0.1 ETH）
3. 確認画面が表示される → 内容を確認
4. 「確認してロック」をクリック
5. トランザクション送信中の画面
6. 完了画面

**ナレーション**:
> "Lock your assets in 3 clicks. The protocol creates a quantum-safe vault on Ethereum L1 using SPHINCS+, while Dilithium signatures on L3 verify the operation gas-free."

### [0:30 - 0:40] Security Explanation

**画面**: Explorer のトランザクション詳細画面
**操作**: ロックしたトランザクションを表示、セキュリティスコアをポイント
**ナレーション**:
> "Every lock is protected by Quadratic Slashing — our novel mechanism where collusion costs increase exponentially. Two colluders lose 40% of their stake. Three lose 90%."

### [0:40 - 0:50] Unlock / Auto-Claim

**画面**: Consumer App → ロック済み資産一覧
**操作**: 24時間後のアンロック状態を表示
**ナレーション**:
> "After a 24-hour timelock, assets are automatically returned. No manual claim needed. And if anything goes wrong, an emergency path guarantees you can always recover your assets within 7 days."

### [0:50 - 0:60] Closing — CTA

**画面**: ダッシュボード全体を表示
**ナレーション**:
> "9 applications. 175 screens. Dual NIST compliance. Live on Sepolia today. Quantum Shield — protecting the next era of digital assets."

**テキストオーバーレイ**:
```
QUANTUM SHIELD
quantumshield.io [or GitHub URL]
[Contact email]
```

---

## Recording Tips

1. **マウスは滑らかに動かす** — 急な動きは避ける
2. **各画面で1-2秒止まる** — 視聴者が内容を読む時間
3. **クリック前に0.5秒待つ** — どこをクリックするか分かるように
4. **ナレーションは後録り推奨** — 画面操作に集中して録画、後から音声追加
5. **BGM**: 控えめな電子音楽（ロイヤリティフリー）を低音量で

## Post-production

1. **字幕追加**（英語、オプションで日本語）
2. **テキストオーバーレイ**: キーポイントをテキストで強調
3. **トランジション**: シンプルなフェード（派手なエフェクト不要）
4. **エンドカード**: ロゴ + URL + "Seed Round Open" テキスト

---

## Alternative: Static Demo (Screenshot版)

動画を撮れない場合、以下の4枚のスクリーンショットでも代用可能:

1. **ダッシュボード全体** — プロダクトが存在する証拠
2. **ロック確認画面** — コアフローのUX
3. **Explorer トランザクション詳細** — 技術的な深さ
4. **9アプリの一覧画面** — エコシステムの規模

これを1枚のPDFにまとめて、One-Pagerと一緒にメール添付。
