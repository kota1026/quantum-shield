import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminNodes } from '@/components/admin/AdminNodes';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'admin.nodes.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function NodesPage() {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <AdminNodes />
    </div>
  );
}
