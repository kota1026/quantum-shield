import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { SaasSupport } from '@/components/admin/saas/SaasSupport';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.saasSupport.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function SaasSupportPage() {
  return <SaasSupport />;
}
