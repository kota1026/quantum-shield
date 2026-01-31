import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { GovernanceOnboarding } from '@/components/governance/GovernanceOnboarding';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'governance.onboarding.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function GovernanceOnboardingPage() {
  return <GovernanceOnboarding />;
}
