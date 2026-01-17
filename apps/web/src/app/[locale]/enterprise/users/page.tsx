import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { UserList } from '@/components/enterprise/Users';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'enterprise.users.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function EnterpriseUsersPage() {
  return <UserList />;
}
