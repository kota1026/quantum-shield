import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { QSHubHelp } from '@/components/qs-hub/Help';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'qs-hub.help.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function QSHubHelpPage() {
  return <QSHubHelp />;
}
