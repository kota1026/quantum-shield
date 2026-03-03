'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  ArrowLeft,
  Building2,
  Server,
  Eye,
  FileText,
  MessageSquare,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Pause,
  Play,
  ExternalLink,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { LoadingState, CardSkeleton } from '@/components/ui/loading-state';
import { ErrorState } from '@/components/ui/error-state';
import { useLicenseeDetail } from '@/hooks/admin/useLicensees';

interface LicenseeDetailProps {
  licenseeId: string;
}

type Tab = 'overview' | 'nodes' | 'compliance' | 'activity';

export function AdminLicenseeDetail({ licenseeId }: LicenseeDetailProps) {
  const t = useTranslations('admin.licenseeDetail');
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const {
    data: licensee,
    isLoading,
    error,
    refetch,
  } = useLicenseeDetail(licenseeId);

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: t('tabs.overview'), icon: Building2 },
    { id: 'nodes', label: t('tabs.nodes'), icon: Server },
    { id: 'compliance', label: t('tabs.compliance'), icon: FileText },
    { id: 'activity', label: t('tabs.activity'), icon: Clock },
  ];

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardSkeleton rows={4} />
        <CardSkeleton rows={6} />
      </div>
    );
  }

  if (error) {
    return (
      <ErrorState
        title={t('errorLoading')}
        description={error.message}
        onRetry={() => refetch()}
      />
    );
  }

  if (!licensee) {
    return (
      <div className="py-12 text-center">
        <Building2 className="mx-auto h-12 w-12 text-foreground-tertiary" />
        <h3 className="mt-4 font-medium">{t('notFound')}</h3>
        <p className="mt-1 text-sm text-foreground-tertiary">{t('notFoundDescription')}</p>
        <Link href="/admin/licensees" className="mt-4 inline-block">
          <Button variant="outline" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t('backToLicensees')}
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/admin/licensees"
            className="flex items-center gap-2 text-sm text-foreground-secondary hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            {t('backToLicensees')}
          </Link>
        </div>
        <div className="flex items-center gap-2">
          <Link href={`/admin/licensees/${licenseeId}/support`}>
            <Button variant="outline" size="sm">
              <MessageSquare className="mr-2 h-4 w-4" />
              {t('supportButton')}
            </Button>
          </Link>
          {licensee.status === 'active' ? (
            <Button variant="outline" size="sm" className="text-danger border-danger">
              <Pause className="mr-2 h-4 w-4" />
              {t('suspendButton')}
            </Button>
          ) : (
            <Button variant="outline" size="sm" className="text-success border-success">
              <Play className="mr-2 h-4 w-4" />
              {t('reactivateButton')}
            </Button>
          )}
        </div>
      </div>

      {/* Company Header */}
      <Card className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-xl bg-gold/10 p-4">
              <Building2 className="h-8 w-8 text-gold" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">{licensee.companyName}</h1>
              <div className="mt-1 flex items-center gap-3">
                <span className="text-foreground-secondary">{licensee.country}</span>
                <Badge className={cn(
                  licensee.type === 'enterprise'
                    ? 'border-gold text-gold bg-gold/10'
                    : 'border-border'
                )}>
                  {t(`type.${licensee.type}`)}
                </Badge>
                <Badge className={cn(
                  'gap-1',
                  licensee.status === 'active'
                    ? 'bg-success/10 text-success'
                    : 'bg-danger/10 text-danger'
                )}>
                  {licensee.status === 'active' ? (
                    <CheckCircle2 className="h-3 w-3" />
                  ) : (
                    <Pause className="h-3 w-3" />
                  )}
                  {t(`status.${licensee.status}`)}
                </Badge>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-foreground-tertiary">{t('monthlyFee')}</div>
            <div className="text-2xl font-bold text-gold">
              ${licensee.monthlyFee.toLocaleString()}
            </div>
          </div>
        </div>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border" role="tablist">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors',
              'border-b-2 -mb-[2px]',
              activeTab === tab.id
                ? 'border-gold text-gold'
                : 'border-transparent text-foreground-secondary hover:text-foreground'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <div className="grid gap-6 lg:grid-cols-2">
          {/* Contract Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('contract.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-foreground-tertiary">{t('contract.startDate')}</span>
                <span>{licensee.contractDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-tertiary">{t('contract.expiryDate')}</span>
                <span>{licensee.expiryDate}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-tertiary">{t('contract.proverNodes')}</span>
                <span>{licensee.proverNodes}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-tertiary">{t('contract.observerNodes')}</span>
                <span>{licensee.observerNodes}</span>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t('contact.title')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between">
                <span className="text-foreground-tertiary">{t('contact.name')}</span>
                <span>{licensee.contact.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-tertiary">{t('contact.email')}</span>
                <a href={`mailto:${licensee.contact.email}`} className="text-gold hover:underline">
                  {licensee.contact.email}
                </a>
              </div>
              <div className="flex justify-between">
                <span className="text-foreground-tertiary">{t('contact.phone')}</span>
                <span>{licensee.contact.phone}</span>
              </div>
            </CardContent>
          </Card>

          {/* Technical Info */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-base">{t('technical.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-surface p-4">
                  <div className="text-sm text-foreground-tertiary">{t('technical.explorer')}</div>
                  <a
                    href={licensee.technical.explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-1 flex items-center gap-1 text-gold hover:underline"
                  >
                    {t('technical.viewExplorer')}
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
                <div className="rounded-lg bg-surface p-4">
                  <div className="text-sm text-foreground-tertiary">{t('technical.version')}</div>
                  <div className="mt-1 font-mono">{licensee.technical.version}</div>
                </div>
                <div className="rounded-lg bg-surface p-4">
                  <div className="text-sm text-foreground-tertiary">{t('technical.lastUpdate')}</div>
                  <div className="mt-1">{licensee.technical.lastUpdate}</div>
                </div>
                <div className="rounded-lg bg-surface p-4">
                  <div className="text-sm text-foreground-tertiary">{t('technical.lastSync')}</div>
                  <div className="mt-1">{new Date(licensee.lastSyncDate).toLocaleString()}</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'nodes' && (
        <div className="space-y-6">
          {/* Prover Nodes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Server className="h-5 w-5 text-gold" />
                {t('nodes.provers')} ({licensee.nodes.provers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {licensee.nodes.provers.length === 0 ? (
                <div className="py-8 text-center text-sm text-foreground-tertiary">
                  {t('nodes.noProvers')}
                </div>
              ) : (
                <div className="space-y-3">
                  {licensee.nodes.provers.map((node) => (
                    <div
                      key={node.id}
                      className="flex items-center justify-between rounded-lg bg-surface p-4"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'h-2 w-2 rounded-full',
                            node.status === 'online' ? 'bg-success' : 'bg-warning'
                          )}
                        />
                        <span className="font-mono text-sm">{node.id}</span>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-foreground-tertiary">{t('nodes.uptime')}: </span>
                          <span className={cn(
                            node.uptime >= 99.5 ? 'text-success' : 'text-warning'
                          )}>
                            {node.uptime}%
                          </span>
                        </div>
                        <div className="text-foreground-tertiary">
                          {new Date(node.lastActive).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Observer Nodes */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Eye className="h-5 w-5 text-gold" />
                {t('nodes.observers')} ({licensee.nodes.observers.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {licensee.nodes.observers.length === 0 ? (
                <div className="py-8 text-center text-sm text-foreground-tertiary">
                  {t('nodes.noObservers')}
                </div>
              ) : (
                <div className="space-y-3">
                  {licensee.nodes.observers.map((node) => (
                    <div
                      key={node.id}
                      className="flex items-center justify-between rounded-lg bg-surface p-4"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={cn(
                            'h-2 w-2 rounded-full',
                            node.status === 'online' ? 'bg-success' : 'bg-danger'
                          )}
                        />
                        <span className="font-mono text-sm">{node.id}</span>
                      </div>
                      <div className="flex items-center gap-6 text-sm">
                        <div>
                          <span className="text-foreground-tertiary">{t('nodes.challenges')}: </span>
                          <span>{node.challenges}</span>
                        </div>
                        <div className="text-foreground-tertiary">
                          {new Date(node.lastActive).toLocaleTimeString()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {activeTab === 'compliance' && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t('compliance.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between rounded-lg bg-surface p-4">
                <div>
                  <div className="font-medium">{t('compliance.explorerPublic')}</div>
                  <div className="text-sm text-foreground-tertiary">
                    {t('compliance.explorerPublicDesc')}
                  </div>
                </div>
                {licensee.compliance.explorerPublic ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-danger" />
                )}
              </div>
              <div className="flex items-center justify-between rounded-lg bg-surface p-4">
                <div>
                  <div className="font-medium">{t('compliance.auditReport')}</div>
                  <div className="text-sm text-foreground-tertiary">
                    {t('compliance.lastAudit')}: {licensee.compliance.lastAuditDate}
                  </div>
                </div>
                {licensee.compliance.auditReportSubmitted ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-danger" />
                )}
              </div>
              <div className="flex items-center justify-between rounded-lg bg-surface p-4">
                <div>
                  <div className="font-medium">{t('compliance.designSystem')}</div>
                  <div className="text-sm text-foreground-tertiary">
                    {t('compliance.designSystemDesc')}
                  </div>
                </div>
                {licensee.compliance.designSystemCompliant ? (
                  <CheckCircle2 className="h-5 w-5 text-success" />
                ) : (
                  <AlertTriangle className="h-5 w-5 text-danger" />
                )}
              </div>
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
            {licensee.recentActivity.length === 0 ? (
              <div className="py-8 text-center text-sm text-foreground-tertiary">
                {t('activity.noActivity')}
              </div>
            ) : (
              <div className="space-y-4">
                {licensee.recentActivity.map((activity, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 border-l-2 border-gold/30 pl-4"
                  >
                    <div className="flex-1">
                      <div className="font-medium">{activity.message}</div>
                      <div className="text-sm text-foreground-tertiary">{activity.date}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default AdminLicenseeDetail;
