import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { UnlockProcessing } from '@/components/consumer/UnlockProcessing';

interface UnlockProcessingPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: UnlockProcessingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'consumer.unlockProcessing.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function UnlockProcessingPage({ params }: UnlockProcessingPageProps) {
  return <UnlockProcessing />;
}
