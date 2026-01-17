'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { cn } from '@/lib/utils';

export type UserRole = 'admin' | 'member' | 'viewer';
export type UserStatus = 'active' | 'invited';

export interface User {
  id: string;
  name: string;
  email: string;
  initial: string;
  role: UserRole;
  status: UserStatus;
  twoFaEnabled: boolean;
  lastActive: string;
}

interface UserTableProps {
  users: User[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  className?: string;
}

const ROLE_STYLES: Record<UserRole, string> = {
  admin: 'bg-hinomaru/10 text-hinomaru',
  member: 'bg-blue-500/10 text-blue-400',
  viewer: 'bg-gold/10 text-gold',
};

const AVATAR_STYLES: Record<UserRole, string> = {
  admin: 'bg-hinomaru/10 text-hinomaru',
  member: 'bg-blue-500/10 text-blue-400',
  viewer: 'bg-gold/10 text-gold',
};

export function UserTable({ users, searchQuery, onSearchChange, className }: UserTableProps) {
  const t = useTranslations('enterprise.users.table');

  return (
    <div className={cn('bg-background-secondary border border-white/5 rounded-2xl overflow-hidden', className)}>
      <div className="flex justify-between items-center p-6 border-b border-white/5">
        <h2 id="users-table-title" className="text-base font-semibold text-text-primary">
          {t('title')}
        </h2>
        <div className="flex items-center gap-2 px-4 py-2 bg-background-primary border border-white/5 rounded-lg w-60">
          <svg
            className="w-4 h-4 text-text-tertiary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={t('searchPlaceholder')}
            aria-label={t('searchAriaLabel')}
            className="flex-1 bg-transparent border-none outline-none text-text-primary text-sm placeholder:text-text-tertiary"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full" aria-labelledby="users-table-title">
          <thead>
            <tr className="bg-background-primary">
              <th className="text-left p-4 text-xs font-semibold text-text-tertiary uppercase border-b border-white/5">
                {t('columns.user')}
              </th>
              <th className="text-left p-4 text-xs font-semibold text-text-tertiary uppercase border-b border-white/5">
                {t('columns.role')}
              </th>
              <th className="text-left p-4 text-xs font-semibold text-text-tertiary uppercase border-b border-white/5">
                {t('columns.status')}
              </th>
              <th className="text-left p-4 text-xs font-semibold text-text-tertiary uppercase border-b border-white/5">
                {t('columns.twoFa')}
              </th>
              <th className="text-left p-4 text-xs font-semibold text-text-tertiary uppercase border-b border-white/5">
                {t('columns.lastActive')}
              </th>
              <th className="text-left p-4 text-xs font-semibold text-text-tertiary uppercase border-b border-white/5">
                {t('columns.actions')}
              </th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr
                key={user.id}
                className="hover:bg-background-elevated cursor-pointer transition-colors border-b border-white/5 last:border-b-0"
              >
                <td className="p-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={cn(
                        'w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-sm',
                        AVATAR_STYLES[user.role]
                      )}
                      aria-hidden="true"
                    >
                      {user.initial}
                    </div>
                    <div>
                      <div className="font-medium text-text-primary text-sm">{user.name}</div>
                      <div className="text-xs text-text-tertiary">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td className="p-4">
                  <span
                    className={cn(
                      'inline-flex px-2.5 py-1 rounded text-xs font-medium',
                      ROLE_STYLES[user.role]
                    )}
                    role="status"
                  >
                    {t(`roles.${user.role}`)}
                  </span>
                </td>
                <td className="p-4">
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium',
                      user.status === 'active'
                        ? 'bg-success/10 text-success'
                        : 'bg-warning/10 text-warning'
                    )}
                    role="status"
                  >
                    {t(`statuses.${user.status}`)}
                  </span>
                </td>
                <td className="p-4">
                  <span
                    className={cn(
                      'text-sm',
                      user.twoFaEnabled ? 'text-success' : 'text-text-tertiary'
                    )}
                  >
                    {user.twoFaEnabled ? `✓ ${t('twoFa.enabled')}` : `✗ ${t('twoFa.disabled')}`}
                  </span>
                </td>
                <td className="p-4">
                  <span className="font-mono text-xs text-text-tertiary">{user.lastActive}</span>
                </td>
                <td className="p-4">
                  {user.status === 'active' ? (
                    <Link
                      href={`/enterprise/users/${user.id}`}
                      className="inline-flex px-3 py-1 bg-background-elevated border border-white/10 rounded-lg text-xs text-text-secondary hover:border-hinomaru hover:text-hinomaru transition-colors"
                    >
                      {t('edit')}
                    </Link>
                  ) : (
                    <button
                      type="button"
                      className="inline-flex px-3 py-1 bg-background-elevated border border-white/10 rounded-lg text-xs text-text-secondary hover:border-hinomaru hover:text-hinomaru transition-colors"
                    >
                      {t('resend')}
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
