'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  FileText,
  Download,
  Upload,
  Calendar,
  Shield,
  AlertTriangle,
  CheckCircle,
  Clock,
  ExternalLink
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useLicenseReports } from '@/hooks/enterprise';

interface AuditReport {
  id: string;
  name: string;
  period: string;
  status: 'submitted' | 'pending' | 'overdue';
  submittedAt: string | null;
  dueDate: string;
}


export function LicenseTab() {
  const t = useTranslations('enterprise.settings.license');

  // Use API hook with fallback
  const { data: reportsData } = useLicenseReports();
  const auditReports: AuditReport[] = reportsData?.reports?.map(r => ({
    id: r.id,
    name: r.name,
    period: r.period,
    status: r.status as 'submitted' | 'pending' | 'overdue',
    submittedAt: r.submitted_at,
    dueDate: r.due_date,
  })) ?? [];

  const getStatusIcon = (status: AuditReport['status']) => {
    switch (status) {
      case 'submitted':
        return <CheckCircle className="w-4 h-4 text-success" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-warning" />;
      case 'overdue':
        return <AlertTriangle className="w-4 h-4 text-red-400" />;
    }
  };

  const getStatusColor = (status: AuditReport['status']) => {
    switch (status) {
      case 'submitted':
        return 'bg-success/20 text-success';
      case 'pending':
        return 'bg-warning/20 text-warning';
      case 'overdue':
        return 'bg-red-500/20 text-red-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* License Overview */}
      <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
            <FileText className="w-5 h-5 text-hinomaru" />
            {t('contract.title')}
          </h2>
          <p className="text-sm text-text-tertiary mt-1">{t('contract.description')}</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-3 gap-6 mb-6">
            <div className="p-4 bg-background-primary rounded-xl border border-white/5">
              <p className="text-xs text-text-tertiary mb-1">{t('contract.plan')}</p>
              <p className="text-xl font-bold text-gold">Enterprise</p>
              <p className="text-xs text-text-tertiary mt-1">{t('contract.annualLicense')}</p>
            </div>
            <div className="p-4 bg-background-primary rounded-xl border border-white/5">
              <p className="text-xs text-text-tertiary mb-1">{t('contract.startDate')}</p>
              <p className="text-xl font-bold text-text-primary">2025-01-01</p>
              <p className="text-xs text-text-tertiary mt-1">{t('contract.contractStart')}</p>
            </div>
            <div className="p-4 bg-background-primary rounded-xl border border-white/5">
              <p className="text-xs text-text-tertiary mb-1">{t('contract.endDate')}</p>
              <p className="text-xl font-bold text-text-primary">2026-12-31</p>
              <p className="text-xs text-success mt-1">{t('contract.daysRemaining', { days: 340 })}</p>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-gold/5 border border-gold/20 rounded-xl">
            <div className="flex items-center gap-3">
              <Shield className="w-6 h-6 text-gold" />
              <div>
                <p className="font-semibold text-text-primary">{t('contract.accountManager')}</p>
                <p className="text-sm text-text-tertiary">山田 太郎 (yamada@quantumshield.io)</p>
              </div>
            </div>
            <Button variant="secondary" size="sm">
              <ExternalLink className="w-4 h-4 mr-2" />
              {t('contract.contact')}
            </Button>
          </div>
        </div>
      </section>

      {/* License Features */}
      <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-base font-semibold text-text-primary">{t('features.title')}</h2>
          <p className="text-sm text-text-tertiary mt-1">{t('features.description')}</p>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 gap-4">
            {[
              { key: 'provers', value: '10', limit: '10' },
              { key: 'observers', value: '25', limit: '50' },
              { key: 'transactions', value: '1.2M', limit: '5M' },
              { key: 'storage', value: '45GB', limit: '100GB' },
              { key: 'apiCalls', value: '2.5M', limit: '10M' },
              { key: 'users', value: '15', limit: '50' },
            ].map(({ key, value, limit }) => (
              <div key={key} className="p-4 bg-background-primary rounded-xl border border-white/5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-text-tertiary">{t(`features.items.${key}`)}</p>
                  <p className="text-sm font-medium text-text-primary">
                    {value} / {limit}
                  </p>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-hinomaru rounded-full"
                    style={{ width: `${(parseFloat(value.replace('M', '').replace('GB', '')) / parseFloat(limit.replace('M', '').replace('GB', ''))) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Audit Reports */}
      <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-text-primary flex items-center gap-2">
              <Calendar className="w-5 h-5 text-info" />
              {t('audit.title')}
            </h2>
            <p className="text-sm text-text-tertiary mt-1">{t('audit.description')}</p>
          </div>
          <Button variant="primary" size="sm" className="min-h-[44px]">
            <Upload className="w-4 h-4 mr-2" />
            {t('audit.submit')}
          </Button>
        </div>
        <div className="divide-y divide-white/5">
          {auditReports.map((report) => (
            <div key={report.id} className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={cn('w-10 h-10 rounded-lg flex items-center justify-center',
                  report.status === 'submitted' ? 'bg-success/10' :
                  report.status === 'pending' ? 'bg-warning/10' : 'bg-red-500/10'
                )}>
                  {getStatusIcon(report.status)}
                </div>
                <div>
                  <p className="font-semibold text-text-primary">{report.name}</p>
                  <p className="text-sm text-text-tertiary">
                    {t('audit.period')}: {report.period} • {t('audit.dueDate')}: {report.dueDate}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={cn('px-2 py-1 rounded-full text-xs font-medium', getStatusColor(report.status))}>
                  {t(`audit.status.${report.status}`)}
                </span>
                {report.status === 'submitted' ? (
                  <Button variant="ghost" size="sm">
                    <Download className="w-4 h-4 mr-1" />
                    {t('audit.download')}
                  </Button>
                ) : (
                  <Button variant="primary" size="sm">
                    <Upload className="w-4 h-4 mr-1" />
                    {t('audit.upload')}
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Documents */}
      <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-white/5">
          <h2 className="text-base font-semibold text-text-primary">{t('documents.title')}</h2>
          <p className="text-sm text-text-tertiary mt-1">{t('documents.description')}</p>
        </div>
        <div className="divide-y divide-white/5">
          {[
            { key: 'licenseAgreement', date: '2025-01-01' },
            { key: 'slaDocument', date: '2025-01-01' },
            { key: 'dataProcessingAgreement', date: '2025-01-01' },
            { key: 'securityAddendum', date: '2025-06-15' },
          ].map(({ key, date }) => (
            <div key={key} className="p-4 flex items-center justify-between hover:bg-background-elevated transition-colors">
              <div className="flex items-center gap-3">
                <FileText className="w-5 h-5 text-text-tertiary" />
                <div>
                  <p className="font-medium text-text-primary">{t(`documents.items.${key}`)}</p>
                  <p className="text-xs text-text-tertiary">{t('documents.signed')}: {date}</p>
                </div>
              </div>
              <Button variant="ghost" size="sm">
                <Download className="w-4 h-4 mr-1" />
                {t('documents.download')}
              </Button>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
