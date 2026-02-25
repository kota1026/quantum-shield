import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ObserverSettings } from '@/components/observer/Settings';

interface SettingsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: SettingsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'observer.settings.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function ObserverSettingsPage() {
  return <ObserverSettings />;
}
