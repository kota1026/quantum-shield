import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { UnlockSuccess } from '@/components/consumer/UnlockSuccess';

interface UnlockSuccessPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: UnlockSuccessPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'consumer.unlockSuccess.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function UnlockSuccessPage({ params }: UnlockSuccessPageProps) {
  return <UnlockSuccess />;
}
