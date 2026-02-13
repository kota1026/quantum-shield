'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { Link } from '@/i18n/navigation';
import {
  Building2,
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  Pause,
  Play,
  ChevronDown,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useLicenseesList, useSuspendLicensee, useReactivateLicensee } from '@/hooks/admin/useLicensees';

type LicenseStatus = 'active' | 'suspended' | 'pending' | 'expired';
type LicenseType = 'standard' | 'enterprise';

interface Licensee {
  id: string;
  companyName: string;
  country: string;
  type: LicenseType;
  status: LicenseStatus;
  contractDate: string;
  expiryDate: string;
  proverNodes: number;
  observerNodes: number;
  monthlyFee: number;
  lastSyncDate: string;
  supportTickets: number;
}

function StatusBadge({ status }: { status: LicenseStatus }) {
  const t = useTranslations('admin.licensees');

  const config = {
    active: { color: 'bg-success/10 text-success', icon: CheckCircle2 },
    suspended: { color: 'bg-danger/10 text-danger', icon: Pause },
    pending: { color: 'bg-warning/10 text-warning', icon: Clock },
    expired: { color: 'bg-foreground-tertiary/10 text-foreground-tertiary', icon: XCircle },
  };

  const { color, icon: Icon } = config[status];

  return (
    <Badge className={cn('gap-1', color)}>
      <Icon className="h-3 w-3" />
      {t(`status.${status}`)}
    </Badge>
  );
}

function LicenseTypeBadge({ type }: { type: LicenseType }) {
  const t = useTranslations('admin.licensees');

  return (
    <Badge
      variant={type === 'enterprise' ? 'outline-gold' : 'outline-default'}
    >
      {t(`type.${type}`)}
    </Badge>
  );
}

