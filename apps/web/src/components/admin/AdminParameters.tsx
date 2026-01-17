'use client';

import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';

// Types
type ParamStatus = 'locked' | 'adjustable';

interface Parameter {
  id: string;
  nameKey: string;
  descriptionKey: string;
  value: string;
  unit: string;
  status: ParamStatus;
}

interface ParameterCategory {
  id: string;
  titleKey: string;
  params: Parameter[];
}

// Info banner component
function InfoBanner({ message }: { message: string }) {
  return (
    <div
      className="mb-6 flex items-center gap-3 rounded-lg border border-[#4a90d9]/30 bg-[#4a90d9]/10 px-5 py-4"
      role="alert"
    >
      <span className="text-xl" aria-hidden="true">
        ℹ️
      </span>
      <span className="text-[13px] text-[#4a90d9]">{message}</span>
    </div>
  );
}

// Status badge component
interface StatusBadgeProps {
  status: ParamStatus;
}

function StatusBadge({ status }: StatusBadgeProps) {
  const t = useTranslations('admin.parameters.badge');

  if (status === 'locked') {
    return (
      <span className="ml-2 inline-flex items-center gap-1 rounded bg-hinomaru/10 px-2 py-0.5 text-[10px] font-medium text-hinomaru">
        <span aria-hidden="true">🔒</span>
        {t('locked')}
      </span>
    );
  }

  return (
    <span className="rounded bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">
      {t('adjustable')}
    </span>
  );
}

// Parameter item component
interface ParamItemProps {
  param: Parameter;
  onClick: () => void;
}

function ParamItem({ param, onClick }: ParamItemProps) {
  const t = useTranslations('admin.parameters.params');

  return (
    <div
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
      className="mb-3 cursor-pointer rounded-lg bg-background-secondary p-4 transition-colors last:mb-0 hover:bg-background-tertiary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold focus-visible:ring-offset-2 focus-visible:ring-offset-background"
      tabIndex={0}
      role="button"
      aria-label={`${t(`${param.nameKey}.name`)}, ${param.value} ${param.unit}`}
    >
      <div className="flex items-center justify-between">
        <div>
          <div className="mb-1 flex items-center text-sm font-medium">
            {t(`${param.nameKey}.name`)}
            <StatusBadge status={param.status} />
          </div>
          <div className="text-xs text-foreground-tertiary">{t(`${param.nameKey}.description`)}</div>
        </div>
        <div className="text-right">
          <div className="mb-1 font-mono text-lg font-bold">{param.value}</div>
          <div className="text-[11px] text-foreground-tertiary">{param.unit}</div>
        </div>
      </div>
    </div>
  );
}

// Parameter category card component
interface ParamCategoryCardProps {
  category: ParameterCategory;
  onParamClick: (paramId: string) => void;
  onHistoryClick: () => void;
}

function ParamCategoryCard({ category, onParamClick, onHistoryClick }: ParamCategoryCardProps) {
  const t = useTranslations('admin.parameters');

  return (
    <Card padding="none">
      <CardHeader className="flex flex-row items-center justify-between border-b border-surface-tertiary px-5 py-4">
        <CardTitle className="text-base">{t(`categories.${category.titleKey}.title`)}</CardTitle>
        <button
          type="button"
          onClick={onHistoryClick}
          className="text-xs text-gold transition-colors hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
        >
          {t('historyLink')}
        </button>
      </CardHeader>
      <CardContent className="p-5">
        {category.params.map((param) => (
          <ParamItem key={param.id} param={param} onClick={() => onParamClick(param.id)} />
        ))}
      </CardContent>
    </Card>
  );
}

