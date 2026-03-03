'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { Shield, AlertTriangle, CheckCircle2, Clock, XCircle, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { EnterpriseSidebar } from '../Dashboard/EnterpriseSidebar';
import { Button } from '@/components/ui/button';
import { useUserDetail, useUserActivity } from '@/hooks/enterprise';

export type UserRole = 'admin' | 'member' | 'viewer';
export type KycStatus = 'verified' | 'pending' | 'rejected' | 'not_submitted';
export type AmlStatus = 'cleared' | 'review' | 'flagged' | 'not_checked';

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
  kycStatus?: KycStatus;
  amlStatus?: AmlStatus;
  riskScore?: number;
}

const ACTIVITY_ICONS: Record<string, string> = {
  login: '🔐',
  createApiKey: '🔑',
  inviteUser: '👤',
  updateSettings: '⚙️',
};

const EMPTY_USER: UserData = {
  id: '',
  name: '',
  email: '',
  initial: '',
  role: 'viewer',
  isActive: false,
};

interface UserDetailProps {
  userId: string;
  className?: string;
}

const ROLE_STYLES: Record<UserRole, string> = {
  admin: 'bg-hinomaru/10 text-hinomaru',
  member: 'bg-blue-500/10 text-blue-400',
  viewer: 'bg-gold/10 text-gold',
};

// Helper function to get risk level from score
function getRiskLevel(score: number | undefined): 'low' | 'medium' | 'high' | 'unknown' {
  if (score === undefined) return 'unknown';
  if (score <= 30) return 'low';
  if (score <= 60) return 'medium';
  return 'high';
}

const RISK_STYLES: Record<'low' | 'medium' | 'high' | 'unknown', { bg: string; text: string; bar: string }> = {
  low: { bg: 'bg-success/10', text: 'text-success', bar: 'bg-success' },
  medium: { bg: 'bg-warning/10', text: 'text-warning', bar: 'bg-warning' },
  high: { bg: 'bg-danger/10', text: 'text-danger', bar: 'bg-danger' },
  unknown: { bg: 'bg-background-elevated', text: 'text-text-tertiary', bar: 'bg-text-tertiary' },
};

