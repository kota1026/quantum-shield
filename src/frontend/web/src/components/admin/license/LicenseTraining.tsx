'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  GraduationCap,
  ChevronRight,
  TrendingUp,
  Search,
  Filter,
  Play,
  Clock,
  Users,
  Award,
  CheckCircle,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminSidebarV2 } from '../AdminSidebarV2';

interface StatCardProps {
  label: string;
  value: string;
  subValue?: string;
  trend?: { value: string; direction: 'up' | 'down' };
  icon: React.ReactNode;
  status?: 'success' | 'warning' | 'danger';
}

function StatCard({ label, value, subValue, trend, icon, status = 'success' }: StatCardProps) {
  return (
    <Card className="p-4">
      <div className="flex items-center gap-3">
        <div className={cn(
          'flex h-10 w-10 items-center justify-center rounded-lg',
          status === 'success' && 'bg-success/10 text-success',
          status === 'warning' && 'bg-warning/10 text-warning',
          status === 'danger' && 'bg-danger/10 text-danger'
        )}>
          {icon}
        </div>
        <div className="flex-1">
          <div className="text-xs text-foreground-tertiary">{label}</div>
          <div className="flex items-center gap-2">
            <div className="text-xl font-bold text-foreground">{value}</div>
            {trend && (
              <span className={cn(
                'flex items-center text-xs',
                trend.direction === 'up' ? 'text-success' : 'text-danger'
              )}>
                <TrendingUp className={cn('h-3 w-3', trend.direction === 'down' && 'rotate-180')} />
                {trend.value}
              </span>
            )}
          </div>
          {subValue && <div className="text-xs text-foreground-secondary">{subValue}</div>}
        </div>
      </div>
    </Card>
  );
}

// Mock data
const DEFAULT_TRAINING_DATA = {
  overview: {
    totalCourses: '24',
    totalCompletions: '456',
    activeEnrollments: '89',
    avgCompletionRate: '78%',
    totalCertifications: '312',
    scheduledSessions: '8',
  },
  courses: [
    {
      id: 'course-001',
      title: 'Quantum Shield 基礎コース',
      level: 'beginner',
      duration: '4h',
      enrollments: 156,
      completions: 142,
      rating: 4.8,
    },
    {
      id: 'course-002',
      title: 'Prover セットアップガイド',
      level: 'intermediate',
      duration: '6h',
      enrollments: 89,
      completions: 72,
      rating: 4.6,
    },
    {
      id: 'course-003',
      title: 'API連携開発者向けコース',
      level: 'advanced',
      duration: '8h',
      enrollments: 67,
      completions: 45,
      rating: 4.9,
    },
    {
      id: 'course-004',
      title: 'セキュリティベストプラクティス',
      level: 'intermediate',
      duration: '3h',
      enrollments: 112,
      completions: 98,
      rating: 4.7,
    },
    {
      id: 'course-005',
      title: '運用管理者向けトレーニング',
      level: 'advanced',
      duration: '10h',
      enrollments: 45,
      completions: 32,
      rating: 4.5,
    },
  ],
  upcomingSessions: [
    { title: 'Quantum Shield 入門ウェビナー', date: '2026-01-22', time: '14:00', attendees: 35 },
    { title: 'Prover 運用トレーニング', date: '2026-01-25', time: '10:00', attendees: 18 },
    { title: 'API開発ハンズオン', date: '2026-01-28', time: '13:00', attendees: 22 },
  ],
  certificationStats: [
    { level: 'ブロンズ', count: 156, color: 'foreground-tertiary' },
    { level: 'シルバー', count: 98, color: 'warning' },
    { level: 'ゴールド', count: 45, color: 'gold' },
    { level: 'プラチナ', count: 13, color: 'success' },
  ],
};

