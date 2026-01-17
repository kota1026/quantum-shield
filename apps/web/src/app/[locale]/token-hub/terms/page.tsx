import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TokenHubTerms } from '@/components/token-hub/Terms';

interface TermsPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: TermsPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'token-hub.terms.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function TermsPage() {
  return <TokenHubTerms />;
}
