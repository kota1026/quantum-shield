'use client';

import { useTranslations } from 'next-intl';
import { Plus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Types
type PermissionLevel = 'superAdmin' | 'admin' | 'operator' | 'viewer';
type StaffStatus = 'active' | 'onboarding' | 'inactive';

interface Staff {
  id: string;
  name: string;
  initial: string;
  email: string;
  role: string;
  permission: PermissionLevel;
  status: StaffStatus;
  lastActive: string;
}

// Avatar component
interface StaffAvatarProps {
  initial: string;
  permission: PermissionLevel;
}

function StaffAvatar({ initial, permission }: StaffAvatarProps) {
  const avatarConfig = {
    superAdmin: 'bg-gold/10 text-gold',
    admin: 'bg-gold/10 text-gold',
    operator: 'bg-[#4a90d9]/10 text-[#4a90d9]',
    viewer: 'bg-background-tertiary text-foreground-secondary',
  };

  return (
    <div
      className={cn(
        'flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium',
        avatarConfig[permission]
      )}
      aria-hidden="true"
    >
      {initial}
    </div>
  );
}

// Permission badge component
interface PermissionBadgeProps {
  permission: PermissionLevel;
}

function PermissionBadge({ permission }: PermissionBadgeProps) {
  const t = useTranslations('admin.staff.permission');

  const badgeConfig = {
    superAdmin: {
      label: t('superAdmin'),
      bgClass: 'bg-gold/10',
      textClass: 'text-gold',
    },
    admin: {
      label: t('admin'),
      bgClass: 'bg-hinomaru/10',
      textClass: 'text-hinomaru',
    },
    operator: {
      label: t('operator'),
      bgClass: 'bg-[#4a90d9]/10',
      textClass: 'text-[#4a90d9]',
    },
    viewer: {
      label: t('viewer'),
      bgClass: 'bg-background-tertiary',
      textClass: 'text-foreground-secondary',
    },
  };

  const config = badgeConfig[permission];

  return (
    <span
      className={cn(
        'inline-flex rounded-md px-2.5 py-1 text-[11px] font-medium',
        config.bgClass,
        config.textClass
      )}
    >
      {config.label}
    </span>
  );
}

// Status badge component
interface StatusBadgeProps {
  status: StaffStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const t = useTranslations('admin.staff.status');

  const statusConfig = {
    active: {
      label: t('active'),
      bgClass: 'bg-success/10',
      textClass: 'text-success',
    },
    onboarding: {
      label: t('onboarding'),
      bgClass: 'bg-warning/10',
      textClass: 'text-warning',
    },
    inactive: {
      label: t('inactive'),
      bgClass: 'bg-background-tertiary',
      textClass: 'text-foreground-secondary',
    },
  };

  const config = statusConfig[status];

  return (
    <span
      className={cn(
        'inline-flex rounded-md px-2.5 py-1 text-[11px] font-medium',
        config.bgClass,
        config.textClass
      )}
    >
      {config.label}
    </span>
  );
}

// Staff row component
interface StaffRowProps {
  staff: Staff;
  onClick: () => void;
}

function StaffRow({ staff, onClick }: StaffRowProps) {
  return (
    <tr
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="cursor-pointer border-b border-surface-tertiary transition-colors hover:bg-background-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold"
      tabIndex={0}
      role="button"
      aria-label={`${staff.name}, ${staff.role}`}
    >
      <td className="px-4 py-4">
        <div className="flex items-center gap-3">
          <StaffAvatar initial={staff.initial} permission={staff.permission} />
          <div>
            <div className="font-medium text-foreground">{staff.name}</div>
            <div className="text-xs text-foreground-tertiary">{staff.email}</div>
          </div>
        </div>
      </td>
      <td className="px-4 py-4 text-sm">{staff.role}</td>
      <td className="px-4 py-4">
        <PermissionBadge permission={staff.permission} />
      </td>
      <td className="px-4 py-4">
        <StatusBadge status={staff.status} />
      </td>
      <td className="px-4 py-4">
        <span className="font-mono text-xs text-foreground-tertiary">
          {staff.lastActive}
        </span>
      </td>
    </tr>
  );
}

export function AdminStaff() {
  const t = useTranslations('admin.staff');

  // Mock data - in production would come from API
  const staffList: Staff[] = [
    {
      id: '1',
      name: '松本さん',
      initial: '松',
      email: 'matsumoto@qs.foundation',
      role: 'Senior Engineer',
      permission: 'superAdmin',
      status: 'active',
      lastActive: 'Now',
    },
    {
      id: '2',
      name: '田村さん',
      initial: '田',
      email: 'tamura@qs.foundation',
      role: 'Lead Engineer',
      permission: 'admin',
      status: 'active',
      lastActive: '5 min ago',
    },
    {
      id: '3',
      name: '加藤さん',
      initial: '加',
      email: 'kato@qs.foundation',
      role: 'Junior Engineer',
      permission: 'operator',
      status: 'active',
      lastActive: '1 hour ago',
    },
    {
      id: '4',
      name: '山田さん',
      initial: '山',
      email: 'yamada@qs.foundation',
      role: 'New Hire',
      permission: 'viewer',
      status: 'onboarding',
      lastActive: 'Today',
    },
  ];

  const handleStaffClick = (staffId: string) => {
    // In production, would open detail modal
    console.log('Staff clicked:', staffId);
  };

  const handleAddStaff = () => {
    // In production, would open add staff modal
    console.log('Add staff clicked');
  };

  return (
    <main
      className="min-h-screen bg-background pl-[260px]"
      role="main"
      aria-label={t('ariaLabel')}
    >
      <div className="p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={handleAddStaff}
            className="inline-flex items-center gap-2 rounded-lg bg-hinomaru px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-hinomaru/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            {t('addButton')}
          </button>
        </div>

        {/* Staff Table */}
        <Card padding="none">
          <CardHeader className="border-b border-surface-tertiary px-5 py-4">
            <CardTitle className="text-base">{t('card.title')}</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full" role="table">
                <thead>
                  <tr className="bg-background-secondary">
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-foreground-tertiary"
                    >
                      {t('table.columns.name')}
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-foreground-tertiary"
                    >
                      {t('table.columns.role')}
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-foreground-tertiary"
                    >
                      {t('table.columns.permission')}
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-foreground-tertiary"
                    >
                      {t('table.columns.status')}
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-[11px] font-medium uppercase tracking-wider text-foreground-tertiary"
                    >
                      {t('table.columns.lastActive')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {staffList.length > 0 ? (
                    staffList.map((staff) => (
                      <StaffRow
                        key={staff.id}
                        staff={staff}
                        onClick={() => handleStaffClick(staff.id)}
                      />
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-12 text-center text-sm text-foreground-secondary"
                      >
                        {t('table.empty')}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
