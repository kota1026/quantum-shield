'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Building2,
  Palette,
  Bell,
  Server,
  Code,
  FileText
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { EnterpriseSidebar } from '../Dashboard/EnterpriseSidebar';
import { EnterpriseTopBar } from '../Dashboard/EnterpriseTopBar';
import { Button } from '@/components/ui/button';
import {
  OrganizationTab,
  BrandingTab,
  NotificationsTab,
  EnvironmentsTab,
  DeveloperTab,
  LicenseTab
} from './tabs';

type SettingsTab = 'organization' | 'branding' | 'notifications' | 'environments' | 'developer' | 'license';

interface TabConfig {
  key: SettingsTab;
  icon: typeof Building2;
  color: string;
}

const TABS: TabConfig[] = [
  { key: 'organization', icon: Building2, color: 'text-hinomaru' },
  { key: 'branding', icon: Palette, color: 'text-purple-400' },
  { key: 'notifications', icon: Bell, color: 'text-warning' },
  { key: 'environments', icon: Server, color: 'text-info' },
  { key: 'developer', icon: Code, color: 'text-green-400' },
  { key: 'license', icon: FileText, color: 'text-gold' },
];

interface SettingsProps {
  className?: string;
}

export function Settings({ className }: SettingsProps) {
  const t = useTranslations('enterprise.settings');
  const [activeTab, setActiveTab] = useState<SettingsTab>('organization');
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    // Simulate save
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSaving(false);
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'organization':
        return <OrganizationTab />;
      case 'branding':
        return <BrandingTab />;
      case 'notifications':
        return <NotificationsTab />;
      case 'environments':
        return <EnvironmentsTab />;
      case 'developer':
        return <DeveloperTab />;
      case 'license':
        return <LicenseTab />;
      default:
        return null;
    }
  };

  return (
    <div className={cn('flex min-h-screen bg-background', className)}>
      <EnterpriseSidebar />

      <main
        className="flex-1 ml-[260px] min-h-screen"
        role="main"
        aria-label={t('ariaLabel')}
      >
        <EnterpriseTopBar
          title={t('pageTitle')}
          actions={
            <Button
              variant="primary"
              size="sm"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? t('saving') : t('save')}
            </Button>
          }
        />

        <div className="p-8">
          <div className="grid grid-cols-[240px_1fr] gap-8">
            {/* Settings Nav */}
            <nav
              className="flex flex-col gap-1"
              aria-label={t('navigation.ariaLabel')}
            >
              {TABS.map(({ key, icon: Icon, color }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={cn(
                    'flex items-center gap-3 px-4 py-3 text-left rounded-xl text-sm transition-colors',
                    activeTab === key
                      ? 'bg-hinomaru/10 text-hinomaru'
                      : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                  )}
                  aria-current={activeTab === key ? 'page' : undefined}
                >
                  <Icon className={cn('w-5 h-5', activeTab === key ? 'text-hinomaru' : color)} />
                  <span className="font-medium">{t(`tabs.${key}`)}</span>
                </button>
              ))}
            </nav>

            {/* Settings Content */}
            <div className="min-w-0">
              {renderTabContent()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
