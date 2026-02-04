'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Shield,
  ArrowLeft,
  Plus,
  CheckCircle,
  XCircle,
  Settings,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { useRolesList } from '@/hooks/admin/useMembers';
import {
  MOCK_ROLES,
  MOCK_PERMISSION_CATEGORIES,
  type Role,
  type PermissionCategory,
} from '@/lib/api/admin/mock';

// Fallback data
const FALLBACK_ROLES = MOCK_ROLES;
const FALLBACK_PERMISSION_CATEGORIES = MOCK_PERMISSION_CATEGORIES;

const ROLE_COLORS = {
  superadmin: 'border-hinomaru bg-hinomaru/5',
  admin: 'border-gold bg-gold/5',
  operator: 'border-info bg-info/5',
  viewer: 'border-foreground-tertiary bg-foreground-tertiary/5',
};

// Loading Skeleton
function RolesManagementSkeleton() {
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="h-24 bg-surface rounded animate-pulse" />
            </CardContent>
          </Card>
        ))}
      </div>
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="h-12 bg-surface rounded animate-pulse" />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Error State
function RolesManagementError({ onRetry }: { onRetry: () => void }) {
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

export function RolesManagement() {
  const t = useTranslations('qsAdmin.members');
  const tCommon = useTranslations('qsAdmin.common');

  // Fetch data using hooks
  const { data: rolesData, isLoading, error, refetch } = useRolesList();

  // Use API data with fallback
  const roles = rolesData?.roles ?? FALLBACK_ROLES;
  const permissionCategories = FALLBACK_PERMISSION_CATEGORIES;

  const hasPermission = (rolePermissions: string[], permissionId: string) => {
    return rolePermissions.includes('all') || rolePermissions.includes(permissionId);
  };

  if (isLoading) {
    return <RolesManagementSkeleton />;
  }

  if (error && !rolesData) {
    return <RolesManagementError onRetry={refetch} />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/qs-admin/members">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('rolesTitle')}</h1>
            <p className="text-foreground-secondary">{t('rolesSubtitle')}</p>
          </div>
        </div>
        <Button className="bg-gradient-hinomaru">
          <Plus className="h-4 w-4 mr-2" />
          {tCommon('create')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {roles.map((role) => (
          <Card key={role.id} className={cn('border-2', ROLE_COLORS[role.id as keyof typeof ROLE_COLORS])}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center">
                  <Shield className="h-5 w-5 mr-2 text-hinomaru" />
                  {t(`roles.${role.id}`)}
                </CardTitle>
                <Button variant="ghost" size="icon">
                  <Settings className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-foreground-secondary mb-4">{role.description}</p>
              <div className="flex justify-between text-sm">
                <span className="text-foreground-tertiary">{t('stats.totalMembers')}</span>
                <span className="font-medium">{role.members}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('rolesTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-foreground-secondary">Permission</th>
                  {roles.map((role) => (
                    <th key={role.id} className="text-center py-3 px-4 text-sm font-medium text-foreground-secondary">
                      {t(`roles.${role.id}`)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {permissionCategories.map((category) => (
                  <>
                    <tr key={category.category} className="bg-surface">
                      <td colSpan={roles.length + 1} className="py-2 px-4 text-sm font-semibold text-foreground">
                        {category.category}
                      </td>
                    </tr>
                    {category.permissions.map((permission) => (
                      <tr key={permission.id} className="border-b border-border">
                        <td className="py-2 px-4 text-sm text-foreground-secondary">{permission.name}</td>
                        {roles.map((role) => (
                          <td key={`${role.id}-${permission.id}`} className="text-center py-2 px-4">
                            {hasPermission(role.permissions, permission.id) ? (
                              <CheckCircle className="h-4 w-4 text-success mx-auto" />
                            ) : (
                              <XCircle className="h-4 w-4 text-foreground-tertiary mx-auto" />
                            )}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
