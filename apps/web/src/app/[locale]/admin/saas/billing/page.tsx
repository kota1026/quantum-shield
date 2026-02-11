import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SaasBillingManagement } from '@/components/admin/saas/SaasBillingManagement';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.saasBilling.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function SaasBillingPage() {
  return <SaasBillingManagement />;
}
