import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ExplorerOverview } from '@/components/explorer/Overview';

interface OverviewPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: OverviewPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'explorer.overview.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function ExplorerOverviewPage({ params }: OverviewPageProps) {
  const { locale } = await params;
  return <ExplorerOverview locale={locale} />;
}
