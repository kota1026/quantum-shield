'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  ChevronRight,
  Search,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  User,
  Shield,
  Wallet,
  Settings,
  Eye,
  Check,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { EnterpriseSidebar } from './Dashboard/EnterpriseSidebar';

interface ApprovalRequest {
  id: string;
  type: 'transaction' | 'user' | 'setting' | 'api';
  title: string;
  description: string;
  requestedBy: string;
  requestedAt: string;
  status: 'pending' | 'approved' | 'rejected';
  amount?: string;
  risk?: 'low' | 'medium' | 'high';
}

// Stat card
interface StatCardProps {
  label: string;
  value: string;
  icon: React.ReactNode;
  status?: 'success' | 'warning' | 'danger' | 'info';
}

function StatCard({ label, value, icon, status = 'info' }: StatCardProps) {
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
        </div>
      </div>
    </Card>
  );
}

export function EnterpriseApprovals() {
  const t = useTranslations('enterprise.approvals');
  const [activeTab, setActiveTab] = useState<'pending' | 'approved' | 'rejected' | 'all'>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  const SAMPLE_APPROVALS: ApprovalRequest[] = [
    {
      id: 'apr-001',
      type: 'transaction',
      title: t('requests.largeUnlock'),
      description: t('requests.largeUnlockDesc', { amount: '500 ETH' }),
      requestedBy: '田中 太郎',
      requestedAt: '5分前',
      status: 'pending',
      amount: '500 ETH',
      risk: 'high',
    },
    {
      id: 'apr-002',
      type: 'user',
      title: t('requests.adminInvite'),
      description: t('requests.adminInviteDesc', { email: 'suzuki@example.com' }),
      requestedBy: '佐藤 花子',
      requestedAt: '1時間前',
      status: 'pending',
      risk: 'medium',
    },
    {
      id: 'apr-003',
      type: 'setting',
      title: t('requests.ipChange'),
      description: t('requests.ipChangeDesc'),
      requestedBy: '山田 一郎',
      requestedAt: '2時間前',
      status: 'pending',
      risk: 'medium',
    },
    {
      id: 'apr-004',
      type: 'api',
      title: t('requests.apiCreate'),
      description: t('requests.apiCreateDesc'),
      requestedBy: '田中 太郎',
      requestedAt: '1日前',
      status: 'approved',
      risk: 'low',
    },
    {
      id: 'apr-005',
      type: 'transaction',
      title: t('requests.emergencyUnlock'),
      description: t('requests.emergencyUnlockDesc'),
      requestedBy: '佐藤 花子',
      requestedAt: '2日前',
      status: 'rejected',
      amount: '100 ETH',
      risk: 'high',
    },
  ];

  const tabs = [
    { key: 'pending', label: t('tabs.pending'), count: SAMPLE_APPROVALS.filter(a => a.status === 'pending').length },
    { key: 'approved', label: t('tabs.approved'), count: SAMPLE_APPROVALS.filter(a => a.status === 'approved').length },
    { key: 'rejected', label: t('tabs.rejected'), count: SAMPLE_APPROVALS.filter(a => a.status === 'rejected').length },
    { key: 'all', label: t('tabs.all'), count: SAMPLE_APPROVALS.length },
  ];

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'transaction':
        return <Wallet className="h-4 w-4" />;
      case 'user':
        return <User className="h-4 w-4" />;
      case 'setting':
        return <Settings className="h-4 w-4" />;
      case 'api':
        return <Shield className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="warning">{t('status.pending')}</Badge>;
      case 'approved':
        return <Badge variant="success">{t('status.approved')}</Badge>;
      case 'rejected':
        return <Badge variant="danger">{t('status.rejected')}</Badge>;
      default:
        return null;
    }
  };

  const getRiskBadge = (risk?: string) => {
    switch (risk) {
      case 'high':
        return <Badge variant="danger">{t('risk.high')}</Badge>;
      case 'medium':
        return <Badge variant="warning">{t('risk.medium')}</Badge>;
      case 'low':
        return <Badge variant="success">{t('risk.low')}</Badge>;
      default:
        return null;
    }
  };

  const filteredApprovals = SAMPLE_APPROVALS.filter((approval) => {
    const matchesSearch =
      approval.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      approval.requestedBy.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab = activeTab === 'all' || approval.status === activeTab;
    return matchesSearch && matchesTab;
  });

  return (
    <div className="min-h-screen bg-background">
      <EnterpriseSidebar />

      <main className="ml-[260px]" role="main" aria-label={t('ariaLabel')}>
        <div className="p-6 lg:p-8">
          {/* Header */}
          <div className="mb-6">
            <div className="flex items-center gap-2 text-sm text-foreground-tertiary">
              <Link href="/enterprise/dashboard" className="hover:text-foreground">
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
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label={t('stats.pending')}
              value={String(SAMPLE_APPROVALS.filter(a => a.status === 'pending').length)}
              icon={<Clock className="h-5 w-5" />}
              status="warning"
            />
            <StatCard
              label={t('stats.approved')}
              value={String(SAMPLE_APPROVALS.filter(a => a.status === 'approved').length)}
              icon={<CheckCircle className="h-5 w-5" />}
              status="success"
            />
            <StatCard
              label={t('stats.rejected')}
              value={String(SAMPLE_APPROVALS.filter(a => a.status === 'rejected').length)}
              icon={<XCircle className="h-5 w-5" />}
              status="danger"
            />
            <StatCard
              label={t('stats.highRisk')}
              value={String(SAMPLE_APPROVALS.filter(a => a.risk === 'high' && a.status === 'pending').length)}
              icon={<AlertCircle className="h-5 w-5" />}
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

          {/* Approvals List */}
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
                {filteredApprovals.map((approval) => (
                  <div
                    key={approval.id}
                    className={cn(
                      'rounded-lg border p-4',
                      approval.status === 'pending' && approval.risk === 'high'
                        ? 'border-danger/30 bg-danger/5'
                        : approval.status === 'pending'
                          ? 'border-warning/30 bg-warning/5'
                          : 'border-surface-tertiary bg-background-secondary'
                    )}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className={cn(
                          'flex h-10 w-10 items-center justify-center rounded-lg',
                          approval.type === 'transaction' ? 'bg-gold/10 text-gold' :
                          approval.type === 'user' ? 'bg-info/10 text-info' :
                          approval.type === 'setting' ? 'bg-warning/10 text-warning' :
                          'bg-success/10 text-success'
                        )}>
                          {getTypeIcon(approval.type)}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">{approval.title}</span>
                            {getStatusBadge(approval.status)}
                            {getRiskBadge(approval.risk)}
                          </div>
                          <p className="mt-1 text-sm text-foreground-secondary">{approval.description}</p>
                          <div className="mt-2 flex items-center gap-4 text-xs text-foreground-tertiary">
                            <span>{t('requestedBy')}: {approval.requestedBy}</span>
                            <span>{approval.requestedAt}</span>
                            {approval.amount && (
                              <span className="font-medium text-foreground">{approval.amount}</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm" leftIcon={<Eye className="h-4 w-4" />}>
                          {t('viewDetails')}
                        </Button>
                        {approval.status === 'pending' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="border-danger text-danger hover:bg-danger hover:text-white"
                              leftIcon={<X className="h-4 w-4" />}
                            >
                              {t('reject')}
                            </Button>
                            <Button
                              size="sm"
                              className="bg-success hover:bg-success/90"
                              leftIcon={<Check className="h-4 w-4" />}
                            >
                              {t('approve')}
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                {filteredApprovals.length === 0 && (
                  <div className="py-12 text-center text-foreground-tertiary">
                    {t('noResults')}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
