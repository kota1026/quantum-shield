import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { DelegateProfile } from '@/components/token-hub/Delegate/DelegateProfile';

interface DelegateProfilePageProps {
  params: Promise<{
    locale: string;
    id: string;
  }>;
}

export async function generateMetadata({
  params,
}: DelegateProfilePageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'token-hub.delegateProfile.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function TokenHubDelegateProfilePage({ params }: DelegateProfilePageProps) {
  const { id } = await params;
  return <DelegateProfile delegateId={id} />;
}
