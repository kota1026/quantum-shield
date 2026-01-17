'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { cn } from '@/lib/utils';
import { EnterpriseSidebar } from '../Dashboard/EnterpriseSidebar';
import { Button } from '@/components/ui/button';

type SettingsTab = 'organization' | 'security' | 'notifications' | 'limits';

interface SettingsProps {
  className?: string;
}

export function Settings({ className }: SettingsProps) {
  const t = useTranslations('enterprise.settings');
  const [activeTab, setActiveTab] = useState<SettingsTab>('organization');

  // Mock data
  const [orgName, setOrgName] = useState('Acme Corp');
  const [website, setWebsite] = useState('https://acme.co.jp');
  const [contactName, setContactName] = useState('経理部 山田');
  const [email, setEmail] = useState('billing@acme.co.jp');
  const [phone, setPhone] = useState('+81-3-1234-5678');

  const handleSave = () => {
    // Mock save
    alert('Settings saved!');
  };

  return (
    <div className={cn('flex min-h-screen bg-background', className)}>
      <EnterpriseSidebar />

      <main
        className="flex-1 ml-[260px] min-h-screen"
        role="main"
        aria-label={t('ariaLabel')}
      >
        {/* Top Bar */}
        <header
          className="flex items-center justify-between px-8 py-4 bg-background-secondary border-b border-white/5 sticky top-0 z-50"
          role="banner"
        >
          <h1 className="text-xl font-semibold text-text-primary">{t('pageTitle')}</h1>
          <Button variant="primary" size="sm" onClick={handleSave}>
            {t('save')}
          </Button>
        </header>

        {/* Page Content */}
        <div className="p-8">
          <div className="grid grid-cols-[200px_1fr] gap-8">
            {/* Settings Nav */}
            <nav className="flex flex-col gap-1" aria-label="Settings navigation">
              {(['organization', 'security', 'notifications', 'limits'] as SettingsTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  onClick={() => setActiveTab(tab)}
                  className={cn(
                    'px-4 py-2 text-left rounded-lg text-sm transition-colors',
                    activeTab === tab
                      ? 'bg-hinomaru/10 text-hinomaru'
                      : 'text-text-secondary hover:bg-white/5 hover:text-text-primary'
                  )}
                >
                  {t(`tabs.${tab}`)}
                </button>
              ))}
            </nav>

            {/* Settings Content */}
            <div className="space-y-6">
              {activeTab === 'organization' && (
                <>
                  {/* Organization Profile */}
                  <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/5">
                      <h2 className="text-base font-semibold text-text-primary">
                        {t('organization.title')}
                      </h2>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label htmlFor="orgName" className="block text-sm font-medium text-text-primary mb-2">
                          {t('organization.name.label')}
                        </label>
                        <input
                          type="text"
                          id="orgName"
                          value={orgName}
                          onChange={(e) => setOrgName(e.target.value)}
                          className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-lg text-text-primary text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="orgId" className="block text-sm font-medium text-text-primary mb-2">
                          {t('organization.orgId.label')}
                        </label>
                        <input
                          type="text"
                          id="orgId"
                          value="org_acme_12345"
                          disabled
                          className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-lg text-text-secondary text-sm opacity-60"
                        />
                        <p className="text-xs text-text-tertiary mt-1">{t('organization.orgId.hint')}</p>
                      </div>
                      <div>
                        <label htmlFor="website" className="block text-sm font-medium text-text-primary mb-2">
                          {t('organization.website.label')}
                        </label>
                        <input
                          type="url"
                          id="website"
                          value={website}
                          onChange={(e) => setWebsite(e.target.value)}
                          className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-lg text-text-primary text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-text-primary mb-2">
                          {t('organization.logo.label')}
                        </label>
                        <div className="flex items-center gap-6">
                          <div className="w-20 h-20 bg-background-primary border border-dashed border-white/20 rounded-xl flex items-center justify-center text-3xl">
                            AC
                          </div>
                          <div className="flex flex-col gap-2">
                            <Button variant="secondary" size="sm">
                              {t('organization.logo.upload')}
                            </Button>
                            <p className="text-xs text-text-tertiary">{t('organization.logo.hint')}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Billing Contact */}
                  <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/5">
                      <h2 className="text-base font-semibold text-text-primary">
                        {t('billing.title')}
                      </h2>
                    </div>
                    <div className="p-6 space-y-4">
                      <div>
                        <label htmlFor="contactName" className="block text-sm font-medium text-text-primary mb-2">
                          {t('billing.contactName.label')}
                        </label>
                        <input
                          type="text"
                          id="contactName"
                          value={contactName}
                          onChange={(e) => setContactName(e.target.value)}
                          className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-lg text-text-primary text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="billingEmail" className="block text-sm font-medium text-text-primary mb-2">
                          {t('billing.email.label')}
                        </label>
                        <input
                          type="email"
                          id="billingEmail"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-lg text-text-primary text-sm"
                        />
                      </div>
                      <div>
                        <label htmlFor="billingPhone" className="block text-sm font-medium text-text-primary mb-2">
                          {t('billing.phone.label')}
                        </label>
                        <input
                          type="tel"
                          id="billingPhone"
                          value={phone}
                          onChange={(e) => setPhone(e.target.value)}
                          className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-lg text-text-primary text-sm"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Contract Information */}
                  <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
                    <div className="p-6 border-b border-white/5">
                      <h2 className="text-base font-semibold text-text-primary">
                        {t('contract.title')}
                      </h2>
                    </div>
                    <div className="p-6">
                      <div className="grid grid-cols-2 gap-6">
                        <div>
                          <p className="text-xs text-text-tertiary mb-1">{t('contract.plan')}</p>
                          <p className="text-base font-semibold text-gold">Enterprise</p>
                        </div>
                        <div>
                          <p className="text-xs text-text-tertiary mb-1">{t('contract.contractStart')}</p>
                          <p className="text-base font-semibold text-text-primary">2025-01-01</p>
                        </div>
                        <div>
                          <p className="text-xs text-text-tertiary mb-1">{t('contract.contractEnd')}</p>
                          <p className="text-base font-semibold text-text-primary">2026-12-31</p>
                        </div>
                        <div>
                          <p className="text-xs text-text-tertiary mb-1">{t('contract.accountManager')}</p>
                          <p className="text-base font-semibold text-text-primary">山田 太郎</p>
                        </div>
                      </div>
                    </div>
                  </section>
                </>
              )}

              {activeTab !== 'organization' && (
                <section className="bg-background-secondary border border-white/5 rounded-2xl p-12 text-center">
                  <p className="text-text-tertiary">
                    {t(`tabs.${activeTab}`)} settings coming soon...
                  </p>
                </section>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
