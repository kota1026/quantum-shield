import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LicenseProjectDetail } from '@/components/admin/license/LicenseProjectDetail';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.licenseProjectDetail.meta' });

  return {
    title: t('title', { id }),
    description: t('description'),
  };
}

export default async function LicenseProjectDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <LicenseProjectDetail projectId={id} />;
}
