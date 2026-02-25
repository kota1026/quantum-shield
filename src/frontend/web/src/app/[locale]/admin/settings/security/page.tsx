import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminSecuritySettings } from '@/components/admin/settings/AdminSecuritySettings';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.securitySettings.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function AdminSecuritySettingsPage() {
  return <AdminSecuritySettings />;
}
