'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  Shield,
  ChevronRight,
  Plus,
  Check,
  X,
  Edit,
  Users,
  Settings,
  Eye,
  FileText,
  Database,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminSidebarV2 } from '../AdminSidebarV2';

// Default roles data
const DEFAULT_ROLES = [
  {
    id: 'role-admin',
    name: 'Admin',
    description: 'システム全体の管理権限を持つ最高権限ロール',
    memberCount: 2,
    isSystem: true,
    permissions: {
      users: { view: true, create: true, edit: true, delete: true },
      operators: { view: true, create: true, edit: true, delete: true },
      billing: { view: true, create: true, edit: true, delete: true },
      settings: { view: true, create: true, edit: true, delete: true },
      audit: { view: true, create: false, edit: false, delete: false },
    },
  },
  {
    id: 'role-operator',
    name: 'Operator',
    description: 'オペレーターとユーザーの管理権限',
    memberCount: 2,
    isSystem: true,
    permissions: {
      users: { view: true, create: true, edit: true, delete: false },
      operators: { view: true, create: true, edit: true, delete: false },
      billing: { view: true, create: false, edit: false, delete: false },
      settings: { view: true, create: false, edit: false, delete: false },
      audit: { view: true, create: false, edit: false, delete: false },
    },
  },
  {
    id: 'role-viewer',
    name: 'Viewer',
    description: '閲覧のみの読み取り専用ロール',
    memberCount: 1,
    isSystem: true,
    permissions: {
      users: { view: true, create: false, edit: false, delete: false },
      operators: { view: true, create: false, edit: false, delete: false },
      billing: { view: true, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
      audit: { view: true, create: false, edit: false, delete: false },
    },
  },
  {
    id: 'role-support',
    name: 'Support',
    description: 'サポートチーム向けカスタムロール',
    memberCount: 0,
    isSystem: false,
    permissions: {
      users: { view: true, create: false, edit: true, delete: false },
      operators: { view: true, create: false, edit: false, delete: false },
      billing: { view: true, create: false, edit: false, delete: false },
      settings: { view: false, create: false, edit: false, delete: false },
      audit: { view: true, create: false, edit: false, delete: false },
    },
  },
];

const permissionCategories = [
  { key: 'users', label: 'Users', icon: Users },
  { key: 'operators', label: 'Operators', icon: Database },
  { key: 'billing', label: 'Billing', icon: FileText },
  { key: 'settings', label: 'Settings', icon: Settings },
  { key: 'audit', label: 'Audit Log', icon: Eye },
];

export function SettingsRoles() {
  const t = useTranslations('admin.settingsRoles');
  const [selectedRole, setSelectedRole] = useState<typeof DEFAULT_ROLES[0] | null>(DEFAULT_ROLES[0]);

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
                {t('actions.createRole')}
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Role List */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('roleList.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {DEFAULT_ROLES.map((role) => (
                      <div
                        key={role.id}
                        onClick={() => setSelectedRole(role)}
                        className={cn(
                          'cursor-pointer rounded-lg border p-4 transition-all',
                          selectedRole?.id === role.id
                            ? 'border-gold bg-gold/5'
                            : 'border-surface-tertiary hover:border-gold/50'
                        )}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                              <Shield className="h-5 w-5 text-gold" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium">{role.name}</span>
                                {role.isSystem && (
                                  <Badge variant="default" size="sm">{t('roleList.system')}</Badge>
                                )}
                              </div>
                              <div className="text-xs text-foreground-tertiary">
                                {role.memberCount} {t('roleList.members')}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Role Detail */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{t('detail.title')}</CardTitle>
                  {selectedRole && !selectedRole.isSystem && (
                    <Button variant="outline" size="sm" leftIcon={<Edit className="h-4 w-4" />}>
                      {t('detail.actions.edit')}
                    </Button>
                  )}
                </CardHeader>
                <CardContent>
                  {selectedRole ? (
                    <div className="space-y-6">
                      <div>
                        <div className="flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/10">
                            <Shield className="h-6 w-6 text-gold" />
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <h3 className="text-lg font-bold">{selectedRole.name}</h3>
                              {selectedRole.isSystem && (
                                <Badge variant="gold">{t('detail.systemRole')}</Badge>
                              )}
                            </div>
                            <p className="text-sm text-foreground-secondary">{selectedRole.description}</p>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="mb-2 text-sm font-medium">{t('detail.members')}</div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-foreground-tertiary" />
                          <span>{selectedRole.memberCount} {t('detail.membersCount')}</span>
                        </div>
                      </div>

                      <div>
                        <div className="mb-4 text-sm font-medium">{t('detail.permissions')}</div>
                        <div className="overflow-x-auto">
                          <table className="w-full">
                            <thead>
                              <tr className="border-b border-surface-tertiary text-left text-xs text-foreground-tertiary">
                                <th className="pb-3 font-medium">{t('permissions.category')}</th>
                                <th className="pb-3 text-center font-medium">{t('permissions.view')}</th>
                                <th className="pb-3 text-center font-medium">{t('permissions.create')}</th>
                                <th className="pb-3 text-center font-medium">{t('permissions.edit')}</th>
                                <th className="pb-3 text-center font-medium">{t('permissions.delete')}</th>
                              </tr>
                            </thead>
                            <tbody>
                              {permissionCategories.map((category) => {
                                const Icon = category.icon;
                                const perms = selectedRole.permissions[category.key as keyof typeof selectedRole.permissions];
                                return (
                                  <tr key={category.key} className="border-b border-surface-tertiary/50">
                                    <td className="py-3">
                                      <div className="flex items-center gap-2">
                                        <Icon className="h-4 w-4 text-foreground-tertiary" />
                                        <span>{category.label}</span>
                                      </div>
                                    </td>
                                    <td className="py-3 text-center">
                                      {perms.view ? (
                                        <Check className="mx-auto h-4 w-4 text-success" />
                                      ) : (
                                        <X className="mx-auto h-4 w-4 text-foreground-tertiary" />
                                      )}
                                    </td>
                                    <td className="py-3 text-center">
                                      {perms.create ? (
                                        <Check className="mx-auto h-4 w-4 text-success" />
                                      ) : (
                                        <X className="mx-auto h-4 w-4 text-foreground-tertiary" />
                                      )}
                                    </td>
                                    <td className="py-3 text-center">
                                      {perms.edit ? (
                                        <Check className="mx-auto h-4 w-4 text-success" />
                                      ) : (
                                        <X className="mx-auto h-4 w-4 text-foreground-tertiary" />
                                      )}
                                    </td>
                                    <td className="py-3 text-center">
                                      {perms.delete ? (
                                        <Check className="mx-auto h-4 w-4 text-success" />
                                      ) : (
                                        <X className="mx-auto h-4 w-4 text-foreground-tertiary" />
                                      )}
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {selectedRole.isSystem && (
                        <div className="rounded-lg bg-warning/10 p-4">
                          <div className="flex items-center gap-2 text-sm text-warning">
                            <Shield className="h-4 w-4" />
                            <span>{t('detail.systemRoleWarning')}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-64 items-center justify-center text-center text-foreground-tertiary">
                      <div>
                        <Shield className="mx-auto h-12 w-12" />
                        <p className="mt-2">{t('detail.selectRole')}</p>
                      </div>
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
