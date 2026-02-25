import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { KeyManagement } from '@/components/consumer/KeyManagement';

interface KeyManagementPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: KeyManagementPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'consumer.keyManagement.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function KeyManagementPage({ params }: KeyManagementPageProps) {
  return <KeyManagement />;
}
