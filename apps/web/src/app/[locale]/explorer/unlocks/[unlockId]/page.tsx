import { UnlockDetail } from '@/components/explorer/UnlockDetail';

interface UnlockDetailPageProps {
  params: Promise<{
    locale: string;
    unlockId: string;
  }>;
}

export default async function UnlockDetailPage({ params }: UnlockDetailPageProps) {
  const { locale, unlockId } = await params;

  return <UnlockDetail locale={locale} unlockId={unlockId} />;
}
