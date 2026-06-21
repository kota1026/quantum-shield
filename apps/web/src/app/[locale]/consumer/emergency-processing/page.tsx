import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { EmergencyProcessing } from '@/components/consumer/EmergencyProcessing';

interface EmergencyProcessingPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: EmergencyProcessingPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'consumer.emergencyProcessing.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function EmergencyProcessingPage({ params }: EmergencyProcessingPageProps) {
  return <EmergencyProcessing />;
}
