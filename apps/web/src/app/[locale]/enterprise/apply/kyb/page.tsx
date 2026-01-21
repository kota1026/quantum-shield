import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { EnterpriseKYB } from '@/components/enterprise/EnterpriseKYB';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'enterprise.kyb.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function EnterpriseKYBPage() {
  return <EnterpriseKYB />;
}
