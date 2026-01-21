import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LicenseCompanyDetail } from '@/components/admin/license/LicenseCompanyDetail';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.licenseCompanyDetail.meta' });

  return {
    title: t('title', { id }),
    description: t('description'),
  };
}

export default async function LicenseCompanyDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <LicenseCompanyDetail companyId={id} />;
}
