'use client';

import Link from 'next/link';
import { Shield, Lock, Unlock, ArrowRight, Clock, Users, ChevronDown, Zap, Eye } from 'lucide-react';
import { useState } from 'react';

/**
 * Landing Page - Consumer App
 * タスクID: UI-CON-001
 * 
 * デザイン参考: CashApp (シンプル、大胆なタイポグラフィ)、Aave (DeFi UI)
 * 仕様書: 04_SCREENS.md §2.1 Consumer App
 */

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-lg border-b border-white/10">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <Shield className="h-8 w-8 text-emerald-400" />
              <span className="text-xl font-bold">Quantum Shield</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              <Link href="/how-it-works" className="text-gray-300 hover:text-white transition-colors">
                仕組み
              </Link>
              <Link href="/security" className="text-gray-300 hover:text-white transition-colors">
                セキュリティ
              </Link>
              <Link href="/faq" className="text-gray-300 hover:text-white transition-colors">
                FAQ
              </Link>
              <Link 
                href="/onboarding"
                className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-2 rounded-full transition-colors"
              >
                始める
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              aria-label="メニュー"
            >
              <div className="w-6 h-0.5 bg-white mb-1.5" />
              <div className="w-6 h-0.5 bg-white mb-1.5" />
              <div className="w-6 h-0.5 bg-white" />
            </button>
          </div>

          {/* Mobile Navigation */}
          {isMenuOpen && (
            <div className="md:hidden py-4 border-t border-white/10">
              <div className="flex flex-col space-y-4">
                <Link href="/how-it-works" className="text-gray-300 hover:text-white">
                  仕組み
                </Link>
                <Link href="/security" className="text-gray-300 hover:text-white">
                  セキュリティ
                </Link>
                <Link href="/faq" className="text-gray-300 hover:text-white">
                  FAQ
                </Link>
                <Link 
                  href="/onboarding"
                  className="bg-emerald-500 hover:bg-emerald-400 text-black font-semibold px-6 py-3 rounded-full text-center"
                >
                  始める
                </Link>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-4 min-h-[90vh] flex items-center">
        {/* Background Gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-900/20 via-black to-purple-900/20" />
        
        {/* Grid Pattern */}
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxwYXRoIGQ9Ik0wIDBoNjB2NjBIMHoiLz48cGF0aCBkPSJNMzAgMzBtLTI4IDBhMjggMjggMCAxIDAgNTYgMGEyOCAyOCAwIDEgMCAtNTYgMCIgc3Ryb2tlPSJyZ2JhKDI1NSwyNTUsMjU1LDAuMDUpIiBzdHJva2Utd2lkdGg9IjAuNSIvPjwvZz48L3N2Zz4=')] opacity-50" />

        <div className="container mx-auto relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center space-x-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-4 py-2 mb-8">
              <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
              <span className="text-emerald-400 text-sm font-medium">量子耐性暗号で守る</span>
            </div>

            {/* Main Heading */}
            <h1 className="text-5xl md:text-7xl font-bold mb-6 leading-tight">
              あなたの資産を
              <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-cyan-400">
                量子時代も安全に
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-gray-400 mb-10 max-w-2xl mx-auto">
              NIST認定の耐量子暗号で、未来の脅威から今日から保護。
              自己管理型で、あなただけが資産にアクセスできます。
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link 
                href="/onboarding"
                className="w-full sm:w-auto bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-lg px-8 py-4 rounded-full transition-all hover:scale-105 flex items-center justify-center space-x-2"
              >
                <span>今すぐ始める</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
              <Link 
                href="/how-it-works"
                className="w-full sm:w-auto border border-white/20 hover:border-white/40 text-white font-semibold text-lg px-8 py-4 rounded-full transition-colors flex items-center justify-center space-x-2"
              >
                <span>仕組みを見る</span>
              </Link>
            </div>

            {/* Stats */}
            <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-emerald-400">24h</div>
                <div className="text-sm text-gray-500 mt-1">タイムロック</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-emerald-400">NIST</div>
                <div className="text-sm text-gray-500 mt-1">準拠アルゴリズム</div>
              </div>
              <div className="text-center">
                <div className="text-3xl md:text-4xl font-bold text-emerald-400">100%</div>
                <div className="text-sm text-gray-500 mt-1">自己管理</div>
              </div>
            </div>
          </div>

          {/* Scroll Indicator */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
            <ChevronDown className="w-6 h-6 text-gray-500" />
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-24 px-4 bg-gradient-to-b from-black to-gray-900">
        <div className="container mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold mb-4">シンプルな3ステップ</h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              複雑な設定は不要。ウォレットを接続して、すぐに資産を保護できます。
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {/* Step 1 */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition-opacity" />
              <div className="relative bg-gray-900 border border-white/10 rounded-2xl p-8 h-full">
                <div className="w-12 h-12 bg-emerald-500/20 rounded-xl flex items-center justify-center mb-6">
                  <Lock className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="text-emerald-400 text-sm font-semibold mb-2">Step 1</div>
                <h3 className="text-xl font-bold mb-3">資産をロック</h3>
                <p className="text-gray-400">
                  ETHを量子耐性のあるVaultにロック。あなただけがアクセスできる秘密鍵で保護されます。
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500 to-purple-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition-opacity" />
              <div className="relative bg-gray-900 border border-white/10 rounded-2xl p-8 h-full">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center mb-6">
                  <Eye className="w-6 h-6 text-cyan-400" />
                </div>
                <div className="text-cyan-400 text-sm font-semibold mb-2">Step 2</div>
                <h3 className="text-xl font-bold mb-3">安全に保管</h3>
                <p className="text-gray-400">
                  複数の独立したProverが常に監視。不正な引き出しは自動的にブロックされます。
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl blur opacity-25 group-hover:opacity-50 transition-opacity" />
              <div className="relative bg-gray-900 border border-white/10 rounded-2xl p-8 h-full">
                <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mb-6">
                  <Unlock className="w-6 h-6 text-purple-400" />
                </div>
                <div className="text-purple-400 text-sm font-semibold mb-2">Step 3</div>
                <h3 className="text-xl font-bold mb-3">いつでも引き出し</h3>
                <p className="text-gray-400">
                  24時間のタイムロック後、いつでも資産を引き出せます。緊急時は7日で回復可能。
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 px-4 bg-gray-900">
        <div className="container mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center max-w-6xl mx-auto">
            {/* Left: Feature List */}
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-8">
                なぜQuantum Shield？
              </h2>
              
              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-emerald-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Shield className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">量子コンピュータ耐性</h3>
                    <p className="text-gray-400">
                      Dilithium-III、SPHINCS+、SHA3-256など、NISTが認定した耐量子暗号アルゴリズムを使用。
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-cyan-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Clock className="w-5 h-5 text-cyan-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">タイムロック保護</h3>
                    <p className="text-gray-400">
                      24時間の待機期間があるため、万が一鍵が漏洩しても対処する時間があります。
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Users className="w-5 h-5 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">分散型検証</h3>
                    <p className="text-gray-400">
                      複数の独立したProverが取引を検証。共謀にはQuadratic Slashingが適用されます。
                    </p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-10 h-10 bg-pink-500/20 rounded-lg flex items-center justify-center flex-shrink-0 mt-1">
                    <Zap className="w-5 h-5 text-pink-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">緊急復旧</h3>
                    <p className="text-gray-400">
                      秘密鍵を紛失しても、7日間のBond期間後に資産を回復できます。
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Visual */}
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/20 to-purple-500/20 rounded-3xl blur-3xl" />
              <div className="relative bg-gray-800/50 border border-white/10 rounded-3xl p-8">
                <div className="aspect-square bg-gray-900 rounded-2xl flex items-center justify-center">
                  <Shield className="w-32 h-32 text-emerald-400 opacity-50" />
                </div>
                <div className="mt-6 text-center">
                  <div className="text-2xl font-bold text-emerald-400">$0</div>
                  <div className="text-gray-500 text-sm">Total Value Locked (Testnet)</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 px-4 bg-black">
        <div className="container mx-auto text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-bold mb-6">
              未来の脅威から、
              <br />
              今日から守る
            </h2>
            <p className="text-gray-400 text-lg mb-10">
              量子コンピュータが現実になる前に、あなたの資産を保護しましょう。
            </p>
            <Link 
              href="/onboarding"
              className="inline-flex items-center space-x-2 bg-emerald-500 hover:bg-emerald-400 text-black font-bold text-lg px-10 py-4 rounded-full transition-all hover:scale-105"
            >
              <span>ウォレットを接続</span>
              <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 bg-black border-t border-white/10">
        <div className="container mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center space-x-2">
              <Shield className="h-6 w-6 text-emerald-400" />
              <span className="font-semibold">Quantum Shield</span>
            </div>
            <div className="flex items-center space-x-8 text-sm text-gray-500">
              <Link href="/how-it-works" className="hover:text-white transition-colors">仕組み</Link>
              <Link href="/security" className="hover:text-white transition-colors">セキュリティ</Link>
              <Link href="/faq" className="hover:text-white transition-colors">FAQ</Link>
            </div>
            <div className="text-sm text-gray-500">
              © 2026 Quantum Shield. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
