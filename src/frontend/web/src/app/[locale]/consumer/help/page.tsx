import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Help } from '@/components/consumer/Help';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'consumer.help.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function HelpPage() {
  return <Help />;
}
