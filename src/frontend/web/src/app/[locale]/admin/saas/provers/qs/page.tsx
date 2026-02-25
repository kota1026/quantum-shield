import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SaasProverQs } from '@/components/admin/saas/SaasProverQs';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.saasProverQs.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function SaasProverQsPage() {
  return <SaasProverQs />;
}
