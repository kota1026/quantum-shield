import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Lock } from '@/components/consumer/Lock';

interface LockPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: LockPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'consumer.lock.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function LockPage({ params }: LockPageProps) {
  return <Lock />;
}
