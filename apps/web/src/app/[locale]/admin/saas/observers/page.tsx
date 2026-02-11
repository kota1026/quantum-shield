import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SaasObservers } from '@/components/admin/saas/SaasObservers';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.saasObservers.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function SaasObserversPage() {
  return <SaasObservers />;
}
