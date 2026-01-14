import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LockSuccess } from '@/components/consumer/LockSuccess';

interface LockSuccessPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: LockSuccessPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'consumer.lockSuccess.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function LockSuccessPage({ params }: LockSuccessPageProps) {
  return <LockSuccess />;
}
