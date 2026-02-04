'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Building2,
  Search,
  Filter,
  ChevronRight,
  CheckCircle,
  Clock,
  AlertTriangle,
  DollarSign,
  FileText,
  Users,
  Plus,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminSidebarV2 } from '../AdminSidebarV2';

// Stat card
interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  icon: React.ReactNode;
  status?: 'success' | 'warning' | 'danger' | 'info';
}

function StatCard({ label, value, subValue, icon, status = 'success' }: StatCardProps) {
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

// Mock data
const mockCompanies = [
  {
    id: 'lic-001',
    company: 'Mega Bank Japan',
    country: 'Japan',
    licenseType: 'enterprise',
    status: 'active',
    projects: 3,
    contractValue: '$2.5M',
    renewalDate: '2027-03-15',
    contactEmail: 'tech@megabank.jp',
  },
  {
    id: 'lic-002',
    company: 'Singapore DeFi Corp',
    country: 'Singapore',
    licenseType: 'enterprise',
    status: 'active',
    projects: 2,
    contractValue: '$1.8M',
    renewalDate: '2027-06-30',
    contactEmail: 'contact@sgdefi.io',
  },
  {
    id: 'lic-003',
    company: 'European Custody AG',
    country: 'Switzerland',
    licenseType: 'standard',
    status: 'negotiating',
    projects: 0,
    contractValue: '$800K',
    renewalDate: '-',
    contactEmail: 'bd@eucustody.ch',
  },
  {
    id: 'lic-004',
    company: 'Dubai Fintech LLC',
    country: 'UAE',
    licenseType: 'enterprise',
    status: 'active',
    projects: 1,
    contractValue: '$1.2M',
    renewalDate: '2026-12-01',
    contactEmail: 'info@dubaifintech.ae',
  },
  {
    id: 'lic-005',
    company: 'Korea Digital Bank',
    country: 'South Korea',
    licenseType: 'standard',
    status: 'renewal_pending',
    projects: 1,
    contractValue: '$600K',
    renewalDate: '2026-02-28',
    contactEmail: 'tech@kdbank.kr',
  },
];

const mockProjects = [
  {
    id: 'proj-001',
    name: 'Quantum Custody Integration',
    company: 'Mega Bank Japan',
    status: 'active',
    progress: 75,
    startDate: '2025-09-01',
    targetDate: '2026-03-31',
  },
  {
    id: 'proj-002',
    name: 'Private STARK Network',
    company: 'Singapore DeFi Corp',
    status: 'active',
    progress: 45,
    startDate: '2025-11-15',
    targetDate: '2026-06-30',
  },
  {
    id: 'proj-003',
    name: 'Enterprise Wallet System',
    company: 'Dubai Fintech LLC',
    status: 'planning',
    progress: 10,
    startDate: '2026-01-15',
    targetDate: '2026-09-30',
  },
];

export function LicenseCompanyManagement() {
  const t = useTranslations('admin.license');
  const [activeTab, setActiveTab] = useState<'companies' | 'projects' | 'renewals' | 'documents'>('companies');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { key: 'companies', label: t('tabs.companies'), count: mockCompanies.length },
    { key: 'projects', label: t('tabs.projects'), count: mockProjects.filter(p => p.status === 'active').length },
    { key: 'renewals', label: t('tabs.renewals'), count: mockCompanies.filter(c => c.status === 'renewal_pending').length },
    { key: 'documents', label: t('tabs.documents') },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">{t('status.active')}</Badge>;
      case 'negotiating':
        return <Badge variant="warning">{t('status.negotiating')}</Badge>;
      case 'renewal_pending':
        return <Badge variant="danger">{t('status.renewalPending')}</Badge>;
      case 'terminated':
        return <Badge variant="default">{t('status.terminated')}</Badge>;
      case 'planning':
        return <Badge variant="info">{t('projectStatus.planning')}</Badge>;
      default:
        return null;
    }
  };

  const getLicenseTypeBadge = (type: string) => {
    switch (type) {
      case 'enterprise':
        return <Badge variant="gold">{t('licenseType.enterprise')}</Badge>;
      case 'standard':
        return <Badge variant="default">{t('licenseType.standard')}</Badge>;
      default:
        return null;
    }
  };

  const filteredCompanies = mockCompanies.filter(
    (company) =>
      company.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      company.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background">
      <AdminSidebarV2 />

      <main className="pl-[280px]" role="main" aria-label={t('ariaLabel')}>
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-foreground-tertiary">
              <Link href="/admin/dashboard" className="hover:text-foreground">
                Dashboard
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{t('title')}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
                <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
              </div>
              <Button leftIcon={<Plus className="h-4 w-4" />}>
                {t('addCompany')}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label={t('stats.totalCompanies')}
              value="5"
              icon={<Building2 className="h-5 w-5" />}
              status="info"
            />
            <StatCard
              label={t('stats.activeContracts')}
              value="4"
              subValue="80%"
              icon={<CheckCircle className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.activeProjects')}
              value="7"
              icon={<FileText className="h-5 w-5" />}
              status="info"
            />
            <StatCard
              label={t('stats.renewalsPending')}
              value="1"
              icon={<AlertTriangle className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.totalRevenue')}
              value="$6.9M"
              subValue="累計"
              icon={<DollarSign className="h-5 w-5" />}
              status="success"
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
                {tab.label}
                {tab.count !== undefined && tab.count > 0 && (
                  <Badge size="sm" variant={activeTab === tab.key ? 'gold' : tab.key === 'renewals' ? 'warning' : 'default'}>
                    {tab.count}
                  </Badge>
                )}
              </button>
            ))}
          </div>

          {/* Companies Tab */}
          {activeTab === 'companies' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{t('companies.title')}</CardTitle>
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
                    <input
                      type="text"
                      placeholder={t('search.placeholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="rounded-lg border border-surface-tertiary bg-background-secondary py-2 pl-10 pr-4 text-sm focus:border-gold focus:outline-none"
                    />
                  </div>
                  <Button variant="outline" size="sm" leftIcon={<Filter className="h-4 w-4" />}>
                    {t('filter')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-surface-tertiary text-left text-xs text-foreground-tertiary">
                        <th className="pb-3 font-medium">{t('table.columns.company')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.country')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.licenseType')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.status')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.projects')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.contractValue')}</th>
                        <th className="pb-3 font-medium">{t('table.columns.renewalDate')}</th>
                        <th className="pb-3"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredCompanies.map((company) => (
                        <tr
                          key={company.id}
                          className="border-b border-surface-tertiary/50 hover:bg-background-secondary/50"
                        >
                          <td className="py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                                <Building2 className="h-5 w-5 text-gold" />
                              </div>
                              <div>
                                <div className="font-medium text-foreground">{company.company}</div>
                                <div className="text-xs text-foreground-tertiary">{company.contactEmail}</div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4">
                            <span className="text-foreground-secondary">{company.country}</span>
                          </td>
                          <td className="py-4">{getLicenseTypeBadge(company.licenseType)}</td>
                          <td className="py-4">{getStatusBadge(company.status)}</td>
                          <td className="py-4">
                            <span className="font-mono">{company.projects}</span>
                          </td>
                          <td className="py-4">
                            <span className="font-mono">{company.contractValue}</span>
                          </td>
                          <td className="py-4">
                            <span className={cn(
                              'text-sm',
                              company.status === 'renewal_pending' ? 'text-danger' : 'text-foreground-secondary'
                            )}>
                              {company.renewalDate}
                            </span>
                          </td>
                          <td className="py-4">
                            <Link
                              href={`/admin/license/companies/${company.id}`}
                              className="text-gold hover:underline"
                            >
                              {t('viewDetails')}
                            </Link>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Projects Tab */}
          {activeTab === 'projects' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('projects.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockProjects.map((project) => (
                    <div
                      key={project.id}
                      className="rounded-lg border border-surface-tertiary bg-background-secondary p-4"
                    >
                      <div className="flex items-start justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{project.name}</span>
                            {getStatusBadge(project.status)}
                          </div>
                          <div className="mt-1 text-sm text-foreground-tertiary">
                            {project.company}
                          </div>
                          <div className="mt-2 flex items-center gap-4 text-xs text-foreground-tertiary">
                            <span>{t('projects.startDate')}: {project.startDate}</span>
                            <span>{t('projects.targetDate')}: {project.targetDate}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl font-bold text-foreground">{project.progress}%</div>
                          <div className="text-xs text-foreground-tertiary">{t('projects.progress')}</div>
                        </div>
                      </div>
                      <div className="mt-3 h-2 overflow-hidden rounded-full bg-background-tertiary">
                        <div
                          className="h-full bg-gold"
                          style={{ width: `${project.progress}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Renewals Tab */}
          {activeTab === 'renewals' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('renewals.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {mockCompanies
                    .filter((c) => c.status === 'renewal_pending' || new Date(c.renewalDate) < new Date('2026-06-30'))
                    .map((company) => (
                      <div
                        key={company.id}
                        className={cn(
                          'flex items-center justify-between rounded-lg border p-4',
                          company.status === 'renewal_pending'
                            ? 'border-danger/50 bg-danger/5'
                            : 'border-surface-tertiary bg-background-secondary'
                        )}
                      >
                        <div className="flex items-center gap-4">
                          <div className={cn(
                            'flex h-12 w-12 items-center justify-center rounded-xl',
                            company.status === 'renewal_pending' ? 'bg-danger/10' : 'bg-warning/10'
                          )}>
                            {company.status === 'renewal_pending' ? (
                              <AlertTriangle className="h-6 w-6 text-danger" />
                            ) : (
                              <Clock className="h-6 w-6 text-warning" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium text-foreground">{company.company}</div>
                            <div className="mt-1 text-sm text-foreground-tertiary">
                              {t('renewals.renewalDate')}: {company.renewalDate}
                            </div>
                            <div className="mt-1 text-sm text-foreground-secondary">
                              {t('renewals.contractValue')}: {company.contractValue}
                            </div>
                          </div>
                        </div>
                        <Button size="sm">
                          {t('renewals.contactButton')}
                        </Button>
                      </div>
                    ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Documents Tab */}
          {activeTab === 'documents' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('documents.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex h-64 items-center justify-center rounded-lg border border-dashed border-surface-tertiary">
                  <div className="text-center text-foreground-tertiary">
                    <FileText className="mx-auto h-12 w-12" />
                    <p className="mt-2">{t('documents.placeholder')}</p>
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
