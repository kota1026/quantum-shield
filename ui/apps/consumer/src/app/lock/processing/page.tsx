'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Shield, Lock, CheckCircle, Circle, XCircle, ExternalLink, AlertTriangle, Loader2 } from 'lucide-react';
import { useAccount } from 'wagmi';
import { useQSLock } from '@quantum-shield/web3';

/**
 * Lock Processing Page - Consumer App
 * タスクID: UI-CON-004
 * 
 * Lock Flow: Input → Confirmation → Processing → Success
 * 仕様書: 04_SCREENS.md §2.1 Consumer App
 */

type Step = 'preparing' | 'signing' | 'submitting' | 'confirming' | 'complete' | 'error';

const steps: { id: Step; title: string; description: string }[] = [
  {
    id: 'preparing',
    title: 'トランザクション準備',
    description: 'Dilithium署名を生成中',
  },
  {
    id: 'signing',
    title: 'ウォレット署名',
    description: 'ウォレットでトランザクションを署名してください',
  },
  {
    id: 'submitting',
    title: 'トランザクション送信',
    description: 'L1 Sepoliaに送信中',
  },
  {
    id: 'confirming',
    title: '確認中',
    description: 'ブロック確認を待機中',
  },
  {
    id: 'complete',
    title: '完了',
    description: '資産がロックされました',
  },
];

// Environment flags
const IS_TESTNET_MODE = process.env.NEXT_PUBLIC_ENABLE_TESTNET_MODE === 'true';

