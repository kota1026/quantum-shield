import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Earnings } from '@/components/observer/Earnings';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'observer.dashboard.earnings.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function EarningsPage() {
  return <Earnings />;
}
