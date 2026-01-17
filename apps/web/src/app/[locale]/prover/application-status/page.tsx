import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ProverApplicationStatus } from '@/components/prover/ProverApplicationStatus';

interface ProverApplicationStatusPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProverApplicationStatusPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'prover.status.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function ProverApplicationStatusPage({
  params,
}: ProverApplicationStatusPageProps) {
  return <ProverApplicationStatus />;
}
