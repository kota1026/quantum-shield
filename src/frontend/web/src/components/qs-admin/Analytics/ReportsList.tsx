'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  FileText,
  ArrowLeft,
  Download,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  Play,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const DEFAULT_REPORTS = [
  { id: 1, name: 'Monthly User Report - January 2024', type: 'users', status: 'completed', generated: '2024-01-27 09:00', size: '2.4 MB' },
  { id: 2, name: 'Weekly Transaction Summary', type: 'transactions', status: 'completed', generated: '2024-01-26 00:00', size: '1.8 MB' },
  { id: 3, name: 'Quarterly Revenue Report Q4 2023', type: 'revenue', status: 'completed', generated: '2024-01-15 10:30', size: '5.2 MB' },
  { id: 4, name: 'Prover Performance Report', type: 'provers', status: 'generating', generated: '-', size: '-' },
  { id: 5, name: 'Daily Transaction Log', type: 'transactions', status: 'scheduled', generated: '2024-01-28 00:00', size: '-' },
];

const STATUS_COLORS = {
  completed: 'bg-success/10 text-success',
  generating: 'bg-warning/10 text-warning',
  scheduled: 'bg-info/10 text-info',
};

const STATUS_ICONS = {
  completed: CheckCircle,
  generating: Clock,
  scheduled: Calendar,
};

export function ReportsList() {
  const t = useTranslations('qsAdmin.analytics');
  const tCommon = useTranslations('qsAdmin.common');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/qs-admin/analytics">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('reportsTitle')}</h1>
            <p className="text-foreground-secondary">{t('reportsSubtitle')}</p>
          </div>
        </div>
        <Button className="bg-gradient-hinomaru">
          <Plus className="h-4 w-4 mr-2" />
          {tCommon('create')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">{t('reportsTitle')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {DEFAULT_REPORTS.map((report) => {
              const StatusIcon = STATUS_ICONS[report.status as keyof typeof STATUS_ICONS];
              return (
                <div
                  key={report.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-border hover:border-hinomaru/50 transition-colors"
                >
                  <div className="flex items-center space-x-4">
                    <div className="h-10 w-10 rounded-lg bg-hinomaru/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-hinomaru" />
                    </div>
                    <div>
                      <h3 className="font-medium">{report.name}</h3>
                      <div className="flex items-center space-x-4 mt-1 text-xs text-foreground-tertiary">
                        <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md', STATUS_COLORS[report.status as keyof typeof STATUS_COLORS])}>
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {report.status}
                        </span>
                        {report.generated !== '-' && (
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {report.generated}
                          </span>
                        )}
                        {report.size !== '-' && (
                          <span>{report.size}</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {report.status === 'completed' && (
                      <Button variant="outline" size="sm">
                        <Download className="h-4 w-4 mr-2" />
                        {tCommon('export')}
                      </Button>
                    )}
                    {report.status === 'generating' && (
                      <Button variant="outline" size="sm" disabled>
                        <Clock className="h-4 w-4 mr-2 animate-spin" />
                        Generating...
                      </Button>
                    )}
                    {report.status === 'scheduled' && (
                      <Button variant="outline" size="sm">
                        <Play className="h-4 w-4 mr-2" />
                        Run Now
                      </Button>
                    )}
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
