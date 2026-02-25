import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TokenHubSettings } from '@/components/token-hub/Settings';

interface SettingsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: SettingsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'token-hub.settings.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function TokenHubSettingsPage({ params }: SettingsPageProps) {
  return <TokenHubSettings />;
}
