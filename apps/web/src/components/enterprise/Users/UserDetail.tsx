'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { EnterpriseSidebar } from '../Dashboard/EnterpriseSidebar';
import { Button } from '@/components/ui/button';

export type UserRole = 'admin' | 'member' | 'viewer';

interface ActivityEvent {
  id: string;
  type: 'login' | 'createApiKey' | 'inviteUser' | 'updateSettings';
  icon: string;
  time: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  initial: string;
  role: UserRole;
  isActive: boolean;
}

// Mock data
const MOCK_USER: UserData = {
  id: 'user_001',
  name: '佐藤 太郎',
  email: 'sato@acme.co.jp',
  initial: '佐',
  role: 'admin',
  isActive: true,
};

const MOCK_ACTIVITY: ActivityEvent[] = [
  { id: '1', type: 'login', icon: '🔐', time: '2分前' },
  { id: '2', type: 'createApiKey', icon: '🔑', time: '1時間前' },
  { id: '3', type: 'inviteUser', icon: '👤', time: '3時間前' },
  { id: '4', type: 'updateSettings', icon: '⚙️', time: '昨日' },
];

interface UserDetailProps {
  userId: string;
  className?: string;
}

const ROLE_STYLES: Record<UserRole, string> = {
  admin: 'bg-hinomaru/10 text-hinomaru',
  member: 'bg-blue-500/10 text-blue-400',
  viewer: 'bg-gold/10 text-gold',
};

export function UserDetail({ userId, className }: UserDetailProps) {
  const t = useTranslations('enterprise.userDetail');

  const [user, setUser] = useState<UserData>(MOCK_USER);
  const [formData, setFormData] = useState({
    name: MOCK_USER.name,
    email: MOCK_USER.email,
    role: MOCK_USER.role,
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSave = () => {
    // In real implementation, this would save to API
    setUser((prev) => ({
      ...prev,
      name: formData.name,
      email: formData.email,
      role: formData.role as UserRole,
    }));
  };

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
          <div className="flex items-center gap-4">
            <Link
              href="/enterprise/users"
              className="w-9 h-9 flex items-center justify-center bg-background-elevated border border-white/5 rounded-lg text-text-secondary hover:border-hinomaru hover:text-hinomaru transition-colors"
              aria-label={t('backToList')}
            >
              ←
            </Link>
            <h1 className="text-xl font-semibold text-text-primary">{t('pageTitle')}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="secondary"
              size="sm"
              className="bg-red-500/10 border-red-500 text-red-500 hover:bg-red-500/20"
            >
              {t('deactivate')}
            </Button>
            <Button variant="primary" size="sm" onClick={handleSave}>
              {t('saveChanges')}
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <div className="p-8">
          {/* User Header */}
          <section
            className="flex items-center gap-8 mb-8 p-8 bg-background-secondary border border-white/5 rounded-2xl"
            aria-label={t('header.ariaLabel')}
          >
            <div
              className={cn(
                'w-20 h-20 rounded-xl flex items-center justify-center text-3xl font-semibold',
                ROLE_STYLES[user.role]
              )}
              aria-hidden="true"
            >
              {user.initial}
            </div>
            <div>
              <h2 className="text-2xl font-semibold text-text-primary mb-1">{user.name}</h2>
              <p className="text-text-secondary mb-3">{user.email}</p>
              <div className="flex gap-2">
                <span
                  className={cn(
                    'px-2.5 py-1 rounded text-xs font-semibold',
                    ROLE_STYLES[user.role]
                  )}
                  role="status"
                >
                  {t(`profile.roles.${user.role}`)}
                </span>
                <span
                  className={cn(
                    'px-2.5 py-1 rounded text-xs font-semibold',
                    user.isActive ? 'bg-success/10 text-success' : 'bg-red-500/10 text-red-500'
                  )}
                  role="status"
                >
                  {t(`status.${user.isActive ? 'active' : 'inactive'}`)}
                </span>
              </div>
            </div>
          </section>

          {/* Content Grid */}
          <div className="grid grid-cols-2 gap-8">
            {/* Profile Settings Card */}
            <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h3 id="profile-title" className="text-base font-semibold text-text-primary">
                  {t('profile.title')}
                </h3>
              </div>
              <div className="p-6 space-y-6" role="form" aria-labelledby="profile-title">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-text-primary mb-2">
                    {t('profile.name')}
                  </label>
                  <input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-lg text-text-primary text-sm focus:border-hinomaru focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-text-primary mb-2">
                    {t('profile.email')}
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange('email', e.target.value)}
                    className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-lg text-text-primary text-sm focus:border-hinomaru focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label htmlFor="role" className="block text-sm font-medium text-text-primary mb-2">
                    {t('profile.role')}
                  </label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full px-4 py-3 bg-background-primary border border-white/10 rounded-lg text-text-primary text-sm focus:border-hinomaru focus:outline-none transition-colors"
                  >
                    <option value="admin">{t('profile.roles.admin')}</option>
                    <option value="member">{t('profile.roles.member')}</option>
                    <option value="viewer">{t('profile.roles.viewer')}</option>
                  </select>
                </div>
              </div>
            </section>

            {/* Recent Activity Card */}
            <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h3 id="activity-title" className="text-base font-semibold text-text-primary">
                  {t('activity.title')}
                </h3>
              </div>
              <div className="p-6">
                <ul
                  className="space-y-4"
                  aria-labelledby="activity-title"
                  aria-label={t('activity.ariaLabel')}
                >
                  {MOCK_ACTIVITY.map((activity) => (
                    <li key={activity.id} className="flex items-center gap-4">
                      <div
                        className="w-7 h-7 flex items-center justify-center bg-background-primary rounded text-xs"
                        aria-hidden="true"
                      >
                        {activity.icon}
                      </div>
                      <span className="flex-1 text-sm text-text-primary">
                        {t(`activity.events.${activity.type}`)}
                      </span>
                      <span className="text-xs font-mono text-text-tertiary">{activity.time}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
