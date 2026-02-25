import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SaasBillingPayments } from '@/components/admin/saas/SaasBillingPayments';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.billingPayments.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function SaasBillingPaymentsPage() {
  return <SaasBillingPayments />;
}
