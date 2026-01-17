import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminTxMonitor } from '@/components/admin/AdminTxMonitor';
import { AdminSidebar } from '@/components/admin/AdminSidebar';

export async function generateMetadata({
  params: { locale },
}: {
  params: { locale: string };
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'admin.txMonitor.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function TxMonitorPage() {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <AdminTxMonitor />
    </div>
  );
}
