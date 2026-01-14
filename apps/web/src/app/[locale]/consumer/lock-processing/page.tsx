import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LockProcessing } from '@/components/consumer/LockProcessing';

interface LockProcessingPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: LockProcessingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'consumer.lockProcessing.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function LockProcessingPage({ params }: LockProcessingPageProps) {
  return <LockProcessing />;
}
