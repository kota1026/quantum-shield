import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { EcosystemLanding } from '@/components/ecosystem/EcosystemLanding';

interface EcosystemPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: EcosystemPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ecosystem.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function EcosystemPage() {
  return <EcosystemLanding />;
}
