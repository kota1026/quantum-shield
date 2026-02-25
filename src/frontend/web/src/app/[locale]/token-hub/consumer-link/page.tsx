import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ConsumerLink } from '@/components/token-hub/ConsumerLink';

interface ConsumerLinkPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: ConsumerLinkPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'token-hub.consumerLink.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function ConsumerLinkPage({ params }: ConsumerLinkPageProps) {
  return <ConsumerLink />;
}
