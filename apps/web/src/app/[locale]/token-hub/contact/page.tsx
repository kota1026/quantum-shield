import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TokenHubContact } from '@/components/token-hub/Contact';

interface ContactPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: ContactPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'token-hub.contact.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function ContactPage() {
  return <TokenHubContact />;
}
