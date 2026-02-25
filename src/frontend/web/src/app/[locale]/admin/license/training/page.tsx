import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LicenseTraining } from '@/components/admin/license/LicenseTraining';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.licenseTraining.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function LicenseTrainingPage() {
  return <LicenseTraining />;
}
