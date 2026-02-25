'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Users,
  ChevronRight,
  Search,
  Plus,
  Mail,
  Shield,
  Clock,
  MoreVertical,
  Edit,
  Trash2,
  Key,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminSidebarV2 } from '../AdminSidebarV2';

// Mock data
const mockMembers = [
  {
    id: 'member-001',
    name: '山田太郎',
    email: 'yamada@quantumshield.io',
    role: 'admin',
    status: 'active',
    lastLogin: '2026-01-18 14:30',
    createdAt: '2025-06-15',
    avatar: 'YT',
  },
  {
    id: 'member-002',
    name: '佐藤花子',
    email: 'sato@quantumshield.io',
    role: 'operator',
    status: 'active',
    lastLogin: '2026-01-18 10:15',
    createdAt: '2025-07-20',
    avatar: 'SH',
  },
  {
    id: 'member-003',
    name: '田中一郎',
    email: 'tanaka@quantumshield.io',
    role: 'viewer',
    status: 'active',
    lastLogin: '2026-01-17 16:45',
    createdAt: '2025-08-10',
    avatar: 'TI',
  },
  {
    id: 'member-004',
    name: '鈴木次郎',
    email: 'suzuki@quantumshield.io',
    role: 'operator',
    status: 'invited',
    lastLogin: null,
    createdAt: '2026-01-15',
    avatar: 'SJ',
  },
  {
    id: 'member-005',
    name: '高橋三郎',
    email: 'takahashi@quantumshield.io',
    role: 'admin',
    status: 'inactive',
    lastLogin: '2025-12-20 09:00',
    createdAt: '2025-05-01',
    avatar: 'TS',
  },
];

const mockMetrics = {
  totalMembers: 5,
  activeMembers: 3,
  admins: 2,
  operators: 2,
};

export function SettingsMembers() {
  const t = useTranslations('admin.settingsMembers');
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'invited' | 'inactive'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const tabs = [
    { key: 'all', label: t('tabs.all'), count: mockMembers.length },
    { key: 'active', label: t('tabs.active'), count: mockMembers.filter(m => m.status === 'active').length },
    { key: 'invited', label: t('tabs.invited'), count: mockMembers.filter(m => m.status === 'invited').length },
    { key: 'inactive', label: t('tabs.inactive'), count: mockMembers.filter(m => m.status === 'inactive').length },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="success">{t('status.active')}</Badge>;
      case 'invited':
        return <Badge variant="gold">{t('status.invited')}</Badge>;
      case 'inactive':
        return <Badge variant="default">{t('status.inactive')}</Badge>;
      default:
        return null;
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="danger">{t('roles.admin')}</Badge>;
      case 'operator':
        return <Badge variant="gold">{t('roles.operator')}</Badge>;
      case 'viewer':
        return <Badge variant="default">{t('roles.viewer')}</Badge>;
      default:
        return null;
    }
  };

  const filteredMembers = mockMembers.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && member.status === activeTab;
  });

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
              <Link href="/admin/settings/members" className="hover:text-foreground">
                Settings
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{t('breadcrumb')}</span>
            </div>
            <div className="mt-2 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
                <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
              </div>
              <Button leftIcon={<Plus className="h-4 w-4" />}>
                {t('actions.inviteMember')}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                  <Users className="h-5 w-5 text-gold" />
                </div>
                <div>
                  <div className="text-xs text-foreground-tertiary">{t('stats.totalMembers')}</div>
                  <div className="text-xl font-bold">{mockMetrics.totalMembers}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-success/10">
                  <Users className="h-5 w-5 text-success" />
                </div>
                <div>
                  <div className="text-xs text-foreground-tertiary">{t('stats.activeMembers')}</div>
                  <div className="text-xl font-bold">{mockMetrics.activeMembers}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-danger/10">
                  <Shield className="h-5 w-5 text-danger" />
                </div>
                <div>
                  <div className="text-xs text-foreground-tertiary">{t('stats.admins')}</div>
                  <div className="text-xl font-bold">{mockMetrics.admins}</div>
                </div>
              </div>
            </Card>
            <Card className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-warning/10">
                  <Key className="h-5 w-5 text-warning" />
                </div>
                <div>
                  <div className="text-xs text-foreground-tertiary">{t('stats.operators')}</div>
                  <div className="text-xl font-bold">{mockMetrics.operators}</div>
                </div>
              </div>
            </Card>
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

          {/* Member List */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="text-base">{t('memberList.title')}</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
                <input
                  type="text"
                  placeholder={t('memberList.searchPlaceholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="rounded-lg border border-surface-tertiary bg-background-secondary py-2 pl-10 pr-4 text-sm focus:border-gold focus:outline-none"
                />
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-surface-tertiary text-left text-xs text-foreground-tertiary">
                      <th className="pb-3 font-medium">{t('table.columns.member')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.role')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.status')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.lastLogin')}</th>
                      <th className="pb-3 font-medium">{t('table.columns.createdAt')}</th>
                      <th className="pb-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredMembers.map((member) => (
                      <tr
                        key={member.id}
                        className="border-b border-surface-tertiary/50 hover:bg-background-secondary/50"
                      >
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gold/10 font-medium text-gold">
                              {member.avatar}
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{member.name}</div>
                              <div className="flex items-center gap-1 text-xs text-foreground-tertiary">
                                <Mail className="h-3 w-3" />
                                {member.email}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">{getRoleBadge(member.role)}</td>
                        <td className="py-4">{getStatusBadge(member.status)}</td>
                        <td className="py-4">
                          {member.lastLogin ? (
                            <div className="flex items-center gap-1 text-sm text-foreground-secondary">
                              <Clock className="h-4 w-4" />
                              {member.lastLogin}
                            </div>
                          ) : (
                            <span className="text-sm text-foreground-tertiary">-</span>
                          )}
                        </td>
                        <td className="py-4 text-sm text-foreground-secondary">{member.createdAt}</td>
                        <td className="py-4">
                          <div className="flex items-center gap-2">
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-danger hover:text-danger">
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
