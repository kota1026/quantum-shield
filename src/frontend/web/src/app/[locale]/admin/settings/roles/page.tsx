import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SettingsRoles } from '@/components/admin/settings/SettingsRoles';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.settingsRoles.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function SettingsRolesPage() {
  return <SettingsRoles />;
}
