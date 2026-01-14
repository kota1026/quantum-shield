import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { UnlockSign } from '@/components/consumer/UnlockSign';

interface UnlockSignPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: UnlockSignPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'consumer.unlockSign.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function UnlockSignPage({ params }: UnlockSignPageProps) {
  return <UnlockSign />;
}
