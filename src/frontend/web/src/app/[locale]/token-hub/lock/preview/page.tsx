import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { LockPreview } from '@/components/token-hub/Lock/LockPreview';

interface LockPreviewPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export async function generateMetadata({
  params,
}: LockPreviewPageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'token-hub.lockPreview.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function TokenHubLockPreviewPage({ params }: LockPreviewPageProps) {
  return <LockPreview />;
}
