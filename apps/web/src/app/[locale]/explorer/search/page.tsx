import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ExplorerSearch } from '@/components/explorer/Search';

interface SearchPageProps {
  params: Promise<{
    locale: string;
  }>;
  searchParams: Promise<{
    q?: string;
  }>;
}

export async function generateMetadata({
  params,
}: SearchPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'explorer.search.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function ExplorerSearchPage({ params, searchParams }: SearchPageProps) {
  const { locale } = await params;
  const { q } = await searchParams;
  return <ExplorerSearch locale={locale} initialQuery={q || ''} />;
}
