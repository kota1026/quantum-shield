import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { EcosystemLandingNew } from '@/components/ecosystem/EcosystemLandingNew';

interface EcosystemPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: EcosystemPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ecosystemNew' });

  return {
    title: t('hero.title'),
    description: t('hero.subtitle'),
  };
}

export default function EcosystemPage() {
  return <EcosystemLandingNew />;
}
