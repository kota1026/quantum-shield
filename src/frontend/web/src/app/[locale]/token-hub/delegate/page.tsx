import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TokenHubDelegate } from '@/components/token-hub/Delegate';

interface DelegatePageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: DelegatePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'token-hub.delegate.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function TokenHubDelegatePage({ params }: DelegatePageProps) {
  return <TokenHubDelegate />;
}
