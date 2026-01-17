import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminParameters } from '@/components/admin/AdminParameters';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'admin.parameters.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function ParametersPage() {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <AdminParameters />
    </div>
  );
}
