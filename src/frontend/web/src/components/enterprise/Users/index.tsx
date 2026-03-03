'use client';

import { useState, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { EnterpriseSidebar } from '../Dashboard/EnterpriseSidebar';
import { EnterpriseStatCard } from '../Dashboard/EnterpriseStatCard';
import { UserTable, User } from './UserTable';
import { Button } from '@/components/ui/button';
import { useUsers } from '@/hooks/enterprise';

// Map mock roles to UI roles
function mapRole(role: string): 'admin' | 'member' | 'viewer' {
  if (role === 'owner' || role === 'admin') return 'admin';
  if (role === 'member' || role === 'operator') return 'member';
  return 'viewer';
}

interface UserListProps {
  className?: string;
}

export function UserList({ className }: UserListProps) {
  const t = useTranslations('enterprise.users');

  const [searchQuery, setSearchQuery] = useState('');

  // Use API hook with fallback
  const { data: usersData } = useUsers();
  const users: User[] = usersData?.users?.map(u => ({
    id: u.id,
    name: u.name,
    email: u.email,
    initial: u.name.charAt(0),
    role: mapRole(u.role),
    status: u.status === 'suspended' ? 'active' : u.status === 'pending' ? 'invited' : 'active',
    twoFaEnabled: false,
    lastActive: u.last_login || '不明',
    kycStatus: 'verified' as const,
    amlStatus: 'cleared' as const,
    riskScore: 10,
  })) ?? [];

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    if (!searchQuery) return users;
    const query = searchQuery.toLowerCase();
    return users.filter(
      (user) =>
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
    );
  }, [searchQuery, users]);

  // Calculate stats
  const stats = useMemo(() => {
    const admins = users.filter((u) => u.role === 'admin').length;
    const members = users.filter((u) => u.role === 'member' || u.role === 'viewer').length;
    const pending = users.filter((u) => u.status === 'invited').length;
    return {
      total: users.length,
      admins,
      members,
      pending,
    };
  }, [users]);

  // Current page for pagination (demo)
  const currentPage = 1;
  const totalPages = 1;
  const showingStart = 1;
  const showingEnd = filteredUsers.length;

  return (
    <div className={cn('flex min-h-screen bg-background', className)}>
      <EnterpriseSidebar />

      <main
        className="flex-1 ml-[260px] min-h-screen"
        role="main"
        aria-label={t('ariaLabel')}
      >
        {/* Top Bar */}
        <header
          className="flex items-center justify-between px-8 py-4 bg-background-secondary border-b border-white/5 sticky top-0 z-50"
          role="banner"
        >
          <h1 className="text-xl font-semibold text-text-primary">{t('pageTitle')}</h1>
          <div className="flex items-center gap-3">
            <Link href="/enterprise/users/roles">
              <Button variant="secondary" size="sm">
                <span aria-hidden="true">🛡️</span> {t('manageRoles')}
              </Button>
            </Link>
            <Link href="/enterprise/users/invite">
              <Button variant="secondary" size="sm">
                <span aria-hidden="true">✉️</span> {t('invite')}
              </Button>
            </Link>
            <Link href="/enterprise/users/new">
              <Button variant="primary" size="sm">
                + {t('addUser')}
              </Button>
            </Link>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {/* Stats Row */}
          <section
            className="grid grid-cols-4 gap-4 mb-8"
            aria-label={t('stats.ariaLabel')}
          >
            <EnterpriseStatCard
              label={t('stats.totalUsers.label')}
              value={stats.total}
              tooltip={t('stats.totalUsers.tooltip')}
              icon="users"
            />
            <EnterpriseStatCard
              label={t('stats.admins.label')}
              value={stats.admins}
              tooltip={t('stats.admins.tooltip')}
              icon="shield"
            />
            <EnterpriseStatCard
              label={t('stats.members.label')}
              value={stats.members}
              tooltip={t('stats.members.tooltip')}
              icon="userCheck"
            />
            <EnterpriseStatCard
              label={t('stats.pendingInvites.label')}
              value={stats.pending}
              tooltip={t('stats.pendingInvites.tooltip')}
              icon="mail"
            />
          </section>

          {/* Users Table */}
          <UserTable
            users={filteredUsers}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
          />

          {/* Pagination */}
          <nav
            className="flex items-center justify-between px-6 py-4 bg-background-secondary border border-white/5 border-t-0 rounded-b-2xl"
            aria-label={t('pagination.ariaLabel')}
          >
            <span className="text-sm text-text-tertiary">
              {t('pagination.showing', {
                start: showingStart,
                end: showingEnd,
                total: filteredUsers.length,
              })}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={currentPage === 1}
                className="px-4 py-2 bg-background-primary border border-white/10 rounded-lg text-sm text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed hover:border-hinomaru hover:text-hinomaru transition-colors"
                aria-label={t('pagination.previous')}
              >
                ← {t('pagination.previous')}
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  type="button"
                  className={cn(
                    'px-4 py-2 rounded-lg text-sm transition-colors',
                    page === currentPage
                      ? 'bg-hinomaru text-white'
                      : 'bg-background-primary border border-white/10 text-text-secondary hover:border-hinomaru hover:text-hinomaru'
                  )}
                  aria-label={t('pagination.page', { page })}
                  aria-current={page === currentPage ? 'page' : undefined}
                >
                  {page}
                </button>
              ))}
              <button
                type="button"
                disabled={currentPage === totalPages}
                className="px-4 py-2 bg-background-primary border border-white/10 rounded-lg text-sm text-text-secondary disabled:opacity-50 disabled:cursor-not-allowed hover:border-hinomaru hover:text-hinomaru transition-colors"
                aria-label={t('pagination.next')}
              >
                {t('pagination.next')} →
              </button>
            </div>
          </nav>
        </div>
      </main>
    </div>
  );
}
