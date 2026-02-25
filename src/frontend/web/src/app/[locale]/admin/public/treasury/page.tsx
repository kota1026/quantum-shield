import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PublicTreasuryManagement } from '@/components/admin/public/PublicTreasuryManagement';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.publicTreasury.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function PublicTreasuryPage() {
  return <PublicTreasuryManagement />;
}
