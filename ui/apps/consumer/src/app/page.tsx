'use client';

import Link from 'next/link';
import { useState } from 'react';

/**
 * Landing Page - Consumer App
 * Premium Japan Design System v1.0
 *
 * デザイン参考: 01_landing.html
 */

// Hinomaru Logo Component
function HinomaruLogo({ size = 40 }: { size?: number }) {
  const innerSize = size / 2;
  return (
    <div className="logo-hinomaru" style={{ width: size, height: size }}>
      <div className="logo-circle-outer" />
      <div className="logo-hinomaru-inner" style={{ width: innerSize, height: innerSize }} />
    </div>
  );
}

// Hinomaru Visual Component (Hero)
function HinomaruVisual() {
  return (
    <div className="hinomaru-visual">
      <div className="orbit" />
      <div className="orbit orbit-2" />
      <div className="hinomaru-white" />
      <div className="hinomaru-red" />
    </div>
  );
}

// Stats Card Component
function StatCard({ value, label, highlight = false }: { value: string; label: string; highlight?: boolean }) {
  return (
    <div className="qs-card text-center">
      <div className={`text-4xl font-bold mb-2 ${highlight ? 'text-hinomaru-light' : 'text-qs-text-primary'}`}>
        {value}
      </div>
      <div className="text-sm text-qs-text-secondary">{label}</div>
    </div>
  );
}

// Feature Card Component
function FeatureCard({ icon, title, description, badge }: {
  icon: string;
  title: string;
  description: string;
  badge: string;
}) {
  return (
    <div className="qs-card qs-card-highlight">
      <div className="w-14 h-14 flex items-center justify-center bg-hinomaru-dim rounded-qs-lg text-3xl mb-5">
        {icon}
      </div>
      <h3 className="text-xl font-semibold mb-3">{title}</h3>
      <p className="text-sm text-qs-text-secondary leading-relaxed">{description}</p>
      <span className="qs-badge mt-4">{badge}</span>
    </div>
  );
}

