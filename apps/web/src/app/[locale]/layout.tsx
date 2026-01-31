import type { Metadata, Viewport } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { locales, type Locale } from '@/i18n/config';
import { ClientWeb3Provider } from '@/components/providers';
import '@/styles/globals.css';

interface LocaleLayoutProps {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({
  params,
}: LocaleLayoutProps): Promise<Metadata> {
  const { locale } = await params;

  // Use static metadata for the root layout since it's shared across all pages
  // Individual pages can override this with their own metadata
  const isJapanese = locale === 'ja';
  const title = isJapanese
    ? 'Quantum Shield - 量子耐性暗号で資産を守る'
    : 'Quantum Shield - Protect Your Assets with Quantum-Resistant Cryptography';
  const description = isJapanese
    ? 'Dilithium-IIIとSPHINCS+を組み合わせた世界初の量子耐性暗号ブリッジ。将来の脅威から、今日の資産を守ります。'
    : "The world's first quantum-resistant cryptographic bridge combining Dilithium-III and SPHINCS+. Protect your assets today from tomorrow's threats.";

  return {
    title: {
      default: title,
      template: '%s | Quantum Shield',
    },
    description,
    keywords: [
      'quantum-resistant',
      'cryptography',
      'blockchain',
      'security',
      'Dilithium',
      'SPHINCS+',
      'SMT',
      'asset protection',
    ],
    authors: [{ name: 'Quantum Shield Team' }],
    creator: 'Quantum Shield',
    publisher: 'Quantum Shield',
    openGraph: {
      type: 'website',
      locale: locale === 'ja' ? 'ja_JP' : 'en_US',
      url: 'https://quantumshield.io',
      siteName: 'Quantum Shield',
      title,
      description,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
    robots: {
      index: true,
      follow: true,
    },
  };
}

export const viewport: Viewport = {
  themeColor: '#0A0A0C',
  width: 'device-width',
  initialScale: 1,
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: LocaleLayoutProps) {
  const { locale } = await params;

  // Validate locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }

  // Get messages for the locale
  const messages = await getMessages();

  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="anonymous"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700&family=Noto+Sans+JP:wght@300;400;500;700&family=DM+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-background font-sans antialiased">
        <NextIntlClientProvider messages={messages}>
          <ClientWeb3Provider>
            {children}
          </ClientWeb3Provider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
