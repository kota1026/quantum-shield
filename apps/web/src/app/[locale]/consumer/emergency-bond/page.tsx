import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { EmergencyBond } from '@/components/consumer/EmergencyBond';

interface EmergencyBondPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: EmergencyBondPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'consumer.emergencyBond.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function EmergencyBondPage({ params }: EmergencyBondPageProps) {
  return <EmergencyBond />;
}
