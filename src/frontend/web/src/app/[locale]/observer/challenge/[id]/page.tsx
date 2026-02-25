import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ChallengeProgress } from '@/components/observer/ChallengeProgress';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale, id } = await params;
  const t = await getTranslations({ locale, namespace: 'observer.dashboard.challengeProgress.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function ChallengeProgressPage() {
  return <ChallengeProgress />;
}
