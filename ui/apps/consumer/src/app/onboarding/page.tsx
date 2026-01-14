'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { Shield, Wallet, Key, CheckCircle, ArrowRight, ArrowLeft, AlertTriangle, Download, Copy, Check } from 'lucide-react';

/**
 * Onboarding Page - Consumer App
 * タスクID: UI-CON-002
 * 
 * フロー: Wallet Connect → Key Generation → Backup → Ready
 * 仕様書: 
 * - 04_SCREENS.md §2.1 Consumer App
 * - 05_AUTH_SECURITY.md §2.1 SIWE認証フロー
 */

type Step = 'connect' | 'generate' | 'backup' | 'ready';

interface StepConfig {
  id: Step;
  title: string;
  description: string;
  icon: typeof Wallet;
}

const steps: StepConfig[] = [
  {
    id: 'connect',
    title: 'ウォレット接続',
    description: 'Ethereumウォレットを接続してください',
    icon: Wallet,
  },
  {
    id: 'generate',
    title: '鍵生成',
    description: '量子耐性のあるDilithium鍵を生成します',
    icon: Key,
  },
  {
    id: 'backup',
    title: 'バックアップ',
    description: '秘密鍵を安全にバックアップしてください',
    icon: Download,
  },
  {
    id: 'ready',
    title: '準備完了',
    description: 'Quantum Shieldを使う準備ができました',
    icon: CheckCircle,
  },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { address, isConnected } = useAccount();
  const { connectors, connect, isPending, error: connectError } = useConnect();
  const { disconnect } = useDisconnect();
  
  const [currentStep, setCurrentStep] = useState<Step>('connect');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [keysGenerated, setKeysGenerated] = useState(false);
  const [publicKey, setPublicKey] = useState<string>('');
  const [backedUp, setBackedUp] = useState(false);
  const [backupConfirmed, setBackupConfirmed] = useState(false);
  const [copied, setCopied] = useState(false);

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const progress = ((currentStepIndex + 1) / steps.length) * 100;

  // ウォレット接続時に自動で次のステップへ
  useEffect(() => {
    if (isConnected && currentStep === 'connect') {
      setTimeout(() => setCurrentStep('generate'), 500);
    }
  }, [isConnected, currentStep]);

  const handleGenerateKeys = async () => {
    setIsGenerating(true);
    setGenerationProgress(0);
    
    // プログレスバーのアニメーション
    const progressInterval = setInterval(() => {
      setGenerationProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 200);

    // 実際のDilithium鍵生成（現在はシミュレーション）
    // TODO: Dilithium WASMを使用した実際の鍵生成に置き換え
    await new Promise((resolve) => setTimeout(resolve, 2000));
    
    clearInterval(progressInterval);
    setGenerationProgress(100);
    
    // シミュレートされた公開鍵
    const simulatedPublicKey = '0x' + Array.from({ length: 64 }, () => 
      Math.floor(Math.random() * 16).toString(16)
    ).join('');
    setPublicKey(simulatedPublicKey);
    
    setKeysGenerated(true);
    setIsGenerating(false);
  };

  const handleBackupDownload = () => {
    // 暗号化されたバックアップファイルのダウンロード（シミュレーション）
    const backupData = {
      version: '1.0',
      type: 'quantum-shield-backup',
      created: new Date().toISOString(),
      address: address,
      publicKey: publicKey,
      // 実際の実装では暗号化された秘密鍵が含まれる
    };
    
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `quantum-shield-backup-${address?.slice(0, 8)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    setBackedUp(true);
  };

  const handleCopyPublicKey = async () => {
    await navigator.clipboard.writeText(publicKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const goToNext = () => {
    const nextIndex = currentStepIndex + 1;
    if (nextIndex < steps.length) {
      setCurrentStep(steps[nextIndex].id);
    }
  };

  const goToPrev = () => {
    if (currentStep === 'generate' && isConnected) {
      disconnect();
      setCurrentStep('connect');
    } else {
      const prevIndex = currentStepIndex - 1;
      if (prevIndex >= 0) {
        setCurrentStep(steps[prevIndex].id);
      }
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'connect':
        return isConnected;
      case 'generate':
        return keysGenerated;
      case 'backup':
        return backedUp && backupConfirmed;
      case 'ready':
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link href="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-emerald-400" />
              <span className="text-xl font-bold">Quantum Shield</span>
            </Link>
            <button 
              onClick={() => router.push('/')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              キャンセル
            </button>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-lg mx-auto">
          {/* Progress Indicator */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-4">
              {steps.map((step, index) => {
                const StepIcon = step.icon;
                const isActive = index === currentStepIndex;
                const isCompleted = index < currentStepIndex;
                
                return (
                  <div key={step.id} className="flex items-center">
                    <div className={`
                      w-10 h-10 rounded-full flex items-center justify-center transition-colors
                      ${isCompleted ? 'bg-emerald-500' : isActive ? 'bg-emerald-500/20 border-2 border-emerald-500' : 'bg-gray-800'}
                    `}>
                      {isCompleted ? (
                        <Check className="w-5 h-5 text-black" />
                      ) : (
                        <StepIcon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-gray-500'}`} />
                      )}
                    </div>
                    {index < steps.length - 1 && (
                      <div className={`w-12 md:w-20 h-0.5 mx-2 ${isCompleted ? 'bg-emerald-500' : 'bg-gray-800'}`} />
                    )}
                  </div>
                );
              })}
            </div>
            <div className="text-center">
              <p className="text-sm text-gray-500">
                ステップ {currentStepIndex + 1} / {steps.length}
              </p>
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-8">
            {/* Step Header */}
            <div className="text-center mb-8">
              <h1 className="text-2xl font-bold mb-2">{steps[currentStepIndex].title}</h1>
              <p className="text-gray-400">{steps[currentStepIndex].description}</p>
            </div>

            {/* Connect Wallet Step */}
            {currentStep === 'connect' && (
              <div className="space-y-4">
                {connectors.map((connector) => (
                  <button
                    key={connector.uid}
                    onClick={() => connect({ connector })}
                    disabled={isPending}
                    className="w-full flex items-center justify-between p-4 bg-gray-800 hover:bg-gray-700 border border-white/10 rounded-xl transition-colors disabled:opacity-50"
                  >
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-700 rounded-lg flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-gray-400" />
                      </div>
                      <span className="font-medium">{connector.name}</span>
                    </div>
                    <ArrowRight className="w-5 h-5 text-gray-500" />
                  </button>
                ))}
                
                {connectError && (
                  <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-red-400 text-sm">{connectError.message}</p>
                  </div>
                )}
                
                <p className="text-center text-sm text-gray-500 mt-6">
                  ウォレットを接続することで、
                  <Link href="/terms" className="text-emerald-400 hover:underline">利用規約</Link>
                  に同意したことになります。
                </p>
              </div>
            )}

            {/* Generate Keys Step */}
            {currentStep === 'generate' && (
              <div className="space-y-6">
                {/* Connected Wallet Info */}
                <div className="p-4 bg-gray-800 rounded-xl">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center">
                        <Wallet className="w-5 h-5 text-emerald-400" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">接続中</p>
                        <p className="font-mono text-sm">
                          {address?.slice(0, 6)}...{address?.slice(-4)}
                        </p>
                      </div>
                    </div>
                    <button 
                      onClick={() => disconnect()}
                      className="text-sm text-gray-500 hover:text-white"
                    >
                      切断
                    </button>
                  </div>
                </div>

                {/* Info Box */}
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <Key className="w-5 h-5 text-emerald-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-emerald-400 mb-1">Dilithium-III 鍵ペア</p>
                      <p className="text-sm text-gray-400">
                        NIST認定の耐量子暗号アルゴリズムです。量子コンピュータが実用化されても、あなたの資産は安全です。
                      </p>
                    </div>
                  </div>
                </div>

                {keysGenerated ? (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">鍵が生成されました</p>
                      <p className="text-sm text-gray-400 mt-1">Dilithium-III鍵ペアの生成が完了しました</p>
                    </div>
                    
                    {/* Public Key Display */}
                    <div className="p-4 bg-gray-800 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-400">公開鍵</p>
                        <button 
                          onClick={handleCopyPublicKey}
                          className="text-emerald-400 hover:text-emerald-300 flex items-center space-x-1"
                        >
                          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                          <span className="text-sm">{copied ? 'コピーしました' : 'コピー'}</span>
                        </button>
                      </div>
                      <p className="font-mono text-xs break-all text-gray-300">{publicKey}</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {isGenerating && (
                      <div className="space-y-2">
                        <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-emerald-500 transition-all duration-300"
                            style={{ width: `${generationProgress}%` }}
                          />
                        </div>
                        <p className="text-center text-sm text-gray-400">
                          鍵を生成中... {generationProgress}%
                        </p>
                      </div>
                    )}
                    
                    <button
                      onClick={handleGenerateKeys}
                      disabled={isGenerating}
                      className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-colors disabled:opacity-50"
                    >
                      {isGenerating ? '生成中...' : '鍵を生成する'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Backup Step */}
            {currentStep === 'backup' && (
              <div className="space-y-6">
                {/* Warning */}
                <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-5 h-5 text-yellow-400 mt-0.5" />
                    <div>
                      <p className="font-medium text-yellow-400 mb-1">重要：秘密鍵をバックアップしてください</p>
                      <p className="text-sm text-gray-400">
                        秘密鍵はこのデバイスにのみ保存されています。デバイスを紛失した場合、バックアップがなければ資産を回復できません。
                      </p>
                    </div>
                  </div>
                </div>

                {backedUp ? (
                  <div className="text-center space-y-4">
                    <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                      <Download className="w-8 h-8 text-emerald-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">ダウンロード完了</p>
                      <p className="text-sm text-gray-400 mt-1">バックアップファイルを安全な場所に保管してください</p>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={handleBackupDownload}
                    className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-colors flex items-center justify-center space-x-2"
                  >
                    <Download className="w-5 h-5" />
                    <span>暗号化バックアップをダウンロード</span>
                  </button>
                )}

                {/* Confirmation Checkbox */}
                <label className="flex items-start space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={backupConfirmed}
                    onChange={(e) => setBackupConfirmed(e.target.checked)}
                    className="w-5 h-5 mt-0.5 rounded border-gray-600 bg-gray-800 text-emerald-500 focus:ring-emerald-500"
                  />
                  <span className="text-sm text-gray-300">
                    バックアップファイルを安全な場所に保存しました。秘密鍵を紛失した場合、このバックアップでのみ回復できることを理解しています。
                  </span>
                </label>
              </div>
            )}

            {/* Ready Step */}
            {currentStep === 'ready' && (
              <div className="text-center space-y-6">
                <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                </div>
                
                <div>
                  <p className="font-semibold text-2xl mb-2">準備完了！</p>
                  <p className="text-gray-400">
                    Quantum Shieldで資産を保護する準備ができました。
                  </p>
                </div>

                {/* Summary */}
                <div className="p-4 bg-gray-800 rounded-xl text-left space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">ウォレット</span>
                    <span className="font-mono text-sm">{address?.slice(0, 6)}...{address?.slice(-4)}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">鍵タイプ</span>
                    <span className="text-emerald-400">Dilithium-III</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-400">バックアップ</span>
                    <span className="text-emerald-400">✓ 完了</span>
                  </div>
                </div>

                <button
                  onClick={() => router.push('/dashboard')}
                  className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-colors flex items-center justify-center space-x-2"
                >
                  <span>ダッシュボードへ</span>
                  <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Navigation Buttons */}
          <div className="mt-6 flex justify-between">
            <button
              onClick={goToPrev}
              disabled={currentStep === 'connect'}
              className="flex items-center space-x-2 text-gray-400 hover:text-white transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              <ArrowLeft className="w-5 h-5" />
              <span>戻る</span>
            </button>

            {currentStep !== 'ready' && (
              <button
                onClick={goToNext}
                disabled={!canProceed()}
                className="flex items-center space-x-2 bg-white/10 hover:bg-white/20 px-6 py-2 rounded-full transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <span>次へ</span>
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
