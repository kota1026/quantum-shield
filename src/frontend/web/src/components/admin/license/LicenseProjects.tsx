'use client';

import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import { useState } from 'react';
import {
  FolderKanban,
  ChevronRight,
  Calendar,
  CheckCircle,
  AlertTriangle,
  TrendingUp,
  Building2,
  Users,
  Search,
  Clock,
  Target,
  ArrowRight,
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
const mockProjects = [
  {
    id: 'proj-001',
    name: 'GFC初期導入プロジェクト',
    companyId: 'company-001',
    companyName: 'Global Finance Corp',
    status: 'in_progress',
    phase: 'integration',
    progress: 65,
    startDate: '2025-11-01',
    targetDate: '2026-03-31',
    teamSize: 5,
    tasks: { total: 24, completed: 16 },
    lastUpdate: '2日前',
  },
  {
    id: 'proj-002',
    name: 'ABGシステム移行',
    companyId: 'company-002',
    companyName: 'Asian Banking Group',
    status: 'in_progress',
    phase: 'testing',
    progress: 80,
    startDate: '2025-10-15',
    targetDate: '2026-02-28',
    teamSize: 4,
    tasks: { total: 32, completed: 26 },
    lastUpdate: '1日前',
  },
  {
    id: 'proj-003',
    name: 'Euro Securities導入',
    companyId: 'company-003',
    companyName: 'Euro Securities Ltd',
    status: 'planning',
    phase: 'kickoff',
    progress: 15,
    startDate: '2026-01-15',
    targetDate: '2026-06-30',
    teamSize: 3,
    tasks: { total: 18, completed: 3 },
    lastUpdate: '3日前',
  },
  {
    id: 'proj-004',
    name: 'Nordic Crypto拡張',
    companyId: 'company-004',
    companyName: 'Nordic Crypto Exchange',
    status: 'at_risk',
    phase: 'integration',
    progress: 45,
    startDate: '2025-12-01',
    targetDate: '2026-02-15',
    teamSize: 4,
    tasks: { total: 28, completed: 12 },
    lastUpdate: '5時間前',
  },
  {
    id: 'proj-005',
    name: 'SA Fintech初期導入',
    companyId: 'company-005',
    companyName: 'South American Fintech',
    status: 'completed',
    phase: 'production',
    progress: 100,
    startDate: '2025-08-01',
    targetDate: '2025-12-31',
    teamSize: 6,
    tasks: { total: 42, completed: 42 },
    lastUpdate: '2週間前',
  },
];

const mockMetrics = {
  activeProjects: 4,
  completedProjects: 1,
  atRiskProjects: 1,
  avgProgress: 61,
  totalTasks: 144,
};

export function LicenseProjects() {
  const t = useTranslations('admin.licenseProjects');
  const [activeTab, setActiveTab] = useState<'all' | 'in_progress' | 'planning' | 'at_risk' | 'completed'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProject, setSelectedProject] = useState<typeof mockProjects[0] | null>(mockProjects[0]);

  const tabs = [
    { key: 'all', label: t('tabs.all'), count: mockProjects.length },
    { key: 'in_progress', label: t('tabs.inProgress'), count: mockProjects.filter(p => p.status === 'in_progress').length },
    { key: 'planning', label: t('tabs.planning'), count: mockProjects.filter(p => p.status === 'planning').length },
    { key: 'at_risk', label: t('tabs.atRisk'), count: mockProjects.filter(p => p.status === 'at_risk').length },
    { key: 'completed', label: t('tabs.completed'), count: mockProjects.filter(p => p.status === 'completed').length },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge variant="success">{t('status.completed')}</Badge>;
      case 'in_progress':
        return <Badge variant="gold">{t('status.inProgress')}</Badge>;
      case 'planning':
        return <Badge variant="default">{t('status.planning')}</Badge>;
      case 'at_risk':
        return <Badge variant="danger">{t('status.atRisk')}</Badge>;
      default:
        return null;
    }
  };

  const getPhaseLabel = (phase: string) => {
    return t(`phases.${phase}`);
  };

  const getProgressColor = (progress: number, status: string) => {
    if (status === 'at_risk') return 'bg-danger';
    if (progress >= 80) return 'bg-success';
    if (progress >= 50) return 'bg-gold';
    return 'bg-warning';
  };

  const filteredProjects = mockProjects.filter((project) => {
    const matchesSearch =
      project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      project.companyName.toLowerCase().includes(searchQuery.toLowerCase());

    if (activeTab === 'all') return matchesSearch;
    return matchesSearch && project.status === activeTab;
  });

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
            <div className="mt-2 flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
                <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
              </div>
              <Button leftIcon={<FolderKanban className="h-4 w-4" />}>
                {t('actions.createProject')}
              </Button>
            </div>
          </div>

          {/* Stats */}
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
            <StatCard
              label={t('stats.activeProjects')}
              value={String(mockMetrics.activeProjects)}
              icon={<FolderKanban className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.completedProjects')}
              value={String(mockMetrics.completedProjects)}
              icon={<CheckCircle className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.atRiskProjects')}
              value={String(mockMetrics.atRiskProjects)}
              icon={<AlertTriangle className="h-5 w-5" />}
              status="danger"
            />
            <StatCard
              label={t('stats.avgProgress')}
              value={`${mockMetrics.avgProgress}%`}
              icon={<Target className="h-5 w-5" />}
            />
            <StatCard
              label={t('stats.totalTasks')}
              value={String(mockMetrics.totalTasks)}
              icon={<Calendar className="h-5 w-5" />}
            />
          </div>

          {/* Tabs */}
          <div className="mb-6 flex gap-1 rounded-lg border border-surface-tertiary bg-background-secondary p-1">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as typeof activeTab)}
                className={cn(
                  'flex items-center gap-2 rounded-md px-4 py-2 text-sm font-medium transition-all',
                  activeTab === tab.key
                    ? 'bg-gold text-background'
                    : 'text-foreground-secondary hover:text-foreground'
                )}
              >
                {tab.label}
                <Badge size="sm" variant={activeTab === tab.key ? 'gold' : 'default'}>
                  {tab.count}
                </Badge>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            {/* Project List */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base">{t('projectList.title')}</CardTitle>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
                    <input
                      type="text"
                      placeholder={t('projectList.searchPlaceholder')}
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="rounded-lg border border-surface-tertiary bg-background-secondary py-2 pl-10 pr-4 text-sm focus:border-gold focus:outline-none"
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {filteredProjects.map((project) => (
                      <div
                        key={project.id}
                        onClick={() => setSelectedProject(project)}
                        className={cn(
                          'cursor-pointer rounded-lg border p-4 transition-all',
                          selectedProject?.id === project.id
                            ? 'border-gold bg-gold/5'
                            : 'border-surface-tertiary hover:border-gold/50',
                          project.status === 'at_risk' && 'border-l-4 border-l-danger'
                        )}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gold/10">
                              <FolderKanban className="h-5 w-5 text-gold" />
                            </div>
                            <div>
                              <div className="font-medium text-foreground">{project.name}</div>
                              <div className="flex items-center gap-2 text-xs text-foreground-tertiary">
                                <Building2 className="h-3 w-3" />
                                {project.companyName}
                              </div>
                            </div>
                          </div>
                          {getStatusBadge(project.status)}
                        </div>

                        <div className="mt-4">
                          <div className="mb-1 flex justify-between text-xs">
                            <span className="text-foreground-tertiary">{t('projectList.progress')}</span>
                            <span>{project.progress}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-background-secondary">
                            <div
                              className={cn('h-2 rounded-full', getProgressColor(project.progress, project.status))}
                              style={{ width: `${project.progress}%` }}
                            />
                          </div>
                        </div>

                        <div className="mt-3 flex items-center gap-4 text-xs text-foreground-tertiary">
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {getPhaseLabel(project.phase)}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {project.teamSize}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {project.lastUpdate}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Project Detail Panel */}
            <div className="lg:col-span-1">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">{t('detail.title')}</CardTitle>
                </CardHeader>
                <CardContent>
                  {selectedProject ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Badge variant="gold">{getPhaseLabel(selectedProject.phase)}</Badge>
                        {getStatusBadge(selectedProject.status)}
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.projectName')}</div>
                        <div className="font-medium text-foreground">{selectedProject.name}</div>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.company')}</div>
                        <Link
                          href={`/admin/license/companies/${selectedProject.companyId}`}
                          className="text-sm text-gold hover:underline"
                        >
                          {selectedProject.companyName}
                        </Link>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.progress')}</div>
                        <div className="flex items-center gap-3">
                          <span className="text-2xl font-bold">{selectedProject.progress}%</span>
                          <div className="flex-1">
                            <div className="h-3 rounded-full bg-background-secondary">
                              <div
                                className={cn('h-3 rounded-full', getProgressColor(selectedProject.progress, selectedProject.status))}
                                style={{ width: `${selectedProject.progress}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.tasks')}</div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-success" />
                          <span className="text-sm">
                            {selectedProject.tasks.completed} / {selectedProject.tasks.total}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.startDate')}</div>
                          <div className="text-sm">{selectedProject.startDate}</div>
                        </div>
                        <div>
                          <div className="text-xs text-foreground-tertiary">{t('detail.targetDate')}</div>
                          <div className="text-sm">{selectedProject.targetDate}</div>
                        </div>
                      </div>

                      <div>
                        <div className="text-xs text-foreground-tertiary">{t('detail.teamSize')}</div>
                        <div className="flex items-center gap-2">
                          <Users className="h-4 w-4 text-gold" />
                          <span className="font-medium">{selectedProject.teamSize} {t('detail.members')}</span>
                        </div>
                      </div>

                      <div className="border-t border-surface-tertiary pt-4">
                        <Link href={`/admin/license/projects/${selectedProject.id}`}>
                          <Button className="w-full" rightIcon={<ArrowRight className="h-4 w-4" />}>
                            {t('detail.actions.viewDetails')}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <div className="flex h-64 items-center justify-center text-center text-foreground-tertiary">
                      <div>
                        <FolderKanban className="mx-auto h-12 w-12" />
                        <p className="mt-2">{t('detail.selectProject')}</p>
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
