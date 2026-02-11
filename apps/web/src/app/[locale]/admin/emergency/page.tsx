import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminEmergency } from '@/components/admin/AdminEmergency';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.emergency.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function AdminEmergencyPage() {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <AdminEmergency />
    </div>
  );
}
