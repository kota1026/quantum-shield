import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { PublicVotingPower } from '@/components/admin/public/PublicVotingPower';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.publicVotingPower.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function PublicVotingPowerPage() {
  return <PublicVotingPower />;
}
