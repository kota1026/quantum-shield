import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminDashboard } from '@/components/admin/AdminDashboard';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.dashboard.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function AdminDashboardPage() {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <AdminDashboard />
    </div>
  );
}
