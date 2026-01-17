import { redirect } from 'next/navigation';

interface ExplorerPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function ExplorerPage({ params }: ExplorerPageProps) {
  const { locale } = await params;
  redirect(`/${locale}/explorer/overview`);
}
