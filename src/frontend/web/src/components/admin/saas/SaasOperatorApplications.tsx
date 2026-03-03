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
  XCircle,
  Clock,
  FileText,
  Users,
  Globe,
  Mail,
  Phone,
  AlertTriangle,
  Eye,
  MessageSquare,
  Briefcase,
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
  companyName: string;
  country: string;
  contactName: string;
  contactEmail: string;
  plan: 'starter' | 'business' | 'enterprise';
  expectedUsers: string;
  appliedAt: string;
  status: 'pending' | 'kyb_review' | 'contract_review' | 'approved' | 'rejected';
  industry: string;
  useCase: string;
}

export function SaasOperatorApplications() {
  const t = useTranslations('admin.operatorApplications');
  const [activeTab, setActiveTab] = useState<'pending' | 'kyb_review' | 'contract_review' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);

  const SAMPLE_APPLICATIONS: Application[] = [
    {
      id: 'oa-001',
      companyName: 'Global Finance Corp.',
      country: 'Japan',
      contactName: '山田 太郎',
      contactEmail: 'yamada@globalfinance.jp',
      plan: 'enterprise',
      expectedUsers: '10,000+',
      appliedAt: '2026-01-17 10:30',
      status: 'pending',
      industry: '金融サービス',
      useCase: '機関投資家向けカストディサービス',
    },
    {
      id: 'oa-002',
      companyName: 'Tech Innovations Ltd.',
      country: 'Singapore',
      contactName: 'John Smith',
      contactEmail: 'john@techinnovations.sg',
      plan: 'business',
      expectedUsers: '1,000-5,000',
      appliedAt: '2026-01-16 14:22',
      status: 'kyb_review',
      industry: 'テクノロジー',
      useCase: 'Web3ウォレットサービス',
    },
    {
      id: 'oa-003',
      companyName: 'Digital Assets Inc.',
      country: 'United States',
      contactName: 'Emily Chen',
      contactEmail: 'emily@digitalassets.com',
      plan: 'enterprise',
      expectedUsers: '50,000+',
      appliedAt: '2026-01-15 09:45',
      status: 'contract_review',
      industry: '暗号資産取引所',
      useCase: '取引所カストディ統合',
    },
    {
      id: 'oa-004',
      companyName: 'Crypto Startup AG',
      country: 'Switzerland',
      contactName: 'Hans Mueller',
      contactEmail: 'hans@cryptostartup.ch',
      plan: 'starter',
      expectedUsers: '100-500',
      appliedAt: '2026-01-14 16:00',
      status: 'approved',
      industry: 'FinTech',
      useCase: 'DeFiアグリゲーター',
    },
    {
      id: 'oa-005',
      companyName: 'Risky Ventures LLC',
      country: 'Unknown',
      contactName: 'Anonymous',
      contactEmail: 'contact@riskyventures.xyz',
      plan: 'business',
      expectedUsers: '500-1,000',
      appliedAt: '2026-01-13 11:30',
      status: 'rejected',
      industry: '不明',
      useCase: '不明確',
    },
  ];

  const tabs = [
    { key: 'pending', label: t('tabs.pending'), count: SAMPLE_APPLICATIONS.filter(a => a.status === 'pending').length },
    { key: 'kyb_review', label: t('tabs.kybReview'), count: SAMPLE_APPLICATIONS.filter(a => a.status === 'kyb_review').length },
    { key: 'contract_review', label: t('tabs.contractReview'), count: SAMPLE_APPLICATIONS.filter(a => a.status === 'contract_review').length },
    { key: 'approved', label: t('tabs.approved'), count: SAMPLE_APPLICATIONS.filter(a => a.status === 'approved').length },
    { key: 'rejected', label: t('tabs.rejected'), count: SAMPLE_APPLICATIONS.filter(a => a.status === 'rejected').length },
    { key: 'all', label: t('tabs.all'), count: SAMPLE_APPLICATIONS.length },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">{t('status.pending')}</Badge>;
      case 'kyb_review':
        return <Badge variant="gold">{t('status.kybReview')}</Badge>;
      case 'contract_review':
        return <Badge variant="gold">{t('status.contractReview')}</Badge>;
      case 'approved':
        return <Badge variant="success">{t('status.approved')}</Badge>;
      case 'rejected':
        return <Badge variant="danger">{t('status.rejected')}</Badge>;
      default:
        return null;
    }
  };

  const getPlanBadge = (plan: string) => {
    switch (plan) {
      case 'starter':
        return <Badge variant="default">Starter</Badge>;
      case 'business':
        return <Badge variant="gold">Business</Badge>;
      case 'enterprise':
        return <Badge variant="success">Enterprise</Badge>;
      default:
        return null;
    }
  };

  const filteredApplications = SAMPLE_APPLICATIONS.filter((app) => {
    const matchesSearch =
      app.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.contactEmail.toLowerCase().includes(searchQuery.toLowerCase());
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
              <Link href="/admin/saas/operators" className="hover:text-foreground">
                {t('breadcrumb.operators')}
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
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
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
              label={t('stats.kybReview')}
              value={String(SAMPLE_APPLICATIONS.filter(a => a.status === 'kyb_review').length)}
              icon={<Users className="h-5 w-5" />}
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
          <div className="mb-6 flex flex-wrap gap-1 rounded-lg border border-surface-tertiary bg-background-secondary p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-all',
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
                              app.status === 'kyb_review' && 'bg-gold/10',
                              app.status === 'contract_review' && 'bg-gold/10',
                              app.status === 'approved' && 'bg-success/10',
                              app.status === 'rejected' && 'bg-danger/10'
                            )}>
                              <Building2 className={cn(
                                'h-6 w-6',
                                app.status === 'pending' && 'text-warning',
                                app.status === 'kyb_review' && 'text-gold',
                                app.status === 'contract_review' && 'text-gold',
                                app.status === 'approved' && 'text-success',
                                app.status === 'rejected' && 'text-danger'
                              )} />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">{app.companyName}</span>
                                {getStatusBadge(app.status)}
                                {getPlanBadge(app.plan)}
                              </div>
                              <div className="mt-1 flex items-center gap-2 text-xs text-foreground-tertiary">
                                <Globe className="h-3 w-3" />
                                {app.country}
                                <span>•</span>
                                <Briefcase className="h-3 w-3" />
                                {app.industry}
                              </div>
                              <div className="mt-2 flex items-center gap-4 text-xs text-foreground-secondary">
                                <span className="flex items-center gap-1">
                                  <Users className="h-3 w-3" />
                                  {app.expectedUsers}
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
                      {/* Company Info */}
                      <div>
                        <h4 className="mb-3 text-sm font-medium text-foreground">{t('detail.companyInfo')}</h4>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground-secondary">{t('detail.companyName')}</span>
                            <span className="text-sm font-medium">{selectedApplication.companyName}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground-secondary">{t('detail.country')}</span>
                            <span className="text-sm">{selectedApplication.country}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground-secondary">{t('detail.industry')}</span>
                            <span className="text-sm">{selectedApplication.industry}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-foreground-secondary">{t('detail.plan')}</span>
                            {getPlanBadge(selectedApplication.plan)}
                          </div>
                        </div>
                      </div>

                      {/* Contact Info */}
                      <div>
                        <h4 className="mb-3 text-sm font-medium text-foreground">{t('detail.contactInfo')}</h4>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-foreground-tertiary" />
                            <span className="text-sm">{selectedApplication.contactName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-foreground-tertiary" />
                            <span className="text-sm">{selectedApplication.contactEmail}</span>
                          </div>
                        </div>
                      </div>

                      {/* Use Case */}
                      <div>
                        <h4 className="mb-3 text-sm font-medium text-foreground">{t('detail.useCase')}</h4>
                        <div className="rounded-lg bg-background-secondary p-3">
                          <p className="text-sm text-foreground-secondary">{selectedApplication.useCase}</p>
                        </div>
                      </div>

                      {/* Expected Users */}
                      <div>
                        <h4 className="mb-3 text-sm font-medium text-foreground">{t('detail.expectedUsers')}</h4>
                        <div className="rounded-lg bg-background-secondary p-3">
                          <p className="text-sm text-foreground-secondary">{selectedApplication.expectedUsers}</p>
                        </div>
                      </div>

                      {/* Actions */}
                      {selectedApplication.status !== 'approved' && selectedApplication.status !== 'rejected' && (
                        <div className="space-y-3 border-t border-surface-tertiary pt-4">
                          {selectedApplication.status === 'pending' && (
                            <Button className="w-full" leftIcon={<Users className="h-4 w-4" />}>
                              {t('actions.startKyb')}
                            </Button>
                          )}
                          {selectedApplication.status === 'kyb_review' && (
                            <Button className="w-full" leftIcon={<FileText className="h-4 w-4" />}>
                              {t('actions.startContract')}
                            </Button>
                          )}
                          {selectedApplication.status === 'contract_review' && (
                            <Button className="w-full" leftIcon={<CheckCircle className="h-4 w-4" />}>
                              {t('actions.approve')}
                            </Button>
                          )}
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
