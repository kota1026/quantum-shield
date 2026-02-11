import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Council } from '@/components/qs-hub/Council';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'qs-hub.council.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function QSHubCouncilPage() {
  return <Council />;
}
