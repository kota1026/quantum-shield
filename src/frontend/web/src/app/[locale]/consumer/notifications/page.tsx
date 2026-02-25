import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Notifications } from '@/components/consumer/Notifications';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'consumer.notifications.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function NotificationsPage() {
  return <Notifications />;
}
