import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SettingsAuditLog } from '@/components/admin/settings/SettingsAuditLog';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.settingsAuditLog.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function SettingsAuditLogPage() {
  return <SettingsAuditLog />;
}
