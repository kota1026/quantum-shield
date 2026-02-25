import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { QSHubSettings } from '@/components/qs-hub/Settings';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'qs-hub.settings.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function QSHubSettingsPage() {
  return <QSHubSettings />;
}
