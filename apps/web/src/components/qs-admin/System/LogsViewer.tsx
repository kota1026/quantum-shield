'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  FileText,
  ArrowLeft,
  Search,
  Filter,
  Download,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const LEVEL_COLORS = {
  critical: 'text-danger',
  warning: 'text-warning',
  info: 'text-info',
  debug: 'text-foreground-tertiary',
};

export function LogsViewer() {
  const t = useTranslations('qsAdmin.system');
  const tCommon = useTranslations('qsAdmin.common');
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState('all');

  const levelFilters = [
    { key: 'all', label: tCommon('all') },
    { key: 'critical', label: t('levels.critical') },
    { key: 'warning', label: t('levels.warning') },
    { key: 'info', label: t('levels.info') },
    { key: 'debug', label: t('levels.debug') },
  ];

  const logs: { id: number; timestamp: string; level: string; source: string; message: string }[] = [];

  const filteredLogs = logs.filter(log => {
    if (levelFilter !== 'all' && log.level !== levelFilter) return false;
    if (searchQuery && !log.message.toLowerCase().includes(searchQuery.toLowerCase()) &&
        !log.source.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

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
            <h1 className="text-2xl font-bold text-foreground">{t('logsTitle')}</h1>
            <p className="text-foreground-secondary">{t('logsSubtitle')}</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            {tCommon('refresh')}
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            {tCommon('export')}
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">{t('logsTitle')}</CardTitle>
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
            {levelFilters.map((filter) => (
              <button key={filter.key} onClick={() => setLevelFilter(filter.key)} className={cn('px-4 py-3 min-h-[44px] text-sm font-medium border-b-2 -mb-px transition-colors', levelFilter === filter.key ? 'border-hinomaru text-hinomaru' : 'border-transparent text-foreground-secondary hover:text-foreground')}>
                {filter.label}
              </button>
            ))}
          </div>

          <div className="bg-background-dark rounded-lg p-4 font-mono text-sm overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-foreground-tertiary text-xs">
                  <th className="text-left py-2 px-2 w-40">{t('table.timestamp')}</th>
                  <th className="text-left py-2 px-2 w-20">{t('table.level')}</th>
                  <th className="text-left py-2 px-2 w-24">{t('table.source')}</th>
                  <th className="text-left py-2 px-2">{t('table.message')}</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-surface/50">
                    <td className="py-1 px-2 text-foreground-tertiary">{log.timestamp}</td>
                    <td className={cn('py-1 px-2 uppercase text-xs font-bold', LEVEL_COLORS[log.level as keyof typeof LEVEL_COLORS])}>
                      {log.level}
                    </td>
                    <td className="py-1 px-2 text-foreground-secondary">[{log.source}]</td>
                    <td className="py-1 px-2 text-foreground">{log.message}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
