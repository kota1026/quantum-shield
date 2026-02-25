import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PublicGovernanceManagement } from '@/components/admin/public/PublicGovernanceManagement';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.publicGovernance.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function PublicGovernancePage() {
  return <PublicGovernanceManagement />;
}