export function LicenseTraining() {
  const t = useTranslations('admin.licenseTraining');
  const [searchQuery, setSearchQuery] = useState('');

  const getLevelBadge = (level: string) => {
    switch (level) {
      case 'beginner':
        return <Badge variant="success">{t('levels.beginner')}</Badge>;
      case 'intermediate':
        return <Badge variant="warning">{t('levels.intermediate')}</Badge>;
      case 'advanced':
        return <Badge variant="danger">{t('levels.advanced')}</Badge>;
      default:
        return null;
    }
  };

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
              <Link href="/admin/license/companies" className="hover:text-foreground">
                License
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{t('breadcrumb')}</span>
            </div>
            <h1 className="mt-2 text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <StatCard
              label={t('stats.totalCourses')}
              value={DEFAULT_TRAINING_DATA.overview.totalCourses}
              icon={<GraduationCap className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.totalCompletions')}
              value={DEFAULT_TRAINING_DATA.overview.totalCompletions}
              trend={{ value: '+15%', direction: 'up' }}
              icon={<CheckCircle className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.activeEnrollments')}
              value={DEFAULT_TRAINING_DATA.overview.activeEnrollments}
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.avgCompletionRate')}
              value={DEFAULT_TRAINING_DATA.overview.avgCompletionRate}
              icon={<TrendingUp className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.totalCertifications')}
              value={DEFAULT_TRAINING_DATA.overview.totalCertifications}
              icon={<Award className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.scheduledSessions')}
              value={DEFAULT_TRAINING_DATA.overview.scheduledSessions}
              icon={<Calendar className="h-5 w-5" />}
              status="warning"
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Course List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{t('courseList.title')}</CardTitle>
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
                      <input
                        type="text"
                        placeholder={t('courseList.searchPlaceholder')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="rounded-lg border border-surface-tertiary bg-background-secondary py-2 pl-10 pr-4 text-sm focus:border-gold focus:outline-none"
                      />
                    </div>
                    <Button variant="outline" size="sm" leftIcon={<Filter className="h-4 w-4" />}>
                      {t('courseList.filter')}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {DEFAULT_TRAINING_DATA.courses.map((course) => (
                      <div
                        key={course.id}
                        className="rounded-lg border border-surface-tertiary p-4"
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold/10">
                              <Play className="h-6 w-6 text-gold" />
                            </div>
                            <div>
                              <div className="font-medium">{course.title}</div>
                              <div className="mt-1 flex items-center gap-3">
                                {getLevelBadge(course.level)}
                                <span className="flex items-center gap-1 text-xs text-foreground-tertiary">
                                  <Clock className="h-3 w-3" />
                                  {course.duration}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="flex items-center gap-1">
                              <span className="text-lg font-bold text-gold">{course.rating}</span>
                              <span className="text-xs text-foreground-tertiary">/5</span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-3 gap-4 border-t border-surface-tertiary pt-4">
                          <div>
                            <div className="text-xs text-foreground-tertiary">{t('courseList.enrollments')}</div>
                            <div className="text-sm font-medium">{course.enrollments}</div>
                          </div>
                          <div>
                            <div className="text-xs text-foreground-tertiary">{t('courseList.completions')}</div>
                            <div className="text-sm font-medium">{course.completions}</div>
                          </div>
                          <div>
                            <div className="text-xs text-foreground-tertiary">{t('courseList.completionRate')}</div>
                            <div className="text-sm font-medium">
                              {Math.round((course.completions / course.enrollments) * 100)}%
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Upcoming Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('upcomingSessions.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {DEFAULT_TRAINING_DATA.upcomingSessions.map((session, index) => (
                      <div
                        key={index}
                        className="rounded-lg border border-surface-tertiary p-3"
                      >
                        <div className="font-medium text-sm">{session.title}</div>
                        <div className="mt-2 flex items-center justify-between text-xs text-foreground-tertiary">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {session.date} {session.time}
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {session.attendees}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4">
                    <Button variant="outline" className="w-full">
                      {t('upcomingSessions.viewAll')}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Certification Stats */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('certifications.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {DEFAULT_TRAINING_DATA.certificationStats.map((cert, index) => (
                      <div
                        key={index}
                        className="flex items-center justify-between"
                      >
                        <div className="flex items-center gap-3">
                          <Award className={cn(
                            'h-5 w-5',
                            cert.color === 'gold' && 'text-gold',
                            cert.color === 'success' && 'text-success',
                            cert.color === 'warning' && 'text-warning',
                            cert.color === 'foreground-tertiary' && 'text-foreground-tertiary'
                          )} />
                          <span className="text-sm">{cert.level}</span>
                        </div>
                        <span className="font-medium">{cert.count}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 border-t border-surface-tertiary pt-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{t('certifications.total')}</span>
                      <span className="text-lg font-bold text-gold">
                        {DEFAULT_TRAINING_DATA.certificationStats.reduce((sum, c) => sum + c.count, 0)}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
