import type { Metadata } from 'next';
import { NextIntlClientProvider } from 'next-intl';
import { getMessages, setRequestLocale } from 'next-intl/server';
import { notFound } from 'next/navigation';
import { routing } from '@/i18n/routing';
import '@/styles/globals.css';

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const isJapanese = locale === 'ja';

  return {
    title: isJapanese
      ? 'Quantum Shield - 量子耐性暗号で資産を守る'
      : 'Quantum Shield - Protect Your Assets with Quantum-Resistant Cryptography',
    description: isJapanese
      ? 'Dilithium-IIIとZK-STARKを組み合わせた世界初の量子耐性暗号ブリッジ'
      : "The world's first quantum-resistant cryptographic bridge",
    icons: {
      icon: '/favicon.ico',
    },
    openGraph: {
      title: 'Quantum Shield',
      description: isJapanese
        ? '量子耐性暗号で資産を守る'
        : 'Quantum-Resistant Asset Protection',
      type: 'website',
      locale: locale,
    },
  };
}

export default async function RootLayout({ children, params }: Props) {
  const { locale } = await params;

  // Ensure that the incoming `locale` is valid
  if (!routing.locales.includes(locale as 'ja' | 'en')) {
    notFound();
  }

  // Enable static rendering
  setRequestLocale(locale);

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
          href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased min-h-screen bg-background text-foreground">
        <NextIntlClientProvider messages={messages}>
          {children}
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
