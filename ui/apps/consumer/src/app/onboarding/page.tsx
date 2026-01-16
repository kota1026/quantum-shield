'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useConnect, useDisconnect } from 'wagmi';

/**
 * Onboarding Page - Consumer App
 * Premium Japan Design System v1.0
 *
 * デザイン参考: 02_onboarding.html
 * フロー: Wallet Connect → Key Generation → Backup → Ready
 */

type Step = 1 | 2 | 3 | 4;

// Hinomaru Logo Component
function HinomaruLogo() {
  return (
    <div className="logo-hinomaru">
      <div className="logo-circle-outer" />
      <div className="logo-hinomaru-inner" />
    </div>
  );
}

// Wallet Option Component
function WalletOption({
  icon,
  name,
  desc,
  onClick,
  selected,
}: {
  icon: string;
  name: string;
  desc: string;
  onClick: () => void;
  selected?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-4 p-4 w-full bg-qs-bg-secondary border rounded-qs-lg cursor-pointer transition-all ${
        selected
          ? 'border-hinomaru bg-hinomaru-dim'
          : 'border-qs-border-default hover:border-hinomaru hover:bg-hinomaru-dim'
      }`}
    >
      <div className="w-11 h-11 flex items-center justify-center bg-qs-bg-elevated rounded-qs-md text-2xl">
        {icon}
      </div>
      <div className="flex-1 text-left">
        <div className="font-semibold text-[15px]">{name}</div>
        <div className="text-xs text-qs-text-secondary">{desc}</div>
      </div>
      <span className="text-qs-text-tertiary text-lg">→</span>
    </button>
  );
}

// Modal Component
function Modal({
  isOpen,
  onClose,
  title,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <div
        className="bg-qs-bg-card border border-qs-border-default rounded-qs-xl max-w-[500px] w-full max-h-[80vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-qs-border-subtle">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button onClick={onClose} className="text-qs-text-secondary text-2xl hover:text-qs-text-primary">
            &times;
          </button>
        </div>
        <div className="p-6">{children}</div>
        <div className="p-4 border-t border-qs-border-subtle">
          <button onClick={onClose} className="btn-primary w-full">
            閉じる
          </button>
        </div>
      </div>
    </div>
  );
}

export default function OnboardingPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending } = useConnect();
  const { disconnect } = useDisconnect();

  const [currentStep, setCurrentStep] = useState<Step>(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [keysGenerated, setKeysGenerated] = useState(false);
  const [publicKey, setPublicKey] = useState('');
  const [backupDownloaded, setBackupDownloaded] = useState(false);
  const [checkbox1, setCheckbox1] = useState(false);
  const [checkbox2, setCheckbox2] = useState(false);

  const [showWalletHelp, setShowWalletHelp] = useState(false);
  const [showDilithiumHelp, setShowDilithiumHelp] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);

  // Auto-advance when wallet connects
  useEffect(() => {
    if (isConnected && currentStep === 1) {
      setTimeout(() => setCurrentStep(2), 500);
    }
  }, [isConnected, currentStep]);

  const handleSelectWallet = (connectorId: string) => {
    const connector = connectors.find((c) => c.id === connectorId || c.name.toLowerCase().includes(connectorId));
    if (connector) {
      connect({ connector });
    }
  };

  const handleGenerateKeys = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);

    const interval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + Math.random() * 15;
      });
    }, 200);

    await new Promise((resolve) => setTimeout(resolve, 2000));
    clearInterval(interval);
    setGenerationProgress(100);

    const simulatedPublicKey =
      '0x04a7b3c8d9e2f1a0b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7a8b9...';
    setPublicKey(simulatedPublicKey);
    setKeysGenerated(true);
    setIsGenerating(false);

    setTimeout(() => setCurrentStep(3), 1000);
  };

  const handleDownloadBackup = () => {
    const backupData = {
      version: '1.0',
      algorithm: 'Dilithium-III',
      created: new Date().toISOString(),
      encrypted_private_key: 'ENCRYPTED_KEY_PLACEHOLDER_' + Date.now(),
      public_key: publicKey,
    };

    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantum-shield-backup-${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setBackupDownloaded(true);
    setCheckbox1(true);
  };

  const canContinue = checkbox1 && checkbox2;

  return (
    <div className="min-h-screen flex flex-col">
      {/* Premium Background */}
      <div className="premium-bg">
        <div className="red-glow" />
      </div>

      <div className="relative z-10 max-w-[500px] mx-auto px-6 py-6 flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link
            href="/"
            className="w-10 h-10 flex items-center justify-center bg-qs-bg-secondary border border-qs-border-default rounded-qs-md text-qs-text-secondary hover:border-hinomaru hover:text-hinomaru-light transition-colors"
          >
            ←
          </Link>
          <h1 className="text-xl font-semibold">はじめる</h1>
        </div>

        {/* Progress Bar */}
        <div className="flex gap-2 mb-10">
          {[1, 2, 3, 4].map((step) => (
            <div
              key={step}
              className={`flex-1 h-1 rounded-full overflow-hidden ${
                step <= currentStep
                  ? 'bg-gradient-to-r from-hinomaru to-gold'
                  : 'bg-qs-bg-elevated'
              }`}
            />
          ))}
        </div>

        {/* Onboarding Card */}
        <div className="qs-card flex-1 flex flex-col">
          {/* Step 1: Wallet Connect */}
          {currentStep === 1 && (
            <>
              <div className="text-xs font-semibold text-gold tracking-wide mb-2">
                STEP 1 / 4
              </div>
              <h2 className="text-2xl font-bold mb-3">ウォレットを接続</h2>
              <p className="text-[15px] text-qs-text-secondary leading-relaxed mb-8">
                お使いのウォレットを接続してください。MetaMaskなど、EVM互換のウォレットに対応しています。
              </p>

              <div className="flex flex-col gap-3 mb-6">
                <WalletOption
                  icon="🦊"
                  name="MetaMask"
                  desc="ブラウザ拡張機能"
                  onClick={() => handleSelectWallet('metamask')}
                />
                <WalletOption
                  icon="🔗"
                  name="WalletConnect"
                  desc="QRコードでスキャン"
                  onClick={() => handleSelectWallet('walletconnect')}
                />
                <WalletOption
                  icon="💠"
                  name="Coinbase Wallet"
                  desc="モバイル・ブラウザ"
                  onClick={() => handleSelectWallet('coinbase')}
                />
              </div>

              <div className="mt-auto text-center">
                <button
                  onClick={() => setShowWalletHelp(true)}
                  className="text-sm text-gold hover:underline"
                >
                  ウォレットを持っていない方はこちら
                </button>
              </div>
            </>
          )}

          {/* Step 2: Key Generation */}
          {currentStep === 2 && (
            <>
              <div className="text-xs font-semibold text-gold tracking-wide mb-2">
                STEP 2 / 4
              </div>
              <h2 className="text-2xl font-bold mb-3">
                Dilithium鍵を生成
                <button
                  onClick={() => setShowDilithiumHelp(true)}
                  className="inline-flex items-center justify-center w-[18px] h-[18px] ml-2 bg-gold-dim border border-gold rounded-full text-[11px] font-semibold text-gold hover:bg-gold hover:text-qs-bg-primary transition-colors"
                >
                  ?
                </button>
              </h2>
              <p className="text-[15px] text-qs-text-secondary leading-relaxed mb-6">
                量子耐性のDilithium鍵ペアを生成します。この鍵はあなたのデバイスにのみ保存され、サーバーには送信されません。
              </p>

              {/* Self Custody Notice */}
              <div className="flex items-start gap-3 p-4 bg-hinomaru-dim border border-hinomaru/30 rounded-qs-lg mb-6">
                <span className="text-xl">🔑</span>
                <div className="text-xs text-qs-text-secondary leading-relaxed">
                  <strong className="text-hinomaru-light">自己管理型（セルフカストディ）</strong>
                  <br />
                  生成された秘密鍵はお客様ご自身で管理していただきます。Quantum
                  Shieldは秘密鍵のコピーを保持しません。鍵の紛失・漏洩による損害についてはお客様の自己責任となります。
                </div>
              </div>

              {/* Key Visual */}
              <div className="text-center py-5">
                <div className="relative w-40 h-40 mx-auto mb-8">
                  <div
                    className="absolute inset-0 border-2 border-gold rounded-full"
                    style={{ animation: 'spin 8s linear infinite' }}
                  >
                    <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2 h-2 bg-gold rounded-full" />
                  </div>
                  <div className="absolute inset-[30px] flex items-center justify-center bg-hinomaru-dim rounded-full text-5xl">
                    🔐
                  </div>
                </div>

                <div className="text-sm text-qs-text-secondary mb-2">
                  {keysGenerated
                    ? '鍵ペアの生成が完了しました！'
                    : isGenerating
                    ? 'Dilithium-III鍵ペアを生成中...'
                    : 'ボタンをクリックして生成を開始'}
                </div>

                <div className="w-[200px] h-1.5 bg-qs-bg-elevated rounded-full mx-auto overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-hinomaru to-gold rounded-full transition-all"
                    style={{ width: `${Math.min(generationProgress, 100)}%` }}
                  />
                </div>
              </div>

              <button
                onClick={() => setShowDilithiumHelp(true)}
                className="text-xs text-gold hover:underline flex items-center gap-1 mb-6"
              >
                📖 Dilithium暗号について詳しく知る
              </button>

              <button
                onClick={handleGenerateKeys}
                disabled={isGenerating || keysGenerated}
                className="btn-primary w-full mt-auto"
              >
                {keysGenerated ? '生成完了 ✓' : isGenerating ? '生成中...' : 'Dilithium鍵を生成'}
              </button>
            </>
          )}

          {/* Step 3: Backup */}
          {currentStep === 3 && (
            <>
              <div className="text-xs font-semibold text-gold tracking-wide mb-2">
                STEP 3 / 4
              </div>
              <h2 className="text-2xl font-bold mb-3">鍵をバックアップ</h2>
              <p className="text-[15px] text-qs-text-secondary leading-relaxed mb-6">
                秘密鍵を安全な場所にバックアップしてください。
              </p>

              {/* Warning Box */}
              <div className="flex items-start gap-3 p-4 bg-qs-warning/10 border border-qs-warning rounded-qs-lg mb-6">
                <span className="text-2xl">⚠️</span>
                <div>
                  <h4 className="text-sm font-semibold text-qs-warning mb-1">
                    重要: 秘密鍵を安全に保管してください
                  </h4>
                  <p className="text-[13px] text-qs-text-secondary leading-relaxed">
                    秘密鍵を失うと、資産へのアクセスが困難になります。必ずバックアップを作成してください。
                  </p>
                </div>
              </div>

              {/* Download Button */}
              <button
                onClick={handleDownloadBackup}
                className={`flex items-center gap-4 p-4 w-full border rounded-qs-lg cursor-pointer transition-all mb-6 ${
                  backupDownloaded
                    ? 'border-qs-success bg-qs-success/10'
                    : 'border-gold bg-qs-bg-secondary hover:border-gold'
                }`}
              >
                <div
                  className={`w-11 h-11 flex items-center justify-center rounded-qs-md text-2xl ${
                    backupDownloaded ? 'bg-qs-success/10' : 'bg-gold-dim'
                  }`}
                >
                  📥
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-[15px] flex items-center gap-2">
                    暗号化ファイルでダウンロード
                    <span
                      className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                        backupDownloaded
                          ? 'bg-qs-success text-qs-bg-primary'
                          : 'bg-gold text-qs-bg-primary'
                      }`}
                    >
                      {backupDownloaded ? '✓ 完了' : '推奨'}
                    </span>
                  </div>
                  <div className="text-xs text-qs-text-secondary">
                    {backupDownloaded ? 'ファイルがダウンロードされました' : 'パスワードで保護されたJSONファイル'}
                  </div>
                </div>
              </button>

              {/* Checkboxes */}
              <div className="flex flex-col gap-3 mb-6">
                <label
                  className={`flex items-start gap-3 p-4 bg-qs-bg-secondary rounded-qs-lg border cursor-pointer transition-all ${
                    checkbox1 ? 'border-qs-success bg-qs-success/10' : 'border-qs-border-default'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checkbox1}
                    onChange={(e) => setCheckbox1(e.target.checked)}
                    className="w-5 h-5 mt-0.5 accent-hinomaru"
                  />
                  <span className="text-[13px] text-qs-text-secondary leading-relaxed">
                    バックアップファイルをダウンロードしました
                  </span>
                </label>

                <label
                  className={`flex items-start gap-3 p-4 bg-qs-bg-secondary rounded-qs-lg border cursor-pointer transition-all ${
                    checkbox2 ? 'border-qs-success bg-qs-success/10' : 'border-qs-border-default'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checkbox2}
                    onChange={(e) => setCheckbox2(e.target.checked)}
                    className="w-5 h-5 mt-0.5 accent-hinomaru"
                  />
                  <span className="text-[13px] text-qs-text-secondary leading-relaxed">
                    ファイルを安全な場所（USBメモリ、オフラインストレージなど）に保存しました。紛失した場合、資産へのアクセスが困難になることを理解しています。
                  </span>
                </label>
              </div>

              <button
                onClick={() => setCurrentStep(4)}
                disabled={!canContinue}
                className="btn-primary w-full mt-auto"
              >
                次へ進む
              </button>
            </>
          )}

          {/* Step 4: Ready */}
          {currentStep === 4 && (
            <div className="text-center py-5">
              <div className="text-xs font-semibold text-gold tracking-wide mb-2">
                STEP 4 / 4
              </div>

              <div
                className="w-[120px] h-[120px] mx-auto mb-8 flex items-center justify-center bg-qs-success/10 border-2 border-qs-success rounded-full text-6xl"
                style={{ animation: 'pop 0.5s ease-out' }}
              >
                ✓
              </div>

              <h2 className="text-3xl font-bold mb-3">準備完了！</h2>
              <p className="text-[15px] text-qs-text-secondary leading-relaxed mb-8">
                Quantum Shieldの設定が完了しました。
                <br />
                これで量子耐性の保護を使用できます。
              </p>

              {/* Ready Features */}
              <div className="flex flex-col gap-3 mb-8 text-left">
                {[
                  'Dilithium鍵ペアを生成しました',
                  '秘密鍵をバックアップしました',
                  '量子耐性保護が有効です',
                ].map((text, i) => (
                  <div key={i} className="flex items-center gap-3 p-3 bg-qs-bg-secondary rounded-qs-md">
                    <div className="w-8 h-8 flex items-center justify-center bg-qs-success/10 rounded-full text-qs-success">
                      ✓
                    </div>
                    <span className="text-sm text-qs-text-secondary">{text}</span>
                  </div>
                ))}
              </div>

              <Link href="/dashboard" className="btn-primary w-full inline-block text-center">
                ダッシュボードへ →
              </Link>

              <button
                onClick={() => setShowTutorial(true)}
                className="block mt-4 text-sm text-gold hover:underline mx-auto"
              >
                使い方チュートリアルを見る
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Wallet Help Modal */}
      <Modal isOpen={showWalletHelp} onClose={() => setShowWalletHelp(false)} title="ウォレットの取得方法">
        <p className="text-sm text-qs-text-secondary mb-4">
          暗号資産ウォレットを持っていない場合は、以下の手順で取得できます。
        </p>
        <h4 className="font-semibold mb-2">MetaMaskの場合:</h4>
        <ul className="list-disc list-inside text-sm text-qs-text-secondary space-y-1 mb-4">
          <li>
            <a href="https://metamask.io" target="_blank" rel="noopener noreferrer" className="text-gold hover:underline">
              metamask.io
            </a>{' '}
            にアクセス
          </li>
          <li>「Download」をクリックしてブラウザ拡張機能をインストール</li>
          <li>画面の指示に従ってウォレットを作成</li>
          <li>シードフレーズを安全に保管</li>
        </ul>
        <h4 className="font-semibold mb-2">注意事項:</h4>
        <ul className="list-disc list-inside text-sm text-qs-text-secondary space-y-1">
          <li>シードフレーズは絶対に他人に教えないでください</li>
          <li>オフラインの安全な場所に保管してください</li>
          <li>公式サイト以外からダウンロードしないでください</li>
        </ul>
      </Modal>

      {/* Dilithium Help Modal */}
      <Modal isOpen={showDilithiumHelp} onClose={() => setShowDilithiumHelp(false)} title="Dilithium暗号とは？">
        <p className="text-sm text-qs-text-secondary mb-4">
          <strong>Dilithium</strong>（ダイリチウム）は、量子コンピュータに対して安全な電子署名アルゴリズムです。
        </p>
        <h4 className="font-semibold mb-2">なぜ必要？</h4>
        <ul className="list-disc list-inside text-sm text-qs-text-secondary space-y-1 mb-4">
          <li>現在の暗号（ECDSA等）は将来の量子コンピュータで解読される可能性があります</li>
          <li>「今収集して後で解読」攻撃から資産を守るために、今から対策が必要です</li>
        </ul>
        <h4 className="font-semibold mb-2">Dilithiumの特徴:</h4>
        <ul className="list-disc list-inside text-sm text-qs-text-secondary space-y-1 mb-4">
          <li>🏛️ <strong>NIST認定</strong>: 2024年にFIPS 204として正式標準化</li>
          <li>🔐 <strong>格子ベース暗号</strong>: 量子コンピュータでも解読が数学的に困難</li>
          <li>⚡ <strong>高速</strong>: 署名・検証が効率的</li>
          <li>📦 <strong>Dilithium-III</strong>: Quantum Shieldで使用するセキュリティレベル</li>
        </ul>
        <h4 className="font-semibold mb-2">安全性:</h4>
        <p className="text-sm text-qs-text-secondary">
          Dilithium-IIIは、NIST Security Level
          3を満たし、128ビット以上の古典的セキュリティと量子セキュリティを提供します。
        </p>
      </Modal>

      {/* Tutorial Modal */}
      <Modal isOpen={showTutorial} onClose={() => setShowTutorial(false)} title="使い方チュートリアル">
        <p className="text-sm text-qs-text-secondary mb-4">
          Quantum Shieldの基本的な使い方を説明します。
        </p>
        <h4 className="font-semibold mb-2">1. 資産をLockする</h4>
        <ul className="list-disc list-inside text-sm text-qs-text-secondary space-y-1 mb-4">
          <li>ダッシュボードで「Lock」をクリック</li>
          <li>保護したい金額を入力</li>
          <li>Dilithium署名で確認</li>
        </ul>
        <h4 className="font-semibold mb-2">2. 資産をUnlockする</h4>
        <ul className="list-disc list-inside text-sm text-qs-text-secondary space-y-1 mb-4">
          <li>通常Unlock: Dilithium署名 + 24時間待機</li>
          <li>緊急Unlock: ウォレット署名 + Bond + 7日間待機</li>
        </ul>
        <h4 className="font-semibold mb-2">3. セキュリティのポイント</h4>
        <ul className="list-disc list-inside text-sm text-qs-text-secondary space-y-1">
          <li>秘密鍵は必ずバックアップしてください</li>
          <li>Time Lockがあなたの資産を守ります</li>
          <li>不審なアクティビティはすぐに確認してください</li>
        </ul>
      </Modal>

    </div>
  );
}
