'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { EnterpriseSidebar } from '../Dashboard/EnterpriseSidebar';
import { Button } from '@/components/ui/button';

interface ChecklistItem {
  key: string;
  status: 'pass' | 'warning';
}

export function ReportDetail() {
  const t = useTranslations('enterprise.reportDetail');

  const securityItems: ChecklistItem[] = [
    { key: 'twoFa', status: 'pass' },
    { key: 'ipAllowlist', status: 'pass' },
    { key: 'sessionManagement', status: 'pass' },
    { key: 'auditLogging', status: 'pass' },
  ];

  const operationalItems: ChecklistItem[] = [
    { key: 'transactionMonitoring', status: 'pass' },
    { key: 'dataEncryption', status: 'pass' },
    { key: 'backupVerification', status: 'warning' },
    { key: 'incidentResponse', status: 'pass' },
  ];

  const complianceScore = 90;
  const scoreStatus =
    complianceScore >= 90
      ? 'excellent'
      : complianceScore >= 70
        ? 'good'
        : 'needsAttention';

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
              href="/enterprise/reports"
              className="text-sm text-text-secondary hover:text-text-primary transition-colors"
            >
              ← {t('backToList')}
            </Link>
            <h1 className="text-xl font-semibold">{t('pageTitle')}</h1>
          </div>
          <Button variant="primary">📥 {t('downloadPdf')}</Button>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {/* Report Meta */}
          <div className="flex gap-8 p-4 bg-background-secondary rounded-xl mb-8">
            <div className="text-sm">
              <div className="text-text-tertiary">{t('reportMeta.period')}</div>
              <div className="font-medium">2025年12月</div>
            </div>
            <div className="text-sm">
              <div className="text-text-tertiary">
                {t('reportMeta.generated')}
              </div>
              <div className="font-medium">2026年1月11日</div>
            </div>
            <div className="text-sm">
              <div className="text-text-tertiary">
                {t('reportMeta.reportId')}
              </div>
              <div className="font-medium font-mono text-gold">CR-2026-001</div>
            </div>
          </div>

          {/* Compliance Score */}
          <div className="flex items-center gap-6 mb-8">
            <div className="relative w-24 h-24">
              {/* Score Circle */}
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="none"
                  className="text-background-secondary"
                />
                <circle
                  cx="48"
                  cy="48"
                  r="40"
                  strokeWidth="8"
                  stroke="currentColor"
                  fill="none"
                  strokeDasharray={`${(complianceScore / 100) * 251.2} 251.2`}
                  className="text-success"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-2xl font-bold text-success">
                  {complianceScore}%
                </span>
              </div>
            </div>
            <div>
              <div className="text-sm text-text-tertiary">
                {t('score.label')}
              </div>
              <div className="text-lg font-semibold text-success">
                {t(`score.${scoreStatus}`)}
              </div>
            </div>
          </div>

          {/* Security Controls */}
          <div className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden mb-6">
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
              <h2 className="text-base font-semibold">
                {t('securityControls.title')}
              </h2>
              <span className="text-sm text-success">
                {t('securityControls.passed', { passed: 4, total: 4 })}
              </span>
            </div>
            <div className="p-6">
              {securityItems.map((item) => (
                <div
                  key={item.key}
                  className="flex items-start gap-4 py-4 border-b border-white/5 last:border-b-0"
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      item.status === 'pass'
                        ? 'bg-success/10 text-success'
                        : 'bg-warning/10 text-warning'
                    }`}
                  >
                    {item.status === 'pass' ? '✓' : '!'}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {t(`securityControls.items.${item.key}.name`)}
                    </div>
                    <div className="text-xs text-text-tertiary">
                      {t(`securityControls.items.${item.key}.description`)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Compliance */}
          <div className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
            <div className="flex justify-between items-center px-6 py-4 border-b border-white/5">
              <h2 className="text-base font-semibold">
                {t('operationalCompliance.title')}
              </h2>
              <span className="text-sm text-warning">
                {t('operationalCompliance.passed', { passed: 3, total: 4 })}
              </span>
            </div>
            <div className="p-6">
              {operationalItems.map((item) => (
                <div
                  key={item.key}
                  className="flex items-start gap-4 py-4 border-b border-white/5 last:border-b-0"
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
                      item.status === 'pass'
                        ? 'bg-success/10 text-success'
                        : 'bg-warning/10 text-warning'
                    }`}
                  >
                    {item.status === 'pass' ? '✓' : '!'}
                  </div>
                  <div className="flex-1">
                    <div className="text-sm font-medium">
                      {t(`operationalCompliance.items.${item.key}.name`)}
                    </div>
                    <div className="text-xs text-text-tertiary">
                      {t(`operationalCompliance.items.${item.key}.description`)}
                    </div>
                  </div>
                  {item.status === 'warning' && (
                    <button
                      type="button"
                      className="text-xs text-gold hover:underline"
                    >
                      {t('scheduleNow')}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
