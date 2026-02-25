'use client';

import { useParams } from 'next/navigation';
import {
  KeyboardShortcutsProvider,
  EnvironmentProvider,
  SavedSearchProvider,
} from '@/components/enterprise/shared';

interface EnterpriseLayoutProps {
  children: React.ReactNode;
}

export default function EnterpriseLayout({ children }: EnterpriseLayoutProps) {
  const params = useParams();
  const locale = (params.locale as string) || 'ja';

  return (
    <EnvironmentProvider defaultEnvironment="production">
      <KeyboardShortcutsProvider locale={locale}>
        <SavedSearchProvider scope="enterprise">
          {children}
        </SavedSearchProvider>
      </KeyboardShortcutsProvider>
    </EnvironmentProvider>
  );
}
