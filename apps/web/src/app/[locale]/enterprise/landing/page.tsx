import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { EnterpriseDashboard } from '@/components/enterprise/Dashboard';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'enterprise.dashboard.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function EnterpriseLandingPage() {
  return <EnterpriseDashboard />;
}
