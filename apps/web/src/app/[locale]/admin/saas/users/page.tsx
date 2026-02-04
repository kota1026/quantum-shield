import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SaasUserManagement } from '@/components/admin/saas/SaasUserManagement';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.saasUsers.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function SaasUsersPage() {
  return <SaasUserManagement />;
}
