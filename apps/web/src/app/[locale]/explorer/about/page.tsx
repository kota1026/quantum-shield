import { ExplorerAbout } from '@/components/explorer/About';

interface AboutPageProps {
  params: Promise<{
    locale: string;
  }>;
}

export default async function AboutPage({ params }: AboutPageProps) {
  const { locale } = await params;

  return <ExplorerAbout locale={locale} />;
}
