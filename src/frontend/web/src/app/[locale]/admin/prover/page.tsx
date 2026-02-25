import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { AdminSidebar } from '@/components/admin/AdminSidebar';
import { AdminProver } from '@/components/admin/AdminProver';

interface PageProps {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'admin.prover.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function AdminProverPage() {
  return (
    <div className="min-h-screen bg-background">
      <AdminSidebar />
      <AdminProver />
    </div>
  );
}
