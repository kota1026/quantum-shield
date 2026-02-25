import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ProverLogin } from '@/components/prover/ProverLogin';

interface LoginPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: LoginPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'prover.login.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function ProverLoginPage() {
  return <ProverLogin />;
}
