import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TechnicalDetails } from '@/components/ecosystem/TechnicalDetails';

interface TechnicalPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: TechnicalPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'ecosystemTechnical.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function TechnicalPage() {
  return <TechnicalDetails />;
}
