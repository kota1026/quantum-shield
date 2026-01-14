'use client';

import Link from 'next/link';

/**
 * Privacy Policy Page - Consumer App
 * Premium Japan Design System v1.0
 *
 * デザイン参考: 18_privacy.html
 */

// Hinomaru Logo Component
function HinomaruLogo() {
  return (
    <div className="logo-hinomaru">
      <div className="logo-circle-outer" />
      <div className="logo-hinomaru-inner" />
    </div>
  );
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen">
      {/* Premium Background */}
      <div className="premium-bg">
        <div className="red-glow" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-qs-border-subtle">
        <div className="max-w-[1200px] mx-auto px-6 py-5 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <HinomaruLogo />
            <span className="text-xl font-bold">Quantum Shield</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-[800px] mx-auto px-6 py-12">
        <h1 className="text-4xl font-bold mb-4">プライバシーポリシー</h1>
        <p className="text-sm text-qs-text-tertiary mb-12">最終更新日: 2026年1月1日</p>

        {/* Highlights */}
        <div className="grid md:grid-cols-3 gap-4 mb-12">
          <div className="qs-card p-5 text-center">
            <div className="text-3xl mb-2">🔐</div>
            <div className="font-semibold mb-1">秘密鍵非収集</div>
            <p className="text-xs text-qs-text-tertiary">サーバーへ送信されません</p>
          </div>
          <div className="qs-card p-5 text-center">
            <div className="text-3xl mb-2">🌐</div>
            <div className="font-semibold mb-1">オンチェーン</div>
            <p className="text-xs text-qs-text-tertiary">透明性のある運用</p>
          </div>
          <div className="qs-card p-5 text-center">
            <div className="text-3xl mb-2">🇯🇵</div>
            <div className="font-semibold mb-1">日本法準拠</div>
            <p className="text-xs text-qs-text-tertiary">個人情報保護法遵守</p>
          </div>
        </div>

        {/* Privacy Content */}
        <article className="prose prose-invert max-w-none">
          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-gold">1. 基本方針</h2>
            <p className="text-qs-text-secondary leading-relaxed">
              Quantum Shield（以下「当社」）は、ユーザーのプライバシーを最大限に尊重し、
              個人情報の保護に努めます。本ポリシーは、当社が収集する情報とその利用方法について説明します。
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-gold">2. 収集する情報</h2>

            <h3 className="text-xl font-semibold mb-3 text-qs-text-primary">2.1 自動的に収集する情報</h3>
            <ul className="list-disc list-inside space-y-2 text-qs-text-secondary mb-6">
              <li>Ethereumウォレットアドレス（公開情報）</li>
              <li>Dilithium公開鍵（スマートコントラクトに登録）</li>
              <li>トランザクション履歴（ブロックチェーン上の公開情報）</li>
              <li>アクセスログ（IPアドレス、ブラウザ情報等）</li>
            </ul>

            <h3 className="text-xl font-semibold mb-3 text-qs-text-primary">2.2 収集しない情報</h3>
            <div
              className="p-4 rounded-qs-lg mb-6"
              style={{
                background: 'rgba(0, 200, 150, 0.1)',
                border: '1px solid rgba(0, 200, 150, 0.5)',
              }}
            >
              <p className="text-sm text-qs-text-secondary leading-relaxed">
                <strong className="text-qs-success">重要：</strong>
                当社は以下の情報を一切収集しません。
              </p>
              <ul className="list-disc list-inside space-y-1 text-qs-text-secondary mt-2">
                <li>Ethereumウォレットの秘密鍵</li>
                <li>Dilithium秘密鍵</li>
                <li>バックアップフレーズ（リカバリーフレーズ）</li>
                <li>個人を特定する情報（氏名、住所、電話番号等）</li>
              </ul>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-gold">3. 情報の利用目的</h2>
            <p className="text-qs-text-secondary leading-relaxed mb-4">
              収集した情報は、以下の目的にのみ使用されます。
            </p>
            <ul className="list-disc list-inside space-y-2 text-qs-text-secondary">
              <li>本サービスの提供および運用</li>
              <li>ユーザーサポートおよび問い合わせ対応</li>
              <li>サービスの改善および新機能の開発</li>
              <li>不正利用の防止およびセキュリティの確保</li>
              <li>法令に基づく開示要請への対応</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-gold">4. 情報の保管</h2>
            <p className="text-qs-text-secondary leading-relaxed mb-4">
              当社が保管する情報は以下の方法で保護されます。
            </p>
            <ul className="list-disc list-inside space-y-2 text-qs-text-secondary">
              <li>TLS 1.3による通信の暗号化</li>
              <li>AES-256による保存データの暗号化</li>
              <li>アクセス制御および監査ログの記録</li>
              <li>定期的なセキュリティ監査の実施</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-gold">5. 第三者への提供</h2>
            <p className="text-qs-text-secondary leading-relaxed">
              当社は、以下の場合を除き、ユーザーの情報を第三者に提供しません。
            </p>
            <ul className="list-disc list-inside space-y-2 text-qs-text-secondary mt-4">
              <li>ユーザーの同意がある場合</li>
              <li>法令に基づく場合</li>
              <li>人の生命、身体または財産の保護のために必要な場合</li>
              <li>サービスの提供に必要な委託先への提供（適切な管理のもと）</li>
            </ul>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-gold">6. Cookieの使用</h2>
            <p className="text-qs-text-secondary leading-relaxed mb-4">
              当社は、サービス向上のためにCookieを使用します。Cookieの使用目的は以下の通りです。
            </p>
            <ul className="list-disc list-inside space-y-2 text-qs-text-secondary">
              <li>ユーザーセッションの維持</li>
              <li>ユーザー設定の保存</li>
              <li>アクセス解析</li>
            </ul>
            <p className="text-qs-text-secondary leading-relaxed mt-4">
              ブラウザの設定により、Cookieを無効にすることができますが、
              一部の機能が利用できなくなる場合があります。
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-gold">7. ユーザーの権利</h2>
            <p className="text-qs-text-secondary leading-relaxed mb-4">
              ユーザーは、自己の個人情報について以下の権利を有します。
            </p>
            <ul className="list-disc list-inside space-y-2 text-qs-text-secondary">
              <li>保有する情報の開示請求</li>
              <li>情報の訂正または削除の請求</li>
              <li>情報の利用停止の請求</li>
            </ul>
            <p className="text-qs-text-secondary leading-relaxed mt-4">
              これらの請求については、下記のお問い合わせ先までご連絡ください。
            </p>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-gold">8. お問い合わせ</h2>
            <div className="qs-card p-6">
              <p className="text-qs-text-secondary leading-relaxed mb-4">
                プライバシーに関するお問い合わせは、以下までご連絡ください。
              </p>
              <div className="space-y-2">
                <p className="text-sm">
                  <span className="text-qs-text-tertiary">会社名：</span>
                  <span className="text-qs-text-primary ml-2">Quantum Shield Inc.</span>
                </p>
                <p className="text-sm">
                  <span className="text-qs-text-tertiary">メール：</span>
                  <a href="mailto:privacy@quantumshield.io" className="text-gold hover:underline ml-2">
                    privacy@quantumshield.io
                  </a>
                </p>
                <p className="text-sm">
                  <span className="text-qs-text-tertiary">所在地：</span>
                  <span className="text-qs-text-primary ml-2">東京都渋谷区</span>
                </p>
              </div>
            </div>
          </section>

          <section className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-gold">9. ポリシーの変更</h2>
            <p className="text-qs-text-secondary leading-relaxed">
              当社は、必要に応じて本ポリシーを変更することがあります。
              重要な変更がある場合は、サービス上での通知またはメールでお知らせします。
              本ポリシーの最終更新日は、ページ上部に記載しています。
            </p>
          </section>
        </article>

        {/* Footer */}
        <div className="border-t border-qs-border-subtle mt-12 pt-8">
          <div className="flex flex-wrap gap-6">
            <Link href="/terms" className="text-sm text-qs-text-secondary hover:text-gold transition-colors">
              利用規約
            </Link>
            <Link href="/faq" className="text-sm text-qs-text-secondary hover:text-gold transition-colors">
              FAQ
            </Link>
            <a
              href="mailto:privacy@quantumshield.io"
              className="text-sm text-qs-text-secondary hover:text-gold transition-colors"
            >
              プライバシーに関するお問い合わせ
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
