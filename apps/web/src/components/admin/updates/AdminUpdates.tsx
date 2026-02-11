'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Download,
  Upload,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Building2,
  Plus,
  Send,
  FileCode,
  Calendar,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

type UpdateStatus = 'latest' | 'pending' | 'outdated' | 'critical';
type ReleaseType = 'major' | 'minor' | 'patch' | 'security';

interface Update {
  version: string;
  type: ReleaseType;
  releaseDate: string;
  changelog: string[];
  criticalFixes?: boolean;
}

interface LicenseeUpdate {
  licenseeId: string;
  licensee: string;
  currentVersion: string;
  targetVersion: string;
  status: UpdateStatus;
  lastUpdated: string;
  scheduledDate?: string;
}

// Demo data
const RELEASES: Update[] = [
  {
    version: 'v2.4.2',
    type: 'patch',
    releaseDate: '2026-01-25',
    changelog: [
      'Fixed prover node sync issue',
      'Improved observer performance',
      'Security patch for signature verification',
    ],
    criticalFixes: true,
  },
  {
    version: 'v2.4.1',
    type: 'minor',
    releaseDate: '2026-01-20',
    changelog: [
      'New audit report format',
      'Enhanced logging capabilities',
      'UI improvements for admin panel',
    ],
  },
  {
    version: 'v2.4.0',
    type: 'major',
    releaseDate: '2026-01-01',
    changelog: [
      'New quantum-resistant algorithm support',
      'Multi-chain compatibility',
      'Performance optimizations',
    ],
  },
];

const LICENSEE_UPDATES: LicenseeUpdate[] = [
  {
    licenseeId: 'lic-001',
    licensee: 'Tokyo Financial Group',
    currentVersion: 'v2.4.1',
    targetVersion: 'v2.4.2',
    status: 'pending',
    lastUpdated: '2026-01-20',
    scheduledDate: '2026-01-26',
  },
  {
    licenseeId: 'lic-002',
    licensee: 'Singapore Quantum Labs',
    currentVersion: 'v2.4.2',
    targetVersion: 'v2.4.2',
    status: 'latest',
    lastUpdated: '2026-01-25',
  },
  {
    licenseeId: 'lic-003',
    licensee: 'EU Crypto Holdings',
    currentVersion: 'v2.3.0',
    targetVersion: 'v2.4.2',
    status: 'critical',
    lastUpdated: '2025-12-01',
  },
  {
    licenseeId: 'lic-004',
    licensee: 'Swiss Digital Assets',
    currentVersion: 'v2.4.0',
    targetVersion: 'v2.4.2',
    status: 'outdated',
    lastUpdated: '2026-01-01',
  },
];

function StatusBadge({ status }: { status: UpdateStatus }) {
  const t = useTranslations('admin.updates');

  const config = {
    latest: { color: 'bg-success/10 text-success', icon: CheckCircle2 },
    pending: { color: 'bg-warning/10 text-warning', icon: Clock },
    outdated: { color: 'bg-foreground-tertiary/10 text-foreground-tertiary', icon: Download },
    critical: { color: 'bg-danger/10 text-danger', icon: AlertTriangle },
  };

  const { color, icon: Icon } = config[status];

  return (
    <Badge className={cn('gap-1', color)}>
      <Icon className="h-3 w-3" />
      {t(`status.${status}`)}
    </Badge>
  );
}

function ReleaseTypeBadge({ type }: { type: ReleaseType }) {
  const t = useTranslations('admin.updates');

  const variants: Record<ReleaseType, 'outline-gold' | 'info' | 'default' | 'danger'> = {
    major: 'outline-gold',
    minor: 'info',
    patch: 'default',
    security: 'danger',
  };

  return (
    <Badge variant={variants[type]}>
      {t(`releaseType.${type}`)}
    </Badge>
  );
}

