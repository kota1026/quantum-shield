import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminLicenseeSupport } from '@/components/admin/licensees/AdminLicenseeSupport';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.licenseeSupport.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function LicenseeSupportPage({ params }: PageProps) {
  const { id } = await params;
  return <AdminLicenseeSupport licenseeId={id} />;
}
