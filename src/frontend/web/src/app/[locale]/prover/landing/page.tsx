import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ProverLanding } from '@/components/prover/ProverLanding';

interface ProverLandingPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProverLandingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'prover.landing.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function ProverLandingPage({
  params,
}: ProverLandingPageProps) {
  return <ProverLanding />;
}
