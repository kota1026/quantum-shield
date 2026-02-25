import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LicenseProjects } from '@/components/admin/license/LicenseProjects';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.licenseProjects.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function LicenseProjectsPage() {
  return <LicenseProjects />;
}
