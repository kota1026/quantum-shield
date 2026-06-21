import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Privacy } from '@/components/consumer/Privacy';

interface PrivacyPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: PrivacyPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'consumer.privacy.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function PrivacyPage({ params }: PrivacyPageProps) {
  return <Privacy />;
}
