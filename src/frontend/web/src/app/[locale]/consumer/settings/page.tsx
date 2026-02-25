import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Settings } from '@/components/consumer/Settings';

interface SettingsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: SettingsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'consumer.settings.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  return <Settings />;
}
