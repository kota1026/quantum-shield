import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminEnterprise } from '@/components/admin/AdminEnterprise';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.enterprise.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function EnterprisePage() {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <AdminEnterprise />
    </div>
  );
}
