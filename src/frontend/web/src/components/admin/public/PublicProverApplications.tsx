'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Shield,
  Search,
  Filter,
  ChevronRight,
  CheckCircle,
  XCircle,
  Clock,
  FileText,
  User,
  Wallet,
  Activity,
  AlertTriangle,
  Eye,
  MessageSquare,
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

interface Application {
  id: string;
  operator: string;
  address: string;
  stake: string;
  appliedAt: string;
  status: 'pending' | 'reviewing' | 'approved' | 'rejected';
  region: string;
  nodeSpecs: string;
  experience: string;
}

export function PublicProverApplications() {
  const t = useTranslations('admin.proverApplications');
  const [activeTab, setActiveTab] = useState<'pending' | 'reviewing' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const SAMPLE_APPLICATIONS: Application[] = [
    {
      id: 'app-001',
      operator: 'Zeta Validators Inc.',
      address: '0x8c5d...3e2f',
      stake: '50,000 QS',
      appliedAt: '2026-01-17 14:32',
      status: 'pending',
      region: 'Asia Pacific (Tokyo)',
      nodeSpecs: '64 vCPU, 256GB RAM, 2TB NVMe',
      experience: '3年以上のProver運用経験',
    },
    {
      id: 'app-002',
      operator: 'Eta Security Ltd.',
      address: '0x2f7a...9d1c',
      stake: '60,000 QS',
      appliedAt: '2026-01-16 09:15',
      status: 'reviewing',
      region: 'Europe (Frankfurt)',
      nodeSpecs: '48 vCPU, 192GB RAM, 1TB NVMe',
      experience: '2年以上のProver運用経験',
    },
    {
      id: 'app-003',
      operator: 'Theta Network Corp.',
      address: '0x4e9b...8a3d',
      stake: '55,000 QS',
      appliedAt: '2026-01-15 18:42',
      status: 'pending',
      region: 'North America (Virginia)',
      nodeSpecs: '96 vCPU, 384GB RAM, 4TB NVMe',
      experience: '5年以上のノード運用経験',
    },
    {
      id: 'app-004',
      operator: 'Iota Labs LLC',
      address: '0x1a2b...7c8d',
      stake: '45,000 QS',
      appliedAt: '2026-01-14 11:20',
      status: 'approved',
      region: 'Asia Pacific (Singapore)',
      nodeSpecs: '32 vCPU, 128GB RAM, 1TB NVMe',
      experience: '1年以上のProver運用経験',
    },
    {
      id: 'app-005',
      operator: 'Kappa Systems',
      address: '0x9e8f...4d5c',
      stake: '35,000 QS',
      appliedAt: '2026-01-13 16:55',
      status: 'rejected',
      region: 'Europe (London)',
      nodeSpecs: '16 vCPU, 64GB RAM, 500GB SSD',
      experience: 'なし',
    },
  ];

  const tabs = [
    { key: 'pending', label: t('tabs.pending'), count: SAMPLE_APPLICATIONS.filter(a => a.status === 'pending').length },
    { key: 'reviewing', label: t('tabs.reviewing'), count: SAMPLE_APPLICATIONS.filter(a => a.status === 'reviewing').length },
    { key: 'approved', label: t('tabs.approved'), count: SAMPLE_APPLICATIONS.filter(a => a.status === 'approved').length },
    { key: 'rejected', label: t('tabs.rejected'), count: SAMPLE_APPLICATIONS.filter(a => a.status === 'rejected').length },
    { key: 'all', label: t('tabs.all'), count: SAMPLE_APPLICATIONS.length },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">{t('status.pending')}</Badge>;
      case 'reviewing':
        return <Badge variant="gold">{t('status.reviewing')}</Badge>;
      case 'approved':
        return <Badge variant="success">{t('status.approved')}</Badge>;
      case 'rejected':
        return <Badge variant="danger">{t('status.rejected')}</Badge>;
      default:
        return null;
    }
  };

  const filteredApplications = SAMPLE_APPLICATIONS.filter((app) => {
    const matchesSearch =
      app.operator.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.address.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || app.status === activeTab;
    return matchesSearch && matchesTab;
  });

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
              <Link href="/admin/public/provers" className="hover:text-foreground">
                {t('breadcrumb.provers')}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{t('title')}</span>
            </nav>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
                <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t('stats.totalApplications')}
              value={String(SAMPLE_APPLICATIONS.length)}
              icon={<FileText className="h-5 w-5" />}
              status="info"
            />
            <StatCard
              label={t('stats.pendingReview')}
              value={String(SAMPLE_APPLICATIONS.filter(a => a.status === 'pending').length)}
              icon={<Clock className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.approved')}
              value={String(SAMPLE_APPLICATIONS.filter(a => a.status === 'approved').length)}
              icon={<CheckCircle className="h-5 w-5" />}
              status="success"
            />
            <StatCard
              label={t('stats.rejected')}
              value={String(SAMPLE_APPLICATIONS.filter(a => a.status === 'rejected').length)}
              icon={<XCircle className="h-5 w-5" />}
              status="danger"
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
                <Badge size="sm" variant={activeTab === tab.key ? 'gold' : 'default'}>
                  {tab.count}
                </Badge>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Applications List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{t('listTitle')}</CardTitle>
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
                  <div className="space-y-4">
                    {filteredApplications.map((app) => (
                      <div
                        key={app.id}
                        onClick={() => setSelectedApplication(app)}
                        className={cn(
                          'cursor-pointer rounded-lg border p-4 transition-all',
                          selectedApplication?.id === app.id
                            ? 'border-gold bg-gold/5'
                            : 'border-surface-tertiary bg-background-secondary hover:border-gold/50'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className={cn(
                              'flex h-12 w-12 items-center justify-center rounded-xl',
                              app.status === 'pending' && 'bg-warning/10',
                              app.status === 'reviewing' && 'bg-gold/10',
                              app.status === 'approved' && 'bg-success/10',
                              app.status === 'rejected' && 'bg-danger/10'
                            )}>
                              <Shield className={cn(
                                'h-6 w-6',
                                app.status === 'pending' && 'text-warning',
                                app.status === 'reviewing' && 'text-gold',
                                app.status === 'approved' && 'text-success',
                                app.status === 'rejected' && 'text-danger'
                              )} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">{app.operator}</span>
                                {getStatusBadge(app.status)}
                              </div>
                              <div className="mt-1 font-mono text-xs text-foreground-tertiary">
                                {app.address}
                              </div>
                              <div className="mt-2 flex items-center gap-4 text-xs text-foreground-secondary">
                                <span className="flex items-center gap-1">
                                  <Wallet className="h-3 w-3" />
                                  {app.stake}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {app.appliedAt}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}

                    {filteredApplications.length === 0 && (
                      <div className="py-12 text-center text-foreground-tertiary">
                        <FileText className="mx-auto h-12 w-12" />
                        <p className="mt-2">{t('noApplications')}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Application Detail */}
            <div className="lg:col-span-1">
              <Card className="sticky top-6">
                <CardHeader>
                  <CardTitle className="text-base">{t('detail.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedApplication ? (
                    <div className="space-y-6">
                      {/* Basic Info */}
                      <div>
                        <h4 className="mb-3 text-sm font-medium text-foreground">{t('detail.basicInfo')}</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground-secondary">{t('detail.operator')}</span>
                            <span className="text-sm font-medium">{selectedApplication.operator}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground-secondary">{t('detail.address')}</span>
                            <span className="font-mono text-sm">{selectedApplication.address}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground-secondary">{t('detail.stake')}</span>
                            <span className="text-sm font-medium">{selectedApplication.stake}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground-secondary">{t('detail.region')}</span>
                            <span className="text-sm">{selectedApplication.region}</span>
                          </div>
                        </div>
                      </div>

                      {/* Node Specs */}
                      <div>
                        <h4 className="mb-3 text-sm font-medium text-foreground">{t('detail.nodeSpecs')}</h4>
                        <div className="rounded-lg bg-background-secondary p-3">
                          <p className="text-sm text-foreground-secondary">{selectedApplication.nodeSpecs}</p>
                        </div>
                      </div>

                      {/* Experience */}
                      <div>
                        <h4 className="mb-3 text-sm font-medium text-foreground">{t('detail.experience')}</h4>
                        <div className="rounded-lg bg-background-secondary p-3">
                          <p className="text-sm text-foreground-secondary">{selectedApplication.experience}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      {(selectedApplication.status === 'pending' || selectedApplication.status === 'reviewing') && (
                        <div className="space-y-3 border-t border-surface-tertiary pt-4">
                          <Button className="w-full" leftIcon={<CheckCircle className="h-4 w-4" />}>
                            {t('actions.approve')}
                          </Button>
                          <Button variant="outline" className="w-full" leftIcon={<MessageSquare className="h-4 w-4" />}>
                            {t('actions.requestInfo')}
                          </Button>
                          <Button variant="danger" className="w-full" leftIcon={<XCircle className="h-4 w-4" />}>
                            {t('actions.reject')}
                          </Button>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="py-8 text-center text-foreground-tertiary">
                      <Eye className="mx-auto h-12 w-12" />
                      <p className="mt-2">{t('detail.selectApplication')}</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