export function AdminParameters() {
  const t = useTranslations('admin.parameters');
  const tUnits = useTranslations('admin.parameters.units');

  // Mock data - in production would come from API
  const categories: ParameterCategory[] = [
    {
      id: 'timeLock',
      titleKey: 'timeLock',
      params: [
        {
          id: 'minLockPeriod',
          nameKey: 'minLockPeriod',
          descriptionKey: 'minLockPeriod',
          value: '30',
          unit: tUnits('days'),
          status: 'locked',
        },
        {
          id: 'maxLockPeriod',
          nameKey: 'maxLockPeriod',
          descriptionKey: 'maxLockPeriod',
          value: '3,650',
          unit: tUnits('daysYears', { years: '10' }),
          status: 'adjustable',
        },
        {
          id: 'earlyUnlockPenalty',
          nameKey: 'earlyUnlockPenalty',
          descriptionKey: 'earlyUnlockPenalty',
          value: '10%',
          unit: tUnits('ofLocked'),
          status: 'locked',
        },
      ],
    },
    {
      id: 'prover',
      titleKey: 'prover',
      params: [
        {
          id: 'minStake',
          nameKey: 'minStake',
          descriptionKey: 'minStake',
          value: '100,000',
          unit: tUnits('usdc'),
          status: 'adjustable',
        },
        {
          id: 'slaTarget',
          nameKey: 'slaTarget',
          descriptionKey: 'slaTarget',
          value: '99.9%',
          unit: tUnits('uptime'),
          status: 'adjustable',
        },
        {
          id: 'slashingRate',
          nameKey: 'slashingRate',
          descriptionKey: 'slashingRate',
          value: '100%',
          unit: tUnits('ofStake'),
          status: 'locked',
        },
      ],
    },
    {
      id: 'fee',
      titleKey: 'fee',
      params: [
        {
          id: 'lockFee',
          nameKey: 'lockFee',
          descriptionKey: 'lockFee',
          value: '0.1%',
          unit: tUnits('ofAmount'),
          status: 'adjustable',
        },
        {
          id: 'unlockFee',
          nameKey: 'unlockFee',
          descriptionKey: 'unlockFee',
          value: '0.05%',
          unit: tUnits('ofAmount'),
          status: 'adjustable',
        },
        {
          id: 'enterpriseDiscount',
          nameKey: 'enterpriseDiscount',
          descriptionKey: 'enterpriseDiscount',
          value: '20%',
          unit: tUnits('discount'),
          status: 'adjustable',
        },
      ],
    },
    {
      id: 'security',
      titleKey: 'security',
      params: [
        {
          id: 'challengePeriod',
          nameKey: 'challengePeriod',
          descriptionKey: 'challengePeriod',
          value: '24',
          unit: tUnits('hours'),
          status: 'adjustable',
        },
        {
          id: 'multiSigThreshold',
          nameKey: 'multiSigThreshold',
          descriptionKey: 'multiSigThreshold',
          value: '3/5',
          unit: tUnits('signers'),
          status: 'locked',
        },
        {
          id: 'quantumAlgorithm',
          nameKey: 'quantumAlgorithm',
          descriptionKey: 'quantumAlgorithm',
          value: 'Dilithium',
          unit: tUnits('nistApproved'),
          status: 'locked',
        },
      ],
    },
  ];

  const handleParamClick = (paramId: string) => {
    // In production, would open parameter detail modal
    console.log('Parameter clicked:', paramId);
  };

  const handleHistoryClick = () => {
    // In production, would open history modal
    console.log('History clicked');
  };

  const handleRequestChange = () => {
    // In production, would open change request form
    console.log('Request change clicked');
  };

  return (
    <main
      className="min-h-screen bg-background pl-[260px]"
      role="main"
      aria-label={t('ariaLabel')}
    >
      <div className="p-6 lg:p-8">
        {/* Page Header */}
        <div className="mb-6 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{t('title')}</h1>
            <p className="mt-1 text-sm text-foreground-secondary">{t('subtitle')}</p>
          </div>
          <button
            type="button"
            onClick={handleRequestChange}
            className="flex items-center gap-2 rounded-lg border border-surface-tertiary bg-background-secondary px-6 py-3 text-sm text-foreground-secondary transition-colors hover:border-hinomaru hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
          >
            <span aria-hidden="true">📝</span>
            {t('requestChangeButton')}
          </button>
        </div>

        {/* Info Banner */}
        <InfoBanner message={t('infoBanner')} />

        {/* Parameters Grid */}
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
          {categories.map((category) => (
            <ParamCategoryCard
              key={category.id}
              category={category}
              onParamClick={handleParamClick}
              onHistoryClick={handleHistoryClick}
            />
          ))}
        </div>
      </div>
    </main>
  );
}
