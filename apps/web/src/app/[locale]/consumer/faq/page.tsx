import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { FAQ } from '@/components/consumer/FAQ';

interface FAQPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: FAQPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'consumer.faq.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function FAQPage({ params }: FAQPageProps) {
  return <FAQ />;
}
