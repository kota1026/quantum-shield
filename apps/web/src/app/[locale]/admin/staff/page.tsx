import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminStaff } from '@/components/admin/AdminStaff';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'admin.staff.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function StaffPage() {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <AdminStaff />
    </div>
  );
}
