import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { StakeExtend } from '@/components/qs-hub/StakeExtend';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'qs-hub.stake.extend.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function QSHubStakeExtendPage() {
  return <StakeExtend />;
}
