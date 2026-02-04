'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { EnterpriseSidebar } from '../Dashboard/EnterpriseSidebar';
import { Button } from '@/components/ui/button';

export function Billing() {
  const t = useTranslations('enterprise.billing');

  const recentCharges = [
    {
      date: '2025-12-01',
      description: 'Enterprise Plan - December 2025',
      amount: '$2,500.00',
      status: 'paid',
    },
    {
      date: '2025-11-01',
      description: 'Enterprise Plan - November 2025',
      amount: '$2,500.00',
      status: 'paid',
    },
    {
      date: '2025-10-01',
      description: 'Enterprise Plan - October 2025',
      amount: '$2,500.00',
      status: 'paid',
    },
  ];

  const usageItems = [
    { key: 'apiCalls', used: 847500, limit: 1000000, percent: 85 },
    { key: 'transactions', used: 1234, limit: 5000, percent: 25 },
    { key: 'storage', used: 45, limit: 100, percent: 45 },
  ];

  return (
    <div className="flex min-h-screen bg-background-primary">
      <EnterpriseSidebar />

      <main
        className="flex-1 ml-[260px]"
        role="main"
        aria-label={t('ariaLabel')}
      >
        {/* Top Bar */}
        <header className="flex items-center justify-between px-8 py-4 bg-background-secondary border-b border-white/5">
          <h1 className="text-xl font-semibold">{t('pageTitle')}</h1>
          <Link href="/enterprise/invoices">
            <Button variant="outline">{t('viewInvoices')}</Button>
          </Link>
        </header>

        {/* Page Content */}
        <div className="p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Current Plan */}
            <div className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h2 className="text-base font-semibold">
                  {t('currentPlan.title')}
                </h2>
              </div>
              <div className="p-6">
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-12 h-12 bg-gold/10 rounded-xl flex items-center justify-center text-xl">
                    👑
                  </div>
                  <div>
                    <div className="text-lg font-semibold text-gold">
                      {t('currentPlan.enterprise')}
                    </div>
                    <div className="text-sm text-text-tertiary">
                      {t('currentPlan.monthlyFee')}: $2,500.00
                    </div>
                  </div>
                </div>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">
                      {t('currentPlan.nextBilling')}
                    </span>
                    <span>2026-01-01</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-text-tertiary">
                      {t('currentPlan.paymentMethod')}
                    </span>
                    <span>{t('currentPlan.cardEnding', { last4: '4242' })}</span>
                  </div>
                </div>
                <div className="mt-6">
                  <Button variant="outline" className="w-full">
                    {t('updatePayment')}
                  </Button>
                </div>
              </div>
            </div>

            {/* Usage */}
            <div className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
              <div className="px-6 py-4 border-b border-white/5">
                <h2 className="text-base font-semibold">{t('usage.title')}</h2>
              </div>
              <div className="p-6 space-y-6">
                {usageItems.map((item) => (
                  <div key={item.key}>
                    <div className="flex justify-between text-sm mb-2">
                      <span>{t(`usage.${item.key}.label`)}</span>
                      <span className="text-text-tertiary">
                        {item.key === 'storage'
                          ? `${item.used}GB / ${item.limit}GB`
                          : `${item.used.toLocaleString()} / ${item.limit.toLocaleString()}`}
                      </span>
                    </div>
                    <div className="h-2 bg-background-primary rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${
                          item.percent > 80
                            ? 'bg-warning'
                            : item.percent > 50
                              ? 'bg-gold'
                              : 'bg-success'
                        }`}
                        style={{ width: `${item.percent}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Charges */}
          <div className="mt-8 bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
            <div className="px-6 py-4 border-b border-white/5">
              <h2 className="text-base font-semibold">
                {t('recentCharges.title')}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary">
                      {t('recentCharges.columns.date')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary">
                      {t('recentCharges.columns.description')}
                    </th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-text-tertiary">
                      {t('recentCharges.columns.amount')}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-text-tertiary">
                      {t('recentCharges.columns.status')}
                    </th>
                    <th className="px-6 py-3"></th>
                  </tr>
                </thead>
                <tbody>
                  {recentCharges.map((charge, index) => (
                    <tr key={index} className="border-b border-white/5 last:border-b-0">
                      <td className="px-6 py-4 text-sm">{charge.date}</td>
                      <td className="px-6 py-4 text-sm">{charge.description}</td>
                      <td className="px-6 py-4 text-sm text-right font-mono">
                        {charge.amount}
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 text-xs rounded-full bg-success/10 text-success">
                          {t(`recentCharges.statuses.${charge.status}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          type="button"
                          className="text-xs text-gold hover:underline"
                        >
                          {t('downloadReceipt')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
