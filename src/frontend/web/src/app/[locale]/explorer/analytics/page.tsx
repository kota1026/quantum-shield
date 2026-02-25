import { ExplorerAnalytics } from '@/components/explorer/Analytics';

interface AnalyticsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function AnalyticsPage({ params }: AnalyticsPageProps) {
  const { locale } = await params;

  return <ExplorerAnalytics locale={locale} />;
}
