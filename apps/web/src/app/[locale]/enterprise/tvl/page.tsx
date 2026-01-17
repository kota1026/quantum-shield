import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TVLDashboard } from '@/components/enterprise/TVL';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'enterprise.tvl.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function EnterpriseTVLPage() {
  return <TVLDashboard />;
}
