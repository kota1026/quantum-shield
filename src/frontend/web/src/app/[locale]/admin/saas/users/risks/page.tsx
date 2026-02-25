import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SaasUserRisks } from '@/components/admin/saas/SaasUserRisks';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.saasUserRisks.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function SaasUserRisksPage() {
  return <SaasUserRisks />;
}
