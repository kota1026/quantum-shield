import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Unlock } from '@/components/consumer/Unlock';

interface UnlockPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: UnlockPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'consumer.unlock.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function UnlockPage({ params }: UnlockPageProps) {
  return <Unlock />;
}
