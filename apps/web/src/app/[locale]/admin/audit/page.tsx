import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminAudit } from '@/components/admin/AdminAudit';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.audit.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function AuditPage() {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <AdminAudit />
    </div>
  );
}
