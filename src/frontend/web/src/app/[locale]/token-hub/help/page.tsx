import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TokenHubHelp } from '@/components/token-hub/Help';

interface HelpPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: HelpPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'token-hub.help.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function TokenHubHelpPage({ params }: HelpPageProps) {
  return <TokenHubHelp />;
}
