'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Upload, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function OrganizationTab() {
  const t = useTranslations('enterprise.settings.organization');

  const [orgName, setOrgName] = useState('Acme Corp');
  const [website, setWebsite] = useState('https://acme.co.jp');
  const [industry, setIndustry] = useState('technology');
  const [employeeCount, setEmployeeCount] = useState('101-500');
  const [address, setAddress] = useState('東京都渋谷区道玄坂1-2-3');

  return (
    <div className="space-y-6">
      {/* Organization Profile */}
      <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <Building2 className="w-5 h-5 text-hinomaru" />
            {t('profile.title')}
          </h2>
          <p className="text-sm text-text-tertiary mt-1">{t('profile.description')}</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="orgName" className="block text-sm font-medium text-text-primary mb-2">
                {t('name.label')} <span className="text-hinomaru">*</span>
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
                {t('orgId.label')}
              </label>
              <input
                type="text"
                id="orgId"
                value="org_acme_12345"
                disabled
                className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-lg text-text-secondary text-sm opacity-60 font-mono"
              />
              <p className="text-xs text-text-tertiary mt-1">{t('orgId.hint')}</p>
            </div>
          </div>

          <div>
            <label htmlFor="website" className="block text-sm font-medium text-text-primary mb-2">
              {t('website.label')}
            </label>
            <input
              type="url"
              id="website"
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://"
              className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-lg text-text-primary text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="industry" className="block text-sm font-medium text-text-primary mb-2">
                {t('industry.label')}
              </label>
              <select
                id="industry"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
                className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-lg text-text-primary text-sm"
              >
                <option value="technology">{t('industry.options.technology')}</option>
                <option value="finance">{t('industry.options.finance')}</option>
                <option value="healthcare">{t('industry.options.healthcare')}</option>
                <option value="retail">{t('industry.options.retail')}</option>
                <option value="manufacturing">{t('industry.options.manufacturing')}</option>
                <option value="other">{t('industry.options.other')}</option>
              </select>
            </div>
            <div>
              <label htmlFor="employeeCount" className="block text-sm font-medium text-text-primary mb-2">
                {t('employeeCount.label')}
              </label>
              <select
                id="employeeCount"
                value={employeeCount}
                onChange={(e) => setEmployeeCount(e.target.value)}
                className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-lg text-text-primary text-sm"
              >
                <option value="1-10">1-10</option>
                <option value="11-50">11-50</option>
                <option value="51-100">51-100</option>
                <option value="101-500">101-500</option>
                <option value="501-1000">501-1000</option>
                <option value="1000+">1000+</option>
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="address" className="block text-sm font-medium text-text-primary mb-2">
              {t('address.label')}
            </label>
            <textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-lg text-text-primary text-sm resize-none"
            />
          </div>
        </div>
      </section>

      {/* Billing Contact */}
      <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-base font-semibold text-text-primary">{t('billing.title')}</h2>
          <p className="text-sm text-text-tertiary mt-1">{t('billing.description')}</p>
        </div>
        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="contactName" className="block text-sm font-medium text-text-primary mb-2">
                {t('billing.contactName.label')}
              </label>
              <input
                type="text"
                id="contactName"
                defaultValue="経理部 山田"
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
                defaultValue="billing@acme.co.jp"
                className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-lg text-text-primary text-sm"
              />
            </div>
          </div>
          <div>
            <label htmlFor="billingPhone" className="block text-sm font-medium text-text-primary mb-2">
              {t('billing.phone.label')}
            </label>
            <input
              type="tel"
              id="billingPhone"
              defaultValue="+81-3-1234-5678"
              className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-lg text-text-primary text-sm"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
