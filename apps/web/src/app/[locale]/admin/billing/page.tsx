import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminBilling } from '@/components/admin/billing/AdminBilling';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.billing.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function BillingPage() {
  return <AdminBilling />;
}
