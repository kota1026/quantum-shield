import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TokenHubRewards } from '@/components/token-hub/Rewards';

interface RewardsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: RewardsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'token-hub.rewards.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function TokenHubRewardsPage({ params }: RewardsPageProps) {
  return <TokenHubRewards />;
}
