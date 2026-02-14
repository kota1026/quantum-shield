'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Users,
  Search,
  Filter,
  Download,
  ArrowLeft,
  UserCheck,
  UserX,
  Mail,
  Calendar,
  Lock,
  Ban,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useUsersList, useSuspendUsers } from '@/hooks/admin/useUsers';
import type { User } from '@/lib/api/admin/types';


const STATUS_COLORS = {
  active: 'bg-success/10 text-success',
  inactive: 'bg-foreground-tertiary/10 text-foreground-tertiary',
  suspended: 'bg-danger/10 text-danger',
};

const STATUS_ICONS = {
  active: UserCheck,
  inactive: Users,
  suspended: UserX,
};

// Loading Skeleton
function UsersListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <div className="h-10 w-10 bg-surface rounded animate-pulse" />
          <div>
            <div className="h-6 w-48 bg-surface rounded animate-pulse" />
            <div className="h-4 w-32 bg-surface rounded animate-pulse mt-2" />
          </div>
        </div>
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-16 bg-surface rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Error State
function UsersListError({ onRetry }: { onRetry: () => void }) {
  const t = useTranslations('qsAdmin');
  return (
    <Card>
      <CardContent className="p-6">
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-danger mx-auto mb-4" />
          <p className="text-foreground-secondary mb-4">{t('common.error')}</p>
          <Button variant="outline" onClick={onRetry}>
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('common.retry')}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export function UsersList() {
  const t = useTranslations('qsAdmin');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);

  // Fetch data using hooks
  const { data: usersData, isLoading, error, refetch } = useUsersList();
  const suspendMutation = useSuspendUsers();

  const users = usersData?.users ?? [];

  const statusFilters = [
    { key: 'all', label: t('common.all') },
    { key: 'active', label: t('users.status.active') },
    { key: 'inactive', label: t('users.status.inactive') },
    { key: 'suspended', label: t('users.status.suspended') },
  ];

  const filteredUsers = users.filter(user => {
    if (statusFilter !== 'all' && user.status !== statusFilter) return false;
    if (searchQuery && !user.wallet.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !(user.email?.toLowerCase().includes(searchQuery.toLowerCase()))) return false;
    return true;
  });

  const toggleSelectUser = (id: string) => {
    setSelectedUsers(prev =>
      prev.includes(id) ? prev.filter(u => u !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const handleSuspendSelected = () => {
    if (confirm(t('users.actions.suspendConfirm', { count: selectedUsers.length }))) {
      suspendMutation.mutate(selectedUsers, {
        onSuccess: () => {
          alert(t('users.actions.suspendSuccess', { count: selectedUsers.length }));
          setSelectedUsers([]);
        },
      });
    }
  };

  if (isLoading) {
    return <UsersListSkeleton />;
  }

  // Show error when API fails and no data available
  if (error && !usersData) {
    return <UsersListError onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/qs-admin/users">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('users.listTitle')}</h1>
            <p className="text-foreground-secondary">{t('users.listSubtitle')}</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {selectedUsers.length > 0 && (
            <Button
              variant="outline"
              className="text-danger border-danger hover:bg-danger/10"
              onClick={handleSuspendSelected}
              disabled={suspendMutation.isPending}
            >
              {suspendMutation.isPending ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Ban className="h-4 w-4 mr-2" />
              )}
              {t('users.actions.suspendSelected')} ({selectedUsers.length})
            </Button>
          )}
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {t('common.export')}
          </Button>
        </div>
      </div>

      {/* Users Table */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('users.title')} ({filteredUsers.length})</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
              <Input type="text" placeholder={t('users.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-72" />
            </div>
            <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filter Tabs */}
          <div className="flex space-x-2 mb-4 border-b border-border">
            {statusFilters.map((filter) => (
              <button key={filter.key} onClick={() => setStatusFilter(filter.key)} className={cn('px-4 py-3 min-h-[44px] text-sm font-medium border-b-2 -mb-px transition-colors', statusFilter === filter.key ? 'border-hinomaru text-hinomaru' : 'border-transparent text-foreground-secondary hover:text-foreground')}>
                {filter.label}
              </button>
            ))}
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                      onChange={toggleSelectAll}
                      className="rounded border-border"
                    />
                  </th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('users.table.wallet')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('users.table.email')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('users.table.joined')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('users.table.lastActive')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('users.table.locked')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('users.table.transactions')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('users.table.status')}</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">{t('users.table.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const StatusIcon = STATUS_ICONS[user.status as keyof typeof STATUS_ICONS];
                  return (
                    <tr key={user.id} className={cn('border-b border-border hover:bg-surface transition-colors', selectedUsers.includes(user.id) && 'bg-hinomaru/5')}>
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedUsers.includes(user.id)}
                          onChange={() => toggleSelectUser(user.id)}
                          className="rounded border-border"
                        />
                      </td>
                      <td className="py-3 px-4"><code className="text-sm font-mono">{user.wallet}</code></td>
                      <td className="py-3 px-4">
                        {user.email ? (
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-foreground-tertiary" />
                            <span className="text-sm">{user.email}</span>
                          </div>
                        ) : (
                          <span className="text-foreground-tertiary text-sm">-</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2 text-sm text-foreground-secondary">
                          <Calendar className="h-4 w-4" />
                          <span>{user.joined}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-foreground-secondary">{user.lastActive}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center space-x-2">
                          <Lock className="h-4 w-4 text-success" />
                          <span className="font-medium">{user.locked}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-foreground-secondary">{user.transactions}</td>
                      <td className="py-3 px-4">
                        <span className={cn('inline-flex items-center px-2 py-1 rounded-md text-xs font-medium', STATUS_COLORS[user.status as keyof typeof STATUS_COLORS])}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {t(`users.status.${user.status}`)}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <Link href={`/qs-admin/users/${user.id}`} className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 text-sm font-medium border border-border rounded-md hover:bg-accent transition-colors">
                          {t('common.detail')}
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredUsers.length === 0 && (
            <div className="text-center py-8 text-foreground-secondary">{t('users.empty')}</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
