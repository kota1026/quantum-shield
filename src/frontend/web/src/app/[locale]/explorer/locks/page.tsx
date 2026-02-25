import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ExplorerLocks } from '@/components/explorer/Locks';

interface LocksPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: LocksPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'explorer.locks.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function ExplorerLocksPage({ params }: LocksPageProps) {
  const { locale } = await params;
  return <ExplorerLocks locale={locale} />;
}
