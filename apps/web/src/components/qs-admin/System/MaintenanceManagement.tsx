'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  Wrench,
  ArrowLeft,
  Plus,
  Calendar,
  Clock,
  CheckCircle,
  AlertTriangle,
  Play,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const STATUS_COLORS = {
  scheduled: 'bg-info/10 text-info border-info/20',
  inProgress: 'bg-warning/10 text-warning border-warning/20',
  completed: 'bg-success/10 text-success border-success/20',
};

const STATUS_ICONS = {
  scheduled: Calendar,
  inProgress: Clock,
  completed: CheckCircle,
};

export function MaintenanceManagement() {
  const t = useTranslations('qsAdmin.system');
  const tCommon = useTranslations('qsAdmin.common');

  const maintenanceItems: { id: number; title: string; description: string; status: string; scheduledFor: string; duration: string }[] = [];

  const scheduledMaintenance = maintenanceItems.filter(m => m.status === 'scheduled');
  const completedMaintenance = maintenanceItems.filter(m => m.status === 'completed');

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/qs-admin/system">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t('maintenanceTitle')}</h1>
            <p className="text-foreground-secondary">{t('maintenanceSubtitle')}</p>
          </div>
        </div>
        <Button className="bg-gradient-hinomaru">
          <Plus className="h-4 w-4 mr-2" />
          {t('maintenance.schedule')}
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <Calendar className="h-5 w-5 mr-2 text-info" />
            {t('maintenance.schedule')} ({scheduledMaintenance.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {scheduledMaintenance.length === 0 ? (
            <p className="text-center text-foreground-tertiary py-8">No scheduled maintenance</p>
          ) : (
            <div className="space-y-4">
              {scheduledMaintenance.map((maintenance) => {
                const StatusIcon = STATUS_ICONS[maintenance.status as keyof typeof STATUS_ICONS];
                return (
                  <div
                    key={maintenance.id}
                    className={cn('p-4 rounded-lg border', STATUS_COLORS[maintenance.status as keyof typeof STATUS_COLORS])}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <StatusIcon className="h-5 w-5 mt-0.5" />
                        <div>
                          <h3 className="font-medium">{maintenance.title}</h3>
                          <p className="text-sm text-foreground-secondary mt-1">{maintenance.description}</p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-foreground-tertiary">
                            <span className="flex items-center">
                              <Calendar className="h-3 w-3 mr-1" />
                              {maintenance.scheduledFor}
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {maintenance.duration}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Play className="h-4 w-4 mr-1" />
                          Start Now
                        </Button>
                        <Button variant="ghost" size="sm">
                          {tCommon('edit')}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center">
            <CheckCircle className="h-5 w-5 mr-2 text-success" />
            {t('maintenance.history')} ({completedMaintenance.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {completedMaintenance.map((maintenance) => {
              const StatusIcon = STATUS_ICONS[maintenance.status as keyof typeof STATUS_ICONS];
              return (
                <div
                  key={maintenance.id}
                  className={cn('p-4 rounded-lg border', STATUS_COLORS[maintenance.status as keyof typeof STATUS_COLORS])}
                >
                  <div className="flex items-start space-x-3">
                    <StatusIcon className="h-5 w-5 mt-0.5" />
                    <div>
                      <h3 className="font-medium">{maintenance.title}</h3>
                      <p className="text-sm text-foreground-secondary mt-1">{maintenance.description}</p>
                      <div className="flex items-center space-x-4 mt-2 text-xs text-foreground-tertiary">
                        <span className="flex items-center">
                          <Calendar className="h-3 w-3 mr-1" />
                          {maintenance.scheduledFor}
                        </span>
                        <span className="flex items-center">
                          <Clock className="h-3 w-3 mr-1" />
                          {maintenance.duration}
                        </span>
                      </div>
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