export function AdminLicensees() {
  const t = useTranslations('admin.licensees');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<LicenseStatus | 'all'>('all');
  const [showSuspendModal, setShowSuspendModal] = useState<string | null>(null);
  const [showReactivateModal, setShowReactivateModal] = useState<string | null>(null);

  // Fetch licensees from API
  const { data: licenseesData, isLoading, error } = useLicenseesList();
  const suspendMutation = useSuspendLicensee();
  const reactivateMutation = useReactivateLicensee();

  const licensees: Licensee[] = licenseesData?.licensees ?? [];

  const filteredLicensees = licensees.filter((licensee) => {
    const matchesSearch =
      searchQuery === '' ||
      licensee.companyName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      licensee.country.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || licensee.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: licensees.length,
    active: licensees.filter((l) => l.status === 'active').length,
    suspended: licensees.filter((l) => l.status === 'suspended').length,
    pending: licensees.filter((l) => l.status === 'pending').length,
    totalRevenue: licensees.filter((l) => l.status === 'active').reduce(
      (sum, l) => sum + l.monthlyFee,
      0
    ),
  };

  const handleSuspend = (licenseeId: string) => {
    setShowSuspendModal(licenseeId);
  };

  const handleReactivate = (licenseeId: string) => {
    setShowReactivateModal(licenseeId);
  };

  const confirmSuspend = async () => {
    if (!showSuspendModal) return;
    try {
      await suspendMutation.mutateAsync(showSuspendModal);
      setShowSuspendModal(null);
    } catch {
      // Error handled by mutation state
    }
  };

  const confirmReactivate = async () => {
    if (!showReactivateModal) return;
    try {
      await reactivateMutation.mutateAsync(showReactivateModal);
      setShowReactivateModal(null);
    } catch {
      // Error handled by mutation state
    }
  };

  const isProcessing = suspendMutation.isPending || reactivateMutation.isPending;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="text-sm text-foreground-tertiary">{t('stats.total')}</div>
          <div className="mt-1 text-2xl font-bold">{stats.total}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-foreground-tertiary">{t('stats.active')}</div>
          <div className="mt-1 text-2xl font-bold text-success">{stats.active}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-foreground-tertiary">{t('stats.suspended')}</div>
          <div className="mt-1 text-2xl font-bold text-danger">{stats.suspended}</div>
        </Card>
        <Card className="p-4">
          <div className="text-sm text-foreground-tertiary">{t('stats.monthlyRevenue')}</div>
          <div className="mt-1 text-2xl font-bold text-gold">
            ${stats.totalRevenue.toLocaleString()}
          </div>
        </Card>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-tertiary" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t('searchPlaceholder')}
              className={cn(
                'w-full rounded-lg border border-border bg-surface py-2 pl-10 pr-4',
                'focus:border-gold focus:ring-1 focus:ring-gold'
              )}
              aria-label={t('searchAriaLabel')}
            />
          </div>
          <div className="flex gap-2">
            {(['all', 'active', 'suspended', 'pending'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={cn(
                  'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  statusFilter === status
                    ? 'bg-gold text-background'
                    : 'bg-surface text-foreground-secondary hover:text-foreground'
                )}
              >
                {t(`filters.${status}`)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Licensees Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-gold" />
            {t('tableTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full" aria-label={t('tableAriaLabel')}>
              <thead>
                <tr className="border-b border-border text-left text-sm text-foreground-tertiary">
                  <th className="pb-3 font-medium">{t('table.company')}</th>
                  <th className="pb-3 font-medium">{t('table.type')}</th>
                  <th className="pb-3 font-medium">{t('table.status')}</th>
                  <th className="pb-3 font-medium">{t('table.nodes')}</th>
                  <th className="pb-3 font-medium">{t('table.monthlyFee')}</th>
                  <th className="pb-3 font-medium">{t('table.expiry')}</th>
                  <th className="pb-3 font-medium">{t('table.tickets')}</th>
                  <th className="pb-3 font-medium">{t('table.actions')}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredLicensees.map((licensee) => (
                  <tr key={licensee.id} className="group hover:bg-surface/50">
                    <td className="py-4">
                      <div>
                        <div className="font-medium">{licensee.companyName}</div>
                        <div className="text-sm text-foreground-tertiary">{licensee.country}</div>
                      </div>
                    </td>
                    <td className="py-4">
                      <LicenseTypeBadge type={licensee.type} />
                    </td>
                    <td className="py-4">
                      <StatusBadge status={licensee.status} />
                    </td>
                    <td className="py-4">
                      <div className="text-sm">
                        <div>{t('table.provers')}: {licensee.proverNodes}</div>
                        <div className="text-foreground-tertiary">
                          {t('table.observers')}: {licensee.observerNodes}
                        </div>
                      </div>
                    </td>
                    <td className="py-4 font-mono">
                      ${licensee.monthlyFee.toLocaleString()}
                    </td>
                    <td className="py-4 text-sm">{licensee.expiryDate}</td>
                    <td className="py-4">
                      {licensee.supportTickets > 0 ? (
                        <Badge variant="warning">
                          {licensee.supportTickets}
                        </Badge>
                      ) : (
                        <span className="text-foreground-tertiary">-</span>
                      )}
                    </td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <Link href={`/admin/licensees/${licensee.id}`}>
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                            <span className="sr-only">{t('actions.view')}</span>
                          </Button>
                        </Link>
                        {licensee.status === 'active' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleSuspend(licensee.id)}
                            className="text-danger hover:bg-danger/10"
                          >
                            <Pause className="h-4 w-4" />
                            <span className="sr-only">{t('actions.suspend')}</span>
                          </Button>
                        ) : licensee.status === 'suspended' ? (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReactivate(licensee.id)}
                            className="text-success hover:bg-success/10"
                          >
                            <Play className="h-4 w-4" />
                            <span className="sr-only">{t('actions.reactivate')}</span>
                          </Button>
                        ) : null}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {filteredLicensees.length === 0 && (
            <div className="py-12 text-center">
              <Building2 className="mx-auto h-12 w-12 text-foreground-tertiary" />
              <h3 className="mt-4 font-medium">{t('empty.title')}</h3>
              <p className="mt-1 text-sm text-foreground-tertiary">{t('empty.description')}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Suspension Confirmation Modal */}
      {showSuspendModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="suspend-modal-title"
        >
          <Card className="w-full max-w-md p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-danger/10 p-3">
                <AlertTriangle className="h-6 w-6 text-danger" />
              </div>
              <div className="flex-1">
                <h2 id="suspend-modal-title" className="font-semibold">
                  {t('suspendModal.title')}
                </h2>
                <p className="mt-2 text-sm text-foreground-secondary">
                  {t('suspendModal.description')}
                </p>
                <div className="mt-4 rounded-lg bg-warning/10 p-3 text-sm text-warning">
                  {t('suspendModal.securityCouncilNote')}
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowSuspendModal(null)}
                disabled={isProcessing}
              >
                {t('suspendModal.cancel')}
              </Button>
              <Button
                variant="primary"
                className="bg-danger hover:bg-danger/90"
                onClick={confirmSuspend}
                isLoading={isProcessing}
              >
                {t('suspendModal.confirm')}
              </Button>
            </div>
          </Card>
        </div>
      )}

      {/* Reactivation Confirmation Modal */}
      {showReactivateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="reactivate-modal-title"
        >
          <Card className="w-full max-w-md p-6">
            <div className="flex items-start gap-4">
              <div className="rounded-full bg-success/10 p-3">
                <CheckCircle2 className="h-6 w-6 text-success" />
              </div>
              <div className="flex-1">
                <h2 id="reactivate-modal-title" className="font-semibold">
                  {t('reactivateModal.title')}
                </h2>
                <p className="mt-2 text-sm text-foreground-secondary">
                  {t('reactivateModal.description')}
                </p>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowReactivateModal(null)}
                disabled={isProcessing}
              >
                {t('reactivateModal.cancel')}
              </Button>
              <Button
                variant="success"
                onClick={confirmReactivate}
                isLoading={isProcessing}
              >
                {t('reactivateModal.confirm')}
              </Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}

export default AdminLicensees;
