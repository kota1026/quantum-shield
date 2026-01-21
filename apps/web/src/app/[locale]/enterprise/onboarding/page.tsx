import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { EnterpriseOnboarding } from '@/components/enterprise/EnterpriseOnboarding';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'enterprise.onboarding.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function EnterpriseOnboardingPage() {
  return <EnterpriseOnboarding />;
}
