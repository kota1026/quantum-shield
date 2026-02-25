import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LicenseCompanyManagement } from '@/components/admin/license/LicenseCompanyManagement';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.license.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function LicenseCompaniesPage() {
  return <LicenseCompanyManagement />;
}
