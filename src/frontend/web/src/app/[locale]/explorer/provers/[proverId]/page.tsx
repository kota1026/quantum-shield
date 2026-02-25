import { ProverDetail } from '@/components/explorer/ProverDetail';
import { getTranslations } from 'next-intl/server';

interface PageProps {
  params: Promise<{
    locale: string;
    proverId: string;
  }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'explorer.proverDetail' });

  return {
    title: t('meta.title'),
    description: t('meta.description'),
  };
}

export default async function ProverDetailPage({ params }: PageProps) {
  const { locale, proverId } = await params;

  return <ProverDetail proverId={proverId} locale={locale} />;
}
