import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ExplorerProvers } from '@/components/explorer/Provers';

interface ProversPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: ProversPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'explorer.provers.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function ProversPage({ params }: ProversPageProps) {
  const { locale } = await params;

  return <ExplorerProvers locale={locale} />;
}
