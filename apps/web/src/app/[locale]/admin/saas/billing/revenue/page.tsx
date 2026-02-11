import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SaasBillingRevenue } from '@/components/admin/saas/SaasBillingRevenue';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.billingRevenue.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function SaasBillingRevenuePage() {
  return <SaasBillingRevenue />;
}
