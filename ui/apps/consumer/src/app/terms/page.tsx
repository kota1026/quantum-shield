'use client';

import Link from 'next/link';

/**
 * Terms of Service Page - Consumer App
 * Premium Japan Design System v1.0
 *
 * デザイン参考: 17_terms.html
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

export default function TermsPage() {
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
        <h1 className="text-4xl font-bold mb-4">利用規約</h1>
        <p className="text-sm text-qs-text-tertiary mb-12">最終更新日: 2026年1月1日</p>

        {/* Table of Contents */}
        <nav className="qs-card p-6 mb-12">
          <h2 className="text-lg font-semibold mb-4">目次</h2>
          <ul className="space-y-2">
            {[
              '第1条（定義）',
              '第2条（サービスの内容）',
              '第3条（利用登録）',
              '第4条（ユーザーの責任）',
              '第5条（禁止事項）',
              '第6条（免責事項）',
              '第7条（サービスの変更・中断）',
              '第8条（準拠法と管轄）',
            ].map((item, i) => (
              <li key={i}>
                <a href={`#section${i + 1}`} className="text-sm text-qs-text-secondary hover:text-gold transition-colors">
                  {item}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {/* Terms Content */}
        <article className="prose prose-invert max-w-none">
          <section id="section1" className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-gold">第1条（定義）</h2>
            <p className="text-qs-text-secondary leading-relaxed mb-4">
              本規約において使用する用語の定義は以下の通りとします。
            </p>
            <ul className="list-disc list-inside space-y-2 text-qs-text-secondary">
              <li>「本サービス」とは、Quantum Shieldが提供する量子耐性暗号ブリッジサービスを指します。</li>
              <li>「ユーザー」とは、本サービスを利用する全ての個人または法人を指します。</li>
              <li>「Lock」とは、ユーザーが本サービスを通じてデジタル資産を預け入れる行為を指します。</li>
              <li>「Unlock」とは、ユーザーが預け入れたデジタル資産を引き出す行為を指します。</li>
              <li>「Dilithium鍵」とは、NIST FIPS 204で標準化された量子耐性電子署名アルゴリズムに基づく暗号鍵を指します。</li>
            </ul>
          </section>

          <section id="section2" className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-gold">第2条（サービスの内容）</h2>
            <p className="text-qs-text-secondary leading-relaxed mb-4">
              本サービスは、以下の機能を提供します。
            </p>
            <ul className="list-disc list-inside space-y-2 text-qs-text-secondary">
              <li>Dilithium-III暗号を使用した量子耐性デジタル署名機能</li>
              <li>Time Lock機能（24時間の標準モード、7日間の緊急モード）</li>
              <li>ZK-STARK証明を使用したトランザクション検証</li>
              <li>Ethereum L1とL3 Aegis間のブリッジ機能</li>
            </ul>
          </section>

          <section id="section3" className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-gold">第3条（利用登録）</h2>
            <p className="text-qs-text-secondary leading-relaxed">
              ユーザーは、Ethereum互換ウォレットを接続し、Sign-In with Ethereum (SIWE)
              による認証を完了することで、本サービスを利用することができます。
              利用登録を行った時点で、ユーザーは本規約に同意したものとみなされます。
            </p>
          </section>

          <section id="section4" className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-gold">第4条（ユーザーの責任）</h2>
            <p className="text-qs-text-secondary leading-relaxed mb-4">
              ユーザーは以下の事項について責任を負います。
            </p>
            <ul className="list-disc list-inside space-y-2 text-qs-text-secondary">
              <li>ウォレットの秘密鍵およびDilithium秘密鍵の安全な管理</li>
              <li>バックアップフレーズの適切な保管</li>
              <li>本サービスを利用して行う全てのトランザクションの結果</li>
              <li>適用される法律および規制の遵守</li>
            </ul>
          </section>

          <section id="section5" className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-gold">第5条（禁止事項）</h2>
            <p className="text-qs-text-secondary leading-relaxed mb-4">
              ユーザーは、本サービスの利用にあたり、以下の行為を行ってはなりません。
            </p>
            <ul className="list-disc list-inside space-y-2 text-qs-text-secondary">
              <li>マネーロンダリング、テロ資金供与その他の違法行為</li>
              <li>本サービスのセキュリティを脅かす行為</li>
              <li>他のユーザーの利用を妨害する行為</li>
              <li>スマートコントラクトの脆弱性を悪用する行為</li>
              <li>虚偽の情報を提供する行為</li>
            </ul>
          </section>

          <section id="section6" className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-gold">第6条（免責事項）</h2>
            <div
              className="p-4 rounded-qs-lg mb-4"
              style={{
                background: 'var(--accent-hinomaru-dim)',
                border: '1px solid var(--accent-hinomaru)',
              }}
            >
              <p className="text-sm text-qs-text-secondary leading-relaxed">
                <strong className="text-hinomaru-light">重要：</strong>
                本サービスは、ブロックチェーン技術およびスマートコントラクトに基づいて提供されます。
                これらの技術に内在するリスクについて、当社は一切の責任を負いません。
              </p>
            </div>
            <p className="text-qs-text-secondary leading-relaxed">
              当社は、以下の事項について責任を負いません：
            </p>
            <ul className="list-disc list-inside space-y-2 text-qs-text-secondary mt-4">
              <li>ブロックチェーンネットワークの障害またはダウンタイム</li>
              <li>ユーザーの秘密鍵の紛失または漏洩による損失</li>
              <li>スマートコントラクトのバグまたは脆弱性による損失</li>
              <li>暗号資産の価格変動による損失</li>
              <li>第三者によるハッキングまたは攻撃による損失</li>
            </ul>
          </section>

          <section id="section7" className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-gold">第7条（サービスの変更・中断）</h2>
            <p className="text-qs-text-secondary leading-relaxed">
              当社は、事前の通知なく本サービスの内容を変更し、または本サービスの提供を中断もしくは終了することができます。
              ただし、可能な限り事前にユーザーへ通知するよう努めます。
            </p>
          </section>

          <section id="section8" className="mb-10">
            <h2 className="text-2xl font-semibold mb-4 text-gold">第8条（準拠法と管轄）</h2>
            <p className="text-qs-text-secondary leading-relaxed">
              本規約の解釈および適用は、日本国法に準拠するものとします。
              本サービスに関して紛争が生じた場合、東京地方裁判所を第一審の専属的合意管轄裁判所とします。
            </p>
          </section>
        </article>

        {/* Footer */}
        <div className="border-t border-qs-border-subtle mt-12 pt-8">
          <div className="flex flex-wrap gap-6">
            <Link href="/privacy" className="text-sm text-qs-text-secondary hover:text-gold transition-colors">
              プライバシーポリシー
            </Link>
            <Link href="/faq" className="text-sm text-qs-text-secondary hover:text-gold transition-colors">
              FAQ
            </Link>
            <a
              href="mailto:support@quantumshield.io"
              className="text-sm text-qs-text-secondary hover:text-gold transition-colors"
            >
              お問い合わせ
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
