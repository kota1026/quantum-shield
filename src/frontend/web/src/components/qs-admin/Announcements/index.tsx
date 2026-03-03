'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Megaphone,
  Search,
  Filter,
  Plus,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  Calendar,
  CheckCircle,
  Clock,
  FileText,
  AlertTriangle,
  Info,
  Bell,
} from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const DEFAULT_STATS = {
  totalAnnouncements: 45,
  published: 38,
  scheduled: 4,
  draft: 3,
};

const DEFAULT_ANNOUNCEMENTS = [
  { id: 1, title: 'System Maintenance Scheduled', type: 'maintenance', status: 'scheduled', publishDate: '2024-01-30 02:00', views: 0, excerpt: 'We will be performing scheduled maintenance...' },
  { id: 2, title: 'New Token Support: WBTC', type: 'update', status: 'published', publishDate: '2024-01-25 10:00', views: 3450, excerpt: 'We are excited to announce support for Wrapped Bitcoin...' },
  { id: 3, title: 'Enhanced Security Features', type: 'info', status: 'published', publishDate: '2024-01-20 14:00', views: 5200, excerpt: 'We have implemented additional security measures...' },
  { id: 4, title: 'Prover Rewards Increase', type: 'update', status: 'published', publishDate: '2024-01-18 09:00', views: 2890, excerpt: 'Starting from February 1st, prover rewards will...' },
  { id: 5, title: 'Important Security Notice', type: 'alert', status: 'published', publishDate: '2024-01-15 16:30', views: 8900, excerpt: 'Please be aware of phishing attempts...' },
  { id: 6, title: 'Draft: Q1 Roadmap Update', type: 'info', status: 'draft', publishDate: '-', views: 0, excerpt: 'Our Q1 2024 roadmap includes...' },
];

const STATUS_COLORS = {
  published: 'bg-success/10 text-success',
  scheduled: 'bg-info/10 text-info',
  draft: 'bg-foreground-tertiary/10 text-foreground-tertiary',
};

const STATUS_ICONS = {
  published: CheckCircle,
  scheduled: Clock,
  draft: FileText,
};

const TYPE_COLORS = {
  info: 'bg-info/10 text-info',
  update: 'bg-success/10 text-success',
  maintenance: 'bg-warning/10 text-warning',
  alert: 'bg-danger/10 text-danger',
};

const TYPE_ICONS = {
  info: Info,
  update: Bell,
  maintenance: Clock,
  alert: AlertTriangle,
};

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ElementType;
  trend?: { value: number; isPositive: boolean };
}

function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  const tCommon = useTranslations('qsAdmin.common');
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-foreground-secondary">{title}</p>
            <p className="text-2xl font-bold mt-2">{value}</p>
            {trend && (
              <p className={cn('text-xs mt-2 flex items-center', trend.isPositive ? 'text-success' : 'text-danger')}>
                <TrendingUp className={cn('h-3 w-3 mr-1', !trend.isPositive && 'rotate-180')} />
                {trend.isPositive ? '+' : ''}{trend.value}% {tCommon('trend.fromLastWeek')}
              </p>
            )}
          </div>
          <div className="h-12 w-12 rounded-lg bg-hinomaru/10 flex items-center justify-center">
            <Icon className="h-6 w-6 text-hinomaru" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export function AnnouncementsDashboard() {
  const t = useTranslations('qsAdmin.announcements');
  const tCommon = useTranslations('qsAdmin.common');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const statusFilters = [
    { key: 'all', label: tCommon('all') },
    { key: 'published', label: t('status.published') },
    { key: 'scheduled', label: t('status.scheduled') },
    { key: 'draft', label: t('status.draft') },
  ];

  const filteredAnnouncements = DEFAULT_ANNOUNCEMENTS.filter(ann => {
    if (statusFilter !== 'all' && ann.status !== statusFilter) return false;
    if (searchQuery && !ann.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{t('title')}</h1>
          <p className="text-foreground-secondary">{t('subtitle')}</p>
        </div>
        <Button className="bg-gradient-hinomaru">
          <Plus className="h-4 w-4 mr-2" />
          {t('actions.create')}
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title={t('stats.totalAnnouncements')} value={DEFAULT_STATS.totalAnnouncements} icon={Megaphone} />
        <StatCard title={t('stats.published')} value={DEFAULT_STATS.published} icon={CheckCircle} />
        <StatCard title={t('stats.scheduled')} value={DEFAULT_STATS.scheduled} icon={Calendar} />
        <StatCard title={t('stats.draft')} value={DEFAULT_STATS.draft} icon={FileText} />
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('title')} ({filteredAnnouncements.length})</CardTitle>
          <div className="flex items-center space-x-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-foreground-tertiary" />
              <Input type="text" placeholder={tCommon('search')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10 w-64" />
            </div>
            <Button variant="outline" size="icon"><Filter className="h-4 w-4" /></Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex space-x-2 mb-4 border-b border-border">
            {statusFilters.map((filter) => (
              <button key={filter.key} onClick={() => setStatusFilter(filter.key)} className={cn('px-4 py-3 min-h-[44px] text-sm font-medium border-b-2 -mb-px transition-colors', statusFilter === filter.key ? 'border-hinomaru text-hinomaru' : 'border-transparent text-foreground-secondary hover:text-foreground')}>
                {filter.label}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filteredAnnouncements.map((announcement) => {
              const StatusIcon = STATUS_ICONS[announcement.status as keyof typeof STATUS_ICONS];
              const TypeIcon = TYPE_ICONS[announcement.type as keyof typeof TYPE_ICONS];
              return (
                <div
                  key={announcement.id}
                  className="p-4 rounded-lg border border-border hover:border-hinomaru/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <div className={cn('h-10 w-10 rounded-lg flex items-center justify-center', TYPE_COLORS[announcement.type as keyof typeof TYPE_COLORS])}>
                        <TypeIcon className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">{announcement.title}</h3>
                        <p className="text-sm text-foreground-secondary mt-1 line-clamp-1">{announcement.excerpt}</p>
                        <div className="flex items-center space-x-4 mt-2 text-xs text-foreground-tertiary">
                          <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md', TYPE_COLORS[announcement.type as keyof typeof TYPE_COLORS])}>
                            {t(`types.${announcement.type}`)}
                          </span>
                          <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md', STATUS_COLORS[announcement.status as keyof typeof STATUS_COLORS])}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {t(`status.${announcement.status}`)}
                          </span>
                          {announcement.publishDate !== '-' && (
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {announcement.publishDate}
                            </span>
                          )}
                          {announcement.views > 0 && (
                            <span className="flex items-center">
                              <Eye className="h-3 w-3 mr-1" />
                              {announcement.views.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Button variant="ghost" size="sm">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" className="text-danger hover:text-danger hover:bg-danger/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
