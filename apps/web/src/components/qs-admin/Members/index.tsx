'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  UserCog,
  Users,
  Search,
  Filter,
  Download,
  Plus,
  TrendingUp,
  Mail,
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useMembersStats, useMembersList } from '@/hooks/admin/useMembers';
import {
  type MembersStats,
  type Member,
} from '@/lib/api/admin/types';

const STATUS_COLORS = {
  active: 'bg-success/10 text-success',
  inactive: 'bg-foreground-tertiary/10 text-foreground-tertiary',
  pending: 'bg-warning/10 text-warning',
};

const STATUS_ICONS = {
  active: CheckCircle,
  inactive: XCircle,
  pending: Clock,
};

const ROLE_COLORS = {
  superadmin: 'bg-hinomaru/10 text-hinomaru',
  admin: 'bg-gold/10 text-gold',
  operator: 'bg-info/10 text-info',
  viewer: 'bg-foreground-tertiary/10 text-foreground-tertiary',
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
}

function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  const tCommon = useTranslations('qsAdmin.common');
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-foreground-secondary">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            {trend && (
              <p className={cn('text-xs mt-2 flex items-center', trend.isPositive ? 'text-success' : 'text-danger')}>
                <TrendingUp className={cn('h-3 w-3 mr-1', !trend.isPositive && 'rotate-180')} />
                {trend.isPositive ? '+' : ''}{trend.value}% {tCommon('trend.fromLastWeek')}
              </p>
            )}
          </div>
          <div className="h-12 w-12 rounded-lg bg-hinomaru/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-hinomaru" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Loading Skeleton
function MembersDashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-6 w-48 bg-surface rounded animate-pulse" />
          <div className="h-4 w-32 bg-surface rounded animate-pulse mt-2" />
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-20 bg-surface rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-16 bg-surface rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Error State
function MembersDashboardError({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations('qsAdmin.common');
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-danger mx-auto mb-4" />
          <p className="text-foreground-secondary mb-4">{t('error')}</p>
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('retry')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function MembersDashboard() {
  const t = useTranslations('qsAdmin.members');
  const tCommon = useTranslations('qsAdmin.common');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  // Fetch data using hooks
  const { data: apiStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useMembersStats();
  const { data: membersData, isLoading: membersLoading, error: membersError, refetch: refetchMembers } = useMembersList();

  const isLoading = statsLoading || membersLoading;
  const hasError = statsError || membersError;

  // Use API data with fallback
  const stats = apiStats!;
  const members = membersData?.members ?? [];

  const roleFilters = [
    { key: 'all', label: tCommon('all') },
    { key: 'superadmin', label: t('roles.superadmin') },
    { key: 'admin', label: t('roles.admin') },
    { key: 'operator', label: t('roles.operator') },
    { key: 'viewer', label: t('roles.viewer') },
  ];

  const filteredMembers = members.filter(member => {
    if (roleFilter !== 'all' && member.role !== roleFilter) return false;
    if (searchQuery && !member.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !member.email.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  if (isLoading) {
    return <MembersDashboardSkeleton />;
  }

  if (hasError && !apiStats && !membersData) {
    return <MembersDashboardError onRetry={() => { refetchStats(); refetchMembers(); }} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-foreground-secondary">{t('subtitle')}</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {tCommon('export')}
          </Button>
          <Button className="bg-gradient-hinomaru">
            <Plus className="h-4 w-4 mr-2" />
            {t('actions.invite')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('stats.totalMembers')} value={stats.totalMembers} icon={Users} />
        <StatCard title={t('stats.activeMembers')} value={stats.activeMembers} icon={UserCog} trend={{ value: 8.3, isPositive: true }} />
        <StatCard title={t('stats.roles')} value={stats.roles} icon={Shield} />
        <StatCard title={t('stats.pendingInvites')} value={stats.pendingInvites} icon={Mail} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('title')} ({filteredMembers.length})</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
              <Input type="text" placeholder={tCommon('search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-64" />
            </div>
            <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4 border-b border-border">
            {roleFilters.map((filter) => (
              <button key={filter.key} onClick={() => setRoleFilter(filter.key)} className={cn('px-4 py-3 min-h-[44px] text-sm font-medium border-b-2 -mb-px transition-colors', roleFilter === filter.key ? 'border-hinomaru text-hinomaru' : 'border-transparent text-foreground-secondary hover:text-foreground')}>
                {filter.label}
              </button>
            ))}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.name')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.email')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.role')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.status')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.lastActive')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.joined')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredMembers.map((member) => {
                  const StatusIcon = STATUS_ICONS[member.status as keyof typeof STATUS_ICONS];
                  return (
                    <tr key={member.id} className="border-b border-border hover:bg-surface transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-hinomaru to-gold flex items-center justify-center text-white font-bold text-sm">
                            {member.name.charAt(0)}
                          </div>
                          <span className="font-medium">{member.name}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-foreground-secondary">{member.email}</td>
                      <td className="py-3 px-4">
                        <span className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium', ROLE_COLORS[member.role as keyof typeof ROLE_COLORS])}>
                          {t(`roles.${member.role}`)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <span className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium', STATUS_COLORS[member.status as keyof typeof STATUS_COLORS])}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {t(`status.${member.status}`)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground-secondary">{member.lastActive}</td>
                      <td className="py-3 px-4 text-sm text-foreground-secondary">{member.joined}</td>
                      <td className="py-3 px-4">
                        <Button variant="ghost" size="sm">{t('actions.editRole')}</Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('rolesTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center">
            <Link href="/qs-admin/members/roles">
              <Button variant="outline">
                <Shield className="h-4 w-4 mr-2" />
                {t('rolesTitle')}
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
