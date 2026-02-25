import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TokenHubUnlock } from '@/components/token-hub/Unlock';

interface UnlockPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: UnlockPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'token-hub.unlock.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function TokenHubUnlockPage({ params }: UnlockPageProps) {
  return <TokenHubUnlock />;
}
