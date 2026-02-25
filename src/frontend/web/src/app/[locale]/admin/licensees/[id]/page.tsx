import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminLicenseeDetail } from '@/components/admin/licensees/AdminLicenseeDetail';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.licenseeDetail.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function LicenseeDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <AdminLicenseeDetail licenseeId={id} />;
}
