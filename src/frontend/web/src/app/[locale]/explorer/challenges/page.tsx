import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ExplorerChallenges } from '@/components/explorer/Challenges';

interface ChallengesPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: ChallengesPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'explorer.challenges.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function ChallengesPage({ params }: ChallengesPageProps) {
  const { locale } = await params;

  return <ExplorerChallenges locale={locale} />;
}
