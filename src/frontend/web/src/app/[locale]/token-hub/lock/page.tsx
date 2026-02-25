import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TokenHubLock } from '@/components/token-hub/Lock';

interface LockPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: LockPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'token-hub.lock.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function TokenHubLockPage({ params }: LockPageProps) {
  return <TokenHubLock />;
}
