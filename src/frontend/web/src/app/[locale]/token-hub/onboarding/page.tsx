import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TokenHubOnboarding } from '@/components/token-hub/Onboarding';

interface OnboardingPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: OnboardingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'token-hub.onboarding.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function OnboardingPage() {
  return <TokenHubOnboarding />;
}
