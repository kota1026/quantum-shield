import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SettingsSystem } from '@/components/admin/settings/SettingsSystem';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.settingsSystem.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function SettingsSystemPage() {
  return <SettingsSystem />;
}
