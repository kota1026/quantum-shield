import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { CookiePolicy } from '@/components/consumer/Cookie';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('consumer.cookie.meta');

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function CookiePolicyPage() {
  return <CookiePolicy />;
}
