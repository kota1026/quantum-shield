import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Security } from '@/components/consumer/Security';

interface SecurityPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: SecurityPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'consumer.security.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function SecurityPage({ params }: SecurityPageProps) {
  return <Security />;
}
