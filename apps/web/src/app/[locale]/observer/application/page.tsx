import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { ObserverApplication } from '@/components/observer/Application';

interface ApplicationPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: ApplicationPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'observer.application.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function ObserverApplicationPage() {
  return <ObserverApplication />;
}
