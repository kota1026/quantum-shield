import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminCommunity } from '@/components/admin/AdminCommunity';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'admin.community.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function CommunityPage() {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <AdminCommunity />
    </div>
  );
}
