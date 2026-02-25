import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LicenseDocuments } from '@/components/admin/license/LicenseDocuments';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.licenseDocuments.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function LicenseDocumentsPage() {
  return <LicenseDocuments />;
}