export function UserDetail({ userId, className }: UserDetailProps) {
  const t = useTranslations('enterprise.userDetail');

  // Use API hooks with fallback
  const { data: userData } = useUserDetail(userId);
  const { data: activityData } = useUserActivity(userId);

  // Map API user to component user data, using fallback values for fields not in API response
  const initialUser: UserData = userData ? {
    id: userData.id,
    name: userData.name,
    email: userData.email,
    initial: userData.name.charAt(0),
    role: (userData.role === 'owner' ? 'admin' : userData.role) as UserRole,
    isActive: userData.status === 'active',
    kycStatus: 'verified' as KycStatus,
    amlStatus: 'cleared' as AmlStatus,
    riskScore: 12,
  } : EMPTY_USER;

  const activityEvents: ActivityEvent[] = activityData?.activities?.map(a => ({
    id: a.id,
    type: a.type as ActivityEvent['type'],
    icon: ACTIVITY_ICONS[a.type] || '📋',
    time: a.time,
  })) ?? [];

  const [user, setUser] = useState<UserData>(initialUser);
  const [formData, setFormData] = useState({
    name: initialUser.name,
    email: initialUser.email,
    role: initialUser.role,
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
              className="w-11 h-11 flex items-center justify-center bg-background-elevated border border-white/5 rounded-lg text-text-secondary hover:border-hinomaru hover:text-hinomaru transition-colors"
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
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
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

            {/* Risk & Compliance Card */}
            <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden">
              <div className="p-6 border-b border-white/5">
                <h3 id="risk-title" className="text-base font-semibold text-text-primary">
                  {t('riskCompliance.title')}
                </h3>
              </div>
              <div className="p-6 space-y-6" aria-labelledby="risk-title">
                {/* Risk Score */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-text-primary">
                      {t('riskCompliance.riskScore.label')}
                    </span>
                    <span
                      className={cn(
                        'px-2.5 py-1 rounded text-xs font-semibold',
                        RISK_STYLES[getRiskLevel(user.riskScore)].bg,
                        RISK_STYLES[getRiskLevel(user.riskScore)].text
                      )}
                      role="status"
                    >
                      {user.riskScore !== undefined
                        ? t(`riskCompliance.riskScore.levels.${getRiskLevel(user.riskScore)}`)
                        : t('riskCompliance.riskScore.levels.unknown')}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-background-elevated rounded-full overflow-hidden">
                      <div
                        className={cn(
                          'h-full rounded-full transition-all',
                          RISK_STYLES[getRiskLevel(user.riskScore)].bar
                        )}
                        style={{ width: user.riskScore !== undefined ? `${user.riskScore}%` : '0%' }}
                        role="progressbar"
                        aria-valuenow={user.riskScore ?? 0}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={t('riskCompliance.riskScore.label')}
                      />
                    </div>
                    <span className="text-sm font-mono text-text-secondary min-w-[3rem] text-right">
                      {user.riskScore !== undefined ? `${user.riskScore}/100` : '-'}
                    </span>
                  </div>
                  <p className="text-xs text-text-tertiary mt-2">
                    {t('riskCompliance.riskScore.description')}
                  </p>
                </div>

                {/* KYC Status */}
                <div className="flex items-center justify-between py-3 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-primary">{t('riskCompliance.kyc.label')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {user.kycStatus === 'verified' && (
                      <>
                        <CheckCircle2 className="h-4 w-4 text-success" aria-hidden="true" />
                        <span className="text-sm text-success">{t('riskCompliance.kyc.verified')}</span>
                      </>
                    )}
                    {user.kycStatus === 'pending' && (
                      <>
                        <Clock className="h-4 w-4 text-warning" aria-hidden="true" />
                        <span className="text-sm text-warning">{t('riskCompliance.kyc.pending')}</span>
                      </>
                    )}
                    {user.kycStatus === 'rejected' && (
                      <>
                        <XCircle className="h-4 w-4 text-danger" aria-hidden="true" />
                        <span className="text-sm text-danger">{t('riskCompliance.kyc.rejected')}</span>
                      </>
                    )}
                    {(user.kycStatus === 'not_submitted' || !user.kycStatus) && (
                      <span className="text-sm text-text-tertiary">{t('riskCompliance.kyc.notSubmitted')}</span>
                    )}
                  </div>
                </div>

                {/* AML Status */}
                <div className="flex items-center justify-between py-3 border-t border-white/5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-text-primary">{t('riskCompliance.aml.label')}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {user.amlStatus === 'cleared' && (
                      <>
                        <Shield className="h-4 w-4 text-success" aria-hidden="true" />
                        <span className="text-sm text-success">{t('riskCompliance.aml.cleared')}</span>
                      </>
                    )}
                    {user.amlStatus === 'review' && (
                      <>
                        <Clock className="h-4 w-4 text-warning" aria-hidden="true" />
                        <span className="text-sm text-warning">{t('riskCompliance.aml.review')}</span>
                      </>
                    )}
                    {user.amlStatus === 'flagged' && (
                      <>
                        <AlertTriangle className="h-4 w-4 text-danger" aria-hidden="true" />
                        <span className="text-sm text-danger">{t('riskCompliance.aml.flagged')}</span>
                      </>
                    )}
                    {(user.amlStatus === 'not_checked' || !user.amlStatus) && (
                      <span className="text-sm text-text-tertiary">{t('riskCompliance.aml.notChecked')}</span>
                    )}
                  </div>
                </div>

                {/* Risk Alert (if high risk) */}
                {getRiskLevel(user.riskScore) === 'high' && (
                  <div className="flex items-start gap-3 p-4 bg-danger/5 border border-danger/20 rounded-lg mt-4">
                    <AlertCircle className="h-5 w-5 text-danger flex-shrink-0 mt-0.5" aria-hidden="true" />
                    <div>
                      <p className="text-sm font-medium text-danger">
                        {t('riskCompliance.highRiskAlert.title')}
                      </p>
                      <p className="text-xs text-text-secondary mt-1">
                        {t('riskCompliance.highRiskAlert.description')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Recent Activity Card */}
            <section className="bg-background-secondary border border-white/5 rounded-2xl overflow-hidden xl:col-span-2">
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
                  {activityEvents.map((activity) => (
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
