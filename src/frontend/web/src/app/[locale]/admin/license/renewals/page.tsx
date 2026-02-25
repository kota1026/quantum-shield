import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LicenseRenewals } from '@/components/admin/license/LicenseRenewals';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.licenseRenewals.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function LicenseRenewalsPage() {
  return <LicenseRenewals />;
}
