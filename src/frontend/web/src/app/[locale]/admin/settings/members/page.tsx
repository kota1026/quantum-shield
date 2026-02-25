import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SettingsMembers } from '@/components/admin/settings/SettingsMembers';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.settingsMembers.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function SettingsMembersPage() {
  return <SettingsMembers />;
}
