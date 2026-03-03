'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Building2,
  ChevronRight,
  Globe,
  Calendar,
  DollarSign,
  FileText,
  Users,
  Phone,
  Mail,
  Clock,
  CheckCircle,
  AlertTriangle,
  Download,
  RefreshCw,
  Activity,
  BarChart3,
  Settings,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminSidebarV2 } from '../AdminSidebarV2';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  status?: 'success' | 'warning' | 'danger' | 'info';
}

function StatCard({ label, value, subValue, icon, status = 'info' }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          status === 'success' && 'bg-success/10 text-success',
          status === 'warning' && 'bg-warning/10 text-warning',
          status === 'danger' && 'bg-danger/10 text-danger',
          status === 'info' && 'bg-info/10 text-info'
        )}>
          {icon}
        </div>
        <div>
          <div className="text-xs text-foreground-tertiary">{label}</div>
          <div className="text-xl font-bold text-foreground">{value}</div>
          {subValue && <div className="text-xs text-foreground-secondary">{subValue}</div>}
        </div>
      </div>
    </Card>
  );
}

interface LicenseCompanyDetailProps {
  companyId: string;
}

export function LicenseCompanyDetail({ companyId }: LicenseCompanyDetailProps) {
  const t = useTranslations('admin.licenseCompanyDetail');
  const [activeTab, setActiveTab] = useState<'overview' | 'projects' | 'documents' | 'billing' | 'settings'>('overview');

  // Mock company data
  const company = {
    id: companyId,
    name: 'Asia Finance Holdings',
    country: 'Singapore',
    status: 'active',
    licenseType: 'Enterprise',
    contractValue: '$2,500,000',
    contractStart: '2025-04-01',
    contractEnd: '2028-03-31',
    renewalDate: '2028-03-31',
    contactName: 'Michael Tan',
    contactEmail: 'michael.tan@asiafinance.sg',
    contactPhone: '+65 6123 4567',
    projects: 3,
    activeUsers: 156,
    deployedNodes: 12,
    accountManager: '田中 健一',
  };

  const SAMPLE_PROJECTS = [
    {
      id: 'proj-001',
      name: 'Main Platform Integration',
      status: 'completed',
      startDate: '2025-04-01',
      endDate: '2025-09-30',
      progress: 100,
    },
    {
      id: 'proj-002',
      name: 'Mobile App Extension',
      status: 'active',
      startDate: '2025-10-01',
      endDate: '2026-03-31',
      progress: 65,
    },
    {
      id: 'proj-003',
      name: 'API Gateway Setup',
      status: 'planning',
      startDate: '2026-04-01',
      endDate: '2026-06-30',
      progress: 0,
    },
  ];

  const SAMPLE_DOCUMENTS = [
    { id: 'doc-001', name: 'License Agreement', type: 'contract', date: '2025-04-01' },
    { id: 'doc-002', name: 'Technical Specification', type: 'technical', date: '2025-04-15' },
    { id: 'doc-003', name: 'Deployment Guide', type: 'technical', date: '2025-05-01' },
    { id: 'doc-004', name: 'Training Materials', type: 'training', date: '2025-05-15' },
    { id: 'doc-005', name: 'Support SLA', type: 'contract', date: '2025-04-01' },
  ];

  const tabs = [
    { key: 'overview', label: t('tabs.overview'), icon: <Building2 className="h-4 w-4" /> },
    { key: 'projects', label: t('tabs.projects'), icon: <Activity className="h-4 w-4" /> },
    { key: 'documents', label: t('tabs.documents'), icon: <FileText className="h-4 w-4" /> },
    { key: 'billing', label: t('tabs.billing'), icon: <DollarSign className="h-4 w-4" /> },
    { key: 'settings', label: t('tabs.settings'), icon: <Settings className="h-4 w-4" /> },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">{t('status.active')}</Badge>;
      case 'renewal_pending':
        return <Badge variant="warning">{t('status.renewalPending')}</Badge>;
      case 'terminated':
        return <Badge variant="danger">{t('status.terminated')}</Badge>;
      default:
        return null;
    }
  };

  const getProjectStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">{t('projectStatus.completed')}</Badge>;
      case 'active':
        return <Badge variant="gold">{t('projectStatus.active')}</Badge>;
      case 'planning':
        return <Badge variant="default">{t('projectStatus.planning')}</Badge>;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebarV2 />

      <main className="pl-[280px]" role="main" aria-label={t('ariaLabel')}>
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <nav className="flex items-center gap-2 text-sm text-foreground-tertiary" aria-label="Breadcrumb">
              <Link href="/admin/dashboard" className="hover:text-foreground">
                Dashboard
              </Link>
              <ChevronRight className="h-4 w-4" />
              <Link href="/admin/license/companies" className="hover:text-foreground">
                {t('breadcrumb.companies')}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{company.name}</span>
            </nav>
            <div className="mt-4 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gold/10">
                  <Building2 className="h-8 w-8 text-gold" />
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-bold text-foreground">{company.name}</h1>
                    {getStatusBadge(company.status)}
                    <Badge variant="gold">{company.licenseType}</Badge>
                  </div>
                  <div className="mt-1 flex items-center gap-4 text-sm text-foreground-secondary">
                    <span className="flex items-center gap-1">
                      <Globe className="h-4 w-4" />
                      {company.country}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      {t('contractPeriod')}: {company.contractStart} ~ {company.contractEnd}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" leftIcon={<RefreshCw className="h-4 w-4" />}>
                  {t('actions.renewContract')}
                </Button>
                <Button variant="outline" leftIcon={<Settings className="h-4 w-4" />}>
                  {t('actions.manage')}
                </Button>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label={t('stats.contractValue')}
              value={company.contractValue}
              icon={<DollarSign className="h-5 w-5" />}
              status="success"
            />
            <StatCard
              label={t('stats.activeProjects')}
              value={String(company.projects)}
              icon={<Activity className="h-5 w-5" />}
              status="info"
            />
            <StatCard
              label={t('stats.activeUsers')}
              value={String(company.activeUsers)}
              icon={<Users className="h-5 w-5" />}
              status="info"
            />
            <StatCard
              label={t('stats.deployedNodes')}
              value={String(company.deployedNodes)}
              icon={<BarChart3 className="h-5 w-5" />}
              status="success"
            />
            <StatCard
              label={t('stats.daysToRenewal')}
              value="804"
              icon={<Clock className="h-5 w-5" />}
              status="info"
            />
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-1 rounded-lg border border-surface-tertiary bg-background-secondary p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
                  activeTab === tab.key
                    ? 'bg-gold text-background'
                    : 'text-foreground-secondary hover:text-foreground'
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Company Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('overview.companyInfo')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground-secondary">{t('overview.companyId')}</span>
                      <span className="font-mono text-sm">{company.id}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground-secondary">{t('overview.country')}</span>
                      <span className="text-sm">{company.country}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground-secondary">{t('overview.licenseType')}</span>
                      <Badge variant="gold">{company.licenseType}</Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground-secondary">{t('overview.contractValue')}</span>
                      <span className="font-medium">{company.contractValue}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground-secondary">{t('overview.renewalDate')}</span>
                      <span className="text-sm">{company.renewalDate}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-foreground-secondary">{t('overview.accountManager')}</span>
                      <span className="text-sm">{company.accountManager}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Contact Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('overview.contactInfo')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background-secondary">
                        <Users className="h-5 w-5 text-foreground-tertiary" />
                      </div>
                      <div>
                        <div className="text-sm font-medium">{company.contactName}</div>
                        <div className="text-xs text-foreground-secondary">{t('overview.primaryContact')}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background-secondary">
                        <Mail className="h-5 w-5 text-foreground-tertiary" />
                      </div>
                      <div>
                        <div className="text-sm">{company.contactEmail}</div>
                        <div className="text-xs text-foreground-secondary">{t('overview.email')}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-background-secondary">
                        <Phone className="h-5 w-5 text-foreground-tertiary" />
                      </div>
                      <div>
                        <div className="text-sm">{company.contactPhone}</div>
                        <div className="text-xs text-foreground-secondary">{t('overview.phone')}</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === 'projects' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('projects.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {SAMPLE_PROJECTS.map((project) => (
                    <div
                      key={project.id}
                      className="rounded-lg border border-surface-tertiary bg-background-secondary p-4"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className={cn(
                            'flex h-10 w-10 items-center justify-center rounded-lg',
                            project.status === 'completed' && 'bg-success/10',
                            project.status === 'active' && 'bg-gold/10',
                            project.status === 'planning' && 'bg-info/10'
                          )}>
                            <Activity className={cn(
                              'h-5 w-5',
                              project.status === 'completed' && 'text-success',
                              project.status === 'active' && 'text-gold',
                              project.status === 'planning' && 'text-info'
                            )} />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{project.name}</span>
                              {getProjectStatusBadge(project.status)}
                            </div>
                            <div className="mt-1 text-xs text-foreground-secondary">
                              {project.startDate} ~ {project.endDate}
                            </div>
                          </div>
                        </div>
                        <div className="w-32">
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="text-foreground-secondary">{t('projects.progress')}</span>
                            <span className="font-medium">{project.progress}%</span>
                          </div>
                          <div className="h-2 overflow-hidden rounded-full bg-background">
                            <div
                              className={cn(
                                'h-full rounded-full',
                                project.progress === 100 ? 'bg-success' : 'bg-gold'
                              )}
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'documents' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('documents.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {SAMPLE_DOCUMENTS.map((doc) => (
                    <div
                      key={doc.id}
                      className="flex items-center justify-between rounded-lg border border-surface-tertiary bg-background-secondary p-4"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                          <FileText className="h-5 w-5 text-gold" />
                        </div>
                        <div>
                          <div className="font-medium">{doc.name}</div>
                          <div className="text-xs text-foreground-secondary">
                            {t(`documents.types.${doc.type}`)} • {doc.date}
                          </div>
                        </div>
                      </div>
                      <Button variant="outline" size="sm" leftIcon={<Download className="h-4 w-4" />}>
                        {t('documents.download')}
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'billing' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('billing.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-surface-tertiary">
                  <div className="text-center text-foreground-tertiary">
                    <DollarSign className="mx-auto h-12 w-12" />
                    <p className="mt-2">{t('billing.placeholder')}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'settings' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('settings.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="rounded-lg border border-warning/50 bg-warning/5 p-4">
                    <h4 className="mb-2 font-medium text-warning">{t('settings.suspendLicense')}</h4>
                    <p className="mb-3 text-sm text-foreground-secondary">{t('settings.suspendLicenseDesc')}</p>
                    <Button variant="outline" size="sm">
                      {t('settings.suspend')}
                    </Button>
                  </div>
                  <div className="rounded-lg border border-danger/50 bg-danger/5 p-4">
                    <h4 className="mb-2 font-medium text-danger">{t('settings.terminateLicense')}</h4>
                    <p className="mb-3 text-sm text-foreground-secondary">{t('settings.terminateLicenseDesc')}</p>
                    <Button variant="danger" size="sm">
                      {t('settings.terminate')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
