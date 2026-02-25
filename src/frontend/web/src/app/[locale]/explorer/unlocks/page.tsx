import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ExplorerUnlocks } from '@/components/explorer/Unlocks';

interface UnlocksPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: UnlocksPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'explorer.unlocks.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function ExplorerUnlocksPage({ params }: UnlocksPageProps) {
  const { locale } = await params;
  return <ExplorerUnlocks locale={locale} />;
}
