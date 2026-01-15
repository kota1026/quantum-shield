import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Landing } from '@/components/consumer/Landing';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'consumer.landing.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function LandingPage() {
  return <Landing />;
}
