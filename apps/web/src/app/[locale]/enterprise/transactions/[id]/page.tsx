import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { TransactionDetail } from '@/components/enterprise/Transactions/TransactionDetail';

interface PageProps {
  params: Promise<{ locale: string; id: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: 'enterprise.transactionDetail.meta' });

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default async function EnterpriseTransactionDetailPage({ params }: PageProps) {
  const { id } = await params;
  return <TransactionDetail transactionId={id} />;
}
