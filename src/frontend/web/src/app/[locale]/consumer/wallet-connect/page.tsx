import { Metadata } from 'next';
import { getTranslations } from 'next-intl/server';
import { WalletConnectPage } from '@/components/consumer/WalletConnect';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('consumer.walletConnect.meta');

  return {
    title: t('title'),
    description: t('description'),
  };
}

export default function WalletConnectRoute() {
  return <WalletConnectPage />;
}
