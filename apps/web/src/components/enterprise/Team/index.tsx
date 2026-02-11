'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { EnterpriseSidebar } from '../Dashboard/EnterpriseSidebar';
import { Button } from '@/components/ui/button';

interface Permission {
  key: string;
  allowed: boolean;
}

interface Role {
  id: string;
  name: string;
  icon: string;
  count: number;
  colorClass: string;
  permissions: Permission[];
}

export function Team() {
  const t = useTranslations('enterprise.team');

  const roles: Role[] = [
    {
      id: 'admin',
      name: t('roles.admin.name'),
      icon: '👑',
      count: 3,
      colorClass: 'bg-hinomaru/10',
      permissions: [
        { key: 'manageUsers', allowed: true },
        { key: 'createApiKeys', allowed: true },
        { key: 'executeTransactions', allowed: true },
        { key: 'viewAnalytics', allowed: true },
        { key: 'modifySettings', allowed: true },
      ],
    },
    {
      id: 'member',
      name: t('roles.member.name'),
      icon: '⚡',
      count: 8,
      colorClass: 'bg-gold/10',
      permissions: [
        { key: 'executeTransactions', allowed: true },
        { key: 'viewAnalytics', allowed: true },
        { key: 'viewApiKeys', allowed: true },
        { key: 'manageUsers', allowed: false },
        { key: 'modifySettings', allowed: false },
      ],
    },
    {
      id: 'viewer',
      name: t('roles.viewer.name'),
      icon: '👁',
      count: 4,
      colorClass: 'bg-success/10',
      permissions: [
        { key: 'viewTransactions', allowed: true },
        { key: 'viewAnalytics', allowed: true },
        { key: 'executeTransactions', allowed: false },
        { key: 'manageUsers', allowed: false },
        { key: 'modifySettings', allowed: false },
      ],
    },
  ];

  return (
    <div className="flex min-h-screen bg-background-primary">
      <EnterpriseSidebar />

      <main
        className="flex-1 ml-[260px]"
        role="main"
        aria-label={t('ariaLabel')}
      >
        {/* Top Bar */}
        <header className="flex items-center justify-between px-8 py-4 bg-background-secondary border-b border-white/5">
          <h1 className="text-xl font-semibold">{t('pageTitle')}</h1>
          <Link href="/enterprise/team/invite">
            <Button variant="primary">{t('inviteUsers')}</Button>
          </Link>
        </header>

        {/* Page Content */}
        <div className="p-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <article
                key={role.id}
                className="bg-background-secondary border border-white/5 rounded-2xl p-6 hover:border-hinomaru/50 transition-colors cursor-pointer"
                role="button"
                tabIndex={0}
                aria-label={`${role.name} role with ${role.count} users`}
              >
                {/* Role Header */}
                <div className="flex items-center gap-4 mb-6">
                  <div
                    className={`w-12 h-12 ${role.colorClass} rounded-xl flex items-center justify-center text-2xl`}
                  >
                    {role.icon}
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold">{role.name}</h2>
                    <p className="text-sm text-text-tertiary">
                      {t(`roles.${role.id}.count`, { count: role.count })}
                    </p>
                  </div>
                </div>

                {/* Role Description */}
                <p className="text-sm text-text-secondary mb-6 leading-relaxed">
                  {t(`roles.${role.id}.description`)}
                </p>

                {/* Permissions */}
                <div>
                  <h3 className="text-xs text-text-tertiary uppercase tracking-wider mb-3">
                    {t('permissions.label')}
                  </h3>
                  <ul className="space-y-2">
                    {role.permissions.map((permission) => (
                      <li
                        key={permission.key}
                        className={`flex items-center gap-2 text-sm ${
                          permission.allowed
                            ? 'text-text-secondary'
                            : 'text-text-tertiary'
                        }`}
                      >
                        <span
                          className={
                            permission.allowed ? 'text-success' : ''
                          }
                        >
                          {permission.allowed ? '✓' : '✗'}
                        </span>
                        {t(`permissions.${permission.key}`)}
                      </li>
                    ))}
                  </ul>
                </div>
              </article>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
