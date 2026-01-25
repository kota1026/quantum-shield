import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { EnterpriseProvers } from '@/components/enterprise/Provers';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'enterprise.provers.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function EnterpriseProversPage() {
  return <EnterpriseProvers />;
}
