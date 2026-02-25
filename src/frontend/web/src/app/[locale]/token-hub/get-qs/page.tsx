import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TokenHubGetQS } from '@/components/token-hub/GetQS';

interface GetQSPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({ params }: GetQSPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'token-hub.getQS.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function GetQSPage() {
  return <TokenHubGetQS />;
}