// Step Card Component
function StepCard({ number, icon, title, description }: {
  number: number;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div className="qs-card relative">
      <div className="absolute -top-4 left-8 w-8 h-8 bg-hinomaru rounded-full flex items-center justify-center text-sm font-bold text-white">
        {number}
      </div>
      <div className="text-4xl mb-4">{icon}</div>
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-qs-text-secondary leading-relaxed">{description}</p>
    </div>
  );
}

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCookieBanner, setShowCookieBanner] = useState(true);

  return (
    <div className="min-h-screen">
      {/* Premium Background */}
      <div className="premium-bg">
        <div className="red-glow" />
        <div className="gold-glow" />
      </div>

      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-qs-bg-primary/90 backdrop-blur-xl border-b border-qs-border-subtle">
        <div className="max-w-[1200px] mx-auto px-6 py-5 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3">
            <HinomaruLogo />
            <span className="text-lg font-semibold tracking-tight">Quantum Shield</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex gap-8">
            <Link href="#product-section" className="text-sm font-medium text-qs-text-secondary hover:text-qs-text-primary transition-colors">
              プロダクト
            </Link>
            <Link href="/security" className="text-sm font-medium text-qs-text-secondary hover:text-qs-text-primary transition-colors">
              セキュリティ
            </Link>
            <Link href="#howitworks-section" className="text-sm font-medium text-qs-text-secondary hover:text-qs-text-primary transition-colors">
              使い方
            </Link>
            <Link href="/faq" className="text-sm font-medium text-qs-text-secondary hover:text-qs-text-primary transition-colors">
              FAQ
            </Link>
          </nav>

          {/* CTA Button */}
          <Link
            href="/onboarding"
            className="hidden md:block px-6 py-2.5 bg-hinomaru text-white rounded-full text-sm font-semibold hover:bg-hinomaru-light hover:shadow-[0_4px_16px_rgba(188,0,45,0.4)] transition-all"
          >
            アプリを開く
          </Link>

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

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden border-t border-qs-border-subtle bg-qs-bg-primary/95 backdrop-blur-xl">
            <div className="px-6 py-4 flex flex-col gap-4">
              <Link href="#product-section" className="text-qs-text-secondary hover:text-qs-text-primary">プロダクト</Link>
              <Link href="/security" className="text-qs-text-secondary hover:text-qs-text-primary">セキュリティ</Link>
              <Link href="#howitworks-section" className="text-qs-text-secondary hover:text-qs-text-primary">使い方</Link>
              <Link href="/faq" className="text-qs-text-secondary hover:text-qs-text-primary">FAQ</Link>
              <Link
                href="/onboarding"
                className="btn-primary text-center mt-2"
              >
                アプリを開く
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-[1200px] mx-auto px-6">
        {/* Hero Section */}
        <section className="pt-40 pb-20 text-center">
          {/* Badge */}
          <span className="qs-badge-hinomaru px-4 py-2 text-xs mb-6 inline-flex items-center gap-2">
            🛡️ NIST認定 量子耐性暗号
          </span>

          {/* Heading */}
          <h1 className="text-5xl md:text-6xl font-bold leading-tight mb-5 tracking-tight">
            量子コンピュータ時代の
            <br />
            <span className="bg-gradient-to-r from-hinomaru-light to-gold bg-clip-text text-transparent">
              デジタル資産保護
            </span>
          </h1>

          {/* Subtitle */}
          <p className="text-lg text-qs-text-secondary max-w-[600px] mx-auto mb-10 leading-relaxed">
            Dilithium-IIIとZK-STARKを組み合わせた世界初の量子耐性暗号ブリッジ。
            将来の脅威から、今日の資産を守ります。
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/onboarding" className="btn-primary">
              今すぐ無料で始める
            </Link>
            <Link href="#howitworks-section" className="btn-secondary">
              詳しく見る
            </Link>
          </div>

          {/* Hinomaru Visual */}
          <HinomaruVisual />
        </section>

        {/* Stats Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 py-16">
          <StatCard value="$847M+" label="保護された資産" highlight />
          <StatCard value="127" label="アクティブProver" />
          <StatCard value="24h" label="Time Lock期間" />
          <StatCard value="0" label="セキュリティインシデント" />
        </section>

        {/* Features Section */}
        <section id="product-section" className="py-20">
          <div className="section-label">Features</div>
          <h2 className="text-4xl font-bold mb-16">なぜQuantum Shieldなのか</h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon="🔐"
              title="Dilithium-III暗号"
              description="NIST認定の格子ベース電子署名。量子コンピュータでも解読が数学的に困難な次世代暗号技術。"
              badge="🏛️ NIST FIPS 204"
            />
            <FeatureCard
              icon="⏰"
              title="Time Lock保護"
              description="24時間のセキュリティ待機期間。不正アクセスを検知・阻止する時間的バッファを確保。"
              badge="🛡️ 多層防御"
            />
            <FeatureCard
              icon="🔍"
              title="ZK-STARK検証"
              description="ゼロ知識証明による透明性と検証可能性。量子耐性を維持しながらスケーラビリティを実現。"
              badge="⚡ 量子安全ZKP"
            />
            <FeatureCard
              icon="🔑"
              title="セルフカストディ"
              description="あなただけが資産をコントロール。秘密鍵はローカルで生成・保管され、サーバーに送信されません。"
              badge="💎 完全自己管理"
            />
            <FeatureCard
              icon="⚠️"
              title="緊急リカバリー"
              description="秘密鍵を紛失しても安心。7日間の待機とBondで資産を回収できるセーフティネット。"
              badge="🆘 鍵紛失対策"
            />
            <FeatureCard
              icon="👁️"
              title="透明性"
              description="全てのトランザクションはオンチェーンで検証可能。オープンソースで監査済みのスマートコントラクト。"
              badge="📖 オープンソース"
            />
          </div>
        </section>

        {/* How It Works Section */}
        <section id="howitworks-section" className="py-20">
          <div className="section-label">How It Works</div>
          <h2 className="text-4xl font-bold mb-16">3ステップで資産を保護</h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StepCard
              number={1}
              icon="🔑"
              title="鍵を生成"
              description="ウォレットを接続し、Dilithium鍵ペアを生成。秘密鍵はあなたのデバイスにのみ保存されます。"
            />
            <StepCard
              number={2}
              icon="🔒"
              title="資産をLock"
              description="ETHやERC-20トークンを量子耐性金庫にLock。Dilithium署名なしでは引き出せません。"
            />
            <StepCard
              number={3}
              icon="🔓"
              title="安全にUnlock"
              description="Dilithium署名でUnlock要求。24時間のTime Lock後、資産が安全にウォレットに戻ります。"
            />
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 text-center">
          <h2 className="text-4xl font-bold mb-4">量子時代に備えよう</h2>
          <p className="text-lg text-qs-text-secondary max-w-[600px] mx-auto mb-10">
            「今収集して後で解読」攻撃から資産を守る。
            <br />
            将来の脅威に、今日から対策を。
          </p>
          <Link href="/onboarding" className="btn-primary">
            無料で始める
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 border-t border-qs-border-subtle mt-20 py-20">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-16 mb-16">
            {/* Brand */}
            <div className="lg:col-span-1">
              <div className="flex items-center gap-3 mb-4">
                <HinomaruLogo />
                <span className="text-lg font-semibold">Quantum Shield</span>
              </div>
              <p className="text-sm text-qs-text-secondary leading-relaxed">
                量子コンピュータ時代のデジタル資産保護。NIST認定暗号技術で、あなたの資産を未来の脅威から守ります。
              </p>
            </div>

            {/* Product Links */}
            <div>
              <h4 className="text-xs font-semibold tracking-wider uppercase text-qs-text-tertiary mb-5">
                プロダクト
              </h4>
              <div className="flex flex-col gap-3">
                <a href="https://sepolia.etherscan.io" target="_blank" rel="noopener noreferrer" className="text-sm text-qs-text-secondary hover:text-qs-text-primary transition-colors">
                  Explorer
                </a>
                <a href="https://docs.quantumshield.io" target="_blank" rel="noopener noreferrer" className="text-sm text-qs-text-secondary hover:text-qs-text-primary transition-colors">
                  ドキュメント
                </a>
                <a href="https://api.quantumshield.io" target="_blank" rel="noopener noreferrer" className="text-sm text-qs-text-secondary hover:text-qs-text-primary transition-colors">
                  API
                </a>
              </div>
            </div>

            {/* Resource Links */}
            <div>
              <h4 className="text-xs font-semibold tracking-wider uppercase text-qs-text-tertiary mb-5">
                リソース
              </h4>
              <div className="flex flex-col gap-3">
                <a href="/whitepaper.pdf" className="text-sm text-qs-text-secondary hover:text-qs-text-primary transition-colors">
                  ホワイトペーパー
                </a>
                <a href="https://blog.quantumshield.io" target="_blank" rel="noopener noreferrer" className="text-sm text-qs-text-secondary hover:text-qs-text-primary transition-colors">
                  ブログ
                </a>
                <a href="https://github.com/quantumshield" target="_blank" rel="noopener noreferrer" className="text-sm text-qs-text-secondary hover:text-qs-text-primary transition-colors">
                  GitHub
                </a>
              </div>
            </div>

            {/* Support Links */}
            <div>
              <h4 className="text-xs font-semibold tracking-wider uppercase text-qs-text-tertiary mb-5">
                サポート
              </h4>
              <div className="flex flex-col gap-3">
                <Link href="/faq" className="text-sm text-qs-text-secondary hover:text-qs-text-primary transition-colors">
                  FAQ
                </Link>
                <Link href="/security" className="text-sm text-qs-text-secondary hover:text-qs-text-primary transition-colors">
                  セキュリティ
                </Link>
                <a href="mailto:support@quantumshield.io" className="text-sm text-qs-text-secondary hover:text-qs-text-primary transition-colors">
                  お問い合わせ
                </a>
              </div>
            </div>
          </div>

          {/* Footer Bottom */}
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-10 border-t border-qs-border-subtle">
            <p className="text-sm text-qs-text-tertiary">
              © 2026 Quantum Shield. Made in Japan 🇯🇵
            </p>
            <div className="flex gap-6">
              <Link href="/terms" className="text-sm text-qs-text-tertiary hover:text-qs-text-secondary transition-colors">
                利用規約
              </Link>
              <Link href="/privacy" className="text-sm text-qs-text-tertiary hover:text-qs-text-secondary transition-colors">
                プライバシー
              </Link>
              <a href="/risk-disclosure" className="text-sm text-qs-text-tertiary hover:text-qs-text-secondary transition-colors">
                リスク開示
              </a>
            </div>
          </div>
        </div>
      </footer>

      {/* Cookie Banner */}
      {showCookieBanner && (
        <div className="fixed bottom-6 left-6 right-6 max-w-[500px] bg-qs-bg-secondary border border-qs-border-default rounded-qs-xl p-5 flex items-center gap-5 z-50">
          <p className="flex-1 text-sm text-qs-text-secondary">
            このサイトはCookieを使用しています。
            <a href="/cookie-policy" className="text-gold hover:underline ml-1">詳細</a>
          </p>
          <button
            onClick={() => setShowCookieBanner(false)}
            className="px-5 py-2.5 bg-hinomaru text-white rounded-qs-md text-sm font-medium hover:bg-hinomaru-light transition-colors"
          >
            同意する
          </button>
        </div>
      )}
    </div>
  );
}
