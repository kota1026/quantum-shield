import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { UserDetail } from '@/components/enterprise/Users/UserDetail';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'enterprise.userDetail.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function EnterpriseUserDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <UserDetail userId={id} />;
}