export function AdminUpdates() {
  const t = useTranslations('admin.updates');
  const [selectedTab, setSelectedTab] = useState<'releases' | 'licensees'>('releases');

  const stats = {
    latestVersion: RELEASES[0].version,
    licenseeLatest: LICENSEE_UPDATES.filter((l) => l.status === 'latest').length,
    licenseeOutdated: LICENSEE_UPDATES.filter((l) => l.status === 'outdated' || l.status === 'critical').length,
    pendingUpdates: LICENSEE_UPDATES.filter((l) => l.status === 'pending').length,
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm text-foreground-tertiary">{t('stats.latestVersion')}</div>
          <div className="mt-1 text-2xl font-bold font-mono">{stats.latestVersion}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-foreground-tertiary">{t('stats.upToDate')}</div>
          <div className="mt-1 text-2xl font-bold text-success">{stats.licenseeLatest}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-foreground-tertiary">{t('stats.outdated')}</div>
          <div className="mt-1 text-2xl font-bold text-danger">{stats.licenseeOutdated}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-foreground-tertiary">{t('stats.pending')}</div>
          <div className="mt-1 text-2xl font-bold text-warning">{stats.pendingUpdates}</div>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-border">
        <button
          onClick={() => setSelectedTab('releases')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-[2px] transition-colors',
            selectedTab === 'releases'
              ? 'border-gold text-gold'
              : 'border-transparent text-foreground-secondary hover:text-foreground'
          )}
        >
          <FileCode className="h-4 w-4" />
          {t('tabs.releases')}
        </button>
        <button
          onClick={() => setSelectedTab('licensees')}
          className={cn(
            'flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-[2px] transition-colors',
            selectedTab === 'licensees'
              ? 'border-gold text-gold'
              : 'border-transparent text-foreground-secondary hover:text-foreground'
          )}
        >
          <Building2 className="h-4 w-4" />
          {t('tabs.licensees')}
        </button>
      </div>

      {selectedTab === 'releases' && (
        <div className="space-y-6">
          {/* New Release Button */}
          <div className="flex justify-end">
            <Button variant="primary">
              <Plus className="mr-2 h-4 w-4" />
              {t('newRelease')}
            </Button>
          </div>

          {/* Releases List */}
          {RELEASES.map((release, index) => (
            <Card key={release.version}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-gold/10 p-3">
                      <FileCode className="h-6 w-6 text-gold" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="font-mono">{release.version}</CardTitle>
                        <ReleaseTypeBadge type={release.type} />
                        {release.criticalFixes && (
                          <Badge className="bg-danger/10 text-danger gap-1">
                            <AlertTriangle className="h-3 w-3" />
                            {t('criticalFixes')}
                          </Badge>
                        )}
                        {index === 0 && (
                          <Badge className="bg-success/10 text-success">
                            {t('latest')}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-sm text-foreground-tertiary">
                        <Calendar className="h-4 w-4" />
                        {release.releaseDate}
                      </div>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    <Send className="mr-2 h-4 w-4" />
                    {t('pushUpdate')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <h4 className="text-sm font-medium mb-2">{t('changelog')}</h4>
                <ul className="space-y-1">
                  {release.changelog.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-foreground-secondary">
                      <span className="text-gold">•</span>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedTab === 'licensees' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-gold" />
              {t('licenseeVersions')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full" aria-label={t('tableAriaLabel')}>
                <thead>
                  <tr className="border-b border-border text-left text-sm text-foreground-tertiary">
                    <th className="pb-3 font-medium">{t('table.licensee')}</th>
                    <th className="pb-3 font-medium">{t('table.currentVersion')}</th>
                    <th className="pb-3 font-medium">{t('table.targetVersion')}</th>
                    <th className="pb-3 font-medium">{t('table.status')}</th>
                    <th className="pb-3 font-medium">{t('table.lastUpdated')}</th>
                    <th className="pb-3 font-medium">{t('table.scheduled')}</th>
                    <th className="pb-3 font-medium">{t('table.actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {LICENSEE_UPDATES.map((licensee) => (
                    <tr key={licensee.licenseeId} className="group hover:bg-surface/50">
                      <td className="py-4">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-foreground-tertiary" />
                          <span className="font-medium">{licensee.licensee}</span>
                        </div>
                      </td>
                      <td className="py-4 font-mono text-sm">{licensee.currentVersion}</td>
                      <td className="py-4 font-mono text-sm">{licensee.targetVersion}</td>
                      <td className="py-4">
                        <StatusBadge status={licensee.status} />
                      </td>
                      <td className="py-4 text-sm text-foreground-tertiary">
                        {licensee.lastUpdated}
                      </td>
                      <td className="py-4 text-sm">
                        {licensee.scheduledDate || '-'}
                      </td>
                      <td className="py-4">
                        {licensee.status !== 'latest' && (
                          <Button variant="outline" size="sm">
                            <Upload className="mr-2 h-4 w-4" />
                            {t('scheduleUpdate')}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AdminUpdates;
