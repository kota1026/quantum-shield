import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { Contact } from '@/components/consumer/Contact';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('consumer.contact.meta');

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function ContactPage() {
  return <Contact />;
}
