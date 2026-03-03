'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  FolderKanban,
  ChevronRight,
  Calendar,
  CheckCircle,
  Clock,
  Users,
  Target,
  FileText,
  MessageSquare,
  Edit,
  Plus,
  Circle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { AdminSidebarV2 } from '../AdminSidebarV2';

interface LicenseProjectDetailProps {
  projectId: string;
}

// Mock data
const SAMPLE_PROJECT = {
  id: 'proj-001',
  name: 'GFC初期導入プロジェクト',
  companyId: 'company-001',
  companyName: 'Global Finance Corp',
  status: 'in_progress',
  phase: 'integration',
  progress: 65,
  startDate: '2025-11-01',
  targetDate: '2026-03-31',
  description: 'Global Finance CorpへのQuantum Shield初期導入プロジェクト。システム統合とセキュリティ監査を含む。',
  teamMembers: [
    { name: '山田太郎', role: 'Project Manager', avatar: 'YT' },
    { name: '佐藤花子', role: 'Technical Lead', avatar: 'SH' },
    { name: '田中一郎', role: 'Engineer', avatar: 'TI' },
    { name: '鈴木次郎', role: 'Engineer', avatar: 'SJ' },
    { name: '高橋三郎', role: 'QA Lead', avatar: 'TS' },
  ],
  milestones: [
    { id: 'm1', name: 'キックオフ', date: '2025-11-01', status: 'completed' },
    { id: 'm2', name: '要件定義完了', date: '2025-11-30', status: 'completed' },
    { id: 'm3', name: '基本設計完了', date: '2025-12-31', status: 'completed' },
    { id: 'm4', name: 'システム統合開始', date: '2026-01-15', status: 'in_progress' },
    { id: 'm5', name: 'テスト完了', date: '2026-02-28', status: 'pending' },
    { id: 'm6', name: '本番リリース', date: '2026-03-31', status: 'pending' },
  ],
  tasks: [
    { id: 't1', name: 'API統合設定', status: 'completed', assignee: '佐藤花子', dueDate: '2026-01-10' },
    { id: 't2', name: 'Prover接続テスト', status: 'completed', assignee: '田中一郎', dueDate: '2026-01-15' },
    { id: 't3', name: 'セキュリティ監査', status: 'in_progress', assignee: '鈴木次郎', dueDate: '2026-01-25' },
    { id: 't4', name: 'パフォーマンステスト', status: 'in_progress', assignee: '高橋三郎', dueDate: '2026-01-30' },
    { id: 't5', name: 'ドキュメント作成', status: 'pending', assignee: '山田太郎', dueDate: '2026-02-15' },
    { id: 't6', name: 'ユーザートレーニング', status: 'pending', assignee: '佐藤花子', dueDate: '2026-02-28' },
  ],
  recentActivity: [
    { type: 'task_completed', description: 'Prover接続テストが完了しました', timestamp: '2時間前', user: '田中一郎' },
    { type: 'comment', description: 'セキュリティ監査の進捗を更新しました', timestamp: '5時間前', user: '鈴木次郎' },
    { type: 'milestone', description: 'システム統合開始マイルストーンを開始しました', timestamp: '1日前', user: '山田太郎' },
    { type: 'task_created', description: 'パフォーマンステストタスクを追加しました', timestamp: '2日前', user: '高橋三郎' },
  ],
};

