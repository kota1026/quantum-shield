import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { EnterpriseParameters } from '@/components/enterprise/Parameters';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'enterprise.parameters.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function ParametersPage() {
  return <EnterpriseParameters />;
}
