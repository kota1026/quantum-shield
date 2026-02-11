import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { RewardsClaim } from '@/components/token-hub/Rewards/RewardsClaim';

interface RewardsClaimPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: RewardsClaimPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'token-hub.rewardsClaim.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function TokenHubRewardsClaimPage({ params }: RewardsClaimPageProps) {
  return <RewardsClaim />;
}
