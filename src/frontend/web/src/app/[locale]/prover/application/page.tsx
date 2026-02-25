import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ProverApplication } from '@/components/prover/ProverApplication';

interface ProverApplicationPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProverApplicationPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'prover.application.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function ProverApplicationPage({
  params,
}: ProverApplicationPageProps) {
  return <ProverApplication />;
}
