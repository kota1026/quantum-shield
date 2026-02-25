import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LockDetail } from '@/components/explorer/LockDetail';

interface LockDetailPageProps {
  params: Promise<{
    locale: string;
    lockId: string;
  }>;
}

export async function generateMetadata({
  params,
}: LockDetailPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'explorer.lockDetail.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function ExplorerLockDetailPage({ params }: LockDetailPageProps) {
  const { locale, lockId } = await params;
  return <LockDetail locale={locale} lockId={decodeURIComponent(lockId)} />;
}
