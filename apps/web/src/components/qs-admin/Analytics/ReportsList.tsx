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
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <FileText className="h-12 w-12 text-foreground-tertiary mb-4" />
            <p className="text-foreground-secondary">{t('empty')}</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
