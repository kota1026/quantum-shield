import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { RewardsHistory } from '@/components/token-hub/Rewards/RewardsHistory';

interface RewardsHistoryPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: RewardsHistoryPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'token-hub.rewardsHistory.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function TokenHubRewardsHistoryPage({ params }: RewardsHistoryPageProps) {
  return <RewardsHistory />;
}
