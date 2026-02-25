import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TokenHubDelegateList } from '@/components/token-hub/DelegateList';

interface DelegateListPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: DelegateListPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'token-hub.delegateList.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function TokenHubDelegateListPage({ params }: DelegateListPageProps) {
  return <TokenHubDelegateList />;
}
