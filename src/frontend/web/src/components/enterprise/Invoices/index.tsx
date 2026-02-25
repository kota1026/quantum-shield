'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { EnterpriseSidebar } from '../Dashboard/EnterpriseSidebar';
import { Button } from '@/components/ui/button';

export function Invoices() {
  const t = useTranslations('enterprise.invoices');

  const invoices = [
    {
      id: 'INV-2025-012',
      period: '2025年12月',
      amount: '$2,500.00',
      status: 'paid',
    },
    {
      id: 'INV-2025-011',
      period: '2025年11月',
      amount: '$2,500.00',
      status: 'paid',
    },
    {
      id: 'INV-2025-010',
      period: '2025年10月',
      amount: '$2,500.00',
      status: 'paid',
    },
    {
      id: 'INV-2025-009',
      period: '2025年9月',
      amount: '$2,500.00',
      status: 'paid',
    },
    {
      id: 'INV-2025-008',
      period: '2025年8月',
      amount: '$2,500.00',
      status: 'paid',
    },
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
          <div className="flex items-center gap-4">
            <Link
              href="/enterprise/billing"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              ← {t('backToBilling')}
            </Link>
            <h1 className="text-xl font-semibold">{t('pageTitle')}</h1>
          </div>
          <Button variant="outline">📥 {t('downloadAll')}</Button>
        </header>

        {/* Page Content */}
        <div className="p-8">
          <div className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/5">
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-tertiary">
                      {t('table.columns.invoiceId')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-tertiary">
                      {t('table.columns.period')}
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-text-tertiary">
                      {t('table.columns.amount')}
                    </th>
                    <th className="px-6 py-4 text-left text-xs font-medium text-text-tertiary">
                      {t('table.columns.status')}
                    </th>
                    <th className="px-6 py-4 text-right text-xs font-medium text-text-tertiary">
                      {t('table.columns.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {invoices.map((invoice) => (
                    <tr
                      key={invoice.id}
                      className="border-b border-white/5 last:border-b-0"
                    >
                      <td className="px-6 py-4 text-sm font-mono text-gold">
                        {invoice.id}
                      </td>
                      <td className="px-6 py-4 text-sm">{invoice.period}</td>
                      <td className="px-6 py-4 text-sm text-right font-mono">
                        {invoice.amount}
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            invoice.status === 'paid'
                              ? 'bg-success/10 text-success'
                              : invoice.status === 'pending'
                                ? 'bg-warning/10 text-warning'
                                : 'bg-hinomaru/10 text-hinomaru'
                          }`}
                        >
                          {t(`table.statuses.${invoice.status}`)}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex gap-3 justify-end">
                          <button
                            type="button"
                            className="text-xs text-gold hover:underline"
                          >
                            {t('table.download')}
                          </button>
                          <button
                            type="button"
                            className="text-xs text-text-secondary hover:text-text-primary"
                          >
                            {t('table.view')}
                          </button>
                        </div>
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