export function LicenseProjectDetail({ projectId }: LicenseProjectDetailProps) {
  const t = useTranslations('admin.licenseProjectDetail');
  const [activeTab, setActiveTab] = useState<'overview' | 'milestones' | 'tasks' | 'activity'>('overview');

  const tabs = [
    { key: 'overview', label: t('tabs.overview') },
    { key: 'milestones', label: t('tabs.milestones') },
    { key: 'tasks', label: t('tabs.tasks') },
    { key: 'activity', label: t('tabs.activity') },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">{t('status.completed')}</Badge>;
      case 'in_progress':
        return <Badge variant="gold">{t('status.inProgress')}</Badge>;
      case 'pending':
        return <Badge variant="default">{t('status.pending')}</Badge>;
      default:
        return null;
    }
  };

  const getPhaseLabel = (phase: string) => {
    return t(`phases.${phase}`);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'bg-success';
    if (progress >= 50) return 'bg-gold';
    return 'bg-warning';
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
              <Link href="/admin/license/projects" className="hover:text-foreground">
                {t('breadcrumb.projects')}
              </Link>
              <ChevronRight className="h-4 w-4" />
              <span className="text-foreground">{SAMPLE_PROJECT.name}</span>
            </div>
            <div className="mt-4 flex items-start justify-between">
              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gold/10">
                  <FolderKanban className="h-7 w-7 text-gold" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-foreground">{SAMPLE_PROJECT.name}</h1>
                  <div className="mt-1 flex items-center gap-3">
                    <Link
                      href={`/admin/license/companies/${SAMPLE_PROJECT.companyId}`}
                      className="text-sm text-gold hover:underline"
                    >
                      {SAMPLE_PROJECT.companyName}
                    </Link>
                    <Badge variant="gold">{getPhaseLabel(SAMPLE_PROJECT.phase)}</Badge>
                    {getStatusBadge(SAMPLE_PROJECT.status)}
                  </div>
                </div>
              </div>
              <Button variant="outline" leftIcon={<Edit className="h-4 w-4" />}>
                {t('actions.editProject')}
              </Button>
            </div>
          </div>

          {/* Progress Summary */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
                <div>
                  <div className="text-xs text-foreground-tertiary">{t('summary.progress')}</div>
                  <div className="mt-2 flex items-center gap-3">
                    <span className="text-3xl font-bold">{SAMPLE_PROJECT.progress}%</span>
                    <div className="flex-1">
                      <div className="h-3 rounded-full bg-background-secondary">
                        <div
                          className={cn('h-3 rounded-full', getProgressColor(SAMPLE_PROJECT.progress))}
                          style={{ width: `${SAMPLE_PROJECT.progress}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-foreground-tertiary">{t('summary.timeline')}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-foreground-tertiary" />
                    <span className="text-sm">{SAMPLE_PROJECT.startDate} → {SAMPLE_PROJECT.targetDate}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-foreground-tertiary">{t('summary.team')}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <Users className="h-4 w-4 text-foreground-tertiary" />
                    <span className="text-sm">{SAMPLE_PROJECT.teamMembers.length} {t('summary.members')}</span>
                  </div>
                </div>
                <div>
                  <div className="text-xs text-foreground-tertiary">{t('summary.tasks')}</div>
                  <div className="mt-2 flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-success" />
                    <span className="text-sm">
                      {SAMPLE_PROJECT.tasks.filter(t => t.status === 'completed').length} / {SAMPLE_PROJECT.tasks.length}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tabs */}
          <div className="mb-6 flex gap-1 rounded-lg border border-surface-tertiary bg-background-secondary p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn(
                  'rounded-md px-4 py-2 text-sm font-medium transition-all',
                  activeTab === tab.key
                    ? 'bg-gold text-background'
                    : 'text-foreground-secondary hover:text-foreground'
                )}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          {activeTab === 'overview' && (
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('overview.description')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-foreground-secondary">{SAMPLE_PROJECT.description}</p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base">{t('overview.upcomingMilestones')}</CardTitle>
                    <Link href="#" onClick={() => setActiveTab('milestones')} className="text-sm text-gold hover:underline">
                      {t('overview.viewAll')}
                    </Link>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {SAMPLE_PROJECT.milestones.filter(m => m.status !== 'completed').slice(0, 3).map((milestone) => (
                        <div key={milestone.id} className="flex items-center justify-between rounded-lg border border-surface-tertiary p-3">
                          <div className="flex items-center gap-3">
                            <div className={cn(
                              'h-2 w-2 rounded-full',
                              milestone.status === 'in_progress' ? 'bg-gold' : 'bg-foreground-tertiary'
                            )} />
                            <span className="font-medium">{milestone.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-sm text-foreground-tertiary">{milestone.date}</span>
                            {getStatusBadge(milestone.status)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('overview.team')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {SAMPLE_PROJECT.teamMembers.map((member, index) => (
                        <div key={index} className="flex items-center gap-3">
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10 text-xs font-medium text-gold">
                            {member.avatar}
                          </div>
                          <div>
                            <div className="text-sm font-medium">{member.name}</div>
                            <div className="text-xs text-foreground-tertiary">{member.role}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{t('overview.recentActivity')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {SAMPLE_PROJECT.recentActivity.slice(0, 4).map((activity, index) => (
                        <div key={index} className="flex gap-3">
                          <div className="mt-1">
                            <Circle className="h-2 w-2 fill-gold text-gold" />
                          </div>
                          <div>
                            <div className="text-sm">{activity.description}</div>
                            <div className="text-xs text-foreground-tertiary">
                              {activity.user} • {activity.timestamp}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {activeTab === 'milestones' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{t('milestones.title')}</CardTitle>
                <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                  {t('milestones.add')}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {SAMPLE_PROJECT.milestones.map((milestone, index) => (
                    <div key={milestone.id} className="flex items-center gap-4">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          'flex h-8 w-8 items-center justify-center rounded-full',
                          milestone.status === 'completed' ? 'bg-success text-white' :
                          milestone.status === 'in_progress' ? 'bg-gold text-background' :
                          'bg-background-secondary text-foreground-tertiary'
                        )}>
                          {milestone.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <span className="text-xs font-medium">{index + 1}</span>
                          )}
                        </div>
                        {index < SAMPLE_PROJECT.milestones.length - 1 && (
                          <div className={cn(
                            'h-8 w-0.5',
                            milestone.status === 'completed' ? 'bg-success' : 'bg-surface-tertiary'
                          )} />
                        )}
                      </div>
                      <div className="flex-1 rounded-lg border border-surface-tertiary p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-medium">{milestone.name}</div>
                            <div className="text-sm text-foreground-tertiary">{milestone.date}</div>
                          </div>
                          {getStatusBadge(milestone.status)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'tasks' && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base">{t('tasks.title')}</CardTitle>
                <Button size="sm" leftIcon={<Plus className="h-4 w-4" />}>
                  {t('tasks.add')}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-surface-tertiary text-left text-xs text-foreground-tertiary">
                        <th className="pb-3 font-medium">{t('tasks.columns.task')}</th>
                        <th className="pb-3 font-medium">{t('tasks.columns.assignee')}</th>
                        <th className="pb-3 font-medium">{t('tasks.columns.dueDate')}</th>
                        <th className="pb-3 font-medium">{t('tasks.columns.status')}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {SAMPLE_PROJECT.tasks.map((task) => (
                        <tr key={task.id} className="border-b border-surface-tertiary/50">
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                'h-2 w-2 rounded-full',
                                task.status === 'completed' ? 'bg-success' :
                                task.status === 'in_progress' ? 'bg-gold' : 'bg-foreground-tertiary'
                              )} />
                              <span className="font-medium">{task.name}</span>
                            </div>
                          </td>
                          <td className="py-3 text-sm">{task.assignee}</td>
                          <td className="py-3 text-sm text-foreground-secondary">{task.dueDate}</td>
                          <td className="py-3">{getStatusBadge(task.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'activity' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{t('activity.title')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {SAMPLE_PROJECT.recentActivity.map((activity, index) => (
                    <div key={index} className="flex gap-4 rounded-lg border border-surface-tertiary p-4">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gold/10">
                        {activity.type === 'task_completed' && <CheckCircle className="h-4 w-4 text-success" />}
                        {activity.type === 'comment' && <MessageSquare className="h-4 w-4 text-gold" />}
                        {activity.type === 'milestone' && <Target className="h-4 w-4 text-gold" />}
                        {activity.type === 'task_created' && <Plus className="h-4 w-4 text-gold" />}
                      </div>
                      <div className="flex-1">
                        <div className="text-sm">{activity.description}</div>
                        <div className="mt-1 text-xs text-foreground-tertiary">
                          {activity.user} • {activity.timestamp}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}
