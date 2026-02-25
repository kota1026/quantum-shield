import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { GovernanceFAQ } from '@/components/governance/GovernanceFAQ';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'governance.faq.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function GovernanceFAQPage() {
  return <GovernanceFAQ />;
}
