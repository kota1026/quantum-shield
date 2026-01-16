import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { EmergencySuccess } from '@/components/consumer/EmergencySuccess';

interface EmergencySuccessPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: EmergencySuccessPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'consumer.emergencySuccess.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function EmergencySuccessPage({ params }: EmergencySuccessPageProps) {
  return <EmergencySuccess />;
}
