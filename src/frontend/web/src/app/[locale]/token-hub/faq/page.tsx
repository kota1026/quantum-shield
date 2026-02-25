import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TokenHubFAQ } from '@/components/token-hub/FAQ';

interface FAQPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: FAQPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'token-hub.faq.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function FAQPage() {
  return <TokenHubFAQ />;
}
