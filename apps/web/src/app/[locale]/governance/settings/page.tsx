import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { GovernanceSettings } from '@/components/governance/GovernanceSettings';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'governance.settings.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function GovernanceSettingsPage() {
  return <GovernanceSettings />;
}