export default function LockProcessingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const amount = searchParams.get('amount') || '0';
  const dilithiumPubKey = searchParams.get('pubKey') || '';
  const userSignature = searchParams.get('signature') || '';
  
  const { address, isConnected } = useAccount();
  const [currentStep, setCurrentStep] = useState<Step>('preparing');
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [usingMockSignatures, setUsingMockSignatures] = useState(false);
  
  const { 
    lock, 
    isPending, 
    isConfirming, 
    isSuccess, 
    txHash 
  } = useQSLock({
    onSuccess: (hash) => {
      console.log('Lock successful:', hash);
      setCurrentStep('complete');
      setProgress(100);
      setTimeout(() => {
        router.push(`/lock/success?amount=${amount}&txHash=${hash}`);
      }, 2000);
    },
    onError: (error) => {
      console.error('Lock failed:', error);
      setErrorMessage(error.message);
      setCurrentStep('error');
    },
  });

  const executeLock = useCallback(async () => {
    if (!isConnected || !address) {
      setErrorMessage('ウォレットが接続されていません');
      setCurrentStep('error');
      return;
    }

    try {
      setCurrentStep('preparing');
      setProgress(10);

      let pubKey = dilithiumPubKey;
      let signature = userSignature;
      
      if (!pubKey || !signature) {
        if (!IS_TESTNET_MODE) {
          setErrorMessage('Dilithium WASMモジュールが利用できません');
          setCurrentStep('error');
          return;
        }
        
        setUsingMockSignatures(true);
        pubKey = generateMockDilithiumPubKey(address);
        signature = generateMockSignature(address, amount);
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
      
      setCurrentStep('signing');
      setProgress(25);

      await lock({
        amount,
        dilithiumPublicKey: pubKey,
        userSignature: signature,
      });

      setCurrentStep('submitting');
      setProgress(50);

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Lock failed');
      setErrorMessage(error.message);
      setCurrentStep('error');
    }
  }, [isConnected, address, amount, dilithiumPubKey, userSignature, lock]);

  useEffect(() => {
    if (isPending) {
      setCurrentStep('signing');
      setProgress(25);
    }
  }, [isPending]);

  useEffect(() => {
    if (isConfirming && txHash) {
      setCurrentStep('confirming');
      setProgress(75);
    }
  }, [isConfirming, txHash]);

  useEffect(() => {
    if (isSuccess) {
      setCurrentStep('complete');
      setProgress(100);
    }
  }, [isSuccess]);

  useEffect(() => {
    if (isConnected && currentStep === 'preparing') {
      executeLock();
    }
  }, [isConnected, currentStep, executeLock]);

  const handleRetry = () => {
    setErrorMessage(null);
    setCurrentStep('preparing');
    setProgress(0);
    setUsingMockSignatures(false);
    executeLock();
  };

  const currentStepIndex = steps.findIndex((s) => s.id === currentStep);
  const etherscanUrl = process.env.NEXT_PUBLIC_ETHERSCAN_URL || 'https://sepolia.etherscan.io';

  // Error State
  if (currentStep === 'error') {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-8 text-center">
            <div className="w-20 h-20 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-red-400" />
            </div>
            <h1 className="text-2xl font-bold mb-2">トランザクション失敗</h1>
            <p className="text-gray-400 mb-6">
              資産のロック中にエラーが発生しました
            </p>
            
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl mb-6 text-left">
              <p className="text-sm text-red-400">{errorMessage}</p>
            </div>
            
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full py-4 bg-emerald-500 hover:bg-emerald-400 text-black font-semibold rounded-xl transition-colors"
              >
                再試行
              </button>
              <Link
                href="/lock"
                className="w-full py-4 border border-white/20 hover:border-white/40 text-white font-semibold rounded-xl transition-colors flex items-center justify-center"
              >
                戻る
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const amountInUsd = (parseFloat(amount) * 2500).toLocaleString('ja-JP', { maximumFractionDigits: 2 });

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-center">
            <Link href="/" className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-emerald-400" />
              <span className="font-semibold">Quantum Shield</span>
            </Link>
          </div>
        </div>
      </header>

      <main className="pt-24 pb-12 px-4">
        <div className="max-w-md mx-auto">
          {/* Testnet Warning */}
          {IS_TESTNET_MODE && usingMockSignatures && (
            <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl mb-6">
              <div className="flex items-start space-x-3">
                <AlertTriangle className="w-5 h-5 text-orange-400 mt-0.5" />
                <div>
                  <p className="text-sm text-orange-400 font-medium mb-1">テストネットモード</p>
                  <p className="text-xs text-gray-400">
                    モックのDilithium署名を使用しています。本番環境では使用しないでください。
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Main Card */}
          <div className="bg-gray-900 border border-white/10 rounded-2xl p-8">
            {/* Status Icon */}
            <div className="text-center mb-8">
              <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 ${
                currentStep === 'complete' 
                  ? 'bg-emerald-500/20' 
                  : 'bg-emerald-500/10'
              }`}>
                {currentStep === 'complete' ? (
                  <CheckCircle className="w-10 h-10 text-emerald-400" />
                ) : (
                  <Loader2 className="w-10 h-10 text-emerald-400 animate-spin" />
                )}
              </div>
              <h1 className="text-2xl font-bold mb-2">
                {currentStep === 'complete' ? 'Lock完了！' : '処理中...'}
              </h1>
              <p className="text-gray-400">
                {currentStep === 'complete'
                  ? `${amount} ETH を正常にロックしました`
                  : 'L1 Sepoliaで資産を保護しています'}
              </p>
            </div>

            {/* Progress Bar */}
            <div className="mb-8">
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-emerald-500 transition-all duration-500"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-center text-sm text-gray-500 mt-2">{progress}%</p>
            </div>

            {/* Steps */}
            <div className="space-y-4 mb-8">
              {steps.map((step, index) => {
                const isComplete = index < currentStepIndex;
                const isCurrent = step.id === currentStep;

                return (
                  <div
                    key={step.id}
                    className={`flex items-start space-x-4 ${
                      isComplete || isCurrent ? 'text-white' : 'text-gray-500'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isComplete ? (
                        <CheckCircle className="w-5 h-5 text-emerald-400" />
                      ) : isCurrent ? (
                        <Loader2 className="w-5 h-5 text-emerald-400 animate-spin" />
                      ) : (
                        <Circle className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <p className="font-medium">
                        {step.title}
                        {step.id === 'preparing' && usingMockSignatures && (
                          <span className="ml-2 text-xs text-orange-400">(Mock)</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-400">{step.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Transaction Hash */}
            {txHash && (
              <div className="p-4 bg-gray-800 rounded-xl mb-6">
                <p className="text-sm text-gray-400 mb-2">トランザクションハッシュ</p>
                <a
                  href={`${etherscanUrl}/tx/${txHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between text-emerald-400 hover:text-emerald-300"
                >
                  <span className="font-mono text-sm">
                    {txHash.slice(0, 10)}...{txHash.slice(-8)}
                  </span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}

            {/* Amount Info */}
            <div className="p-4 bg-gray-800 rounded-xl text-center">
              <p className="text-sm text-gray-400">Lock中</p>
              <p className="text-3xl font-bold">{amount} ETH</p>
              <p className="text-sm text-gray-500">≈ ${amountInUsd} USD</p>
              <p className="text-xs text-gray-500 mt-2">
                L1 Sepolia (Chain ID: 11155111)
              </p>
            </div>
          </div>

          {/* Warning */}
          <p className="text-center text-sm text-gray-500 mt-6">
            処理が完了するまでこのウィンドウを閉じないでください
          </p>
        </div>
      </main>
    </div>
  );
}

function generateMockDilithiumPubKey(address: string): string {
  const seed = address.toLowerCase().replace('0x', '');
  const mockPubKey = Array.from({ length: 64 }, (_, i) => {
    const charCode = seed.charCodeAt(i % seed.length) || 0;
    return ((charCode + i * 17) % 256).toString(16).padStart(2, '0');
  }).join('');
  return mockPubKey;
}

function generateMockSignature(address: string, amount: string): string {
  const seed = `${address}:${amount}`.toLowerCase();
  const mockSignature = Array.from({ length: 128 }, (_, i) => {
    const charCode = seed.charCodeAt(i % seed.length) || 0;
    return ((charCode + i * 31) % 256).toString(16).padStart(2, '0');
  }).join('');
  return mockSignature;
}
